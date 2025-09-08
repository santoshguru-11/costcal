import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface OCICredentials {
  tenancyId: string;
  userId: string;
  fingerprint: string;
  privateKey: string;
  region: string;
}

export interface OCIResource {
  id: string;
  name: string;
  type: string;
  service: string;
  region: string;
  state: string;
  compartmentName: string;
  costDetails?: any;
}

export interface OCIInventory {
  resources: OCIResource[];
  summary: {
    totalResources: number;
    byService: Record<string, number>;
    byRegion: Record<string, number>;
    byState: Record<string, number>;
  };
  metadata: {
    scanTime: string;
    region: string;
    provider: string;
  };
}

export class OCIInventoryService {
  private credentials?: OCICredentials;

  constructor(credentials?: OCICredentials) {
    this.credentials = credentials;
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.credentials) {
      throw new Error('OCI credentials not provided');
    }

    try {
      const result = await this.callPythonScript('validate');
      return result.success === true;
    } catch (error) {
      console.error('OCI credential validation failed:', error);
      return false;
    }
  }

  async discoverResources(): Promise<OCIInventory> {
    if (!this.credentials) {
      throw new Error('OCI credentials not provided');
    }

    try {
      const result = await this.callPythonScript('all');
      return this.convertToUnifiedFormat(result);
    } catch (error) {
      console.error('OCI resource discovery failed:', error);
      throw error;
    }
  }

  private async callPythonScript(operation: string): Promise<any> {
    if (!this.credentials) {
      throw new Error('OCI credentials not provided');
    }

    // Create temporary file for credentials
    const tempFile = path.join('/tmp', `oci_credentials_${Date.now()}.json`);
    
    try {
      // Fix escaped newlines in private key for OCI SDK
      const fixedCredentials = {
        ...this.credentials,
        privateKey: this.credentials.privateKey.replace(/\\n/g, '\n')
      };
      
      // Write credentials to temporary file
      fs.writeFileSync(tempFile, JSON.stringify(fixedCredentials, null, 2));
      
      // Get the path to the Python script
      const scriptPath = path.resolve(process.cwd(), 'server', 'services', 'oci-inventory.py');
      
      // Execute Python script
      const { stdout, stderr } = await execAsync(
        `python3 "${scriptPath}" --credentials "${tempFile}" --operation "${operation}"`
      );
      
      if (stderr) {
        console.error('OCI Python stderr:', stderr);
      }
      
      // Parse the result
      const result = JSON.parse(stdout);
      
      if (operation === 'validate') {
        return { success: true };
      }
      
      return result;
      
    } catch (error) {
      console.error('OCI Python script error:', error);
      throw error;
    } finally {
      // Clean up temporary file
      try {
        fs.unlinkSync(tempFile);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary credentials file:', cleanupError);
      }
    }
  }

  private convertToUnifiedFormat(pythonResult: any): OCIInventory {
    const resources: OCIResource[] = [];
    const region = this.credentials?.region || 'unknown';
    const scanTime = new Date().toISOString();

    // Convert compute instances
    if (pythonResult.compute_instances) {
      pythonResult.compute_instances.forEach((instance: any) => {
        resources.push({
          id: instance.id,
          name: instance.display_name,
          type: instance.shape,
          service: 'OCI Compute',
          region: region,
          state: instance.state,
          compartmentName: instance.compartment,
          costDetails: {
            instanceType: instance.shape,
            vcpus: this.extractVcpusFromShape(instance.shape),
            memory: this.extractMemoryFromShape(instance.shape)
          }
        });
      });
    }

    // Convert block volumes
    if (pythonResult.block_volumes) {
      pythonResult.block_volumes.forEach((volume: any) => {
        resources.push({
          id: volume.id,
          name: volume.display_name,
          type: 'Block Volume',
          service: 'OCI Storage',
          region: region,
          state: volume.state,
          compartmentName: volume.compartment,
          costDetails: {
            size: volume.size_gb,
            storage: volume.size_gb
          }
        });
      });
    }

    // Convert object storage buckets
    if (pythonResult.object_storage_buckets) {
      pythonResult.object_storage_buckets.forEach((bucket: any) => {
        resources.push({
          id: bucket.id,
          name: bucket.display_name,
          type: 'Bucket',
          service: 'OCI Storage',
          region: region,
          state: 'AVAILABLE',
          compartmentName: bucket.compartment,
          costDetails: {
            type: 'object-storage'
          }
        });
      });
    }

    // Convert autonomous databases
    if (pythonResult.autonomous_databases) {
      pythonResult.autonomous_databases.forEach((db: any) => {
        resources.push({
          id: db.id,
          name: db.display_name,
          type: 'Autonomous Database',
          service: 'OCI Database',
          region: region,
          state: db.lifecycle_state,
          compartmentName: db.compartment,
          costDetails: {
            type: 'autonomous-database'
          }
        });
      });
    }

    // Convert load balancers
    if (pythonResult.load_balancers) {
      pythonResult.load_balancers.forEach((lb: any) => {
        resources.push({
          id: lb.id,
          name: lb.display_name,
          type: 'Load Balancer',
          service: 'OCI Network',
          region: region,
          state: lb.lifecycle_state,
          compartmentName: lb.compartment,
          costDetails: {
            type: 'load-balancer',
            shape: lb.shape_name
          }
        });
      });
    }

    // Convert VCNs
    if (pythonResult.vcns) {
      pythonResult.vcns.forEach((vcn: any) => {
        resources.push({
          id: vcn.id,
          name: vcn.display_name,
          type: 'VCN',
          service: 'OCI Network',
          region: region,
          state: vcn.lifecycle_state,
          compartmentName: vcn.compartment,
          costDetails: {
            type: 'vcn',
            cidr: vcn.cidr_block
          }
        });
      });
    }

    // Calculate summary
    const summary = {
      totalResources: resources.length,
      byService: {},
      byRegion: {},
      byState: {}
    };

    resources.forEach(resource => {
      summary.byService[resource.service] = (summary.byService[resource.service] || 0) + 1;
      summary.byRegion[resource.region] = (summary.byRegion[resource.region] || 0) + 1;
      summary.byState[resource.state] = (summary.byState[resource.state] || 0) + 1;
    });

    return {
      resources,
      summary,
      metadata: {
        scanTime,
        region,
        provider: 'oci'
      }
    };
  }

  private extractVcpusFromShape(shape: string): number {
    // Extract vCPUs from OCI shape names like "VM.Standard.E4.Flex"
    const match = shape.match(/\.E(\d+)\./);
    return match ? parseInt(match[1]) : 1;
  }

  private extractMemoryFromShape(shape: string): number {
    // Extract memory from OCI shape names (this is a simplified mapping)
    const match = shape.match(/\.E(\d+)\./);
    if (match) {
      const eValue = parseInt(match[1]);
      return eValue * 8; // Rough estimate: E4 = 32GB, E5 = 40GB, etc.
    }
    return 8; // Default
  }
}

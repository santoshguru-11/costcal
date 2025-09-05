import { OCICredentials, OCIInventory, OCIResource } from './inventory-service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as identity from 'oci-identity';
import * as core from 'oci-core';
import * as database from 'oci-database';
import * as objectstorage from 'oci-objectstorage';
import * as loadbalancer from 'oci-loadbalancer';
import * as networkloadbalancer from 'oci-networkloadbalancer';
import * as resourcesearch from 'oci-resourcesearch';
import { common } from 'oci-sdk';

export class OCIInventoryService {
  private credentials: OCICredentials;
  private provider: common.SimpleAuthenticationDetailsProvider;

  constructor(credentials: OCICredentials) {
    this.credentials = credentials;
    
    // Clean up the private key format
    let cleanPrivateKey = credentials.privateKey;
    if (typeof cleanPrivateKey === 'string') {
      // Remove any extra whitespace and ensure proper line endings
      cleanPrivateKey = cleanPrivateKey
        .replace(/\\n/g, '\n')  // Replace literal \n with actual newlines
        .replace(/\r\n/g, '\n') // Normalize line endings
        .trim();
      
      // Ensure the private key has proper BEGIN/END markers
      if (!cleanPrivateKey.startsWith('-----BEGIN')) {
        cleanPrivateKey = '-----BEGIN PRIVATE KEY-----\n' + cleanPrivateKey;
      }
      if (!cleanPrivateKey.endsWith('-----END PRIVATE KEY-----')) {
        cleanPrivateKey = cleanPrivateKey + '\n-----END PRIVATE KEY-----';
      }
    }
    
    // Convert private key string to Buffer if it's a string
    const privateKeyBuffer = typeof cleanPrivateKey === 'string' 
      ? Buffer.from(cleanPrivateKey, 'utf8')
      : cleanPrivateKey;
    
    // Use SimpleAuthenticationDetailsProvider for OCI SDK 2.100.0
    this.provider = new common.SimpleAuthenticationDetailsProvider(
      credentials.tenancyId,
      credentials.userId,
      credentials.fingerprint,
      privateKeyBuffer,
      undefined, // passphrase (if any)
      credentials.region
    );
  }

  private normalizeRegion(region: string): string {
    // OCI SDK expects region in format like 'us-phoenix-1' but sometimes needs normalization
    const regionMap: Record<string, string> = {
      'us-phoenix-1': 'us-phoenix-1',
      'us-ashburn-1': 'us-ashburn-1',
      'us-sanjose-1': 'us-sanjose-1',
      'eu-frankfurt-1': 'eu-frankfurt-1',
      'uk-london-1': 'uk-london-1',
      'ap-sydney-1': 'ap-sydney-1',
      'ap-mumbai-1': 'ap-mumbai-1',
      'ap-tokyo-1': 'ap-tokyo-1',
      'ca-toronto-1': 'ca-toronto-1',
      'sa-saopaulo-1': 'sa-saopaulo-1'
    };
    
    return regionMap[region] || region;
  }

  async discoverResources(): Promise<OCIInventory> {
    try {
      console.log('Starting OCI resource discovery using Resource Search API...');
      console.log('Tenancy ID:', this.credentials.tenancyId);
      console.log('User ID:', this.credentials.userId);
      console.log('Region:', this.credentials.region);
      
      // Skip basic connectivity test to avoid SDK issues, go straight to OCI CLI
      console.log('Skipping basic connectivity test to avoid SDK issues...');
      
      // Try OCI CLI first, then Resource Search API, then individual service discovery
      let resources: OCIResource[] = [];
      try {
        resources = await this.discoverResourcesViaCLI();
      } catch (cliError: any) {
        console.log('OCI CLI failed, trying Resource Search API...');
        console.log('CLI error:', cliError.message);
        
        try {
          resources = await this.searchAllResources();
        } catch (searchError: any) {
          console.log('Resource Search API failed, falling back to individual service discovery...');
          console.log('Search error:', searchError.message);
          resources = await this.fallbackToIndividualServiceDiscovery();
        }
      }

      console.log('Total resources discovered:', resources.length);

      return {
        resources,
        summary: {
          totalResources: resources.length,
          byService: this.getServiceSummary(resources),
          byRegion: this.getRegionSummary(resources),
          byState: this.getStateSummary(resources)
        },
        metadata: {
          scanTime: new Date().toISOString(),
          region: this.credentials.region,
          provider: 'oci'
        }
      };
    } catch (error) {
      console.error('OCI inventory discovery error:', error);
      throw new Error(`Failed to discover OCI resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testBasicConnectivity(): Promise<void> {
    try {
      console.log('Testing basic connectivity...');
      const identityClient = new identity.IdentityClient({ 
        authenticationDetailsProvider: this.provider
      });
      
      // Try to get user information
      const getUserRequest: identity.requests.GetUserRequest = {
        userId: this.credentials.userId
      };
      
      const userResponse = await identityClient.getUser(getUserRequest);
      console.log('User info retrieved successfully:', {
        name: userResponse.user?.name,
        email: userResponse.user?.email,
        state: userResponse.user?.lifecycleState
      });
    } catch (error) {
      console.error('Basic connectivity test failed:', error);
      throw error;
    }
  }

  private async searchAllResources(): Promise<OCIResource[]> {
    try {
      console.log('Using Resource Search API to discover all resources...');
      
      const resourceSearchClient = new resourcesearch.ResourceSearchClient({
        authenticationDetailsProvider: this.provider
      });

      // Search for all resources using structured search
      const searchRequest: resourcesearch.requests.SearchResourcesRequest = {
        searchDetails: {
          type: 'Structured',
          query: 'query all resources',
          matchingContextType: resourcesearch.models.SearchDetails.MatchingContextType.None
        }
      };

      // Try to set the region in the request
      console.log('Setting region in search request:', this.credentials.region);

      console.log('Executing resource search query...');
      const searchResponse = await resourceSearchClient.searchResources(searchRequest);
      
      console.log(`Found ${searchResponse.resourceSummaryCollection?.items?.length || 0} resources via Resource Search API`);
      
      if (searchResponse.resourceSummaryCollection?.items) {
        console.log('Resource types found:', 
          [...new Set(searchResponse.resourceSummaryCollection.items.map(r => r.resourceType))]);
      }

      // Convert search results to OCIResource format
      const resources: OCIResource[] = [];
      
      if (searchResponse.resourceSummaryCollection?.items) {
        for (const item of searchResponse.resourceSummaryCollection.items) {
          try {
            const resource = await this.convertSearchResultToResource(item);
            if (resource) {
              resources.push(resource);
            }
          } catch (error) {
            console.error(`Error converting resource ${item.identifier}:`, error);
            // Continue with other resources
          }
        }
      }

      console.log(`Successfully converted ${resources.length} resources`);
      return resources;
      
    } catch (error) {
      console.error('Resource Search API error:', error);
      console.error('Error details:', error.message);
      
      // Fallback to individual service discovery if Resource Search fails
      console.log('Falling back to individual service discovery...');
      return await this.fallbackToIndividualServiceDiscovery();
    }
  }

  private async convertSearchResultToResource(item: resourcesearch.models.ResourceSummary): Promise<OCIResource | null> {
    try {
      // Extract compartment name from the resource
      const compartmentName = this.extractCompartmentNameFromPath(item.compartmentId);
      
      // Map resource types to our service categories
      const serviceMapping: { [key: string]: string } = {
        'Instance': 'Compute',
        'Volume': 'Block Storage',
        'Bucket': 'Object Storage',
        'AutonomousDatabase': 'Database',
        'LoadBalancer': 'Load Balancer',
        'Vcn': 'Networking',
        'Subnet': 'Networking',
        'SecurityList': 'Networking',
        'RouteTable': 'Networking',
        'InternetGateway': 'Networking',
        'NatGateway': 'Networking',
        'ServiceGateway': 'Networking',
        'Drg': 'Networking',
        'FileSystem': 'File Storage',
        'MountTarget': 'File Storage',
        'Export': 'File Storage',
        'Function': 'Functions',
        'Application': 'Functions',
        'ContainerRepository': 'Container Registry',
        'Cluster': 'Container Engine',
        'NodePool': 'Container Engine',
        'Stream': 'Streaming',
        'Topic': 'Notifications',
        'Subscription': 'Notifications',
        'Vault': 'Key Management',
        'Key': 'Key Management',
        'Secret': 'Key Management',
        'Bastion': 'Bastion',
        'DataCatalog': 'Data Catalog',
        'DataFlow': 'Data Flow',
        'DataScienceProject': 'Data Science',
        'NotebookSession': 'Data Science',
        'Model': 'Data Science',
        'Job': 'Data Science',
        'ModelDeployment': 'Data Science',
        'Endpoint': 'Data Science'
      };

      const service = serviceMapping[item.resourceType || ''] || 'Other';
      
      // Extract additional details based on resource type
      let costDetails: any = {};
      
      if (item.resourceType === 'Instance') {
        // For compute instances, try to get shape information
        costDetails = {
          instanceType: item.displayName || 'Unknown',
          vcpus: this.extractVCpusFromShape(item.displayName || ''),
          memory: this.extractMemoryFromShape(item.displayName || ''),
          operatingSystem: 'Unknown'
        };
      } else if (item.resourceType === 'Volume') {
        costDetails = {
          volumeType: 'Block Volume',
          size: 'Unknown'
        };
      } else if (item.resourceType === 'Bucket') {
        costDetails = {
          storageClass: 'Standard',
          size: 'Unknown'
        };
      }

      return {
        id: item.identifier || '',
        name: item.displayName || 'Unnamed Resource',
        type: item.resourceType || 'Unknown',
        service: service,
        region: item.region || this.credentials.region,
        state: item.lifecycleState || 'Unknown',
        compartmentName: compartmentName,
        costDetails: costDetails
      };
    } catch (error) {
      console.error(`Error converting search result for ${item.identifier}:`, error);
      return null;
    }
  }

  private extractCompartmentNameFromPath(compartmentId: string): string {
    // Extract compartment name from the compartment ID
    // This is a simplified approach - in practice, you might want to cache compartment names
    if (compartmentId === this.credentials.tenancyId) {
      return 'Root';
    }
    
    // For now, return a generic compartment name
    // In a production system, you'd want to maintain a mapping of compartment IDs to names
    return `Compartment-${compartmentId.slice(-8)}`;
  }

  private async fallbackToIndividualServiceDiscovery(): Promise<OCIResource[]> {
    console.log('Using fallback individual service discovery...');
    
    try {
      // Get all compartments first
      const compartments = await this.getCompartments();
      
      // Discover resources from each compartment
      const resources: OCIResource[] = [];
      for (const compartment of compartments) {
        const compartmentResources = await this.discoverCompartmentResources(compartment);
        resources.push(...compartmentResources);
      }
      
      return resources;
    } catch (error) {
      console.error('Fallback individual service discovery failed:', error);
      console.log('Returning empty resources due to OCI SDK region issues');
      return [];
    }
  }

  private async getCompartments(): Promise<Array<{id: string, name: string}>> {
    try {
      console.log('Getting compartments for tenancy:', this.credentials.tenancyId);
      console.log('Using region:', this.credentials.region);
      const identityClient = new identity.IdentityClient({ 
        authenticationDetailsProvider: this.provider
      });
      const listCompartmentsRequest: identity.requests.ListCompartmentsRequest = {
        compartmentId: this.credentials.tenancyId,
        compartmentIdInSubtree: true,
        accessLevel: identity.models.ListCompartmentsRequest.AccessLevel.Accessible
      };
      
      const response = await identityClient.listCompartments(listCompartmentsRequest);
      console.log('Found compartments:', response.items.length);
      console.log('Compartment details:', response.items.map(c => ({ id: c.id, name: c.name, state: c.lifecycleState })));
      return response.items.map(compartment => ({
        id: compartment.id!,
        name: compartment.name!
      }));
    } catch (error) {
      console.error('Error getting compartments:', error);
      console.error('Error details:', error.message);
      // Return root compartment if we can't list compartments
      return [{ id: this.credentials.tenancyId, name: 'Root' }];
    }
  }

  private async discoverCompartmentResources(compartment: {id: string, name: string}): Promise<OCIResource[]> {
    const resources: OCIResource[] = [];
    
    try {
      // Discover compute instances
      const computeResources = await this.discoverComputeInstances(compartment);
      resources.push(...computeResources);
      
      // Discover block volumes
      const volumeResources = await this.discoverBlockVolumes(compartment);
      resources.push(...volumeResources);
      
      // Discover object storage buckets
      const bucketResources = await this.discoverObjectStorageBuckets(compartment);
      resources.push(...bucketResources);
      
      // Discover autonomous databases
      const dbResources = await this.discoverAutonomousDatabases(compartment);
      resources.push(...dbResources);
      
      // Discover load balancers
      const lbResources = await this.discoverLoadBalancers(compartment);
      resources.push(...lbResources);
      
      // Discover VCNs
      const vcnResources = await this.discoverVCNs(compartment);
      resources.push(...vcnResources);
      
    } catch (error) {
      console.error(`Error discovering resources in compartment ${compartment.name}:`, error);
    }
    
    return resources;
  }

  private async discoverComputeInstances(compartment: {id: string, name: string}): Promise<OCIResource[]> {
    try {
      console.log(`Discovering compute instances in compartment: ${compartment.name} (${compartment.id})`);
      const computeClient = new core.ComputeClient({ 
        authenticationDetailsProvider: this.provider
      });
      const listInstancesRequest: core.requests.ListInstancesRequest = {
        compartmentId: compartment.id
      };
      
      const response = await computeClient.listInstances(listInstancesRequest);
      console.log(`Found ${response.items.length} compute instances in ${compartment.name}`);
      if (response.items.length > 0) {
        console.log('Instance details:', response.items.map(i => ({ 
          id: i.id, 
          name: i.displayName, 
          state: i.lifecycleState,
          shape: i.shape 
        })));
      }
      return response.items.map(instance => ({
        id: instance.id!,
        name: instance.displayName || 'Unnamed Instance',
        type: 'Instance',
        service: 'Compute',
        region: this.credentials.region,
        state: instance.lifecycleState || 'Unknown',
        compartmentName: compartment.name,
        costDetails: {
          instanceType: instance.shape,
          vcpus: this.extractVCpusFromShape(instance.shape),
          memory: this.extractMemoryFromShape(instance.shape),
          operatingSystem: instance.imageId
        }
      }));
    } catch (error) {
      console.error(`Error discovering compute instances in ${compartment.name}:`, error);
      console.error(`Error details:`, error.message);
      return [];
    }
  }

  private async discoverBlockVolumes(compartment: {id: string, name: string}): Promise<OCIResource[]> {
    try {
      const blockstorageClient = new core.BlockstorageClient({ 
        authenticationDetailsProvider: this.provider
      });
      const listVolumesRequest: core.requests.ListVolumesRequest = {
        compartmentId: compartment.id
      };
      
      const response = await blockstorageClient.listVolumes(listVolumesRequest);
      return response.items.map(volume => ({
        id: volume.id!,
        name: volume.displayName || 'Unnamed Volume',
        type: 'Volume',
        service: 'Block Volume',
        region: this.credentials.region,
        state: volume.lifecycleState || 'Unknown',
        compartmentName: compartment.name,
        costDetails: {
          size: volume.sizeInGBs,
          volumeType: volume.vpusPerGB ? 'Performance' : 'Balanced',
          performanceTier: volume.vpusPerGB ? `${volume.vpusPerGB} VPUs` : 'Balanced'
        }
      }));
    } catch (error) {
      console.error('Error discovering block volumes:', error);
      return [];
    }
  }

  private async discoverObjectStorageBuckets(compartment: {id: string, name: string}): Promise<OCIResource[]> {
    try {
      const objectStorageClient = new objectstorage.ObjectStorageClient({ 
        authenticationDetailsProvider: this.provider
      });
      const listBucketsRequest: objectstorage.requests.ListBucketsRequest = {
        namespaceName: await this.getNamespace(),
        compartmentId: compartment.id
      };
      
      const response = await objectStorageClient.listBuckets(listBucketsRequest);
      return response.items.map(bucket => ({
        id: bucket.name!,
        name: bucket.name!,
        type: 'Bucket',
        service: 'Object Storage',
        region: this.credentials.region,
        state: 'Active',
        compartmentName: compartment.name,
        costDetails: {
          storageClass: 'Standard',
          estimatedSize: 0 // Would need additional API call to get actual size
        }
      }));
    } catch (error) {
      console.error('Error discovering object storage buckets:', error);
      return [];
    }
  }

  private async discoverAutonomousDatabases(compartment: {id: string, name: string}): Promise<OCIResource[]> {
    try {
      const databaseClient = new database.DatabaseClient({ 
        authenticationDetailsProvider: this.provider
      });
      const listAutonomousDatabasesRequest: database.requests.ListAutonomousDatabasesRequest = {
        compartmentId: compartment.id
      };
      
      const response = await databaseClient.listAutonomousDatabases(listAutonomousDatabasesRequest);
      return response.items.map(db => ({
        id: db.id!,
        name: db.displayName || 'Unnamed Database',
        type: 'Autonomous Database',
        service: 'Autonomous Database',
        region: this.credentials.region,
        state: db.lifecycleState || 'Unknown',
        compartmentName: compartment.name,
        costDetails: {
          cpuCoreCount: db.cpuCoreCount,
          dataStorageSizeInTBs: db.dataStorageSizeInTBs,
          dbWorkload: db.dbWorkload,
          isAutoScalingEnabled: db.isAutoScalingEnabled
        }
      }));
    } catch (error) {
      console.error('Error discovering autonomous databases:', error);
      return [];
    }
  }

  private async discoverLoadBalancers(compartment: {id: string, name: string}): Promise<OCIResource[]> {
    try {
      const loadBalancerClient = new loadbalancer.LoadBalancerClient({ 
        authenticationDetailsProvider: this.provider
      });
      const listLoadBalancersRequest: loadbalancer.requests.ListLoadBalancersRequest = {
        compartmentId: compartment.id
      };
      
      const response = await loadBalancerClient.listLoadBalancers(listLoadBalancersRequest);
      return response.items.map(lb => ({
        id: lb.id!,
        name: lb.displayName || 'Unnamed Load Balancer',
        type: 'Load Balancer',
        service: 'Load Balancer',
        region: this.credentials.region,
        state: lb.lifecycleState || 'Unknown',
        compartmentName: compartment.name,
        costDetails: {
          shapeName: lb.shapeName,
          isPrivate: lb.isPrivate
        }
      }));
    } catch (error) {
      console.error('Error discovering load balancers:', error);
      return [];
    }
  }

  private async discoverVCNs(compartment: {id: string, name: string}): Promise<OCIResource[]> {
    try {
      const virtualNetworkClient = new core.VirtualNetworkClient({ 
        authenticationDetailsProvider: this.provider
      });
      const listVcnsRequest: core.requests.ListVcnsRequest = {
        compartmentId: compartment.id
      };
      
      const response = await virtualNetworkClient.listVcns(listVcnsRequest);
      return response.items.map(vcn => ({
        id: vcn.id!,
        name: vcn.displayName || 'Unnamed VCN',
        type: 'VCN',
        service: 'Virtual Cloud Network',
        region: this.credentials.region,
        state: vcn.lifecycleState || 'Unknown',
        compartmentName: compartment.name,
        costDetails: {
          cidrBlock: vcn.cidrBlock,
          dnsLabel: vcn.dnsLabel
        }
      }));
    } catch (error) {
      console.error('Error discovering VCNs:', error);
      return [];
    }
  }

  private async getNamespace(): Promise<string> {
    try {
      const objectStorageClient = new objectstorage.ObjectStorageClient({ 
        authenticationDetailsProvider: this.provider
      });
      const getNamespaceRequest: objectstorage.requests.GetNamespaceRequest = {};
      const response = await objectStorageClient.getNamespace(getNamespaceRequest);
      return response.value!;
    } catch (error) {
      console.error('Error getting namespace:', error);
      return 'default';
    }
  }

  private extractVCpusFromShape(shape?: string): number {
    if (!shape) return 0;
    const match = shape.match(/(\d+)\./);
    return match ? parseInt(match[1]) : 0;
  }

  private extractMemoryFromShape(shape?: string): number {
    if (!shape) return 0;
    const match = shape.match(/\.(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private getServiceSummary(resources: OCIResource[]): Record<string, number> {
    const summary: Record<string, number> = {};
    resources.forEach(resource => {
      summary[resource.service] = (summary[resource.service] || 0) + 1;
    });
    return summary;
  }

  private getRegionSummary(resources: OCIResource[]): Record<string, number> {
    const summary: Record<string, number> = {};
    resources.forEach(resource => {
      summary[resource.region] = (summary[resource.region] || 0) + 1;
    });
    return summary;
  }

  private getStateSummary(resources: OCIResource[]): Record<string, number> {
    const summary: Record<string, number> = {};
    resources.forEach(resource => {
      summary[resource.state] = (summary[resource.state] || 0) + 1;
    });
    return summary;
  }

  // Helper method to validate OCI credentials
  async validateCredentials(): Promise<boolean> {
    try {
      console.log('OCI validation - starting validation...');
      
      // For now, just validate that we can create the authentication provider
      // This is a basic check - in production you'd want to make an actual API call
      if (!this.credentials.tenancyId || !this.credentials.userId || 
          !this.credentials.fingerprint || !this.credentials.privateKey || 
          !this.credentials.region) {
        console.log('OCI validation - missing required fields');
        return false;
      }
      
      // Check if the private key format is valid
      const privateKey = this.credentials.privateKey;
      if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
        console.log('OCI validation - invalid private key format');
        return false;
      }
      
      // Check if the tenancy ID format is valid (should start with ocid1.tenancy)
      if (!this.credentials.tenancyId.startsWith('ocid1.tenancy')) {
        console.log('OCI validation - invalid tenancy ID format');
        return false;
      }
      
      // Check if the user ID format is valid (should start with ocid1.user)
      if (!this.credentials.userId.startsWith('ocid1.user')) {
        console.log('OCI validation - invalid user ID format');
        return false;
      }
      
      // Check if the fingerprint format is valid (should be 16 hex pairs)
      const fingerprintRegex = /^[0-9a-f]{2}(:[0-9a-f]{2}){15}$/i;
      if (!fingerprintRegex.test(this.credentials.fingerprint)) {
        console.log('OCI validation - invalid fingerprint format');
        return false;
      }
      
      console.log('OCI validation - basic validation passed');
      return true;
    } catch (error) {
      console.error('OCI credentials validation error:', error);
      return false;
    }
  }

  private async discoverResourcesViaCLI(): Promise<OCIResource[]> {
    console.log('Using OCI CLI to discover resources...');
    
    const execAsync = promisify(exec);
    
    try {
      // Execute OCI CLI search command with a simpler approach
      const { stdout, stderr } = await execAsync('oci search resource structured-search --query-text "query all resources" --limit 100 --output json 2>/dev/null');
      
      if (stderr) {
        console.error('OCI CLI stderr:', stderr);
      }
      
      console.log('OCI CLI stdout length:', stdout.length);
      console.log('OCI CLI stdout preview:', stdout.substring(0, 200));
      
      // Try to parse the JSON response
      let result;
      try {
        result = JSON.parse(stdout);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Raw stdout (last 1000 chars):', stdout.substring(stdout.length - 1000));
        throw new Error(`Failed to parse OCI CLI JSON response: ${parseError.message}`);
      }
      
      const resources: OCIResource[] = [];
      
      if (result.data && result.data.items && Array.isArray(result.data.items)) {
        console.log(`Found ${result.data.items.length} items in OCI CLI response`);
        
        for (const item of result.data.items) {
          try {
            const resource = await this.convertCLIResultToResource(item);
            if (resource) {
              resources.push(resource);
            }
          } catch (error) {
            console.error(`Error converting CLI resource ${item.identifier}:`, error);
            // Continue with other resources
          }
        }
      } else {
        console.log('Unexpected OCI CLI response structure:', Object.keys(result));
        if (result.data) {
          console.log('Data keys:', Object.keys(result.data));
        }
      }
      
      console.log(`Successfully discovered ${resources.length} resources via OCI CLI`);
      return resources;
      
    } catch (error: any) {
      console.error('OCI CLI discovery error:', error);
      throw error;
    }
  }

  private async convertCLIResultToResource(item: any): Promise<OCIResource | null> {
    try {
      // Extract compartment name from compartment ID
      const compartmentName = this.extractCompartmentNameFromPath(item['compartment-id']);
      
      // Map OCI resource types to our service categories
      const serviceMap: Record<string, string> = {
        'Instance': 'Compute',
        'Vcn': 'Networking',
        'Subnet': 'Networking',
        'LoadBalancer': 'Load Balancer',
        'NatGateway': 'Networking',
        'InternetGateway': 'Networking',
        'SecurityList': 'Networking',
        'RouteTable': 'Networking',
        'Bucket': 'Object Storage',
        'AutonomousDatabase': 'Database',
        'LogGroup': 'Logging',
        'Log': 'Logging',
        'DnsZone': 'DNS',
        'DnsResolver': 'DNS',
        'DnsView': 'DNS',
        'DhcpOptions': 'Networking',
        'PublicIp': 'Networking',
        'ServiceGateway': 'Networking',
        'Compartment': 'Identity',
        'Group': 'Identity',
        'TagNamespace': 'Identity',
        'Quota': 'Identity',
        'DataSafeUserAssessment': 'Security',
        'DataSafeSecurityAssessment': 'Security',
        'WebAppAcceleration': 'Web Application Acceleration',
        'WebAppAccelerationPolicy': 'Web Application Acceleration',
        'Image': 'Compute'
      };
      
      const service = serviceMap[item['resource-type']] || item['resource-type'];
      
      // Basic cost estimation (this would need to be enhanced with actual pricing data)
      const costDetails = {
        estimatedMonthlyCost: this.estimateResourceCost(item['resource-type'], item),
        currency: 'USD',
        lastUpdated: new Date().toISOString()
      };
      
      return {
        id: item.identifier,
        name: item['display-name'] || item.identifier,
        type: item['resource-type'],
        service: service,
        region: this.credentials.region,
        state: item['lifecycle-state'] || 'UNKNOWN',
        compartmentId: item['compartment-id'],
        compartmentName: compartmentName,
        costDetails: costDetails,
        tags: {
          ...item['defined-tags'],
          ...item['freeform-tags']
        },
        metadata: {
          availabilityDomain: item['availability-domain'] || null,
          timeCreated: item['time-created'] || null,
          identityContext: item['identity-context'] || {}
        }
      };
    } catch (error) {
      console.error('Error converting CLI result to resource:', error);
      return null;
    }
  }

  private estimateResourceCost(resourceType: string, resource: any): number {
    // Basic cost estimation - this would need to be enhanced with actual OCI pricing
    const baseCosts: Record<string, number> = {
      'Instance': 50, // $50/month for basic instance
      'Vcn': 0, // VCN is free
      'Subnet': 0, // Subnet is free
      'LoadBalancer': 25, // $25/month for load balancer
      'NatGateway': 45, // $45/month for NAT gateway
      'InternetGateway': 0, // Internet gateway is free
      'SecurityList': 0, // Security list is free
      'RouteTable': 0, // Route table is free
      'Bucket': 5, // $5/month for object storage
      'AutonomousDatabase': 200, // $200/month for autonomous database
      'LogGroup': 10, // $10/month for logging
      'Log': 5, // $5/month per log
      'DnsZone': 0, // DNS zone is free
      'DnsResolver': 0, // DNS resolver is free
      'DnsView': 0, // DNS view is free
      'DhcpOptions': 0, // DHCP options are free
      'PublicIp': 3, // $3/month for reserved public IP
      'ServiceGateway': 0, // Service gateway is free
      'Compartment': 0, // Compartment is free
      'Group': 0, // Group is free
      'TagNamespace': 0, // Tag namespace is free
      'Quota': 0, // Quota is free
      'DataSafeUserAssessment': 50, // $50/month for data safe assessment
      'DataSafeSecurityAssessment': 50, // $50/month for security assessment
      'WebAppAcceleration': 100, // $100/month for web app acceleration
      'WebAppAccelerationPolicy': 0, // Policy is free
      'Image': 0 // Custom images are free
    };
    
    return baseCosts[resourceType] || 10; // Default $10/month for unknown resources
  }
}

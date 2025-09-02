import AWS from 'aws-sdk';

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  sessionToken?: string;
}

export interface AWSResource {
  id: string;
  name: string;
  type: string;
  service: string;
  region: string;
  tags?: Record<string, string>;
  state: string;
  costDetails?: {
    instanceType?: string;
    size?: string;
    vcpus?: number;
    memory?: number;
    storage?: number;
  };
}

export interface AWSInventory {
  resources: AWSResource[];
  summary: {
    totalResources: number;
    services: Record<string, number>;
    regions: Record<string, number>;
  };
  scanDate: string;
}

export class AWSInventoryService {
  private credentials: AWSCredentials;

  constructor(credentials: AWSCredentials) {
    this.credentials = credentials;
    AWS.config.update({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region,
      ...(credentials.sessionToken && { sessionToken: credentials.sessionToken })
    });
  }

  async discoverResources(): Promise<AWSInventory> {
    const resources: AWSResource[] = [];
    const summary = {
      totalResources: 0,
      services: {} as Record<string, number>,
      regions: {} as Record<string, number>
    };

    try {
      // Discover EC2 instances
      const ec2Resources = await this.discoverEC2Instances();
      resources.push(...ec2Resources);

      // Discover RDS instances
      const rdsResources = await this.discoverRDSInstances();
      resources.push(...rdsResources);

      // Discover S3 buckets
      const s3Resources = await this.discoverS3Buckets();
      resources.push(...s3Resources);

      // Discover Lambda functions
      const lambdaResources = await this.discoverLambdaFunctions();
      resources.push(...lambdaResources);

      // Discover ELB/ALB
      const elbResources = await this.discoverLoadBalancers();
      resources.push(...elbResources);

      // Discover EBS volumes
      const ebsResources = await this.discoverEBSVolumes();
      resources.push(...ebsResources);

      // Update summary
      summary.totalResources = resources.length;
      resources.forEach(resource => {
        summary.services[resource.service] = (summary.services[resource.service] || 0) + 1;
        summary.regions[resource.region] = (summary.regions[resource.region] || 0) + 1;
      });

      return {
        resources,
        summary,
        scanDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error discovering AWS resources:', error);
      throw error;
    }
  }

  private async discoverEC2Instances(): Promise<AWSResource[]> {
    const ec2 = new AWS.EC2({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await ec2.describeInstances().promise();
      
      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          const tags: Record<string, string> = {};
          instance.Tags?.forEach(tag => {
            if (tag.Key && tag.Value) {
              tags[tag.Key] = tag.Value;
            }
          });

          resources.push({
            id: instance.InstanceId || 'unknown',
            name: tags.Name || instance.InstanceId || 'unnamed',
            type: instance.InstanceType || 'unknown',
            service: 'EC2',
            region: this.credentials.region,
            tags,
            state: instance.State?.Name || 'unknown',
            costDetails: {
              instanceType: instance.InstanceType,
              vcpus: this.getVCPUsFromInstanceType(instance.InstanceType),
              memory: this.getMemoryFromInstanceType(instance.InstanceType)
            }
          });
        }
      }
    } catch (error) {
      console.error('Error discovering EC2 instances:', error);
    }

    return resources;
  }

  private async discoverRDSInstances(): Promise<AWSResource[]> {
    const rds = new AWS.RDS({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await rds.describeDBInstances().promise();
      
      for (const instance of response.DBInstances || []) {
        resources.push({
          id: instance.DBInstanceIdentifier || 'unknown',
          name: instance.DBInstanceIdentifier || 'unnamed',
          type: instance.DBInstanceClass || 'unknown',
          service: 'RDS',
          region: this.credentials.region,
          state: instance.DBInstanceStatus || 'unknown',
          costDetails: {
            instanceType: instance.DBInstanceClass,
            storage: instance.AllocatedStorage
          }
        });
      }
    } catch (error) {
      console.error('Error discovering RDS instances:', error);
    }

    return resources;
  }

  private async discoverS3Buckets(): Promise<AWSResource[]> {
    const s3 = new AWS.S3({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await s3.listBuckets().promise();
      
      for (const bucket of response.Buckets || []) {
        resources.push({
          id: bucket.Name || 'unknown',
          name: bucket.Name || 'unnamed',
          type: 'Bucket',
          service: 'S3',
          region: this.credentials.region,
          state: 'active'
        });
      }
    } catch (error) {
      console.error('Error discovering S3 buckets:', error);
    }

    return resources;
  }

  private async discoverLambdaFunctions(): Promise<AWSResource[]> {
    const lambda = new AWS.Lambda({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await lambda.listFunctions().promise();
      
      for (const func of response.Functions || []) {
        resources.push({
          id: func.FunctionArn || 'unknown',
          name: func.FunctionName || 'unnamed',
          type: 'Function',
          service: 'Lambda',
          region: this.credentials.region,
          state: func.State || 'unknown',
          costDetails: {
            memory: func.MemorySize
          }
        });
      }
    } catch (error) {
      console.error('Error discovering Lambda functions:', error);
    }

    return resources;
  }

  private async discoverLoadBalancers(): Promise<AWSResource[]> {
    const elbv2 = new AWS.ELBv2({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await elbv2.describeLoadBalancers().promise();
      
      for (const lb of response.LoadBalancers || []) {
        resources.push({
          id: lb.LoadBalancerArn || 'unknown',
          name: lb.LoadBalancerName || 'unnamed',
          type: lb.Type || 'unknown',
          service: 'ELB',
          region: this.credentials.region,
          state: lb.State?.Code || 'unknown'
        });
      }
    } catch (error) {
      console.error('Error discovering Load Balancers:', error);
    }

    return resources;
  }

  private async discoverEBSVolumes(): Promise<AWSResource[]> {
    const ec2 = new AWS.EC2({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await ec2.describeVolumes().promise();
      
      for (const volume of response.Volumes || []) {
        const tags: Record<string, string> = {};
        volume.Tags?.forEach(tag => {
          if (tag.Key && tag.Value) {
            tags[tag.Key] = tag.Value;
          }
        });

        resources.push({
          id: volume.VolumeId || 'unknown',
          name: tags.Name || volume.VolumeId || 'unnamed',
          type: volume.VolumeType || 'unknown',
          service: 'EBS',
          region: this.credentials.region,
          tags,
          state: volume.State || 'unknown',
          costDetails: {
            storage: volume.Size
          }
        });
      }
    } catch (error) {
      console.error('Error discovering EBS volumes:', error);
    }

    return resources;
  }

  private getVCPUsFromInstanceType(instanceType?: string): number | undefined {
    if (!instanceType) return undefined;
    
    // Simplified mapping - in production, use AWS API or detailed mapping
    const vcpuMap: Record<string, number> = {
      't2.nano': 1, 't2.micro': 1, 't2.small': 1, 't2.medium': 2, 't2.large': 2,
      't3.nano': 2, 't3.micro': 2, 't3.small': 2, 't3.medium': 2, 't3.large': 2,
      'm5.large': 2, 'm5.xlarge': 4, 'm5.2xlarge': 8, 'm5.4xlarge': 16,
      'c5.large': 2, 'c5.xlarge': 4, 'c5.2xlarge': 8, 'c5.4xlarge': 16,
      'r5.large': 2, 'r5.xlarge': 4, 'r5.2xlarge': 8, 'r5.4xlarge': 16
    };
    
    return vcpuMap[instanceType] || undefined;
  }

  private getMemoryFromInstanceType(instanceType?: string): number | undefined {
    if (!instanceType) return undefined;
    
    // Simplified mapping - in production, use AWS API or detailed mapping
    const memoryMap: Record<string, number> = {
      't2.nano': 0.5, 't2.micro': 1, 't2.small': 2, 't2.medium': 4, 't2.large': 8,
      't3.nano': 0.5, 't3.micro': 1, 't3.small': 2, 't3.medium': 4, 't3.large': 8,
      'm5.large': 8, 'm5.xlarge': 16, 'm5.2xlarge': 32, 'm5.4xlarge': 64,
      'c5.large': 4, 'c5.xlarge': 8, 'c5.2xlarge': 16, 'c5.4xlarge': 32,
      'r5.large': 16, 'r5.xlarge': 32, 'r5.2xlarge': 64, 'r5.4xlarge': 128
    };
    
    return memoryMap[instanceType] || undefined;
  }
}
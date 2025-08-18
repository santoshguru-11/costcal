import { InfrastructureRequirements, CloudProvider, CostCalculationResult } from "@shared/schema";
import pricingData from "../data/comprehensive-pricing.json";

export class ComprehensiveCostCalculator {
  private pricing = pricingData;

  calculateCosts(requirements: InfrastructureRequirements): CostCalculationResult {
    const providers = ['aws', 'azure', 'gcp', 'oracle'] as const;
    const results: CloudProvider[] = [];

    // Calculate region multiplier
    const regionMultiplier = this.pricing.regions[requirements.compute.region as keyof typeof this.pricing.regions]?.multiplier || 1.0;

    for (const provider of providers) {
      const costs = {
        compute: this.calculateCompute(provider, requirements, regionMultiplier),
        storage: this.calculateStorage(provider, requirements),
        database: this.calculateDatabase(provider, requirements, regionMultiplier),
        networking: this.calculateNetworking(provider, requirements),
        analytics: this.calculateAnalytics(provider, requirements, regionMultiplier),
        ai: this.calculateAI(provider, requirements, regionMultiplier),
        security: this.calculateSecurity(provider, requirements, regionMultiplier),
        monitoring: this.calculateMonitoring(provider, requirements, regionMultiplier),
        devops: this.calculateDevOps(provider, requirements, regionMultiplier),
        backup: this.calculateBackup(provider, requirements),
        iot: this.calculateIoT(provider, requirements, regionMultiplier),
        media: this.calculateMedia(provider, requirements, regionMultiplier),
      };

      const total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

      results.push({
        name: provider.toUpperCase(),
        compute: Math.round(costs.compute * 100) / 100,
        storage: Math.round(costs.storage * 100) / 100,
        database: Math.round(costs.database * 100) / 100,
        networking: Math.round(costs.networking * 100) / 100,
        total: Math.round(total * 100) / 100,
        // Add extended cost breakdown
        analytics: Math.round(costs.analytics * 100) / 100,
        ai: Math.round(costs.ai * 100) / 100,
        security: Math.round(costs.security * 100) / 100,
        monitoring: Math.round(costs.monitoring * 100) / 100,
        devops: Math.round(costs.devops * 100) / 100,
        backup: Math.round(costs.backup * 100) / 100,
        iot: Math.round(costs.iot * 100) / 100,
        media: Math.round(costs.media * 100) / 100,
      } as CloudProvider & Record<string, number>);
    }

    // Sort by total cost
    results.sort((a, b) => a.total - b.total);
    
    const cheapest = results[0];
    const mostExpensive = results[results.length - 1];
    const potentialSavings = Math.round((mostExpensive.total - cheapest.total) * 100) / 100;

    // Calculate multi-cloud optimization
    const multiCloudOption = this.calculateMultiCloudOptimization(results);

    return {
      providers: results,
      cheapest,
      mostExpensive,
      potentialSavings,
      multiCloudOption,
      recommendations: {
        singleCloud: `${cheapest.name} offers the best overall value at $${cheapest.total}/month with comprehensive service coverage and competitive pricing across all categories`,
        multiCloud: `Hybrid approach could save an additional $${Math.round((cheapest.total - multiCloudOption.cost) * 100) / 100}/month by optimizing service placement across providers`
      }
    };
  }

  private calculateCompute(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.compute[provider as keyof typeof this.pricing.compute];
    const instancePricing = pricing[req.compute.instanceType];
    
    // Base compute cost
    const vcpuCost = req.compute.vcpus * instancePricing.vcpu * 24 * 30;
    const ramCost = req.compute.ram * instancePricing.ram * 24 * 30;
    let baseCost = vcpuCost + ramCost;

    // Windows multiplier
    if (req.compute.operatingSystem === 'windows') {
      baseCost *= pricing.windows_multiplier;
    }

    // Serverless functions
    let serverlessCost = 0;
    if (req.compute.serverless) {
      const requestCost = req.compute.serverless.functions * (pricing.lambda_per_request || pricing.functions_per_request || pricing.cloud_functions_per_request || 0.0000002);
      const executionCost = req.compute.serverless.functions * req.compute.serverless.executionTime * (pricing.lambda_per_gb_second || pricing.functions_per_gb_second || 0.0000166667);
      serverlessCost = requestCost + executionCost;
    }

    return (baseCost + serverlessCost) * regionMultiplier;
  }

  private calculateStorage(provider: string, req: InfrastructureRequirements): number {
    const pricing = this.pricing.storage[provider as keyof typeof this.pricing.storage];
    let totalCost = 0;

    // Object Storage
    if (req.storage.objectStorage.size > 0) {
      const storageCost = req.storage.objectStorage.size * pricing.object[req.storage.objectStorage.tier];
      const requestCost = (req.storage.objectStorage.requests / 1000) * pricing.object.requests_per_1k.get;
      totalCost += storageCost + requestCost;
    }

    // Block Storage
    if (req.storage.blockStorage.size > 0) {
      const storageCost = req.storage.blockStorage.size * pricing.block[req.storage.blockStorage.type];
      const iopsCost = req.storage.blockStorage.iops * pricing.block.iops;
      totalCost += storageCost + iopsCost;
    }

    // File Storage
    if (req.storage.fileStorage.size > 0) {
      totalCost += req.storage.fileStorage.size * pricing.file[req.storage.fileStorage.performanceMode];
    }

    return totalCost;
  }

  private calculateDatabase(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.database[provider as keyof typeof this.pricing.database];
    let totalCost = 0;

    // Relational Database
    if (req.database.relational.storage > 0) {
      let instanceCost = pricing.relational[req.database.relational.engine][req.database.relational.instanceClass];
      if (req.database.relational.multiAZ) {
        instanceCost *= pricing.relational.multi_az_multiplier;
      }
      const storageCost = req.database.relational.storage * pricing.relational.storage_per_gb;
      totalCost += instanceCost + storageCost;
    }

    // NoSQL Database
    if (req.database.nosql.engine !== 'none') {
      if (req.database.nosql.engine === 'dynamodb') {
        const readCost = req.database.nosql.readCapacity * pricing.nosql.dynamodb.read_capacity_unit;
        const writeCost = req.database.nosql.writeCapacity * pricing.nosql.dynamodb.write_capacity_unit;
        const storageCost = req.database.nosql.storage * pricing.nosql.dynamodb.storage_per_gb;
        totalCost += readCost + writeCost + storageCost;
      } else {
        totalCost += pricing.nosql[req.database.nosql.engine]?.small || 0;
      }
    }

    // Cache
    if (req.database.cache.engine !== 'none' && req.database.cache.nodes > 0) {
      const cacheCost = pricing.cache[req.database.cache.engine][req.database.cache.instanceClass] * req.database.cache.nodes;
      totalCost += cacheCost;
    }

    // Data Warehouse
    if (req.database.dataWarehouse.nodes > 0) {
      const warehouseCost = pricing.warehouse[req.database.dataWarehouse.nodeType] * req.database.dataWarehouse.nodes;
      const storageCost = req.database.dataWarehouse.storage * pricing.warehouse.storage_per_gb;
      totalCost += warehouseCost + storageCost;
    }

    return totalCost * regionMultiplier;
  }

  private calculateNetworking(provider: string, req: InfrastructureRequirements): number {
    const pricing = this.pricing.networking[provider as keyof typeof this.pricing.networking];
    let totalCost = 0;

    // Basic bandwidth
    const bandwidthCost = req.networking.bandwidth * pricing.bandwidth;
    const loadBalancerCost = pricing.load_balancer[req.networking.loadBalancer];
    totalCost += bandwidthCost + loadBalancerCost;

    // CDN
    if (req.networking.cdn.enabled && req.networking.cdn.requests > 0) {
      const cdnRequestCost = (req.networking.cdn.requests / 10000) * pricing.cdn.requests_per_10k;
      const cdnDataCost = req.networking.cdn.dataTransfer * pricing.cdn.data_transfer_per_gb;
      totalCost += cdnRequestCost + cdnDataCost;
    }

    // DNS
    if (req.networking.dns.hostedZones > 0) {
      const zoneCost = req.networking.dns.hostedZones * pricing.dns.hosted_zone;
      const queryCost = (req.networking.dns.queries / 1000000) * pricing.dns.queries_per_million;
      totalCost += zoneCost + queryCost;
    }

    // VPN
    if (req.networking.vpn.connections > 0) {
      const vpnCost = req.networking.vpn.connections * req.networking.vpn.hours * pricing.vpn.connection_hour;
      totalCost += vpnCost;
    }

    return totalCost;
  }

  private calculateAnalytics(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.analytics[provider as keyof typeof this.pricing.analytics];
    let totalCost = 0;

    // Data Processing
    if (req.analytics.dataProcessing.hours > 0) {
      totalCost += req.analytics.dataProcessing.hours * pricing.data_processing[req.analytics.dataProcessing.nodeType];
    }

    // Streaming
    if (req.analytics.streaming.shards > 0) {
      const shardCost = req.analytics.streaming.shards * 24 * 30 * pricing.streaming.shard_hour; // Monthly cost
      const recordCost = (req.analytics.streaming.records / 1000000) * pricing.streaming.record_per_million;
      totalCost += shardCost + recordCost;
    }

    // Business Intelligence
    if (req.analytics.businessIntelligence.users > 0) {
      const userCost = req.analytics.businessIntelligence.users * pricing.business_intelligence.user_per_month;
      const queryCost = (req.analytics.businessIntelligence.queries / 1000) * pricing.business_intelligence.query_per_1k;
      totalCost += userCost + queryCost;
    }

    return totalCost * regionMultiplier;
  }

  private calculateAI(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.ai[provider as keyof typeof this.pricing.ai];
    let totalCost = 0;

    // Training
    if (req.ai.training.hours > 0) {
      totalCost += req.ai.training.hours * pricing.training[req.ai.training.instanceType];
    }

    // Inference
    if (req.ai.inference.requests > 0) {
      const requestsPerHour = req.ai.inference.requests / 30 / 24; // Convert monthly to hourly
      totalCost += requestsPerHour * 30 * 24 * pricing.inference[req.ai.inference.instanceType];
    }

    // Prebuilt Services
    if (req.ai.prebuilt.imageAnalysis > 0) {
      totalCost += (req.ai.prebuilt.imageAnalysis / 1000) * pricing.prebuilt.image_analysis_per_1k;
    }
    if (req.ai.prebuilt.textProcessing > 0) {
      totalCost += (req.ai.prebuilt.textProcessing / 1000000) * pricing.prebuilt.text_processing_per_million_chars;
    }
    if (req.ai.prebuilt.speechServices > 0) {
      totalCost += (req.ai.prebuilt.speechServices / 1000) * pricing.prebuilt.speech_per_1k_requests;
    }

    return totalCost * regionMultiplier;
  }

  private calculateSecurity(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.security[provider as keyof typeof this.pricing.security];
    let totalCost = 0;

    // Web Firewall
    if (req.security.webFirewall.enabled && req.security.webFirewall.requests > 0) {
      totalCost += (req.security.webFirewall.requests / 1000000) * pricing.web_firewall_per_million;
    }

    // Identity Management
    if (req.security.identityManagement.users > 0) {
      const userCost = req.security.identityManagement.users * pricing.identity_per_user;
      const authCost = req.security.identityManagement.authentications * pricing.identity_per_auth;
      totalCost += userCost + authCost;
    }

    // Key Management
    if (req.security.keyManagement.keys > 0) {
      const keyCost = req.security.keyManagement.keys * pricing.key_per_key;
      const operationCost = (req.security.keyManagement.operations / 10000) * pricing.key_per_10k_operations;
      totalCost += keyCost + operationCost;
    }

    // Threat Detection
    if (req.security.threatDetection.enabled) {
      totalCost += pricing.threat_detection;
      if (req.security.threatDetection.events > 0) {
        totalCost += (req.security.threatDetection.events / 1000000) * pricing.threat_per_million_events;
      }
    }

    return totalCost * regionMultiplier;
  }

  private calculateMonitoring(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.monitoring[provider as keyof typeof this.pricing.monitoring];
    let totalCost = 0;

    if (req.monitoring.metrics > 0) {
      totalCost += req.monitoring.metrics * pricing.custom_metric;
    }
    if (req.monitoring.logs > 0) {
      totalCost += req.monitoring.logs * pricing.log_ingestion_per_gb;
    }
    if (req.monitoring.traces > 0) {
      totalCost += (req.monitoring.traces / 1000000) * pricing.traces_per_million;
    }
    if (req.monitoring.alerts > 0) {
      totalCost += req.monitoring.alerts * pricing.alert_per_notification;
    }

    return totalCost * regionMultiplier;
  }

  private calculateDevOps(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.devops[provider as keyof typeof this.pricing.devops];
    let totalCost = 0;

    // CI/CD
    if (req.devops.cicd.buildMinutes > 0) {
      totalCost += req.devops.cicd.buildMinutes * pricing.build_per_minute;
      totalCost += req.devops.cicd.parallelJobs * pricing.parallel_job;
    }

    // Container Registry
    if (req.devops.containerRegistry.storage > 0) {
      totalCost += req.devops.containerRegistry.storage * pricing.container_registry_per_gb;
      totalCost += (req.devops.containerRegistry.pulls / 1000) * pricing.container_pulls_per_1k;
    }

    // API Management
    if (req.devops.apiManagement.requests > 0) {
      totalCost += (req.devops.apiManagement.requests / 1000000) * pricing.api_requests_per_million;
      totalCost += req.devops.apiManagement.endpoints * pricing.api_endpoint;
    }

    return totalCost * regionMultiplier;
  }

  private calculateBackup(provider: string, req: InfrastructureRequirements): number {
    const pricing = this.pricing.backup[provider as keyof typeof this.pricing.backup];
    let totalCost = 0;

    if (req.backup.storage > 0) {
      const baseCost = req.backup.storage * pricing.storage_per_gb;
      const frequencyMultiplier = pricing.frequency_multiplier[req.backup.frequency];
      totalCost += baseCost * frequencyMultiplier;
    }

    return totalCost;
  }

  private calculateIoT(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.iot[provider as keyof typeof this.pricing.iot];
    let totalCost = 0;

    if (req.iot.devices > 0) {
      totalCost += req.iot.devices * pricing.device_per_month;
    }
    if (req.iot.messages > 0) {
      totalCost += (req.iot.messages / 1000000) * pricing.message_per_million;
    }
    if (req.iot.dataProcessing > 0) {
      totalCost += req.iot.dataProcessing * pricing.data_processing_per_gb;
    }
    if (req.iot.edgeLocations > 0) {
      totalCost += req.iot.edgeLocations * pricing.edge_location;
    }

    return totalCost * regionMultiplier;
  }

  private calculateMedia(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.media[provider as keyof typeof this.pricing.media];
    let totalCost = 0;

    // Video Streaming
    if (req.media.videoStreaming.hours > 0) {
      totalCost += req.media.videoStreaming.hours * pricing.streaming_per_hour[req.media.videoStreaming.quality];
    }

    // Transcoding
    if (req.media.transcoding.minutes > 0) {
      totalCost += req.media.transcoding.minutes * pricing.transcoding_per_minute[req.media.transcoding.inputFormat];
    }

    return totalCost * regionMultiplier;
  }

  private calculateMultiCloudOptimization(providers: CloudProvider[]): { cost: number; breakdown: Record<string, string> } {
    // Find cheapest option for each service category
    const categories = ['compute', 'storage', 'database', 'networking'];
    const breakdown: Record<string, string> = {};
    let totalCost = 0;

    categories.forEach(category => {
      const cheapest = providers.reduce((min, p) => 
        p[category as keyof CloudProvider] < min[category as keyof CloudProvider] ? p : min
      );
      breakdown[category] = cheapest.name;
      totalCost += cheapest[category as keyof CloudProvider] as number;
    });

    return {
      cost: Math.round(totalCost * 100) / 100,
      breakdown
    };
  }
}
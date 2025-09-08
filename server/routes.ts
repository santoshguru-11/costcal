import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { ComprehensiveCostCalculator } from "./utils/comprehensiveCostCalculator.js";
import { infrastructureRequirementsSchema, insertCloudCredentialSchema, insertInventoryScanSchema } from "@shared/schema";
import { CloudInventoryService, type InventoryScanRequest } from "./services/inventory-service.js";
import { TerraformStateParser } from "./services/terraform-parser.js";
import { setupAuth, isAuthenticated } from "./auth.js";
import { decryptSync } from "./encryption.js";

export async function registerRoutes(app: Express): Promise<Server> {
  const costCalculator = new ComprehensiveCostCalculator();
  const inventoryService = new CloudInventoryService();
  const terraformParser = new TerraformStateParser();

  // Setup authentication
  await setupAuth(app);

  // Auth routes are now handled in auth.ts

  // Calculate costs endpoint (protected)
  app.post("/api/calculate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requirements = infrastructureRequirementsSchema.parse(req.body);
      const results = costCalculator.calculateCosts(requirements);
      
      // Save to storage with user association
      const analysis = await storage.createCostAnalysis({
        requirements,
        results,
        inventoryScanId: req.body.inventoryScanId
      }, userId);

      res.json({
        analysisId: analysis.id,
        results
      });
    } catch (error) {
      console.error("Cost calculation error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid requirements data" 
      });
    }
  });

  // Get analysis by ID (protected)
  app.get("/api/analysis/:id", isAuthenticated, async (req, res) => {
    try {
      const analysis = await storage.getCostAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ message: "Failed to retrieve analysis" });
    }
  });

  // Get all analyses for user (protected)
  app.get("/api/analyses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const analyses = await storage.getAllCostAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error("Get analyses error:", error);
      res.status(500).json({ message: "Failed to retrieve analyses" });
    }
  });

  // Export results as CSV (protected)
  app.get("/api/export/:id/csv", isAuthenticated, async (req, res) => {
    try {
      const analysis = await storage.getCostAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      const results = analysis.results as any;
      let csv = "Provider,Compute,Storage,Database,Networking,Total\n";
      
      results.providers.forEach((provider: any) => {
        csv += `${provider.name},${provider.compute},${provider.storage},${provider.database},${provider.networking},${provider.total}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=cost-analysis-${req.params.id}.csv`);
      res.send(csv);
    } catch (error) {
      console.error("Export CSV error:", error);
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  // Cloud credentials management endpoints (protected)
  app.post("/api/credentials", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const credentialData = insertCloudCredentialSchema.parse(req.body);
      
      const credential = await storage.createCloudCredential(credentialData, userId);
      res.json({ id: credential.id, name: credential.name, provider: credential.provider });
    } catch (error) {
      console.error("Create credential error:", error);
      res.status(400).json({ message: "Failed to create credential" });
    }
  });

  app.get("/api/credentials", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const credentials = await storage.getUserCloudCredentials(userId);
      // Don't expose full credentials, only metadata
      const safeCredentials = credentials.map(cred => ({
        id: cred.id,
        name: cred.name,
        provider: cred.provider,
        isValidated: cred.isValidated,
        createdAt: cred.createdAt
      }));
      res.json(safeCredentials);
    } catch (error) {
      console.error("Get credentials error:", error);
      res.status(500).json({ message: "Failed to retrieve credentials" });
    }
  });

  app.get("/api/credentials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const credential = await storage.getCloudCredential(req.params.id, userId);
      if (!credential) {
        return res.status(404).json({ message: "Credential not found" });
      }
      // Return decrypted credentials for scanning
      res.json({
        id: credential.id,
        name: credential.name,
        provider: credential.provider,
        credentials: credential.encryptedCredentials, // This is already decrypted by storage
        isValidated: credential.isValidated
      });
    } catch (error) {
      console.error("Get credential error:", error);
      res.status(500).json({ message: "Failed to retrieve credential" });
    }
  });

  app.put("/api/credentials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { name, provider, encryptedCredentials } = req.body;
      
      const updated = await storage.updateCloudCredential(req.params.id, {
        name,
        provider,
        encryptedCredentials
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Credential not found" });
      }
      
      res.json({ message: "Credential updated successfully" });
    } catch (error) {
      console.error("Update credential error:", error);
      res.status(500).json({ message: "Failed to update credential" });
    }
  });

  app.delete("/api/credentials/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteCloudCredential(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Credential not found" });
      }
      res.json({ message: "Credential deleted successfully" });
    } catch (error) {
      console.error("Delete credential error:", error);
      res.status(500).json({ message: "Failed to delete credential" });
    }
  });

  // Get available cloud providers for filtering
  app.get("/api/inventory/providers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const credentials = await storage.getUserCloudCredentials(userId);
      const providers = [...new Set(credentials.map(cred => cred.provider))];
      res.json({ providers });
    } catch (error) {
      console.error("Get providers error:", error);
      res.status(500).json({ message: "Failed to get providers" });
    }
  });

  // Inventory scanning endpoints (protected)
  app.post("/api/inventory/scan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const scanRequest: InventoryScanRequest = req.body;
      const { provider: filterProvider } = req.query; // Optional provider filter
      const startTime = Date.now();
      
      // Load full credentials from database for each credential ID
      const credentialsWithData = await Promise.all(
        scanRequest.credentials.map(async (cred) => {
          const fullCredential = await storage.getCloudCredential(cred.id, userId);
          if (!fullCredential) {
            throw new Error(`Credential ${cred.id} not found`);
          }
          return {
            id: fullCredential.id,
            provider: fullCredential.provider,
            name: fullCredential.name,
            credentials: JSON.parse(fullCredential.encryptedCredentials) // Parse the already decrypted JSON string
          };
        })
      );
      
      // Filter credentials by provider if specified
      let filteredCredentials = credentialsWithData;
      if (filterProvider) {
        filteredCredentials = credentialsWithData.filter(cred => cred.provider === filterProvider);
        if (filteredCredentials.length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: `No credentials found for provider: ${filterProvider}` 
          });
        }
      }
      
      // Update scan request with filtered credentials
      const updatedScanRequest = {
        ...scanRequest,
        credentials: filteredCredentials
      };
      
      const inventory = await inventoryService.scanMultipleProviders(updatedScanRequest);
      const scanDuration = Date.now() - startTime;
      
      // Save inventory scan to database
      const inventoryScan = await storage.createInventoryScan({
        scanData: { success: true, inventory },
        summary: {
          totalResources: Object.values(inventory).reduce(
            (total: number, provider: any) => total + (provider.resources?.length || 0), 
            0
          ),
          scannedProviders: Object.keys(inventory).length,
          scanTime: new Date().toISOString()
        },
        scanDuration
      }, userId);

      // Automatically generate multi-cloud cost analysis
      let costAnalysis = null;
      try {
        const analysis = await inventoryService.generateAutomaticCostAnalysis(inventory);
        
        // Convert inventory mapping to full requirements format
        const fullRequirements = {
          currency: 'USD' as const,
          licensing: {
            windows: { enabled: false, licenses: 0 },
            sqlServer: { enabled: false, edition: 'standard' as const, licenses: 0 },
            oracle: { enabled: false, edition: 'standard' as const, licenses: 0 },
            vmware: { enabled: false, licenses: 0 },
            redhat: { enabled: false, licenses: 0 },
            sap: { enabled: false, licenses: 0 },
            microsoftOffice365: { enabled: false, licenses: 0 }
          },
          compute: analysis.costRequirements.compute,
          storage: {
            ...analysis.costRequirements.storage,
            fileStorage: { size: 0, performanceMode: 'general-purpose' as const }
          },
          database: {
            ...analysis.costRequirements.database,
            nosql: { engine: 'none' as const, readCapacity: 0, writeCapacity: 0, storage: 0 },
            cache: { engine: 'none' as const, instanceClass: 'small' as const, nodes: 0 },
            dataWarehouse: { nodes: 0, nodeType: 'small' as const, storage: 0 }
          },
          networking: {
            ...analysis.costRequirements.networking,
            cdn: { enabled: false, requests: 0, dataTransfer: 0 },
            dns: { hostedZones: 0, queries: 0 },
            vpn: { connections: 0, hours: 0 }
          },
          analytics: {
            dataProcessing: { hours: 0, nodeType: 'small' as const },
            streaming: { shards: 0, records: 0 },
            businessIntelligence: { users: 0, queries: 0 }
          },
          ai: {
            training: { hours: 0, instanceType: 'cpu' as const },
            inference: { requests: 0, instanceType: 'cpu' as const },
            prebuilt: { imageAnalysis: 0, textProcessing: 0, speechServices: 0 }
          },
          security: {
            webFirewall: { enabled: false, requests: 0 },
            identityManagement: { users: 0, authentications: 0 },
            keyManagement: { keys: 0, operations: 0 },
            threatDetection: { enabled: false, events: 0 }
          },
          monitoring: {
            metrics: 0,
            logs: 0,
            traces: 0,
            alerts: 0
          },
          devops: {
            cicd: { buildMinutes: 0, parallelJobs: 0 },
            containerRegistry: { storage: 0, pulls: 0 },
            apiManagement: { requests: 0, endpoints: 0 }
          },
          backup: {
            storage: 0,
            frequency: 'daily' as const,
            retention: 30
          },
          iot: {
            devices: 0,
            messages: 0,
            dataProcessing: 0,
            edgeLocations: 0
          },
          media: {
            videoStreaming: { hours: 0, quality: '1080p' as const },
            transcoding: { minutes: 0, inputFormat: 'standard' as const }
          },
          quantum: {
            processingUnits: 0,
            quantumAlgorithms: 'optimization' as const,
            circuitComplexity: 'basic' as const
          },
          advancedAI: {
            vectorDatabase: { dimensions: 0, queries: 0 },
            customChips: { tpuHours: 0, inferenceChips: 0 },
            modelHosting: { models: 0, requests: 0 },
            ragPipelines: { documents: 0, embeddings: 0 }
          },
          edge: {
            edgeLocations: 0,
            edgeCompute: 0,
            fiveGNetworking: { networkSlices: 0, privateNetworks: 0 },
            realTimeProcessing: 0
          },
          confidential: {
            secureEnclaves: 0,
            trustedExecution: 0,
            privacyPreservingAnalytics: 0,
            zeroTrustProcessing: 0
          },
          sustainability: {
            carbonFootprintTracking: false,
            renewableEnergyPreference: false,
            greenCloudOptimization: false,
            carbonOffsetCredits: 0
          },
          scenarios: {
            disasterRecovery: { enabled: false, rtoHours: 24, rpoMinutes: 240, backupRegions: 1 },
            compliance: { frameworks: [], auditLogging: false, dataResidency: 'global' as const },
            migration: { dataToMigrate: 0, applicationComplexity: 'moderate' as const }
          },
          optimization: {
            reservedInstanceStrategy: 'moderate' as const,
            spotInstanceTolerance: 10,
            autoScalingAggression: 'moderate' as const,
            costAlerts: { enabled: true, thresholdPercent: 20, notificationPreference: 'email' as const }
          }
        };
        
        // Calculate costs using the full requirements
        const costResults = costCalculator.calculateCosts(fullRequirements);
        
        // Create cost analysis with inventory link
        const savedCostAnalysis = await storage.createCostAnalysis({
          requirements: analysis.costRequirements,
          results: costResults,
          inventoryScanId: inventoryScan.id
        }, userId);
        
        costAnalysis = {
          analysisId: savedCostAnalysis.id,
          inventory: analysis.inventory,
          costRequirements: analysis.costRequirements,
          results: costResults,
          recommendations: analysis.recommendations
        };
      } catch (error) {
        console.error("Auto cost analysis error:", error);
        // Don't fail the scan if cost analysis fails
      }
      
      res.json({
        success: true,
        inventory,
        scanId: inventoryScan.id,
        costAnalysis: costAnalysis
      });
    } catch (error) {
      console.error("Inventory scan error:", error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Failed to scan cloud resources" 
      });
    }
  });


  // Get user inventory scans
  app.get("/api/inventory/scans", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const scans = await storage.getUserInventoryScans(userId);
      res.json(scans);
    } catch (error) {
      console.error("Get inventory scans error:", error);
      res.status(500).json({ message: "Failed to retrieve inventory scans" });
    }
  });

  // Generate cost analysis from inventory (protected)
  app.post("/api/inventory/analyze-costs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { inventory, scanId } = req.body;
      const analysis = await inventoryService.generateAutomaticCostAnalysis(inventory);
      
      // Convert inventory mapping to full requirements format
      const fullRequirements = {
        currency: 'USD' as const,
        licensing: {
          windows: { enabled: false, licenses: 0 },
          sqlServer: { enabled: false, edition: 'standard' as const, licenses: 0 },
          oracle: { enabled: false, edition: 'standard' as const, licenses: 0 },
          vmware: { enabled: false, licenses: 0 },
          redhat: { enabled: false, licenses: 0 },
          sap: { enabled: false, licenses: 0 },
          microsoftOffice365: { enabled: false, licenses: 0 }
        },
        compute: analysis.costRequirements.compute,
        storage: {
          ...analysis.costRequirements.storage,
          fileStorage: { size: 0, performanceMode: 'general-purpose' as const }
        },
        database: {
          ...analysis.costRequirements.database,
          nosql: { engine: 'none' as const, readCapacity: 0, writeCapacity: 0, storage: 0 },
          cache: { engine: 'none' as const, instanceClass: 'small' as const, nodes: 0 },
          dataWarehouse: { nodes: 0, nodeType: 'small' as const, storage: 0 }
        },
        networking: {
          ...analysis.costRequirements.networking,
          cdn: { enabled: false, requests: 0, dataTransfer: 0 },
          dns: { hostedZones: 0, queries: 0 },
          vpn: { connections: 0, hours: 0 }
        },
        analytics: {
          dataProcessing: { hours: 0, nodeType: 'small' as const },
          streaming: { shards: 0, records: 0 },
          businessIntelligence: { users: 0, queries: 0 }
        },
        ai: {
          training: { hours: 0, instanceType: 'cpu' as const },
          inference: { requests: 0, instanceType: 'cpu' as const },
          prebuilt: { imageAnalysis: 0, textProcessing: 0, speechServices: 0 }
        },
        security: {
          webFirewall: { enabled: false, requests: 0 },
          identityManagement: { users: 0, authentications: 0 },
          keyManagement: { keys: 0, operations: 0 },
          threatDetection: { enabled: false, events: 0 }
        },
        monitoring: {
          metrics: 0,
          logs: 0,
          traces: 0,
          alerts: 0
        },
        devops: {
          cicd: { buildMinutes: 0, parallelJobs: 0 },
          containerRegistry: { storage: 0, pulls: 0 },
          apiManagement: { requests: 0, endpoints: 0 }
        },
        backup: {
          storage: 0,
          frequency: 'daily' as const,
          retention: 30
        },
        iot: {
          devices: 0,
          messages: 0,
          dataProcessing: 0,
          edgeLocations: 0
        },
        media: {
          videoStreaming: { hours: 0, quality: '1080p' as const },
          transcoding: { minutes: 0, inputFormat: 'standard' as const }
        },
        quantum: {
          processingUnits: 0,
          quantumAlgorithms: 'optimization' as const,
          circuitComplexity: 'basic' as const
        },
        advancedAI: {
          vectorDatabase: { dimensions: 0, queries: 0 },
          customChips: { tpuHours: 0, inferenceChips: 0 },
          modelHosting: { models: 0, requests: 0 },
          ragPipelines: { documents: 0, embeddings: 0 }
        },
        edge: {
          edgeLocations: 0,
          edgeCompute: 0,
          fiveGNetworking: { networkSlices: 0, privateNetworks: 0 },
          realTimeProcessing: 0
        },
        confidential: {
          secureEnclaves: 0,
          trustedExecution: 0,
          privacyPreservingAnalytics: 0,
          zeroTrustProcessing: 0
        },
        sustainability: {
          carbonFootprintTracking: false,
          renewableEnergyPreference: false,
          greenCloudOptimization: false,
          carbonOffsetCredits: 0
        },
        scenarios: {
          disasterRecovery: { enabled: false, rtoHours: 24, rpoMinutes: 240, backupRegions: 1 },
          compliance: { frameworks: [], auditLogging: false, dataResidency: 'global' as const },
          migration: { dataToMigrate: 0, applicationComplexity: 'moderate' as const }
        },
        optimization: {
          reservedInstanceStrategy: 'moderate' as const,
          spotInstanceTolerance: 10,
          autoScalingAggression: 'moderate' as const,
          costAlerts: { enabled: true, thresholdPercent: 20, notificationPreference: 'email' as const }
        }
      };
      
      // Calculate costs using the full requirements
      const costResults = costCalculator.calculateCosts(fullRequirements);
      
      // Create cost analysis with inventory link
      const costAnalysis = await storage.createCostAnalysis({
        requirements: analysis.costRequirements,
        results: costResults,
        inventoryScanId: scanId
      }, userId);
      
      res.json({
        success: true,
        analysis: {
          inventory: analysis.inventory,
          costRequirements: analysis.costRequirements,
          results: costResults,
          recommendations: analysis.recommendations,
          analysisId: costAnalysis.id
        }
      });
    } catch (error) {
      console.error("Inventory cost analysis error:", error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Failed to analyze inventory costs" 
      });
    }
  });

  // Parse Terraform state file endpoint (protected)
  app.post("/api/terraform/parse", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { terraformState } = req.body;

      if (!terraformState) {
        return res.status(400).json({ 
          message: "Terraform state data is required" 
        });
      }

      // Parse the Terraform state
      const inventory = terraformParser.parseTerraformState(terraformState);
      
      // Save the inventory scan
      const inventoryScan = await storage.createInventoryScan({
        summary: inventory.summary,
        scanDuration: 0,
        scanData: inventory
      }, userId);

      // Automatically generate cost analysis
      let costAnalysis = null;
      try {
        const analysis = await inventoryService.generateAutomaticCostAnalysis(inventory);
        
        // Convert inventory mapping to full requirements format
        const fullRequirements = {
          currency: 'USD' as const,
          licensing: {
            windows: { enabled: false, licenses: 0 },
            sqlServer: { enabled: false, edition: 'standard' as const, licenses: 0 },
            oracle: { enabled: false, edition: 'standard' as const, licenses: 0 },
            vmware: { enabled: false, licenses: 0 },
            redhat: { enabled: false, licenses: 0 },
            sap: { enabled: false, licenses: 0 },
            microsoftOffice365: { enabled: false, licenses: 0 }
          },
          compute: analysis.costRequirements.compute,
          storage: {
            ...analysis.costRequirements.storage,
            fileStorage: { size: 0, performanceMode: 'general-purpose' as const }
          },
          database: {
            ...analysis.costRequirements.database,
            nosql: { engine: 'none' as const, readCapacity: 0, writeCapacity: 0, storage: 0 },
            cache: { engine: 'none' as const, instanceClass: 'small' as const, nodes: 0 },
            dataWarehouse: { nodes: 0, nodeType: 'small' as const, storage: 0 }
          },
          networking: {
            ...analysis.costRequirements.networking,
            cdn: { enabled: false, requests: 0, dataTransfer: 0 },
            dns: { hostedZones: 0, queries: 0 },
            vpn: { connections: 0, hours: 0 }
          },
          analytics: {
            dataProcessing: { hours: 0, nodeType: 'small' as const },
            streaming: { shards: 0, records: 0 },
            businessIntelligence: { users: 0, queries: 0 }
          },
          ai: {
            training: { hours: 0, instanceType: 'cpu' as const },
            inference: { requests: 0, instanceType: 'cpu' as const },
            prebuilt: { imageAnalysis: 0, textProcessing: 0, speechServices: 0 }
          },
          security: {
            webFirewall: { enabled: false, requests: 0 },
            identityManagement: { users: 0, authentications: 0 },
            keyManagement: { keys: 0, operations: 0 },
            threatDetection: { enabled: false, events: 0 }
          },
          monitoring: {
            metrics: 0,
            logs: 0,
            traces: 0,
            alerts: 0
          },
          devops: {
            cicd: { buildMinutes: 0, parallelJobs: 0 },
            containerRegistry: { storage: 0, pulls: 0 },
            apiManagement: { requests: 0, users: 0 }
          },
          backup: {
            storage: 0,
            frequency: 'daily' as const,
            retention: 30
          },
          iot: {
            devices: 0,
            messages: 0,
            dataProcessing: 0,
            edgeLocations: 0
          },
          media: {
            videoStreaming: { hours: 0, quality: '1080p' as const },
            transcoding: { minutes: 0, inputFormat: 'standard' as const }
          },
          quantum: {
            processingUnits: 0,
            quantumAlgorithms: 'optimization' as const,
            circuitComplexity: 'basic' as const
          },
          advancedAI: {
            vectorDatabase: { dimensions: 0, queries: 0 },
            customChips: { tpuHours: 0, inferenceChips: 0 },
            modelHosting: { models: 0, requests: 0 },
            ragPipelines: { documents: 0, embeddings: 0 }
          },
          edge: {
            edgeLocations: 0,
            edgeCompute: 0,
            fiveGNetworking: { networkSlices: 0, privateNetworks: 0 }
          },
          confidential: {
            secureEnclaves: 0,
            trustedExecution: 0,
            privacyPreservingAnalytics: 0,
            zeroTrustProcessing: 0
          },
          optimization: {
            reservedInstanceStrategy: 'moderate' as const,
            spotInstanceTolerance: 10,
            autoScalingAggression: 'moderate' as const,
            costAlerts: { enabled: true, thresholdPercent: 20, notificationPreference: 'email' as const }
          },
          sustainability: {
            carbonFootprintTracking: false,
            renewableEnergyPreference: false,
            greenCloudOptimization: false,
            carbonOffsetCredits: 0
          },
          scenarios: {
            disasterRecovery: { enabled: false, rtoHours: 24, rpoMinutes: 240, backupRegions: 1 },
            compliance: { frameworks: [], auditLogging: false, dataResidency: 'global' as const },
            migration: { dataToMigrate: 0, applicationComplexity: 'moderate' as const }
          }
        };

        const costResults = costCalculator.calculateCosts(fullRequirements);
        
        costAnalysis = await storage.createCostAnalysis({
          requirements: fullRequirements,
          results: costResults,
          inventoryScanId: inventoryScan.id
        }, userId);
      } catch (analysisError) {
        console.error("Automatic cost analysis failed:", analysisError);
      }

      res.json({
        success: true,
        inventory,
        scanId: inventoryScan.id,
        costAnalysis: costAnalysis ? {
          analysisId: costAnalysis.id,
          results: costAnalysis.results
        } : null
      });
    } catch (error) {
      console.error("Terraform parsing error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to parse Terraform state" 
      });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}

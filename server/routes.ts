import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { ComprehensiveCostCalculator } from "./utils/comprehensiveCostCalculator.js";
import { infrastructureRequirementsSchema, insertCloudCredentialSchema, insertInventoryScanSchema } from "@shared/schema";
import { CloudInventoryService, type InventoryScanRequest } from "./services/inventory-service.js";
import { setupAuth, isAuthenticated } from "./auth.js";

export async function registerRoutes(app: Express): Promise<Server> {
  const costCalculator = new ComprehensiveCostCalculator();
  const inventoryService = new CloudInventoryService();

  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Calculate costs endpoint (protected)
  app.post("/api/calculate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  // Inventory scanning endpoints (protected)
  app.post("/api/inventory/scan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const scanRequest: InventoryScanRequest = req.body;
      const startTime = Date.now();
      
      const inventory = await inventoryService.scanMultipleProviders(scanRequest);
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
      
      res.json({
        success: true,
        inventory,
        scanId: inventoryScan.id
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
        storage: analysis.costRequirements.storage,
        database: {
          ...analysis.costRequirements.database,
          nosql: { engine: 'none' as const, readCapacity: 0, writeCapacity: 0, storage: 0 },
          cache: { engine: 'none' as const, instanceClass: 'small' as const, nodes: 0 },
          dataWarehouse: { nodes: 0, nodeType: 'small' as const, storage: 0 }
        },
        networking: {
          ...analysis.costRequirements.networking,
          cdn: { enabled: false, requests: 0, dataTransfer: 0 }
        },
        ai: {
          models: { enabled: false, requests: 0, modelType: 'small' as const },
          mlPipelines: { enabled: false, pipelines: 0, computeHours: 0 },
          dataProcessing: { enabled: false, dataVolume: 0 }
        },
        analytics: {
          dataLakes: { enabled: false, storage: 0, queries: 0 },
          etl: { enabled: false, jobs: 0, dataVolume: 0 },
          reporting: { enabled: false, reports: 0, users: 0 }
        },
        monitoring: {
          logs: { enabled: false, volume: 0, retention: 30 },
          metrics: { enabled: false, dataPoints: 0 },
          alerts: { enabled: false, rules: 0 }
        },
        backup: {
          frequency: 'daily' as const,
          retention: { days: 30, weeks: 4, months: 12, years: 1 },
          crossRegion: false,
          dataVolume: 0
        },
        disaster: {
          enabled: false,
          rto: 4,
          rpo: 1,
          multiRegion: false,
          testing: 'quarterly' as const
        },
        compliance: {
          frameworks: [],
          dataResidency: 'flexible' as const,
          encryption: { atRest: true, inTransit: true },
          auditing: false
        },
        development: {
          environments: { dev: true, staging: true, prod: true },
          cicd: { enabled: false, builds: 0 },
          testing: { automated: false, load: false }
        },
        scenarios: {
          traffic: {
            baseline: { rps: 100, users: 1000, dataTransfer: 1000 },
            peak: { rps: 500, users: 5000, dataTransfer: 5000, duration: 2 },
            growth: { monthly: 10, annual: 100 }
          },
          availability: { sla: 99.9, downtime: 8.76 },
          performance: { latency: 200, throughput: 1000 },
          scaling: { auto: true, manual: false, predictive: false }
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

  // Validate cloud credentials (protected)
  app.post("/api/inventory/validate-credentials", isAuthenticated, async (req, res) => {
    try {
      const { provider, credentials } = req.body;
      
      // This is a basic validation - in production, you'd make a simple API call to verify
      let isValid = false;
      let message = "";

      switch (provider) {
        case 'aws':
          isValid = credentials.accessKeyId && credentials.secretAccessKey && credentials.region;
          message = isValid ? "AWS credentials are valid" : "Missing AWS credentials fields";
          break;
        case 'azure':
          isValid = credentials.clientId && credentials.clientSecret && credentials.tenantId && credentials.subscriptionId;
          message = isValid ? "Azure credentials are valid" : "Missing Azure credentials fields";
          break;
        case 'gcp':
          isValid = credentials.projectId && (credentials.keyFilename || credentials.credentials);
          message = isValid ? "GCP credentials are valid" : "Missing GCP credentials fields";
          break;
        default:
          isValid = false;
          message = "Unsupported cloud provider";
      }

      res.json({
        valid: isValid,
        message
      });
    } catch (error) {
      console.error("Credential validation error:", error);
      res.status(500).json({ 
        valid: false,
        message: "Failed to validate credentials" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

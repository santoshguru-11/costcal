import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ComprehensiveCostCalculator } from "./utils/comprehensiveCostCalculator";
import { infrastructureRequirementsSchema } from "@shared/schema";
import { CloudInventoryService, type InventoryScanRequest } from "./services/inventory-service.js";

export async function registerRoutes(app: Express): Promise<Server> {
  const costCalculator = new ComprehensiveCostCalculator();
  const inventoryService = new CloudInventoryService();

  // Calculate costs endpoint
  app.post("/api/calculate", async (req, res) => {
    try {
      const requirements = infrastructureRequirementsSchema.parse(req.body);
      const results = costCalculator.calculateCosts(requirements);
      
      // Save to storage
      const analysis = await storage.createCostAnalysis({
        requirements,
        results
      });

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

  // Get analysis by ID
  app.get("/api/analysis/:id", async (req, res) => {
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

  // Get all analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllCostAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Get analyses error:", error);
      res.status(500).json({ message: "Failed to retrieve analyses" });
    }
  });

  // Export results as CSV
  app.get("/api/export/:id/csv", async (req, res) => {
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

  // Inventory scanning endpoints
  app.post("/api/inventory/scan", async (req, res) => {
    try {
      const scanRequest: InventoryScanRequest = req.body;
      const inventory = await inventoryService.scanMultipleProviders(scanRequest);
      
      res.json({
        success: true,
        inventory
      });
    } catch (error) {
      console.error("Inventory scan error:", error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Failed to scan cloud resources" 
      });
    }
  });

  // Generate cost analysis from inventory
  app.post("/api/inventory/analyze-costs", async (req, res) => {
    try {
      const { inventory } = req.body;
      const analysis = await inventoryService.generateAutomaticCostAnalysis(inventory);
      
      res.json({
        success: true,
        analysis
      });
    } catch (error) {
      console.error("Inventory cost analysis error:", error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Failed to analyze inventory costs" 
      });
    }
  });

  // Validate cloud credentials
  app.post("/api/inventory/validate-credentials", async (req, res) => {
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

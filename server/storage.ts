import { type CostAnalysis, type InsertCostAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getCostAnalysis(id: string): Promise<CostAnalysis | undefined>;
  createCostAnalysis(analysis: InsertCostAnalysis): Promise<CostAnalysis>;
  getAllCostAnalyses(): Promise<CostAnalysis[]>;
}

export class MemStorage implements IStorage {
  private analyses: Map<string, CostAnalysis>;

  constructor() {
    this.analyses = new Map();
  }

  async getCostAnalysis(id: string): Promise<CostAnalysis | undefined> {
    return this.analyses.get(id);
  }

  async createCostAnalysis(insertAnalysis: InsertCostAnalysis): Promise<CostAnalysis> {
    const id = randomUUID();
    const analysis: CostAnalysis = { 
      ...insertAnalysis, 
      id, 
      createdAt: new Date().toISOString()
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getAllCostAnalyses(): Promise<CostAnalysis[]> {
    return Array.from(this.analyses.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }
}

export const storage = new MemStorage();

import { pgTable, text, varchar, integer, decimal, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const costAnalyses = pgTable("cost_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requirements: jsonb("requirements").notNull(),
  results: jsonb("results").notNull(),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertCostAnalysisSchema = createInsertSchema(costAnalyses).pick({
  requirements: true,
  results: true,
});

export type InsertCostAnalysis = z.infer<typeof insertCostAnalysisSchema>;
export type CostAnalysis = typeof costAnalyses.$inferSelect;

// Frontend-specific schemas for form validation
export const infrastructureRequirementsSchema = z.object({
  compute: z.object({
    vcpus: z.number().min(1).max(128),
    ram: z.number().min(1).max(1024),
    instanceType: z.enum(['general-purpose', 'compute-optimized', 'memory-optimized', 'storage-optimized']),
    region: z.string().min(1),
  }),
  storage: z.object({
    size: z.number().min(1).max(100000),
    type: z.enum(['ssd-gp3', 'ssd-io2', 'hdd-st1', 'cold-storage']),
  }),
  database: z.object({
    engine: z.enum(['mysql', 'postgresql', 'mongodb', 'redis']),
    size: z.number().min(1).max(10000),
  }),
  networking: z.object({
    bandwidth: z.number().min(1).max(100000),
    loadBalancer: z.enum(['none', 'application', 'network']),
  }),
});

export type InfrastructureRequirements = z.infer<typeof infrastructureRequirementsSchema>;

export interface CloudProvider {
  name: string;
  compute: number;
  storage: number;
  database: number;
  networking: number;
  total: number;
}

export interface CostCalculationResult {
  providers: CloudProvider[];
  cheapest: CloudProvider;
  mostExpensive: CloudProvider;
  potentialSavings: number;
  multiCloudOption: {
    cost: number;
    breakdown: Record<string, string>;
  };
  recommendations: {
    singleCloud: string;
    multiCloud: string;
  };
}

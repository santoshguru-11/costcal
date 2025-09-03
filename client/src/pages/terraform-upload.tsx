import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { UploadIcon, FileIcon, CheckCircleIcon } from "lucide-react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";

export default function TerraformUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (terraformState: any) => {
      return await apiRequest("/api/inventory/analyze-costs", "POST", {
        inventory: terraformState.inventory,
        scanId: terraformState.scanId
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
      toast({
        title: "Success",
        description: "Terraform state analyzed successfully",
      });
      if (data?.analysis?.analysisId) {
        navigate(`/results/${data.analysis.analysisId}`);
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to analyze Terraform state",
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.tfstate') && !file.name.endsWith('.json')) {
      toast({
        title: "Invalid File",
        description: "Please select a .tfstate or .json file",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
    setUploadResult(null);
  };

  const parseAndAnalyzeTerraform = async () => {
    if (!selectedFile) return;

    try {
      const fileContent = await selectedFile.text();
      const terraformState = JSON.parse(fileContent);
      
      // Convert Terraform state to inventory format
      const inventory = parseTerraformState(terraformState);
      
      // Create a simulated scan result
      const mockScanResult = {
        scanId: `terraform-${Date.now()}`,
        inventory
      };
      
      setUploadResult(mockScanResult);
      
      toast({
        title: "File Parsed",
        description: `Found ${inventory.resources?.length || 0} resources in Terraform state`,
      });
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to parse Terraform state file. Please check the file format.",
        variant: "destructive",
      });
    }
  };

  const parseTerraformState = (tfState: any) => {
    const resources: any[] = [];
    
    if (tfState.resources) {
      tfState.resources.forEach((resource: any) => {
        if (resource.instances) {
          resource.instances.forEach((instance: any) => {
            const attributes = instance.attributes || {};
            
            // Map Terraform resources to unified format
            const unifiedResource = {
              id: attributes.id || resource.name,
              name: attributes.name || resource.name,
              type: mapTerraformType(resource.type),
              service: mapTerraformService(resource.type),
              region: attributes.region || attributes.availability_zone || 'unknown',
              provider: mapTerraformProvider(resource.provider),
              status: 'active',
              costDetails: extractCostDetails(resource.type, attributes),
              tags: attributes.tags || {},
              metadata: {
                terraformType: resource.type,
                terraformAddress: resource.address || `${resource.type}.${resource.name}`
              }
            };
            
            resources.push(unifiedResource);
          });
        }
      });
    }
    
    return {
      resources,
      summary: {
        totalResources: resources.length,
        providers: Array.from(new Set(resources.map(r => r.provider))),
        services: Array.from(new Set(resources.map(r => r.service))),
        regions: Array.from(new Set(resources.map(r => r.region)))
      },
      scanTime: new Date().toISOString(),
      source: 'terraform'
    };
  };

  const mapTerraformType = (tfType: string) => {
    const typeMap: Record<string, string> = {
      'aws_instance': 'Instance',
      'aws_s3_bucket': 'Bucket',
      'aws_rds_instance': 'Database',
      'aws_lb': 'LoadBalancer',
      'aws_ebs_volume': 'Volume',
      'azurerm_virtual_machine': 'Instance',
      'azurerm_storage_account': 'StorageAccount',
      'azurerm_sql_database': 'Database',
      'google_compute_instance': 'Instance',
      'google_storage_bucket': 'Bucket',
      'google_sql_database_instance': 'Database'
    };
    return typeMap[tfType] || 'Unknown';
  };

  const mapTerraformService = (tfType: string) => {
    if (tfType.includes('instance') || tfType.includes('vm')) return 'Compute';
    if (tfType.includes('s3') || tfType.includes('storage')) return 'Storage';
    if (tfType.includes('rds') || tfType.includes('sql')) return 'Database';
    if (tfType.includes('lb') || tfType.includes('load')) return 'LoadBalancer';
    return 'Other';
  };

  const mapTerraformProvider = (provider: string) => {
    if (provider?.includes('aws')) return 'aws';
    if (provider?.includes('azurerm')) return 'azure';
    if (provider?.includes('google')) return 'gcp';
    return 'unknown';
  };

  const extractCostDetails = (tfType: string, attributes: any) => {
    const details: any = {};
    
    if (tfType.includes('instance')) {
      details.vcpus = getInstanceVCPUs(attributes.instance_type);
      details.memory = getInstanceMemory(attributes.instance_type);
      details.instanceType = attributes.instance_type;
    }
    
    if (tfType.includes('storage') || tfType.includes('ebs')) {
      details.storage = attributes.size || attributes.allocated_storage || 0;
      details.storageType = attributes.type || attributes.storage_type;
    }
    
    return details;
  };

  const getInstanceVCPUs = (instanceType: string) => {
    const vcpuMap: Record<string, number> = {
      't2.micro': 1, 't2.small': 1, 't2.medium': 2, 't2.large': 2,
      'm5.large': 2, 'm5.xlarge': 4, 'm5.2xlarge': 8,
      'Standard_B1s': 1, 'Standard_B2s': 2, 'Standard_D2s_v3': 2
    };
    return vcpuMap[instanceType] || 2;
  };

  const getInstanceMemory = (instanceType: string) => {
    const memoryMap: Record<string, number> = {
      't2.micro': 1, 't2.small': 2, 't2.medium': 4, 't2.large': 8,
      'm5.large': 8, 'm5.xlarge': 16, 'm5.2xlarge': 32,
      'Standard_B1s': 1, 'Standard_B2s': 4, 'Standard_D2s_v3': 8
    };
    return memoryMap[instanceType] || 4;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Terraform State Upload - Cloud Cost Optimizer</title>
        <meta name="description" content="Upload your Terraform state files to automatically analyze your infrastructure and calculate cloud costs." />
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Terraform State Analysis</h1>
        <p className="text-gray-600">
          Upload your Terraform state file (.tfstate) to automatically analyze your infrastructure and calculate costs.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="h-5 w-5" />
              Upload Terraform State File
            </CardTitle>
            <CardDescription>
              Upload a .tfstate file to parse your infrastructure resources and calculate costs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              data-testid="drop-zone"
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <FileIcon className="h-12 w-12 text-green-600 mx-auto" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={parseAndAnalyzeTerraform} data-testid="button-parse">
                      Parse & Analyze
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadResult(null);
                      }}
                      data-testid="button-clear"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <UploadIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium">Drop your .tfstate file here</p>
                    <p className="text-gray-500">or click to browse</p>
                  </div>
                  <input
                    type="file"
                    accept=".tfstate,.json"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="file-input"
                    data-testid="input-file"
                  />
                  <Button asChild>
                    <label htmlFor="file-input" className="cursor-pointer">
                      Browse Files
                    </label>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {uploadResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                Parsed Resources
              </CardTitle>
              <CardDescription>
                Resources found in your Terraform state file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {uploadResult.inventory.summary.totalResources}
                  </div>
                  <div className="text-sm text-gray-600">Total Resources</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {uploadResult.inventory.summary.providers.length}
                  </div>
                  <div className="text-sm text-gray-600">Providers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {uploadResult.inventory.summary.services.length}
                  </div>
                  <div className="text-sm text-gray-600">Services</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {uploadResult.inventory.summary.regions.length}
                  </div>
                  <div className="text-sm text-gray-600">Regions</div>
                </div>
              </div>

              <Button
                onClick={() => analyzeMutation.mutate(uploadResult)}
                disabled={analyzeMutation.isPending}
                size="lg"
                className="w-full"
                data-testid="button-analyze-costs"
              >
                {analyzeMutation.isPending ? "Analyzing Costs..." : "Analyze Costs"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
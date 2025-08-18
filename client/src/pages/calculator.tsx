import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Search, Star, Plus, Settings, BarChart3, Cog, X } from "lucide-react";
import { Cloud, Database, Cpu, Network } from "lucide-react";

interface Service {
  name: string;
  provider: string;
  type: string;
  subtype: string;
  processor?: string;
  localDisk?: string;
  description: string;
  startingPrice: string;
  icon: string;
}

interface ServiceConfiguration {
  service: Service;
  // Compute Configuration
  instanceType?: string;
  vCPUs?: number;
  memory?: number;
  operatingSystem?: string;
  usage?: number;
  // Storage Configuration  
  storageType?: string;
  capacity?: number;
  iops?: number;
  throughput?: number;
  // Database Configuration
  engine?: string;
  instanceClass?: string;
  multiAZ?: boolean;
  backupRetention?: number;
  // Networking Configuration
  dataTransfer?: number;
  loadBalancer?: boolean;
  // Advanced Options
  region?: string;
  reservationType?: string;
  customMonthlyCost?: number;
}

export default function Calculator() {
  const [selectedTab, setSelectedTab] = useState("services");
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [estimateName, setEstimateName] = useState("My Estimate");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [configurationModal, setConfigurationModal] = useState<Service | null>(null);
  const [serviceConfigurations, setServiceConfigurations] = useState<ServiceConfiguration[]>([]);

  const services: Service[] = [
    // Compute Services
    {
      name: "EC2 Instances",
      provider: "AWS",
      type: "Compute",
      subtype: "Virtual Machine",
      processor: "Intel/AMD",
      description: "Scalable virtual compute capacity in the cloud",
      startingPrice: "$0.0096/hour",
      icon: "aws"
    },
    {
      name: "Virtual Machines",
      provider: "Azure",
      type: "Compute",
      subtype: "Virtual Machine", 
      processor: "Intel/AMD",
      description: "On-demand, scalable computing resources",
      startingPrice: "$0.008/hour",
      icon: "azure"
    },
    {
      name: "Compute Engine",
      provider: "GCP",
      type: "Compute",
      subtype: "Virtual Machine",
      processor: "Intel/AMD",
      description: "Secure and customizable compute service",
      startingPrice: "$0.01/hour", 
      icon: "gcp"
    },
    {
      name: "VM.Standard.E5.Flex",
      provider: "Oracle Cloud",
      type: "Compute",
      subtype: "Flexible VM",
      processor: "AMD",
      localDisk: "Block storage only",
      description: "High-performance flexible virtual machines",
      startingPrice: "$0.006/OCPU/hour",
      icon: "oracle"
    },
    
    // Storage Services
    {
      name: "S3 Object Storage",
      provider: "AWS",
      type: "Storage", 
      subtype: "Object Storage",
      description: "Industry-leading scalability, data availability and security",
      startingPrice: "$0.023/GB/month",
      icon: "aws"
    },
    {
      name: "Blob Storage",
      provider: "Azure",
      type: "Storage",
      subtype: "Object Storage", 
      description: "Massively scalable object storage for unstructured data",
      startingPrice: "$0.018/GB/month",
      icon: "azure"
    },
    {
      name: "Cloud Storage",
      provider: "GCP", 
      type: "Storage",
      subtype: "Object Storage",
      description: "Unified object storage for developers and enterprises",
      startingPrice: "$0.020/GB/month",
      icon: "gcp"
    },
    {
      name: "Object Storage",
      provider: "Oracle Cloud",
      type: "Storage",
      subtype: "Object Storage",
      description: "Store any type of data in its native format",
      startingPrice: "$0.0255/GB/month", 
      icon: "oracle"
    },

    // Database Services
    {
      name: "RDS",
      provider: "AWS",
      type: "Database",
      subtype: "Managed Database",
      description: "Managed relational database service",
      startingPrice: "$0.017/hour",
      icon: "aws"
    },
    {
      name: "Azure SQL Database",
      provider: "Azure",
      type: "Database",
      subtype: "Managed Database",
      description: "Fully managed intelligent database service",
      startingPrice: "$0.52/vCore/hour",
      icon: "azure"
    },
    {
      name: "Cloud SQL",
      provider: "GCP",
      type: "Database",
      subtype: "Managed Database", 
      description: "Fully managed relational database service",
      startingPrice: "$0.0150/hour",
      icon: "gcp"
    },
    {
      name: "Autonomous Database",
      provider: "Oracle Cloud",
      type: "Database",
      subtype: "Autonomous Database",
      description: "Self-driving, self-securing, self-repairing database",
      startingPrice: "$2.70/OCPU/hour",
      icon: "oracle"
    },

    // AI/ML Services
    {
      name: "SageMaker",
      provider: "AWS", 
      type: "AI/ML",
      subtype: "Machine Learning",
      description: "Fully managed machine learning platform",
      startingPrice: "$0.05/hour",
      icon: "aws"
    },
    {
      name: "Machine Learning Studio",
      provider: "Azure",
      type: "AI/ML",
      subtype: "Machine Learning",
      description: "Drag-and-drop machine learning tool",
      startingPrice: "$0.14/hour",
      icon: "azure"
    },
    {
      name: "AI Platform",
      provider: "GCP",
      type: "AI/ML", 
      subtype: "Machine Learning",
      description: "End-to-end machine learning platform",
      startingPrice: "$0.39/hour",
      icon: "gcp"
    },
    {
      name: "Data Science",
      provider: "Oracle Cloud",
      type: "AI/ML",
      subtype: "Data Science Platform",
      description: "Collaborative data science platform",
      startingPrice: "$2.25/OCPU/hour",
      icon: "oracle"
    },

    // Networking Services
    {
      name: "VPC",
      provider: "AWS",
      type: "Networking",
      subtype: "Virtual Network",
      description: "Isolated cloud resources in virtual network",
      startingPrice: "$0.045/hour",
      icon: "aws"
    },
    {
      name: "Virtual Network", 
      provider: "Azure",
      type: "Networking",
      subtype: "Virtual Network",
      description: "Private network in Azure cloud",
      startingPrice: "$0.04/hour",
      icon: "azure"
    },
    {
      name: "VPC Network",
      provider: "GCP",
      type: "Networking", 
      subtype: "Virtual Network",
      description: "Global virtual network across regions",
      startingPrice: "$0.01/hour",
      icon: "gcp"
    },
    {
      name: "Virtual Cloud Network",
      provider: "Oracle Cloud",
      type: "Networking",
      subtype: "Virtual Network", 
      description: "Software-defined network in Oracle Cloud",
      startingPrice: "Free",
      icon: "oracle"
    }
  ];

  const referenceArchitectures = [
    {
      name: "Web Application (3-Tier)",
      description: "Complete web application infrastructure with load balancer, compute instances, and managed database",
      size: "Small/Medium/Large",
      estimatedCost: "$180-$850/month"
    },
    {
      name: "Data Analytics Pipeline", 
      description: "Big data processing with data lake, analytics engine, and machine learning capabilities",
      size: "Small/Medium/Large",
      estimatedCost: "$420-$2100/month"
    },
    {
      name: "AI/ML Development Platform",
      description: "Complete machine learning environment with GPUs, data storage, and model deployment",
      size: "Small/Medium/Large", 
      estimatedCost: "$650-$3200/month"
    },
    {
      name: "Enterprise Database Solution",
      description: "High-availability database with backup, monitoring, and disaster recovery",
      size: "Small/Medium/Large",
      estimatedCost: "$320-$1800/month"
    }
  ];



  const computeShapes = [
    {
      name: "VM.Standard.E5.Flex",
      processor: "AMD",
      type: "VM",
      subtype: "Flexible",
      localDisk: "Block storage only",
      provider: "Oracle Cloud"
    },
    {
      name: "VM.DenseIO.E5.Flex", 
      processor: "AMD",
      type: "VM",
      subtype: "Flexible",
      localDisk: "6.8TB, 13.6TB, 20.4TB, 27.2TB, 34TB or 40.8TB NVMe SSD",
      provider: "Oracle Cloud"
    },
    {
      name: "m5.large",
      processor: "Intel",
      type: "General Purpose",
      subtype: "Balanced compute, memory, and networking",
      localDisk: "EBS-only",
      provider: "AWS"
    },
    {
      name: "Standard_D2s_v3",
      processor: "Intel",
      type: "General Purpose",
      subtype: "Balanced CPU-to-memory ratio",
      localDisk: "Temporary storage",
      provider: "Azure"
    },
    {
      name: "n2-standard-2",
      processor: "Intel/AMD",
      type: "General Purpose",
      subtype: "Balanced performance for most workloads",
      localDisk: "Persistent disk",
      provider: "GCP"
    }
  ];

  const openServiceConfiguration = (service: Service) => {
    setConfigurationModal(service);
  };

  const addConfiguredService = (config: ServiceConfiguration) => {
    setServiceConfigurations([...serviceConfigurations, config]);
    setSelectedServices([...selectedServices, config.service]);
    // Calculate cost based on configuration
    const monthlyCost = config.customMonthlyCost || calculateServiceCost(config);
    setEstimatedCost(estimatedCost + monthlyCost);
    setConfigurationModal(null);
  };

  const calculateServiceCost = (config: ServiceConfiguration): number => {
    const basePrice = parseFloat(config.service.startingPrice.match(/\d+\.?\d*/)?.[0] || "0");
    let multiplier = 1;

    // Apply configuration-based multipliers
    if (config.vCPUs) multiplier *= config.vCPUs;
    if (config.memory) multiplier *= (config.memory / 4); // Assume 4GB base
    if (config.capacity) multiplier *= (config.capacity / 100); // Assume 100GB base
    if (config.usage) multiplier *= (config.usage / 100); // Usage percentage

    // Apply service type specific calculations
    switch (config.service.type.toLowerCase()) {
      case "compute":
        return basePrice * multiplier * 24 * 30; // Convert hourly to monthly
      case "storage":
        return basePrice * (config.capacity || 100); // Price per GB
      case "database":
        return basePrice * multiplier * 24 * 30;
      default:
        return basePrice * 30; // Default monthly calculation
    }
  };

  const addService = (service: Service) => {
    // Open configuration modal instead of directly adding
    openServiceConfiguration(service);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>Cloud Cost Estimator - Multi-Cloud Infrastructure Calculator</title>
        <meta name="description" content="Professional cloud cost estimator for AWS, Azure, GCP, and Oracle Cloud. Calculate infrastructure costs with reference architectures and detailed service configurations." />
      </Helmet>

      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Cloud Cost Estimator</h1>
            <div className="flex items-center space-x-4">
              <Button variant="outline">Send to Sales</Button>
              <Button>Start for Free</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{estimateName}</span>
                  <Settings className="w-4 h-4 text-gray-500" />
                </CardTitle>
                <p className="text-sm text-gray-600">Configure and estimate costs for cloud services</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">${estimatedCost.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Estimated Monthly Cost</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Time Frame</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <Input placeholder="Start Date" className="text-sm" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <Input placeholder="End Date" className="text-sm" />
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="pt-4 border-t">
                  <nav className="space-y-1">
                    {[
                      { id: "services", label: "Services", icon: Settings },
                      { id: "shapes", label: "Compute Shapes", icon: BarChart3 },
                      { id: "architectures", label: "Reference Architectures", icon: Plus },
                      { id: "favorites", label: "My Favorites", icon: Star }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedTab === tab.id 
                            ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700" 
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedTab === "services" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Cloud Services Catalog</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Search className="w-4 h-4 text-gray-500" />
                      <Input placeholder="Search services..." className="w-64" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Service Name</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Provider</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Subtype</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Starting Price</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((service, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                {getProviderIcon(service.provider, service.type)}
                                <div>
                                  <div className="font-medium text-gray-900">{service.name}</div>
                                  <div className="text-sm text-gray-600">{service.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-700">{service.provider}</td>
                            <td className="py-4 px-4">
                              <Badge variant="secondary">{service.type}</Badge>
                            </td>
                            <td className="py-4 px-4 text-gray-700">{service.subtype}</td>
                            <td className="py-4 px-4 font-medium text-gray-900">{service.startingPrice}</td>
                            <td className="py-4 px-4">
                              <Button 
                                size="sm" 
                                onClick={() => addService(service)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Add
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedTab === "shapes" && (
              <Card>
                <CardHeader>
                  <CardTitle>Compute Shapes</CardTitle>
                  <p className="text-sm text-gray-600">Virtual machine configurations across providers</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Processor</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Subtype</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Local Disk</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {computeShapes.map((shape, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                {getProviderIcon(shape.provider, "compute")}
                                <div className="font-medium text-gray-900">{shape.name}</div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-700">{shape.processor}</td>
                            <td className="py-4 px-4">
                              <Badge variant="secondary">{shape.type}</Badge>
                            </td>
                            <td className="py-4 px-4 text-gray-700">{shape.subtype}</td>
                            <td className="py-4 px-4 text-sm text-gray-600">{shape.localDisk}</td>
                            <td className="py-4 px-4">
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Add
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedTab === "architectures" && (
              <Card>
                <CardHeader>
                  <CardTitle>Reference Architectures</CardTitle>
                  <p className="text-sm text-gray-600">Pre-configured solutions for common use cases</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {referenceArchitectures.map((arch, index) => (
                      <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{arch.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{arch.description}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-500">Configuration: {arch.size}</div>
                            <div className="text-lg font-semibold text-blue-600">{arch.estimatedCost}</div>
                          </div>
                          <Button size="sm" variant="outline">
                            Load
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedTab === "favorites" && (
              <Card>
                <CardHeader>
                  <CardTitle>My Favorites</CardTitle>
                  <p className="text-sm text-gray-600">Favorites are stored in browser local storage</p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">There are no favorites stored yet.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Services Summary */}
            {selectedServices.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Selected Services ({selectedServices.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedServices.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getProviderIcon(service.provider, service.type)}
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-gray-600">{service.provider} • {service.type}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{service.startingPrice}</div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              const newServices = selectedServices.filter((_, i) => i !== index);
                              setSelectedServices(newServices);
                              // Recalculate cost
                              const totalCost = newServices.reduce((sum, s) => {
                                const cost = parseFloat(s.startingPrice.match(/\d+\.?\d*/)?.[0] || "0") * 24 * 30;
                                return sum + cost;
                              }, 0);
                              setEstimatedCost(totalCost);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Service Configuration Modal */}
        {configurationModal && (
          <ServiceConfigurationModal
            service={configurationModal}
            onSave={addConfiguredService}
            onClose={() => setConfigurationModal(null)}
          />
        )}
      </div>
    </div>
  );
}

// Service Configuration Modal Component
function ServiceConfigurationModal({ 
  service, 
  onSave, 
  onClose 
}: { 
  service: Service;
  onSave: (config: ServiceConfiguration) => void;
  onClose: () => void;
}) {
  const [config, setConfig] = useState<ServiceConfiguration>({
    service,
    region: "us-east-1",
    reservationType: "on-demand",
    vCPUs: 2,
    memory: 8,
    usage: 80,
    capacity: 100,
    operatingSystem: "linux"
  });

  const handleSave = () => {
    onSave(config);
  };

  const renderComputeConfig = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium">Instance Type</Label>
        <Select value={config.instanceType} onValueChange={(value) => setConfig({...config, instanceType: value})}>
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="Select instance type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="t3.micro">t3.micro (1 vCPU, 1GB RAM)</SelectItem>
            <SelectItem value="t3.small">t3.small (2 vCPU, 2GB RAM)</SelectItem>
            <SelectItem value="t3.medium">t3.medium (2 vCPU, 4GB RAM)</SelectItem>
            <SelectItem value="m5.large">m5.large (2 vCPU, 8GB RAM)</SelectItem>
            <SelectItem value="m5.xlarge">m5.xlarge (4 vCPU, 16GB RAM)</SelectItem>
            <SelectItem value="c5.large">c5.large (2 vCPU, 4GB RAM) - Compute Optimized</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">vCPUs: {config.vCPUs}</Label>
        <Slider
          value={[config.vCPUs || 2]}
          onValueChange={(value) => setConfig({...config, vCPUs: value[0]})}
          max={32}
          min={1}
          step={1}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium">Memory (GB): {config.memory}</Label>
        <Slider
          value={[config.memory || 8]}
          onValueChange={(value) => setConfig({...config, memory: value[0]})}
          max={128}
          min={1}
          step={1}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium">Operating System</Label>
        <Select value={config.operatingSystem} onValueChange={(value) => setConfig({...config, operatingSystem: value})}>
          <SelectTrigger className="w-full mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linux">Linux</SelectItem>
            <SelectItem value="windows">Windows Server</SelectItem>
            <SelectItem value="rhel">Red Hat Enterprise Linux</SelectItem>
            <SelectItem value="suse">SUSE Linux</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Monthly Usage (%): {config.usage}</Label>
        <Slider
          value={[config.usage || 80]}
          onValueChange={(value) => setConfig({...config, usage: value[0]})}
          max={100}
          min={1}
          step={1}
          className="mt-2"
        />
        <div className="text-xs text-gray-500 mt-1">
          {Math.round(((config.usage || 80) / 100) * 24 * 30)} hours/month
        </div>
      </div>
    </div>
  );

  const renderStorageConfig = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium">Storage Type</Label>
        <Select value={config.storageType} onValueChange={(value) => setConfig({...config, storageType: value})}>
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="Select storage type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard (HDD)</SelectItem>
            <SelectItem value="gp3">General Purpose SSD (gp3)</SelectItem>
            <SelectItem value="gp2">General Purpose SSD (gp2)</SelectItem>
            <SelectItem value="io2">Provisioned IOPS SSD (io2)</SelectItem>
            <SelectItem value="st1">Throughput Optimized HDD</SelectItem>
            <SelectItem value="sc1">Cold HDD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Capacity (GB): {config.capacity}</Label>
        <Slider
          value={[config.capacity || 100]}
          onValueChange={(value) => setConfig({...config, capacity: value[0]})}
          max={10000}
          min={1}
          step={10}
          className="mt-2"
        />
      </div>

      {(config.storageType === "io2" || config.storageType === "gp3") && (
        <div>
          <Label className="text-sm font-medium">IOPS: {config.iops || 3000}</Label>
          <Slider
            value={[config.iops || 3000]}
            onValueChange={(value) => setConfig({...config, iops: value[0]})}
            max={16000}
            min={100}
            step={100}
            className="mt-2"
          />
        </div>
      )}

      {config.storageType === "gp3" && (
        <div>
          <Label className="text-sm font-medium">Throughput (MB/s): {config.throughput || 125}</Label>
          <Slider
            value={[config.throughput || 125]}
            onValueChange={(value) => setConfig({...config, throughput: value[0]})}
            max={1000}
            min={125}
            step={25}
            className="mt-2"
          />
        </div>
      )}
    </div>
  );

  const renderDatabaseConfig = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium">Database Engine</Label>
        <Select value={config.engine} onValueChange={(value) => setConfig({...config, engine: value})}>
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="Select database engine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mysql">MySQL</SelectItem>
            <SelectItem value="postgresql">PostgreSQL</SelectItem>
            <SelectItem value="oracle">Oracle Database</SelectItem>
            <SelectItem value="sqlserver">SQL Server</SelectItem>
            <SelectItem value="aurora">Aurora (MySQL/PostgreSQL)</SelectItem>
            <SelectItem value="mariadb">MariaDB</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Instance Class</Label>
        <Select value={config.instanceClass} onValueChange={(value) => setConfig({...config, instanceClass: value})}>
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="Select instance class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="db.t3.micro">db.t3.micro (1 vCPU, 1GB)</SelectItem>
            <SelectItem value="db.t3.small">db.t3.small (2 vCPU, 2GB)</SelectItem>
            <SelectItem value="db.t3.medium">db.t3.medium (2 vCPU, 4GB)</SelectItem>
            <SelectItem value="db.m5.large">db.m5.large (2 vCPU, 8GB)</SelectItem>
            <SelectItem value="db.m5.xlarge">db.m5.xlarge (4 vCPU, 16GB)</SelectItem>
            <SelectItem value="db.r5.large">db.r5.large (2 vCPU, 16GB) - Memory Optimized</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Storage (GB): {config.capacity}</Label>
        <Slider
          value={[config.capacity || 100]}
          onValueChange={(value) => setConfig({...config, capacity: value[0]})}
          max={5000}
          min={20}
          step={10}
          className="mt-2"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="multiAZ"
          checked={config.multiAZ || false}
          onChange={(e) => setConfig({...config, multiAZ: e.target.checked})}
        />
        <Label htmlFor="multiAZ" className="text-sm">Multi-AZ Deployment (+100% cost)</Label>
      </div>

      <div>
        <Label className="text-sm font-medium">Backup Retention (days): {config.backupRetention || 7}</Label>
        <Slider
          value={[config.backupRetention || 7]}
          onValueChange={(value) => setConfig({...config, backupRetention: value[0]})}
          max={35}
          min={1}
          step={1}
          className="mt-2"
        />
      </div>
    </div>
  );

  const renderNetworkingConfig = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium">Data Transfer (GB/month): {config.dataTransfer || 100}</Label>
        <Slider
          value={[config.dataTransfer || 100]}
          onValueChange={(value) => setConfig({...config, dataTransfer: value[0]})}
          max={10000}
          min={1}
          step={10}
          className="mt-2"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="loadBalancer"
          checked={config.loadBalancer || false}
          onChange={(e) => setConfig({...config, loadBalancer: e.target.checked})}
        />
        <Label htmlFor="loadBalancer" className="text-sm">Include Load Balancer (+$20/month)</Label>
      </div>
    </div>
  );

  const getEstimatedCost = () => {
    const basePrice = parseFloat(service.startingPrice.match(/\d+\.?\d*/)?.[0] || "0");
    let monthlyCost = 0;

    switch (service.type.toLowerCase()) {
      case "compute":
        monthlyCost = basePrice * (config.vCPUs || 2) * (config.memory || 8) / 4 * ((config.usage || 80) / 100) * 24 * 30;
        break;
      case "storage":
        monthlyCost = basePrice * (config.capacity || 100);
        if (config.iops && config.iops > 3000) monthlyCost += (config.iops - 3000) * 0.065;
        break;
      case "database":
        monthlyCost = basePrice * 24 * 30;
        if (config.multiAZ) monthlyCost *= 2;
        monthlyCost += (config.capacity || 100) * 0.115; // Add storage cost
        break;
      case "networking":
        monthlyCost = (config.dataTransfer || 100) * 0.09;
        if (config.loadBalancer) monthlyCost += 20;
        break;
      default:
        monthlyCost = basePrice * 30;
    }

    return Math.round(monthlyCost * 100) / 100;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Configure {service.name}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Provider and Service Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getProviderIcon(service.provider, service.type)}
              <div>
                <div className="font-medium">{service.name}</div>
                <div className="text-sm text-gray-600">{service.description}</div>
              </div>
            </div>
            <Badge variant="outline">{service.provider}</Badge>
          </div>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {/* Region Selection */}
              <div>
                <Label className="text-sm font-medium">Region</Label>
                <Select value={config.region} onValueChange={(value) => setConfig({...config, region: value})}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                    <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                    <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                    <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                    <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Service-specific configuration */}
              {service.type.toLowerCase() === "compute" && renderComputeConfig()}
              {service.type.toLowerCase() === "storage" && renderStorageConfig()}
              {service.type.toLowerCase() === "database" && renderDatabaseConfig()}
              {service.type.toLowerCase() === "networking" && renderNetworkingConfig()}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Reservation Type</Label>
                <Select value={config.reservationType} onValueChange={(value) => setConfig({...config, reservationType: value})}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on-demand">On-Demand</SelectItem>
                    <SelectItem value="reserved-1yr">Reserved (1 year) - 30% discount</SelectItem>
                    <SelectItem value="reserved-3yr">Reserved (3 year) - 50% discount</SelectItem>
                    <SelectItem value="spot">Spot Instance - 60% discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Custom Monthly Cost Override</Label>
                <Input
                  type="number"
                  placeholder="Leave empty for auto-calculation"
                  value={config.customMonthlyCost || ""}
                  onChange={(e) => setConfig({...config, customMonthlyCost: e.target.value ? parseFloat(e.target.value) : undefined})}
                  className="mt-2"
                />
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div className="p-6 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">${getEstimatedCost()}</div>
                  <div className="text-sm text-gray-600">Estimated Monthly Cost</div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Cost:</span>
                    <span>{service.startingPrice}</span>
                  </div>
                  {service.type.toLowerCase() === "compute" && (
                    <>
                      <div className="flex justify-between">
                        <span>vCPUs × Memory:</span>
                        <span>{config.vCPUs} × {config.memory}GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usage:</span>
                        <span>{config.usage}%</span>
                      </div>
                    </>
                  )}
                  {service.type.toLowerCase() === "storage" && (
                    <div className="flex justify-between">
                      <span>Capacity:</span>
                      <span>{config.capacity}GB</span>
                    </div>
                  )}
                  {config.multiAZ && (
                    <div className="flex justify-between text-orange-600">
                      <span>Multi-AZ:</span>
                      <span>×2 cost</span>
                    </div>
                  )}
                  {config.reservationType !== "on-demand" && (
                    <div className="flex justify-between text-green-600">
                      <span>Reservation Discount:</span>
                      <span>
                        {config.reservationType === "reserved-1yr" && "-30%"}
                        {config.reservationType === "reserved-3yr" && "-50%"}
                        {config.reservationType === "spot" && "-60%"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Add to Estimate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function for provider icons (moved outside component)
function getProviderIcon(provider: string, serviceType?: string) {
  const getServiceIcon = () => {
    switch(serviceType?.toLowerCase()) {
      case "compute": return <Cpu className="w-4 h-4" />;
      case "storage": return <Cloud className="w-4 h-4" />;
      case "database": return <Database className="w-4 h-4" />;
      case "networking": return <Network className="w-4 h-4" />;
      default: return <Cloud className="w-4 h-4" />;
    }
  };

  const getProviderBadge = () => {
    switch(provider.toLowerCase()) {
      case "aws": return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">AWS</span>;
      case "azure": return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Azure</span>;
      case "gcp": return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">GCP</span>;
      case "oracle cloud": return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">Oracle</span>;
      default: return null;
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {getServiceIcon()}
      {getProviderBadge()}
    </div>
  );
}

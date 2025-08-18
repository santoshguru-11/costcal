import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Star, Plus, Settings, BarChart3 } from "lucide-react";
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

export default function Calculator() {
  const [selectedTab, setSelectedTab] = useState("services");
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [estimateName, setEstimateName] = useState("My Estimate");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

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

  const getProviderIcon = (provider: string, serviceType?: string) => {
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
  };

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

  const addService = (service: Service) => {
    setSelectedServices([...selectedServices, service]);
    // Update estimated cost (simplified calculation)
    const cost = parseFloat(service.startingPrice.match(/\d+\.?\d*/)?.[0] || "0") * 24 * 30; // Rough monthly estimate
    setEstimatedCost(estimatedCost + cost);
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
      </div>
    </div>
  );
}

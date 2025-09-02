import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudCredentialsForm, CloudCredential } from "@/components/cloud-credentials-form";
import { InventoryScanner } from "@/components/inventory-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Cloud, 
  Search, 
  Settings, 
  ArrowRight, 
  CheckCircle,
  AlertCircle 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface UnifiedInventory {
  resources: Array<{
    id: string;
    name: string;
    type: string;
    service: string;
    provider: string;
    location: string;
    tags?: Record<string, string>;
    state: string;
    costDetails?: {
      instanceType?: string;
      size?: string;
      vcpus?: number;
      memory?: number;
      storage?: number;
      tier?: string;
    };
  }>;
  summary: {
    totalResources: number;
    providers: Record<string, number>;
    services: Record<string, number>;
    locations: Record<string, number>;
  };
  scanDate: string;
  scanDuration: number;
}

export function InventoryPage() {
  const [, setLocation] = useLocation();
  const [credentials, setCredentials] = useState<CloudCredential[]>([]);
  const [activeTab, setActiveTab] = useState('setup');
  const [scannedInventory, setScannedInventory] = useState<UnifiedInventory | null>(null);

  const validateCredentialsMutation = useMutation({
    mutationFn: async ({ provider, credentials }: { provider: string; credentials: any }) => {
      const response = await apiRequest('POST', '/api/inventory/validate-credentials', {
        provider,
        credentials
      });
      return await response.json();
    }
  });

  const handleCredentialsChange = (newCredentials: CloudCredential[]) => {
    setCredentials(newCredentials);
    // Auto-advance to scanning tab when credentials are added
    if (newCredentials.length > 0 && activeTab === 'setup') {
      setTimeout(() => setActiveTab('scan'), 500);
    }
  };

  const handleValidateCredentials = async (provider: string, credentials: any) => {
    const result = await validateCredentialsMutation.mutateAsync({ provider, credentials });
    return result;
  };

  const handleInventoryScanned = (inventory: UnifiedInventory) => {
    setScannedInventory(inventory);
    setActiveTab('results');
  };

  const proceedToCalculator = () => {
    setLocation('/calculator');
  };

  const validCredentials = credentials.filter(c => c.validated);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
          <Cloud className="h-8 w-8 text-blue-600" />
          Cloud Inventory Discovery
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Automatically discover your existing cloud resources and generate accurate cost comparisons based on your actual infrastructure.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl">
          <div className={`flex items-center gap-2 ${activeTab === 'setup' ? 'text-blue-600 font-medium' : credentials.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${credentials.length > 0 ? 'bg-green-600 border-green-600 text-white' : activeTab === 'setup' ? 'border-blue-600' : 'border-muted-foreground'}`}>
              {credentials.length > 0 ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span>Setup Credentials</span>
          </div>
          
          <ArrowRight className="text-muted-foreground" />
          
          <div className={`flex items-center gap-2 ${activeTab === 'scan' ? 'text-blue-600 font-medium' : scannedInventory ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${scannedInventory ? 'bg-green-600 border-green-600 text-white' : activeTab === 'scan' ? 'border-blue-600' : 'border-muted-foreground'}`}>
              {scannedInventory ? <CheckCircle className="h-4 w-4" /> : '2'}
            </div>
            <span>Scan Resources</span>
          </div>
          
          <ArrowRight className="text-muted-foreground" />
          
          <div className={`flex items-center gap-2 ${activeTab === 'results' ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${activeTab === 'results' ? 'border-blue-600' : 'border-muted-foreground'}`}>
              3
            </div>
            <span>View Results</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="scan" disabled={credentials.length === 0} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Scan
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!scannedInventory} className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="mt-8">
          <CloudCredentialsForm
            credentials={credentials}
            onCredentialsChange={handleCredentialsChange}
            onValidateCredentials={handleValidateCredentials}
          />

          {credentials.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Ready for Scanning
                </CardTitle>
                <CardDescription>
                  You have {validCredentials.length} validated credential{validCredentials.length !== 1 ? 's' : ''} ready for scanning.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {credentials.map(cred => (
                      <Badge key={cred.id} variant={cred.validated ? "default" : "secondary"} className="capitalize">
                        {cred.provider}
                        {cred.validated && <CheckCircle className="h-3 w-3 ml-1" />}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    onClick={() => setActiveTab('scan')}
                    disabled={validCredentials.length === 0}
                    data-testid="button-proceed-to-scan"
                  >
                    Proceed to Scanning
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scan" className="mt-8">
          {validCredentials.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please add and validate cloud credentials first before scanning.
              </AlertDescription>
            </Alert>
          ) : (
            <InventoryScanner
              credentials={validCredentials}
              onInventoryScanned={handleInventoryScanned}
            />
          )}
        </TabsContent>

        <TabsContent value="results" className="mt-8">
          {scannedInventory ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Inventory Discovery Complete
                  </CardTitle>
                  <CardDescription>
                    Successfully discovered {scannedInventory.summary.totalResources} resources across {Object.keys(scannedInventory.summary.providers).length} cloud provider{Object.keys(scannedInventory.summary.providers).length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{scannedInventory.summary.totalResources}</div>
                      <div className="text-sm text-muted-foreground">Total Resources</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{Object.keys(scannedInventory.summary.providers).length}</div>
                      <div className="text-sm text-muted-foreground">Cloud Providers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{Object.keys(scannedInventory.summary.services).length}</div>
                      <div className="text-sm text-muted-foreground">Service Types</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">{(scannedInventory.scanDuration / 1000).toFixed(1)}s</div>
                      <div className="text-sm text-muted-foreground">Scan Duration</div>
                    </div>
                  </div>

                  <Alert className="mb-6">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your inventory has been analyzed and converted into infrastructure requirements. 
                      You can now proceed to the cost calculator to compare prices across all cloud providers.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <h4 className="font-medium">Next Steps:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Review discovered resources and optimization recommendations</li>
                        <li>• Generate automatic cost comparison across all providers</li>
                        <li>• Explore multi-cloud cost optimization opportunities</li>
                      </ul>
                    </div>
                    
                    <Button 
                      onClick={proceedToCalculator}
                      size="lg"
                      className="ml-4"
                      data-testid="button-proceed-to-calculator"
                    >
                      Generate Cost Analysis
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Display the full inventory scanner results */}
              <InventoryScanner
                credentials={validCredentials}
                onInventoryScanned={handleInventoryScanned}
              />
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No inventory data available. Please complete the scanning process first.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
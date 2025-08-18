import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CloudProvider, CostCalculationResult } from "@shared/schema";
import CostCharts from "./cost-charts";

interface CostResultsProps {
  results: CostCalculationResult;
  analysisId: string;
}

export default function CostResults({ results, analysisId }: CostResultsProps) {
  const handleExportCSV = () => {
    window.open(`/api/export/${analysisId}/csv`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Cost Analysis Results</h2>
        <p className="text-slate-600 mt-2">
          Comprehensive cost breakdown across all cloud providers with optimization recommendations.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Cheapest Option</p>
                <p className="text-2xl font-bold text-green-600">{results.cheapest.currencySymbol || '$'}{results.cheapest.total}/mo</p>
                <p className="text-sm text-slate-500">{results.cheapest.name}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold text-xl">🏆</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Most Expensive</p>
                <p className="text-2xl font-bold text-red-600">{results.mostExpensive.currencySymbol || '$'}{results.mostExpensive.total}/mo</p>
                <p className="text-sm text-slate-500">{results.mostExpensive.name}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-bold text-xl">📈</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Potential Savings</p>
                <p className="text-2xl font-bold text-primary">{results.providers[0]?.currencySymbol || '$'}{results.potentialSavings}/mo</p>
                <p className="text-sm text-slate-500">
                  {Math.round((results.potentialSavings / results.mostExpensive.total) * 100)}% reduction
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Multi-Cloud Option</p>
                <p className="text-2xl font-bold text-amber-600">{results.providers[0]?.currencySymbol || '$'}{results.multiCloudOption.cost}/mo</p>
                <p className="text-sm text-slate-500">Best hybrid</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                <span className="text-amber-600 font-bold text-xl">🔗</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <CostCharts providers={results.providers} cheapestProvider={results.cheapest} />

      {/* Detailed Comparison Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Detailed Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>AWS</TableHead>
                  <TableHead>Azure</TableHead>
                  <TableHead>GCP</TableHead>
                  <TableHead>Oracle Cloud</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Compute</TableCell>
                  {results.providers.map((provider) => (
                    <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                      {provider.currencySymbol || '$'}{provider.compute}/mo
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-slate-50">
                  <TableCell className="font-medium">Licensing</TableCell>
                  {results.providers.map((provider) => (
                    <TableCell key={provider.name} className="text-purple-600 font-semibold">
                      {provider.currencySymbol || '$'}{provider.licensing || 0}/mo
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Storage</TableCell>
                  {results.providers.map((provider) => (
                    <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                      ${provider.storage}/mo
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Database</TableCell>
                  {results.providers.map((provider) => (
                    <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                      ${provider.database}/mo
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-slate-50">
                  <TableCell className="font-medium">Networking</TableCell>
                  {results.providers.map((provider) => (
                    <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                      ${provider.networking}/mo
                    </TableCell>
                  ))}
                </TableRow>
                {results.providers[0].analytics !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">Analytics</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                        ${provider.analytics || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {results.providers[0].ai !== undefined && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-medium">AI/ML</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                        ${provider.ai || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {results.providers[0].security !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">Security</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                        ${provider.security || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {results.providers[0].monitoring !== undefined && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-medium">Monitoring</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                        ${provider.monitoring || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {results.providers[0].devops !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">DevOps</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                        ${provider.devops || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {results.providers[0].backup !== undefined && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-medium">Backup</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                        ${provider.backup || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {results.providers[0].iot !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">IoT</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                        ${provider.iot || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {results.providers[0].media !== undefined && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-medium">Media</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                        ${provider.media || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {results.providers[0].quantum !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">Quantum Computing</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                        ${provider.quantum || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {results.providers[0].advancedAI !== undefined && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-medium">Advanced AI/ML</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                        ${provider.advancedAI || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {results.providers[0].edge !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">Edge & 5G</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                        ${provider.edge || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {results.providers[0].confidential !== undefined && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-medium">Confidential Computing</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                        ${provider.confidential || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {results.providers[0].sustainability !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">Sustainability Services</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                        ${provider.sustainability || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {results.providers[0].scenarios !== undefined && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-medium">Advanced Scenarios</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-semibold" : ""}>
                        ${provider.scenarios || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                <TableRow className="bg-primary/5 font-semibold">
                  <TableCell className="font-bold">Total Monthly Cost</TableCell>
                  {results.providers.map((provider) => (
                    <TableCell key={provider.name} className={provider.name === results.cheapest.name ? "text-green-600 font-bold" : "font-semibold"}>
                      ${provider.total}/mo
                    </TableCell>
                  ))}
                </TableRow>
                {/* Sustainability Metrics Row */}
                {results.providers[0].carbonFootprint !== undefined && (
                  <TableRow className="bg-green-50 border-t-2 border-green-200">
                    <TableCell className="font-bold text-green-800">🌱 Carbon Footprint (tons CO2/mo)</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className="font-medium text-green-700">
                        {provider.carbonFootprint?.toFixed(3) || 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {results.providers[0].renewableEnergyPercent !== undefined && (
                  <TableRow className="bg-green-50">
                    <TableCell className="font-bold text-green-800">🔋 Renewable Energy %</TableCell>
                    {results.providers.map((provider) => (
                      <TableCell key={provider.name} className="font-medium text-green-700">
                        {provider.renewableEnergyPercent || 'N/A'}%
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>💡 Single-Cloud Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-slate-900">{results.cheapest.name}</p>
                <p className="text-sm text-slate-600">{results.recommendations.singleCloud}</p>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-600">
                {Math.round((results.potentialSavings / results.mostExpensive.total) * 100)}% savings compared to {results.mostExpensive.name}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔗 Multi-Cloud Optimization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-slate-900">Hybrid Approach: ${results.multiCloudOption.cost}/month</p>
                <div className="text-sm text-slate-600">
                  • Compute: {results.multiCloudOption.breakdown.compute}<br />
                  • Storage: {results.multiCloudOption.breakdown.storage}<br />
                  • Database: {results.multiCloudOption.breakdown.database}<br />
                  • Networking: {results.multiCloudOption.breakdown.networking}
                </div>
              </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-amber-600">
                Additional ${Math.round((results.cheapest.total - results.multiCloudOption.cost) * 100) / 100}/month savings with multi-cloud setup
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={handleExportCSV}>
          Export to CSV
        </Button>
        <Button variant="outline">
          Generate PDF Report
        </Button>
        <Button className="bg-primary hover:bg-blue-700">
          Save Analysis
        </Button>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalculatorIcon, CloudIcon, ShieldCheckIcon, TrendingUpIcon } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  const handleLogin = () => {
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>Cloud Cost Optimizer - Multi-Cloud Cost Analysis & Optimization</title>
        <meta name="description" content="Optimize your cloud infrastructure costs across AWS, Azure, GCP, and Oracle Cloud. Upload Terraform files, scan resources, and get detailed cost breakdowns." />
      </Helmet>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Multi-Cloud Cost Optimization Platform
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Optimize Your Cloud Costs
            <span className="text-blue-600"> Across All Providers</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Compare and optimize your cloud infrastructure costs across AWS, Azure, GCP, and Oracle Cloud. 
            Upload Terraform state files, scan live resources, and get detailed cost analysis with optimization recommendations.
          </p>
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="text-lg px-8 py-6"
            data-testid="button-login"
          >
            Sign In to Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card data-testid="card-feature-calculator">
            <CardHeader>
              <CalculatorIcon className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Multi-Cloud Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Compare costs across AWS, Azure, GCP, and Oracle Cloud with detailed breakdowns by service category.
              </CardDescription>
            </CardContent>
          </Card>

          <Card data-testid="card-feature-terraform">
            <CardHeader>
              <CloudIcon className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Terraform Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload your .tfstate files to automatically analyze your existing infrastructure and calculate costs.
              </CardDescription>
            </CardContent>
          </Card>

          <Card data-testid="card-feature-scanning">
            <CardHeader>
              <ShieldCheckIcon className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Live Resource Scanning</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect your cloud credentials to scan actual resources and get real-time cost analysis.
              </CardDescription>
            </CardContent>
          </Card>

          <Card data-testid="card-feature-optimization">
            <CardHeader>
              <TrendingUpIcon className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Cost Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get detailed recommendations for cost savings, right-sizing, and multi-cloud optimization strategies.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Key Benefits */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose Our Platform?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CloudIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Comprehensive Analysis</h3>
              <p className="text-gray-600">
                Analyze compute, storage, database, networking, and advanced services across all major cloud providers.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                Your cloud credentials and infrastructure data are encrypted and stored securely with enterprise-grade security.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TrendingUpIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Actionable Insights</h3>
              <p className="text-gray-600">
                Get specific recommendations for cost optimization, resource right-sizing, and multi-cloud strategies.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Optimize Your Cloud Costs?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of developers and organizations saving money on cloud infrastructure.
          </p>
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="text-lg px-8 py-6"
            data-testid="button-login-cta"
          >
            Sign In Now
          </Button>
        </div>
      </div>
    </div>
  );
}
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
            Optimize Your Cloud Costs
            <span className="text-primary block mt-2">Across All Providers</span>
          </h1>
          <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto">
            Compare comprehensive cloud costs across AWS, Azure, GCP, and Oracle Cloud. 
            Analyze 15+ service categories including AI/ML, analytics, security, IoT, and more with advanced optimization.
          </p>
          <div className="mt-10 flex justify-center">
            <Link href="/calculator">
              <Button className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg">
                Start Cost Analysis
              </Button>
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">15+</div>
              <div className="text-sm text-slate-600">Service Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">4</div>
              <div className="text-sm text-slate-600">Cloud Providers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">35%</div>
              <div className="text-sm text-slate-600">Avg. Savings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">150+</div>
              <div className="text-sm text-slate-600">Cloud Services</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Why Choose CloudCostOptimizer?</h2>
            <p className="text-slate-600 mt-4">Comprehensive cost analysis with actionable insights</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-xl">⚡</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Real-time Analysis</h3>
                <p className="text-slate-600">Get instant cost comparisons across all major cloud providers with up-to-date pricing data.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold text-xl">🎯</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Multi-Cloud Optimization</h3>
                <p className="text-slate-600">Discover the optimal mix of cloud providers for maximum cost efficiency.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-amber-600 font-bold text-xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Detailed Insights</h3>
                <p className="text-slate-600">Comprehensive breakdowns with interactive charts and exportable reports.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">CloudCostOptimizer</h3>
              <p className="text-sm text-slate-600">The most accurate multi-cloud cost optimization platform for enterprises.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-primary">Features</a></li>
                <li><a href="#" className="hover:text-primary">Pricing</a></li>
                <li><a href="#" className="hover:text-primary">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-primary">About</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-primary">Help Center</a></li>
                <li><a href="#" className="hover:text-primary">Documentation</a></li>
                <li><a href="#" className="hover:text-primary">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-8 pt-8 text-center text-sm text-slate-600">
            <p>&copy; 2024 CloudCostOptimizer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

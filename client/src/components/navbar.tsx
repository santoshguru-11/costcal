import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [location] = useLocation();

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-xl font-bold text-slate-900 cursor-pointer">
                  CloudCostOptimizer
                </h1>
              </Link>
            </div>
          </div>
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location === "/" 
                  ? "text-slate-900 hover:text-primary" 
                  : "text-slate-600 hover:text-primary"
              }`}>
                Dashboard
              </Link>
              <Link href="/inventory" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location === "/inventory" 
                  ? "text-slate-900 hover:text-primary" 
                  : "text-slate-600 hover:text-primary"
              }`}>
                Inventory
              </Link>
              <Link href="/calculator" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location === "/calculator" 
                  ? "text-slate-900 hover:text-primary" 
                  : "text-slate-600 hover:text-primary"
              }`}>
                Calculator
              </Link>
            </div>
          </nav>
          <div className="flex items-center space-x-4">
            <Button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

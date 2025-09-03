import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { UserIcon, LogOutIcon } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const { isAuthenticated, user, isLoading } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const navItems = isAuthenticated ? [
    { href: "/", label: "Dashboard" },
    { href: "/calculator", label: "Calculator" },
    { href: "/inventory", label: "Inventory" },
    { href: "/credentials", label: "Credentials" },
    { href: "/terraform", label: "Terraform" },
  ] : [];

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
          
          {isAuthenticated && (
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location === item.href 
                        ? "text-slate-900 hover:text-primary" 
                        : "text-slate-600 hover:text-primary"
                    }`}
                    data-testid={`nav-link-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          )}
          
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-700">
                  <UserIcon className="h-4 w-4" />
                  <span>Welcome, {(user as any)?.firstName || (user as any)?.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOutIcon className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={handleLogin} data-testid="button-login">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
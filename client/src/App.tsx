import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/navbar";
import Home from "@/pages/home";
import Calculator from "@/pages/calculator";
import Results from "@/pages/results";
import { InventoryPage } from "@/pages/inventory";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/inventory" component={InventoryPage} />
      <Route path="/results/:id" component={Results} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main>
              <Router />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;

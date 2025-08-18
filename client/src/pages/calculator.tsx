import { Helmet } from "react-helmet-async";
import CostForm from "@/components/cost-form";

export default function Calculator() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <Helmet>
        <title>Cost Calculator - CloudCostOptimizer</title>
        <meta name="description" content="Calculate and compare cloud costs across AWS, Azure, GCP, and Oracle Cloud. Get detailed cost breakdowns for your infrastructure requirements." />
      </Helmet>
      <div className="py-8">
        <CostForm />
      </div>
    </div>
  );
}

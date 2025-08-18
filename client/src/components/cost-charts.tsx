import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudProvider } from "@shared/schema";
import { ChartData } from "@/lib/types";

declare global {
  interface Window {
    Chart: any;
  }
}

interface CostChartsProps {
  providers: CloudProvider[];
  cheapestProvider: CloudProvider;
}

export default function CostCharts({ providers, cheapestProvider }: CostChartsProps) {
  const costChartRef = useRef<HTMLCanvasElement>(null);
  const breakdownChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Chart) {
      initCostChart();
      initBreakdownChart();
    } else {
      // Load Chart.js if not already loaded
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.onload = () => {
        initCostChart();
        initBreakdownChart();
      };
      document.head.appendChild(script);
    }
  }, [providers, cheapestProvider]);

  const initCostChart = () => {
    if (!costChartRef.current || !window.Chart) return;

    const ctx = costChartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    const existingChart = window.Chart.getChart(costChartRef.current);
    if (existingChart) {
      existingChart.destroy();
    }

    new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: providers.map(p => p.name),
        datasets: [{
          label: 'Monthly Cost ($)',
          data: providers.map(p => p.total),
          backgroundColor: [
            '#FF9F43',
            '#0078D4',
            '#4285F4',
            '#F80000'
          ],
          borderColor: [
            '#FF7F00',
            '#106EBE',
            '#1E6DE5',
            '#C80000'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                return '$' + value;
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  };

  const initBreakdownChart = () => {
    if (!breakdownChartRef.current || !window.Chart) return;

    const ctx = breakdownChartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    const existingChart = window.Chart.getChart(breakdownChartRef.current);
    if (existingChart) {
      existingChart.destroy();
    }

    new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Compute', 'Storage', 'Database', 'Networking'],
        datasets: [{
          data: [cheapestProvider.compute, cheapestProvider.storage, cheapestProvider.database, cheapestProvider.networking],
          backgroundColor: [
            '#2563EB',
            '#10B981',
            '#F59E0B',
            '#EF4444'
          ],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom' as const
          }
        }
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Cost Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <canvas ref={costChartRef}></canvas>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <canvas ref={breakdownChartRef}></canvas>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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

    // Build comprehensive service categories data
    const labels = [];
    const data = [];
    const colors = [
      '#2563EB', // Compute - Blue
      '#10B981', // Storage - Green  
      '#F59E0B', // Database - Amber
      '#EF4444', // Networking - Red
      '#8B5CF6', // Analytics - Purple
      '#06B6D4', // AI/ML - Cyan
      '#EC4899', // Security - Pink
      '#84CC16', // Monitoring - Lime
      '#F97316', // DevOps - Orange
      '#6366F1', // Backup - Indigo
      '#14B8A6', // IoT - Teal
      '#F59E0B'  // Media - Amber variant
    ];

    // Add core services
    if (cheapestProvider.compute > 0) {
      labels.push('Compute');
      data.push(cheapestProvider.compute);
    }
    if (cheapestProvider.storage > 0) {
      labels.push('Storage');
      data.push(cheapestProvider.storage);
    }
    if (cheapestProvider.database > 0) {
      labels.push('Database');
      data.push(cheapestProvider.database);
    }
    if (cheapestProvider.networking > 0) {
      labels.push('Networking');
      data.push(cheapestProvider.networking);
    }

    // Add comprehensive services if they exist and have costs > 0
    if (cheapestProvider.analytics && cheapestProvider.analytics > 0) {
      labels.push('Analytics');
      data.push(cheapestProvider.analytics);
    }
    if (cheapestProvider.ai && cheapestProvider.ai > 0) {
      labels.push('AI/ML');
      data.push(cheapestProvider.ai);
    }
    if (cheapestProvider.security && cheapestProvider.security > 0) {
      labels.push('Security');
      data.push(cheapestProvider.security);
    }
    if (cheapestProvider.monitoring && cheapestProvider.monitoring > 0) {
      labels.push('Monitoring');
      data.push(cheapestProvider.monitoring);
    }
    if (cheapestProvider.devops && cheapestProvider.devops > 0) {
      labels.push('DevOps');
      data.push(cheapestProvider.devops);
    }
    if (cheapestProvider.backup && cheapestProvider.backup > 0) {
      labels.push('Backup');
      data.push(cheapestProvider.backup);
    }
    if (cheapestProvider.iot && cheapestProvider.iot > 0) {
      labels.push('IoT');
      data.push(cheapestProvider.iot);
    }
    if (cheapestProvider.media && cheapestProvider.media > 0) {
      labels.push('Media');
      data.push(cheapestProvider.media);
    }

    new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: {
              padding: 15,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: $${value}/mo (${percentage}%)`;
              }
            }
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

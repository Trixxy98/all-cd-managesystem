// components/CapacityCharts.tsx
'use client';
import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

interface CapacityChartsProps {
  token: string;
}

interface CapacityData {
  capacityDistribution: Array<{
    capacity: string;
    count: number;
    percentage: number;
  }>;
  capacityByRegion: Array<{
    region: string;
    capacity: string;
    count: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    capacity: string;
    count: number;
  }>;
}

// Color palette for charts
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#ec4899'];

// Custom label component for Pie chart
const renderCustomizedLabel = ({ 
  cx, cy, midAngle, innerRadius, outerRadius, percent, index 
}: any) => {
  if (percent < 0.05) return null; // Don't show labels for very small slices
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function CapacityCharts({ token }: CapacityChartsProps) {
  const [data, setData] = useState<CapacityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('distribution');

  useEffect(() => {
    const fetchCapacityData = async () => {
      try {
        const response = await fetch('/api/statistics/capacity', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching capacity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCapacityData();
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-red-600">
          Failed to load capacity statistics
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const topCapacities = data.capacityDistribution.slice(0, 10);
  
  // Group by region for stacked bar chart
  const regionData: { [key: string]: any } = {};
  data.capacityByRegion.forEach(item => {
    if (!regionData[item.region]) {
      regionData[item.region] = { region: item.region };
    }
    regionData[item.region][item.capacity] = item.count;
  });
  const regionChartData = Object.values(regionData);

  // Prepare monthly trends data
  const monthlyData: { [key: string]: any } = {};
  data.monthlyTrends.forEach(item => {
    const monthKey = new Date(item.month).toISOString().slice(0, 7);
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: item.month };
    }
    monthlyData[monthKey][item.capacity] = item.count;
  });
  const monthlyChartData = Object.values(monthlyData);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Capacity Type Analysis</h2>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('distribution')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'distribution'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Distribution
        </button>
        <button
          onClick={() => setActiveTab('byRegion')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'byRegion'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          By Region
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'trends'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Trends
        </button>
      </div>

      {/* Charts */}
      <div className="space-y-8">
        {activeTab === 'distribution' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div>
              <h3 className="text-lg font-medium mb-4">Top Capacity Types (Bar Chart)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCapacities}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="capacity" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [`${value} records`, 'Count']}
                      labelFormatter={(label) => `Capacity: ${label}`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      name="Record Count" 
                      fill="#3b82f6"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div>
              <h3 className="text-lg font-medium mb-4">Capacity Distribution (Pie Chart)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topCapacities}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="capacity"
                    >
                      {topCapacities.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any, props: any) => [
                        `${value} records (${props.payload.percentage}%)`,
                        props.payload.capacity
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'byRegion' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Capacity Types by Region</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={regionChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {topCapacities.slice(0, 5).map((capacity, index) => (
                    <Bar 
                      key={capacity.capacity}
                      dataKey={capacity.capacity}
                      stackId="a"
                      fill={COLORS[index % COLORS.length]}
                      name={capacity.capacity}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Monthly Capacity Trends (Last 6 Months)</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  />
                  <Legend />
                  {topCapacities.slice(0, 5).map((capacity, index) => (
                    <Line
                      key={capacity.capacity}
                      type="monotone"
                      dataKey={capacity.capacity}
                      name={capacity.capacity}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Capacity Type Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record Count</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.capacityDistribution.map((item, index) => (
                <tr key={item.capacity}>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.capacity}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
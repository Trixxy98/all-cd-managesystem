// components/Statistics.tsx
'use client';
import { useState, useEffect } from 'react';

interface StatisticsProps {
  token: string;
}

interface StatsData {
  totalRecords: number;
  regionStats: { region: string; count: number }[];
  capacityStats: { capacity: string; count: number }[];
  weeklyStats: { week: string; count: number }[];
  latestImports: any[];
}

export default function Statistics({ token }: StatisticsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/statistics', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div>Failed to load statistics</div>;
  }

  return (
    <div className="space-y-6">
      {/* Total Records Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
        <h3 className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</h3>
        <p className="text-blue-100">Total Network Records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Region Statistics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Records by Region</h3>
          <div className="space-y-2">
            {stats.regionStats.map((item) => (
              <div key={item.region} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{item.region}</span>
                <span className="font-semibold">{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Capacity Statistics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Top Capacity Types</h3>
          <div className="space-y-2">
            {stats.capacityStats.map((item) => (
              <div key={item.capacity} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 truncate">{item.capacity || 'Unknown'}</span>
                <span className="font-semibold">{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Latest Imports */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Latest Imports</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.latestImports.map((importItem, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900">{importItem.region}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 truncate max-w-xs">{importItem.file_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{new Date(importItem.import_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{importItem.record_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
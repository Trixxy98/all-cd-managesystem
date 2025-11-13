'use client';
import { useState, useEffect } from 'react';

interface NetworkData {
  id: number;
  node: string;
  ne_ip: string;
  idu: string;
  capacity: string;
  location: string;
  main_stby: string;
  site_id_a: string;
  site_id_b: string;
  protection: string;
  sheet_name: string;
  created_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface DataTableProps {
  token: string;
}

export default function DataTable({ token }: DataTableProps) {
  const [data, setData] = useState<NetworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [regionFilter, setRegionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchData = async (pageNum: number, region: string, search: string = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '50',
      });
      
      if (region) {
        params.append('region', region);
      }
      
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/data?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, regionFilter, searchTerm);
  }, [token]);

  const handleSearch = () => {
    setSearchLoading(true);
    fetchData(1, regionFilter, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    fetchData(newPage, regionFilter, searchTerm);
  };

  const handleRegionChange = (region: string) => {
    setRegionFilter(region);
    fetchData(1, region, searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

   return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Network Data</h2>
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search across all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
            />
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 disabled:opacity-50"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          {/* Region Filter */}
          <div>
            <label htmlFor="region-filter" className="block text-sm font-medium text-gray-700 mr-2">
              Filter by Region:
            </label>
            <select
              id="region-filter"
              value={regionFilter}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Regions</option>
              <option value="Central">Central</option>
              <option value="Northern">Northern</option>
              <option value="Eastern">Eastern</option>
              <option value="Southern">Southern</option>
              <option value="EM">EM</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Node</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NE IP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IDU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Main/Stby</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site A</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site B</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protection</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.node}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.ne_ip}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">{item.idu}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.capacity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">{item.location}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.main_stby}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.site_id_a}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.site_id_b}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.protection}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sheet_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Page {pagination.page} of {pagination.totalPages}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
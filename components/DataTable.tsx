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

  // In DataTable.tsx - Update the fetchData function:
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

    console.log('🔍 Fetching data with params:', { pageNum, region, search });

    const response = await fetch(`/api/data?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ Data received:', { 
      recordCount: result.data.length, 
      total: result.pagination.total 
    });
    
    setData(result.data);
    setPagination(result.pagination);
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    alert(`Failed to load data: ${(error as Error).message}`);
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

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchLoading(true);
    fetchData(1, regionFilter, '');
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

  if (loading && data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Circuit Diagram Data</h2>
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search across all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {searchLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Searching...
                </div>
              ) : (
                'Search'
              )}
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
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

      {/* Search Status */}
      {searchTerm && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-blue-800">
                Searching for: <strong>"{searchTerm}"</strong>
              </span>
              <span className="text-blue-600 text-sm ml-2">
                ({data.length} results found)
              </span>
            </div>
            <button
              onClick={handleClearSearch}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear search
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Node</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">NE IP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IDU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Main/Stby</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Site A</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Site B</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Protection</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Region</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.node}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.ne_ip}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.idu}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.capacity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.location}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.main_stby}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.site_id_a}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.site_id_b}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.protection}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.sheet_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No Results Message */}
      {data.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || regionFilter ? (
            <div>
              <p className="text-lg">No results found</p>
              <p className="text-sm mt-2">
                {searchTerm && `for search term: "${searchTerm}"`}
                {searchTerm && regionFilter && ' and '}
                {regionFilter && `in region: ${regionFilter}`}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRegionFilter('');
                  fetchData(1, '', '');
                }}
                className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <p>No data available</p>
          )}
        </div>
      )}

      {/* Pagination */}
      {data.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
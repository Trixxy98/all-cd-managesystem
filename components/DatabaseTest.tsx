// components/DatabaseTest.tsx
'use client';
import { useEffect, useState } from 'react';

export default function DatabaseTest() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('/api/test-db');
        const data = await response.json();
        
        if (response.ok) {
          setStatus('connected');
          setMessage('Database connected successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Connection failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error testing database');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Database Connection Test</h3>
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
        status === 'connected' ? 'bg-green-100 text-green-800' :
        status === 'error' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {status === 'loading' && '⏳ Testing connection...'}
        {status === 'connected' && '✅ Database connected'}
        {status === 'error' && '❌ Connection failed'}
      </div>
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
    </div>
  );
}
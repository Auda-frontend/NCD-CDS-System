import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import { healthCheck } from './services/api';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      setBackendStatus('checking');
      const health = await healthCheck();
      if (health.status === 'healthy') {
        setBackendStatus('healthy');
      } else {
        setBackendStatus('unhealthy');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setBackendStatus('offline');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              NCD Clinical Decision Support System
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    backendStatus === 'healthy'
                      ? 'bg-green-500'
                      : backendStatus === 'unhealthy'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-sm text-gray-600">Backend: {backendStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/*" element={<Dashboard backendStatus={backendStatus} />} />
      </Routes>
    </div>
  );
}

export default App;
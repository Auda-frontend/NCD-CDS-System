import React, { useState, useEffect } from 'react';
import PatientForm from './components/PatientForm';
import ClinicalDecisions from './components/ClinicalDecisions';
import { evaluatePatient, healthCheck, testDroolsConnection, createSampleDiabetesPatient, createSampleHypertensionPatient } from './services/api';

function App() {
  const [patientData, setPatientData] = useState(null);
  const [clinicalDecisions, setClinicalDecisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'results'

  // Check backend health on component mount
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

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    try {
      const response = await evaluatePatient(formData);
      setPatientData(formData);
      setClinicalDecisions(response.clinical_decisions || []);
      setActiveTab('results');
      
      // Log successful evaluation
      console.log('Evaluation completed:', {
        decisions: response.clinical_decisions?.length || 0,
        executionTime: response.execution_time_ms,
        success: response.success
      });
    } catch (error) {
      console.error('Evaluation failed:', error);
      alert(`Error evaluating patient data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSamplePatient = (type) => {
    const samplePatient = type === 'diabetes' 
      ? createSampleDiabetesPatient()
      : createSampleHypertensionPatient();
    
    setPatientData(samplePatient);
    
    // Auto-submit the sample data
    handleFormSubmit(samplePatient);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'unhealthy': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'healthy': return 'Backend Online';
      case 'unhealthy': return 'Backend Issues';
      case 'offline': return 'Backend Offline';
      case 'checking': return 'Checking Status...';
      default: return 'Unknown Status';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-3">
                🏥 Clinical Decision Support System
              </h1>
              <p className="mt-1 text-sm sm:text-lg text-gray-600">
                Hypertension & Diabetes Management
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Backend Status */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(backendStatus)}`}>
                {getStatusText(backendStatus)}
              </div>
              
              {/* Sample Data Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoadSamplePatient('hypertension')}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors"
                  disabled={loading}
                >
                  Sample HTN
                </button>
                <button
                  onClick={() => handleLoadSamplePatient('diabetes')}
                  className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors"
                  disabled={loading}
                >
                  Sample DM
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="xl:hidden border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('form')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'form'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Patient Form
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              disabled={!clinicalDecisions.length}
            >
              Results {clinicalDecisions.length > 0 && `(${clinicalDecisions.length})`}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Patient Form Section - Always visible on desktop, conditional on mobile */}
          <div className={`space-y-6 ${activeTab === 'form' ? 'block' : 'hidden xl:block'}`}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Patient Assessment</h2>
                <p className="text-gray-600 text-sm">
                  Enter patient data to get clinical recommendations based on hypertension and diabetes guidelines.
                </p>
              </div>
              <PatientForm 
                onSubmit={handleFormSubmit}
                loading={loading}
              />
            </div>

            {/* Guidelines Info */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Supported Guidelines</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• <strong>Hypertension:</strong> Rwanda National Guidelines 2023</p>
                <p>• <strong>Diabetes:</strong> Rwanda Standard Treatment Guidelines 2022</p>
                <p>• Comprehensive comorbidity management</p>
                <p>• Emergency detection and referral criteria</p>
              </div>
            </div>
          </div>

          {/* Results Section - Always visible on desktop, conditional on mobile */}
          <div className={`space-y-6 ${activeTab === 'results' ? 'block' : 'hidden xl:block'}`}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Clinical Decisions</h2>
                {clinicalDecisions.length > 0 && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                    {clinicalDecisions.length} recommendation{clinicalDecisions.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <ClinicalDecisions 
                decisions={clinicalDecisions}
                patientData={patientData}
                loading={loading}
              />
            </div>

            {/* Quick Actions */}
            {clinicalDecisions.length > 0 && (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Print Report
                  </button>
                  <button
                    onClick={() => setActiveTab('form')}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    New Assessment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>Clinical Decision Support System • Built for Rwanda Healthcare</p>
            <p className="mt-1">Supports Hypertension and Diabetes management protocols</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
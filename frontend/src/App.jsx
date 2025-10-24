import React, { useState } from 'react';
import PatientForm from './components/PatientForm';
import ClinicalDecisions from './components/ClinicalDecisions';
import { evaluatePatient } from './services/api';

function App() {
  const [patientData, setPatientData] = useState(null);
  const [clinicalDecisions, setClinicalDecisions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    try {
      const response = await evaluatePatient(formData);
      setPatientData(formData);
      setClinicalDecisions(response.clinical_decisions);
    } catch (error) {
      console.error('Evaluation failed:', error);
      alert('Error evaluating patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
              Clinical Decision Support System
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Hypertension Management
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Patient Form Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl medical-shadow p-6">
              <PatientForm 
                onSubmit={handleFormSubmit}
                loading={loading}
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl medical-shadow p-6">
              <ClinicalDecisions 
                decisions={clinicalDecisions}
                patientData={patientData}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import CDSRecommendationsList from './CDSRecommendationsList';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CDSRecommendationsView = () => {
  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);

  useEffect(() => {
    loadVisits();
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedVisit) {
      loadRecommendations(selectedVisit.id);
    }
  }, [selectedVisit]);

  const loadVisits = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/visits`);
      const data = await response.json();
      setVisits(data);
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients`);
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadRecommendations = async (visitId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cds-recommendations/by-visit/${visitId}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setRecommendations([]);
    }
  };

  const handleVisitSelect = (visit) => {
    setSelectedVisit(visit);
  };

  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.id === patientId || p.patient_id === patientId);
    return patient ? patient.full_name : 'Unknown Patient';
  };

  const getPatientDetails = (patientId) => {
    return patients.find(p => p.id === patientId || p.patient_id === patientId);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">CDS Recommendations</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visit Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Visit</h2>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {visits.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No visits found. Create a visit first.
                  </div>
                ) : (
                  visits.map((visit) => (
                    <div
                      key={visit.id}
                      onClick={() => handleVisitSelect(visit)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedVisit?.id === visit.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        Visit #{visit.id?.substring(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-600">
                        {getPatientName(visit.patient_id)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(visit.visit_date).toLocaleDateString()}
                      </div>
                      {visit.consultation?.consultation_type && (
                        <div className="text-sm text-gray-500 capitalize">
                          {visit.consultation.consultation_type.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations Display */}
        <div className="lg:col-span-2">
          {selectedVisit ? (
            <CDSRecommendationsList
              recommendations={recommendations}
              visit={selectedVisit}
              patient={getPatientDetails(selectedVisit.patient_id)}
              onRefresh={() => loadRecommendations(selectedVisit.id)}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Visit
              </h3>
              <p className="text-gray-500">
                Choose a patient visit from the list to view CDS recommendations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CDSRecommendationsView;

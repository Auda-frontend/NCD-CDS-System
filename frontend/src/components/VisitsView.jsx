import React, { useState, useEffect } from 'react';
import VisitForm from './VisitForm';
import VisitList from './VisitList';

const VisitsView = () => {
  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  useEffect(() => {
    loadVisits();
    loadPatients();
  }, []);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

  const handleVisitSubmit = async (visitData) => {
    try {
      // VisitForm now handles saving internally, so we just refresh the list
      await loadVisits();
      // Don't close the form immediately - let user get recommendations
      // setShowForm(false);
      // setSelectedVisit(null);
    } catch (error) {
      console.error('Error handling visit:', error);
    }
  };

  const handleEditVisit = (visit) => {
    setSelectedVisit(visit);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Patient Visits</h1>
        <button
          onClick={() => {
            setSelectedVisit(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Visit
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {selectedVisit ? 'Edit Visit' : 'Create New Visit'}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <VisitForm
            visit={selectedVisit}
            patients={patients}
            onSubmit={handleVisitSubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <VisitList
          visits={visits}
          patients={patients}
          loading={loading}
          onEdit={handleEditVisit}
          onRefresh={loadVisits}
        />
      )}
    </div>
  );
};

export default VisitsView;
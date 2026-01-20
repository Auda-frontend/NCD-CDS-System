import React, { useState, useEffect } from 'react';
import PatientForm from './PatientForm';
import PatientList from './PatientList';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PatientsView = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients`);
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSubmit = async (patientData) => {
    try {
      // Clean the data: convert empty strings to null for optional fields
      const cleanedData = {
        patient_id: patientData.patient_id && patientData.patient_id.trim() !== '' ? patientData.patient_id.trim() : null,
        full_name: patientData.full_name.trim(),
        gender: patientData.gender && patientData.gender.trim() !== '' ? patientData.gender.trim() : null,
        date_of_birth: patientData.date_of_birth && patientData.date_of_birth.trim() !== '' ? patientData.date_of_birth : null,
        phone: patientData.phone && patientData.phone.trim() !== '' ? patientData.phone.trim() : null,
      };

      const url = selectedPatient 
        ? `${API_BASE_URL}/patients/${selectedPatient.id || selectedPatient.patient_id}`
        : `${API_BASE_URL}/patients`;
      
      const response = await fetch(url, {
        method: selectedPatient ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (response.ok) {
        await loadPatients();
        setShowForm(false);
        setSelectedPatient(null);
      } else {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        console.error('Failed to create/update patient:', errorData);
        alert(`Failed to ${selectedPatient ? 'update' : 'create'} patient: ${errorData.detail || response.statusText}`);
      }
    } catch (error) {
      console.error('Error creating/updating patient:', error);
      alert(`Error ${selectedPatient ? 'updating' : 'creating'} patient: ${error.message}`);
    }
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setViewMode(false);
    setShowForm(true);
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setViewMode(true);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
        <button
          onClick={() => {
            setSelectedPatient(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Register New Patient
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {selectedPatient ? 'Edit Patient' : 'Register New Patient'}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <PatientForm
            patient={selectedPatient}
            readOnly={viewMode}
            onSubmit={handlePatientSubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <PatientList
          patients={patients}
          loading={loading}
          onEdit={handleEditPatient}
          onView={handleViewPatient}
          onRefresh={loadPatients}
        />
      )}
    </div>
  );
};

export default PatientsView;
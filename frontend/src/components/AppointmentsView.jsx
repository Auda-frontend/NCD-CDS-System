import React, { useState, useEffect } from 'react';
import AppointmentForm from './AppointmentForm';
import AppointmentList from './AppointmentList';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    loadAppointments();
    loadPatients();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/appointments`);
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
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

  const handleAppointmentSubmit = async (appointmentData) => {
    try {
      const url = selectedAppointment
        ? `${API_BASE_URL}/appointments/${selectedAppointment.id}`
        : `${API_BASE_URL}/appointments`;
      const method = selectedAppointment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      if (response.ok) {
        await loadAppointments();
        setShowForm(false);
        setSelectedAppointment(null);
      } else {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        alert(`Failed to ${selectedAppointment ? 'update' : 'create'} appointment: ${errorData.detail || response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert(`Error saving appointment: ${error.message}`);
    }
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        <button
          onClick={() => {
            setSelectedAppointment(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Schedule New Appointment
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {selectedAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <AppointmentForm
            appointment={selectedAppointment}
            patients={patients}
            onSubmit={handleAppointmentSubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <AppointmentList
          appointments={appointments}
          patients={patients}
          loading={loading}
          onEdit={handleEditAppointment}
          onRefresh={loadAppointments}
        />
      )}
    </div>
  );
};

export default AppointmentsView;
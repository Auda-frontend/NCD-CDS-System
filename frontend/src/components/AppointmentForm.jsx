import React, { useState, useEffect } from 'react';

const statusOptions = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'ATTENDED', label: 'Attended' },
  { value: 'MISSED', label: 'Missed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
];

const AppointmentForm = ({ appointment, patients, onSubmit, onCancel, readOnly = false }) => {
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    notes: '',
    status: 'SCHEDULED',
  });

  useEffect(() => {
    if (appointment) {
      const scheduled = appointment.scheduled_at ? new Date(appointment.scheduled_at) : null;
      if (scheduled) {
        // Format date and time in local timezone to match what user sees
        const year = scheduled.getFullYear();
        const month = String(scheduled.getMonth() + 1).padStart(2, '0');
        const day = String(scheduled.getDate()).padStart(2, '0');
        const hours = String(scheduled.getHours()).padStart(2, '0');
        const minutes = String(scheduled.getMinutes()).padStart(2, '0');
        
        setFormData({
          patient_id: appointment.patient_id || '',
          appointment_date: `${year}-${month}-${day}`,
          appointment_time: `${hours}:${minutes}`,
          reason: appointment.reason || '',
          notes: appointment.notes || '',
          status: appointment.status || 'SCHEDULED',
        });
      } else {
        setFormData({
          patient_id: appointment.patient_id || '',
          appointment_date: '',
          appointment_time: '',
          reason: appointment.reason || '',
          notes: appointment.notes || '',
          status: appointment.status || 'SCHEDULED',
        });
      }
    }
  }, [appointment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) {
      onCancel();
      return;
    }
    if (!formData.appointment_date || !formData.appointment_time) {
      alert('Please select appointment date and time.');
      return;
    }
    // Create a local datetime object to preserve the exact time entered
    // This ensures the time is treated as local time, not UTC
    const [year, month, day] = formData.appointment_date.split('-').map(Number);
    const [hours, minutes] = formData.appointment_time.split(':').map(Number);
    const localDateTime = new Date(year, month - 1, day, hours, minutes);
    
    // Format as ISO string with local timezone offset
    // This preserves the exact time the user entered
    const scheduled_at = localDateTime.toISOString();
    
    const payload = {
      patient_id: formData.patient_id,
      scheduled_at,
      status: formData.status || 'SCHEDULED',
      reason: formData.reason || '',
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Patient *
        </label>
        <select
          name="patient_id"
          value={formData.patient_id}
          onChange={handleChange}
          required
          disabled={readOnly}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a patient</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.full_name} (ID: {patient.patient_id || patient.id})
            </option>
          ))}
        </select>
      </div>

      {/* Appointment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Appointment Date *
          </label>
          <input
            type="date"
            name="appointment_date"
            value={formData.appointment_date}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
          disabled={readOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Appointment Time *
          </label>
          <input
            type="time"
            name="appointment_time"
            value={formData.appointment_time}
            onChange={handleChange}
            required
          disabled={readOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason for Appointment *
        </label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          required
          rows={3}
          disabled={readOnly}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the purpose of this appointment..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={2}
          disabled={readOnly}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any special instructions or additional information..."
        />
      </div>

      {/* Status (only for editing existing appointments) */}
      {appointment && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          disabled={readOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        {!readOnly && (
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {appointment ? 'Update Appointment' : 'Schedule Appointment'}
          </button>
        )}
      </div>
    </form>
  );
};

export default AppointmentForm;
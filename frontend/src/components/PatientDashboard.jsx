import React, { useState, useEffect, useMemo } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const FollowUpBadge = ({ status }) => {
  if (!status) return null;
  let color = 'bg-gray-100 text-gray-800';
  let label = status;

  switch (status) {
    case 'ACTIVE':
      color = 'bg-green-100 text-green-800';
      label = 'Active';
      break;
    case 'LOST_FOLLOW_UP':
      color = 'bg-yellow-100 text-yellow-800';
      label = 'Lost to Follow-up';
      break;
    case 'DROPOUT':
      color = 'bg-red-100 text-red-800';
      label = 'Drop Out';
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
};

const PatientDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingPatient, setLoadingPatient] = useState(false);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/patients`);
        const data = await res.json();
        setPatients(data || []);
      } catch (e) {
        console.error('Error loading patients for dashboard:', e);
      }
    };
    loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return patients.slice(0, 20);
    return patients.filter((p) =>
      (p.full_name || '').toLowerCase().includes(term) ||
      (p.patient_id || '').toLowerCase().includes(term)
    );
  }, [patients, search]);

  const loadPatientDetails = async (patient) => {
    setSelectedPatient(patient);
    setLoadingPatient(true);
    try {
      const id = patient.id;
      const [visitsRes, presRes, recRes, apptRes] = await Promise.all([
        fetch(`${API_BASE_URL}/patients/${id}/visits`),
        fetch(`${API_BASE_URL}/prescriptions/by-patient/${id}`),
        fetch(`${API_BASE_URL}/cds-recommendations/by-patient/${id}`),
        fetch(`${API_BASE_URL}/appointments/by-patient/${id}`),
      ]);

      setVisits((await visitsRes.json()) || []);
      setPrescriptions((await presRes.json()) || []);
      setRecommendations((await recRes.json()) || []);
      setAppointments((await apptRes.json()) || []);
    } catch (e) {
      console.error('Error loading patient dashboard details:', e);
    } finally {
      setLoadingPatient(false);
    }
  };

  const followUpState = useMemo(() => {
    if (!appointments || appointments.length === 0) return 'ACTIVE';
    
    // Count total number of missed appointments (status = 'MISSED')
    const missedAppointments = appointments.filter(a => a.status === 'MISSED');
    const totalMissedCount = missedAppointments.length;
    
    // Calculate follow-up status based on total missed appointments
    if (totalMissedCount >= 3) return 'DROPOUT';
    if (totalMissedCount >= 1) return 'LOST_FOLLOW_UP';
    return 'ACTIVE';
  }, [appointments]);

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: patient search and list */}
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Patient Dashboard</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="overflow-y-auto h-full">
          {filteredPatients.map((p) => (
            <button
              key={p.id}
              onClick={() => loadPatientDetails(p)}
              className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 text-sm ${
                selectedPatient?.id === p.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="font-medium text-gray-900">{p.full_name}</div>
              <div className="text-xs text-gray-500">ID: {p.patient_id || p.id}</div>
            </button>
          ))}
          {filteredPatients.length === 0 && (
            <div className="p-4 text-sm text-gray-500">No patients match your search.</div>
          )}
        </div>
      </div>

      {/* Right: patient details */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!selectedPatient ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg">Search and select a patient to view their summary.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.full_name}</h2>
                <p className="text-sm text-gray-500">
                  ID: {selectedPatient.patient_id || selectedPatient.id} · Gender:{' '}
                  {selectedPatient.gender || 'N/A'} · Phone: {selectedPatient.phone || 'N/A'}
                </p>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span className="text-xs uppercase text-gray-500">Follow-up status</span>
                <FollowUpBadge status={followUpState} />
              </div>
            </div>

            {loadingPatient && (
              <div className="text-sm text-gray-500">Loading patient details...</div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 uppercase">Visits</p>
                <p className="text-2xl font-semibold text-gray-900">{visits.length}</p>
              </div>
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 uppercase">Prescriptions</p>
                <p className="text-2xl font-semibold text-gray-900">{prescriptions.length}</p>
              </div>
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 uppercase">CDS Recommendations</p>
                <p className="text-2xl font-semibold text-gray-900">{recommendations.length}</p>
              </div>
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 uppercase">Appointments</p>
                <p className="text-2xl font-semibold text-gray-900">{appointments.length}</p>
              </div>
            </div>

            {/* Visits */}
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Visits</h3>
              </div>
              <div className="divide-y max-h-64 overflow-y-auto text-sm">
                {visits.length === 0 && (
                  <div className="p-4 text-gray-500">No visits recorded.</div>
                )}
                {visits.map((v) => (
                  <div key={v.id} className="px-4 py-3 flex justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{formatDateTime(v.visit_date)}</div>
                      <div className="text-xs text-gray-500">
                        Consultation Type: {v.consultation?.consultation_type || 'N/A'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">ID: {v.id}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prescriptions */}
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Prescriptions</h3>
              </div>
              <div className="divide-y max-h-64 overflow-y-auto text-sm">
                {prescriptions.length === 0 && (
                  <div className="p-4 text-gray-500">No prescriptions recorded.</div>
                )}
                {prescriptions.map((p) => (
                  <div key={p.id} className="px-4 py-3 flex justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{p.medication}</div>
                      <div className="text-xs text-gray-500">
                        {p.dose || ''} {p.frequency || ''}
                      </div>
                      {p.reason && (
                        <div className="text-xs text-gray-400 mt-1">Reason: {p.reason}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      <div>{formatDateTime(p.created_at)}</div>
                      {p.visit_id && (
                        <div className="mt-1">Visit: {p.visit_id.slice(0, 8)}...</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">CDS Recommendations</h3>
              </div>
              <div className="divide-y max-h-64 overflow-y-auto text-sm">
                {recommendations.length === 0 && (
                  <div className="p-4 text-gray-500">No CDS recommendations.</div>
                )}
                {recommendations.map((r) => (
                  <div key={r.id} className="px-4 py-3">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium text-gray-900 text-xs">
                        Visit: {r.visit_id?.slice(0, 8)}...
                      </div>
                      <div className="text-xs text-gray-500">{formatDateTime(r.created_at)}</div>
                    </div>
                    {r.recommended_medications && r.recommended_medications.length > 0 && (
                      <div className="mt-1">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Medications:</div>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                          {r.recommended_medications.map((m, idx) => (
                            <li key={idx}>
                              {m.name}
                              {m.dosage ? ` - ${m.dosage}` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {r.recommended_tests && r.recommended_tests.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Tests:</div>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                          {r.recommended_tests.map((t, idx) => (
                            <li key={idx}>{t.test_name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Appointments */}
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Appointments</h3>
                <div className="text-xs text-gray-500">
                  Missed: {appointments.filter(a => a.status === 'MISSED').length}
                </div>
              </div>
              <div className="divide-y max-h-64 overflow-y-auto text-sm">
                {appointments.length === 0 && (
                  <div className="p-4 text-gray-500">No appointments scheduled.</div>
                )}
                {appointments.map((a) => {
                  const statusColor = a.status === 'MISSED' ? 'text-red-600' : 
                                     a.status === 'ATTENDED' ? 'text-green-600' : 
                                     a.status === 'CANCELLED' ? 'text-gray-500' : 'text-blue-600';
                  return (
                    <div key={a.id} className="px-4 py-3 flex justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatDateTime(a.scheduled_at)}
                        </div>
                        <div className="text-xs text-gray-500">Reason: {a.reason || 'N/A'}</div>
                      </div>
                      <div className="text-xs text-right">
                        <div className={`font-semibold ${statusColor}`}>
                          {a.status || 'SCHEDULED'}
                        </div>
                        {a.status === 'MISSED' && typeof a.missed_count === 'number' && (
                          <div className="text-red-500 mt-1">Missed Count: {a.missed_count}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
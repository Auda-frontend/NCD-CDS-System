import React, { useState, useEffect, useMemo } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Simple SVG Bar Chart Component
const BarChart = ({ data, height = 200, colors }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = 100 / data.length;
  
  return (
    <svg width="100%" height={height} className="overflow-visible">
      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * (height - 40);
        const x = (index * barWidth) + (barWidth / 2) - 15;
        const y = height - barHeight - 20;
        const color = colors[index % colors.length];
        
        return (
          <g key={index}>
            <rect
              x={`${index * barWidth}%`}
              y={y}
              width={`${barWidth * 0.8}%`}
              height={barHeight}
              fill={color}
              rx="4"
              className="hover:opacity-80 transition-opacity"
            />
            <text
              x={`${index * barWidth + barWidth / 2}%`}
              y={height - 5}
              textAnchor="middle"
              className="text-xs fill-gray-600"
              fontSize="10"
            >
              {item.label}
            </text>
            <text
              x={`${index * barWidth + barWidth / 2}%`}
              y={y - 5}
              textAnchor="middle"
              className="text-xs fill-gray-900 font-semibold"
              fontSize="11"
            >
              {item.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// Simple Pie Chart Component
const PieChart = ({ data, size = 200 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <p className="text-gray-400 text-sm">No data</p>
      </div>
    );
  }
  
  let currentAngle = -90;
  const radius = size / 2 - 10;
  const center = size / 2;
  
  return (
    <svg width={size} height={size} className="overflow-visible">
      {data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        
        const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
        const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
        const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180);
        const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180);
        const largeArc = angle > 180 ? 1 : 0;
        
        const pathData = [
          `M ${center} ${center}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');
        
        currentAngle = endAngle;
        
        // Label position
        const labelAngle = (startAngle + endAngle) / 2;
        const labelRadius = radius * 0.7;
        const labelX = center + labelRadius * Math.cos((labelAngle * Math.PI) / 180);
        const labelY = center + labelRadius * Math.sin((labelAngle * Math.PI) / 180);
        
        return (
          <g key={index}>
            <path
              d={pathData}
              fill={item.color}
              className="hover:opacity-80 transition-opacity"
            />
            {percentage > 5 && (
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-white font-semibold"
                fontSize="11"
              >
                {Math.round(percentage)}%
              </text>
            )}
          </g>
        );
      })}
      {data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;
        return null;
      })}
    </svg>
  );
};

// Line Chart Component for trends
const LineChart = ({ data, height = 200, color = '#3B82F6' }) => {
  if (data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const width = 100;
  const stepX = width / (data.length - 1 || 1);
  const stepY = (height - 40) / maxValue;
  
  const points = data.map((item, index) => {
    const x = index * stepX;
    const y = height - 20 - (item.value * stepY);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width="100%" height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        className="drop-shadow-sm"
      />
      {data.map((item, index) => {
        const x = index * stepX;
        const y = height - 20 - (item.value * stepY);
        return (
          <g key={index}>
            <circle
              cx={x}
              cy={y}
              r="4"
              fill={color}
              className="hover:r-6 transition-all"
            />
            <text
              x={x}
              y={y - 10}
              textAnchor="middle"
              className="text-xs fill-gray-600"
              fontSize="9"
            >
              {item.value}
            </text>
            <text
              x={x}
              y={height - 5}
              textAnchor="middle"
              className="text-xs fill-gray-500"
              fontSize="9"
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [visits, setVisits] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [patientsRes, appointmentsRes, visitsRes, recommendationsRes, prescriptionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/patients`),
        fetch(`${API_BASE_URL}/appointments`),
        fetch(`${API_BASE_URL}/visits`),
        fetch(`${API_BASE_URL}/cds-recommendations`),
        fetch(`${API_BASE_URL}/prescriptions`)
      ]);

      setPatients((await patientsRes.json()) || []);
      setAppointments((await appointmentsRes.json()) || []);
      setVisits((await visitsRes.json()) || []);
      setRecommendations((await recommendationsRes.json()) || []);
      setPrescriptions((await prescriptionsRes.json()) || []);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPatients = patients.length;
    const totalAppointments = appointments.length;
    const totalVisits = visits.length;
    const totalRecommendations = recommendations.length;
    const totalPrescriptions = prescriptions.length;

    // Appointment statistics
    const attended = appointments.filter(a => a.status === 'ATTENDED').length;
    const missed = appointments.filter(a => a.status === 'MISSED').length;
    const scheduled = appointments.filter(a => a.status === 'SCHEDULED').length;
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;
    const attendanceRate = totalAppointments > 0 ? ((attended / totalAppointments) * 100).toFixed(1) : 0;

    // Disease statistics from visits
    let patientsWithHypertension = 0;
    let patientsWithDiabetes = 0;
    const patientDiseases = new Set();
    
    visits.forEach(visit => {
      if (visit.medical_history) {
        if (visit.medical_history.hypertension) {
          patientDiseases.add(`${visit.patient_id}-hypertension`);
        }
        if (visit.medical_history.diabetes) {
          patientDiseases.add(`${visit.patient_id}-diabetes`);
        }
      }
    });
    
    patientsWithHypertension = new Set(Array.from(patientDiseases).filter(d => d.includes('hypertension')).map(d => d.split('-')[0])).size;
    patientsWithDiabetes = new Set(Array.from(patientDiseases).filter(d => d.includes('diabetes')).map(d => d.split('-')[0])).size;

    // Also check recommendations for hypertension/diabetes diagnoses
    recommendations.forEach(rec => {
      const diagnosis = rec.diagnosis?.toLowerCase() || '';
      if (diagnosis.includes('hypertension') || diagnosis.includes('htn')) {
        patientDiseases.add(`${rec.patient_id || rec.visit_id}-hypertension`);
      }
      if (diagnosis.includes('diabetes') || diagnosis.includes('diabetic')) {
        patientDiseases.add(`${rec.patient_id || rec.visit_id}-diabetes`);
      }
    });

    // Follow-up status calculation
    const patientAppointments = {};
    appointments.forEach(apt => {
      if (!patientAppointments[apt.patient_id]) {
        patientAppointments[apt.patient_id] = [];
      }
      patientAppointments[apt.patient_id].push(apt);
    });

    let activePatients = 0;
    let lostFollowUp = 0;
    let dropouts = 0;

    Object.values(patientAppointments).forEach(apts => {
      const missedCount = apts.filter(a => a.status === 'MISSED').length;
      if (missedCount >= 3) {
        dropouts++;
      } else if (missedCount >= 1) {
        lostFollowUp++;
      } else {
        activePatients++;
      }
    });

    // Patients with no appointments are considered active
    const patientsWithAppointments = Object.keys(patientAppointments).length;
    activePatients += (totalPatients - patientsWithAppointments);

    // Monthly trends (last 6 months)
    const monthlyData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthVisits = visits.filter(v => {
        const visitDate = new Date(v.visit_date);
        return `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}` === monthKey;
      }).length;
      monthlyData.push({
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        value: monthVisits
      });
    }

    return {
      totalPatients,
      totalAppointments,
      totalVisits,
      totalRecommendations,
      totalPrescriptions,
      attendanceRate,
      attended,
      missed,
      scheduled,
      cancelled,
      patientsWithHypertension,
      patientsWithDiabetes,
      activePatients,
      lostFollowUp,
      dropouts,
      monthlyData
    };
  }, [patients, appointments, visits, recommendations, prescriptions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const appointmentStatusData = [
    { label: 'Attended', value: stats.attended, color: '#10B981' },
    { label: 'Missed', value: stats.missed, color: '#EF4444' },
    { label: 'Scheduled', value: stats.scheduled, color: '#3B82F6' },
    { label: 'Cancelled', value: stats.cancelled, color: '#6B7280' }
  ].filter(item => item.value > 0);

  const followUpStatusData = [
    { label: 'Active', value: stats.activePatients, color: '#10B981' },
    { label: 'Lost Follow-up', value: stats.lostFollowUp, color: '#F59E0B' },
    { label: 'Dropout', value: stats.dropouts, color: '#EF4444' }
  ].filter(item => item.value > 0);

  const diseaseData = [
    { label: 'Hypertension', value: stats.patientsWithHypertension, color: '#8B5CF6' },
    { label: 'Diabetes', value: stats.patientsWithDiabetes, color: '#F59E0B' }
  ].filter(item => item.value > 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">NCD Management Analytics</h1>
          <p className="text-gray-600 mt-1">Overview of clinical decision support system performance</p>
        </div>
        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase mb-1">Total Patients</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase mb-1">Total Visits</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalVisits}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase mb-1">Appointments</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalAppointments}</p>
          <p className="text-xs text-green-600 mt-1">Attendance: {stats.attendanceRate}%</p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase mb-1">CDS Recommendations</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalRecommendations}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase mb-1">Prescriptions</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalPrescriptions}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Status Distribution */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Status Distribution</h3>
          <div className="flex items-center justify-center">
            {appointmentStatusData.length > 0 ? (
              <PieChart data={appointmentStatusData} size={250} />
            ) : (
              <p className="text-gray-400">No appointment data</p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            {appointmentStatusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.label}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Follow-up Status */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Follow-up Status</h3>
          <div className="flex items-center justify-center">
            {followUpStatusData.length > 0 ? (
              <PieChart data={followUpStatusData} size={250} />
            ) : (
              <p className="text-gray-400">No follow-up data</p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            {followUpStatusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.label}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disease Distribution */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Disease Distribution</h3>
          {diseaseData.length > 0 ? (
            <>
              <BarChart 
                data={diseaseData.map(d => ({ label: d.label, value: d.value }))} 
                colors={diseaseData.map(d => d.color)}
                height={200}
              />
              <div className="mt-4 space-y-2">
                {diseaseData.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.value} patients</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-center py-8">No disease data available</p>
          )}
        </div>

        {/* Monthly Visits Trend */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Visits Trend</h3>
          {stats.monthlyData.length > 0 ? (
            <LineChart data={stats.monthlyData} height={200} />
          ) : (
            <p className="text-gray-400 text-center py-8">No visit data available</p>
          )}
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Attendance Rate</span>
              <span className="text-sm font-semibold text-gray-900">{stats.attendanceRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Attended</span>
              <span className="text-sm font-semibold text-green-600">{stats.attended}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Missed</span>
              <span className="text-sm font-semibold text-red-600">{stats.missed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Scheduled</span>
              <span className="text-sm font-semibold text-blue-600">{stats.scheduled}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Disease Management</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Hypertension Cases</span>
              <span className="text-sm font-semibold text-purple-600">{stats.patientsWithHypertension}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Diabetes Cases</span>
              <span className="text-sm font-semibold text-orange-600">{stats.patientsWithDiabetes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Active Patients</span>
              <span className="text-sm font-semibold text-green-600">{stats.activePatients}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow-up Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active</span>
              <span className="text-sm font-semibold text-green-600">{stats.activePatients}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Lost Follow-up</span>
              <span className="text-sm font-semibold text-yellow-600">{stats.lostFollowUp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Dropouts</span>
              <span className="text-sm font-semibold text-red-600">{stats.dropouts}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

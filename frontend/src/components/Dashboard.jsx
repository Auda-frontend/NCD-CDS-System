import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import PatientsView from './PatientsView';
import VisitsView from './VisitsView';
import AppointmentsView from './AppointmentsView';
import CDSRecommendationsView from './CDSRecommendationsView';
import PatientDashboard from './PatientDashboard';

const Dashboard = ({ backendStatus }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;
  let activeView = 'dashboard';
  if (path.startsWith('/patients')) activeView = 'patients';
  else if (path.startsWith('/visits')) activeView = 'visits';
  else if (path.startsWith('/appointments')) activeView = 'appointments';
  else if (path.startsWith('/cds-recommendations')) activeView = 'cds-recommendations';

  const handleNavigate = (viewId) => {
    switch (viewId) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'patients':
        navigate('/patients');
        break;
      case 'visits':
        navigate('/visits');
        break;
      case 'appointments':
        navigate('/appointments');
        break;
      case 'cds-recommendations':
        navigate('/cds-recommendations');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar activeView={activeView} setActiveView={handleNavigate} />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/dashboard" element={<PatientDashboard />} />
          <Route path="/patients" element={<PatientsView />} />
          <Route path="/visits" element={<VisitsView />} />
          <Route path="/appointments" element={<AppointmentsView />} />
          <Route path="/cds-recommendations" element={<CDSRecommendationsView />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
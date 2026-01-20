import React from 'react';

const iconClass = 'w-5 h-5 text-gray-500';

const IconDashboard = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 13h4v7H4zM10 4h4v16h-4zM16 9h4v11h-4z" />
  </svg>
);

const IconPatients = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-2.67 0-8 1.34-8 4v1h8m6-7a4 4 0 1 0-4-4m4 4c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4Z" />
  </svg>
);

const IconVisits = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="M8 3v4m8-4v4M4 11h16" />
  </svg>
);

const IconAppointments = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M7 2v4m10-4v4M3 10h18m-6 5h4" />
  </svg>
);

const IconCDS = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M9 9h6M9 12h4M9 15h2" />
    <circle cx="15" cy="15" r="0.8" fill="currentColor" />
  </svg>
);

const Sidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
    { id: 'patients', label: 'Patients', icon: <IconPatients /> },
    { id: 'visits', label: 'Visits', icon: <IconVisits /> },
    { id: 'appointments', label: 'Appointments', icon: <IconAppointments /> },
    { id: 'cds-recommendations', label: 'CDS Recommendations', icon: <IconCDS /> },
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      {/* <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800">Navigation</h2>
      </div> */}
      <nav className="mt-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
              activeView === item.id
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
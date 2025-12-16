import React from 'react';

const Sidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'patients', label: 'Patients', icon: '👥' },
    { id: 'visits', label: 'Visits', icon: '📋' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'cds-recommendations', label: 'CDS Recommendations', icon: '🤖' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800">Navigation</h2>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
              activeView === item.id
                ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
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
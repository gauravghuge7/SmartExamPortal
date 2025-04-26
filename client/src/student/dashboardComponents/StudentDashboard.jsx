// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import StudentDashboardLayout from './StudentDashboardLayout';

// Assuming we'll add some graph component (you can replace with actual charting library)
const StudentDashboard = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  return (
      <StudentDashboardLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}> 
      {/* Main Content */}
      <div className="flex-1 p-6 mt-16 md:mt-0">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Performance Overview</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div>
                {/* Add your graph components here */}
                <p className="text-gray-600">Your performance metrics will be displayed here</p>
                {/* Example placeholder for graphs */}
                <div className="h-64 bg-gray-100 rounded-md mt-4 flex items-center justify-center">
                  <span>Graph Placeholder (e.g., Chart.js or Recharts)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </StudentDashboardLayout>
  );
};

export default StudentDashboard;
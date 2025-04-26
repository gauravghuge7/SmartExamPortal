import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const StudentDashboardLayout = ({ sidebarOpen, setSidebarOpen, children }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current route

  const handleLogout = () => {
    localStorage.removeItem("examUser");
    toast.success('Logged out successfully!');
    navigate('/');
  };

  // Determine the active route
  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('myexams')) return 'myExams';
    if (path.includes('exam-history')) return 'Exam History';
    if (path.includes('profile')) return 'Profile';
    if (path.includes('settings')) return 'Settings';
    return 'Dashboard'; // Default to Dashboard
  };

  const activeItem = getActiveItem();

  return (
    <div className="flex min-h-screen bg-gray-100 mt-5">
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />

      {/* Sidebar */}
      <div
        className={`mt-10 fixed inset-y-0 left-0 w-64 bg-green-800 text-white transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-20`}
      >
        <div className="p-6 border-b border-green-700">
          <h2 className="text-2xl font-bold text-white">Student Portal</h2>
          <p className="text-sm text-green-200">Welcome Back!</p>
        </div>
        <nav className="mt-4">
          {['Dashboard', 'myExams', 'Profile', 'Exam History', 'Settings'].map((item) => (
            <div
              key={item}
              onClick={() => navigate(`/student/${item.toLowerCase().replace(' ', '-')}`)}
              className={`p-4 cursor-pointer ${
                item === activeItem ? 'bg-green-600' : 'hover:bg-green-700'
              } transition-colors flex items-center space-x-2`}
            >
              <span>{item}</span>
            </div>
          ))}
          <div
            onClick={handleLogout}
            className="p-4 cursor-pointer hover:bg-green-700 transition-colors flex items-center space-x-2 mt-4"
          >
            <span>Logout</span>
          </div>
        </nav>
      </div>

      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden p-4 bg-green-800 text-white fixed top-0 left-0 z-30 w-full flex justify-between items-center">
        <h2 className="text-xl font-bold">Student Portal</h2>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 p-6 mt-16 md:mt-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6 mt-10">
          {/* Content inside the Dashboard that should scroll */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardLayout;
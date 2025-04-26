import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import toast, { Toaster } from 'react-hot-toast';
import UniversityDashboardLayout from './UniversityDashboardLayout';

const UniversityDashboard = () => {
  const navigate = useNavigate();
  const [university, setUniversity] = useState(null);
  const [examStats, setExamStats] = useState({
    totalExams: 0,
    studentsAssigned: 0,
    studentsAttended: 0,
  });
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchUniversityData();
    fetchExamStats();
  }, []);

  const fetchUniversityData = async () => {
    try {
      setLoading(true);
      toast.loading('Fetching university data...');
      const response = await axiosInstance.get('/university/auth/getUniversityDetails');
      console.log("response.data", response?.data?.data);
      setUniversity(response?.data?.data?.university);
      toast.dismiss();
      toast.success('University data loaded!');
    } catch (error) {
      console.error('Error fetching university data:', error);
      toast.dismiss();
      toast.error('Failed to load university data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExamStats = async () => {
    // try {
    //   setLoading(true);
    //   toast.loading('Fetching exam statistics...');
    //   const response = await axiosInstance.get('/university/exam/stats');
    //   setExamStats(response.data);
    //   toast.dismiss();
    //   toast.success('Exam stats loaded!');
    // } catch (error) {
    //   console.error('Error fetching exam stats:', error);
    //   toast.dismiss();
    //   toast.error('Failed to load exam stats');
    // } finally {
    //   setLoading(false);
    // }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  
  return (
    <UniversityDashboardLayout sidebarOpen={true} setSidebarOpen={true}>

      {/* Scrollable Main Content (Starts Below Navbar) */}
      <div className=" overflow-y-auto min-h-screen">
        <div className="">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 text-green-700 tracking-tight">
              University Dashboard
            </h1>

            {/* University Info */}
            <div className="bg-white rounded-xl shadow-2xl p-6 flex flex-col md:flex-row items-center justify-between">
              {university ? (
                <>
                  <div className="flex items-center space-x-4">
                    <img
                      src={university?.universityLogo?.secure_url || 'https://res.cloudinary.com/dsh5742fk/image/upload/v1742877848/yo31mbg0b7ns1dcexndq.jpg'}
                      alt="University Logo"
                      className="w-16 h-16 rounded-full object-cover border-2 border-green-500 shadow-sm"
                    />
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-green-700">{university?.universityName}</h2>
                      <p className="text-gray-600">{university.universityEmail}</p>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <button
                      onClick={() => navigate('/university/profile')}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300"
                    >
                      Edit Profile
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-gray-600">Loading university data...</p>
              )}
            </div>

            {/* Stats Section */}
            <div className="bg-white rounded-xl shadow-2xl p-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-green-700 mb-6">Exam Statistics</h2>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-all duration-200">
                    <h3 className="text-lg font-semibold text-green-700">Total Exams</h3>
                    <p className="text-2xl font-bold text-yellow-500">{examStats.totalExams || 23}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-all duration-200">
                    <h3 className="text-lg font-semibold text-green-700">Students Assigned</h3>
                    <p className="text-2xl font-bold text-yellow-500">{examStats.studentsAssigned || 22}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-all duration-200">
                    <h3 className="text-lg font-semibold text-green-700">Students Attended</h3>
                    <p className="text-2xl font-bold text-yellow-500">{examStats.studentsAttended || 10}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-2xl p-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-green-700 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/university/exams')}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-300"
                >
                  Manage Exams
                </button>
                <button
                  onClick={() => navigate('/university/students')}
                  className="bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 font-semibold py-3 rounded-lg shadow-md transition-all duration-300"
                >
                  View Students
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      </UniversityDashboardLayout>
  );
};

export default UniversityDashboard;
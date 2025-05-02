import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from './../../services/axiosInstance';
import UniversityDashboardLayout from './UniversityDashboardLayout';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const UniversityDashboard = () => {
  const navigate = useNavigate();
  const [university, setUniversity] = useState(null);
  const [examStats, setExamStats] = useState({
    totalExams: 0,
    studentsAssigned: 0,
    studentsAttended: 0,
  });
  const [recentExams, setRecentExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchUniversityData();
    fetchExamStats();
    fetchRecentExams();
  }, []);

  const fetchUniversityData = async () => {
    try {
      setLoading(true);
      toast.loading('Fetching university data...');
      const response = await axiosInstance.get('/university/auth/getUniversityDetails');
      setUniversity(response?.data?.data?.university);
      toast.success('University data loaded!');
    } catch (error) {
      console.error('Error fetching university data:', error);
      toast.error('Failed to load university data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExamStats = async () => {
    try {
      setLoading(true);
      toast.loading('Fetching exam statistics...');
      const response = await axiosInstance.get('/university/exam/stats');
      setExamStats(response?.data);
      toast.dismiss();
      toast.success('Exam stats loaded!');
    } catch (error) {
      console.error('Error fetching exam stats:', error);
      toast.dismiss();
      toast.error('Failed to load exam stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentExams = async () => {
    try {
      setLoading(true);
      toast.loading('Fetching recent exams...');
      const response = await axiosInstance.get('/university/exam/recent');
      const exams = response?.data?.exams || [];
      setRecentExams(exams.map(exam => ({
        id: exam._id,
        name: exam.examName,
        date: new Date(exam.examDate).toLocaleDateString(),
        students: exam.studentsAssigned,
        attended: exam.studentsAttended,
        passRate: exam.passRate || 0,
      })));
      toast.dismiss();
      toast.success('Recent exams loaded!');
    } catch (error) {
      console.error('Error fetching recent exams:', error);
      toast.dismiss();
      toast.error('Failed to load recent exams');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  const pieData = [
    { name: 'Attended', value: examStats.studentsAttended },
    { name: 'Not Attended', value: examStats.studentsAssigned - examStats.studentsAttended },
  ];

  const barData = recentExams.map(exam => ({
    name: exam.name,
    pass: exam.passRate,
  }));

  const COLORS = ['#4F46E5', '#F87171'];

  return (
    <UniversityDashboardLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <div className="min-h-screen bg-gray-100 py-8 px-4 md:px-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* University Info */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row items-center justify-between">
            {university ? (
              <>
                <div className="flex items-center space-x-4">
                  <img
                    src={university?.universityLogo?.secure_url ||
                      'https://res.cloudinary.com/dsh5742fk/image/upload/v1742877848/yo31mbg0b7ns1dcexndq.jpg'}
                    alt="University Logo"
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{university?.universityName}</h2>
                    <p className="text-gray-600 text-sm">{university.universityEmail}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/university/profile')}
                  className="mt-4 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-md shadow transition-all duration-200"
                >
                  Edit Profile
                </button>
              </>
            ) : (
              <p className="text-gray-600">Loading university data...</p>
            )}
          </div>

          {/* Statistics and Charts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-6">Exam Insights</h2>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pie Chart */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <p className="text-center text-gray-500 text-sm mt-2">Student Attendance</p>
                  </div>

                  {/* Bar Chart */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis unit="%" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="pass" fill="#4F46E5" name="Passing %" />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-center text-gray-500 text-sm mt-2">Passing Percentage per Exam</p>
                  </div>
                </div>

                {/* Recent Exams Table */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Exams</h3>
                  {recentExams.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50 text-gray-700">
                            <th className="p-3 font-semibold">Exam Name</th>
                            <th className="p-3 font-semibold">Date</th>
                            <th className="p-3 font-semibold">Students Assigned</th>
                            <th className="p-3 font-semibold">Students Attended</th>
                            <th className="p-3 font-semibold">Pass Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentExams.map((exam) => (
                            <tr key={exam.id} className="border-b hover:bg-gray-50 transition-colors duration-200">
                              <td className="p-3">{exam.name}</td>
                              <td className="p-3">{exam.date}</td>
                              <td className="p-3">{exam.students}</td>
                              <td className="p-3">{exam.attended}</td>
                              <td className="p-3">{exam.passRate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No recent exams available.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/university/exams')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-md shadow transition-all duration-200"
              >
                Manage Exams
              </button>
              <button
                onClick={() => navigate('/university/students')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-md shadow transition-all duration-200"
              >
                View Students
              </button>
            </div>
          </div>
        </div>
      </div>
    </UniversityDashboardLayout>
  );
};

export default UniversityDashboard;
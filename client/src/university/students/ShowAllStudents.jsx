import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
import toast, { Toaster } from 'react-hot-toast';
import UniversityDashboardLayout from '../dashboard/UniversityDashboardLayout';

const ShowAllStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hoveredStudent, setHoveredStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      toast.loading('Fetching students...');
      const response = await axiosInstance.get('/university/exam/getAllStudents');
      if (response.data.statusCode === 200) {
        setStudents(response.data.data.students);
        toast.dismiss();
        toast.success('Students loaded!');
      } else {
        throw new Error(response.data.message || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.dismiss();
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  const handleBack = () => {
    navigate('/university/dashboard');
  };

  const handleExamInfo = (studentId) => {
    navigate(`/university/students/${studentId}/exam-info`);
  };

  const sidebarItems = [
    { name: 'Dashboard', path: '/university/dashboard' },
    { name: 'Exams', path: '/university/exams' },
    { name: 'Students', path: '/university/students', active: true },
    { name: 'Profile', path: '/university/profile' },
  ];

  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) || 
      student.studentPhone.includes(searchTerm);
    const registrationDate = new Date(student.createdAt).toISOString().split('T')[0];
    const matchesDate = filterDate ? registrationDate === filterDate : true;
    return matchesSearch && matchesDate;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
      <UniversityDashboardLayout sidebarOpen={false} setSidebarOpen={true}> 
      {/* Main Content */}
      <div className="overflow-y-auto min-h-screen">
        <div>
          <div className="max-w-6xl mx-auto space-y-8">

            <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 text-green-700 tracking-tight">
              All Students
            </h1>

            <div className="bg-white rounded-xl shadow-2xl p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-1/2">
                  <input
                    type="text"
                    placeholder="Search by email or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400 text-gray-800 transition-all duration-200 pl-10"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="w-full sm:w-1/3">
                  <label className="block mb-1 font-medium text-green-700">Filter by Registration Date</label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-2xl overflow-hidden relative">
              {loading ? (
                <p className="p-6 text-center text-gray-600">Loading students...</p>
              ) : filteredStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-green-50 text-green-800">
                        <th className="p-4 text-left font-semibold">Name</th>
                        <th className="p-4 text-left font-semibold">Email</th>
                        <th className="p-4 text-left font-semibold">Phone</th>
                        <th className="p-4 text-left font-semibold">Registration Date</th>
                        <th className="p-4 text-left font-semibold">Last Updated</th>
                        <th className="p-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr
                          key={student._id}
                          className="hover:bg-yellow-50 transition-all duration-200 border-b border-gray-200 relative"
                          onMouseEnter={() => setHoveredStudent(student)}
                          onMouseLeave={() => setHoveredStudent(null)}
                        >
                          <td className="p-4">{student.studentName}</td>
                          <td className="p-4">{student.studentEmail}</td>
                          <td className="p-4">{student.studentPhone}</td>
                          <td className="p-4">{formatDate(student.createdAt)}</td>
                          <td className="p-4">{formatDate(student.updatedAt)}</td>
                          <td className="p-4">
                            <button
                              onClick={() => handleExamInfo(student._id)}
                              className="cursor-pointer bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-all duration-200"
                            >
                              Exam Info
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="p-6 text-center text-gray-600">No students found.</p>
              )}

              {hoveredStudent && (
                <div className="absolute z-30 bg-white rounded-lg shadow-xl p-4 border border-green-200 w-80 transform -translate-y-1/2 top-1/2 left-1/2 -translate-x-1/2">
                  <div className="flex items-center space-x-4">
                    <img
                      src={hoveredStudent.studentPhoto.secure_url}
                      alt={hoveredStudent.studentName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-green-500"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-green-700">{hoveredStudent.studentName}</h3>
                      <p className="text-sm text-gray-600">{hoveredStudent.studentEmail}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-gray-700"><span className="font-medium text-green-700">Phone:</span> {hoveredStudent.studentPhone}</p>
                    <p className="text-sm text-gray-700"><span className="font-medium text-green-700">Registered:</span> {formatDate(hoveredStudent.createdAt)}</p>
                    <p className="text-sm text-gray-700"><span className="font-medium text-green-700">Last Updated:</span> {formatDate(hoveredStudent.updatedAt)}</p>
                    <p className="text-sm text-gray-700"><span className="font-medium text-green-700">ID:</span> {hoveredStudent._id}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-green-700 text-sm">
              Total Students: <span className="font-semibold">{filteredStudents.length}</span>
            </div>
          </div>
        </div>
      </div>
       </UniversityDashboardLayout>
  );
};

export default ShowAllStudents;
// AllExams.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
import toast, { Toaster } from 'react-hot-toast';
import StudentDashboardLayout from './StudentDashboardLayout';

const AllExams = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      toast.loading('Fetching your exams...');
      const response = await axiosInstance.get('/student/exam/getMyExams');
      setExams(response?.data?.data?.exams);
      setFilteredExams(response?.data?.data?.exams);
      toast.dismiss();
      toast.success('Exams loaded successfully!');
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.dismiss();
      toast.error('Failed to load exams');
    } 
    finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = exams.filter((exam) =>
      exam.examName.toLowerCase().includes(query)
    );
    setFilteredExams(filtered);
  };

  const handleStartExam = (examId) => {
    navigate(`/exam/start/${examId}`);
    toast.success('Starting exam...');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  return (
      <StudentDashboardLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>

        {/* Main Content */}
        <div className="flex-1 p-6 mt-10  md:mt-0">
          <div className="max-w-4xl mx-auto mt-10 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Exams</h2>
              <input
                type="text"
                placeholder="Search exams by name..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full bg-gray-50 border border-gray-300 rounded-md p-3 mb-4"
              />
              {loading ? <p>Loading...</p> : (
                filteredExams.length > 0 ? (
                  filteredExams.map(exam => (
                    <div key={exam._id} className="flex justify-between items-center bg-gray-50 p-4 rounded-md mb-2">
                      <div>
                        <h3 className="text-lg font-medium">{exam.examName}</h3>
                        <p>Date: {exam.examDate} | Time: {exam.examTime} | Duration: {exam.examDuration} mins</p>
                      </div>
                      <button
                        onClick={() => handleStartExam(exam._id)}
                        className="cursor-pointer bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
                      >
                        Start Exam
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No exams available</p>
                )
              )}
            </div>
          </div>
        </div>
          
      </StudentDashboardLayout>
  );
};

export default AllExams;
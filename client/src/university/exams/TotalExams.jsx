import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
import toast, { Toaster } from 'react-hot-toast';
import UniversityDashboardLayout from '../dashboard/UniversityDashboardLayout';

const TotalExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      toast.loading('Fetching exams...');
      const response = await axiosInstance.get('/university/exam/getAllExams');
      if (response.data.statusCode === 200) {
        setExams(response.data.data.exams);
        toast.dismiss();
        toast.success('Exams fetched successfully!');
      } else {
        console.error('Failed to fetch exams:', response.data.message);
        toast.dismiss();
        toast.error('Failed to fetch exams');
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.dismiss();
      toast.error('Error fetching exams');
    }
  };

  const filteredExams = exams.filter((exam) =>
    exam.examName.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  const handleBack = () => {
    navigate('/university/dashboard');
  };

  return (
    <UniversityDashboardLayout sidebarOpen={true} setSidebarOpen={true}>
      {/* Scrollable Main Content (Starts Below Navbar) */}
      <div className="overflow-y-auto min-h-screen">
        <div className="">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-4 sm:mb-0">
                Total Examinations
              </h1>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search exams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400 text-gray-800 transition-all duration-200 pl-10"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <Link
                  to="/university/createExam"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-300 flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create New Exam
                </Link>
              </div>
            </div>

            {/* Exams List */}
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="divide-y divide-gray-200">
                {filteredExams.length > 0 ? (
                  filteredExams.map((exam) => (
                    <div
                      key={exam._id}
                      className="px-6 py-4 hover:bg-green-50 transition-all duration-200"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div className="flex-1">
                          <h2 className="text-lg font-semibold text-green-800">{exam.examName}</h2>
                          <p className="text-sm text-gray-600 mt-1">{exam.examType}</p>
                          <p className="text-sm text-gray-700">
                            {exam.examDate} | {exam.examTime}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                     
                          <Link
                            to={`/university/exam/dashboard/${exam._id}`}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-3 py-1 rounded-lg transition-all duration-200"
                          >
                            View Dashboard
                          </Link>
                          <Link
                            to={`/university/addQuestions/${exam._id}`}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-3 py-1 rounded-lg transition-all duration-200"
                          >
                            Edit Questions
                          </Link>
                          <Link
                            to={`/university/examDetails/${exam._id}`}
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-3 py-1 rounded-lg transition-all duration-200"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-4 text-center text-gray-600">
                    No exams found matching your search.
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="text-green-700 text-sm">
              Total Exams: <span className="font-semibold">{filteredExams.length}</span>
            </div>
          </div>
        </div>
      </div>
      
      </UniversityDashboardLayout>
  );
};

export default TotalExams;
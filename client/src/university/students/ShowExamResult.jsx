import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance'; // Adjust path
import toast, { Toaster } from 'react-hot-toast';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import UniversityDashboardLayout from '../dashboard/UniversityDashboardLayout';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const ShowExamResult = () => {
  const { examId } = useParams(); // Get examId from URL params
  const navigate = useNavigate();
  const location = useLocation(); // Added to track active sidebar item
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchExamResult();
  }, [examId]); // Dependency on examId only

  const fetchExamResult = async () => {
    try {
      setLoading(true);
      toast.loading('Fetching exam result...');

      // Fetch exam result using GET request
      const resultResponse = await axiosInstance.get(`/student/exam/viewExamResult/${examId}`);
      console.log("resultResponse", resultResponse);

      if (resultResponse.data.statusCode === 200) {
        const answerSheet = resultResponse.data.data.answerSheet[0]; // Assuming first item for this examId
        if (!answerSheet) {
          throw new Error('No result found for this exam');
        }

        // Map the response data to the expected result structure
        const processedResult = {
          examName: 'Exam Name Placeholder', // Replace with actual examName if added to response
          examDate: 'N/A', // Replace with actual examDate if added to response
          examTime: 'N/A', // Replace with actual examTime if added to response
          examType: 'N/A', // Replace with actual examType if added to response
          totalMarksObtained: answerSheet.examScore,
          examMarks: answerSheet.questions.reduce((sum, q) => sum + q.questionMarks, 0), // Sum of all question marks
          examDuration: answerSheet.examDurationByStudent,
          answers: answerSheet.studentanswers.map((sa, index) => {
            const question = answerSheet.questions.find(q => q._id === sa.question);
            return {
              questionTitle: question?.questionTitle || `Question ${index + 1}`,
              studentAnswer: sa.answerText,
              correctAnswer: question?.questionAnswer || 'N/A',
              marksObtained: sa.isCorrect ? sa.answerMarks : 0, // Assuming marks only awarded if fully correct
              maxMarks: question?.questionMarks || 0,
            };
          }),
        };

        setResult(processedResult);
        toast.dismiss();
        toast.success('Result loaded!');
      } else {
        throw new Error(resultResponse.data.message || 'Failed to fetch result');
      }
    } catch (error) {
      console.error('Error fetching exam result:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to load exam result');
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
    navigate('/student/exam-history'); // Updated to match student context
  };


  const formatDate = (dateString) => {
    return dateString === 'N/A' 
      ? 'N/A' 
      : new Date(dateString).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  };

  // Prepare data for charts
  const barData = result ? {
    labels: result.answers.map(a => a.questionTitle.slice(0, 20) + (a.questionTitle.length > 20 ? '...' : '')),
    datasets: [
      {
        label: 'Marks Obtained',
        data: result.answers.map(a => a.marksObtained || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.7)', // Green
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Max Marks',
        data: result.answers.map(a => a.maxMarks),
        backgroundColor: 'rgba(234, 179, 8, 0.7)', // Yellow
        borderColor: 'rgba(234, 179, 8, 1)',
        borderWidth: 1,
      },
    ],
  } : {};

  const pieData = result ? {
    labels: ['Correct', 'Incorrect', 'Unanswered'],
    datasets: [
      {
        data: [
          result.answers.filter(a => a.marksObtained === a.maxMarks).length,
          result.answers.filter(a => a.marksObtained > 0 && a.marksObtained < a.maxMarks).length,
          result.answers.filter(a => a.marksObtained === 0).length,
        ],
        backgroundColor: ['#22c55e', '#eab308', '#d1d5db'], // Green, Yellow, Gray
        borderColor: ['#fff'],
        borderWidth: 2,
      },
    ],
  } : {};

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Performance Breakdown' },
    },
  };

  return (
    <UniversityDashboardLayout sidebarOpen={true} setSidebarOpen={true}>

      {/* Main Content */}
      <div className="flex-1 p-6 mt-16 md:mt-0 overflow-y-auto min-h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          <button
            onClick={handleBack}
            className="mb-6 flex items-center text-green-700 hover:text-green-800 transition-all duration-200"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Exam History
          </button>

          <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 text-green-700 tracking-tight">
            Exam Result
          </h1>

          {/* Loading State */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-2xl p-6 text-center text-gray-600">Loading result...</div>
          ) : result ? (
            <>
              {/* Exam Summary */}
              <div className="bg-white rounded-xl shadow-2xl p-6 mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl font-semibold text-green-700">{result.examName}</h2>
                    <p className="text-gray-600">Date: {formatDate(result.examDate)} {result.examTime}</p>
                    <p className="text-gray-600">Type: {result.examType}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-700">
                      Total Score: {result.totalMarksObtained} / {result.examMarks}
                    </p>
                    <p className="text-sm text-gray-600">Duration: {result.examDuration} min</p>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-2xl p-6">
                  <h3 className="text-lg font-semibold text-green-700 mb-4">Marks Distribution</h3>
                  <Bar data={barData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { text: 'Marks per Question' } } }} />
                </div>
                <div className="bg-white rounded-xl shadow-2xl p-6">
                  <h3 className="text-lg font-semibold text-green-700 mb-4">Answer Breakdown</h3>
                  <Pie data={pieData} options={chartOptions} />
                </div>
              </div>

              {/* Detailed Results */}
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                <h3 className="text-lg font-semibold text-green-700 p-4 bg-green-50">Question-wise Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-green-100 text-green-800">
                        <th className="p-4 text-left font-semibold">Question</th>
                        <th className="p-4 text-left font-semibold">Student Answer</th>
                        <th className="p-4 text-left font-semibold">Correct Answer</th>
                        <th className="p-4 text-left font-semibold">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.answers.map((answer, index) => (
                        <tr key={index} className="hover:bg-yellow-50 transition-all duration-200 border-b border-gray-200">
                          <td className="p-4">{answer.questionTitle}</td>
                          <td className="p-4">{answer.studentAnswer || 'Not Answered'}</td>
                          <td className="p-4">{answer.correctAnswer}</td>
                          <td className="p-4">{answer.marksObtained} / {answer.maxMarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-2xl p-6 text-center text-gray-600">
              No result available for this exam.
            </div>
          )}
        </div>
      </div>
    </UniversityDashboardLayout>
  );
};

export default ShowExamResult;
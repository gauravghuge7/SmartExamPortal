import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentDashboardLayout from './StudentDashboardLayout';
import axiosInstance from '../../services/axiosInstance';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function ExamResult() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examResult, setExamResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'questionTitle', direction: 'asc' });
  const questionsPerPage = 5;

  useEffect(() => {
    const fetchExamResult = async () => {
      try {
        const response = await axiosInstance.get(`/student/exam/viewExamResult/${examId}`);
        setExamResult(response.data.data.answerSheet);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch exam results');
        setLoading(false);
      }
    };
    fetchExamResult();
  }, [examId]);

  // Sorting logic
  const sortedQuestions = useMemo(() => {
    if (!examResult?.questions) return [];
    const sorted = [...examResult.questions];
    sorted.sort((a, b) => {
      let aValue = a[sortConfig.key] || '';
      let bValue = b[sortConfig.key] || '';
      if (sortConfig.key === 'answerDuration') {
        const aAnswer = examResult.studentAnswers?.find(ans => ans.question.toString() === a._id.toString());
        const bAnswer = examResult.studentAnswers?.find(ans => ans.question.toString() === b._id.toString());
        aValue = aAnswer?.answerDuration || 0;
        bValue = bAnswer?.answerDuration || 0;
      } else if (sortConfig.key === 'questionMarks') {
        aValue = a.questionMarks || 0;
        bValue = b.questionMarks || 0;
      }
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
    return sorted;
  }, [examResult, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Pagination logic
  const totalPages = Math.ceil((examResult?.questions?.length || 0) / questionsPerPage);
  const paginatedQuestions = sortedQuestions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <StudentDashboardLayout>
        <div className="min-h-screen bg-gray-100 p-8">
          <div className="max-w-[90%] mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-green-200 rounded-lg"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="h-72 bg-gray-200 rounded-lg"></div>
              <div className="h-[400px] bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </StudentDashboardLayout>
    );
  }

  if (error) {
    return (
      <StudentDashboardLayout>
        <div className="min-h-screen bg-gray-100 p-8">
          <div className="max-w-[90%] mx-auto">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md">
              <p className="font-bold text-lg">Error</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </StudentDashboardLayout>
    );
  }

  if (!examResult) {
    return (
      <StudentDashboardLayout>
        <div className="min-h-screen bg-gray-100 p-8">
          <div className="max-w-[90%] mx-auto text-gray-500 text-center p-10">
            No results found
          </div>
        </div>
      </StudentDashboardLayout>
    );
  }

  // Chart data
  const correctAnswers = examResult.studentAnswers?.filter(a => a.isCorrect).length || 0;
  const incorrectAnswers = examResult.studentAnswers?.filter(a => !a.isCorrect && a.isAnswered).length || 0;
  const unanswered = (examResult.questions?.length || 0) - (examResult.studentAnswers?.length || 0);

  const barChartData = {
    labels: ['Correct', 'Incorrect', 'Unanswered'],
    datasets: [
      {
        label: 'Questions',
        data: [correctAnswers, incorrectAnswers, unanswered],
        backgroundColor: ['#10B981', '#EF4444', '#D1D5DB'],
        borderColor: ['#059669', '#DC2626', '#9CA3AF'],
        borderWidth: 2,
        borderRadius: 5,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 14 } } },
      title: { display: true, text: 'Performance Breakdown', font: { size: 18, weight: 'bold' } },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        title: { display: true, text: 'Number of Questions', font: { size: 14 } },
        grid: { color: '#E5E7EB' },
      },
      x: { grid: { display: false } },
    },
  };

  const percentage = examResult.examMarks ? ((examResult.examScore / examResult.examMarks) * 100).toFixed(2) : 0;
  const doughnutChartData = {
    labels: ['Score', 'Remaining'],
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: ['#10B981', '#E5E7EB'],
        borderColor: ['#059669', '#D1D5DB'],
        borderWidth: 2,
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 14 } } },
      title: { display: true, text: 'Score Percentage', font: { size: 18, weight: 'bold' } },
    },
    cutout: '60%',
  };

  return (
    <StudentDashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-100 p-8">
        <div className="max-w-[90%] mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>

          {/* Header */}
          <h1 className="text-5xl font-extrabold text-green-800 mb-10 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
            Exam Result Analysis
          </h1>

          {/* Exam Overview */}
          <div className="bg-white rounded-2xl shadow-xl p-10 mb-10 bg-gradient-to-br from-green-50 to-white">
            <h2 className="text-3xl font-semibold text-green-700 mb-8">Exam Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-green-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600">Exam Name</p>
                <p className="text-xl font-medium text-gray-900">{examResult.examInfo?.examName || 'N/A'}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600">Date</p>
                <p className="text-xl font-medium text-gray-900">
                  {examResult.examInfo?.examDate ? new Date(examResult.examInfo.examDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600">Type</p>
                <p className="text-xl font-medium text-gray-900">{examResult.examInfo?.examType || 'N/A'}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-xl font-medium text-gray-900">
                  {examResult.examInfo?.examDuration ? `${examResult.examInfo.examDuration} minutes` : 'N/A'}
                </p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-xl font-medium text-gray-900">{examResult.examStatus || 'N/A'}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-xl font-medium text-gray-900 truncate">{examResult.examInfo?.examDescription || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Score Analysis */}
          <div className="bg-white rounded-2xl shadow-xl p-10 mb-10 bg-gradient-to-br from-green-50 to-white">
            <h2 className="text-3xl font-semibold text-green-700 mb-8">Score Analysis</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="space-y-6">
                <div>
                  <p className="text-lg font-medium text-gray-900">Total Score: {examResult.examScore || 0} / {examResult.examMarks || 0}</p>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">Questions Solved: {examResult.totalQuestionsSolved || 0} / {examResult.questions?.length || 0}</p>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">Percentage: {percentage}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                    <div
                      className="bg-green-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Average Time per Question: {examResult.studentAnswers?.length
                      ? (examResult.studentAnswers.reduce((sum, ans) => sum + (ans.answerDuration || 0), 0) / examResult.studentAnswers.length).toFixed(2)
                      : 0} seconds
                  </p>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Submission Status: {examResult.isSubmitted ? 'Submitted' : 'Not Submitted'}
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-64 h-64">
                  <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                </div>
              </div>
              <div>
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>
          </div>

          {/* Question Breakdown */}
          <div className="bg-white rounded-2xl shadow-xl p-10 bg-gradient-to-br from-green-50 to-white">
            <h2 className="text-3xl font-semibold text-green-700 mb-8">Question Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-green-200">
                    <th className="p-4 cursor-pointer font-semibold text-green-800" onClick={() => handleSort('questionTitle')}>
                      Question {sortConfig.key === 'questionTitle' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="p-4 font-semibold text-green-800">Your Answer</th>
                    <th className="p-4 font-semibold text-green-800">Correct Answer</th>
                    <th className="p-4 cursor-pointer font-semibold text-green-800" onClick={() => handleSort('questionMarks')}>
                      Marks {sortConfig.key === 'questionMarks' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="p-4 font-semibold text-green-800">Status</th>
                    <th className="p-4 cursor-pointer font-semibold text-green-800" onClick={() => handleSort('answerDuration')}>
                      Time Spent {sortConfig.key === 'answerDuration' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="p-4 font-semibold text-green-800">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedQuestions.map((question, index) => {
                    const studentAnswer = examResult.studentAnswers?.find(
                      ans => ans.question.toString() === question._id.toString()
                    );
                    return (
                      <tr
                        key={question._id}
                        className={`${index % 2 === 0 ? 'bg-green-50' : 'bg-white'} hover:bg-green-100 transition-colors`}
                      >
                        <td className="p-4">{question.questionTitle || `Question ${index + 1}`}</td>
                        <td className="p-4">{studentAnswer?.answerText || 'Not Answered'}</td>
                        <td className="p-4">{question.questionAnswer || 'N/A'}</td>
                        <td className="p-4">{studentAnswer?.answerMarks || 0} / {question.questionMarks || 0}</td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              studentAnswer?.isCorrect
                                ? 'bg-green-200 text-green-800'
                                : studentAnswer
                                ? 'bg-red-200 text-red-800'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            {studentAnswer?.isCorrect ? 'Correct' : studentAnswer ? 'Incorrect' : 'Unanswered'}
                          </span>
                        </td>
                        <td className="p-4">{studentAnswer?.answerDuration || 0} sec</td>
                        <td className="p-4">{question.questionType || 'N/A'}</td>
                      </tr>
                    );
                  })}
                  {paginatedQuestions.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-4 text-center text-gray-500">
                        No questions available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-6 py-2 rounded-lg font-medium ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  Previous
                </button>
                <span className="text-gray-700 text-lg">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-6 py-2 rounded-lg font-medium ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentDashboardLayout>
  );
}

export default ExamResult;
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AssignExam from "./AssignExam";
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from './../../services/axiosInstance';
import UniversityDashboardLayout from './../dashboard/UniversityDashboardLayout';

const ViewExamDetail = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        toast.loading('Fetching exam details...');
        const response = await axiosInstance.get(`/university/exam/getExamDashboard/${examId}`);
        if (response.status === 200) {
          setExamData(response.data.data.exam[0]);
          toast.dismiss();
          toast.success('Exam details loaded!');
        }
      } catch (err) {
        setError("Failed to fetch exam details. Please try again.");
        console.error("Error fetching exam details:", err);
        toast.dismiss();
        toast.error('Failed to fetch exam details');
      } finally {
        setLoading(false);
      }
    };
    fetchExamDetails();
  }, [examId]);

  const handleBack = () => {
    navigate('/university/exams');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-green-100 items-center justify-center">
        <Toaster />
        <p className="text-green-700 text-lg font-medium animate-pulse">Loading exam details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-green-100 items-center justify-center">
        <Toaster />
        <p className="text-red-500 text-lg font-medium">{error}</p>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-green-100 items-center justify-center">
        <Toaster />
        <p className="text-green-700 text-lg font-medium">No exam data found.</p>
      </div>
    );
  }

  return (
    <UniversityDashboardLayout sidebarOpen={true} setSidebarOpen={true}>
      <Toaster />
      <div className="min-h-screen bg-gray-50 overflow-y-auto">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-8 space-y-10">
          
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center text-green-700 hover:text-green-900 transition"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Exams
          </button>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-green-700">Exam Details</h1>
            <p className="text-xl mt-2 text-gray-600">{examData.examName}</p>
          </div>

          {/* Exam Overview */}
          <section className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-green-600 to-green-500 text-white">
              <h2 className="text-2xl font-semibold">Exam Overview</h2>
            </div>
            <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField label="Date" value={examData.examDate} />
              <InfoField label="Time" value={examData.examTime} />
              <InfoField label="Qualification" value={examData.examQualification} />
              <InfoField label="Type" value={examData.examType} />
              <InfoField label="Duration" value={`${examData.examDuration} minutes`} />
              <div className="md:col-span-2">
                <InfoField label="Description" value={examData.examDescription} isLarge />
              </div>
            </div>
          </section>

          {/* Questions */}
          {examData.questions?.length > 0 && (
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-semibold text-green-700 mb-4">Questions</h3>
              <div className="space-y-4">
                {examData.questions.map((q, index) => (
                  <div key={q._id} className="border border-green-200 rounded-lg p-4 bg-gray-50 shadow-sm">
                    <p className="text-sm text-green-600">Question {index + 1} ({q.questionLevel})</p>
                    <h4 className="text-lg font-medium mt-1">{q.questionTitle}</h4>
                    <p className="text-gray-700 mt-2">{q.questionDescription}</p>
                    <div className="mt-2">
                      <p className="text-sm text-green-700 font-semibold">Options:</p>
                      <ul className="list-disc list-inside text-gray-800">
                        {q.questionOptions.map((opt, i) => <li key={i}>{opt}</li>)}
                      </ul>
                    </div>
                    <p className="mt-2 text-sm text-green-700"><strong>Answer:</strong> {q.questionAnswer}</p>
                    <p className="text-sm text-green-700"><strong>Marks:</strong> {q.questionMarks}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Students Assigned */}
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-2xl font-semibold text-green-700 mb-4">Assigned Students</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="flex flex-col items-center justify-end h-40">
                <div
                  className="w-16 bg-green-500 rounded-t-lg transition-all"
                  style={{ height: `${Math.min(100, (examData.students?.length || 0) * 2)}%` }}
                ></div>
                <span className="text-sm text-gray-700 mt-2">Students</span>
              </div>

              {/* Metrics */}
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <MetricCard title="Total Assigned" value={examData.students?.length || 0} color="green" />
                <MetricCard title="Available Slots" value={Math.max(0, 50 - (examData.students?.length || 0))} color="yellow" />
              </div>
            </div>
          </section>

          {/* Assign Exam */}
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-2xl font-semibold text-green-700 mb-4">Assign Exam</h3>
            <AssignExam />
          </section>
        </div>
      </div>
    </UniversityDashboardLayout>
  );
};

export default ViewExamDetail;

// ---------------------------
// ✅ Helper Components
// ---------------------------
const InfoField = ({ label, value, isLarge = false }) => (
  <div>
    <p className="text-sm font-medium text-green-700">{label}</p>
    <p className={`mt-1 text-gray-800 ${isLarge ? 'bg-gray-100 p-3 rounded-lg text-base' : 'text-lg'}`}>
      {value}
    </p>
  </div>
);

const MetricCard = ({ title, value, color }) => {
  const colorMap = {
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
  };
  return (
    <div className={`p-4 rounded-lg border ${colorMap[color]} shadow-sm`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

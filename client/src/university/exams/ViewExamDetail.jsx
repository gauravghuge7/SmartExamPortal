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
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <p className="text-green-700 text-lg font-medium animate-pulse">Loading exam details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <Toaster />
        <p className="text-red-500 text-lg font-medium">{error}</p>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <Toaster />
        <p className="text-gray-700 text-lg font-medium">No exam data found.</p>
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
          <section className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-5 bg-green-600 text-white rounded-t-xl">
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

          {/* Assign Exam */}
          <section className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-2xl font-semibold text-green-700 mb-4">Assign Exam</h3>
            <AssignExam />
          </section>

          {/* Students Assigned */}
          <section className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-2xl font-semibold text-green-700 mb-4">Assigned Students</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="flex flex-col items-center justify-end h-40">
                <div
                  className="w-12 bg-green-600 rounded-t transition-all"
                  style={{ height: `${Math.min(100, (examData.students?.length || 0) * 2)}%` }}
                ></div>
                <span className="text-sm text-gray-600 mt-2">Students</span>
              </div>

              {/* Metrics */}
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <MetricCard title="Total Assigned" value={examData.students?.length || 0} />
                <MetricCard title="Available Slots" value={Math.max(0, 50 - (examData.students?.length || 0))} />
              </div>
            </div>
          </section>

          {/* Questions */}
          {examData.questions?.length > 0 && (
            <section className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-2xl font-semibold text-green-700 mb-4">Questions</h3>
              <div className="space-y-4">
                {examData.questions.map((q, index) => (
                  <div key={q._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm">
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
        </div>
      </div>
    </UniversityDashboardLayout>
  );
};

export default ViewExamDetail;



const InfoField = ({ label, value, isLarge = false }) => (
  <div>
    <p className="text-sm font-medium text-gray-600">{label}</p>
    <p className={`mt-1 text-gray-800 ${isLarge ? 'bg-gray-100 p-3 rounded-lg text-base' : 'text-lg'}`}>
      {value}
    </p>
  </div>
);

const MetricCard = ({ title, value }) => (
  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 shadow-sm">
    <p className="text-sm font-medium text-gray-600">{title}</p>
    <p className="text-2xl font-bold text-green-700 mt-1">{value}</p>
  </div>
);

const OverviewRow = ({ label, value, isMultiLine = false }) => (
  <div className="grid grid-cols-12 gap-4">
    <dt className="col-span-3 text-sm font-medium text-gray-600">{label}:</dt>
    <dd className={`col-span-9 text-gray-800 ${isMultiLine ? 'whitespace-pre-line bg-gray-50 p-3 rounded-md' : ''}`}>
      {value}
    </dd>
  </div>
);
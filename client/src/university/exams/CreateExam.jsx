import React, { useState, useEffect } from "react";
import axiosInstance from '../../services/axiosInstance';
import { extractErrorMessage } from "../../components/customError";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import UniversityDashboardLayout from '../dashboard/UniversityDashboardLayout';

const CreateExam = () => {
  const [currentDateTime, setCurrentDateTime] = useState({ date: '', time: '' });
  const [formData, setFormData] = useState({
    examName: "",
    examDate: "",
    examTime: "",
    examQualification: "",
    examType: "MCQ",
    examDuration: "",
    examDescription: "",
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setCurrentDateTime({ date: currentDate, time: currentTime });

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    setFormData(prev => ({
      ...prev,
      examDate: (now.getHours() >= 23 && now.getMinutes() >= 59) ? tomorrowDate : currentDate
    }));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'examDate') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      if (value < today) {
        toast.error("Please select a date from today or later");
        return;
      }
    }

    if (name === 'examTime') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const selectedDate = formData.examDate || today;
      if (selectedDate === currentDateTime.date) {
        const [selectedHours, selectedMinutes] = value.split(':').map(Number);
        const [currentHours, currentMinutes] = currentDateTime.time.split(':').map(Number);
        if (selectedHours < currentHours || (selectedHours === currentHours && selectedMinutes <= currentMinutes)) {
          toast.error("Please select a time in the future");
          return;
        }
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const [currentHours, currentMinutes] = currentDateTime.time.split(':').map(Number);
    if (formData.examDate === today) {
      const [selectedHours, selectedMinutes] = formData.examTime.split(':').map(Number);
      if (selectedHours < currentHours || (selectedHours === currentHours && selectedMinutes <= currentMinutes)) {
        toast.error("Please select a time in the future");
        return;
      }
    }

    setLoading(true);
    toast.loading('Creating exam...');

    try {
      const response = await axiosInstance.post("/university/exam/create", formData);
      if (response.status === 200) {
        toast.dismiss();
        toast.success("Exam created successfully!");
        setFormData({
          examName: "",
          examDate: "",
          examTime: "",
          examQualification: "",
          examType: "MCQ",
          examDuration: "",
          examDescription: "",
        });
        const _id = response.data.data.exam._id;
        setTimeout(() => navigate(`/university/addQuestions/${_id}`), 1000);
      } else {
        toast.dismiss();
        toast.error("Failed to create exam. Please try again.");
      }
    } catch (error) {
      const message = extractErrorMessage(error?.response?.data) || "Failed to create exam. Please try again.";
      toast.dismiss();
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate('/university/exams');

  return (
    <UniversityDashboardLayout sidebarOpen={true} setSidebarOpen={true}>
      <div className="min-h-screen p-6 bg-gray-100">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center text-green-700 hover:text-green-800 mb-6 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Exams
          </button>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-5">
              <h2 className="text-2xl font-bold text-white">Create New Exam</h2>
              <p className="text-yellow-100 mt-1 text-sm">Fill in the details to create a new examination</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-green-700 font-medium mb-2">Exam Name</label>
                <input
                  type="text"
                  name="examName"
                  value={formData.examName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter exam name"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-green-700 font-medium mb-2">Exam Date</label>
                  <input
                    type="date"
                    name="examDate"
                    value={formData.examDate}
                    onChange={handleInputChange}
                    required
                    min={currentDateTime.date}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-green-700 font-medium mb-2">Exam Time</label>
                  <input
                    type="time"
                    name="examTime"
                    value={formData.examTime}
                    onChange={handleInputChange}
                    required
                    min={formData.examDate === currentDateTime.date ? currentDateTime.time : undefined}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-green-700 font-medium mb-2">Required Qualification</label>
                <input
                  type="text"
                  name="examQualification"
                  value={formData.examQualification}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter required qualification"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-green-700 font-medium mb-2">Exam Duration (minutes)</label>
                  <input
                    type="number"
                    name="examDuration"
                    value={formData.examDuration}
                    onChange={handleInputChange}
                    required
                    min="1"
                    placeholder="Enter duration"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-green-700 font-medium mb-2">Exam Type</label>
                  <select
                    name="examType"
                    value={formData.examType}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  >
                    <option value="MCQ">Multiple Choice Questions (MCQ)</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="essay">Essay</option>
                    <option value="OA">Online Assessment (OA)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-green-700 font-medium mb-2">Exam Description</label>
                <textarea
                  name="examDescription"
                  value={formData.examDescription}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Enter a brief description of the exam"
                  className="input-field resize-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-300 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Creating Exam...' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </UniversityDashboardLayout>
  );
};

export default CreateExam;

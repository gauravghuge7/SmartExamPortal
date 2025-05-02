import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from './../../services/axiosInstance';

const AssignExam = () => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { examId } = useParams();

  useEffect(() => {
    fetchAllStudents();
  }, []);

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      toast.loading('Fetching students...');
      const response = await axiosInstance.get('/university/exam/getAllStudents');
      setAllStudents(response.data.data.students);
      toast.dismiss();
      toast.success('Students fetched successfully!');
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.dismiss();
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value.trim()) {
      const filteredSuggestions = allStudents.filter(
        (student) =>
          student.studentEmail.toLowerCase().includes(value.toLowerCase()) ||
          (student.studentPhone && student.studentPhone.includes(value))
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (student) => {
    if (!selectedStudents.some((s) => s._id === student._id)) {
      setSelectedStudents([...selectedStudents, student]);
      toast.success(`${student.studentName} added!`);
    } else {
      toast.error('Student already added!');
    }
    setSearchInput('');
    setSuggestions([]);
  };

  const handleAddStudent = () => {
    if (!searchInput.trim()) {
      toast.error('Please enter a phone or email!');
      return;
    }

    const student = allStudents.find(
      (s) => s.studentPhone === searchInput || s.studentEmail === searchInput
    );

    if (student && !selectedStudents.some((s) => s._id === student._id)) {
      setSelectedStudents([...selectedStudents, student]);
      toast.success(`${student.studentName} added!`);
      setSearchInput('');
      setSuggestions([]);
    } else {
      toast.error('Student not found or already added!');
    }
  };

  const handleRemoveStudent = (studentId) => {
    const student = selectedStudents.find((s) => s._id === studentId);
    setSelectedStudents(selectedStudents.filter((s) => s._id !== studentId));
    toast.success(`${student.studentName} removed!`);
  };

  const handleSendExam = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please add at least one student!');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Assigning exam...');
      const studentIds = selectedStudents.map((s) => s._id);
      await axiosInstance.post(`/university/exam/assignExam/${examId}`, { studentIds });
      toast.dismiss();
      toast.success('Exam assigned successfully!');
      setSelectedStudents([]);
    } catch (error) {
      console.error('Error sending exam:', error);
      toast.dismiss();
      toast.error('Failed to assign exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 font-sans">
      <Toaster position="top-right" />
      <div className="bg-white border border-gray-200 rounded-lg shadow p-6">
        <div className="mb-6 border-b pb-4">
          <h2 className="text-2xl font-serif font-semibold text-gray-800">Assign Exam</h2>
          <p className="text-sm text-gray-500 mt-1">Search and add students to assign the exam</p>
        </div>

        {/* Search Section */}
        <div className="mb-6 relative">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search by phone or email"
              value={searchInput}
              onChange={handleSearch}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-600"
            />
            <button
              onClick={handleAddStudent}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>

          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-md shadow max-h-64 overflow-y-auto">
              {suggestions.map((student) => (
                <li
                  key={student._id}
                  onClick={() => handleSuggestionClick(student)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <p className="text-sm font-medium text-gray-700">{student.studentName}</p>
                  <p className="text-xs text-gray-500">
                    {student.studentEmail} {student.studentPhone && `| ${student.studentPhone}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Selected Students */}
        <div className="space-y-3 max-h-72 overflow-y-auto mb-4">
          {selectedStudents.length ? (
            selectedStudents.map((student) => (
              <div
                key={student._id}
                className="flex justify-between items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-md"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{student.studentName}</p>
                  <p className="text-xs text-gray-500">{student.studentEmail} {student.studentPhone && `| ${student.studentPhone}`}</p>
                </div>
                <button
                  onClick={() => handleRemoveStudent(student._id)}
                  className="text-red-500 hover:text-red-600"
                >
                  &#10005;
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center">No students selected yet.</p>
          )}
        </div>

        {selectedStudents.length > 0 && (
          <p className="text-sm text-gray-600 mb-4">
            <strong>{selectedStudents.length}</strong> student(s) selected
          </p>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSendExam}
            disabled={loading || selectedStudents.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignExam;

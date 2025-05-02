import React, { useState, useEffect } from 'react';
import StudentExamLayout from './StudentExamLayout';
import axiosInstance from './../../services/axiosInstance';
import { useNavigate, useParams } from 'react-router-dom';

const MCQExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [examDetails, setExamDetails] = useState(null);
  const [examMetadata, setExamMetadata] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redirectedid, setRedirectedid] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'all'

  useEffect(() => {
    const fetchExamDetails = async () => {
      if (!id) {
        setError('No exam ID provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get(`/student/exam/getExamDetails/${id}`);
        if (!response?.data?.data?.exam) {
          throw new Error('Invalid exam details response.');
        }

        const exam = response?.data?.data?.exam?.[0];
        if (!exam) {
          throw new Error('Exam not found.');
        }

        if (!exam?.questions || !Array.isArray(exam?.questions)) {
          throw new Error('No questions found in exam details.');
        }

        const mappedQuestions = exam?.questions?.map(question => ({
          ...question,
          questionText: question?.questionTitle ?? 'Question text unavailable.',
          questionDescription: question?.questionDescription ?? 'No description available.',
          options: question?.questionOptions ?? [],
        }));

        const mappedExam = {
          ...exam,
          questions: mappedQuestions,
        };

        setExamDetails(mappedExam);
        setExamMetadata({
          examName: exam?.examName ?? 'Unknown Exam',
          examDescription: exam?.examDescription ?? 'No description available.',
          examDate: exam?.examDate ?? 'N/A',
          examTime: exam?.examTime ?? 'N/A',
          examDuration: exam?.examDuration ?? 'N/A',
        });
        setQuestionStartTime(Date.now());
        setLoading(false);
      } catch (err) {
        console.error('Error fetching exam details:', err);
        const status = err?.response?.status;
        let errorMessage = err?.response?.data?.message ?? 'Failed to load exam details. Please try again.';
        if (status === 401) {
          errorMessage = 'Unauthorized access. Please log in again.';
          navigate('/login', { replace: true });
        } else if (status === 404) {
          errorMessage = 'Exam not found.';
        }
        setError(errorMessage);
        setLoading(false);
      }
    };

    const fetchExams = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/student/exam/getMyExams');
        if (!response?.data?.data?.exams) {
          throw new Error('Invalid exams response.');
        }

        const exams = response?.data?.data?.exams;
        if (exams && Array.isArray(exams) && exams?.length > 0) {
          const firstid = exams?.[0]?._id;
          setRedirectedid(firstid);
        } else {
          setError('No exams available.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching exams:', err);
        const status = err?.response?.status;
        let errorMessage = err?.response?.data?.message ?? 'Failed to load exams. Please try again.';
        if (status === 401) {
          errorMessage = 'Unauthorized access. Please log in again.';
          navigate('/login', { replace: true });
        }
        setError(errorMessage);
        setLoading(false);
      }
    };

    if (id) {
      fetchExamDetails();
    } else {
      fetchExams();
    }
  }, [id, navigate]);

  useEffect(() => {
    if (redirectedid) {
      navigate(`/exam/mcq/${redirectedid}`, { replace: true });
      setRedirectedid(null);
    }
  }, [redirectedid, navigate]);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000); // Hide toast after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleAnswerSelect = async (questionId, option) => {
    if (!questionId || !option) {
      console.error('Invalid questionId or option:', { questionId, option });
      return;
    }

    const previousAnswer = selectedAnswers?.[questionId];
    const newAnswers = { ...selectedAnswers, [questionId]: option };
    setSelectedAnswers(newAnswers);

    const answerDuration = Math.floor((Date.now() - questionStartTime) / 1000);
    const answerTime = new Date().toISOString();

    try {
      const response = await axiosInstance.post(`/student/exam/submitMCQAnswer/${id}`, {
        questionId,
        answerText: option,
        answerDuration,
        answerMarks: 0,
        isAnswered: true,
        answerTime,
      });
      console.log('Answer submitted successfully:', response?.data);
    } catch (err) {
      console.error('Error submitting answer:', err);
      const status = err?.response?.status;
      let errorMessage = err?.response?.data?.message ?? 'Failed to submit answer. Please try again.';
      if (status === 401) {
        errorMessage = 'Unauthorized access. Please log in again.';
        navigate('/login', { replace: true });
      } else if (status === 400) {
        errorMessage = 'Invalid answer submission. Please try again.';
      }
      setSelectedAnswers(previousAnswer ? { ...selectedAnswers, [questionId]: previousAnswer } : { ...selectedAnswers });
      alert(errorMessage);
    }

    setQuestionStartTime(Date.now());
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (examDetails?.questions && currentQuestionIndex < examDetails?.questions?.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleQuestionSelect = (index) => {
    if (index >= 0 && examDetails?.questions && index < examDetails?.questions?.length) {
      setCurrentQuestionIndex(index);
      setViewMode('single');
    }
  };

  const handleSubmitExam = async () => {
    if (!id) {
      alert('No exam ID available to submit.');
      return;
    }

    try {
      const response = await axiosInstance.post(`/student/exam/submitExam/${id}`);
      console.log('Exam submitted successfully:', response?.data);
      setShowToast(true);
      navigate('/exam/result', { replace: true });
    } catch (err) {
      console.error('Error submitting exam:', err);
      const status = err?.response?.status;
      let errorMessage = err?.response?.data?.message ?? 'Failed to submit exam. Please try again.';
      if (status === 401) {
        errorMessage = 'Unauthorized access. Please log in again.';
        navigate('/login', { replace: true });
      }
      alert(errorMessage);
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'single' ? 'all' : 'single');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <svg
          className="animate-spin h-10 w-10 text-emerald-600"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-600 p-4 bg-gray-100">
        <p className="text-lg font-semibold">{error}</p>
        <button
          onClick={() => {
            setError('');
            setLoading(true);
            if (id) {
              setExamDetails(null);
              setCurrentQuestionIndex(0);
              setSelectedAnswers({});
              setQuestionStartTime(null);
              navigate(`/exam/mcq/${id}`, { replace: true });
            } else {
              navigate('/exam/mcq', { replace: true });
            }
          }}
          className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!examDetails?.questions || examDetails?.questions?.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 text-lg bg-gray-100">
        No questions available.
      </div>
    );
  }

  const totalQuestions = examDetails?.questions?.length ?? 0;
  const answeredQuestions = Object.keys(selectedAnswers).length;
  const remainingQuestions = totalQuestions - answeredQuestions;
  const visitedQuestions = answeredQuestions; // Visited = Answered
  const currentQuestion = examDetails?.questions?.[currentQuestionIndex] ?? {};

  return (
    <StudentExamLayout>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl bg-gray-100">
        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-out">
            Exam submitted successfully!
          </div>
        )}


        {/* Toggle View Button */}
        <div className="mb-8 flex justify-end">
          <button
            onClick={toggleViewMode}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors cursor-pointer text-sm shadow-sm"
          >
            {viewMode === 'single' ? 'View All Questions' : 'View Single Question'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Question Area */}
          <div className="flex-1">
            {viewMode === 'single' ? (
              <>
                {/* Question Stats (Left-Aligned) */}
                <div className="mb-6 text-gray-700 text-left bg-white rounded-lg p-4 shadow-sm">
                  <p className="font-semibold text-lg">Answered Questions: <span className="text-emerald-600">{answeredQuestions}</span></p>
                  <p className="font-semibold text-lg">Remaining Questions: <span className="text-emerald-600">{remainingQuestions}</span></p>
                  <p className="font-semibold text-lg">Visited Questions: <span className="text-emerald-600">{visitedQuestions}</span></p>
                </div>

                {/* Separator */}
                <hr className="mb-6 border-gray-300" />

                {/* Current Question (No Card, Background Color) */}
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                    {currentQuestion?.questionText ?? 'Question text unavailable.'}
                  </h2>
                  <div className="max-h-32 overflow-y-auto text-gray-700 mb-6 text-base leading-relaxed pr-4">
                    {currentQuestion?.questionDescription ?? 'No description available.'}
                  </div>
                  <div className="space-y-3">
                    {(currentQuestion?.options ?? []).map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-emerald-50 p-3 rounded-md transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion?._id}`}
                          value={option}
                          checked={selectedAnswers?.[currentQuestion?._id] === option}
                          onChange={() => handleAnswerSelect(currentQuestion?._id, option)}
                          className="w-5 h-5 text-emerald-600 border-gray-300 rounded-full focus:ring-emerald-500"
                          disabled={!currentQuestion?._id || !option}
                        />
                        <span className="text-gray-700 text-base">{option ?? 'Option unavailable'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row justify-between mt-8 gap-4">
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className={`w-full sm:w-auto px-6 py-2 rounded-lg text-white font-medium transition-colors cursor-pointer ${
                      currentQuestionIndex === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentQuestionIndex === (examDetails?.questions?.length ?? 0) - 1}
                    className={`w-full sm:w-auto px-6 py-2 rounded-lg text-white font-medium transition-colors cursor-pointer ${
                      currentQuestionIndex === (examDetails?.questions?.length ?? 0) - 1
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    Next
                  </button>
                </div>

                {/* Submit Exam Button (Only on Last Question, Right-Aligned) */}
                {currentQuestionIndex === (examDetails?.questions?.length ?? 0) - 1 && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleSubmitExam}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors cursor-pointer text-sm shadow-sm"
                    >
                      Submit Exam
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Question Stats (Left-Aligned) */}
                <div className="mb-6 text-gray-700 text-left bg-white rounded-lg p-4 shadow-sm">
                  <p className="font-semibold text-lg">Answered Questions: <span className="text-emerald-600">{answeredQuestions}</span></p>
                  <p className="font-semibold text-lg">Remaining Questions: <span className="text-emerald-600">{remainingQuestions}</span></p>
                  <p className="font-semibold text-lg">Visited Questions: <span className="text-emerald-600">{visitedQuestions}</span></p>
                </div>

                {/* Separator */}
                <hr className="mb-6 border-gray-300" />

                {/* All Questions (Card Form) */}
                {examDetails?.questions?.map((question, index) => (
                  <div
                    key={question._id}
                    className="mb-8 bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                      {question?.questionText ?? 'Question text unavailable.'}
                    </h2>
                    <div className="max-h-32 overflow-y-auto text-gray-700 mb-6 text-base leading-relaxed pr-4">
                      {question?.questionDescription ?? 'No description available.'}
                    </div>
                    <div className="space-y-3">
                      {(question?.options ?? []).map((option, optIndex) => (
                        <label
                          key={optIndex}
                          className="flex items-center space-x-3 cursor-pointer hover:bg-emerald-50 p-3 rounded-md transition-colors"
                        >
                          <input
                            type="radio"
                            name={`question-${question?._id}`}
                            value={option}
                            checked={selectedAnswers?.[question?._id] === option}
                            onChange={() => handleAnswerSelect(question?._id, option)}
                            className="w-5 h-5 text-emerald-600 border-gray-300 rounded-full focus:ring-emerald-500"
                            disabled={!question?._id || !option}
                          />
                          <span className="text-gray-700 text-base">{option ?? 'Option unavailable'}</span>
                        </label>
                      ))}
                    </div>
                    {index < totalQuestions - 1 && <hr className="mt-6 border-gray-300" />}
                  </div>
                ))}
                <button
                      onClick={handleSubmitExam}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors cursor-pointer text-sm shadow-sm"
                    >
                      Submit Exam
                    </button>
              </>
            )}
          </div>

          {/* Question Grid (Sidebar) */}
          <div className="lg:w-80 bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Questions</h3>
            <div className="grid grid-cols-5 gap-2">
              {(examDetails?.questions ?? []).map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionSelect(index)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer ${
                    currentQuestionIndex === index && viewMode === 'single'
                      ? 'bg-emerald-600 text-white'
                      : selectedAnswers?.[examDetails?.questions?.[index]?._id]
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-gray-200 text-gray-700 hover:bg-emerald-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StudentExamLayout>
  );
};

export default MCQExam;
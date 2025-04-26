import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from './../../services/axiosInstance';
import * as faceapi from 'face-api.js';
import RichTextEditor from './RichTextEditor';

const TestView = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [lastWarningTime, setLastWarningTime] = useState(null);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [unsavedAnswers, setUnsavedAnswers] = useState({});
  const [examDetails, setExamDetails] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [answerStartTimes, setAnswerStartTimes] = useState({});
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const examId = useParams().id;
  const navigate = useNavigate();
  const [referencePhotoUrl, setReferencePhotoUrl] = useState('');
  const [activeToastId, setActiveToastId] = useState(null);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsModelLoading(true);
        const modelPath = 'https://justadudewhohacks.github.io/face-api.js/weights/';
        console.log('Loading face-api.js models from:', modelPath);
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
        ]);
        console.log('Face-api.js models loaded successfully');
        setModelsLoaded(true);
        toast.success('Face recognition models loaded.', { autoClose: 2000 });
      } catch (error) {
        console.error('Error loading face-api.js models:', error);
        toast.error('Failed to load face recognition models. Retrying...', { autoClose: 3000 });
        setTimeout(loadModels, 5000);
      } finally {
        setIsModelLoading(false);
      }
    };
    loadModels();
    fetchStudentProfile();
  }, []);

  // Fetch student profile
  const fetchStudentProfile = async () => {
    try {
      const response = await axiosInstance.get('/student/auth/getProfile');
      const data = response.data;
      if (data.statusCode === 200 && data.data.student.studentPhoto?.secure_url) {
        setReferencePhotoUrl(data.data.student.studentPhoto.secure_url);
        toast.success('Profile picture loaded.', { autoClose: 2000 });
      } else {
        throw new Error('Student photo not found');
      }
    } catch (err) {
      console.error('Error fetching student profile:', err);
      toast.error('Failed to fetch profile picture.', { autoClose: 3000 });
    }
  };

  // Browser event restrictions
  useEffect(() => {
    const disableBrowserEvents = () => {
      const handleBeforeUnload = (e) => {
        if (!testSubmitted) {
          e.preventDefault();
          e.returnValue = 'Leaving will submit your test.';
          handleViolation('Attempted to reload or close');
        }
      };

      const handleVisibilityChange = () => {
        if (document.hidden && !testSubmitted) {
          handleViolation('Navigated away from the screen');
          document.documentElement.requestFullscreen();
        }
      };

      const handleContextMenu = (e) => {
        e.preventDefault();
        handleViolation('Right-click attempted');
      };

      const handleKeyDown = (e) => {
        if (!testSubmitted) {
          const blockedKeys = [
            'Escape', 'F11', 'F5',
            'Ctrl+r', 'Ctrl+R', 'Ctrl+t', 'Ctrl+T',
            'Ctrl+w', 'Ctrl+W', 'Ctrl+n', 'Ctrl+N',
            'Alt+F4', 'Alt+Tab',
          ];
          const keyCombo = `${e.ctrlKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${e.key}`;
          if (blockedKeys.includes(keyCombo) || blockedKeys.includes(e.key)) {
            e.preventDefault();
            handleViolation(`Used keyboard shortcut (${keyCombo || e.key})`);
          }
        }
      };

      const handleFullScreenChange = () => {
        if (!document.fullscreenElement && isFullScreen && !testSubmitted) {
          handleViolation('Exited fullscreen');
          document.documentElement.requestFullscreen();
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('fullscreenchange', handleFullScreenChange);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('fullscreenchange', handleFullScreenChange);
      };
    };

    const cleanup = disableBrowserEvents();
    return () => cleanup && cleanup();
  }, [isFullScreen, warningCount, testSubmitted]);

  // Handle proctoring violations
  const handleViolation = (message) => {
    const now = Date.now();
    if (lastWarningTime && now - lastWarningTime < 30000) {
      console.log('Violation skipped: Within 30-second window');
      return;
    }

    if (warningCount >= 3) {
      setTestSubmitted(true);
      if (activeToastId) toast.dismiss(activeToastId);
      const toastId = toast.error(`Test submitted: Too many violations (${message})`, {
        autoClose: 5000,
      });
      setActiveToastId(toastId);
      stopVideo();
      submitAndRedirect();
      return;
    }

    setWarningCount(prev => prev + 1);
    setLastWarningTime(now);
    if (activeToastId) toast.dismiss(activeToastId);
    const toastId = toast.warn(`Warning ${warningCount + 1}/3: ${message}`, {
      autoClose: 3000,
      className: 'bg-yellow-500 text-white font-semibold',
    });
    setActiveToastId(toastId);
  };

  // Fetch exam details
  const fetchQuestions = async () => {
    try {
      const response = await axiosInstance.get(`/student/exam/getExamDetails/${examId}`);
      if (response.data.statusCode === 200) {
        let exam = response.data.data.exam[0];
        exam.questions = [...exam.questions];
        setExamDetails(exam);
        setTimeLeft(exam.examDuration * 60);
      } else {
        throw new Error('Invalid exam data');
      }
    } catch (error) {
      console.error('Error fetching exam details:', error);
      toast.error('Failed to load exam details. Retrying...', { autoClose: 3000 });
      setTimeout(fetchQuestions, 5000);
    }
  };

  useEffect(() => {
    fetchQuestions();
    if (!isModelLoading && modelsLoaded) {
      startVideo();
    }
  }, [isModelLoading, modelsLoaded]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || testSubmitted) return;

    if (timeLeft <= 0) {
      setTestSubmitted(true);
      if (activeToastId) toast.dismiss(activeToastId);
      const toastId = toast.error("Time's up! Test submitted.", { autoClose: 5000 });
      setActiveToastId(toastId);
      stopVideo();
      submitAndRedirect();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, testSubmitted]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Video and face detection
  const startVideo = async () => {
    if (isModelLoading || !modelsLoaded) {
      console.log('Cannot start video: Models not loaded or loading');
      toast.error('Face recognition models not ready.', { autoClose: 3000 });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Video stream assigned to videoRef');
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, starting face detection');
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
            setCameraError(true);
            toast.error('Failed to play video feed. Please enable camera.', { autoClose: 3000 });
          });
          detectFace();
          startPeriodicPhotoCheck();
        };
      } else {
        console.error('videoRef.current is null');
        setCameraError(true);
        toast.error('Video element not found.', { autoClose: 3000 });
      }
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(err => {
          console.error('Fullscreen error:', err);
          toast.warn('Please enable fullscreen for proctoring.', { autoClose: 3000 });
        });
        setIsFullScreen(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError(true);
      toast.error('Camera access denied. Please enable camera and retry.', { autoClose: 5000 });
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      console.log('Video stream stopped');
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const retryCamera = () => {
    setCameraError(false);
    startVideo();
  };

  useEffect(() => {
    return () => stopVideo();
  }, []);

  const submitAndRedirect = async () => {
    try {
      const response = await axiosInstance.post(`/student/exam/submitExam/${examId}`, {
        examId,
        answers,
        submittedAt: new Date().toISOString(),
      });
      if (response.data.statusCode === 200 || response.data.success) {
        if (activeToastId) toast.dismiss(activeToastId);
        const toastId = toast.success('Exam submitted successfully! Redirecting...', {
          autoClose: 3000,
        });
        setActiveToastId(toastId);
        setTimeout(() => navigate('/student/myExams'), 3000);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      if (activeToastId) toast.dismiss(activeToastId);
      const toastId = toast.error('Failed to submit exam. Retrying...', { autoClose: 3000 });
      setActiveToastId(toastId);
      setTimeout(submitAndRedirect, 5000);
    }
  };

  const detectFace = async () => {
    if (!videoRef.current || testSubmitted || !modelsLoaded || cameraError) {
      console.log('detectFace skipped:', {
        videoRef: !!videoRef.current,
        testSubmitted,
        modelsLoaded,
        cameraError,
      });
      return;
    }

    try {
      const video = videoRef.current;
      await new Promise(resolve => {
        if (video.readyState >= 2) resolve();
        else video.onloadeddata = resolve;
      });

      const detections = await faceapi
        .detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceDescriptors();

      console.log('Face detections:', detections.length);

      if (detections.length === 0) {
        setFaceDetected(false);
        handleViolation('No face detected');
      } else if (detections.length > 1) {
        setFaceDetected(false);
        handleViolation(`Multiple faces detected (${detections.length})`);
      } else {
        setFaceDetected(true);
      }

      if (!testSubmitted) {
        requestAnimationFrame(detectFace);
      }
    } catch (error) {
      console.error('Face detection error:', error);
      if (activeToastId) toast.dismiss(activeToastId);
      const toastId = toast.error('Failed to detect faces. Retrying...', { autoClose: 3000 });
      setActiveToastId(toastId);
    }
  };

  const startPeriodicPhotoCheck = () => {
    if (testSubmitted || !modelsLoaded || cameraError) {
      console.log('Periodic photo check skipped: Test submitted, models not loaded, or camera error');
      return;
    }

    const checkPhoto = async () => {
      try {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          console.log('Video not ready for photo check');
          return;
        }

        if (!referencePhotoUrl) {
          console.warn('No reference photo available');
          return;
        }

        let matchFound = false;
        for (let i = 0; i < 10; i++) {
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const videoDataUrl = canvas.toDataURL('image/jpeg', 0.9);

          const videoImg = new Image();
          videoImg.src = videoDataUrl;
          await new Promise(resolve => {
            videoImg.onload = () => resolve();
            videoImg.onerror = () => {
              console.error('Failed to load video frame');
              resolve();
            };
          });

          if (!videoImg.complete || videoImg.naturalWidth === 0) {
            console.error('Invalid video frame');
            continue;
          }

          const videoDetection = await faceapi
            .detectSingleFace(videoImg)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!videoDetection) {
            console.log('No face detected in video frame');
            continue;
          }

          const photoImg = new Image();
          photoImg.crossOrigin = 'anonymous';
          photoImg.src = referencePhotoUrl + '?_=' + Date.now();
          await new Promise(resolve => {
            photoImg.onload = () => {
              console.log('Reference photo loaded successfully');
              resolve();
            };
            photoImg.onerror = () => {
              console.error('Failed to load reference photo:', referencePhotoUrl);
              resolve();
            };
          });

          if (!photoImg.complete || photoImg.naturalWidth === 0) {
            console.error('Invalid reference photo');
            continue;
          }

          const photoDetection = await faceapi
            .detectSingleFace(photoImg)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!photoDetection) {
            console.error('No face detected in reference photo');
            continue;
          }

          const distance = faceapi.euclideanDistance(
            videoDetection.descriptor,
            photoDetection.descriptor
          );
          console.log(`Face match attempt ${i + 1}/10: Distance = ${distance}`);
          if (distance < 0.45) {
            matchFound = true;
            break;
          }
        }

        if (!matchFound) {
          handleViolation('Face does not match reference photo');
        }
      } catch (error) {
        console.error('Periodic photo check error:', error);
      }
    };

    const intervalId = setInterval(checkPhoto, 10000);
    return () => clearInterval(intervalId);
  };

  const handleAnswerChange = (questionIndex, value) => {
    setUnsavedAnswers(prev => ({
      ...prev,
      [questionIndex]: value,
    }));
  };

  const submitQuestionAnswer = async (questionIndex) => {
    const question = examDetails.questions[questionIndex];
    const value = unsavedAnswers[questionIndex] || '';
    const startTime = answerStartTimes[questionIndex] || Date.now();
    const answerDuration = Math.floor((Date.now() - startTime) / 1000);

    const answerObj = {
      examId: examDetails._id,
      questionId: question._id,
      answerText: value,
      answerDuration,
      answerMarks: question.questionMarks,
      isAnswered: true,
      answerTime: new Date().toISOString(),
    };

    setAnswers(prev => {
      const existingIndex = prev.findIndex(a => a.questionId === question._id);
      if (existingIndex >= 0) {
        const newAnswers = [...prev];
        newAnswers[existingIndex] = answerObj;
        return newAnswers;
      }
      return [...prev, answerObj];
    });

    try {
      if (question.questionType.toLowerCase() === 'essay') {
        await axiosInstance.post('/student/exam/submitAnswer', answerObj);
      } else if (question.questionType.toLowerCase() === 'coding' || question.questionType.toLowerCase() === 'oa') {
        await axiosInstance.post('/student/exam/submitAnswer', answerObj);
      }
      setUnsavedAnswers(prev => {
        const newUnsaved = { ...prev };
        delete newUnsaved[questionIndex];
        return newUnsaved;
      });
      toast.success('Answer submitted.', { autoClose: 2000 });
    } catch (error) {
      console.error(`Error submitting ${question.questionType} answer:`, error);
      if (activeToastId) toast.dismiss(activeToastId);
      const toastId = toast.error(`Failed to submit answer. Please try again.`, { autoClose: 3000 });
      setActiveToastId(toastId);
    }
  };

  const handleImmediateAnswerChange = async (questionIndex, value) => {
    const question = examDetails.questions[questionIndex];
    const startTime = answerStartTimes[questionIndex] || Date.now();
    const answerDuration = Math.floor((Date.now() - startTime) / 1000);

    const answerObj = {
      examId: examDetails._id,
      questionId: question._id,
      answerText: value instanceof File ? value.name : value,
      answerDuration,
      answerMarks: question.questionMarks,
      isAnswered: true,
      answerTime: new Date().toISOString(),
    };

    setAnswers(prev => {
      const existingIndex = prev.findIndex(a => a.questionId === question._id);
      if (existingIndex >= 0) {
        const newAnswers = [...prev];
        newAnswers[existingIndex] = answerObj;
        return newAnswers;
      }
      return [...prev, answerObj];
    });

    try {
      if (question.questionType.toLowerCase() === 'mcq') {
        await axiosInstance.post(`/student/exam/submitMCQAnswer/${examId}`, answerObj);
      } else if (question.questionType.toLowerCase() === 'assignment' || question.questionType.toLowerCase() === 'assignment_oa') {
        const formData = new FormData();
        for (const [key, val] of Object.entries(answerObj)) {
          formData.append(key, val);
        }
        if (value instanceof File) {
          formData.append('file', value);
        }
        await axiosInstance.post('/student/exam/submitAnswer', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else if (question.questionType.toLowerCase() === 'short_answer') {
        await axiosInstance.post('/student/exam/submitAnswer', answerObj);
      }
      toast.success('Answer submitted.', { autoClose: 2000 });
    } catch (error) {
      console.error(`Error submitting ${question.questionType} answer:`, error);
      if (activeToastId) toast.dismiss(activeToastId);
      const toastId = toast.error(`Failed to submit answer. Please try again.`, { autoClose: 3000 });
      setActiveToastId(toastId);
    }
  };

  const handleQuestionSelect = (index) => {
    setCurrentQuestion(index);
    setVisitedQuestions(prev => new Set(prev).add(index));
    setAnswerStartTimes(prev => ({ ...prev, [index]: Date.now() }));
    setIsSidebarOpen(false);
  };

  const handleNext = () => {
    if (examDetails && currentQuestion < examDetails.questions.length - 1) {
      const nextIndex = currentQuestion + 1;
      setCurrentQuestion(nextIndex);
      setVisitedQuestions(prev => new Set(prev).add(nextIndex));
      setAnswerStartTimes(prev => ({ ...prev, [nextIndex]: Date.now() }));
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const prevIndex = currentQuestion - 1;
      setCurrentQuestion(prevIndex);
      setVisitedQuestions(prev => new Set(prev).add(prevIndex));
      setAnswerStartTimes(prev => ({ ...prev, [prevIndex]: Date.now() }));
    }
  };

  const getAnswerForQuestion = (questionId) => {
    return answers.find(a => a.questionId === questionId);
  };

  const isQuestionAnswered = (questionId) => {
    const answer = getAnswerForQuestion(questionId);
    return answer && answer.isAnswered && answer.answerText !== '';
  };

  const getQuestionStatus = (index, questionId) => {
    if (isQuestionAnswered(questionId)) return 'Submitted';
    if (visitedQuestions.has(index)) return 'Visited';
    return 'Not Visited';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted': return 'bg-emerald-800 text-white';
      case 'Visited': return 'bg-yellow-500 text-white';
      case 'Not Visited': return 'bg-emerald-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const renderQuestion = (question, index) => {
    const answer = getAnswerForQuestion(question._id);
    const unsavedAnswer = unsavedAnswers[index] || '';
    const answered = isQuestionAnswered(question._id);

    switch (question.questionType.toLowerCase()) {
      case 'mcq':
        return (
          <div className={`p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white ${answered ? 'border-l-4 border-emerald-600' : ''}`}>
            <p className="text-gray-800 text-lg font-semibold mb-2">{question.questionTitle}</p>
            <p className="text-gray-600 mb-4">{question.questionDescription}</p>
            {question.questionOptions.map((option, optIndex) => (
              <label key={optIndex} className="block mb-2">
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={option}
                  checked={answer?.answerText === option}
                  onChange={() => handleImmediateAnswerChange(index, option)}
                  className="mr-2 accent-emerald-600 h-4 w-4"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      case 'essay':
        return (
          <div className={`p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white ${answered ? 'border-l-4 border-emerald-600' : ''}`}>
            <p className="text-gray-800 text-lg font-semibold mb-2">{question.questionTitle}</p>
            <p className="text-gray-600 mb-4">{question.questionDescription}</p>
            <RichTextEditor
              content={answered ? answer?.answerText : unsavedAnswer}
              onChange={(value) => handleAnswerChange(index, value)}
              placeholder="Write your essay here..."
            />
            <button
              onClick={() => submitQuestionAnswer(index)}
              className="mt-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-lg hover:scale-105 transition-transform disabled:bg-gray-400"
              disabled={!unsavedAnswer && !answered}
            >
              Submit Question
            </button>
          </div>
        );
      case 'coding':
      case 'oa':
        return (
          <div className={`p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white ${answered ? 'border-l-4 border-emerald-600' : ''}`}>
            <p className="text-gray-800 text-lg font-semibold mb-2">{question.questionTitle}</p>
            <p className="text-gray-600 mb-4">{question.questionDescription}</p>
            <textarea
              value={answered ? answer?.answerText : unsavedAnswer}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              className="w-full h-40 p-2 border rounded-lg bg-gray-50 text-gray-800 focus:ring-2 focus:ring-emerald-500"
              placeholder="Write your code here..."
            />
            <button
              onClick={() => submitQuestionAnswer(index)}
              className="mt-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-lg hover:scale-105 transition-transform disabled:bg-gray-400"
              disabled={!unsavedAnswer && !answered}
            >
              Submit Question
            </button>
          </div>
        );
      case 'assignment':
      case 'assignment_oa':
        return (
          <div className={`p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white ${answered ? 'border-l-4 border-emerald-600' : ''}`}>
            <p className="text-gray-800 text-lg font-semibold mb-2">{question.questionTitle}</p>
            <p className="text-gray-600 mb-4">{question.questionDescription}</p>
            <input
              type="file"
              onChange={(e) => handleImmediateAnswerChange(index, e.target.files[0])}
              className="mb-2 text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
            />
            {answer?.answerText && (
              <p className="text-emerald-600 text-sm">Uploaded: {answer.answerText}</p>
            )}
          </div>
        );
      case 'short_answer':
        return (
          <div className={`p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white ${answered ? 'border-l-4 border-emerald-600' : ''}`}>
            <p className="text-gray-800 text-lg font-semibold mb-2">{question.questionTitle}</p>
            <p className="text-gray-600 mb-4">{question.questionDescription}</p>
            <RichTextEditor
              content={answer?.answerText || ''}
              onChange={(value) => handleImmediateAnswerChange(index, value)}
              placeholder="Type your short answer here..."
              limited={true}
            />
          </div>
        );
      default:
        return (
          <div className={`p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white ${answered ? 'border-l-4 border-emerald-600' : ''}`}>
            <p className="text-gray-800 text-lg font-semibold mb-2">{question.questionTitle}</p>
            <p className="text-gray-600 mb-4">{question.questionDescription}</p>
            <p className="text-red-700">Question type {question.questionType} not implemented yet</p>
          </div>
        );
    }
  };

  const groupQuestionsByType = () => {
    const groups = { mcq: [], essay: [], coding: [], oa: [], assignment: [], assignment_oa: [], short_answer: [] };
    examDetails?.questions.forEach((q, index) => {
      const type = q.questionType.toLowerCase();
      if (type === 'mcq') groups.mcq.push({ ...q, index });
      else if (type === 'essay') groups.essay.push({ ...q, index });
      else if (type === 'coding') groups.coding.push({ ...q, index });
      else if (type === 'oa') groups.oa.push({ ...q, index });
      else if (type === 'assignment') groups.assignment.push({ ...q, index });
      else if (type === 'assignment_oa') groups.assignment_oa.push({ ...q, index });
      else if (type === 'short_answer') groups.short_answer.push({ ...q, index });
    });
    return groups;
  };

  const handleSubmitExam = async () => {
    setTestSubmitted(true);
    await submitAndRedirect();
  };

  if (testSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-800 mb-4">Test Submitted</h2>
          <p className="text-gray-600">Your test has been submitted. Redirecting to My Exams...</p>
        </div>
      </div>
    );
  }

  if (!examDetails || isModelLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">
            {isModelLoading ? 'Loading face recognition models...' : 'Loading exam...'}
          </h2>
        </div>
      </div>
    );
  }

  const questionGroups = groupQuestionsByType();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-emerald-800 text-white p-4 shadow-lg fixed top-0 left-0 right-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <h1 className="text-xl md:text-2xl font-bold">{examDetails.examName}</h1>
            <button
              className="md:hidden text-white focus:outline-none"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative">
              {cameraError ? (
                <div className="w-full max-w-48 md:max-w-64 h-32 md:h-40 bg-gray-200 rounded-lg flex flex-col items-center justify-center">
                  <p className="text-red-600 text-sm font-medium">Camera Unavailable</p>
                  <button
                    onClick={retryCamera}
                    className="mt-2 bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 text-sm"
                  >
                    Retry Camera
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-48 md:max-w-64 h-32 md:h-40 rounded-lg shadow-md object-cover"
                />
              )}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 opacity-50 animate-scan-strip"></div>
                <div className="absolute bottom-0 left-0 w-full h-2 bg-emerald-500 opacity-50 animate-scan-strip-reverse"></div>
              </div>
              <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-md text-xs text-white font-medium ${faceDetected ? 'bg-emerald-600' : 'bg-red-600'}`}>
                Face: {faceDetected ? '✓' : '✗'}
              </div>
            </div>
            <div className="text-sm md:text-base font-semibold">
              Time Left: <span className={timeLeft <= 300 ? 'text-red-400' : 'text-emerald-400'}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="bg-emerald-600 text-white px-2 py-1 rounded-md text-xs font-medium animate-pulse">
              Proctored
            </div>
            <div className="text-sm text-yellow-400 font-medium">
              Warnings: {warningCount}/3
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 pt-28 md:pt-20 max-w-7xl mx-auto">
        {/* Left Sidebar (Collapsible on mobile) */}
        <aside className={`w-full md:w-72 bg-white text-emerald-800 flex flex-col py-4 md:sticky md:top-20 md:h-[calc(100vh-5rem)] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed z-20 md:overflow-y-auto`}>
          <div className="px-4 mb-4">
            <h2 className="text-lg font-bold">Questions</h2>
          </div>
          <div className="px-4">
            <h3 className="text-sm font-semibold text-emerald-600 mb-2">All Questions</h3>
            <div className="grid grid-cols-4 gap-2">
              {examDetails.questions.map((q, index) => {
                const status = getQuestionStatus(index, q._id);
                return (
                  <div
                    key={index}
                    className={`w-12 h-12 flex items-center justify-center cursor-pointer rounded-lg shadow-sm ${getStatusColor(status)} hover:scale-110 transition-transform ${
                      currentQuestion === index ? 'ring-2 ring-emerald-400' : ''
                    }`}
                    onClick={() => handleQuestionSelect(index)}
                    title={`Q${index + 1}: ${status}`}
                  >
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Question Area */}
        <main className="flex-1 p-4 md:p-6 mt-20 md:mt-0 md:ml-72 md:mr-72 relative pb-28 bg-white">
          <div className="transition-all duration-300">
            {renderQuestion(examDetails.questions[currentQuestion], currentQuestion)}
          </div>
          <div className="fixed bottom-0 left-0 md:left-72 right-0 md:right-72 bg-white p-4 shadow-lg flex flex-col md:flex-row justify-between gap-2 z-20">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-3 rounded-lg hover:scale-105 transition-transform disabled:bg-gray-400"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentQuestion === examDetails.questions.length - 1}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-3 rounded-lg hover:scale-105 transition-transform disabled:bg-gray-400"
            >
              Next
            </button>
            <button
              onClick={handleSubmitExam}
              className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white px-4 py-3 rounded-lg hover:scale-105 transition-transform"
            >
              Submit Exam
            </button>
          </div>
        </main>

        {/* Right Sidebar (Collapsible on mobile) */}
        <aside className={`w-full md:w-72 bg-white text-emerald-800 flex flex-col py-4 md:sticky md:top-20 md:h-[calc(100vh-5rem)] transition-transform duration-300 ${isSidebarOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'} fixed bottom-0 md:right-0 z-20 md:overflow-y-auto`}>
          <div className="px-4 mb-4">
            <h2 className="text-lg font-bold">Question Types</h2>
          </div>
          <div className="px-4 space-y-4 flex flex-wrap md:flex-col">
            {questionGroups.mcq.length > 0 && (
              <div className="mr-4 md:mr-0">
                <h3 className="text-sm font-semibold text-emerald-600">MCQs ({questionGroups.mcq.length})</h3>
                <p className="text-sm text-gray-600">Multiple Choice Questions</p>
              </div>
            )}
            {questionGroups.essay.length > 0 && (
              <div className="mr-4 md:mr-0">
                <h3 className="text-sm font-semibold text-yellow-600">Essays ({questionGroups.essay.length})</h3>
                <p className="text-sm text-gray-600">Long-form written answers</p>
              </div>
            )}
            {questionGroups.coding.length > 0 && (
              <div className="mr-4 md:mr-0">
                <h3 className="text-sm font-semibold text-emerald-600">Coding ({questionGroups.coding.length})</h3>
                <p className="text-sm text-gray-600">Programming challenges</p>
              </div>
            )}
            {questionGroups.oa.length > 0 && (
              <div className="mr-4 md:mr-0">
                <h3 className="text-sm font-semibold text-emerald-500">Coding OA ({questionGroups.oa.length})</h3>
                <p className="text-sm text-gray-600">Online assessments</p>
              </div>
            )}
            {questionGroups.assignment.length > 0 && (
              <div className="mr-4 md:mr-0">
                <h3 className="text-sm font-semibold text-orange-600">Assignments ({questionGroups.assignment.length})</h3>
                <p className="text-sm text-gray-600">File uploads</p>
              </div>
            )}
            {questionGroups.assignment_oa.length > 0 && (
              <div className="mr-4 md:mr-0">
                <h3 className="text-sm font-semibold text-orange-500">Assignment OA ({questionGroups.assignment_oa.length})</h3>
                <p className="text-sm text-gray-600">Online assignment uploads</p>
              </div>
            )}
            {questionGroups.short_answer.length > 0 && (
              <div className="mr-4 md:mr-0">
                <h3 className="text-sm font-semibold text-emerald-600">Short Answers ({questionGroups.short_answer.length})</h3>
                <p className="text-sm text-gray-600">Brief written responses</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="bg-emerald-800 text-white p-4 text-center">
        <p className="text-sm">© 2025 Student Exam Portal. All rights reserved.</p>
      </footer>

      <ToastContainer position="top-right" autoClose={3000} limit={1} className="z-40" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default TestView;
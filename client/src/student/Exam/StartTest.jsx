import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from './../../services/axiosInstance';
import { useNavigate, useParams } from 'react-router-dom';
import * as faceapi from 'face-api.js';

const StartTest = ({ onStartTest }) => {
  const [inputValue, setInputValue] = useState('');
  const [cameraStatus, setCameraStatus] = useState('unchecked');
  const [micStatus, setMicStatus] = useState('unchecked');
  const [error, setError] = useState('');
  const [testStarted, setTestStarted] = useState(false);
  const [cameraCount, setCameraCount] = useState(0);
  const [cameraList, setCameraList] = useState([]);
  const [isCompatible, setIsCompatible] = useState(false);
  const [studentPhotoUrl, setStudentPhotoUrl] = useState('');
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState('');
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [toaster, setToaster] = useState({ show: false, message: '', type: 'info' });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();

  // Show toaster with message
  const showToaster = (message, type = 'info') => {
    setToaster({ show: true, message, type });
    setTimeout(() => setToaster({ show: false, message: '', type: 'info' }), 3000);
  };

  // Enter full screen and load models on mount
  useEffect(() => {
    const enterFullScreen = () => {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    };
    enterFullScreen();

    const loadModels = async () => {
      try {
        const modelPath = '/models';
        console.log('Loading face-api.js models from:', modelPath);
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
        ]);
        console.log('Face-api.js models loaded successfully');
        setModelsLoaded(true);
        showToaster('Face recognition models loaded.', 'success');
      } catch (err) {
        console.error('Error loading face-api.js models:', err);
        setError('Failed to load face recognition models. Please refresh and try again.');
        showToaster('Failed to load face recognition models.', 'error');
      }
    };

    loadModels();
    fetchStudentProfile();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle face verification
  useEffect(() => {
    if (isVerifyingFace && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;

      const verifyFace = async () => {
        try {
          const video = videoRef.current;
          if (!video) {
            throw new Error('Video element not available');
          }

          const distances = [];
          for (let i = 0; i < 3; i++) {
            const detections = await faceapi
              .detectAllFaces(video)
              .withFaceLandmarks()
              .withFaceDescriptors();

            if (detections.length === 0) {
              setError('No face detected. Please ensure your face is visible and well-lit.');
              showToaster('No face detected. Ensure your face is visible.', 'error');
              setIsVerifyingFace(false);
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
              }
              return;
            }

            if (detections.length > 1) {
              setError('Multiple faces detected. Only one face is allowed.');
              showToaster('Multiple faces detected. Only one face allowed.', 'error');
              setIsVerifyingFace(false);
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
              }
              return;
            }

            const capturedPhotoUrl = capturePhoto();
            if (!capturedPhotoUrl) {
              setError('Failed to capture photo. Please try again.');
              showToaster('Failed to capture photo.', 'error');
              setIsVerifyingFace(false);
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
              }
              return;
            }

            const capturedImg = new Image();
            capturedImg.src = capturedPhotoUrl;

            await new Promise(resolve => {
              capturedImg.onload = resolve;
              capturedImg.onerror = () => resolve();
            });

            if (!capturedImg.complete || capturedImg.naturalWidth === 0) {
              setError('Failed to load captured photo.');
              showToaster('Failed to load captured photo.', 'error');
              setIsVerifyingFace(false);
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
              }
              return;
            }

            const capturedDetection = await faceapi
              .detectSingleFace(capturedImg)
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (!capturedDetection) {
              setError('Face not detected in captured photo.');
              showToaster('Face not detected in captured photo.', 'error');
              setIsVerifyingFace(false);
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
              }
              return;
            }

            const profileImg = new Image();
            profileImg.crossOrigin = 'anonymous';
            profileImg.src = studentPhotoUrl;

            await new Promise(resolve => {
              profileImg.onload = resolve;
              profileImg.onerror = () => resolve();
            });

            if (!profileImg.complete || profileImg.naturalWidth === 0) {
              setError('Failed to load profile picture.');
              showToaster('Failed to load profile picture.', 'error');
              setIsVerifyingFace(false);
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
              }
              return;
            }

            const profileDetection = await faceapi
              .detectSingleFace(profileImg)
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (!profileDetection) {
              setError('Face not detected in profile picture.');
              showToaster('Face not detected in profile picture.', 'error');
              setIsVerifyingFace(false);
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
              }
              return;
            }

            const distance = faceapi.euclideanDistance(
              profileDetection.descriptor,
              capturedDetection.descriptor
            );
            distances.push(distance);

            await new Promise(resolve => setTimeout(resolve, 500));
          }

          const averageDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
          const matchThreshold = 0.55;
          if (averageDistance < matchThreshold) {
            setIsFaceVerified(true);
            setError('Face verified successfully');
            showToaster('Face verified successfully!', 'success');
          } else {
            setIsFaceVerified(false);
            setError('Face verification failed. Ensure good lighting and face alignment.');
            showToaster('Face verification failed. Check lighting and alignment.', 'error');
          }

          setIsVerifyingFace(false);
          setCapturedPhotoUrl('');
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
        } catch (err) {
          console.error('Face verification error:', err);
          setError('Failed to verify face. Please ensure good lighting and try again.');
          showToaster('Failed to verify face. Try again.', 'error');
          setIsFaceVerified(false);
          setIsVerifyingFace(false);
          setCapturedPhotoUrl('');
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
        }
      };

      videoRef.current.onloadedmetadata = verifyFace;

      return () => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = null;
        }
      };
    }
  }, [isVerifyingFace, studentPhotoUrl]);

  const fetchStudentProfile = async () => {
    try {
      const response = await axiosInstance.get('/student/auth/getProfile');
      const data = response.data;
      if (data.statusCode === 200 && data.data.student.studentPhoto?.secure_url) {
        setStudentPhotoUrl(data.data.student.studentPhoto.secure_url);
        showToaster('Profile picture loaded successfully.', 'success');
      } else {
        throw new Error('Student photo not found');
      }
    } catch (err) {
      console.error('Error fetching student profile:', err);
      setError('Failed to fetch student profile picture');
      showToaster('Failed to fetch profile picture.', 'error');
    }
  };

  const checkMediaDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameraList(videoDevices);
      setCameraCount(videoDevices.length);

      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStatus('working');
      videoStream.getTracks().forEach(track => track.stop());

      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStatus('working');
      audioStream.getTracks().forEach(track => track.stop());

      setIsCompatible(videoDevices.length === 1);
      if (videoDevices.length > 1) {
        setError('Multiple cameras detected. Please use only one camera.');
        showToaster('Multiple cameras detected. Use only one camera.', 'error');
      } else if (videoDevices.length === 0) {
        setError('No camera detected. A camera is required.');
        showToaster('No camera detected. A camera is required.', 'error');
      } else {
        showToaster('System compatibility verified successfully.', 'success');
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Please allow camera and microphone access');
        setCameraStatus('blocked');
        setMicStatus('blocked');
        showToaster('Camera and microphone access denied.', 'error');
      } else {
        setError('Error accessing media devices');
        setCameraStatus('error');
        setMicStatus('error');
        showToaster('Error accessing media devices.', 'error');
      }
      setIsCompatible(false);
    }
  };

  const handleCheckCompatibility = async () => {
    await checkMediaDevices();
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhotoUrl(dataUrl);
      return dataUrl;
    }
    return null;
  };

  const handleVerifyFace = async () => {
    if (!modelsLoaded) {
      setError('Face recognition models are still loading. Please wait.');
      showToaster('Models are still loading. Please wait.', 'error');
      return;
    }

    try {
      if (!studentPhotoUrl) {
        setError('Student profile picture not available');
        showToaster('Profile picture not available.', 'error');
        return;
      }

      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = videoStream;
      setIsVerifyingFace(true);
      showToaster('Starting face verification.', 'info');
    } catch (err) {
      console.error('Face verification error:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      showToaster('Failed to access camera.', 'error');
      setIsVerifyingFace(false);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleStartTest = () => {
    if (inputValue.toLowerCase() !== 'start') {
      setError('Please type "start" in the input field');
      showToaster('Please type "start" to begin.', 'error');
      return;
    }

    if (!document.fullscreenElement) {
      setError('Please ensure the screen is in full screen mode');
      showToaster('Please remain in full screen mode.', 'error');
      return;
    }

    if (cameraStatus === 'working' && micStatus === 'working' && isCompatible && isFaceVerified) {
      setError('');
      showToaster('Starting examination...', 'success');
      navigate(`/exam/view/${id}`);
    } else {
      setError('Please complete camera, microphone, compatibility, and face verification');
      showToaster('Please complete all verifications.', 'error');
    }
  };

  const rulesAndRegulations = [
    'This is a proctored examination requiring camera and microphone access.',
    'Ensure you are in a quiet, well-lit environment with no distractions.',
    'Only one camera should be connected to your system.',
    'Do not navigate away from the test window during the examination.',
    'Use of additional devices or resources is strictly prohibited.',
    'The test must be completed within the allotted time.',
    'Any suspicious behavior will be flagged and may result in disqualification.',
    'Follow all instructions provided during the test carefully.',
    'Face verification is required before starting the test.',
  ];

  if (testStarted) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-emerald-800 text-white p-4 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Examination Portal</h1>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                <span className="w-3 h-3 bg-red-400 rounded-full"></span>
              </div>
              <div className="bg-emerald-600 text-white px-2 py-1 rounded-md text-sm animate-pulse">
                Proctored
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">Test Started</h2>
            <p className="text-lg text-gray-600">Your examination is now in progress. Good luck!</p>
          </div>
        </main>
        <footer className="bg-emerald-800 text-white p-4 text-center">
          <p className="text-sm">© 2025 Student Exam Portal. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Toaster */}
      {toaster.show && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-md text-white ${
            toaster.type === 'success'
              ? 'bg-emerald-600'
              : toaster.type === 'error'
              ? 'bg-red-600'
              : 'bg-blue-600'
          }`}
        >
          {toaster.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-emerald-800 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Examination Setup</h1>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
              <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              <span className="w-3 h-3 bg-red-400 rounded-full"></span>
            </div>
            <div className="bg-emerald-600 text-white px-2 py-1 rounded-md text-sm animate-pulse">
              Proctored
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto p-6 flex flex-col lg:flex-row gap-6">
        {/* Left Panel: System Status and Camera Verification */}
        <div className="lg:w-1/2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">System & Identity Verification</h2>
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
              <span className="text-gray-700 font-medium">Camera</span>
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  cameraStatus === 'working'
                    ? 'bg-emerald-100 text-emerald-800'
                    : cameraStatus === 'blocked'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {cameraStatus === 'working'
                  ? 'Operational'
                  : cameraStatus === 'blocked'
                  ? 'Blocked'
                  : 'Not Checked'}
              </span>
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
              <span className="text-gray-700 font-medium">Microphone</span>
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  micStatus === 'working'
                    ? 'bg-emerald-100 text-emerald-800'
                    : micStatus === 'blocked'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {micStatus === 'working'
                  ? 'Operational'
                  : micStatus === 'blocked'
                  ? 'Blocked'
                  : 'Not Checked'}
              </span>
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
              <span className="text-gray-700 font-medium">Cameras Detected</span>
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  cameraCount === 1
                    ? 'bg-emerald-100 text-emerald-800'
                    : cameraCount > 1
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {cameraCount || 'Not Checked'} {cameraCount === 1 ? 'Camera' : 'Cameras'}
              </span>
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
              <span className="text-gray-700 font-medium">Face Verification</span>
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  isFaceVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {isFaceVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
          </div>

          {/* Camera Verification Section */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Identity Verification</h3>
            {isVerifyingFace ? (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Profile Photo */}
                <div className="w-full lg:w-1/2">
                  <p className="text-gray-700 font-medium mb-2">Profile Photo</p>
                  {studentPhotoUrl ? (
                    <img
                      src={studentPhotoUrl}
                      alt="Stored Student Photo"
                      className="w-full h-48 object-cover rounded-md border border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-md flex items-center justify-center">
                      <p className="text-gray-500">Loading...</p>
                    </div>
                  )}
                </div>
                {/* Live Camera Feed */}
                <div className="w-full lg:w-1/2 relative">
                  <p className="text-gray-700 font-medium mb-2">Live Camera Feed</p>
                  <div className="relative w-full h-48 rounded-md overflow-hidden border border-gray-200">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {/* Scanning Strips */}
                    <div className="absolute inset-0">
                      <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 opacity-50 animate-scan-strip"></div>
                      <div className="absolute bottom-0 left-0 w-full h-2 bg-emerald-500 opacity-50 animate-scan-strip-reverse"></div>
                    </div>
                    {/* AI Scanning Indicator */}
                    <div className="absolute bottom-2 left-2 bg-emerald-600 text-white px-2 py-1 rounded-md text-sm animate-pulse">
                      AI Scanning...
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-md text-center">
                <p className="text-gray-600">
                  Click "Verify Face" to start identity verification.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Rules and Controls */}
        <div className="lg:w-1/2 bg-white rounded-lg shadow-md p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Examination Instructions</h2>
          <div className="bg-gray-50 p-4 rounded-md mb-6 flex-1 overflow-y-auto">
            <ul className="space-y-3 text-gray-700">
              {rulesAndRegulations.map((rule, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-emerald-600 rounded-full mr-2 mt-1.5"></span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCheckCompatibility}
              className="w-full bg-yellow-600 text-white py-2 rounded-md hover:bg-yellow-700 transition-colors duration-200"
            >
              Verify Compatibility
            </button>
            <button
              onClick={handleVerifyFace}
              className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition-colors duration-200 disabled:bg-emerald-300 disabled:cursor-not-allowed"
              disabled={!modelsLoaded || isVerifyingFace}
            >
              {modelsLoaded ? (
                isVerifyingFace ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify Face'
                )
              ) : (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading Models...
                </span>
              )}
            </button>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type 'start' to begin"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700"
              />
              <button
                onClick={handleStartTest}
                className="bg-emerald-800 text-white px-6 py-2 rounded-md hover:bg-emerald-900 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={cameraStatus !== 'working' || micStatus !== 'working' || !isCompatible || !isFaceVerified}
              >
                Start Test
              </button>
            </div>
            {error && (
              <div
                className={`text-sm p-3 rounded-md border ${
                  isFaceVerified
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-red-700 bg-red-50 border-red-200'
                }`}
              >
                {error}
                {!isFaceVerified && (
                  <button
                    onClick={handleVerifyFace}
                    className="ml-2 text-emerald-600 hover:underline"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-emerald-800 text-white p-4 text-center">
        <p className="text-sm">© 2025 Student Exam Portal. All rights reserved.</p>
      </footer>

      {/* Hidden Canvas for Capturing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default StartTest;



import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from './../../services/axiosInstance';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';

const Signup = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    studentPassword: '',
    studentPhone: '',
    photo: null,
  });
  const [errors, setErrors] = useState({});
  const [cameraActive, setCameraActive] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toaster, setToaster] = useState({ show: false, message: '', type: 'info' });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  // Show toaster with message
  const showToaster = (message, type = 'info') => {
    setToaster({ show: true, message, type });
    setTimeout(() => setToaster({ show: false, message: '', type: 'info' }), 3000);
  };

  // Load face-api.js models on mount
  useEffect(() => {
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
        showToaster('Face detection models loaded.', 'success');
      } catch (err) {
        console.error('Error loading face-api.js models:', err);
        setErrors({ model: 'Failed to load face detection models.' });
        showToaster('Failed to load face detection models.', 'error');
      }
    };
    loadModels();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const startCamera = async () => {
    if (!modelsLoaded) {
      showToaster('Please wait, models are loading...', 'error');
      return;
    }
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('Camera stream loaded:', videoRef.current.videoWidth, videoRef.current.videoHeight);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      showToaster('Failed to access camera.', 'error');
      setCameraActive(false);
    }
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
      return dataUrl;
    }
    return null;
  };

  const base64ToFile = (base64String, fileName) => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  };

  const detectFace = async () => {
    if (!modelsLoaded) {
      showToaster('Face detection models not loaded.', 'error');
      setIsVerifyingFace(false);
      return;
    }

    const capturedPhotoUrl = capturePhoto();
    if (!capturedPhotoUrl) {
      showToaster('Failed to capture photo.', 'error');
      setIsVerifyingFace(false);
      stopCamera();
      return;
    }

    setIsVerifyingFace(true);
    try {
      const img = new Image();
      img.src = capturedPhotoUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = () => resolve();
      });

      if (!img.complete || img.naturalWidth === 0) {
        showToaster('Failed to load captured photo.', 'error');
        setIsVerifyingFace(false);
        stopCamera();
        return;
      }

      const detections = await faceapi
        .detectAllFaces(img)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        showToaster('No faces detected. Please retake the picture.', 'error');
        setImagePreview('');
        setFormData({ ...formData, photo: null });
        setIsVerifyingFace(false);
        stopCamera();
        return;
      }

      if (detections.length > 1) {
        showToaster(`Multiple faces detected (${detections.length}). Please capture only one face.`, 'error');
        setImagePreview('');
        setFormData({ ...formData, photo: null });
        setIsVerifyingFace(false);
        stopCamera();
        return;
      }

      showToaster('Single face detected successfully!', 'success');
      setImagePreview(capturedPhotoUrl);
      const file = base64ToFile(capturedPhotoUrl, 'captured_image.jpg');
      setFormData({ ...formData, photo: file });
    } catch (error) {
      console.error('Face detection error:', error);
      showToaster('Failed to detect faces.', 'error');
      setImagePreview('');
      setFormData({ ...formData, photo: null });
    } finally {
      setIsVerifyingFace(false);
      stopCamera();
    }
  };

  const stopCamera = () => {
    setCameraActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.studentName) newErrors.studentName = 'Full Name is required';
    if (!formData.studentEmail) newErrors.studentEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.studentEmail)) newErrors.studentEmail = 'Email is invalid';
    if (!formData.studentPassword) newErrors.studentPassword = 'Password is required';
    else if (formData.studentPassword.length < 6) newErrors.studentPassword = 'Password must be at least 6 characters';
    if (!formData.studentPhone) newErrors.studentPhone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.studentPhone)) newErrors.studentPhone = 'Invalid phone number (10 digits)';
    if (!formData.photo) newErrors.photo = 'A photo with a single face is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToaster('Please fix the errors in the form.', 'error');
      return;
    }

    setIsSubmitting(true);
    const formDataToSend = new FormData();
    formDataToSend.append('studentName', formData.studentName);
    formDataToSend.append('studentEmail', formData.studentEmail);
    formDataToSend.append('studentPassword', formData.studentPassword);
    formDataToSend.append('studentPhone', formData.studentPhone);
    formDataToSend.append('photo', formData.photo);

    try {
      const response = await axiosInstance.post('/student/auth/register', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 201) {
        showToaster('Signup successful!', 'success');
        setTimeout(() => navigate('/student/login'), 1000);
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Something went wrong!';
      showToaster(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      {/* Toaster */}
      {toaster.show && (
        <div
          className={`fixed top-16 right-4 max-w-sm px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
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

      {/* Main Content */}
      <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-6">
        {/* Left Panel: Signup Form */}
        <div className="lg:w-1/2 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Create Your Account</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="studentName"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                  errors.studentName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="John Doe"
              />
              {errors.studentName && (
                <p className="text-red-500 text-xs mt-1">{errors.studentName}</p>
              )}
            </div>
            <div>
              <label htmlFor="studentEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="studentEmail"
                name="studentEmail"
                value={formData.studentEmail}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                  errors.studentEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="student@example.com"
              />
              {errors.studentEmail && (
                <p className="text-red-500 text-xs mt-1">{errors.studentEmail}</p>
              )}
            </div>
            <div>
              <label htmlFor="studentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="studentPassword"
                name="studentPassword"
                value={formData.studentPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                  errors.studentPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              {errors.studentPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.studentPassword}</p>
              )}
            </div>
            <div>
              <label htmlFor="studentPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                id="studentPhone"
                name="studentPhone"
                value={formData.studentPhone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                  errors.studentPhone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1234567890"
              />
              {errors.studentPhone && (
                <p className="text-red-500 text-xs mt-1">{errors.studentPhone}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !modelsLoaded || isVerifyingFace}
              className={`w-full py-2.5 text-white font-medium rounded-md transition-colors duration-200 ${
                isSubmitting || !modelsLoaded || isVerifyingFace
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
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
                  Signing Up...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
        </div>

        {/* Right Panel: Camera and Photo Capture */}
        <div className="lg:w-1/2 bg-white rounded-lg shadow-md p-8 flex flex-col">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Photo Verification</h2>
          <div className="flex-1 flex items-center justify-center">
            {modelsLoaded ? (
              <div className="w-full">
                {cameraActive || isVerifyingFace ? (
                  <div className="relative w-full h-64 rounded-md overflow-hidden border border-gray-200">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0">
                      <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 opacity-50 animate-scan-strip"></div>
                      <div className="absolute bottom-0 left-0 w-full h-2 bg-emerald-500 opacity-50 animate-scan-strip-reverse"></div>
                    </div>
                    {isVerifyingFace && (
                      <div className="absolute bottom-2 left-2 bg-emerald-600 text-white px-2 py-1 rounded-md text-sm animate-pulse">
                        AI Scanning...
                      </div>
                    )}
                  </div>
                ) : imagePreview ? (
                  <div className="flex justify-center">
                    <img
                      src={imagePreview}
                      alt="Captured Photo"
                      className="w-40 h-40 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                    />
                  </div>
                ) : (
                  <p className="text-gray-600 text-center text-sm">
                    Click "Take Picture" to capture your photo.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg
                  className="animate-spin h-12 w-12 text-emerald-500"
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
                <p className="text-gray-600 mt-4 text-sm">Loading face detection models...</p>
              </div>
            )}
          </div>
          <div className="mt-6 space-y-4">
            <button
              onClick={cameraActive ? detectFace : startCamera}
              disabled={!modelsLoaded || isVerifyingFace}
              className={`w-full py-2.5 text-white font-medium rounded-md transition-colors duration-200 ${
                !modelsLoaded || isVerifyingFace
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {cameraActive ? 'Capture' : 'Take Picture'}
            </button>
            {errors.photo && (
              <p className="text-red-500 text-xs text-center">{errors.photo}</p>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Signup;
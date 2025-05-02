import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';

const StudentExamLayout = ({ children }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState('');
  const userId = useParams().id;


  // Initialize camera on mount
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setCameraError('Failed to access camera. Please allow camera permissions.');
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Camera View at Top Right (Above All Components) */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative w-32 h-24 rounded-md overflow-hidden border border-emerald-300 shadow-sm">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {cameraError && (
            <div className="absolute inset-0 bg-red-600 bg-opacity-75 flex items-center justify-center text-xs text-white text-center">
              {cameraError}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-16 bg-white shadow-md flex flex-col items-center py-4">
        {/* Navigation Options */}
        <NavLink
          to={`/exam/view/mcq/${userId}`}
          className={({ isActive }) =>
            `flex flex-col items-center p-2 mb-4 text-sm font-medium ${
              isActive ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'
            }`
          }
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          MCQ
        </NavLink>
        <NavLink
          to={`/exam/view/coding/${userId}`}
          className={({ isActive }) =>
            `flex flex-col items-center p-2 text-sm font-medium ${
              isActive ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'
            }`
          }
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          Coding
        </NavLink>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default StudentExamLayout;
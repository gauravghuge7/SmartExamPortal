// import React, { useEffect, useRef, useState } from 'react';
// import { NavLink, useParams } from 'react-router-dom';
// import * as faceapi from 'face-api.js';
// import axiosInstance from './../../services/axiosInstance';

// const StudentExamLayout = ({ children }) => {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const streamRef = useRef(null);
//   const recognitionRef = useRef(null);
//   const [cameraError, setCameraError] = useState('');
//   const [faceCount, setFaceCount] = useState(0);
//   const [modelsLoaded, setModelsLoaded] = useState(false);
//   const [cameraLoading, setCameraLoading] = useState(true);
//   const [studentPhotoUrl, setStudentPhotoUrl] = useState('');
//   const [isFaceVerified, setIsFaceVerified] = useState(false);
//   const [isVerifyingFace, setIsVerifyingFace] = useState(false);
//   const [mismatchNotified, setMismatchNotified] = useState(false);
//   const [faceMismatch, setFaceMismatch] = useState(false);
//   const [noFaceRetries, setNoFaceRetries] = useState(0);
//   const [lastSpoken, setLastSpoken] = useState({ message: '', timestamp: 0 });
//   const [toaster, setToaster] = useState({ show: false, message: '', type: 'info' });
//   const [transcription, setTranscription] = useState(null); // Store single transcription { text, timestamp }
//   const [speechRecognitionError, setSpeechRecognitionError] = useState('');
//   const userId = useParams().id;

//   const maxNoFaceRetries = 3;
//   const speechDebounceTime = 5000;

//   // Function to speak a message using Web Speech API with debouncing
//   const speakMessage = (message) => {
//     const now = Date.now();
//     if (lastSpoken.message === message && now - lastSpoken.timestamp < speechDebounceTime) return;

//     window.speechSynthesis.cancel();
//     const utterance = new SpeechSynthesisUtterance(message);
//     utterance.lang = 'en-US';
//     utterance.volume = 1;
//     utterance.rate = 1;
//     utterance.pitch = 1;
//     window.speechSynthesis.speak(utterance);
//     setLastSpoken({ message, timestamp: now });
//   };

//   // Show toaster with message
//   const showToaster = (message, type = 'info') => {
//     setToaster({ show: true, message, type });
//     setTimeout(() => setToaster({ show: false, message: '', type: 'info' }), 3000);
//   };

//   // Fetch student profile photo with retry
//   const fetchStudentProfile = async (retries = 3) => {
//     try {
//       const response = await axiosInstance.get('/student/auth/getProfile');
//       const data = response.data;
//       if (data.statusCode === 200 && data.data.student.studentPhoto?.secure_url) {
//         setStudentPhotoUrl(data.data.student.studentPhoto.secure_url);
//         showToaster('Profile picture loaded successfully.', 'success');
//         console.log('Student Photo URL:', data.data.student.studentPhoto.secure_url);
//       } else {
//         throw new Error('Student photo not found');
//       }
//     } catch (err) {
//       console.error('Error fetching student profile:', err);
//       if (retries > 0) {
//         console.log(`Retrying fetchStudentProfile, ${retries} attempts left`);
//         await new Promise(resolve => setTimeout(resolve, 2000));
//         return fetchStudentProfile(retries - 1);
//       }
//       setCameraError('Failed to fetch student profile picture.');
//       showToaster('Failed to fetch profile picture.', 'error');
//     }
//   };

//   // Load face-api.js models
//   useEffect(() => {
//     const loadModels = async () => {
//       try {
//         const modelPath = '/models';
//         await Promise.all([
//           faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath),
//           faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
//           faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
//         ]);
//         setModelsLoaded(true);
//         showToaster('Face recognition models loaded.', 'success');
//         console.log('Models Loaded:', true);
//       } catch (error) {
//         console.error('Error loading face-api.js models:', error);
//         setCameraError('Failed to load face recognition models.');
//         showToaster('Failed to load face recognition models.', 'error');
//       }
//     };
//     loadModels();
//     fetchStudentProfile();
//   }, []);

//   // Initialize camera, microphone, speech recognition, and handle face verification
//   useEffect(() => {
//     const startCameraAndMic = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: { width: { ideal: 640 }, height: { ideal: 480 } },
//           audio: true, // Request microphone for speech recognition
//         });
//         streamRef.current = stream;
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           console.log('Camera Stream Started:', stream);
//         }

//         // Initialize SpeechRecognition
//         const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//         if (SpeechRecognition) {
//           recognitionRef.current = new SpeechRecognition();
//           recognitionRef.current.lang = 'en-US';
//           recognitionRef.current.continuous = true;
//           recognitionRef.current.interimResults = false; // Only final results for complete sentences

//           recognitionRef.current.onresult = (event) => {
//             const lastResult = event.results[event.results.length - 1];
//             if (lastResult.isFinal) {
//               const sentence = lastResult[0].transcript.trim();
//               if (sentence) {
//                 setTranscription({
//                   text: sentence,
//                   timestamp: new Date().toLocaleTimeString(),
//                 });
//               }
//             }
//           };

//           recognitionRef.current.onerror = (event) => {
//             console.error('Speech recognition error:', event.error);
//             setSpeechRecognitionError('Speech recognition failed: ' + event.error);
//             // No transcription added on error
//           };

//           recognitionRef.current.onend = () => {
//             if (recognitionRef.current && !speechRecognitionError) {
//               recognitionRef.current.start(); // Restart to keep continuous
//             }
//           };

//           recognitionRef.current.start();
//           console.log('Speech Recognition Started');
//         } else {
//           setSpeechRecognitionError('Speech recognition not supported in this browser.');
//         }

//         setCameraLoading(false);
//       } catch (error) {
//         console.error('Error accessing camera or microphone:', error);
//         setCameraError('Failed to access camera or microphone. Please allow permissions.');
//         showToaster('Failed to access camera or microphone.', 'error');
//         setCameraLoading(false);
//       }
//     };

//     startCameraAndMic();

//     // Validate face descriptor
//     const isValidDescriptor = (descriptor) => {
//       return descriptor && descriptor.length === 128 && !descriptor.some(val => isNaN(val) || val === 0);
//     };

//     // Face verification with continuous retries
//     const verifyFace = async () => {
//       if (!videoRef.current || !modelsLoaded || !studentPhotoUrl || cameraError) {
//         console.log('Cannot verify face. Conditions not met:', {
//           videoRef: !!videoRef.current,
//           modelsLoaded,
//           studentPhotoUrl,
//           cameraError,
//         });
//         setIsVerifyingFace(false);
//         setCameraLoading(false);
//         return;
//       }

//       console.log('Starting Face Verification');
//       setIsVerifyingFace(true);
//       setCameraError(''); // Clear previous errors

//       const timeout = setTimeout(() => {
//         console.log('Face Verification Timed Out');
//         setIsVerifyingFace(false);
//         setIsFaceVerified(false);
//         setNoFaceRetries(0); // Reset for next attempt
//       }, 120000);

//       try {
//         await new Promise((resolve, reject) => {
//           if (!videoRef.current) {
//             reject(new Error('Video element not available'));
//             return;
//           }
//           videoRef.current.onloadedmetadata = () => {
//             console.log('Video Ready State:', videoRef.current.readyState);
//             console.log('Video Dimensions:', videoRef.current.videoWidth, videoRef.current.videoHeight);
//             resolve();
//           };
//           videoRef.current.onerror = () => reject(new Error('Video metadata error'));
//           if (videoRef.current.readyState >= 2) {
//             console.log('Video Already Ready:', videoRef.current.readyState);
//             resolve();
//           }
//         });

//         const video = videoRef.current;
//         const distances = [];
//         const maxAttempts = 5;
//         let attempt = 0;

//         while (attempt < maxAttempts) {
//           const detections = await faceapi
//             .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
//             .withFaceLandmarks()
//             .withFaceDescriptors();

//           console.log('Detected Faces during Verification:', detections.length);
//           console.log('Detection Results:', detections);

//           if (detections.length === 0) {
//             if (noFaceRetries >= maxNoFaceRetries) {
//               console.log('No face detected after max retries');
//               showToaster('No face detected after multiple attempts.', 'error');
//               speakMessage('No face detected after multiple attempts.');
//               setIsVerifyingFace(false);
//               setIsFaceVerified(false);
//               setNoFaceRetries(0);
//               clearTimeout(timeout);
//               return;
//             }
//             showToaster('No face detected. Please ensure your face is centered and well-lit.', 'warning');
//             speakMessage('No face detected. Please ensure your face is centered and well-lit.');
//             setNoFaceRetries(prev => prev + 1);
//             await new Promise(resolve => setTimeout(resolve, 1000));
//             continue;
//           }

//           if (detections.length > 1) {
//             console.log('Multiple faces detected for verification');
//             showToaster('Multiple faces detected. Only one face allowed.', 'error');
//             speakMessage('Multiple faces detected. Only one face is allowed.');
//             setIsVerifyingFace(false);
//             setIsFaceVerified(false);
//             setNoFaceRetries(0);
//             clearTimeout(timeout);
//             return;
//           }

//           setNoFaceRetries(0);
//           const canvas = document.createElement('canvas');
//           canvas.width = video.videoWidth;
//           canvas.height = video.videoHeight;
//           const context = canvas.getContext('2d');
//           context.drawImage(video, 0, 0, canvas.width, canvas.height);
//           const capturedPhotoUrl = canvas.toDataURL('image/jpeg', 0.9);

//           const capturedImg = new Image();
//           capturedImg.src = capturedPhotoUrl;

//           await new Promise(resolve => {
//             capturedImg.onload = resolve;
//             capturedImg.onerror = () => resolve();
//           });

//           if (!capturedImg.complete || capturedImg.naturalWidth === 0) {
//             console.log('Failed to load captured photo');
//             showToaster('Failed to load captured photo.', 'error');
//             setIsVerifyingFace(false);
//             setIsFaceVerified(false);
//             setNoFaceRetries(0);
//             clearTimeout(timeout);
//             return;
//           }

//           const capturedDetection = await faceapi
//             .detectSingleFace(capturedImg)
//             .withFaceLandmarks()
//             .withFaceDescriptor();

//           if (!capturedDetection) {
//             console.log('Face not detected in captured photo');
//             showToaster('Face not detected in captured photo.', 'error');
//             setIsVerifyingFace(false);
//             setIsFaceVerified(false);
//             setNoFaceRetries(0);
//             clearTimeout(timeout);
//             return;
//           }

//           const profileImg = new Image();
//           profileImg.crossOrigin = 'anonymous';
//           profileImg.src = studentPhotoUrl;

//           await new Promise(resolve => {
//             profileImg.onload = resolve;
//             profileImg.onerror = () => resolve();
//           });

//           if (!profileImg.complete || profileImg.naturalWidth === 0) {
//             console.log('Failed to load profile picture');
//             showToaster('Failed to load profile picture.', 'error');
//             setIsVerifyingFace(false);
//             setIsFaceVerified(false);
//             setNoFaceRetries(0);
//             clearTimeout(timeout);
//             return;
//           }

//           const profileDetection = await faceapi
//             .detectSingleFace(profileImg)
//             .withFaceLandmarks()
//             .withFaceDescriptor();

//           if (!profileDetection) {
//             console.log('Face not detected in profile picture');
//             showToaster('Face not detected in profile picture.', 'error');
//             setIsVerifyingFace(false);
//             setIsFaceVerified(false);
//             setNoFaceRetries(0);
//             clearTimeout(timeout);
//             return;
//           }

//           if (!isValidDescriptor(capturedDetection.descriptor) || !isValidDescriptor(profileDetection.descriptor)) {
//             console.log('Invalid face descriptors detected');
//             showToaster('Invalid face descriptors. Try again.', 'error');
//             setIsVerifyingFace(false);
//             setIsFaceVerified(false);
//             setNoFaceRetries(0);
//             clearTimeout(timeout);
//             return;
//           }

//           const distance = faceapi.euclideanDistance(
//             profileDetection.descriptor,
//             capturedDetection.descriptor
//           );
//           distances.push(distance);
//           console.log(`Distance Sample ${attempt + 1}:`, distance);
//           console.log('Captured Descriptor:', capturedDetection.descriptor.slice(0, 10), '...');
//           console.log('Profile Descriptor:', profileDetection.descriptor.slice(0, 10), '...');

//           attempt++;
//           await new Promise(resolve => setTimeout(resolve, 1000));
//         }

//         if (distances.length === 0) {
//           throw new Error('No valid face detections obtained.');
//         }

//         const averageDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
//         console.log('Average Distance:', averageDistance);
//         const matchThreshold = 0.4;
//         const isMatch = averageDistance < matchThreshold;
//         console.log('Face Comparison Result:', isMatch ? 'Matched' : 'Not Matched');

//         if (isMatch) {
//           setIsFaceVerified(true);
//           setMismatchNotified(false);
//           setFaceMismatch(false);
//           setCameraError('');
//           showToaster('Face verified successfully!', 'success');
//         } else {
//           console.log('Face verification failed due to mismatch');
//           showToaster('Face verification failed. Check lighting and alignment.', 'error');
//           speakMessage('Face verification failed. Please check lighting and alignment.');
//           setIsFaceVerified(false);
//           setFaceMismatch(true);
//           setNoFaceRetries(0);
//         }
//       } catch (err) {
//         console.error('Face verification error:', err);
//         showToaster('Failed to verify face: ' + err.message, 'error');
//         speakMessage('Failed to verify face. Please try again.');
//         setIsFaceVerified(false);
//         setNoFaceRetries(0);
//       } finally {
//         clearTimeout(timeout);
//         setIsVerifyingFace(false);
//         console.log('Face Verification Completed');
//       }
//     };

//     // Periodic face verification (every 1 minute)
//     const periodicVerifyFace = async () => {
//       if (!videoRef.current || !modelsLoaded || !studentPhotoUrl || cameraError) return;

//       console.log('Starting Periodic Face Verification');
//       try {
//         const video = videoRef.current;
//         const detections = await faceapi
//           .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
//           .withFaceLandmarks()
//           .withFaceDescriptors();

//         if (detections.length === 0) {
//           showToaster('No face detected. Please ensure your face is visible.', 'warning');
//           speakMessage('No face detected. Please ensure your face is visible.');
//           setIsFaceVerified(false);
//           setNoFaceRetries(0);
//           return;
//         }

//         if (detections.length > 1) {
//           showToaster('Multiple faces detected. Only one face allowed.', 'error');
//           speakMessage('Multiple faces detected. Only one face is allowed.');
//           setIsFaceVerified(false);
//           setNoFaceRetries(0);
//           return;
//         }

//         const canvas = document.createElement('canvas');
//         canvas.width = video.videoWidth;
//         canvas.height = video.videoHeight;
//         const context = canvas.getContext('2d');
//         context.drawImage(video, 0, 0, canvas.width, canvas.height);
//         const capturedPhotoUrl = canvas.toDataURL('image/jpeg', 0.9);

//         const capturedImg = new Image();
//         capturedImg.src = capturedPhotoUrl;

//         await new Promise(resolve => {
//           capturedImg.onload = resolve;
//           capturedImg.onerror = () => resolve();
//         });

//         if (!capturedImg.complete || capturedImg.naturalWidth === 0) {
//           console.log('Periodic Verification: Failed to load captured photo.');
//           setIsFaceVerified(false);
//           setNoFaceRetries(0);
//           return;
//         }

//         const capturedDetection = await faceapi
//           .detectSingleFace(capturedImg)
//           .withFaceLandmarks()
//           .withFaceDescriptor();

//         if (!capturedDetection) {
//           console.log('Periodic Verification: Face not detected in captured photo.');
//           setIsFaceVerified(false);
//           setNoFaceRetries(0);
//           return;
//         }

//         const profileImg = new Image();
//         profileImg.crossOrigin = 'anonymous';
//         profileImg.src = studentPhotoUrl;

//         await new Promise(resolve => {
//           profileImg.onload = resolve;
//           profileImg.onerror = () => resolve();
//         });

//         if (!profileImg.complete || profileImg.naturalWidth === 0) {
//           console.log('Periodic Verification: Failed to load profile picture.');
//           setIsFaceVerified(false);
//           setNoFaceRetries(0);
//           return;
//         }

//         const profileDetection = await faceapi
//           .detectSingleFace(profileImg)
//           .withFaceLandmarks()
//           .withFaceDescriptor();

//         if (!profileDetection) {
//           console.log('Periodic Verification: Face not detected in profile picture.');
//           setIsFaceVerified(false);
//           setNoFaceRetries(0);
//           return;
//         }

//         if (!isValidDescriptor(capturedDetection.descriptor) || !isValidDescriptor(profileDetection.descriptor)) {
//           console.log('Periodic Verification: Invalid face descriptors.');
//           setIsFaceVerified(false);
//           setNoFaceRetries(0);
//           return;
//         }

//         const distance = faceapi.euclideanDistance(
//           profileDetection.descriptor,
//           capturedDetection.descriptor
//         );
//         console.log('Periodic Verification Distance:', distance);
//         console.log('Captured Descriptor:', capturedDetection.descriptor.slice(0, 10), '...');
//         console.log('Profile Descriptor:', profileDetection.descriptor.slice(0, 10), '...');
//         const matchThreshold = 0.4;
//         const isMatch = distance < matchThreshold;
//         console.log('Face Comparison Result:', isMatch ? 'Matched' : 'Not Matched');

//         if (isMatch) {
//           setIsFaceVerified(true);
//           setFaceMismatch(false);
//           setMismatchNotified(false);
//           setCameraError('');
//         } else {
//           console.log('Periodic verification failed due to mismatch');
//           showToaster('Face mismatch detected. Please ensure the correct person is present.', 'error');
//           speakMessage('Face mismatch detected. Please ensure the correct person is present.');
//           setIsFaceVerified(false);
//           setFaceMismatch(true);
//           setNoFaceRetries(0);
//         }
//       } catch (err) {
//         console.error('Periodic face verification error:', err);
//         showToaster('Error during face verification.', 'error');
//         speakMessage('Error during face verification.');
//         setIsFaceVerified(false);
//         setNoFaceRetries(0);
//       }
//     };

//     // Face detection loop for proctoring
//     const detectFaces = async () => {
//       if (!videoRef.current || !canvasRef.current || !modelsLoaded || cameraError) return;

//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       const displaySize = { width: video.offsetWidth, height: video.offsetHeight };
//       faceapi.matchDimensions(canvas, displaySize);

//       const detections = await faceapi
//         .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
//         .withFaceLandmarks();
//       setFaceCount(detections.length);

//       if (detections.length === 1) {
//         window.speechSynthesis.cancel();
//         if (!isFaceVerified && !isVerifyingFace && modelsLoaded && studentPhotoUrl && !cameraLoading) {
//           verifyFace();
//         }
//       } else if (detections.length === 0) {
//         showToaster('No face detected. Please ensure your face is visible.', 'warning');
//         speakMessage('No face detected. Please ensure your face is visible.');
//       } else if (detections.length > 1) {
//         showToaster('Multiple faces detected. Only one face allowed.', 'error');
//         speakMessage('Multiple faces detected. Only one face is allowed.');
//       }

//       const resizedDetections = faceapi.resizeResults(detections, displaySize);
//       const ctx = canvas.getContext('2d');
//       ctx.clearRect(0, 0, canvas.width, canvas.height);

//       resizedDetections.forEach(detection => {
//         const box = detection.detection.box;
//         const score = detection.detection.score;

//         ctx.beginPath();
//         ctx.lineWidth = 2;
//         ctx.strokeStyle = '#3b82f6';
//         ctx.rect(box.x, box.y, box.width, box.height);
//         ctx.stroke();

//         ctx.font = '12px Arial';
//         ctx.fillStyle = '#3b82f6';
//         ctx.fillText(score.toFixed(2), box.x, box.y - 5);
//       });
//     };

//     const detectionInterval = setInterval(detectFaces, 2000);
//     const periodicVerificationInterval = setInterval(periodicVerifyFace, 60000);

//     return () => {
//       clearInterval(detectionInterval);
//       clearInterval(periodicVerificationInterval);
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach(track => track.stop());
//         streamRef.current = null;
//       }
//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//         recognitionRef.current = null;
//       }
//     };
//   }, [modelsLoaded, studentPhotoUrl, cameraLoading, isFaceVerified, isVerifyingFace]);

//   // Determine border and status color based on face count, verification status, and mismatch
//   const isInvalidFaceCount = cameraError || faceCount === 0 || faceCount > 1 || !isFaceVerified || faceMismatch;
//   const borderColor = isInvalidFaceCount ? 'border-red-500' : 'border-blue-500';
//   const statusColor = isInvalidFaceCount ? 'bg-red-500' : 'bg-blue-500';
//   const screenBorderClass = faceMismatch ? 'border-4 border-red-500' : '';

//   return (
//     <div className={`min-h-screen bg-gray-100 flex ${screenBorderClass}`}>
//       {/* Toaster */}
//       {toaster.show && (
//         <div
//           className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-md text-white ${
//             toaster.type === 'success'
//               ? 'bg-emerald-600'
//               : toaster.type === 'error'
//               ? 'bg-red-600'
//               : toaster.type === 'warning'
//               ? 'bg-yellow-600'
//               : 'bg-blue-600'
//           }`}
//         >
//           {toaster.message}
//         </div>
//       )}

//       {/* Camera View with Proctoring Effects */}
//       <div className="fixed top-4 right-4 z-50">
//         <div
//           className={`relative w-32 h-24 rounded-xl overflow-hidden border-2 ${borderColor}
//             bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg`}
//         >
//           <div
//             className={`absolute inset-0 border-2 ${borderColor} rounded-xl
//               animate-pulse-glow pointer-events-none`}
//           ></div>

//           <div
//             className={`absolute top-2 right-2 w-3 h-3 rounded-full ${statusColor} animate-pulse`}
//           ></div>

//           {!cameraError && (
//             <div
//               className={`absolute bottom-2 left-2 text-xs ${
//                 isInvalidFaceCount ? 'text-red-300' : 'text-blue-300'
//               } animate-blink pointer-events-none`}
//             >
//               {cameraLoading
//                 ? 'Loading Camera...'
//                 : isVerifyingFace
//                 ? 'Verifying Face...'
//                 : !isFaceVerified
//                 ? 'Face Verification Failed'
//                 : faceCount === 0
//                 ? 'No Face Detected'
//                 : faceCount > 1
//                 ? 'Multiple Faces Detected'
//                 : faceMismatch
//                 ? 'Face Doesn’t Match'
//                 : 'Scanning...'}
//             </div>
//           )}

//           <video
//             ref={videoRef}
//             autoPlay
//             playsInline
//             className="w-full h-full object-cover"
//           />

//           <canvas
//             ref={canvasRef}
//             className="absolute top-0 left-0 w-full h-full pointer-events-none"
//           />

//           {cameraError && (
//             <div className="absolute inset-0 bg-red-600 bg-opacity-75 flex items-center justify-center text-xs text-white text-center p-2">
//               {cameraError}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Transcription Panel */}
//       <div className="fixed top-32 right-4 w-64 bg-white rounded-lg shadow-md p-4 z-50 max-h-[70vh] overflow-y-auto">
//         <h3 className="text-sm font-semibold text-gray-800 mb-2">Live Transcription</h3>
//         {transcription ? (
//           <div>
//             <p className="text-xs text-gray-600">{transcription.timestamp}</p>
//             <p className="text-xs text-gray-800">{transcription.text}</p>
//           </div>
//         ) : (
//           <p className="text-xs text-gray-500">No user speech detected yet.</p>
//         )}
//       </div>

//       {/* Sidebar */}
//       <div className="w-16 bg-white shadow-md flex flex-col items-center py-4">
//         <NavLink
//           to={`/exam/view/mcq/${userId}`}
//           className={({ isActive }) =>
//             `flex flex-col items-center p-2 mb-4 text-sm font-medium ${
//               isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
//             } transition-colors duration-200`
//           }
//         >
//           <svg
//             className="w-6 h-6 mb-1"
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth="2"
//               d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
//             />
//           </svg>
//           MCQ
//         </NavLink>
//         <NavLink
//           to={`/exam/view/coding/${userId}`}
//           className={({ isActive }) =>
//             `flex flex-col items-center p-2 text-sm font-medium ${
//               isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
//             } transition-colors duration-200`
//           }
//         >
//           <svg
//             className="w-6 h-6 mb-1"
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth="2"
//               d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
//             />
//           </svg>
//           Coding
//         </NavLink>
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 p-6">
//         <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-8">
//           {children}
//         </div>
//       </div>

//       {/* Inline CSS for Animations */}
//       <style>
//         {`
//           @keyframes pulse-glow {
//             0% {
//               box-shadow: 0 0 5px rgba(59, 130, 246, 0.4);
//             }
//             50% {
//               box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
//             }
//             100% {
//               box-shadow: 0 0 5px rgba(59, 130, 246, 0.4);
//             }
//           }
//           .animate-pulse-glow {
//             animation: pulse-glow 2s infinite ease-in-out;
//           }

//           @keyframes blink {
//             0% {
//               opacity: 1;
//             }
//             50% {
//               opacity: 0.5;
//             }
//             100% {
//               opacity: 1;
//             }
//           }
//           .animate-blink {
//             animation: blink 1.5s infinite ease-in-out;
//           }
//         `}
//       </style>
//     </div>
//   );
// };

// export default StudentExamLayout;



import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import axiosInstance from './../../services/axiosInstance';

const StudentExamLayout = ({ children }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const [cameraError, setCameraError] = useState('');
  const [faceCount, setFaceCount] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [studentPhotoUrl, setStudentPhotoUrl] = useState('');
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const [mismatchNotified, setMismatchNotified] = useState(false);
  const [faceMismatch, setFaceMismatch] = useState(false);
  const [noFaceRetries, setNoFaceRetries] = useState(0);
  const [lastSpoken, setLastSpoken] = useState({ message: '', timestamp: 0 });
  const [toaster, setToaster] = useState({ show: false, message: '', type: 'info' });
  const [transcription, setTranscription] = useState(null); // Store single transcription { text, timestamp }
  const [interimTranscription, setInterimTranscription] = useState(''); // Store interim text for live display
  const [speechRecognitionError, setSpeechRecognitionError] = useState('');
  const userId = useParams().id;

  const maxNoFaceRetries = 3;
  const speechDebounceTime = 5000;

  // Helper function to check if two strings are similar (to prevent duplicates)
  const areStringsSimilar = (str1, str2) => {
    if (!str1 || !str2) return false;
    str1 = str1.toLowerCase().trim();
    str2 = str2.toLowerCase().trim();
    return str1 === str2 || str1.includes(str2) || str2.includes(str1);
  };

  // Helper function to check if text is a warning message
  const isWarningMessage = (text) => {
    if (!text) return false;
    const warnings = [
      'no face detected',
      'multiple faces detected',
      'face verification failed',
      'face mismatch detected',
      'no face detected after multiple attempts',
    ];
    return warnings.some(warning => text.toLowerCase().includes(warning));
  };

  // Function to speak a message with microphone muting
  const speakMessage = (message) => {
    const allowedWarnings = [
      'No face detected. Please ensure your face is centered and well-lit.',
      'Multiple faces detected. Only one face is allowed.',
      'Face verification failed. Please check lighting and alignment.',
      'Face mismatch detected. Please ensure the correct person is present.',
      'No face detected after multiple attempts.',
    ];
    if (!allowedWarnings.includes(message)) return; // Only speak allowed warnings

    const now = Date.now();
    if (lastSpoken.message === message && now - lastSpoken.timestamp < speechDebounceTime) return;

    // Mute microphone
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => (track.enabled = false));
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US';
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      // Unmute microphone
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => (track.enabled = true));
      }
    };
    window.speechSynthesis.speak(utterance);
    setLastSpoken({ message, timestamp: now });
  };

  // Show toaster with message
  const showToaster = (message, type = 'info') => {
    setToaster({ show: true, message, type });
    setTimeout(() => setToaster({ show: false, message: '', type: 'info' }), 3000);
  };

  // Fetch student profile photo with retry
  const fetchStudentProfile = async (retries = 3) => {
    try {
      const response = await axiosInstance.get('/student/auth/getProfile');
      const data = response.data;
      if (data.statusCode === 200 && data.data.student.studentPhoto?.secure_url) {
        setStudentPhotoUrl(data.data.student.studentPhoto.secure_url);
        showToaster('Profile picture loaded successfully.', 'success');
        console.log('Student Photo URL:', data.data.student.studentPhoto.secure_url);
      } else {
        throw new Error('Student photo not found');
      }
    } catch (err) {
      console.error('Error fetching student profile:', err);
      if (retries > 0) {
        console.log(`Retrying fetchStudentProfile, ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchStudentProfile(retries - 1);
      }
      setCameraError('Failed to fetch student profile picture.');
      showToaster('Failed to fetch profile picture.', 'error');
    }
  };

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const modelPath = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
        ]);
        setModelsLoaded(true);
        showToaster('Face recognition models loaded.', 'success');
        console.log('Models Loaded:', true);
      } catch (error) {
        console.error('Error loading face-api.js models:', error);
        setCameraError('Failed to load face recognition models.');
        showToaster('Failed to load face recognition models.', 'error');
      }
    };
    loadModels();
    fetchStudentProfile();
  }, []);

  // Initialize camera, microphone, speech recognition, and handle face verification
  useEffect(() => {
    let debounceTimeout = null;

    const startCameraAndMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('Camera Stream Started:', stream);
        }

        // Initialize SpeechRecognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.lang = 'en-US';
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true; // Enable interim for live updates

          recognitionRef.current.onresult = (event) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
              const lastResult = event.results[event.results.length - 1];
              const sentence = lastResult[0].transcript.trim();
              console.log('SpeechRecognition Result:', { sentence, isFinal: lastResult.isFinal });

              if (!sentence || isWarningMessage(sentence)) {
                console.log('Skipping transcription:', sentence);
                return; // Skip empty or warning-like text
              }

              if (lastResult.isFinal) {
                // Store final result if not a duplicate
                if (!transcription || !areStringsSimilar(sentence, transcription.text)) {
                  setTranscription({
                    text: sentence,
                    timestamp: new Date().toLocaleTimeString(),
                  });
                  setInterimTranscription(''); // Clear interim
                }
              } else {
                // Display interim result for live feedback
                setInterimTranscription(sentence);
              }
            }, 500);
          };

          recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setSpeechRecognitionError('Speech recognition failed: ' + event.error);
          };

          recognitionRef.current.onend = () => {
            if (recognitionRef.current && !speechRecognitionError) {
              recognitionRef.current.start();
            }
          };

          recognitionRef.current.start();
          console.log('Speech Recognition Started');
        } else {
          setSpeechRecognitionError('Speech recognition not supported in this browser.');
        }

        setCameraLoading(false);
      } catch (error) {
        console.error('Error accessing camera or microphone:', error);
        setCameraError('Failed to access camera or microphone. Please allow permissions.');
        showToaster('Failed to access camera or microphone.', 'error');
        setCameraLoading(false);
      }
    };

    startCameraAndMic();

    // Validate face descriptor
    const isValidDescriptor = (descriptor) => {
      return descriptor && descriptor.length === 128 && !descriptor.some(val => isNaN(val) || val === 0);
    };

    // Face verification with continuous retries
    const verifyFace = async () => {
      if (!videoRef.current || !modelsLoaded || !studentPhotoUrl || cameraError) {
        console.log('Cannot verify face. Conditions not met:', {
          videoRef: !!videoRef.current,
          modelsLoaded,
          studentPhotoUrl,
          cameraError,
        });
        setIsVerifyingFace(false);
        setCameraLoading(false);
        return;
      }

      console.log('Starting Face Verification');
      setIsVerifyingFace(true);
      setCameraError('');

      const timeout = setTimeout(() => {
        console.log('Face Verification Timed Out');
        setIsVerifyingFace(false);
        setIsFaceVerified(false);
        setNoFaceRetries(0);
      }, 120000);

      try {
        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'));
            return;
          }
          videoRef.current.onloadedmetadata = () => {
            console.log('Video Ready State:', videoRef.current.readyState);
            console.log('Video Dimensions:', videoRef.current.videoWidth, videoRef.current.videoHeight);
            resolve();
          };
          videoRef.current.onerror = () => reject(new Error('Video metadata error'));
          if (videoRef.current.readyState >= 2) {
            console.log('Video Already Ready:', videoRef.current.readyState);
            resolve();
          }
        });

        const video = videoRef.current;
        const distances = [];
        const maxAttempts = 5;
        let attempt = 0;

        while (attempt < maxAttempts) {
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
            .withFaceLandmarks()
            .withFaceDescriptors();

          console.log('Detected Faces during Verification:', detections.length);
          console.log('Detection Results:', detections);

          if (detections.length === 0) {
            if (noFaceRetries >= maxNoFaceRetries) {
              console.log('No face detected after max retries');
              showToaster('No face detected after multiple attempts.', 'error');
              speakMessage('No face detected after multiple attempts.');
              setIsVerifyingFace(false);
              setIsFaceVerified(false);
              setNoFaceRetries(0);
              clearTimeout(timeout);
              return;
            }
            showToaster('No face detected. Please ensure your face is centered and well-lit.', 'warning');
            speakMessage('No face detected. Please ensure your face is centered and well-lit.');
            setNoFaceRetries(prev => prev + 1);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }

          if (detections.length > 1) {
            console.log('Multiple faces detected for verification');
            showToaster('Multiple faces detected. Only one face allowed.', 'error');
            speakMessage('Multiple faces detected. Only one face is allowed.');
            setIsVerifyingFace(false);
            setIsFaceVerified(false);
            setNoFaceRetries(0);
            clearTimeout(timeout);
            return;
          }

          setNoFaceRetries(0);
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const capturedPhotoUrl = canvas.toDataURL('image/jpeg', 0.9);

          const capturedImg = new Image();
          capturedImg.src = capturedPhotoUrl;

          await new Promise(resolve => {
            capturedImg.onload = resolve;
            capturedImg.onerror = () => resolve();
          });

          if (!capturedImg.complete || capturedImg.naturalWidth === 0) {
            console.log('Failed to load captured photo');
            showToaster('Failed to load captured photo.', 'error');
            setIsVerifyingFace(false);
            setIsFaceVerified(false);
            setNoFaceRetries(0);
            clearTimeout(timeout);
            return;
          }

          const capturedDetection = await faceapi
            .detectSingleFace(capturedImg)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!capturedDetection) {
            console.log('Face not detected in captured photo');
            showToaster('Face not detected in captured photo.', 'error');
            setIsVerifyingFace(false);
            setIsFaceVerified(false);
            setNoFaceRetries(0);
            clearTimeout(timeout);
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
            console.log('Failed to load profile picture');
            showToaster('Failed to load profile picture.', 'error');
            setIsVerifyingFace(false);
            setIsFaceVerified(false);
            setNoFaceRetries(0);
            clearTimeout(timeout);
            return;
          }

          const profileDetection = await faceapi
            .detectSingleFace(profileImg)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!profileDetection) {
            console.log('Face not detected in profile picture');
            showToaster('Face not detected in profile picture.', 'error');
            setIsVerifyingFace(false);
            setIsFaceVerified(false);
            setNoFaceRetries(0);
            clearTimeout(timeout);
            return;
          }

          if (!isValidDescriptor(capturedDetection.descriptor) || !isValidDescriptor(profileDetection.descriptor)) {
            console.log('Invalid face descriptors detected');
            showToaster('Invalid face descriptors. Try again.', 'error');
            setIsVerifyingFace(false);
            setIsFaceVerified(false);
            setNoFaceRetries(0);
            clearTimeout(timeout);
            return;
          }

          const distance = faceapi.euclideanDistance(
            profileDetection.descriptor,
            capturedDetection.descriptor
          );
          distances.push(distance);
          console.log(`Distance Sample ${attempt + 1}:`, distance);
          console.log('Captured Descriptor:', capturedDetection.descriptor.slice(0, 10), '...');
          console.log('Profile Descriptor:', profileDetection.descriptor.slice(0, 10), '...');

          attempt++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (distances.length === 0) {
          throw new Error('No valid face detections obtained.');
        }

        const averageDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
        console.log('Average Distance:', averageDistance);
        const matchThreshold = 0.4;
        const isMatch = averageDistance < matchThreshold;
        console.log('Face Comparison Result:', isMatch ? 'Matched' : 'Not Matched');

        if (isMatch) {
          setIsFaceVerified(true);
          setMismatchNotified(false);
          setFaceMismatch(false);
          setCameraError('');
          showToaster('Face verified successfully!', 'success');
        } else {
          console.log('Face verification failed due to mismatch');
          showToaster('Face verification failed. Check lighting and alignment.', 'error');
          speakMessage('Face verification failed. Please check lighting and alignment.');
          setIsFaceVerified(false);
          setFaceMismatch(true);
          setNoFaceRetries(0);
        }
      } catch (err) {
        console.error('Face verification error:', err);
        showToaster('Failed to verify face: ' + err.message, 'error');
        setIsFaceVerified(false);
        setNoFaceRetries(0);
      } finally {
        clearTimeout(timeout);
        setIsVerifyingFace(false);
        console.log('Face Verification Completed');
      }
    };

    // Periodic face verification (every 1 minute)
    const periodicVerifyFace = async () => {
      if (!videoRef.current || !modelsLoaded || !studentPhotoUrl || cameraError) return;

      console.log('Starting Periodic Face Verification');
      try {
        const video = videoRef.current;
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length === 0) {
          showToaster('No face detected. Please ensure your face is visible.', 'warning');
          speakMessage('No face detected. Please ensure your face is centered and well-lit.');
          setIsFaceVerified(false);
          setNoFaceRetries(0);
          return;
        }

        if (detections.length > 1) {
          showToaster('Multiple faces detected. Only one face allowed.', 'error');
          speakMessage('Multiple faces detected. Only one face is allowed.');
          setIsFaceVerified(false);
          setNoFaceRetries(0);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const capturedPhotoUrl = canvas.toDataURL('image/jpeg', 0.9);

        const capturedImg = new Image();
        capturedImg.src = capturedPhotoUrl;

        await new Promise(resolve => {
          capturedImg.onload = resolve;
          capturedImg.onerror = () => resolve();
        });

        if (!capturedImg.complete || capturedImg.naturalWidth === 0) {
          console.log('Periodic Verification: Failed to load captured photo.');
          setIsFaceVerified(false);
          setNoFaceRetries(0);
          return;
        }

        const capturedDetection = await faceapi
          .detectSingleFace(capturedImg)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!capturedDetection) {
          console.log('Periodic Verification: Face not detected in captured photo.');
          setIsFaceVerified(false);
          setNoFaceRetries(0);
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
          console.log('Periodic Verification: Failed to load profile picture.');
          setIsFaceVerified(false);
          setNoFaceRetries(0);
          return;
        }

        const profileDetection = await faceapi
          .detectSingleFace(profileImg)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!profileDetection) {
          console.log('Periodic Verification: Face not detected in profile picture.');
          setIsFaceVerified(false);
          setNoFaceRetries(0);
          return;
        }

        if (!isValidDescriptor(capturedDetection.descriptor) || !isValidDescriptor(profileDetection.descriptor)) {
          console.log('Periodic Verification: Invalid face descriptors.');
          setIsFaceVerified(false);
          setNoFaceRetries(0);
          return;
        }

        const distance = faceapi.euclideanDistance(
          profileDetection.descriptor,
          capturedDetection.descriptor
        );
        console.log('Periodic Verification Distance:', distance);
        console.log('Captured Descriptor:', capturedDetection.descriptor.slice(0, 10), '...');
        console.log('Profile Descriptor:', profileDetection.descriptor.slice(0, 10), '...');
        const matchThreshold = 0.4;
        const isMatch = distance < matchThreshold;
        console.log('Face Comparison Result:', isMatch ? 'Matched' : 'Not Matched');

        if (isMatch) {
          setIsFaceVerified(true);
          setFaceMismatch(false);
          setMismatchNotified(false);
          setCameraError('');
        } else {
          console.log('Periodic verification failed due to mismatch');
          showToaster('Face mismatch detected. Please ensure the correct person is present.', 'error');
          speakMessage('Face mismatch detected. Please ensure the correct person is present.');
          setIsFaceVerified(false);
          setFaceMismatch(true);
          setNoFaceRetries(0);
        }
      } catch (err) {
        console.error('Periodic face verification error:', err);
        showToaster('Error during face verification.', 'error');
        setIsFaceVerified(false);
        setNoFaceRetries(0);
      }
    };

    // Face detection loop for proctoring
    const detectFaces = async () => {
      if (!videoRef.current || !canvasRef.current || !modelsLoaded || cameraError) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.offsetWidth, height: video.offsetHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
        .withFaceLandmarks();
      setFaceCount(detections.length);

      if (detections.length === 1) {
        window.speechSynthesis.cancel();
        if (!isFaceVerified && !isVerifyingFace && modelsLoaded && studentPhotoUrl && !cameraLoading) {
          verifyFace();
        }
      } else if (detections.length === 0) {
        showToaster('No face detected. Please ensure your face is visible.', 'warning');
        speakMessage('No face detected. Please ensure your face is centered and well-lit.');
      } else if (detections.length > 1) {
        showToaster('Multiple faces detected. Only one face allowed.', 'error');
        speakMessage('Multiple faces detected. Only one face is allowed.');
      }

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      resizedDetections.forEach(detection => {
        const box = detection.detection.box;
        const score = detection.detection.score;

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#3b82f6';
        ctx.rect(box.x, box.y, box.width, box.height);
        ctx.stroke();

        ctx.font = '12px Arial';
        ctx.fillStyle = '#3b82f6';
        ctx.fillText(score.toFixed(2), box.x, box.y - 5);
      });
    };

    const detectionInterval = setInterval(detectFaces, 2000);
    const periodicVerificationInterval = setInterval(periodicVerifyFace, 60000);

    return () => {
      clearInterval(detectionInterval);
      clearInterval(periodicVerificationInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [modelsLoaded, studentPhotoUrl, cameraLoading, isFaceVerified, isVerifyingFace]);

  // Determine border and status color based on face count, verification status, and mismatch
  const isInvalidFaceCount = cameraError || faceCount === 0 || faceCount > 1 || !isFaceVerified || faceMismatch;
  const borderColor = isInvalidFaceCount ? 'border-red-500' : 'border-blue-500';
  const statusColor = isInvalidFaceCount ? 'bg-red-500' : 'bg-blue-500';
  const screenBorderClass = faceMismatch ? 'border-4 border-red-500' : '';

  return (
    <div className={`min-h-screen bg-gray-100 flex ${screenBorderClass}`}>
      {/* Toaster */}
      {toaster.show && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-md text-white ${
            toaster.type === 'success'
              ? 'bg-emerald-600'
              : toaster.type === 'error'
              ? 'bg-red-600'
              : toaster.type === 'warning'
              ? 'bg-yellow-600'
              : 'bg-blue-600'
          }`}
        >
          {toaster.message}
        </div>
      )}

      {/* Camera View with Proctoring Effects */}
      <div className="fixed top-4 right-4 z-50">
        <div
          className={`relative w-32 h-24 rounded-xl overflow-hidden border-2 ${borderColor}
            bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg`}
        >
          <div
            className={`absolute inset-0 border-2 ${borderColor} rounded-xl
              animate-pulse-glow pointer-events-none`}
          ></div>

          <div
            className={`absolute top-2 right-2 w-3 h-3 rounded-full ${statusColor} animate-pulse`}
          ></div>

          {!cameraError && (
            <div
              className={`absolute bottom-2 left-2 text-xs ${
                isInvalidFaceCount ? 'text-red-300' : 'text-blue-300'
              } animate-blink pointer-events-none`}
            >
              {cameraLoading
                ? 'Loading Camera...'
                : isVerifyingFace
                ? 'Verifying Face...'
                : !isFaceVerified
                ? 'Face Verification Failed'
                : faceCount === 0
                ? 'No Face Detected'
                : faceCount > 1
                ? 'Multiple Faces Detected'
                : faceMismatch
                ? 'Face Doesn’t Match'
                : 'Scanning...'}
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />

          {cameraError && (
            <div className="absolute inset-0 bg-red-600 bg-opacity-75 flex items-center justify-center text-xs text-white text-center p-2">
              {cameraError}
            </div>
          )}
        </div>
      </div>

      {/* Transcription Panel */}
      <div className="fixed top-32 right-4 w-64 bg-white rounded-lg shadow-md p-4 z-50 max-h-[70vh] overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Live Transcription</h3>
        {transcription || interimTranscription ? (
          <div>
            <p className="text-xs text-gray-600">
              {transcription ? transcription.timestamp : new Date().toLocaleTimeString()}
            </p>
            <p className="text-xs text-gray-800">
              {interimTranscription || (transcription ? transcription.text : '')}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-500">No user speech detected yet.</p>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-16 bg-white shadow-md flex flex-col items-center py-4">
        <NavLink
          to={`/exam/view/mcq/${userId}`}
          className={({ isActive }) =>
            `flex flex-col items-center p-2 mb-4 text-sm font-medium ${
              isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
            } transition-colors duration-200`
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
              isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
            } transition-colors duration-200`
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

      {/* Inline CSS for Animations */}
      <style>
        {`
          @keyframes pulse-glow {
            0% {
              box-shadow: 0 0 5px rgba(59, 130, 246, 0.4);
            }
            50% {
              box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
            }
            100% {
              box-shadow: 0 0 5px rgba(59, 130, 246, 0.4);
            }
          }
          .animate-pulse-glow {
            animation: pulse-glow 2s infinite ease-in-out;
          }

          @keyframes blink {
            0% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
            100% {
              opacity: 1;
            }
          }
          .animate-blink {
            animation: blink 1.5s infinite ease-in-out;
          }
        `}
      </style>
    </div>
  );
};

export default StudentExamLayout;
import { useState, useRef, useEffect } from 'react';
import { Camera, UserPlus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadModels, detectSingleFace } from '../lib/faceDetection';

export default function RegisterUser() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('student');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [message, setMessage] = useState('');
  const [modelsReady, setModelsReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ✅ FIX ADDED HERE (MODEL LOADING)
  useEffect(() => {
    const init = async () => {
      try {
        await loadModels();
        setModelsReady(true);
        console.log("Models loaded successfully ✅");
      } catch (error) {
        console.error("Error loading models:", error);
        setMessage("Failed to load face detection models.");
      }
    };

    init();
  }, []);
  // ✅ END FIX

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;

      videoRef.current.onloadedmetadata = async () => {
        try {
          await videoRef.current?.play();
          console.log("Video playing properly ✅");
        } catch (err) {
          console.error("Video play error:", err);
        }
      };
    }
  }, [cameraActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);
      setMessage("Camera started successfully. Position your face in the frame.");
    } catch (err) {
      console.error(err);
      setMessage("Error accessing camera. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const captureAndRegister = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsReady) {
      setMessage('Models not loaded yet. Please wait...');
      return;
    }

    if (!name || !email || !employeeId) {
      setMessage('Please fill in all required fields');
      return;
    }

    if (videoRef.current.videoWidth === 0) {
      setMessage('Camera is still loading. Please wait a moment and try again.');
      return;
    }

    setCapturing(true);
    setMessage('Detecting face...');

    try {
      const detection = await detectSingleFace(videoRef.current);

      if (!detection) {
        setMessage('No face detected. Please position your face clearly in the camera.');
        setCapturing(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          name,
          email,
          employee_id: employeeId,
          department,
          role,
        })
        .select()
        .single();

      if (userError) {
        if (userError.code === '23505') {
          setMessage('Email or Employee ID already exists');
        } else {
          setMessage('Error creating user: ' + userError.message);
        }
        setCapturing(false);
        return;
      }

      const { error: faceError } = await supabase
        .from('face_descriptors')
        .insert({
          user_id: userData.id,
          descriptor: descriptor,
        });

      if (faceError) {
        setMessage('Error saving face data: ' + faceError.message);
        setCapturing(false);
        return;
      }

      setMessage('User registered successfully!');
      setName('');
      setEmail('');
      setEmployeeId('');
      setDepartment('');
      setRole('student');
      stopCamera();
    } catch (err) {
      setMessage('Error during registration: ' + (err as Error).message);
    }

    setCapturing(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <UserPlus className="w-6 md:w-8 h-6 md:h-8 text-blue-600" />
          Register New User
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-2 text-base md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-2 text-base md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee/Student ID *
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-2 text-base md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="EMP001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department/Class
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-2 text-base md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Computer Science"
              />
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">Face Capture</h3>

              {!cameraActive ? (
                <div className="flex items-center justify-center min-h-48 md:min-h-64 bg-gray-200 rounded-lg">
                  <button
                    onClick={startCamera}
                    disabled={!modelsReady}
                    className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <Camera className="w-4 md:w-5 h-4 md:h-5" />
                    {modelsReady ? 'Start Camera' : 'Loading Models...'}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-80 object-cover rounded-lg bg-black"
                  />
                  <button
                    onClick={stopCamera}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <X className="w-4 md:w-5 h-4 md:h-5" />
                  </button>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>

            <button
              onClick={captureAndRegister}
              disabled={!cameraActive || capturing}
              className="w-full px-4 md:px-6 py-2.5 md:py-3 text-base md:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {capturing ? 'Processing...' : 'Capture & Register'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`mt-4 md:mt-6 p-3 md:p-4 rounded-lg text-sm md:text-base ${
            message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

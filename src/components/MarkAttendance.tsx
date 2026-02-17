import { useState, useRef, useEffect } from "react";
import { Camera, CheckCircle, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  loadModels,
  detectSingleFace,
  areDescriptorsSimilar,
} from "../lib/faceDetection";

export default function MarkAttendance() {
  const [cameraActive, setCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [modelsReady, setModelsReady] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ✅ Load face-api models
  useEffect(() => {
    const initModels = async () => {
      try {
        await loadModels();
        setModelsReady(true);
        console.log("Models loaded ✅");
      } catch (err) {
        console.error("Model loading error:", err);
      }
    };

    initModels();
  }, []);

  // ✅ Attach stream after video renders
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;

      videoRef.current.onloadedmetadata = async () => {
        try {
          await videoRef.current?.play();
          console.log("Video playing ✅");
        } catch (err) {
          console.error("Video play error:", err);
        }
      };
    }
  }, [cameraActive]);

  // ✅ Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);
      setMessage("Camera started. Look at the camera.");
    } catch (err) {
      console.error(err);
      setMessage("Error accessing camera.");
    }
  };

  // ✅ Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  // ✅ Recognize Face
  const recognizeAndMarkAttendance = async () => {
    if (!videoRef.current || !modelsReady) {
      setMessage("Models not loaded yet...");
      return;
    }

    if (videoRef.current.videoWidth === 0) {
      setMessage("Camera still loading...");
      return;
    }

    setProcessing(true);
    setMessage("Detecting face...");
    setMatchedUser(null);

    try {
      const detection = await detectSingleFace(videoRef.current);

      if (!detection) {
        setMessage("No face detected.");
        setProcessing(false);
        return;
      }

      const currentDescriptor = detection.descriptor;

      const { data: faceDescriptors, error } = await supabase
        .from("face_descriptors")
        .select("*, users(*)");

      if (error) {
        setMessage("Error fetching face data.");
        setProcessing(false);
        return;
      }

      let bestMatch: any = null;
      let bestDistance = Infinity;

      for (const faceDesc of faceDescriptors || []) {
        const isSimilar = areDescriptorsSimilar(
          currentDescriptor,
          faceDesc.descriptor,
          0.6
        );

        if (isSimilar) {
          const distance = faceDesc.descriptor.reduce(
            (sum: number, val: number, i: number) =>
              sum + Math.pow(val - currentDescriptor[i], 2),
            0
          );

          if (distance < bestDistance) {
            bestDistance = distance;
            bestMatch = faceDesc;
          }
        }
      }

      if (!bestMatch) {
        setMessage("Face not recognized.");
        setProcessing(false);
        return;
      }

      const user = bestMatch.users;
      setMatchedUser(user);

      const { error: attendanceError } = await supabase
        .from("attendance")
        .insert({
          user_id: user.id,
          status: "present",
        });

      if (attendanceError) {
        setMessage("Error marking attendance.");
      } else {
        setMessage(`Attendance marked for ${user.name} ✅`);
      }
    } catch (err) {
      setMessage("Recognition error.");
    }

    setProcessing(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <CheckCircle className="text-green-600" />
          Mark Attendance
        </h2>

        {!cameraActive ? (
          <div className="flex justify-center items-center h-96 bg-gray-200 rounded-lg">
            <button
              onClick={startCamera}
              disabled={!modelsReady}
              className="px-6 py-3 bg-green-600 text-white rounded-lg"
            >
              {modelsReady ? "Start Camera" : "Loading Models..."}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-96 md:w-2/3 md:h-[500px] md:mx-auto object-cover rounded-lg bg-black"
              />
              <button
                onClick={stopCamera}
                className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full"
              >
                <X />
              </button>
            </div>

            <button
              onClick={recognizeAndMarkAttendance}
              disabled={processing}
              className="w-full py-3 bg-blue-600 text-white rounded-lg"
            >
              {processing ? "Processing..." : "Recognize & Mark Attendance"}
            </button>
          </div>
        )}

        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-center">
            {message}
          </div>
        )}

        {matchedUser && (
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p><strong>Name:</strong> {matchedUser.name}</p>
            <p><strong>ID:</strong> {matchedUser.employee_id}</p>
          </div>
        )}
      </div>
    </div>
  );
}

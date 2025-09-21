import { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

function Camera() {
  const videoRef = useRef(null);
  const [blinkCount, setBlinkCount] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load face-api.js models
  useEffect(() => {
    async function loadModels() {
      const MODEL_URL = "/models"; // put models in public/models
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
    }
    loadModels();
  }, []);

  // Start camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }
    startCamera();
  }, []);

  // Track blinks
  useEffect(() => {
    if (!tracking || !modelsLoaded) return;

    let lastEyeClosed = false;
    const interval = setInterval(async () => {
      if (videoRef.current) {
        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true);

        if (detections) {
          const landmarks = detections.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          const eyeOpenRatio = (eye) => {
            const vertical = Math.hypot(eye[1].y - eye[5].y) + Math.hypot(eye[2].y - eye[4].y);
            const horizontal = Math.hypot(eye[0].x - eye[3].x);
            return vertical / (2.0 * horizontal);
          };

          const leftOpen = eyeOpenRatio(leftEye);
          const rightOpen = eyeOpenRatio(rightEye);

          const isClosed = (leftOpen + rightOpen) / 2 < 0.25; // threshold

          if (isClosed && !lastEyeClosed) {
            setBlinkCount((prev) => prev + 1);
            lastEyeClosed = true;
          } else if (!isClosed) {
            lastEyeClosed = false;
          }
        }
      }
    }, 200); // check every 200ms

    return () => clearInterval(interval);
  }, [tracking, modelsLoaded]);

  return (
    <div style={{ textAlign: "center" }}>
      <video ref={videoRef} autoPlay playsInline width="500" style={{ borderRadius: "10px" }} />

      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={() => {
            if (tracking) {
              setTracking(false);
            } else {
              setBlinkCount(0);
              setTracking(true);
            }
          }}
          style={{
            padding: "0.6rem 1.2rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            background: tracking ? "#e74c3c" : "#2ecc71",
            color: "#fff",
            marginRight: "1rem",
          }}
        >
          {tracking ? "End Session" : "Start Session"}
        </button>

        <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
          Blinks: {blinkCount}
        </span>
      </div>
    </div>
  );
}

export default Camera;

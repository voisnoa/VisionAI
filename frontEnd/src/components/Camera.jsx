import React, { useRef, useEffect, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

const CameraComponent = ({ onResults }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraInstance, setCameraInstance] = useState(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Initialize FaceMesh
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults((results) => {
      if (!canvasRef.current) return;

      const canvasCtx = canvasRef.current.getContext("2d");
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw video
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // Draw landmarks if available
      if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
          for (let i = 0; i < landmarks.length; i++) {
            const x = landmarks[i].x * canvasRef.current.width;
            const y = landmarks[i].y * canvasRef.current.height;
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 1.5, 0, 2 * Math.PI);
            canvasCtx.fillStyle = "red";
            canvasCtx.fill();
          }
        }
      }

      canvasCtx.restore();

      // Optional: pass results to parent
      if (onResults) onResults(results);
    });

    // Initialize camera
    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await faceMesh.send({ image: videoRef.current });
      },
      width: 640,
      height: 480
    });

    camera.start();
    setCameraInstance(camera);

    return () => {
      if (cameraInstance) cameraInstance.stop();
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <video
        ref={videoRef}
        style={{ display: "none" }}
        width="640"
        height="480"
      />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ border: "1px solid black" }}
      />
    </div>
  );
};

export default CameraComponent;

import React, { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

export default function BlinkTracker() {
  const videoRef = useRef(null);
  const [blinkCount, setBlinkCount] = useState(0);

  const EAR_THRESHOLD = 0.27;
  const COOLDOWN_FRAMES = 5;
  const HISTORY_SIZE = 3;

  useEffect(() => {
    if (!videoRef.current) return;

    let prevBlink = false;
    let cooldown = 0;
    const EAR_HISTORY = [];

    const computeEAR = (landmarks, leftIndices, rightIndices) => {
      const euclidean = (p1, p2) =>
        Math.sqrt(
          (p1.x - p2.x) ** 2 +
          (p1.y - p2.y) ** 2 +
          (p1.z - p2.z) ** 2
        );

      const leftEAR =
        (euclidean(landmarks[leftIndices[1]], landmarks[leftIndices[5]]) +
         euclidean(landmarks[leftIndices[2]], landmarks[leftIndices[4]])) /
        (2 * euclidean(landmarks[leftIndices[0]], landmarks[leftIndices[3]]));

      const rightEAR =
        (euclidean(landmarks[rightIndices[1]], landmarks[rightIndices[5]]) +
         euclidean(landmarks[rightIndices[2]], landmarks[rightIndices[4]])) /
        (2 * euclidean(landmarks[rightIndices[0]], landmarks[rightIndices[3]]));

      return (leftEAR + rightEAR) / 2;
    };

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    faceMesh.onResults((results) => {
      if (!results.multiFaceLandmarks) return;

      const landmarks = results.multiFaceLandmarks[0];
      const leftEye = [33, 160, 158, 133, 153, 144];
      const rightEye = [263, 387, 385, 362, 380, 373];

      const ear = computeEAR(landmarks, leftEye, rightEye);

      // Smooth EAR over history
      EAR_HISTORY.push(ear);
      if (EAR_HISTORY.length > HISTORY_SIZE) EAR_HISTORY.shift();
      const avgEAR = EAR_HISTORY.reduce((a, b) => a + b, 0) / EAR_HISTORY.length;

      if (cooldown > 0) {
        cooldown--;
        return;
      }

      if (avgEAR < EAR_THRESHOLD && !prevBlink) {
        setBlinkCount((prev) => prev + 1);
        prevBlink = true;
        cooldown = COOLDOWN_FRAMES;
      }

      if (avgEAR >= EAR_THRESHOLD) {
        prevBlink = false;
      }
    });

    // Initialize camera
    const camera = new Camera(videoRef.current, {
      onFrame: async () => {}, // unused
      width: 640,
      height: 480,
    });

    camera.start().then(() => {
      const video = videoRef.current;
      if (!video) return;

      // Ensure video is playing before sending frames
      video.onloadeddata = () => {
        const processFrame = async () => {
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            // Wait until video has loaded frames
            video.requestVideoFrameCallback(processFrame);
            return;
          }
          await faceMesh.send({ image: video });
          video.requestVideoFrameCallback(processFrame);
        };
        video.requestVideoFrameCallback(processFrame);
      };
    });

  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Blink Tracker</h1>
      <video
        ref={videoRef}
        style={{ transform: "scaleX(-1)", width: "640px", height: "480px" }}
        autoPlay
        muted
        playsInline
      />
      <h2>Total Blinks: {blinkCount}</h2>
    </div>
  );
}

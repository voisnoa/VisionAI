import { useRef, useEffect } from "react";

function Camera() {
  const videoRef = useRef(null);

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

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <video ref={videoRef} autoPlay playsInline width="500" style={{ borderRadius: "10px" }} />
    </div>
  );
}

export default Camera;

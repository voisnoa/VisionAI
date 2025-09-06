let blinkCount = 0;
let blinkTimestamps = [];
let lastBlink = false;
const earThreshold = 0.30; // adjust if too sensitive

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');

function euclidean(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function eyeAspectRatio(lms, idx) {
  const p1 = lms[idx[0]];
  const p2 = lms[idx[1]];
  const p3 = lms[idx[2]];
  const p4 = lms[idx[3]];
  const p5 = lms[idx[4]];
  const p6 = lms[idx[5]];
  const v1 = euclidean(p2, p6);
  const v2 = euclidean(p3, p5);
  const h = euclidean(p1, p4);
  return (v1 + v2) / (2.0 * h);
}

// Eye landmark indices
const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [263, 387, 385, 362, 373, 380];

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const lms = results.multiFaceLandmarks[0];
    const leftEAR = eyeAspectRatio(lms, LEFT_EYE);
    const rightEAR = eyeAspectRatio(lms, RIGHT_EYE);
    const ear = (leftEAR + rightEAR) / 2.0;

    const isBlink = ear < earThreshold;
    if (isBlink && !lastBlink) {
      blinkCount++;
      blinkTimestamps.push(Date.now());
      document.getElementById('blinkCount').innerText = blinkCount;
    }
    lastBlink = isBlink;

    
    const now = Date.now();
    blinkTimestamps = blinkTimestamps.filter(t => now - t < 60000);
    document.getElementById('blinksPerMin').innerText = blinkTimestamps.length;
  }
  canvasCtx.restore();
}


const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);


const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({image: videoElement});
  },
  width: 640,
  height: 480
});
camera.start();


import { useRef, useEffect, useState } from "react";

function Camera({ onCapture, isActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        onCapture(imageUrl, imageData);
      }
    }, "image/jpeg", 0.95);
  };

  const handleCapture = () => {
    if (countdown !== null) return;

    let count = 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        setCountdown(null);
        clearInterval(interval);
        capturePhoto();
      }
    }, 1000);
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="camera-container">
      {error ? (
        <div className="camera-error">{error}</div>
      ) : (
        <>
          <div className="video-wrapper">
            <video ref={videoRef} autoPlay playsInline muted />
            {countdown !== null && (
              <div className="countdown-overlay">
                <div className="countdown-number">{countdown}</div>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <button onClick={handleCapture} className="btn-capture" disabled={countdown !== null}>
            {countdown !== null ? `Taking photo in ${countdown}...` : "Take Photo"}
          </button>
        </>
      )}
    </div>
  );
}

export default Camera;


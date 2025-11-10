import { useRef, useEffect, useState, useCallback } from "react";

function Camera({ onCapture, isActive, onCaptureReady }) {
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

    // Mirror the image horizontally to match the video preview
    context.save();
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0);
    context.restore();

    // Get image data after mirroring
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        onCapture(imageUrl, imageData);
      }
    }, "image/jpeg", 0.95);
  };

  const handleCapture = useCallback(() => {
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
  }, [countdown]);

  // Expose capture handler to parent when camera is active
  useEffect(() => {
    if (onCaptureReady && isActive && handleCapture) {
      onCaptureReady({ handleCapture, countdown });
    }
  }, [onCaptureReady, isActive, handleCapture, countdown]);

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
        </>
      )}
    </div>
  );
}

export default Camera;


import { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import Camera from "./components/Camera.jsx";
import PhotoStrip from "./components/PhotoStrip.jsx";
import { extractColorPalette as extractColorPaletteAgglomerative, rgbToHex, isLightColor } from "./utils/colorClustering.js";
import { extractColorPalette as extractColorPaletteKMeans } from "./utils/kmeansClustering.js";
import "./styles.css";

// Initialize React app
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  console.error("Root element not found");
}

function App() {
  const [photos, setPhotos] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hoveredColor, setHoveredColor] = useState(null);
  const [hoveredPalette, setHoveredPalette] = useState(null);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [captureHandler, setCaptureHandler] = useState(null);
  const [captureCountdown, setCaptureCountdown] = useState(null);
  const [clusteringMethod, setClusteringMethod] = useState('agglomerative'); // 'agglomerative' or 'kmeans'
  const fileInputRef = useRef(null);

  const colorIndexRef = useRef(0);

  // cycle through palette colors when hovering
  useEffect(() => {
    if (!hoveredPalette || hoveredPalette.length === 0) {
      setHoveredColor(null);
      colorIndexRef.current = 0;
      return;
    }

    // reset to first color when palette changes
    colorIndexRef.current = 0;
    setCurrentColorIndex(0);
    setHoveredColor(hoveredPalette[0].hex);

    const interval = setInterval(() => {
      colorIndexRef.current = (colorIndexRef.current + 1) % hoveredPalette.length;
      setCurrentColorIndex(colorIndexRef.current);
      setHoveredColor(hoveredPalette[colorIndexRef.current].hex);
    }, 800); // change color every 800ms

    return () => clearInterval(interval);
  }, [hoveredPalette]);

  // update body background color when hoveredColor changes
  useEffect(() => {
    document.body.style.backgroundColor = hoveredColor || '#FAF5E6';
  }, [hoveredColor]);

  const formatPalette = (palette) => {
    return palette.map((rgb) => {
      const clampedRgb = rgb.map(c => Math.max(0, Math.min(255, Math.round(c))));
      return {
        rgb: clampedRgb,
        hex: rgbToHex(clampedRgb),
        isLight: isLightColor(clampedRgb),
      };
    });
  };

  const handleCapture = useCallback(async (imageUrl, imageData, skipProcessingState = false) => {
    if (!skipProcessingState) {
      setIsProcessing(true);
    }

    // extract color palettes using both clustering methods
    let agglomerativePalette, kmeansPalette;
    try {
      agglomerativePalette = extractColorPaletteAgglomerative(imageData, 5, 1500);
      kmeansPalette = extractColorPaletteKMeans(imageData, 5, 2000);
    } catch (error) {
      throw error;
    }

    // format both palettes
    const formattedAgglomerative = formatPalette(agglomerativePalette);
    const formattedKMeans = formatPalette(kmeansPalette);

    const newPhoto = {
      imageUrl,
      palettes: {
        agglomerative: formattedAgglomerative,
        kmeans: formattedKMeans,
      },
      timestamp: Date.now(),
    };

    setPhotos((prev) => [...prev, newPhoto]);
    
    if (!skipProcessingState) {
      setIsProcessing(false);
    }
  }, []);


  const handleClearAll = () => {
    photos.forEach((photo) => {
      URL.revokeObjectURL(photo.imageUrl);
    });
    setPhotos([]);
  };

  const toggleCamera = () => {
    setIsCameraActive((prev) => !prev);
  };

  const handleCaptureReady = ({ handleCapture, countdown }) => {
    setCaptureHandler(() => handleCapture);
    setCaptureCountdown(countdown);
  };

  const processImageFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const imageUrl = URL.createObjectURL(file);
          resolve({ imageUrl, imageData });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    const remainingSlots = 4 - photos.length;
    
    if (remainingSlots <= 0) {
      alert('You can only add up to 4 photos total.');
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots).filter(file => file.type.startsWith('image/'));
    
    if (filesToProcess.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      for (const file of filesToProcess) {
        try {
          const { imageUrl, imageData } = await processImageFile(file);
          await handleCapture(imageUrl, imageData, true);
        } catch (error) {
          console.error('Error processing file:', error);
        }
      }
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const isHomeScreen = photos.length === 0 && !isCameraActive;

  return (
    <div className={`app ${isHomeScreen ? 'home-screen' : ''}`}>
      {isHomeScreen && (
        <a href="#" className="about-link">↑ About</a>
      )}
      
      {!isHomeScreen && hoveredPalette && hoveredPalette.length > 0 && (
        <div className="color-indicator">
          Color {currentColorIndex + 1} of {hoveredPalette.length}
        </div>
      )}

      <main className={`app-main ${isHomeScreen ? 'home-screen-main' : ''}`}>
        {photos.length < 4 && (
          <>
            <div className="controls-section">
              {isHomeScreen && (
                <h1 className="home-title">color palette photobooth</h1>
              )}
              {!isHomeScreen && (
                <div className="instructions-text">
                  {!isCameraActive && (
                    <p>take photos and discover their color palettes, determined through {clusteringMethod === 'kmeans' ? 'k-means' : 'agglomerative'} clustering</p>
                  )}
                </div>
              )}
              {isHomeScreen && (
                <div className="welcome-message">
                  <p>take photos and discover their color palettes, determined through {clusteringMethod === 'kmeans' ? 'k-means' : 'agglomerative'} clustering</p>
                </div>
              )}
              <div className="clustering-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={clusteringMethod === 'kmeans'}
                    onChange={(e) => {
                      const newMethod = e.target.checked ? 'kmeans' : 'agglomerative';
                      console.log('Toggle clicked! Changing from', clusteringMethod, 'to', newMethod);
                      setClusteringMethod(newMethod);
                    }}
                    className="toggle-input"
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">
                    {clusteringMethod === 'kmeans' ? 'K-Means' : 'Agglomerative'}
                  </span>
                </label>
              </div>
              <div className="camera-controls-buttons">
                <button
                  onClick={toggleCamera}
                  className={`btn-toggle-camera ${isCameraActive ? "active" : ""}`}
                >
                  {isCameraActive ? "Stop Camera" : "Start Camera"}
                </button>
                {isCameraActive && captureHandler && (
                  <button
                    onClick={captureHandler}
                    className="btn-capture"
                    disabled={captureCountdown !== null}
                  >
                    {captureCountdown !== null ? `Taking photo in ${captureCountdown}...` : "Take Photo"}
                  </button>
                )}
                {!isCameraActive && photos.length < 4 && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={triggerFileUpload}
                      className="btn-upload"
                      disabled={photos.length >= 4}
                    >
                      Upload Photos
                    </button>
                  </>
                )}
              </div>
              {photos.length > 0 && photos.length < 4 && (
                <div className="photo-thumbnail-preview">
                  {photos.slice(0, 4).map((photo, index) => (
                    <div key={index} className="photo-thumbnail-item">
                      <img src={photo.imageUrl} alt={`Photo ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}
              {isProcessing && (
                <div className="processing-indicator">
                  Processing color palette...
                </div>
              )}
            </div>

            {isCameraActive && (
              <Camera 
                onCapture={handleCapture} 
                isActive={isCameraActive}
                onCaptureReady={handleCaptureReady}
              />
            )}
          </>
        )}

        {photos.length >= 4 && (
          <>
            <div className="clustering-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={clusteringMethod === 'kmeans'}
                  onChange={(e) => {
                    const newMethod = e.target.checked ? 'kmeans' : 'agglomerative';
                    console.log('Toggle clicked! Changing from', clusteringMethod, 'to', newMethod);
                    setClusteringMethod(newMethod);
                  }}
                  className="toggle-input"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {clusteringMethod === 'kmeans' ? 'K-Means' : 'Agglomerative'}
                </span>
              </label>
            </div>
            <PhotoStrip
              photos={photos}
              onClearAll={handleClearAll}
              onPhotoHover={setHoveredPalette}
              clusteringMethod={clusteringMethod}
            />
          </>
        )}
      </main>
    </div>
  );
}

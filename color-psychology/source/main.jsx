import { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import Camera from "./components/Camera.jsx";
import PhotoStrip from "./components/PhotoStrip.jsx";
import { extractColorPalette, rgbToHex, isLightColor } from "./utils/colorClustering.js";
import "./styles.css";

window.addEventListener("load", () => {
  let root = createRoot(document.getElementById("root"));
  root.render(<App />);
});

function App() {
  const [photos, setPhotos] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hoveredColor, setHoveredColor] = useState(null);
  const [hoveredPalette, setHoveredPalette] = useState(null);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);

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
    document.body.style.backgroundColor = hoveredColor || '#667eea';
  }, [hoveredColor]);

  const handleCapture = async (imageUrl, imageData) => {
    setIsProcessing(true);
    
    // extract color palette using agglomerative clustering
    const palette = extractColorPalette(imageData, 5, 1500);
    
    // format palette with hex codes and contrast info
    const formattedPalette = palette.map((rgb) => ({
      rgb,
      hex: rgbToHex(rgb),
      isLight: isLightColor(rgb),
    }));

    const newPhoto = {
      imageUrl,
      palette: formattedPalette,
      timestamp: Date.now(),
    };

    setPhotos((prev) => [...prev, newPhoto]);
    setIsProcessing(false);
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => {
      const updated = [...prev];
      // revoke object url to free memory
      URL.revokeObjectURL(updated[index].imageUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleClearAll = () => {
    photos.forEach((photo) => {
      URL.revokeObjectURL(photo.imageUrl);
    });
    setPhotos([]);
  };

  const toggleCamera = () => {
    setIsCameraActive((prev) => !prev);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 Color Palette Photobooth</h1>
        <p>Take photos and discover their color palettes using agglomerative clustering</p>
        {hoveredPalette && hoveredPalette.length > 0 && (
          <p className="color-indicator">
            Color {currentColorIndex + 1} of {hoveredPalette.length}
          </p>
        )}
      </header>

      <main className="app-main">
        <div className="controls-section">
          <button
            onClick={toggleCamera}
            className={`btn-toggle-camera ${isCameraActive ? "active" : ""}`}
          >
            {isCameraActive ? "Stop Camera" : "Start Camera"}
          </button>
          {isProcessing && (
            <div className="processing-indicator">
              Processing color palette...
            </div>
          )}
        </div>

        {isCameraActive && (
          <Camera onCapture={handleCapture} isActive={isCameraActive} />
        )}

        {photos.length > 0 && (
          <PhotoStrip
            photos={photos}
            onRemovePhoto={handleRemovePhoto}
            onClearAll={handleClearAll}
            onPhotoHover={setHoveredPalette}
          />
        )}

        {photos.length === 0 && !isCameraActive && (
          <div className="welcome-message">
            <p>click "start camera" to begin taking photos!</p>
            <p className="hint">each photo will be analyzed to extract its dominant color palette.</p>
          </div>
        )}
      </main>
    </div>
  );
}

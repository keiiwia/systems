import { useState, useRef, useEffect } from "react";

function PhotoStrip({ photos, onClearAll, onPhotoHover, clusteringMethod }) {

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [paletteHeight, setPaletteHeight] = useState('auto');
  const photoStripRef = useRef(null);

  // make sure the color palette matches the height of the photo strip
  useEffect(() => {
    if (photoStripRef.current) {
      setPaletteHeight(photoStripRef.current.offsetHeight + 'px');
    }
  }, [photos, clusteringMethod]);

  const getDateString = () => {
    const photoDate = new Date(photos[0].timestamp);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${months[photoDate.getMonth()]} ${photoDate.getDate()}, ${photoDate.getFullYear()}`;
  };

  // grab the right palette depending on which method is selected
  const getPalette = (photo) => {
    if (photo.palettes) {
      // new photos have both palettes stored, just pick the one we want
      return photo.palettes[clusteringMethod] || photo.palettes.agglomerative;
    } else if (photo.palette) {
      // old photos only have one palette, so use that
      return photo.palette;
    }
    return null;
  };

  const handlePhotoEnter = (photo, index) => {
    setHoveredIndex(index);
    const palette = getPalette(photo);
    if (palette && palette.length > 0) {
      onPhotoHover(palette);
    }
  };

  const handlePhotoLeave = () => {
    setHoveredIndex(null);
    onPhotoHover(null);
  };

  // if you're hovering over a photo and switch methods, update the palette
  useEffect(() => {
    if (hoveredIndex !== null && photos[hoveredIndex]) {
      const palette = getPalette(photos[hoveredIndex]);
      if (palette && palette.length > 0) {
        onPhotoHover(palette);
      }
    }
  }, [clusteringMethod, hoveredIndex, photos]);

  return (
    <div className="photo-strip-container">
      <div className="photo-strip-wrapper">
        <div className="photo-strip" ref={photoStripRef}>
          {photos.map((photo, index) => (
            <div 
              key={index} 
              className="photo-strip-item"
              onMouseEnter={() => handlePhotoEnter(photo, index)}
              onMouseLeave={handlePhotoLeave}
            >
              <div className="photo-wrapper">
                <img src={photo.imageUrl} alt={`Photo ${index + 1}`} />
              </div>
            </div>
          ))}
          <div className="photo-strip-date">{getDateString()}</div>
        </div>
        {hoveredIndex !== null && (() => {
          const palette = getPalette(photos[hoveredIndex]);
          if (!palette || palette.length === 0) return null;
          
          return (
            <div className="color-palette-container" style={{ height: paletteHeight }}>
              <div className="color-palette-side">
                {palette.map((color, colorIndex) => {
                  // use rgb directly so the colors show up exactly right
                  const rgbString = `rgb(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]})`;
                  return (
                    <div
                      key={colorIndex}
                      className="palette-color-swatch"
                      style={{ backgroundColor: rgbString }}
                    >
                      <span className={`color-label ${color.isLight ? "light" : "dark"}`}>
                        {color.hex}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
      <button onClick={onClearAll} className="btn-clear">
        Clear All
      </button>
    </div>
  );
}

export default PhotoStrip;


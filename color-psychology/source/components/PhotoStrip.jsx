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

  // create and download an image for each photo with its color swatches
  const handleDownloadPhotostrips = async () => {
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const palette = getPalette(photo);
      
      if (!palette || palette.length === 0) continue;

      // load the photo image
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = photo.imageUrl;
      });

      // set up canvas dimensions
      // photo on left, swatches on right
      const photoWidth = Math.min(img.width, 800); // max photo width
      const photoHeight = Math.min(img.height, 1200); // max photo height
      const scale = Math.min(photoWidth / img.width, photoHeight / img.height);
      const scaledPhotoWidth = img.width * scale;
      const scaledPhotoHeight = img.height * scale;
      
      const swatchWidth = 150; // width of color swatch column
      const swatchHeight = scaledPhotoHeight / palette.length; // each swatch gets equal height
      const padding = 20;
      
      const canvas = document.createElement('canvas');
      canvas.width = scaledPhotoWidth + swatchWidth + padding * 3;
      canvas.height = scaledPhotoHeight + padding * 2;
      const ctx = canvas.getContext('2d');

      // background
      ctx.fillStyle = '#FAF5E6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // draw photo
      ctx.drawImage(img, padding, padding, scaledPhotoWidth, scaledPhotoHeight);

      // draw color swatches
      const swatchX = scaledPhotoWidth + padding * 2;
      palette.forEach((color, index) => {
        const swatchY = padding + (swatchHeight * index);
        const rgbString = `rgb(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]})`;
        
        // draw swatch
        ctx.fillStyle = rgbString;
        ctx.fillRect(swatchX, swatchY, swatchWidth, swatchHeight);
        
        // draw hex label
        ctx.fillStyle = color.isLight ? '#000000' : '#FFFFFF';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          color.hex,
          swatchX + swatchWidth / 2,
          swatchY + swatchHeight / 2
        );
      });

      // download the image
      await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `photostrip-${i + 1}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          // small delay between downloads to avoid browser blocking
          setTimeout(resolve, 100);
        }, 'image/png');
      });
    }
  };

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
      <div className="photo-strip-actions">
        <button onClick={handleDownloadPhotostrips} className="btn-download">
          Download Photostrips
        </button>
        <button onClick={onClearAll} className="btn-clear">
          Clear All
        </button>
      </div>
    </div>
  );
}

export default PhotoStrip;


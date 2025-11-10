
function PhotoStrip({ photos, onRemovePhoto, onClearAll, onPhotoHover }) {
  if (photos.length === 0) {
    return null;
  }

  const handlePhotoEnter = (photo) => {
    if (photo.palette && photo.palette.length > 0) {
      // pass the entire palette array to cycle through all colors
      onPhotoHover(photo.palette);
    }
  };

  const handlePhotoLeave = () => {
    onPhotoHover(null);
  };

  return (
    <div className="photo-strip-container">
      <div className="photo-strip-header">
        <h2>Your Photobooth Strip</h2>
        <button onClick={onClearAll} className="btn-clear">
          Clear All
        </button>
      </div>
      <div className="photo-strip">
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className="photo-strip-item"
            onMouseEnter={() => handlePhotoEnter(photo)}
            onMouseLeave={handlePhotoLeave}
          >
            <div className="photo-wrapper">
              <img src={photo.imageUrl} alt={`Photo ${index + 1}`} />
            </div>
            {photo.palette && (
              <div className="color-palette">
                <h3>Color Palette</h3>
                <div className="palette-colors">
                  {photo.palette.map((color, colorIndex) => (
                    <div
                      key={colorIndex}
                      className="palette-color"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                    >
                      <span
                        className={`color-label ${
                          color.isLight ? "light" : "dark"
                        }`}
                      >
                        {color.hex}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => onRemovePhoto(index)}
              className="btn-remove"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PhotoStrip;


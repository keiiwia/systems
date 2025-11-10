// using agglomerative clustering to pull out the main colors from images
// basically groups similar colors together until we get a nice palette
// went with agglomerative instead of k-means because it avoids getting stuck in local minima

// figure out how far apart two colors are (tried a few different ways, euclidean ended up being the simplest)
function colorDistance(color1, color2) {
  const r = color1[0] - color2[0];
  const g = color1[1] - color2[1];
  const b = color1[2] - color2[2];
  return Math.sqrt(r * r + g * g + b * b);
}

// average out all the colors in a cluster to get the center color
function averageColor(colors) {
  if (colors.length === 0) return [0, 0, 0];
  
  const sum = colors.reduce(
    (acc, color) => [
      acc[0] + color[0],
      acc[1] + color[1],
      acc[2] + color[2],
    ],
    [0, 0, 0]
  );
  
  return [
    Math.round(sum[0] / colors.length),
    Math.round(sum[1] / colors.length),
    Math.round(sum[2] / colors.length),
  ];
}

// pull out the main colors from an image using agglomerative clustering
export function extractColorPalette(imageData, numColors = 5, sampleSize = 1000) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // grab a sample of pixels from the image (don't need every single one)
  const pixels = [];
  const step = Math.max(1, Math.floor((width * height) / sampleSize));
  
  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // ignore pixels that are too transparent
    if (data[i + 3] > 128) {
      pixels.push([r, g, b]);
    }
  }
  
  if (pixels.length === 0) {
    return [[255, 255, 255], [0, 0, 0], [128, 128, 128], [200, 200, 200], [50, 50, 50]];
  }
  
  // start with each pixel as its own cluster
  let clusters = pixels.map((pixel, index) => ({
    id: index,
    colors: [pixel],
    centroid: pixel,
  }));
  
  // keep merging the closest clusters together until we have the number we want
  while (clusters.length > numColors) {
    let minDistance = Infinity;
    let mergeIndex1 = -1;
    let mergeIndex2 = -1;
    
    // find which two clusters are closest to each other
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const distance = colorDistance(clusters[i].centroid, clusters[j].centroid);
        if (distance < minDistance) {
          minDistance = distance;
          mergeIndex1 = i;
          mergeIndex2 = j;
        }
      }
    }
    
    // combine those two clusters into one
    if (mergeIndex1 !== -1 && mergeIndex2 !== -1) {
      const mergedColors = [
        ...clusters[mergeIndex1].colors,
        ...clusters[mergeIndex2].colors,
      ];
      const newCentroid = averageColor(mergedColors);
      
      clusters[mergeIndex1] = {
        id: clusters[mergeIndex1].id,
        colors: mergedColors,
        centroid: newCentroid,
      };
      
      clusters.splice(mergeIndex2, 1);
    } else {
      break;
    }
  }
  
  // get the center color from each cluster and sort by brightness
  const palette = clusters
    .map((cluster) => cluster.centroid)
    .sort((a, b) => {
      // sort by how bright the color looks to our eyes
      const lumA = 0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2];
      const lumB = 0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2];
      return lumB - lumA;
    });
  
  return palette;
}

// turn an rgb array like [255, 0, 128] into a hex string like "#ff0080"
export function rgbToHex(rgb) {
  return `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

// figure out if a color is light or dark (so we know what color text to use on it)
export function isLightColor(rgb) {
  const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return luminance > 128;
}


/**
 * agglomerative clustering for color extraction
 * groups similar colors together to create a representative palette
 * agglomerative over kmeans to avoid local minima
 */

/**
 * calculate euclidean distance between two rgb colors; tried with manhattan dist, cosine dist, ultimately ended with euclidean (easiuest)
 */
function colorDistance(color1, color2) {
  const r = color1[0] - color2[0];
  const g = color1[1] - color2[1];
  const b = color1[2] - color2[2];
  return Math.sqrt(r * r + g * g + b * b);
}

/**
 * calculate average color of a cluster
 */
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

/**
 * extract dominant colors from an image using agglomerative clustering
 * @param {ImageData} imageData - the image data to analyze
 * @param {number} numColors - number of colors to extract (default: 5)
 * @param {number} sampleSize - number of pixels to sample (default: 1000)
 * @returns {Array<Array<number>>} array of rgb color arrays
 */
export function extractColorPalette(imageData, numColors = 5, sampleSize = 1000) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // sample pixels from the image
  const pixels = [];
  const step = Math.max(1, Math.floor((width * height) / sampleSize));
  
  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // skip very transparent pixels
    if (data[i + 3] > 128) {
      pixels.push([r, g, b]);
    }
  }
  
  if (pixels.length === 0) {
    return [[255, 255, 255], [0, 0, 0], [128, 128, 128], [200, 200, 200], [50, 50, 50]];
  }
  
  // initialize clusters - each pixel starts as its own cluster
  let clusters = pixels.map((pixel, index) => ({
    id: index,
    colors: [pixel],
    centroid: pixel,
  }));
  
  // agglomerative clustering: merge closest clusters until we have numColors
  while (clusters.length > numColors) {
    let minDistance = Infinity;
    let mergeIndex1 = -1;
    let mergeIndex2 = -1;
    
    // find the two closest clusters
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
    
    // merge the two closest clusters
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
  
  // extract centroids and sort by luminance (brightness)
  const palette = clusters
    .map((cluster) => cluster.centroid)
    .sort((a, b) => {
      // sort by perceived luminance
      const lumA = 0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2];
      const lumB = 0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2];
      return lumB - lumA;
    });
  
  return palette;
}

/**
 * convert rgb array to hex string
 */
export function rgbToHex(rgb) {
  return `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * check if a color is light or dark (for text contrast)
 */
export function isLightColor(rgb) {
  const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return luminance > 128;
}


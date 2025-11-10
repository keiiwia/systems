// using k-means clustering to find the main colors in images
// groups similar colors together to make a palette

// euclidean dist
function colorDistance(color1, color2) {
  const r = color1[0] - color2[0];
  const g = color1[1] - color2[1];
  const b = color1[2] - color2[2];
  return Math.sqrt(r * r + g * g + b * b);
}

// average out all the colors in a cluster to get the center point
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

// pick some random starting points for the clusters
// k-means can get stuck sometimes, but random starts give us more variety
function initializeCentroids(pixels, k) {
  const centroids = [];
  const usedIndices = new Set();
  
  // grab k random pixels to start with
  while (centroids.length < k && usedIndices.size < pixels.length) {
    const randomIndex = Math.floor(Math.random() * pixels.length);
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      centroids.push([...pixels[randomIndex]]);
    }
  }
  
  // if != enough colors just make up some random colors
  while (centroids.length < k) {
    centroids.push([
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256)
    ]);
  }
  
  return centroids;
}

// pull out the main colors using k-means clustering
export function extractColorPalette(imageData, numColors = 5, sampleSize = 1000, maxIterations = 30) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // sample some pixels from the image
  const pixels = [];
  const step = Math.max(1, Math.floor((width * height) / sampleSize));
  
  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // skip pixels that are too see-through
    if (data[i + 3] > 128) {
      pixels.push([r, g, b]);
    }
  }
  
  if (pixels.length === 0) {
    return [[255, 255, 255], [0, 0, 0], [128, 128, 128], [200, 200, 200], [50, 50, 50]];
  }
  
  // pick some random starting points
  let centroids = initializeCentroids(pixels, numColors);
  // keep iterating until things settle down
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // put each pixel into the cluster with the closest center
    const clusters = Array(numColors).fill(null).map(() => []);
    
    pixels.forEach(pixel => {
      let minDistance = Infinity;
      let closestCentroid = 0;
      
      centroids.forEach((centroid, index) => {
        const distance = colorDistance(pixel, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroid = index;
        }
      });
      
      clusters[closestCentroid].push(pixel);
    });
    
    // move the cluster centers to the average of their pixels
    let converged = true;
    const newCentroids = clusters.map((cluster, index) => {
      if (cluster.length === 0) {
        // empty cluster? just keep the old center
        return centroids[index];
      }
      const newCentroid = averageColor(cluster);
      
      //if center moves
      if (colorDistance(newCentroid, centroids[index]) > 1) {
        converged = false;
      }
      
      return newCentroid;
    });
    
    centroids = newCentroids;
    
    // if nothing moves
    if (converged) break;
  }

  // sort by brightness
  const palette = centroids
    .sort((a, b) => {
      //luminosity
      const lumA = 0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2];
      const lumB = 0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2];
      return lumB - lumA;
    });
  
  return palette;
}

export function rgbToHex(rgb) {
  return `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

//color of text
export function isLightColor(rgb) {
  const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return luminance > 128;
}


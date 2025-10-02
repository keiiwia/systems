// get all data from json 
//async to load all json first whoops i keep forgetting to do this
export async function loadJSONFile(filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`Could not load ${filePath}:`, error);
    return null;
  }
}

export function getCategoryFiles(category) {
  const knownFiles = {
    design: ['design.json', 'bookandmagazinedesign.json', 'japanesegraphicdesign.json', 'logoandidentitydesign.json', 'productdesign.json'],
    fashion: ['asianfashion.json', 'dress.json', 'streetfashion.json', 'womensfashion.json'],
    food: ['cake.json', 'desserts.json', 'fooddisplay.json'],
    illustration: ['characterillustration.json', 'conceptartdrawing.json', 'digitalillustration.json', 'gesturedrawing.json'],
    photography: ['candidphotography.json', 'experimentalphotography.json', 'filmphotography.json', 'streetphotography.json']
  };
  return knownFiles[category] || [];
}

export async function loadAllImages(currentDataType) {
  const dataPath = currentDataType === 'algorithmic' 
    ? 'jsonfiles/algorithmic' 
    : 'jsonfiles/personal';

  const categories = ['design', 'fashion', 'food', 'illustration', 'photography'];
  const allImages = [];

  for (const category of categories) {
    try {
      const files = getCategoryFiles(category);
      for (const file of files) {
        const filePath = `${dataPath}/${category}/${file}`;
        const images = await loadJSONFile(filePath);
        if (images && Array.isArray(images)) {
          images.forEach(image => {
            if (image['images.orig.url']) {
              allImages.push({
                ...image,
                category,
                subcategory: file.replace('.json', ''),
                url: image['images.orig.url']
              });
            }
          });
        }
      }
    } catch (error) {
      console.warn(`cannot load category ${category}:`, error);
    }
  }

  return allImages;
}



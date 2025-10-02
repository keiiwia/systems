import { loadAllImages } from './data.js';
import { centerImage, randomPosAndStyle, calcOpacity, calcOpacityStable } from './visuals.js';

class PinterestVisualization {
  constructor() {
    this.currentDataType = 'algorithmic';
    this.currentCategory = 'design';
    this.allImages = [];
    this.displayedImages = [];
    this.isAnimating = false;
    this.count = 0;
    this.canvas = document.getElementById('canvas');
    this.centerMode = false;
    this.fadeTimers = new Set();

    this.initializeEventListeners();
    this.loadData();
  }

  initializeEventListeners() {
    document.getElementById('algorithmic-btn').addEventListener('click', () => {
      this.switchDataType('algorithmic');
      this.setTypeActive('algorithmic');
    });
    document.getElementById('personal-btn').addEventListener('click', () => {
      this.switchDataType('personal');
      this.setTypeActive('personal');
    });
    // dropdown removed; section clicks handle category selection
    document.getElementById('start-btn').addEventListener('click', () => {
      this.startAnimation();
    });
    document.getElementById('reset-btn').addEventListener('click', () => {
      this.resetAnimation();
    });
    document.getElementById('center-toggle').addEventListener('change', (e) => {
      this.centerMode = e.target.checked;
      if (this.canvas.children.length > 0) {
        this.repositionAllImages();
      }
    });

    // Clickable section list on the right
    const sectionList = document.querySelector('.sections');
    if (sectionList) {
      sectionList.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-cat]');
        if (!li) return;
        const cat = li.getAttribute('data-cat');
        this.currentCategory = cat;
        // set visual active on list
        Array.from(sectionList.querySelectorAll('li')).forEach(n => n.classList.remove('active'));
        li.classList.add('active');
        this.filterAndDisplayImages();
      });
    }
  }

  async loadData() {
    try {
      this.allImages = await loadAllImages(this.currentDataType);
      this.filterAndDisplayImages();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  switchDataType(dataType) {
    if (dataType === this.currentDataType) return;
    this.currentDataType = dataType;
    this.loadData();
  }

  setTypeActive(type) {
    const alg = document.getElementById('algorithmic-btn');
    const per = document.getElementById('personal-btn');
    alg.classList.toggle('active', type === 'algorithmic');
    per.classList.toggle('active', type === 'personal');
  }

  filterAndDisplayImages() {
    this.displayedImages = this.allImages.filter(img => img.category === this.currentCategory);
    this.resetAnimation();
  }

  resetAnimation() {
    this.isAnimating = false;
    this.count = 0;
    this.fadeTimers.forEach(t => clearTimeout(t));
    this.fadeTimers.clear();
    this.canvas.innerHTML = '';
  }

  startAnimation() {
    if (this.isAnimating) return;
    // Ensure displayedImages respects currentCategory
    if (!this.displayedImages || this.displayedImages.length === 0) {
      this.filterAndDisplayImages();
    }
    this.isAnimating = true;
    this.count = 0;
    this.canvas.innerHTML = '';
    this.addNext();
  }

  addNext() {
    if (this.centerMode) {
      if (!this.shouldAddNewImage()) {
        if (this.isAnimating) setTimeout(() => this.addNext(), 1000);
        return;
      }
      const imageIndex = this.count % this.displayedImages.length;
      const image = this.displayedImages[imageIndex];
      const img = document.createElement('img');
      img.src = image.url;
      img.alt = image.description || 'Pinterest image';
      img.onerror = () => {
        this.count++;
        if (this.isAnimating) setTimeout(() => this.addNext(), 300);
      };
      img.onload = () => {
        this.canvas.appendChild(img);
        this.count++;
        this.positionImage(img);
        this.updateOpacity();
        if (this.isAnimating) setTimeout(() => this.addNext(), 300);
      };
    } else {
      if (this.count >= this.displayedImages.length || !this.isAnimating) {
        this.isAnimating = false;
        return;
      }
      const image = this.displayedImages[this.count];
      const img = document.createElement('img');
      img.src = image.url;
      img.alt = image.description || 'Pinterest image';
      img.onerror = () => {
        this.count++;
        if (this.count < this.displayedImages.length && this.isAnimating) setTimeout(() => this.addNext(), 300);
        else this.isAnimating = false;
      };
      img.onload = () => {
        this.canvas.appendChild(img);
        this.count++;
        this.positionImage(img);
        this.updateOpacity();
        if (this.count < this.displayedImages.length && this.isAnimating) setTimeout(() => this.addNext(), 300);
        else this.isAnimating = false;
      };
    }
  }

  positionImage(img) {
    if (this.centerMode) {
      centerImage(img);
      this.scheduleFadeAway(img);
    } else {
      randomPosAndStyle(img);
    }
  }

  scheduleFadeAway(img) {
    const fadeDelay = 2000 + Math.random() * 6000;
    const timer = setTimeout(() => {
      if (img.parentNode) this.fadeAwayImage(img);
      this.fadeTimers.delete(timer);
    }, fadeDelay);
    this.fadeTimers.add(timer);
  }

  fadeAwayImage(img) {
    const fadeDuration = 3000 + Math.random() * 3000;
    img.style.transition = `opacity ${fadeDuration}ms ease-out`;
    img.style.opacity = '0';
    setTimeout(() => {
      if (img.parentNode) {
        img.parentNode.removeChild(img);
        this.updateOpacity();
      }
    }, fadeDuration);
  }

  shouldAddNewImage() {
    if (!this.centerMode) return true;
    const currentImageCount = this.canvas.querySelectorAll('img').length;
    return currentImageCount < this.displayedImages.length;
  }

  repositionAllImages() {
    const images = this.canvas.querySelectorAll('img');
    images.forEach(img => {
      img.style.transition = '';
      this.positionImage(img);
    });
  }

  updateOpacity() {
    const remainingImages = this.canvas.querySelectorAll('img').length;
    if (this.centerMode) {
      const baseOpacity = calcOpacityStable(remainingImages, this.displayedImages.length);
      this.canvas.querySelectorAll('img').forEach(el => {
        if (el.style.transition === '' || !el.style.transition.includes('opacity')) {
          el.style.opacity = baseOpacity;
        }
      });
    } else {
      const a = calcOpacity(remainingImages);
      this.canvas.querySelectorAll('img').forEach(el => {
        if (el.style.transition === '' || !el.style.transition.includes('opacity')) {
          el.style.opacity = a;
        }
      });
    }
  }

  // loading overlay removed
}

document.addEventListener('DOMContentLoaded', () => {
  new PinterestVisualization();
});



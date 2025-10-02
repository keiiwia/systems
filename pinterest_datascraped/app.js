import { loadAllImages } from './data.js';
import { centerImage, randomPosAndStyle, calcOpacity } from './visuals.js';

class PinterestVisualization {
  constructor() {
    this.currentDataType = 'algorithmic';
    this.currentCategory = 'design';
    this.allImages = [];
    this.displayedImages = [];
    this.isAnimating = false;
    this.count = 0; // index 0
    this.canvas = document.getElementById('canvas');
    this.centerMode = false; 
    this.fadeTimers = new Set();

    this.initializeEventListeners();
    this.loadData();
  }
  //ui
  initializeEventListeners() {
    document.getElementById('algorithmic-btn').addEventListener('click', () => this.switchDataType('algorithmic'));
    document.getElementById('personal-btn').addEventListener('click', () => this.switchDataType('personal'));
    document.getElementById('start-btn').addEventListener('click', () => this.startAnimation());
    document.getElementById('reset-btn').addEventListener('click', () => this.resetAnimation());
    document.getElementById('center-toggle').addEventListener('change', (e) => {
      this.centerMode = e.target.checked;
      if (this.canvas.children.length > 0) this.repositionAllImages();
    });

    const sectionList = document.querySelector('.sections');
    if (sectionList) {
      sectionList.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-cat]');
        if (!li) return;
        this.currentCategory = li.getAttribute('data-cat');
        Array.from(sectionList.querySelectorAll('li')).forEach(item => item.classList.remove('active'));
        li.classList.add('active');
        this.filterAndDisplayImages();
      });
    }
  }

  //async again
  async loadData() {
    try {
      this.allImages = await loadAllImages(this.currentDataType);
      this.filterAndDisplayImages();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  //dpending on which button is toggled
  switchDataType(dataType) {
    if (dataType === this.currentDataType) return;
    this.currentDataType = dataType;
    document.getElementById('algorithmic-btn').classList.toggle('active', dataType === 'algorithmic');
    document.getElementById('personal-btn').classList.toggle('active', dataType === 'personal');
    this.loadData();
  }

  filterAndDisplayImages() {
    this.displayedImages = this.allImages.filter(img => img.category === this.currentCategory);
    this.resetAnimation();
  }
  resetAnimation() {
    this.isAnimating = false;
    this.count = 0;
    this.fadeTimers.forEach(timer => clearTimeout(timer));
    this.fadeTimers.clear();
    this.canvas.innerHTML = '';
  }
  startAnimation() {
    if (this.isAnimating) return;
    if (!this.displayedImages?.length) this.filterAndDisplayImages();
    this.isAnimating = true;
    this.count = 0;
    this.canvas.innerHTML = '';
    this.addNext();
  }


  addNext() {
    if (!this.isAnimating) return;
    
    if (this.centerMode && this.canvas.querySelectorAll('img').length >= this.displayedImages.length) {
      setTimeout(() => this.addNext(), 1000);
      return;
    }
    
    if (!this.centerMode && this.count >= this.displayedImages.length) {
      this.isAnimating = false;
      return;
    }
    
    const imageIndex = this.centerMode ? this.count % this.displayedImages.length : this.count;
    const image = this.displayedImages[imageIndex];
    const img = document.createElement('img');
    img.src = image.url;
    img.alt = image.description || 'Pinterest image';
    
    const continueAnimation = () => {
      if (this.isAnimating && (this.centerMode || this.count < this.displayedImages.length)) {
        setTimeout(() => this.addNext(), 300);
      } else {
        this.isAnimating = false;
      }
    };
    
    img.onerror = () => {
      this.count++;
      continueAnimation();
    };
    
    img.onload = () => {
      this.canvas.appendChild(img);
      this.count++;
      this.positionImage(img);
      this.updateOpacity();
      continueAnimation();
    };
  }

  // if center vs rand
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
      if (img.parentNode) {
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
      this.fadeTimers.delete(timer);
    }, fadeDelay);
    this.fadeTimers.add(timer);
  }

  //rand position again
  repositionAllImages() {
    this.canvas.querySelectorAll('img').forEach(img => {
      img.style.transition = '';
      this.positionImage(img);
    });
  }

  updateOpacity() {
    const images = this.canvas.querySelectorAll('img');
    const opacity = this.centerMode 
      ? calcOpacity(images.length, this.displayedImages.length)
      : calcOpacity(images.length);
    
    images.forEach(img => {
      if (!img.style.transition || !img.style.transition.includes('opacity')) {
        img.style.opacity = opacity;
      }
    });
  }

}

//initialize when page loads 
document.addEventListener('DOMContentLoaded', () => {
  new PinterestVisualization();
});

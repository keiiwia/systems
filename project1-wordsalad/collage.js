
//load manifest first--AI told me that bc my fetch was previously occuring further down, my collage.js was trying to use manifest before it was even defined, so move it up to the top before anything else runs
//this stupid error code kept showing up lol
fetch('images_manifest.json')
  .then(res => res.json())
  .then(MANIFEST => {

    // get the words from localstor
    const picked = JSON.parse(localStorage.getItem('selectedWords') || '[]');
    if (!Array.isArray(picked) || picked.length !== 3) {
      window.location.href = 'index.html'; // redirect if no words
      return;
    }

    // sample images from each word
    const perWord = 4; // # of img per word
    function sample(arr, n) {
      const out = [];
      for (let i = 0; i < n; i++) {
        out.push(arr[Math.floor(Math.random() * arr.length)]);
      }
      return out;
    }

    const chosenImages = picked.flatMap(w => sample(MANIFEST[w] || [], perWord));

    //rand img place
    const container = document.querySelector('.randomizingimgs');
    container.style.position = '100vh'; //fix this
    container.style.height = '100vh';

    const rint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    chosenImages.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.style.position = 'absolute';
      img.style.width = rint(12, 50) + 'vw';
      img.style.transform = `rotate(${rint(-20, 20)}deg)`;

      img.addEventListener('load', () => {
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const w = img.getBoundingClientRect().width;
        const h = img.getBoundingClientRect().height;

        img.style.left = Math.max(0, Math.random() * (cw - w)) + 'px';
        img.style.top  = Math.max(0, Math.random() * (ch - h)) + 'px';
      });

      container.appendChild(img);
    });
  })
  .catch(err => {
    console.error('Error loading manifest:', err);
  });

(async function(){ //debugged with ai, loading the fonts wasn't working so i needed to async first
  
  /* PREP STUFF */
    const terms = ["green","blue","RED","Orange","death","pipes","forest","poet","lily","seeking","dog","news"];

  // 1) Wait for fonts to be ready BEFORE making/placing words
  const families = ["Lobster","Roboto Mono","Pacifico","Playfair Display","Orbitron"];
  // Ask the browser to load at least one face from each family (normal 400, 1em)
  await Promise.all(families.map(f => document.fonts.load(`400 1em "${f}"`)));
  // Also wait for all faces declared on the page
  await document.fonts.ready;

  // font arr
  const fonts = [
    "'Bellefair', serif",
  "'Big Shoulders', sans-serif",
  "'Jacquard 24', system-ui",
  "'Lacquer', system-ui"
  ];
  
  const MAX_SELECT = 3;
  const palette = ["#e74c3c", "#2ecc71", "#3498db"]; 
  let available = [0,1,2]; // amt of color indices available

  /* START FUNCTIONS */

  function updateCursorState() {
  const words = document.querySelectorAll('.w');
  const atLimit = available.length === 0;
  words.forEach(w => {
    if (!w.dataset.pick) {
      // if unselected, disable only when we're at the limit
      if (atLimit) {
        w.classList.add("disabled");
      } else {
        w.classList.remove("disabled");
      }
    }
  });
}

  function makeWord(t) {
    const el = document.createElement('span');
    el.className = 'w';
    el.textContent = t;
    
    //change style/font size
    const size = Math.floor(Math.random()*120) + 20; //font size btw 20 and 120px
    el.style.fontSize   = size + 'px';
    el.style.fontFamily = fonts[Math.floor(Math.random()*fonts.length)]; //change font fam
    


    //selection
    el.addEventListener('click', () => {
        const has = el.dataset.pick !== undefined;

        if (has) {
            // deselect: free its color
            const idx = +el.dataset.pick;
            el.style.color = "";          // remove color
            delete el.dataset.pick;
            // put color index back (keep list sorted)
            if (!available.includes(idx)) {
            available.push(idx);
            available.sort();
            }
        } else {
            // select: only if we still have colors
            if (available.length === 0) return; // already 3 selected
            const idx = available.shift();      // take next free color
            el.dataset.pick = String(idx);
            el.style.color = palette[idx];

            updateCursorState();
        }
  });
    
    return el;
  }


  const rows = [r1, r2, r3];

  // measure and balance the words into each row (3)
  terms.map(makeWord).forEach(el => {
    // measure width to be used for overflow
    document.body.appendChild(el);
    const w = el.getBoundingClientRect().width; //provide actual width px on screen
    el.remove(); //made temporary

    //find the current row width, using the width of each word, check if you can put the word in the row; else: move to next row
    const widths = rows.map(r => +r.dataset.w || 0); //track current row wdith
    const i = widths.indexOf(Math.min(...widths)); 
    rows[i].appendChild(el);
    rows[i].dataset.w = (widths[i] + w).toString();
  });
})();


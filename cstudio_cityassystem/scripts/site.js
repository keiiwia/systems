let SITE_DATA = null;
let DEFAULT_TITLE = '';
let DEFAULT_SUBTITLE = '';
let DEFAULT_DESC = '';

async function initYearDropdown() {
    try {
        const res = await fetch('json/information.json');
        SITE_DATA = await res.json();
        let years = Object.keys(SITE_DATA.annual_totals || {}).sort();
        years = years.filter(y => y !== '2017');
        if (!years.length) return;

        let select = document.getElementById('year-select');
        if (!select) {
            select = document.createElement('select');
            select.id = 'year-select';
            select.className = 'year-select';
            document.body.appendChild(select);
        }
        select.innerHTML = '';
        for (const y of years) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            select.appendChild(opt);
        }
        select.value = years[years.length - 1];
        select.style.display = 'block';
        select.addEventListener('change', () => {
            // refresh info if needed
        });
        setupHoverSampling();

        // cache defaults for restoring when hover ends
        const titleEl = document.querySelector('.site-title');
        const subEl = document.querySelector('.site-subtitle');
        const descEl = document.querySelector('.site-desc');
        if (titleEl) DEFAULT_TITLE = titleEl.textContent;
        if (subEl) DEFAULT_SUBTITLE = subEl.textContent;
        if (descEl) DEFAULT_DESC = descEl.innerHTML;
    } catch (err) {
        console.error('Year dropdown init failed', err);
    }
}

function initViewButtons() {
    let container = document.getElementById('view-fabs');
    if (!container) {
        container = document.createElement('div');
        container.id = 'view-fabs';
        container.className = 'view-fabs';
        document.body.appendChild(container);
    }
    container.innerHTML = '';
    const labels = ['My Bedroom', 'Pedestrian View', 'Satellite View'];
    labels.forEach((label, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-text' + (idx === 0 ? ' is-active' : '');
        if (idx === 0) btn.setAttribute('aria-pressed', 'true');
        btn.textContent = label;
        container.appendChild(btn);
    });
    container.style.display = 'flex';
}

// Hover-based info from industry layer (pink)
let offscreenCanvas, offscreenCtx, industryImg, canvasRect;
let consumerCanvas, consumerCtx, consumerImg;
let foodCanvas, foodCtx, foodImg;

function setupHoverSampling() {
    const view = document.querySelector('.view-canvas');
    if (!view) return;
    industryImg = new Image();
    industryImg.src = 'assets/bedroom-view/industry-layer.png';
    industryImg.crossOrigin = 'anonymous';
    industryImg.onload = () => {
        offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = industryImg.naturalWidth;
        offscreenCanvas.height = industryImg.naturalHeight;
        offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCtx.drawImage(industryImg, 0, 0);
        // Load consumer (blue) layer as well
        consumerImg = new Image();
        consumerImg.src = 'assets/bedroom-view/consumer-ecommerce-layer.png';
        consumerImg.crossOrigin = 'anonymous';
        consumerImg.onload = () => {
            consumerCanvas = document.createElement('canvas');
            consumerCanvas.width = consumerImg.naturalWidth;
            consumerCanvas.height = consumerImg.naturalHeight;
            consumerCtx = consumerCanvas.getContext('2d');
            consumerCtx.drawImage(consumerImg, 0, 0);
        };

        // Load food/agriculture (green) layer
        foodImg = new Image();
        foodImg.src = 'assets/bedroom-view/food-agriculture-layer.png';
        foodImg.crossOrigin = 'anonymous';
        foodImg.onload = () => {
            foodCanvas = document.createElement('canvas');
            foodCanvas.width = foodImg.naturalWidth;
            foodCanvas.height = foodImg.naturalHeight;
            foodCtx = foodCanvas.getContext('2d');
            foodCtx.drawImage(foodImg, 0, 0);
        };

        const viewEl = document.querySelector('.view-canvas');
        canvasRect = viewEl.getBoundingClientRect();
        viewEl.addEventListener('mousemove', onHoverView);
        viewEl.addEventListener('mouseleave', clearHoverInfo);
        window.addEventListener('resize', () => { canvasRect = viewEl.getBoundingClientRect(); });
    };
}

function onHoverView(e) {
    if (!offscreenCtx || !canvasRect) return;
    // Prefer offsetX/Y for robust mapping even with transforms
    const target = e.currentTarget;
    const relX = (e.offsetX) / target.clientWidth;
    const relY = (e.offsetY) / target.clientHeight;
    if (relX < 0 || relX > 1 || relY < 0 || relY > 1) { clearHoverInfo(); return; }
    const imgX = Math.floor(relX * offscreenCanvas.width);
    const imgY = Math.floor(relY * offscreenCanvas.height);
    const p = offscreenCtx.getImageData(imgX, imgY, 1, 1).data;
    const isPink = p[3] > 5 && (p[0] - p[1] > 40) && (p[2] - p[1] > 20) && (p[0] + p[2] > 360);

    let isBlue = false;
    if (consumerCtx) {
        const b = consumerCtx.getImageData(imgX, imgY, 1, 1).data;
        // Looser blue detection: blue dominant over red/green
        isBlue = b[3] > 5 && b[2] > 100 && (b[2] - b[1] > 25) && (b[2] - b[0] > 25);
    }

    let isGreen = false;
    if (foodCtx) {
        const g = foodCtx.getImageData(imgX, imgY, 1, 1).data;
        // green-ish threshold: green dominant over red/blue
        isGreen = g[3] > 5 && g[1] > 100 && (g[1] - g[0] > 25) && (g[1] - g[2] > 25);
    }

    if ((isPink && isBlue) || (isPink && isGreen) || (isBlue && isGreen)) {
        // overlapping regions: show relevant combined info
        const cats = [];
        if (isPink) { cats.push('Industrial / Machinery', 'Construction & Raw Materials'); }
        if (isBlue) { cats.push('Consumer & E-commerce Goods'); }
        if (isGreen) { cats.push('Food & Agriculture'); }
        showCategoryInfo(cats);
    } else if (isPink) {
        showCategoryInfo(['Industrial / Machinery', 'Construction & Raw Materials']);
    } else if (isBlue) {
        showCategoryInfo(['Consumer & E-commerce Goods']);
    } else if (isGreen) {
        showCategoryInfo(['Food & Agriculture']);
    } else {
        clearHoverInfo();
    }
}

function showCategoryInfo(categoryNames) {
    const infoEl = document.getElementById('hover-info');
    const select = document.getElementById('year-select');
    if (!SITE_DATA || !select) return;
    const year = select.value;
    const lines = [];
    for (const name of categoryNames) {
        const cat = SITE_DATA.categories[name];
        if (!cat) continue;
        const y = (cat.years || {})[year];
        if (!y) continue;
        const importsTotal = (y.imports || []).reduce((s, r) => s + (r.teu || 0), 0);
        const exportsTotal = (y.exports || []).reduce((s, r) => s + (r.teu || 0), 0);
        lines.push(`${name}: imports ${importsTotal.toLocaleString()} TEU, exports ${exportsTotal.toLocaleString()} TEU`);
    }
    if (infoEl) infoEl.textContent = lines.join(' • ');

    // Populate heading/subtitle/desc
    const titleEl = document.querySelector('.site-title');
    const subEl = document.querySelector('.site-subtitle');
    const descEl = document.querySelector('.site-desc');
    if (titleEl) titleEl.textContent = categoryNames.join(' + ');
    if (subEl) subEl.textContent = `Year ${year}`;
    if (descEl) {
        // Build a short body with top 2 lines of summary
        const body = lines.map(l => `• ${l}`).join('<br>');
        descEl.innerHTML = body;
    }
}

function clearHoverInfo() {
    const infoEl = document.getElementById('hover-info');
    if (infoEl) infoEl.textContent = '';
    // Restore defaults
    const titleEl = document.querySelector('.site-title');
    const subEl = document.querySelector('.site-subtitle');
    const descEl = document.querySelector('.site-desc');
    if (titleEl && DEFAULT_TITLE) titleEl.textContent = DEFAULT_TITLE;
    if (subEl && DEFAULT_SUBTITLE) subEl.textContent = DEFAULT_SUBTITLE;
    if (descEl && DEFAULT_DESC) descEl.innerHTML = DEFAULT_DESC;
}



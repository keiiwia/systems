let SITE_DATA = null;
let DEFAULT_TITLE = '';
let DEFAULT_SUBTITLE = '';
let DEFAULT_DESC = '';
let CURRENT_VIEW = 'bedroom';

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
        select.addEventListener('change', () => {});
        setupHoverSampling();

    // cache defaults for restoring when hover ends
        const titleEl = document.querySelector('.site-title');
        const subEl = document.querySelector('.site-subtitle');
        const descEl = document.querySelector('.site-desc');
        if (titleEl) DEFAULT_TITLE = titleEl.textContent;
        if (subEl) DEFAULT_SUBTITLE = subEl.textContent;
        if (descEl) DEFAULT_DESC = descEl.innerHTML;
    } catch (err) {
        console.error('year dropdown init failed', err);
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
        btn.addEventListener('click', () => {
            [...container.querySelectorAll('button')].forEach(b => { b.classList.remove('is-active'); b.removeAttribute('aria-pressed'); });
            btn.classList.add('is-active'); btn.setAttribute('aria-pressed', 'true');
            if (idx === 0) switchView('bedroom');
            else if (idx === 1) switchView('pedestrian');
            else switchView('satellite');
        });
        container.appendChild(btn);
    });
    container.style.display = 'flex';
}

let offscreenCanvas, offscreenCtx, industryImg, canvasRect;
let consumerCanvas, consumerCtx, consumerImg;
let foodCanvas, foodCtx, foodImg;
let otherCanvas, otherCtx, otherImg;

function setupHoverSampling() {
    const view = document.querySelector('.view-canvas');
    if (!view) return;
    // reset previous contexts so stale layers from another view are not used
    offscreenCanvas = null; offscreenCtx = null; industryImg = null;
    consumerCanvas = null; consumerCtx = null; consumerImg = null;
    foodCanvas = null; foodCtx = null; foodImg = null;
    otherCanvas = null; otherCtx = null; otherImg = null;
    const base = CURRENT_VIEW === 'pedestrian' ? 'assets/pedestrian-view' : 'assets/bedroom-view';
    industryImg = new Image();
    industryImg.src = `${base}/industry-layer.png`;
    industryImg.crossOrigin = 'anonymous';
    industryImg.onload = () => {
        offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = industryImg.naturalWidth;
        offscreenCanvas.height = industryImg.naturalHeight;
        offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCtx.drawImage(industryImg, 0, 0);
        consumerImg = new Image();
        consumerImg.src = `${base}/consumer-ecommerce-layer.png`;
        consumerImg.crossOrigin = 'anonymous';
        consumerImg.onload = () => {
            consumerCanvas = document.createElement('canvas');
            consumerCanvas.width = consumerImg.naturalWidth;
            consumerCanvas.height = consumerImg.naturalHeight;
            consumerCtx = consumerCanvas.getContext('2d');
            consumerCtx.drawImage(consumerImg, 0, 0);
        };

        foodImg = new Image();
        foodImg.src = `${base}/food-agriculture-layer.png`;
        otherImg = new Image();
        otherImg.src = `${base}/other-misc-layer.png`;
        otherImg.crossOrigin = 'anonymous';
        otherImg.onload = () => {
            otherCanvas = document.createElement('canvas');
            otherCanvas.width = otherImg.naturalWidth;
            otherCanvas.height = otherImg.naturalHeight;
            otherCtx = otherCanvas.getContext('2d');
            otherCtx.drawImage(otherImg, 0, 0);
        };
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
        viewEl.addEventListener('wheel', proxySidebarScroll, { passive: false });
        let lastY = null;
        viewEl.addEventListener('touchstart', (te) => { if (te.touches && te.touches[0]) lastY = te.touches[0].clientY; }, { passive: true });
        viewEl.addEventListener('touchmove', (te) => {
            const sb = document.querySelector('.sidebar');
            if (!sb || !te.touches || !te.touches[0]) return;
            const y = te.touches[0].clientY;
            if (lastY != null) {
                sb.scrollTop += (lastY - y);
            }
            lastY = y;
        }, { passive: true });
        window.addEventListener('resize', () => { canvasRect = viewEl.getBoundingClientRect(); });
    };
}

function onHoverView(e) {
    if (!offscreenCtx || !canvasRect) return;
    // prefer offsetx/y for robust mapping even with transforms
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
        // looser blue detection: blue dominant over red/green
        isBlue = b[3] > 5 && b[2] > 100 && (b[2] - b[1] > 25) && (b[2] - b[0] > 25);
    }

    let isGreen = false;
    if (foodCtx) {
        const g = foodCtx.getImageData(imgX, imgY, 1, 1).data;
        // green-ish threshold: green dominant over red/blue
        isGreen = g[3] > 5 && g[1] > 100 && (g[1] - g[0] > 25) && (g[1] - g[2] > 25);
    }

    let isYellow = false;
    if (otherCtx) {
        const ypx = otherCtx.getImageData(imgX, imgY, 1, 1).data;
        isYellow = ypx[3] > 5 && (ypx[0] > 140 && ypx[1] > 140) && (Math.max(ypx[0], ypx[1]) - ypx[2] > 50);
    }

    if ((isPink && isBlue) || (isPink && isGreen) || (isBlue && isGreen) || (isYellow && (isPink || isBlue || isGreen))) {
        // overlapping regions: show relevant combined info
        const cats = [];
        if (isPink) { cats.push('Industrial / Machinery', 'Construction & Raw Materials'); }
        if (isBlue) { cats.push('Consumer & E-commerce Goods'); }
        if (isGreen) { cats.push('Food & Agriculture'); }
        if (isYellow) { cats.push('Other / Mixed Freight'); }
        showCategoryInfo(cats);
    } else if (isPink) {
        showCategoryInfo(['Industrial / Machinery', 'Construction & Raw Materials']);
    } else if (isBlue) {
        showCategoryInfo(['Consumer & E-commerce Goods']);
    } else if (isGreen) {
        showCategoryInfo(['Food & Agriculture']);
    } else if (isYellow) {
        showCategoryInfo(['Other / Mixed Freight']);
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
    const sections = [];
    for (const name of categoryNames) {
        const cat = SITE_DATA.categories[name];
        if (!cat) continue;
        const y = (cat.years || {})[year];
        if (!y) continue;
        const imports = y.imports || [];
        const exports = y.exports || [];
        const importsTotal = imports.reduce((s, r) => s + (r.teu || 0), 0);
        const exportsTotal = exports.reduce((s, r) => s + (r.teu || 0), 0);
        lines.push(`${name}: imports ${importsTotal.toLocaleString()} TEU, exports ${exportsTotal.toLocaleString()} TEU`);

        const impList = imports.map(r => `&bull; ${r.commodity}: ${Number(r.teu || 0).toLocaleString()} TEU`).join('<br>');
        const expList = exports.map(r => `&bull; ${r.commodity}: ${Number(r.teu || 0).toLocaleString()} TEU`).join('<br>');
        sections.push(`
            <div style="margin:8px 0 10px;">
                <div style="font-weight:600;">${name}</div>
                <div>Imports (${importsTotal.toLocaleString()} TEU)</div>
                <div style="margin-left:8px;">${impList || '—'}</div>
                <div style="margin-top:6px;">Exports (${exportsTotal.toLocaleString()} TEU)</div>
                <div style="margin-left:8px;">${expList || '—'}</div>
            </div>
        `);
    }
    if (infoEl) infoEl.textContent = lines.join(' • ');

    // populate heading/subtitle/desc
    const titleEl = document.querySelector('.site-title');
    const subEl = document.querySelector('.site-subtitle');
    const descEl = document.querySelector('.site-desc');
    if (titleEl) titleEl.textContent = categoryNames.join(' + ');
    if (subEl) {
        const annual = SITE_DATA.annual_totals?.[year];
        subEl.textContent = `Year ${year} — total ${Number(annual || 0).toLocaleString()} TEU`;
    }
    if (descEl) {
        descEl.innerHTML = sections.join('');
    }

    applyThemeForCategories(categoryNames);
}

function clearHoverInfo() {
    const infoEl = document.getElementById('hover-info');
    if (infoEl) infoEl.textContent = '';
    // restore defaults
    const titleEl = document.querySelector('.site-title');
    const subEl = document.querySelector('.site-subtitle');
    const descEl = document.querySelector('.site-desc');
    if (titleEl && DEFAULT_TITLE) titleEl.textContent = DEFAULT_TITLE;
    if (subEl && DEFAULT_SUBTITLE) subEl.textContent = DEFAULT_SUBTITLE;
    if (descEl && DEFAULT_DESC) descEl.innerHTML = DEFAULT_DESC;
    // remove theme classes
    applyThemeForCategories([]);
}

function applyThemeForCategories(categoryNames) {
    const body = document.body;
    body.classList.remove('theme-pink', 'theme-blue', 'theme-green', 'theme-yellow');
    if (!categoryNames || categoryNames.length === 0) return;
    const hasPink = categoryNames.some(n => n === 'Industrial / Machinery' || n === 'Construction & Raw Materials');
    const hasBlue = categoryNames.includes('Consumer & E-commerce Goods');
    const hasGreen = categoryNames.includes('Food & Agriculture');
    const hasYellow = categoryNames.includes('Other / Mixed Freight');
    if (hasPink && !hasBlue && !hasGreen && !hasYellow) body.classList.add('theme-pink');
    else if (hasBlue && !hasPink && !hasGreen && !hasYellow) body.classList.add('theme-blue');
    else if (hasGreen && !hasPink && !hasBlue && !hasYellow) body.classList.add('theme-green');
    else if (hasYellow && !hasPink && !hasBlue && !hasGreen) body.classList.add('theme-yellow');
    // if mixed, keep default colors (no class)
}

function proxySidebarScroll(e) {
    const sb = document.querySelector('.sidebar');
    if (!sb) return;
    sb.scrollTop += e.deltaY;
    e.preventDefault();
}

function switchView(view) {
    CURRENT_VIEW = view;
    const base = view === 'pedestrian' ? 'assets/pedestrian-view' : 'assets/bedroom-view';
    let vc = document.querySelector('.view-canvas');
    if (!vc) return;
    // replace node to drop any old listeners bound to it
    const clone = vc.cloneNode(false);
    vc.parentNode.replaceChild(clone, vc);
    vc = clone;
    vc.innerHTML = '';
    const layerNames = ['food-agriculture-layer.png', 'consumer-ecommerce-layer.png', 'industry-layer.png', 'other-misc-layer.png'];
    let pending = layerNames.length;
    const tryFinish = () => { pending -= 1; if (pending === 0) setupHoverSampling(); };
    layerNames.forEach(name => {
        const src = `${base}/${name}`;
        const img = new Image();
        img.className = 'view-layer';
        img.alt = '';
        img.onload = () => { vc.appendChild(img); tryFinish(); };
        img.onerror = () => { tryFinish(); };
        img.src = src;
    });
}



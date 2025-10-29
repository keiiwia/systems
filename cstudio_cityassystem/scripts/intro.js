const PANELS = [
    { title: 'A City is a Multitude of Systems', body: 'economically, productively, and socially' },
    { title: 'Scale of Movement', body: 'Millions of TEU (twenty-foot equivalent units, or shipping containers) move annually, linking ports, warehouses, and neighborhoods. this website focuses on the Port of New Jersey and New York, authorized by Port Authority.' },
    { title: 'What is inside the boxes?', body: 'From food to electronics, containerized cargo shapes daily life and local economies. The data here focuses on the types of goods imported and exported, and the categorical data provided by the Port Authority yearly recap reports.' },
    { title: 'Economic Impact', body: 'The goods imported and exported largely shape the local economy and its relationships within metropolitan life, infrastructure, industry, and labor. Ton-miles, the measurement of movement of one ton of freight for one mile, is used to quantify the economic impact of the port on this site.' },
    { title: 'For more information', body: 'Continue to the site and find all recorded data and resources.' }
];

const panelTitle = document.getElementById('panel-title');
const panelBody = document.getElementById('panel-body');
const backBtn = document.getElementById('back');
const nextBtn = document.getElementById('next');
const skipBtn = document.getElementById('skip');
const progressBar = document.getElementById('progress-bar');
const ship = document.getElementById('ship');
const stage = document.getElementById('stage');
const intro = document.getElementById('intro');
const site = document.getElementById('site');
const trailPath = document.getElementById('trail-path');

let trailLength = 0;
let startOffsetLen = 0; // initial offset along path so ship starts a bit to the right
let step = 0; // 0..PANELS.length-1
let currentFraction = 0; // animated 0..1 along path
let animId = 0;
let bobStart = performance.now();

function easeInOut(t) { return 0.5 * (1 - Math.cos(Math.PI * t)); }

function render() {
    const current = PANELS[step];
    panelTitle.textContent = current.title;
    panelBody.textContent = current.body;
    backBtn.disabled = step === 0;
    nextBtn.textContent = step === PANELS.length - 1 ? 'Enter site' : 'Next';

    progressBar.style.width = `${Math.round((step + 1) / PANELS.length * 100)}%`;

    const targetFraction = step / (PANELS.length - 1);
    animateTo(targetFraction);
}

function next() {
    if (step < PANELS.length - 1) { step += 1; render(); } else { finishIntro(); }
}
function back() { if (step > 0) { step -= 1; render(); } }

function finishIntro() {
    intro.style.transition = 'opacity 500ms ease';
    intro.style.opacity = '0';
    setTimeout(() => {
        intro.style.display = 'none';
        site.style.display = 'block';
        document.body.style.overflow = 'auto';
    }, 520);
}

nextBtn.addEventListener('click', next);
backBtn.addEventListener('click', back);
skipBtn.addEventListener('click', finishIntro);
window.addEventListener('resize', () => requestAnimationFrame(() => drawAtFraction(currentFraction)));

if (trailPath) {
    trailLength = trailPath.getTotalLength();
    startOffsetLen = trailLength * 0.15; // start ~15% into the path
    trailPath.style.strokeDasharray = String(trailLength);
    trailPath.style.strokeDashoffset = String(trailLength);
}

function drawAtFraction(f) {
    const l = Math.min(trailLength, startOffsetLen + f * (trailLength - startOffsetLen));
    const p = trailPath.getPointAtLength(l);
    const pAhead = trailPath.getPointAtLength(Math.min(trailLength, l + 1));
    const angleRad = Math.atan2(pAhead.y - p.y, pAhead.x - p.x);
    const angleDeg = angleRad * 180 / Math.PI;

    const nx = -(pAhead.y - p.y);
    const ny =  (pAhead.x - p.x);
    const nLen = Math.hypot(nx, ny) || 1;
    const nux = nx / nLen, nuy = ny / nLen;
    const t = (performance.now() - bobStart) / 1000;
    const amp = 4; // px
    const bob = Math.sin(t * 2.2) * amp;

    const rect = stage.getBoundingClientRect();
    const scaleX = rect.width / 1000;
    const scaleY = rect.height / 200;
    const xPx = (p.x + nux * (bob / scaleX)) * scaleX;
    const yPx = (p.y + nuy * (bob / scaleY)) * scaleY;

    ship.style.transform = `translate(${xPx}px, ${yPx}px) translate(-50%, -50%) rotate(${angleDeg}deg)`;

    // Wave synchronized with ship, ending behind the ship's midpoint
    if (trailLength) {
        const lengthPerPx = trailLength / rect.width;
        const bowGapLen = (ship.getBoundingClientRect().width * 0.5) * lengthPerPx; // half ship width
        const waveEnd = Math.max(0, Math.min(trailLength, l - bowGapLen));
        trailPath.style.strokeDasharray = String(trailLength);
        trailPath.style.strokeDashoffset = String(trailLength - waveEnd);
    }
}

function animateTo(targetFraction) {
    cancelAnimationFrame(animId);
    const start = performance.now();
    const duration = 850;
    const from = currentFraction;

    function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = from + (targetFraction - from) * easeInOut(t);
        currentFraction = eased;
        drawAtFraction(currentFraction);
        if (t < 1) { animId = requestAnimationFrame(frame); } else { currentFraction = targetFraction; }
    }
    animId = requestAnimationFrame(frame);
}

// start
render();

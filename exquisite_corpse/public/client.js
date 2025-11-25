const socket = io();

const statusMessage = document.getElementById('statusMessage');
const segmentInfo = document.getElementById('segmentInfo');
const promptClue = document.getElementById('promptClue');
const canvas = document.getElementById('corpseCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const sizePicker = document.getElementById('sizePicker');
const clearBtn = document.getElementById('clearBtn');
const submitBtn = document.getElementById('submitBtn');
const finalPanel = document.getElementById('finalPanel');
const guessInput = document.getElementById('guessInput');
const guessBtn = document.getElementById('guessBtn');
const revealPanel = document.getElementById('revealPanel');

let segments = [];
let segmentZones = [];
let committedLayers = [];
let currentSegmentIndex = null;
let mySocketId = null;
let drawingEnabled = false;
let isDrawing = false;
let lastPoint = null;

const CANVAS_BG = '#f0f4ff';

function computeZones(count) {
  const height = canvas.height;
  const segmentHeight = height / count;
  return Array.from({ length: count }, (_, idx) => ({
    y: idx * segmentHeight,
    height: segmentHeight,
  }));
}

function resetCanvasBase() {
  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawZoneGuides();
  committedLayers.forEach((layer, idx) => {
    if (layer) {
      drawSegmentImage(idx, layer);
    }
  });
}

function drawZoneGuides() {
  if (!segmentZones.length) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.2)';
  ctx.lineWidth = 2;
  segmentZones.forEach((zone, idx) => {
    if (idx === 0) return;
    ctx.beginPath();
    ctx.moveTo(0, zone.y);
    ctx.lineTo(canvas.width, zone.y);
    ctx.stroke();
  });
  ctx.restore();
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function drawStroke(stroke, shouldEmit = false) {
  if (!segmentZones.length) return;
  ctx.save();
  const targetIndex =
    stroke.segmentIndex !== undefined && stroke.segmentIndex !== null
      ? stroke.segmentIndex
      : currentSegmentIndex;
  const zone = segmentZones[targetIndex ?? 0];
  if (zone) {
    ctx.beginPath();
    ctx.rect(0, zone.y, canvas.width, zone.height);
    ctx.clip();
  }
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(stroke.from.x, stroke.from.y);
  ctx.lineTo(stroke.to.x, stroke.to.y);
  ctx.stroke();
  ctx.restore();

  if (shouldEmit) {
    socket.emit('stroke', {
      segmentIndex: currentSegmentIndex,
      stroke,
    });
  }
}

function clearActiveZone() {
  if (currentSegmentIndex === null) return;
  const zone = segmentZones[currentSegmentIndex];
  ctx.clearRect(0, zone.y, canvas.width, zone.height);
  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, zone.y, canvas.width, zone.height);
  drawZoneGuides();
  committedLayers.forEach((layer, idx) => {
    if (layer && idx !== currentSegmentIndex) {
      drawSegmentImage(idx, layer);
    }
  });
}

function exportSegmentImage() {
  if (currentSegmentIndex === null) return null;
  const zone = segmentZones[currentSegmentIndex];
  const offscreen = document.createElement('canvas');
  offscreen.width = canvas.width;
  offscreen.height = zone.height;
  const offCtx = offscreen.getContext('2d');
  const data = ctx.getImageData(0, zone.y, canvas.width, zone.height);
  offCtx.putImageData(data, 0, 0);
  return offscreen.toDataURL('image/png');
}

function drawSegmentImage(segmentIndex, dataUrl) {
  const zone = segmentZones[segmentIndex];
  if (!zone) return;
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, zone.y, canvas.width, zone.height);
    drawZoneGuides();
  };
  img.src = dataUrl;
}

function setDrawingEnabled(enabled) {
  drawingEnabled = enabled;
  submitBtn.disabled = !enabled;
  clearBtn.disabled = !enabled;
  promptClue.classList.toggle('hidden', !enabled);
  canvas.classList.toggle('locked', !enabled);
}

canvas.addEventListener('pointerdown', (event) => {
  if (!drawingEnabled || currentSegmentIndex === null) return;
  const point = getCanvasPoint(event);
  const zone = segmentZones[currentSegmentIndex];
  if (!zone || point.y < zone.y || point.y > zone.y + zone.height) return;
  isDrawing = true;
  lastPoint = point;
});

canvas.addEventListener('pointermove', (event) => {
  if (!isDrawing || !drawingEnabled || currentSegmentIndex === null) return;
  const point = getCanvasPoint(event);
  const zone = segmentZones[currentSegmentIndex];
  if (!zone || point.y < zone.y || point.y > zone.y + zone.height) return;
  const stroke = {
    from: lastPoint,
    to: point,
    color: colorPicker.value,
    size: Number(sizePicker.value),
    segmentIndex: currentSegmentIndex,
  };
  drawStroke(stroke, true);
  lastPoint = point;
});

['pointerup', 'pointerleave', 'pointercancel'].forEach((name) => {
  canvas.addEventListener(name, () => {
    isDrawing = false;
  });
});

clearBtn.addEventListener('click', () => {
  clearActiveZone();
});

submitBtn.addEventListener('click', () => {
  if (currentSegmentIndex === null) return;
  const imageData = exportSegmentImage();
  if (!imageData) return;
  setDrawingEnabled(false);
  socket.emit('segment:complete', {
    segmentIndex: currentSegmentIndex,
    imageData,
  });
});

guessBtn.addEventListener('click', () => {
  const guess = guessInput.value.trim();
  if (!guess) return;
  guessBtn.disabled = true;
  socket.emit('promptGuess', { guess });
});

socket.on('connect', () => {
  mySocketId = socket.id;
});

socket.on('status:waiting', ({ message }) => {
  statusMessage.textContent = message;
});

socket.on('game:start', ({ segments: incomingSegments }) => {
  statusMessage.textContent = 'Partner found! Prepare to draw.';
  segmentInfo.textContent = '';
  finalPanel.classList.add('hidden');
  revealPanel.textContent = '';
  guessInput.value = '';
  guessBtn.disabled = false;

  segments = incomingSegments;
  committedLayers = new Array(segments.length).fill(null);
  segmentZones = computeZones(segments.length);
  currentSegmentIndex = null;
  resetCanvasBase();
});

socket.on('turn:waiting', ({ segmentIndex, segmentLabel, activePlayer }) => {
  const myTurn = activePlayer === mySocketId;
  currentSegmentIndex = segmentIndex;
  segmentInfo.textContent = `${segmentLabel} segment · ${myTurn ? 'Your turn to draw!' : 'Partner is drawing...'}`;
  setDrawingEnabled(myTurn);
  if (!myTurn) {
    promptClue.textContent = '';
  }
});

socket.on('turn:start', ({ segmentLabel, promptClue: clue }) => {
  promptClue.textContent = `Prompt: ${segmentLabel} should look like ${clue}`;
});

socket.on('stroke', ({ segmentIndex, stroke }) => {
  drawStroke({ ...stroke, segmentIndex });
});

socket.on('segment:committed', ({ segmentIndex, imageData }) => {
  committedLayers[segmentIndex] = imageData;
  drawSegmentImage(segmentIndex, imageData);
});

socket.on('game:final', ({ promptSummary, segmentsData }) => {
  statusMessage.textContent = 'Character assembled! Time to guess the prompt.';
  finalPanel.classList.remove('hidden');
  setDrawingEnabled(false);
  promptClue.classList.add('hidden');
  segmentInfo.textContent = 'Submit your best guess below.';
  revealPanel.textContent = '';
  finalPanel.dataset.promptSummary = promptSummary;
  if (Array.isArray(segmentsData) && segmentsData.length) {
    committedLayers = segmentsData;
    resetCanvasBase();
  }
});

socket.on('game:reveal', ({ promptSummary, guesses }) => {
  revealPanel.innerHTML = `
    <p><strong>Actual prompt:</strong> ${promptSummary}</p>
    <p><strong>Your guess:</strong> ${guesses[mySocketId] || '—'}</p>
    <p><strong>Partner guess:</strong> ${
      Object.entries(guesses)
        .filter(([id]) => id !== mySocketId)
        .map(([, value]) => value)
        .join(', ') || '—'
    }</p>
  `;
});

socket.on('game:ended', ({ reason }) => {
  statusMessage.textContent = reason || 'Game ended.';
  setDrawingEnabled(false);
});

resetCanvasBase();


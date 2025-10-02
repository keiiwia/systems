// visual stuff: position, animations, etc

export function centerImage(img) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const centerX = w / 2;
  const centerY = h / 2;
  const offsetX = (Math.random() - 0.5) * 200;
  const offsetY = (Math.random() - 0.5) * 200;
  const rot = (Math.random() * 10 - 5).toFixed(2);
  const scale = 0.9 + Math.random() * 0.3;

  img.style.left = (centerX + offsetX) + "px";
  img.style.top = (centerY + offsetY) + "px";
  img.style.transform = `translate(-10%, -10%) rotate(${rot}deg) scale(${scale})`;
  img.style.maxWidth = "250px";
}

export function randomPosAndStyle(img) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const x = Math.random() * (w - 300) + 150;
  const y = Math.random() * (h - 300) + 150;
  const rot = (Math.random() * 16 - 8).toFixed(2);
  const scale = 0.8 + Math.random() * 0.6;

  img.style.left = x + "px";
  img.style.top = y + "px";
  img.style.transform = `translate(-10%, -10%) rotate(${rot}deg) scale(${scale})`;
  img.style.maxWidth = "280px";
}

export function calcOpacityStable(remaining, total) {
  return remaining >= total
    ? Math.max(0.05, 1 / Math.sqrt(total))
    : Math.max(0.1, 1 / Math.sqrt(Math.max(5, remaining)));
}

export function calcOpacity(n) {
  return Math.max(0.05, 1 / Math.sqrt(n));
}



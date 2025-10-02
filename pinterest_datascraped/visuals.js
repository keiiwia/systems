//visuals (animations, position, etc)
export function centerImage(img) {
  const { innerWidth, innerHeight } = window;
  img.style.left = (innerWidth / 2 + (Math.random() - 0.5) * 200) + "px";
  img.style.top = (innerHeight / 2 + (Math.random() - 0.5) * 200) + "px";
  //ai helped with transform
  img.style.transform = `translate(-50%, -50%) rotate(${(Math.random() * 10 - 5).toFixed(2)}deg) scale(${0.9 + Math.random() * 0.3})`;
  img.style.maxWidth = "250px";
}

export function randomPosAndStyle(img) {
  const { innerWidth, innerHeight } = window;
  img.style.left = (Math.random() * (innerWidth - 300) + 150) + "px";
  img.style.top = (Math.random() * (innerHeight - 300) + 150) + "px";
  //ai helped with transform
  img.style.transform = `translate(-50%, -50%) rotate(${(Math.random() * 16 - 8).toFixed(2)}deg) scale(${0.8 + Math.random() * 0.6})`;
  img.style.maxWidth = "280px";
}

export function calcOpacity(count, total = null) {
  //center mode, ai helped with this: count ^ = opacity v
  if (total !== null) {
    return count >= total
      ? Math.max(0.05, 1 / Math.sqrt(total))
      : Math.max(0.1, 1 / Math.sqrt(Math.max(5, count)));
  }
  return Math.max(0.05, 1 / Math.sqrt(count));
}


// Einfaches, leicht verständliches Script:
// - Klick fügt ein Herz an der Klick-Position hinzu
// - Spielt einen Sound ("Glass.mp3" im selben Ordner)
// - Verhindert einfache Überlappung (falls zu nah, wird kein Herz erzeugt)
// - Zeichnet die Herzen im Animationsloop

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const HEART_RADIUS = 70; // Größe der Herzen
const SOUND_FILE = 'Glass.mp3'; // muss im gleichen Ordner liegen
const SPLIT_GAP = 10;
const GRAVITY = 0.15;
const FALL_LIMIT = 80; // ab wann ein gebrochenes Herz verschwindet

const hearts = []; // Liste der Herzen { id, x, y, r, state, split, vy }

const clickSound = new Audio(SOUND_FILE);
clickSound.volume = 0.6;

// Canvas auf Fenstergröße setzen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Prüfe, ob an (x,y) schon ein Herz zu nah ist, Überlappung vermeiden
function isTooClose(x, y) {
  return hearts.some(h => Math.hypot(h.x - x, h.y - y) < (h.r + HEART_RADIUS));
}
//Gibt jedem Herz eine eindeutige ID, wichtig später für webromms
function makeId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
//Legt ein neues Herz im Array ab
function addHeart(x, y, id = makeId()) {
  if (isTooClose(x, y)) {
    return;
  }
  hearts.push({ id, x, y, r: HEART_RADIUS, state: 'whole', split: 0, vy: 0 });
}

function breakHeart(id) {
  const h = hearts.find(item => item.id === id);
  if (!h || h.state !== 'whole') {
    return;
  }
  h.state = 'broken';
  h.split = SPLIT_GAP;
  h.vy = 0;

  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
}

function getHeartAt(x, y) {
  for (let i = hearts.length - 1; i >= 0; i -= 1) {
    const h = hearts[i];
    if (h.state === 'whole' && isPointInHeart(x, y, h.r, h.x, h.y)) {
      return h;
    }
  }
  return null;
}

// Klick: Herz hinzufügen oder brechen
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const hit = getHeartAt(x, y);
  if (hit) {
    breakHeart(hit.id);
    return;
  }

  addHeart(x, y, makeId());
});

function buildHeartPath(x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y + r / 4);
  ctx.bezierCurveTo(x + r, y - r / 2, x + r * 1.5, y + r / 2, x, y + r);
  ctx.bezierCurveTo(x - r * 1.5, y + r / 2, x - r, y - r / 2, x, y + r / 4);
}

function isPointInHeart(px, py, r, x, y) {
  buildHeartPath(x, y, r);
  return ctx.isPointInPath(px, py);
}

// Zeichne ein Herz mit Bézier-Kurven (einfaches Herz)
function drawHeart(x, y, r) {
  buildHeartPath(x, y, r);
  ctx.fillStyle = 'red';
  ctx.strokeStyle = 'red';
  ctx.fill();
  ctx.stroke();
}

function drawBrokenHeart(h) {
  const yTop = h.y - h.r * 0.6;
  const yBottom = h.y + h.r;
  const gap = h.split;
  const splitXLeft = h.x - gap / 2;
  const splitXRight = h.x + gap / 2;
  const clipLeftX = h.x - h.r * 2;
  const clipRightX = h.x + h.r * 2;

  const leftOffset = -gap / 2;
  const rightOffset = gap / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(clipLeftX, yTop, splitXLeft - clipLeftX, yBottom - yTop);
  ctx.clip();
  drawHeart(h.x + leftOffset, h.y, h.r);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(splitXRight, yTop, clipRightX - splitXRight, yBottom - yTop);
  ctx.clip();
  drawHeart(h.x + rightOffset, h.y, h.r);
  ctx.restore();

  // no cut line, only a visible gap between halves
}

// Einfacher Animationsloop: alle Herzen zeichnen
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = hearts.length - 1; i >= 0; i -= 1) {
    const h = hearts[i];
    if (h.state === 'whole') {
      drawHeart(h.x, h.y, h.r);
      continue;
    }

    if (h.state === 'broken') {
      h.y += h.vy;
      h.vy += GRAVITY;
      drawBrokenHeart(h);
      if (h.y > (canvas.height + FALL_LIMIT)) {
        hearts.splice(i, 1);
      }
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

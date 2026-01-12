// Einfaches, leicht verständliches Script:
// - Klick fügt ein Herz an der Klick-Position hinzu
// - Spielt einen Sound ("Glass.mp3" im selben Ordner)
// - Verhindert einfache Überlappung (falls zu nah, wird kein Herz erzeugt)
// - Zeichnet die Herzen im Animationsloop

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const HEART_RADIUS = 70; // Größe der Herzen, anpassen nach Wunsch
const SOUND_FILE = 'Glass.mp3'; // muss im gleichen Ordner liegen

const hearts = []; // Liste der Herzen { x, y, r }

const clickSound = new Audio(SOUND_FILE);
clickSound.volume = 0.6;

// Canvas auf Fenstergröße setzen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Prüfe, ob an (x,y) schon ein Herz zu nah ist
function isTooClose(x, y) {
  return hearts.some(h => Math.hypot(h.x - x, h.y - y) < (h.r + HEART_RADIUS));
}

// Klick: neues Herz hinzufügen (wenn nicht zu nah)
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isTooClose(x, y)) {
    // Zu nah an einem anderen Herz -> nicht hinzufügen
    return;
  }

  hearts.push({ x, y, r: HEART_RADIUS });

  // Sound abspielen (Autoplay-Policies: catch Fehler)
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
});

// Zeichne ein Herz mit Bézier-Kurven (einfaches Herz)
function drawHeart(x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y + r / 4);
  ctx.bezierCurveTo(x + r, y - r / 2, x + r * 1.5, y + r / 2, x, y + r);
  ctx.bezierCurveTo(x - r * 1.5, y + r / 2, x - r, y - r / 2, x, y + r / 4);
  ctx.fillStyle = 'red';
  ctx.strokeStyle = 'red';
  ctx.fill();
  ctx.stroke();
}

// Einfacher Animationsloop: alle Herzen zeichnen
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const h of hearts) {
    drawHeart(h.x, h.y, h.r);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
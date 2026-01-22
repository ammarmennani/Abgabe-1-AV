// Einfaches, leicht verständliches Script:
// - Klick fügt ein Herz an der Klick-Position hinzu
// - Spielt einen Sound ("Glass.mp3" im selben Ordner)
// - Verhindert einfache Überlappung (falls zu nah, wird kein Herz erzeugt)
// - Zeichnet die Herzen im Animationsloop

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

/*************************************
 * websocket communication
 */
const webRoomsWebSocketServerAddr = 'wss://nosch.uber.space/web-rooms/';

// variables
let clientId = null; // client ID sent by web-rooms server when calling 'enter-room'

const socket = new WebSocket(webRoomsWebSocketServerAddr);

// helper function to send requests over websocket to web-room server
function sendRequest(...message) {
  const str = JSON.stringify(message);
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(str);
  }
}

// listen to opening websocket connections
socket.addEventListener('open', () => {
  sendRequest('*enter-room*', 'red-hearts');
  sendRequest('*subscribe-client-count*');

  // ping the server regularly with an empty message to prevent the socket from closing
  setInterval(() => socket.send(''), 30000);
});

socket.addEventListener('close', () => {
  clientId = null;
});

// listen to messages from server
socket.addEventListener('message', (event) => {
  const data = event.data;

  if (data.length > 0) {
    const incoming = JSON.parse(data);
    const selector = incoming[0];

    // dispatch incomming messages
    switch (selector) {
      case '*client-id*':
        clientId = incoming[1] + 1;
        for (const h of hearts) {
          if (h.ownerId == null) {
            h.ownerId = clientId;
          }
        }
        break;
      case 'add-heart': {
        const id = incoming[1];
        const x = incoming[2];
        const y = incoming[3];
        const ownerId = incoming[4];
        addHeart(x, y, id, true, ownerId);
        break;
      }
      case 'break-heart': {
        const id = incoming[1];
        breakHeart(id, true);
        break;
      }
      case '*error*': {
        const message = incoming[1];
        console.warn('server error:', ...message);
        break;
      }
      default:
        break;
    }
  }
});

/*************************************
 * 
 */

const HEART_RADIUS = 70; // Größe der Herzen
const SOUND_FILE = 'Glass.mp3';
const SPLIT_GAP = 10;
const GRAVITY = 0.15;
const FALL_LIMIT = 80; // ab wann ein gebrochenes Herz verschwindet

const hearts = []; // Liste der Herzen { id, x, y, r, state, split, vy, ownerId }

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
  return hearts.some(h => {
    const hx = h.x * canvas.width;
    const hy = h.y * canvas.height;
    return Math.hypot(hx - x, hy - y) < (h.r + HEART_RADIUS);
  });
}
//Gibt jedem Herz eine eindeutige ID, wichtig später für webromms
function makeId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
// Füge ein Herz an relativer Position (x,y) hinzu
function addHeart(x, y, id = makeId(), force = false, ownerId = clientId) {
  const px = x * canvas.width;
  const py = y * canvas.height;
  if (!force && isTooClose(px, py)) {
    return;
  }
  hearts.push({ id, x, y, r: HEART_RADIUS, state: 'whole', split: 0, vy: 0, ownerId });
}

// Bricht ein Herz mit gegebener ID
function breakHeart(id, force = false) {
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

// Prüfe, ob an (x,y) ein ganzes Herz ist (um es zu brechen)
function getHeartAt(x, y) {
  for (let i = hearts.length - 1; i >= 0; i -= 1) {
    const h = hearts[i];
    const hx = h.x * canvas.width;
    const hy = h.y * canvas.height;
    if (h.state === 'whole' && isPointInHeart(x, y, h.r, hx, hy)) {
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
    sendRequest('*broadcast-message*', ['break-heart', hit.id]); //alle sehen das gebrochene Herz
    return;
  }
//Alle Clients sehen Herzen an derselben relativen Position
  const id = makeId();
  const nx = x / canvas.width;
  const ny = y / canvas.height;
  addHeart(nx, ny, id);
  sendRequest('*broadcast-message*', ['add-heart', id, nx, ny, clientId]); //alle sehen das neue Herz
});

// Baue den Pfad für ein Herz (Bézier-Kurven)
function buildHeartPath(x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y + r / 4);
  ctx.bezierCurveTo(x + r, y - r / 2, x + r * 1.5, y + r / 2, x, y + r);
  ctx.bezierCurveTo(x - r * 1.5, y + r / 2, x - r, y - r / 2, x, y + r / 4);
}

// Prüfe, ob Punkt (px,py) im Herz liegt
function isPointInHeart(px, py, r, x, y) {
  buildHeartPath(x, y, r);
  return ctx.isPointInPath(px, py);
}

// Zeichne ein Herz mit Bézier-Kurven (einfaches Herz)
function drawHeart(x, y, r, color = 'red') {
  buildHeartPath(x, y, r);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.fill();
  ctx.stroke();
}

// Zeichne ein gebrochenes Herz
function drawBrokenHeart(h) {
  const hx = h.x * canvas.width;
  const hy = h.y * canvas.height;
  const yTop = hy - h.r * 0.6;
  const yBottom = hy + h.r;
  const gap = h.split;
  const splitXLeft = hx - gap / 2;
  const splitXRight = hx + gap / 2;
  const clipLeftX = hx - h.r * 2;
  const clipRightX = hx + h.r * 2;

  const leftOffset = -gap / 2;
  const rightOffset = gap / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(clipLeftX, yTop, splitXLeft - clipLeftX, yBottom - yTop);
  ctx.clip();
  const color = h.ownerId === clientId ? 'red' : '#777';
  drawHeart(hx + leftOffset, hy, h.r, color);
  ctx.restore();

  // links: nur linke Seite sichtbar, rechts: nur rechte Seite sichtbar
  ctx.save();
  ctx.beginPath();
  ctx.rect(splitXRight, yTop, clipRightX - splitXRight, yBottom - yTop);
  ctx.clip();
  drawHeart(hx + rightOffset, hy, h.r, color);
  ctx.restore();

  
}

// Einfacher Animationsloop: alle Herzen zeichnen
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = hearts.length - 1; i >= 0; i -= 1) {
    const h = hearts[i];
    const color = h.ownerId === clientId ? 'red' : '#777';
    if (h.state === 'whole') {
      const hx = h.x * canvas.width;
      const hy = h.y * canvas.height;
      drawHeart(hx, hy, h.r, color);
      continue;
    }

    if (h.state === 'broken') {
      h.y += h.vy;
      h.vy += (GRAVITY / canvas.height);
      drawBrokenHeart(h);
      if (h.y > (1 + (FALL_LIMIT / canvas.height))) {
        hearts.splice(i, 1);
      }
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

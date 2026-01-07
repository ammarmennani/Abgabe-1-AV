const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const clickSound = new Audio("Glass.mp3");
clickSound.volume = 0.5;

let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;

const Hearts = new Set();
const radius = 40;

// Pointer-Listener einmalig registrieren
window.addEventListener('pointermove', (event) => {
  pointerX = event.clientX;
  pointerY = event.clientY;
  // console.log(pointerX, pointerY); // debug: auskommentieren zum Testen
});

// -- Neu: pointerdown einmalig registrieren --
canvas.addEventListener("pointerdown", (event) => {
  const clickX = event.clientX;
  const clickY = event.clientY;

  for (let heart of Hearts) {
    const dx = clickX - heart.x;
    const dy = clickY - heart.y;
    const distance = Math.hypot(dx, dy);

    if (distance < radius) { // Herz getroffen (Kreis-Approx.) Sound wird neu gestartet, damit er immer hörbar ist
      clickSound.currentTime = 0;
      clickSound.play().catch(() => {});
      break; // nur ein Sound pro Klick
    }
  }
});

window.addEventListener('resize', updateCanvasSize);
updateCanvasSize();
requestAnimationFrame(onAnimationFrame);

/*************************************************************/

function updateCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  context.lineWidth = 3;

  // (Re)create hearts on resize
  Hearts.clear();
  const t = 0.001 * performance.now();
  for (let i = 0; i < 10; i++) {
    const x = radius + Math.random() * (canvas.width - 2 * radius);
    const y = radius + Math.random() * (canvas.height - 2 * radius);
    const angle = 0.5 * Math.PI * Math.floor(4 * Math.random());
    const velocity = 150 + 100 * Math.random();
    // velocity in pixels per second
    const Heart = {
      x: x,
      y: y,
      angle: angle,
      velocity: velocity,
      start: t,
      t: t,
    };
    // Herzen als Objekte speichern
    Hearts.add(Heart);
  }
}

/*************************************************************
 * canvas
 */
function onAnimationFrame() {
  const t = 0.001 * performance.now();
  // Bewegung hängt nicht von der Framerate ab
  context.clearRect(0, 0, canvas.width, canvas.height);
  // Canvas jedes Frame löschen

  for (let Heart of Hearts) {
    let x = Heart.x;
    let y = Heart.y;
    const velocity = Heart.velocity;
    const heartAngle = Heart.angle; // umbenannt, keine Redeclaration
    const dT = t - Heart.t;
    const vX = velocity * Math.cos(heartAngle);
    const vY = velocity * Math.sin(heartAngle);

    // --- Neu: Pointer-Anziehung hinzufügen ---
    const dxp = pointerX - x;
    const dyp = pointerY - y;
    const distp = Math.hypot(dxp, dyp) || 1;
    // stärkere, sichtbare Anziehung; skaliert mit Distanz
    const attraction = Math.min(500, 1200 / (distp + 20));
    const vXtotal = vX + attraction * (dxp / distp);
    const vYtotal = vY + attraction * (dyp / distp);
    // --- Ende Änderung ---

    // Bewegung
    x += vXtotal * dT;
    y += vYtotal * dT;

    // Wrap-around an den Rändern
    if (x < -radius) {
      x = canvas.width + radius;
    } else if (x > canvas.width + radius) {
      x = -radius;
    }

    if (y < -radius) {
      y = canvas.height + radius;
    } else if (y > canvas.height + radius) {
      y = -radius;
    }

    let opening = 0.03 * velocity * (t - Heart.start) % 2;
    if (opening > 1) opening = 2 - opening;

    Heart.x = x;
    Heart.y = y;
    Heart.t = t;

    // draw heart with bezier curves
    context.save();
    context.globalAlpha = 0.666;
    context.fillStyle = 'rgba(255, 0, 0, 0.7)';
    context.strokeStyle = 'rgba(255, 0, 0, 1)';
    context.beginPath();
    context.moveTo(x, y + radius / 4);
    context.bezierCurveTo(
      x + radius, y - radius / 2,
      x + radius * 1.5, y + radius / 2,
      x, y + radius
    );
    context.bezierCurveTo(
      x - radius * 1.5, y + radius / 2,
      x - radius, y - radius / 2,
      x, y + radius / 4
    );
    context.fill();
    context.stroke();
    context.restore();
  }

  requestAnimationFrame(onAnimationFrame);
}



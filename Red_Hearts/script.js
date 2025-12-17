const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

const Hearts = new Set();
const radius = 40;

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

    const Heart = {
      x: x,
      y: y,
      angle: angle,
      velocity: velocity,
      start: t,
      t: t,
    };

    Hearts.add(Heart);
  }
}

/*************************************************************
 * canvas
 */
function onAnimationFrame() {
  const t = 0.001 * performance.now();

  context.clearRect(0, 0, canvas.width, canvas.height);

  for (let Heart of Hearts) {
    let x = Heart.x;
    let y = Heart.y;
    const velocity = Heart.velocity;
    const angle = Heart.angle;
    const dT = t - Heart.t;
    const vX = velocity * Math.cos(angle);
    const vY = velocity * Math.sin(angle);

    x += vX * dT;
    y += vY * dT;

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



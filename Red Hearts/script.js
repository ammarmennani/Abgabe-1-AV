const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

window.addEventListener('resize', updateCanvasSize);
updateCanvasSize();

/*************************************************************
 * canvas
 */
function updateCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  context.lineWidth = 3;

  const radius = 50;

  for (let i = 0; i < 10; i++) {
    context.beginPath();

    context.fillStyle = `rgba(255, 0, 0, 0.7)`;
    context.strokeStyle = `rgba(255, 0, 0, 1)`;

    const x = radius + Math.random() * (canvas.width - 2 * radius);
    const y = radius + Math.random() * (canvas.height - 2 * radius);
    context.moveTo(x, y);
    context.moveTo(x, y + radius / 4);

    // 2 bezier curven um ein herz zu zeichnen
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
  }
}


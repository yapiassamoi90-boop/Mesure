const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const info = document.getElementById('info');
const btnReset = document.getElementById('btnReset');

let points = [];
let refPixels = null;
const REF_REAL_CM = 8.56; // Largeur standard d'une carte bancaire

// Initialisation de la caméra arrière
async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } }
    });
    video.srcObject = stream;
  } catch (err) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  points.push({ x, y });
  draw();

  if (points.length === 2) {
    refPixels = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
    info.textContent = "2. Cliquez sur les 2 extrémités de l'objet à mesurer";
  } else if (points.length === 4) {
    const targetPixels = Math.hypot(points[3].x - points[2].x, points[3].y - points[2].y);
    const measuredCm = (targetPixels / refPixels) * REF_REAL_CM;
    info.innerHTML = `<strong>Mesure : ${measuredCm.toFixed(2)} cm</strong>`;
  }
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Tracé des points et des lignes
  for (let i = 0; i < points.length; i++) {
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, 6, 0, Math.PI * 2);
    ctx.fillStyle = i < 2 ? '#38bdf8' : '#4ade80';
    ctx.fill();

    if (i % 2 === 1) {
      ctx.beginPath();
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(points[i].x, points[i].y);
      ctx.strokeStyle = i === 1 ? '#38bdf8' : '#4ade80';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
}

btnReset.addEventListener('click', () => {
  points = [];
  refPixels = null;
  info.textContent = "1. Marquez la largeur de l'étalon (Carte = 8.56 cm)";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Enregistrement Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

initCamera();

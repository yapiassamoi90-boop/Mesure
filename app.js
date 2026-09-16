const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const info = document.getElementById('info');
const btnReset = document.getElementById('btnReset');
const btnCapture = document.getElementById('btnCapture');

let points = [];
let refPixels = null;
let isPhotoFrozen = false;
const REF_REAL_CM = 8.56;

// Initialisation caméra
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

// Redimensionnement précis du Canvas pour éliminer le décalage
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  draw();
}
window.addEventListener('resize', resizeCanvas);

// Calcul exact de la position du toucher / clic
function getCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX = e.clientX;
  let clientY = e.clientY;

  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function handlePointer(e) {
  if (e.type === 'touchstart') e.preventDefault(); // Évite les doubles clics sur mobile
  
  if (points.length >= 4) return;

  const { x, y } = getCoordinates(e);
  points.push({ x, y });
  draw();

  if (points.length === 2) {
    refPixels = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
    info.textContent = "2. Cliquez sur les 2 extrémités de l'objet à mesurer";
  } else if (points.length === 4) {
    const targetPixels = Math.hypot(points[3].x - points[2].x, points[3].y - points[2].y);
    const measuredCm = (targetPixels / refPixels) * REF_REAL_CM;
    info.innerHTML = `Mesure : <strong>${measuredCm.toFixed(2)} cm</strong>`;
  }
}

canvas.addEventListener('click', handlePointer);
canvas.addEventListener('touchstart', handlePointer, { passive: false });

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (let i = 0; i < points.length; i++) {
    // Dessiner le point
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, 7, 0, Math.PI * 2);
    ctx.fillStyle = i < 2 ? '#38bdf8' : '#4ade80';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dessiner la ligne entre 2 points
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

// BOUTON : PRENDRE PHOTO / REPRENDRE VIDÉO
btnCapture.addEventListener('click', () => {
  if (!isPhotoFrozen) {
    video.pause(); // Fige l'image vidéo actuelle
    isPhotoFrozen = true;
    btnCapture.textContent = "▶ Vidéo Direct";
    btnCapture.classList.add('btn-secondary');
  } else {
    video.play(); // Reprend le flux vidéo en direct
    isPhotoFrozen = false;
    btnCapture.textContent = "📷 Prendre Photo";
    btnCapture.classList.remove('btn-secondary');
  }
});

// BOUTON : RÉINITIALISER
btnReset.addEventListener('click', () => {
  points = [];
  refPixels = null;
  info.textContent = "1. Marquez la largeur de l'étalon (Carte = 8.56 cm)";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

initCamera();
setTimeout(resizeCanvas, 300);

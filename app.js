/* ═══════════════════════════════════════════════════════════
   Constellation Explorer · app.js
   ═══════════════════════════════════════════════════════════ */

const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');

// ── State ────────────────────────────────────────────────────
let stars   = [];   // { id, x, y, r, name, twinkle, phase, vel }
let links   = [];   // { a, b }  (star ids)
let labels  = [];   // { text, x, y }  (constellation names)
let bgStars = [];   // static background dots

let mode         = 'free';   // 'free' | 'connect'
let connecting   = null;     // star id being dragged from
let hoveredStar  = null;
let animFrame    = null;
let pendingLabel = null;     // star id awaiting name

let mouse = { x: 0, y: 0 };
let W, H;

// ── Resize ───────────────────────────────────────────────────
function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  generateBgStars();
}
window.addEventListener('resize', resize);
resize();

// ── Background stars ─────────────────────────────────────────
function generateBgStars() {
  bgStars = [];
  const count = Math.floor((W * H) / 4000);
  for (let i = 0; i < count; i++) {
    bgStars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 0.9 + 0.2,
      alpha: Math.random() * 0.5 + 0.1,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.3 + 0.05,
    });
  }
}

// ── Star helpers ─────────────────────────────────────────────
let uid = 0;
function createStar(x, y) {
  return {
    id: uid++,
    x, y,
    r: Math.random() * 3 + 3,
    name: null,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.4 + 0.2,
    vel: {
      x: (Math.random() - 0.5) * 0.12,
      y: (Math.random() - 0.5) * 0.12,
    },
    born: Date.now(),
  };
}

function starAt(x, y, margin = 0) {
  return stars.find(s => Math.hypot(s.x - x, s.y - y) < s.r + 10 + margin);
}

// ── Draw ─────────────────────────────────────────────────────
function draw(t) {
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#03050f';
  ctx.fillRect(0, 0, W, H);

  drawBgStars(t);
  drawLinks(t);
  drawConnectingLine();
  drawStars(t);
  drawLabels();
  drawHoverRing(t);

  updateUI();
  animFrame = requestAnimationFrame(draw);
}

function drawBgStars(t) {
  for (const s of bgStars) {
    const flicker = s.alpha * (0.7 + 0.3 * Math.sin(t * 0.001 * s.speed + s.phase));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,210,240,${flicker})`;
    ctx.fill();
  }
}

function drawLinks(t) {
  for (const lk of links) {
    const a = stars.find(s => s.id === lk.a);
    const b = stars.find(s => s.id === lk.b);
    if (!a || !b) continue;

    const pulse = 0.35 + 0.15 * Math.sin(t * 0.001 + a.phase);

    // Glow
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(140,180,255,${pulse * 0.35})`;
    ctx.lineWidth = 3;
    ctx.filter = 'blur(3px)';
    ctx.stroke();
    ctx.filter = 'none';

    // Core line
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(140,180,255,${pulse})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawConnectingLine() {
  if (mode !== 'connect' || connecting === null) return;
  const s = stars.find(st => st.id === connecting);
  if (!s) return;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(mouse.x, mouse.y);
  ctx.strokeStyle = 'rgba(126,184,247,0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawStars(t) {
  for (const s of stars) {
    // gentle drift
    s.x += s.vel.x;
    s.y += s.vel.y;
    if (s.x < 0 || s.x > W) s.vel.x *= -1;
    if (s.y < 0 || s.y > H) s.vel.y *= -1;

    const twinkle = 0.75 + 0.25 * Math.sin(t * 0.002 * s.speed + s.phase);

    // Outer glow
    const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
    grd.addColorStop(0, `rgba(232,213,163,${0.25 * twinkle})`);
    grd.addColorStop(1, 'rgba(232,213,163,0)');
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * twinkle, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,245,220,${0.85 + 0.15 * twinkle})`;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#e8d5a3';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Name tag
    if (s.name) {
      ctx.font = `600 11px 'Cinzel', serif`;
      ctx.fillStyle = 'rgba(200,210,255,0.75)';
      ctx.letterSpacing = '0.06em';
      ctx.fillText(s.name, s.x + s.r + 8, s.y - 4);
    }
  }
}

function drawLabels() {
  // constellation group labels drawn separately (future use)
}

function drawHoverRing(t) {
  if (hoveredStar === null) return;
  const s = stars.find(st => st.id === hoveredStar);
  if (!s) return;
  const pulse = 0.4 + 0.2 * Math.sin(t * 0.004);
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.r + 8, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(126,184,247,${pulse})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function updateUI() {
  document.getElementById('star-count').textContent = stars.length;
  document.getElementById('link-count').textContent = links.length;
  document.getElementById('mode-label').textContent = mode.toUpperCase();
}

// ── Mouse events ─────────────────────────────────────────────
canvas.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  const hit = starAt(mouse.x, mouse.y);
  hoveredStar = hit ? hit.id : null;
  canvas.style.cursor = hit ? 'pointer' : (mode === 'connect' ? 'crosshair' : 'crosshair');

  // Tooltip
  const tip = document.getElementById('tooltip');
  if (hit && hit.name) {
    tip.textContent = hit.name;
    tip.style.left = (e.clientX + 16) + 'px';
    tip.style.top  = (e.clientY - 8)  + 'px';
    tip.classList.add('show');
  } else {
    tip.classList.remove('show');
  }
});

canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  if (e.clientX < 260) return; // ignore clicks on UI panel

  const hit = starAt(e.clientX, e.clientY);

  if (mode === 'connect') {
    if (hit) {
      if (connecting === null) {
        connecting = hit.id;
      } else if (connecting !== hit.id) {
        addLink(connecting, hit.id);
        connecting = null;
      }
    } else {
      connecting = null;
    }
    return;
  }

  // Free mode: click empty space → new star
  if (!hit) {
    const s = createStar(e.clientX, e.clientY);
    stars.push(s);
    spawnAnimation(s);
  }
});

canvas.addEventListener('dblclick', e => {
  if (e.clientX < 260) return;
  const hit = starAt(e.clientX, e.clientY);
  if (hit) openModal(hit.id);
});

// Right-click to remove
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (e.clientX < 260) return;
  const hit = starAt(e.clientX, e.clientY);
  if (hit) {
    stars  = stars.filter(s => s.id !== hit.id);
    links  = links.filter(l => l.a !== hit.id && l.b !== hit.id);
  }
});

// ── Link management ──────────────────────────────────────────
function addLink(a, b) {
  const exists = links.some(l => (l.a === a && l.b === b) || (l.a === b && l.b === a));
  if (!exists) links.push({ a, b });
}

// ── Spawn animation (scale-in effect via r) ──────────────────
function spawnAnimation(star) {
  const target = star.r;
  star.r = 0;
  const grow = () => {
    star.r += (target - star.r) * 0.18;
    if (Math.abs(star.r - target) > 0.05) requestAnimationFrame(grow);
    else star.r = target;
  };
  requestAnimationFrame(grow);
}

// ── Modal (name constellation) ───────────────────────────────
function openModal(starId) {
  pendingLabel = starId;
  const s = stars.find(st => st.id === starId);
  const inp = document.getElementById('modal-input');
  inp.value = s.name || '';
  document.getElementById('modal').classList.add('open');
  setTimeout(() => inp.focus(), 50);
}

document.getElementById('modal-confirm').addEventListener('click', confirmModal);
document.getElementById('modal-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') confirmModal();
  if (e.key === 'Escape') closeModal();
});
document.getElementById('modal-cancel').addEventListener('click', closeModal);

function confirmModal() {
  const val = document.getElementById('modal-input').value.trim();
  if (pendingLabel !== null) {
    const s = stars.find(st => st.id === pendingLabel);
    if (s) s.name = val || null;
  }
  closeModal();
}
function closeModal() {
  document.getElementById('modal').classList.remove('open');
  pendingLabel = null;
}

// ── Buttons ──────────────────────────────────────────────────
document.getElementById('btn-mode').addEventListener('click', () => {
  mode = mode === 'free' ? 'connect' : 'free';
  connecting = null;
  document.getElementById('btn-mode').classList.toggle('active', mode === 'connect');
});

document.getElementById('btn-clear').addEventListener('click', () => {
  if (confirm('Clear everything?')) {
    stars = []; links = []; connecting = null;
  }
});

document.getElementById('btn-save').addEventListener('click', () => {
  // Draw final frame without drift overlay then save
  const link = document.createElement('a');
  link.download = 'constellation.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

document.getElementById('btn-random').addEventListener('click', generateRandom);

// ── Random constellation generator ───────────────────────────
const CONSTELLATIONS = [
  { name: 'Orion',       stars: 7,  spread: 120 },
  { name: 'Cassiopeia',  stars: 5,  spread: 140 },
  { name: 'Ursa Minor',  stars: 7,  spread: 110 },
  { name: 'Lyra',        stars: 5,  spread: 80  },
  { name: 'Cygnus',      stars: 9,  spread: 160 },
  { name: 'Perseus',     stars: 8,  spread: 130 },
  { name: 'Hydra',       stars: 10, spread: 220 },
];

function generateRandom() {
  const def = CONSTELLATIONS[Math.floor(Math.random() * CONSTELLATIONS.length)];
  const cx  = 260 + Math.random() * (W - 360) + 50;
  const cy  = Math.random() * (H - 100) + 50;

  const newStars = [];
  for (let i = 0; i < def.stars; i++) {
    const s = createStar(
      cx + (Math.random() - 0.5) * def.spread,
      cy + (Math.random() - 0.5) * def.spread * 0.6,
    );
    if (i === 0) s.name = def.name;
    stars.push(s);
    newStars.push(s);
    spawnAnimation(s);
  }

  // Chain-link them
  for (let i = 0; i < newStars.length - 1; i++) {
    addLink(newStars[i].id, newStars[i + 1].id);
  }
  // Add a couple of extra cross-links for character
  if (newStars.length > 3) {
    addLink(newStars[0].id, newStars[2].id);
  }
  if (newStars.length > 5) {
    addLink(newStars[2].id, newStars[Math.floor(newStars.length / 2)].id);
  }
}

// ── Key shortcuts ────────────────────────────────────────────
window.addEventListener('keydown', e => {
  if (e.key === 'c' || e.key === 'C') document.getElementById('btn-mode').click();
  if (e.key === 'r' || e.key === 'R') generateRandom();
  if (e.key === 'Escape') { connecting = null; mode = 'free'; document.getElementById('btn-mode').classList.remove('active'); }
});

// ── Kick off ─────────────────────────────────────────────────
generateRandom();
generateRandom();
requestAnimationFrame(draw);

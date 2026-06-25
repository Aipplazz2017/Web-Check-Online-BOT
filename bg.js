/* ════════════════════════════════════════════════
   bg.js — Dual background: Snow ❄ ↔ Matrix ⬛
   Switches every 18 seconds, smooth cross-fade.
   ════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Canvas setup ──────────────────────────────
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');
  let W = 0, H = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Mode state ───────────────────────────────
  const MODES      = ['snow', 'matrix'];
  let   modeIndex  = 0;
  let   mode       = MODES[modeIndex];
  let   alpha      = 1;          // current canvas opacity (handled via CSS transition)
  let   crossfade  = false;

  const AUTO_SWITCH_MS = 18000; // 18 s

  // Update button label
  function updateBtn() {
    const btn = document.getElementById('mode-btn');
    if (!btn) return;
    btn.textContent = mode === 'snow' ? '❄ SNOW' : '⬛ MATRIX';
  }

  function switchMode() {
    canvas.style.transition = 'opacity .8s ease';
    canvas.style.opacity    = '0';
    setTimeout(() => {
      modeIndex = (modeIndex + 1) % MODES.length;
      mode      = MODES[modeIndex];
      updateBtn();
      // reset matrix when entering matrix mode
      if (mode === 'matrix') initMatrix();
      canvas.style.opacity = '0.55';
    }, 800);
  }

  // Auto-switch timer
  let autoTimer = setInterval(switchMode, AUTO_SWITCH_MS);

  // Manual toggle button
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('mode-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        clearInterval(autoTimer);
        switchMode();
        autoTimer = setInterval(switchMode, AUTO_SWITCH_MS);
      });
    }
    updateBtn();
  });

  // ══════════════════════════════════════════════
  //  SNOW
  // ══════════════════════════════════════════════
  const FLAKE_COUNT = 160;
  const flakes = [];

  function randomFlake() {
    return {
      x:    Math.random() * W,
      y:    Math.random() * H - H,
      r:    Math.random() * 2.5 + 0.5,
      speed:Math.random() * 0.8 + 0.3,
      drift:Math.random() * 0.4 - 0.2,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.02 + 0.005,
      opacity: Math.random() * 0.55 + 0.2,
    };
  }

  function initSnow() {
    flakes.length = 0;
    for (let i = 0; i < FLAKE_COUNT; i++) {
      const f = randomFlake();
      f.y = Math.random() * H; // spread on init
      flakes.push(f);
    }
  }
  initSnow();
  window.addEventListener('resize', initSnow);

  function drawSnow() {
    ctx.clearRect(0, 0, W, H);

    // subtle gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,   'rgba(10,20,40,0.0)');
    grad.addColorStop(1,   'rgba(0,0,0,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    for (const f of flakes) {
      f.wobble += f.wobbleSpeed;
      f.x      += f.drift + Math.sin(f.wobble) * 0.3;
      f.y      += f.speed;

      if (f.y > H + 5) {
        f.x = Math.random() * W;
        f.y = -5;
      }
      if (f.x > W + 5) f.x = -5;
      if (f.x < -5)   f.x = W + 5;

      // glow
      const grd = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 3);
      grd.addColorStop(0,   `rgba(180,220,255,${f.opacity})`);
      grd.addColorStop(0.4, `rgba(140,190,255,${f.opacity * 0.6})`);
      grd.addColorStop(1,   'rgba(140,190,255,0)');

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // core dot
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210,235,255,${f.opacity})`;
      ctx.fill();
    }
  }

  // ══════════════════════════════════════════════
  //  MATRIX
  // ══════════════════════════════════════════════
  const FONT_SIZE = 14;
  let cols     = 0;
  let drops    = [];
  let charGrid = []; // brightness of each cell for trail fade

  // Katakana + Latin + digits — authentic matrix feel
  const CHARS =
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&';

  function initMatrix() {
    cols = Math.floor(W / FONT_SIZE);
    drops     = new Array(cols).fill(0).map(() => Math.random() * -50);
    charGrid  = new Array(cols).fill(null).map(() => new Array(Math.ceil(H / FONT_SIZE)).fill(0));
  }

  function drawMatrix() {
    // Semi-transparent clear → leaves trail
    ctx.fillStyle = 'rgba(8,10,16,0.18)';
    ctx.fillRect(0, 0, W, H);

    ctx.font = `${FONT_SIZE}px 'IBM Plex Mono', monospace`;

    for (let c = 0; c < cols; c++) {
      const row    = Math.floor(drops[c]);
      const char   = CHARS[Math.floor(Math.random() * CHARS.length)];
      const x      = c * FONT_SIZE;
      const y      = row * FONT_SIZE;

      // Head character — bright white/cyan
      ctx.fillStyle = 'rgba(200,255,220,0.95)';
      ctx.shadowColor = '#3fb950';
      ctx.shadowBlur  = 8;
      ctx.fillText(char, x, y);
      ctx.shadowBlur  = 0;

      // Trail: decay nearby rows
      const trailLen = 18;
      for (let t = 1; t <= trailLen; t++) {
        const tr = row - t;
        if (tr < 0) continue;
        const brightness = (trailLen - t) / trailLen;
        const alpha      = brightness * 0.85;
        // more green toward tail
        const g = Math.floor(100 + 155 * brightness);
        ctx.fillStyle = `rgba(40,${g},60,${alpha})`;
        ctx.shadowBlur = brightness * 4;
        ctx.shadowColor = '#2da44e';
        const trailChar = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(trailChar, x, tr * FONT_SIZE);
      }
      ctx.shadowBlur = 0;

      // Advance drop
      drops[c] += 0.5 + Math.random() * 0.4;

      // Random reset
      if (drops[c] * FONT_SIZE > H && Math.random() > 0.975) {
        drops[c] = Math.random() * -20;
      }
    }
  }

  // ══════════════════════════════════════════════
  //  MAIN LOOP
  // ══════════════════════════════════════════════
  function loop() {
    if (mode === 'snow') {
      drawSnow();
    } else {
      drawMatrix();
    }
    requestAnimationFrame(loop);
  }

  loop();

})();

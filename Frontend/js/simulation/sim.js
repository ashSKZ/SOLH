// js/simulation/sim.js

let simInterval = null;
let pausado = false;

export function simUpdate(DATA) {
  const delta = () => Math.floor(Math.random() * 5) - 2;

  const pacEl = document.getElementById('kpi-pac');
  let pac = parseInt(pacEl.textContent) + delta();

  pac = Math.max(120, Math.min(DATA.totalCamas - 5, pac));

  pacEl.textContent = pac;

  document.getElementById('kpi-camas').textContent =
    Math.max(0, DATA.totalCamas - pac);

  document.getElementById('kpi-sat').textContent =
    Math.round((pac / DATA.totalCamas) * 100) + '%';
}

export function startSim(DATA) {
  simInterval = setInterval(() => simUpdate(DATA), 4000);
}

export function stopSim() {
  clearInterval(simInterval);
}

export function togglePausa(DATA) {
  pausado = !pausado;

  const btn   = document.getElementById('pause-btn');
  const dot   = document.getElementById('live-dot');
  const label = document.getElementById('live-label');

  if (pausado) {
    stopSim();

    btn.textContent = '▶';
    btn.classList.add('pause-btn--paused');

    dot.style.animationPlayState = 'paused';
    dot.style.opacity = '0.3';

    label.textContent = 'PAUSADO';
    label.style.color = 'var(--amber)';
  } else {
    startSim(DATA);

    btn.textContent = '⏸';
    btn.classList.remove('pause-btn--paused');

    dot.style.animationPlayState = 'running';
    dot.style.opacity = '1';

    label.textContent = 'EN VIVO';
    label.style.color = '';
  }
}
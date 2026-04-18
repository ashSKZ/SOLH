// js/ui/ui.js

export function buildAreas(DATA) {
  const el = document.getElementById('areas-sat');
  if (!el) return;

  el.innerHTML = DATA.areas.map(a => `
    <div class="sat-row">
      <div class="sat-row-header">
        <span class="sat-area">${a.nombre}</span>
        <span class="sat-pct" style="color:${a.color}">${a.pct}%</span>
      </div>
      <div class="sat-bar-track">
        <div class="sat-bar-fill" style="width:${a.pct}%;background:${a.color}"></div>
      </div>
    </div>
  `).join('');
}

export function buildAlerts(DATA) {
  const el = document.getElementById('alerts-list');
  if (!el) return;

  el.innerHTML = DATA.alerts.map(a => `
    <div class="alert-item alert-${a.nivel}">
      <div class="alert-dot"></div>
      <div>
        <div class="alert-msg">${a.msg}</div>
        <div class="alert-time">${a.hora}</div>
      </div>
    </div>
  `).join('');

  const countEl = document.getElementById('alert-count');
  if (countEl) {
    const criticas = DATA.alerts.filter(a => a.nivel === 'high').length;
    countEl.textContent = criticas + ' ACTIVA' + (criticas !== 1 ? 'S' : '');
  }
}

export function buildPersonal(DATA, toggleEspecialistas) {
  const el = document.getElementById('personal-grid');
  if (!el) return;

  el.innerHTML = DATA.personal_detalle.map(p => {
    const isEsp = p.label === 'Especialistas';
    return `
      <div class="personal-card ${isEsp ? 'personal-card--clickable' : ''}"
           ${isEsp ? 'onclick="toggleEspecialistas()"' : ''}>
        <span class="personal-icon">${p.icon}</span>
        <div class="personal-val">${p.val}</div>
        <div class="personal-label">${p.label}</div>
        ${isEsp ? '<div class="esp-hint">↑ ver detalle</div>' : ''}
      </div>
    `;
  }).join('');

  if (!document.getElementById('esp-modal')) {
    const modal = document.createElement('div');
    modal.id = 'esp-modal';
    modal.className = 'esp-modal';

    modal.innerHTML = `
      <div class="esp-modal-box">
        <div class="esp-modal-header">
          <span>🔬 Especialistas en turno</span>
          <button onclick="toggleEspecialistas()">✕</button>
        </div>
        <div>
          ${DATA.especialistas.map(e => `
            <div class="esp-row">
              <div>
                <div>${e.nombre}</div>
                <div>${e.turno}</div>
              </div>
              <div>${e.cant}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }
}

export function buildRecoms(DATA) {
  const el = document.getElementById('recoms');
  if (!el) return;

  el.innerHTML = DATA.recoms.map(r => `
    <div class="recom-item">
      <span>→</span>
      <span>${r}</span>
    </div>
  `).join('');
}
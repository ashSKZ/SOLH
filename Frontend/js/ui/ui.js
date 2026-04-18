// js/ui/ui.js

// ─────────────────────────────────────────────
// DASHBOARD: Saturación por área
// ─────────────────────────────────────────────
export function buildAreas(DATA) {
  const el = document.getElementById('areas-sat');
  if (!el) return;

  const areas = DATA?.areas || [];
  if (!areas.length) {
    el.innerHTML = `<div class="empty">Sin datos de áreas</div>`;
    return;
  }

  el.innerHTML = areas.map(a => `
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

// ─────────────────────────────────────────────
// DASHBOARD: Alertas
// ─────────────────────────────────────────────
export function buildAlerts(DATA) {
  const el = document.getElementById('alerts-list');
  if (!el) return;

  const alerts = DATA?.alerts || [];

  el.innerHTML = alerts.map(a => `
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
    const criticas = alerts.filter(a => a.nivel === 'high').length;
    countEl.textContent = criticas + ' ACTIVA' + (criticas !== 1 ? 'S' : '');
  }
}

// ─────────────────────────────────────────────
// DASHBOARD: Personal en turno
// ✅ Usa "dashboard-personal-grid" — ID exclusivo del dashboard
// ─────────────────────────────────────────────
export function buildPersonal(DATA = {}, toggleEspecialistas) {
  const el = document.getElementById('dashboard-personal-grid');
  if (!el) return;

  const personal = DATA?.personal_detalle || [];

  if (!personal.length) {
    el.innerHTML = `<div class="empty">Sin datos de personal</div>`;
    return;
  }

  el.innerHTML = personal.map(p => {
    const isEsp = p.label === 'Especialistas';
    return `
      <div class="personal-card ${isEsp ? 'personal-card--clickable' : ''}"
           ${isEsp ? 'onclick="toggleEspecialistas()"' : ''}>
        <span class="personal-icon">${p.icon || '👤'}</span>
        <div class="personal-val">${p.val ?? '--'}</div>
        <div class="personal-label">${p.label || 'N/A'}</div>
        ${isEsp ? '<div class="esp-hint">↑ ver detalle</div>' : ''}
      </div>
    `;
  }).join('');

  // Modal de especialistas — solo se crea una vez
  const especialistas = DATA?.especialistas || [];

  if (!document.getElementById('esp-modal') && especialistas.length) {
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
          ${especialistas.map(e => `
            <div class="esp-row">
              <div>
                <div>${e.nombre || 'N/A'}</div>
                <div>${e.turno || '--'}</div>
              </div>
              <div>${e.cant ?? 0}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }
}

// ─────────────────────────────────────────────
// DASHBOARD: Recomendaciones
// ─────────────────────────────────────────────
export function buildRecoms(DATA) {
  const el = document.getElementById('recoms');
  if (!el) return;

  const recoms = DATA?.recoms || [];

  el.innerHTML = recoms.map(r => `
    <div class="recom-item">
      <span>→</span>
      <span>${r}</span>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────
// INVENTARIO: Capital humano
// ✅ Usa "personal-capital-grid" — ID exclusivo del inventario
// ─────────────────────────────────────────────
export function buildPersonalCapital(data = {}) {
  const el = document.getElementById('personal-capital-grid');
  if (!el) return;

  const generales    = data.doctores_generales    ?? 0;
  const especialistas = data.doctores_especialistas ?? 0;
  const enfermeria   = data.enfermeria             ?? 0;

  el.innerHTML = `
    <div class="personal-card">
      <div class="personal-icon">🧑‍⚕️</div>
      <div class="personal-val">${generales}</div>
      <div class="personal-label">Médicos generales</div>
    </div>

    <div class="personal-card">
      <div class="personal-icon">🔬</div>
      <div class="personal-val">${especialistas}</div>
      <div class="personal-label">Especialistas</div>
    </div>

    <div class="personal-card">
      <div class="personal-icon">💉</div>
      <div class="personal-val">${enfermeria}</div>
      <div class="personal-label">Enfermería</div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// INVENTARIO: Capital material
// ─────────────────────────────────────────────
export function buildMaterialCapital(data = {}) {
  const el = document.getElementById('material-grid');
  if (!el) return;

  const camas       = data.camas_totales     ?? 0;
  const ocupadas    = data.camas_ocupadas    ?? 0;
  const disponibles = data.camas_disponibles ?? 0;

  el.innerHTML = `
    <div class="personal-card">
      <div class="personal-icon">🛏️</div>
      <div class="personal-val">${camas}</div>
      <div class="personal-label">Camas totales</div>
    </div>

    <div class="personal-card">
      <div class="personal-icon">📊</div>
      <div class="personal-val">${ocupadas}</div>
      <div class="personal-label">Ocupadas</div>
    </div>

    <div class="personal-card">
      <div class="personal-icon">🟢</div>
      <div class="personal-val">${disponibles}</div>
      <div class="personal-label">Disponibles</div>
    </div>
  `;
}
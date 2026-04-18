// js/charts/chart.js

let histChart    = null;
let chartMode    = 'actual';
let selectedDay  = 0;

function getColorForData(data) {
  const max = Math.max(...data);
  if (max >= 85) return { line: '#ef4444', bg: 'rgba(239,68,68,0.10)' };
  if (max >= 70) return { line: '#f59e0b', bg: 'rgba(245,158,11,0.10)' };
  return { line: '#10b981', bg: 'rgba(16,185,129,0.10)' };
}

export function initChart(DATA) {
  const ctx = document.getElementById('histChart');
  if (!ctx) return;

  const umbralPlugin = {
    id: 'umbral',
    afterDraw(chart) {
      const { ctx: c, chartArea: { left, right }, scales: { y } } = chart;
      const y80 = y.getPixelForValue(80);
      c.save();
      c.setLineDash([4, 4]);
      c.strokeStyle = 'rgba(239,68,68,0.25)';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(left, y80); c.lineTo(right, y80); c.stroke();
      c.restore();
    }
  };

  histChart = new Chart(ctx, {
    type: 'line',
    plugins: [umbralPlugin],
    data: {
      labels: DATA.labels_12h,
      datasets: [{
        label: 'Saturación %',
        data: DATA.historial_dias[0].data,
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0,212,255,0.07)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#00d4ff',
        pointBorderColor: '#0a0e1a',
        pointBorderWidth: 1.5,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a2235',
          borderColor: 'rgba(0,212,255,0.2)',
          borderWidth: 1,
          titleColor: '#64748b',
          bodyColor: '#00d4ff',
          bodyFont: { family: "'Space Mono', monospace", size: 12 },
          callbacks: { label: ctx => `  Saturación: ${ctx.parsed.y}%` }
        }
      },
      scales: {
        x: {
          ticks: { color: '#64748b', font: { size: 10, family: "'Space Mono', monospace" } },
          grid: { color: 'rgba(255,255,255,0.03)' }
        },
        y: {
          min: 40, max: 100,
          ticks: { color: '#64748b', font: { size: 10, family: "'Space Mono', monospace" }, callback: v => v + '%' },
          grid: { color: 'rgba(255,255,255,0.03)' }
        }
      }
    }
  });
}

export function switchChart(mode, DATA) {
  chartMode = mode;

  const daySelector = document.getElementById('day-selector');
  const statsEl     = document.getElementById('chart-stats');
  const tabActual   = document.getElementById('tab-actual');
  const tabPasadas  = document.getElementById('tab-pasadas');

  if (mode === 'actual') {
    tabActual.classList.add('chart-tab--active');
    tabPasadas.classList.remove('chart-tab--active');
    daySelector.style.display = 'none';
    statsEl.style.display = 'none';

    histChart.data.datasets[0].borderColor = '#00d4ff';
    histChart.data.datasets[0].backgroundColor = 'rgba(0,212,255,0.07)';
    histChart.data.datasets[0].pointBackgroundColor = '#00d4ff';
    histChart.data.datasets[0].data = DATA.historial_dias[0].data;

    histChart.update('active');
  } else {
    tabPasadas.classList.add('chart-tab--active');
    tabActual.classList.remove('chart-tab--active');
    daySelector.style.display = 'flex';
    selectDay(selectedDay, DATA);
  }
}

export function selectDay(dayIndex, DATA) {
  selectedDay = dayIndex;

  const dia    = DATA.historial_dias[dayIndex];
  const colors = getColorForData(dia.data);

  document.querySelectorAll('.day-btn').forEach((btn, i) => {
    btn.classList.toggle('day-btn--active', i === dayIndex);
  });

  histChart.data.datasets[0].data = dia.data;
  histChart.data.datasets[0].borderColor = colors.line;
  histChart.data.datasets[0].backgroundColor = colors.bg;
  histChart.data.datasets[0].pointBackgroundColor = colors.line;

  histChart.update('active');

  const statsEl = document.getElementById('chart-stats');
  statsEl.style.display = 'flex';
  statsEl.innerHTML = `
    <div class="stat-item"><span class="stat-label">MÁXIMO</span><span class="stat-val" style="color:#ef4444">${dia.max}%</span></div>
    <div class="stat-item"><span class="stat-label">MÍNIMO</span><span class="stat-val" style="color:#10b981">${dia.min}%</span></div>
    <div class="stat-item"><span class="stat-label">PROMEDIO</span><span class="stat-val" style="color:#f59e0b">${dia.prom}%</span></div>
    <div class="stat-item"><span class="stat-label">DÍA</span><span class="stat-val">${dia.label}</span></div>
  `;
}

export function updateChart(DATA) {
  if (!histChart) return;

  // Solo actualiza en modo "actual"
  if (chartMode !== 'actual') return;

  histChart.data.labels = DATA.labels_12h;

  histChart.data.datasets[0].data =
    DATA.historial_dias?.[0]?.data || [];

  histChart.update('active');
}
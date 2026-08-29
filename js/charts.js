/* ══════════════════════════════════════════════════════════
   charts.js — 24-HOUR TEMPERATURE TREND (Chart.js)
   SkyCast v2.0

   Renders a dual-axis chart under the hourly strip:
   • Temperature line with gradient fill
   • Rain-probability bars on a second axis
   • Re-renders on unit (°C/°F) and theme changes
   ══════════════════════════════════════════════════════════ */

const TrendChart = (() => {
    let chart = null;

    function cssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    function render() {
        const canvas = document.getElementById('trend-chart');
        if (!canvas || !currentWeatherData?.hourly?.length) return;
        if (typeof Chart === 'undefined') return;

        const hours = currentWeatherData.hourly;

        // Hour labels in the LOCATION's timezone (times are location-local)
        const labels = hours.map(h => {
            const d = new Date(`${h.time}:00`);
            return d.toLocaleTimeString('en-IN', { hour: 'numeric', hour12: true });
        });
        const temps   = hours.map(h => convertTemp(h.temp));
        const rain    = hours.map(h => h.rainProb ?? 0);

        const lineColor = cssVar('--accent') || '#3b82f6';
        const gridColor = 'rgba(148, 163, 184, 0.10)';
        const tickColor = cssVar('--text-muted') || '#64748b';
        const fontFamily = "'Outfit', sans-serif";

        // Gradient fill under the temperature line
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 240);
        grad.addColorStop(0, 'rgba(59, 130, 246, 0.28)');
        grad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Temperature',
                        data: temps,
                        borderColor: lineColor,
                        backgroundColor: grad,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.42,
                        pointRadius: 0,
                        pointHitRadius: 14,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: lineColor,
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Rain chance',
                        data: rain,
                        type: 'bar',
                        backgroundColor: 'rgba(14, 165, 233, 0.22)',
                        hoverBackgroundColor: 'rgba(14, 165, 233, 0.45)',
                        borderRadius: 3,
                        barPercentage: 0.55,
                        yAxisID: 'y1',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        labels: {
                            color: tickColor,
                            font: { family: fontFamily, size: 11 },
                            boxWidth: 10, boxHeight: 10,
                            usePointStyle: true,
                        },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10, 16, 30, 0.92)',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                        titleFont: { family: fontFamily, weight: '700' },
                        bodyFont: { family: fontFamily },
                        padding: 10,
                        cornerRadius: 9,
                        callbacks: {
                            label: (c) => c.datasetIndex === 0
                                ? `  ${c.parsed.y}° ${CONFIG.isMetric ? 'C' : 'F'}`
                                : `  ${c.parsed.y}% rain chance`,
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: tickColor, font: { family: fontFamily, size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
                    },
                    y: {
                        position: 'left',
                        grid: { color: gridColor },
                        ticks: {
                            color: tickColor, font: { family: fontFamily, size: 10 },
                            callback: (v) => `${v}°`,
                        },
                    },
                    y1: {
                        position: 'right',
                        min: 0, max: 100,
                        grid: { display: false },
                        ticks: {
                            color: tickColor, font: { family: fontFamily, size: 10 },
                            callback: (v) => `${v}%`,
                        },
                    },
                },
            },
        });
    }

    return { render };
})();

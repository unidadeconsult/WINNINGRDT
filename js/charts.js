const Charts = {
    instances: {},

    destroy(id) {
        if (this.instances[id]) {
            this.instances[id].destroy();
            delete this.instances[id];
        }
    },

    defaultOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#8ba4c4', font: { size: 10 } }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#5a7a9e', font: { size: 9 } },
                    grid: { color: 'rgba(30, 58, 95, 0.3)' }
                },
                y: {
                    ticks: { color: '#5a7a9e', font: { size: 9 } },
                    grid: { color: 'rgba(30, 58, 95, 0.3)' }
                }
            }
        };
    },

    evolutionChart(canvasId, entries, mode = 'unidades') {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const sorted = [...entries]
            .filter(e => e.status !== 'pendente' && e.date)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const daily = {};
        for (const e of sorted) {
            const d = e.date;
            if (!daily[d]) daily[d] = [];
            daily[d].push(e);
        }

        const labels = Object.keys(daily);
        let cumulative = 0;
        const banca = DB.getBanca();
        let bancaVal = banca.initial;
        const data = labels.map(d => {
            const dayProfit = daily[d].reduce((s, e) => s + Utils.calcProfit(e), 0);
            cumulative += dayProfit;
            bancaVal += dayProfit * banca.unitValue;
            if (mode === 'banca') return bancaVal;
            if (mode === 'lucro') return cumulative * banca.unitValue;
            return cumulative;
        });

        const labelMap = { unidades: 'Unidades', banca: 'Banca (R$)', lucro: 'Lucro (R$)' };

        this.instances[canvasId] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels.map(d => Utils.formatDate(d)),
                datasets: [{
                    label: labelMap[mode] || 'Unidades',
                    data,
                    borderColor: '#00b4d8',
                    backgroundColor: 'rgba(0, 180, 216, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#00e5ff',
                    borderWidth: 2
                }]
            },
            options: {
                ...this.defaultOptions(),
                plugins: {
                    ...this.defaultOptions().plugins,
                    tooltip: {
                        backgroundColor: '#132640',
                        titleColor: '#fff',
                        bodyColor: '#8ba4c4',
                        borderColor: '#1e3a5f',
                        borderWidth: 1
                    }
                }
            }
        });
    },

    groupPerformanceChart(canvasId, entries) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const groups = DB.getGroups();
        const labels = groups.map(g => g.name);
        const data = groups.map(g => {
            const gEntries = entries.filter(e => e.group === g.id);
            return Utils.calcTotalUnits(gEntries);
        });

        const colors = data.map(v => v >= 0 ? '#22c55e' : '#ef4444');

        this.instances[canvasId] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Unidades',
                    data,
                    backgroundColor: colors.map(c => c + '40'),
                    borderColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                ...this.defaultOptions(),
                plugins: { legend: { display: false } }
            }
        });
    },

    resultDistributionChart(canvasId, entries) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const greens = entries.filter(e => e.status === 'green').length;
        const reds = entries.filter(e => e.status === 'red').length;
        const voids = entries.filter(e => e.status === 'void').length;
        const pending = entries.filter(e => e.status === 'pendente').length;

        this.instances[canvasId] = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Green', 'Red', 'Void', 'Pendente'],
                datasets: [{
                    data: [greens, reds, voids, pending],
                    backgroundColor: ['#22c55e40', '#ef444440', '#6b728040', '#f59e0b40'],
                    borderColor: ['#22c55e', '#ef4444', '#6b7280', '#f59e0b'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#8ba4c4', font: { size: 10 }, padding: 12 }
                    }
                }
            }
        });
    },

    participantROIChart(canvasId, entries) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const participants = DB.getParticipants();
        const pData = participants
            .map(p => {
                const pEntries = entries.filter(e => e.participant === p.id);
                if (pEntries.length < 1) return null;
                return { name: p.name.split(' ')[0], roi: Utils.calcROI(pEntries), count: pEntries.length };
            })
            .filter(Boolean)
            .sort((a, b) => b.roi - a.roi)
            .slice(0, 10);

        this.instances[canvasId] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: pData.map(p => p.name),
                datasets: [{
                    label: 'ROI %',
                    data: pData.map(p => p.roi),
                    backgroundColor: pData.map(p => p.roi >= 0 ? '#22c55e40' : '#ef444440'),
                    borderColor: pData.map(p => p.roi >= 0 ? '#22c55e' : '#ef4444'),
                    borderWidth: 1
                }]
            },
            options: {
                ...this.defaultOptions(),
                indexAxis: 'y',
                plugins: { legend: { display: false } }
            }
        });
    },

    oddRangeChart(canvasId, entries) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ranges = ['1.01-1.49', '1.50-1.69', '1.70-1.89', '1.90-2.19', '2.20-2.99', '3.00+'];
        const data = ranges.map(r => {
            const rEntries = entries.filter(e => Utils.getOddRange(e.odd) === r && (e.status === 'green' || e.status === 'red'));
            return Utils.calcROI(rEntries);
        });

        this.instances[canvasId] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ranges,
                datasets: [{
                    label: 'ROI %',
                    data,
                    backgroundColor: data.map(v => v >= 0 ? '#00b4d840' : '#ef444440'),
                    borderColor: data.map(v => v >= 0 ? '#00b4d8' : '#ef4444'),
                    borderWidth: 1
                }]
            },
            options: {
                ...this.defaultOptions(),
                plugins: { legend: { display: false } }
            }
        });
    },

    drawdownChart(canvasId, entries) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const sorted = [...entries]
            .filter(e => e.status !== 'pendente' && e.date)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        let peak = 0, current = 0;
        const labels = [];
        const data = [];
        for (const e of sorted) {
            current += Utils.calcProfit(e);
            if (current > peak) peak = current;
            labels.push(Utils.formatDate(e.date));
            data.push(-(peak - current));
        }

        this.instances[canvasId] = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Drawdown (u)',
                    data,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    borderWidth: 2
                }]
            },
            options: {
                ...this.defaultOptions(),
                plugins: { legend: { display: false } }
            }
        });
    }
};

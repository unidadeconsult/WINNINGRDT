const Utils = {
    formatCurrency(val) {
        return 'R$ ' + Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatUnits(val) {
        const n = Number(val || 0);
        return (n >= 0 ? '+' : '') + n.toFixed(2) + 'u';
    },

    formatPct(val) {
        const n = Number(val || 0);
        return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR');
    },

    formatDateTime(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },

    today() {
        return new Date().toISOString().split('T')[0];
    },

    calcProfit(entry) {
        if (!entry) return 0;
        const units = Number(entry.units) || 0;
        const odd = Number(entry.odd) || 0;
        if (entry.status === 'green') return units * (odd - 1);
        if (entry.status === 'red') return -units;
        return 0;
    },

    calcROI(entries) {
        if (!entries.length) return 0;
        const resolved = entries.filter(e => e.status === 'green' || e.status === 'red');
        if (!resolved.length) return 0;
        const totalStaked = resolved.reduce((s, e) => s + (Number(e.units) || 0), 0);
        if (totalStaked === 0) return 0;
        const totalProfit = resolved.reduce((s, e) => s + this.calcProfit(e), 0);
        return (totalProfit / totalStaked) * 100;
    },

    calcWinRate(entries) {
        const resolved = entries.filter(e => e.status === 'green' || e.status === 'red');
        if (!resolved.length) return 0;
        const greens = resolved.filter(e => e.status === 'green').length;
        return (greens / resolved.length) * 100;
    },

    calcAvgOdd(entries) {
        const valid = entries.filter(e => Number(e.odd) > 0);
        if (!valid.length) return 0;
        return valid.reduce((s, e) => s + Number(e.odd), 0) / valid.length;
    },

    calcTotalUnits(entries) {
        return entries.reduce((s, e) => s + this.calcProfit(e), 0);
    },

    calcTotalProfit(entries, unitValue) {
        return this.calcTotalUnits(entries) * (unitValue || 50);
    },

    isSmallSample(count) {
        return count < 20;
    },

    getPhase(entries) {
        const last10 = entries.filter(e => e.status === 'green' || e.status === 'red').slice(0, 10);
        if (last10.length < 3) return 'neutral';
        const wr = this.calcWinRate(last10);
        if (wr >= 60) return 'good';
        if (wr <= 35) return 'bad';
        return 'neutral';
    },

    getAvatarColor(id) {
        const colors = [
            'linear-gradient(135deg, #3b82f6, #06b6d4)',
            'linear-gradient(135deg, #8b5cf6, #ec4899)',
            'linear-gradient(135deg, #ef4444, #f97316)',
            'linear-gradient(135deg, #22c55e, #06b6d4)',
            'linear-gradient(135deg, #f59e0b, #ef4444)',
            'linear-gradient(135deg, #6366f1, #3b82f6)',
            'linear-gradient(135deg, #14b8a6, #22c55e)',
            'linear-gradient(135deg, #ec4899, #8b5cf6)',
            'linear-gradient(135deg, #f97316, #f59e0b)',
            'linear-gradient(135deg, #06b6d4, #3b82f6)',
            'linear-gradient(135deg, #a855f7, #6366f1)',
            'linear-gradient(135deg, #84cc16, #14b8a6)'
        ];
        let hash = 0;
        const s = id || '';
        for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash) + s.charCodeAt(i);
        return colors[Math.abs(hash) % colors.length];
    },

    getStatusClass(status) {
        const map = { green: 'status-green', red: 'status-red', void: 'status-void', pendente: 'status-pendente' };
        return map[status] || 'status-pendente';
    },

    getStatusLabel(status) {
        const map = { green: 'GREEN', red: 'RED', void: 'VOID', pendente: 'PENDENTE' };
        return map[status] || 'PENDENTE';
    },

    filterByPeriod(entries, period) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return entries.filter(e => {
            const d = new Date(e.date || e.createdAt);
            if (period === 'hoje') {
                return d >= today;
            } else if (period === 'ontem') {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return d >= yesterday && d < today;
            } else if (period === '7dias') {
                const week = new Date(today);
                week.setDate(week.getDate() - 7);
                return d >= week;
            } else if (period === '30dias') {
                const month = new Date(today);
                month.setDate(month.getDate() - 30);
                return d >= month;
            }
            return true;
        });
    },

    getOddRange(odd) {
        const o = Number(odd);
        if (o < 1.5) return '1.01-1.49';
        if (o < 1.7) return '1.50-1.69';
        if (o < 1.9) return '1.70-1.89';
        if (o < 2.2) return '1.90-2.19';
        if (o < 3.0) return '2.20-2.99';
        return '3.00+';
    },

    calcDrawdown(entries) {
        let peak = 0, current = 0, maxDD = 0, currentDD = 0;
        const sorted = [...entries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        for (const e of sorted) {
            current += this.calcProfit(e);
            if (current > peak) peak = current;
            const dd = peak - current;
            if (dd > maxDD) maxDD = dd;
        }
        currentDD = peak - current;
        return { current: currentDD, max: maxDD };
    },

    calcStreaks(entries) {
        const sorted = [...entries]
            .filter(e => e.status === 'green' || e.status === 'red')
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        let maxGreen = 0, maxRed = 0, curGreen = 0, curRed = 0;
        for (const e of sorted) {
            if (e.status === 'green') { curGreen++; curRed = 0; }
            else { curRed++; curGreen = 0; }
            if (curGreen > maxGreen) maxGreen = curGreen;
            if (curRed > maxRed) maxRed = curRed;
        }
        return { maxGreen, maxRed };
    },

    calcCLV(entry) {
        if (!entry.oddClosing || !entry.odd) return null;
        const entryOdd = Number(entry.odd);
        const closingOdd = Number(entry.oddClosing);
        if (!closingOdd || !entryOdd) return null;
        return ((entryOdd - closingOdd) / closingOdd) * 100;
    },

    detectDuplicates(newEntry, entries) {
        return entries.filter(e =>
            e.match && newEntry.match &&
            e.match.toLowerCase() === newEntry.match.toLowerCase() &&
            e.market && newEntry.market &&
            e.market.toLowerCase() === newEntry.market.toLowerCase() &&
            e.status === 'pendente'
        );
    },

    detectCorrelation(entries) {
        const pending = entries.filter(e => e.status === 'pendente');
        const matchGroups = {};
        for (const e of pending) {
            if (!e.match) continue;
            const teams = e.match.toLowerCase().split(/\s*x\s*|\s*vs\s*/);
            for (const team of teams) {
                const t = team.trim();
                if (!matchGroups[t]) matchGroups[t] = [];
                matchGroups[t].push(e);
            }
        }
        const correlations = [];
        for (const [team, list] of Object.entries(matchGroups)) {
            if (list.length >= 2) {
                const totalUnits = list.reduce((s, e) => s + (Number(e.units) || 0), 0);
                correlations.push({ team, entries: list, totalUnits });
            }
        }
        return correlations;
    },

    generateInsights(entries) {
        const insights = [];
        if (entries.length < 5) return insights;

        const resolved = entries.filter(e => e.status === 'green' || e.status === 'red');
        if (resolved.length < 10) return insights;

        // Best odd range
        const ranges = {};
        for (const e of resolved) {
            const r = this.getOddRange(e.odd);
            if (!ranges[r]) ranges[r] = [];
            ranges[r].push(e);
        }
        let bestRange = null, bestROI = -Infinity;
        for (const [range, list] of Object.entries(ranges)) {
            if (list.length < 5) continue;
            const roi = this.calcROI(list);
            if (roi > bestROI) { bestROI = roi; bestRange = range; }
        }
        if (bestRange && bestROI > 0) {
            insights.push(`Seu melhor intervalo de odds nos ltimos registros  ${bestRange} (ROI: ${this.formatPct(bestROI)}).`);
        }

        // Live vs pre
        const live = resolved.filter(e => e.type === 'ao-vivo');
        const pre = resolved.filter(e => e.type === 'pre-jogo');
        if (live.length >= 5 && pre.length >= 5) {
            const liveUnits = this.calcTotalUnits(live);
            const preUnits = this.calcTotalUnits(pre);
            if (Math.abs(liveUnits - preUnits) > 1) {
                const better = liveUnits > preUnits ? 'ao vivo' : 'pr-jogo';
                insights.push(`Entradas ${better} esto performando melhor (${this.formatUnits(Math.max(liveUnits, preUnits))}).`);
            }
        }

        // Best group
        const groups = DB.getGroups();
        let bestGroup = null, bestGroupUnits = -Infinity;
        for (const g of groups) {
            const gEntries = resolved.filter(e => e.group === g.id);
            if (gEntries.length < 5) continue;
            const units = this.calcTotalUnits(gEntries);
            if (units > bestGroupUnits) { bestGroupUnits = units; bestGroup = g.name; }
        }
        if (bestGroup && bestGroupUnits > 0) {
            insights.push(`${bestGroup} possui melhor desempenho geral (${this.formatUnits(bestGroupUnits)}).`);
        }

        // FOMO insight
        const fomos = DB.getFomos();
        const fomoReds = fomos.filter(f => f.result === 'red');
        if (fomoReds.length >= 2) {
            insights.push(`Voc evitou ${fomoReds.length} Reds atravs do setor FOMO.`);
        }

        return insights;
    },

    toast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

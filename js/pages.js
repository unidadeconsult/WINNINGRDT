const Pages = {

    // ==================== DASHBOARD ====================
    dashboard() {
        const entries = DB.getEntries().filter(e => e.state !== 'descartada');
        const executed = entries.filter(e => e.state === 'executada' || !e.state);
        const banca = DB.getBanca();
        const totalUnits = Utils.calcTotalUnits(executed);
        const totalProfit = totalUnits * banca.unitValue;
        const roi = Utils.calcROI(executed);
        const winRate = Utils.calcWinRate(executed);
        const avgOdd = Utils.calcAvgOdd(executed);
        const pending = executed.filter(e => e.status === 'pendente').length;
        const bancaAtual = banca.initial + totalProfit;

        const todayEntries = Utils.filterByPeriod(executed, 'hoje');
        const todayGreens = todayEntries.filter(e => e.status === 'green').length;
        const todayReds = todayEntries.filter(e => e.status === 'red').length;
        const todayVoids = todayEntries.filter(e => e.status === 'void').length;
        const todayPending = todayEntries.filter(e => e.status === 'pendente').length;
        const todayUnits = Utils.calcTotalUnits(todayEntries);
        const todayROI = Utils.calcROI(todayEntries);

        const insights = Utils.generateInsights(executed);

        return `
        <div class="dashboard-layout">
            <div class="stats-strip">
                <div class="stat-card">
                    <div class="stat-label">LUCRO/PREJUZO</div>
                    <div class="stat-value ${totalProfit >= 0 ? 'positive' : 'negative'}">${Utils.formatCurrency(totalProfit)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">UNIDADES</div>
                    <div class="stat-value ${totalUnits >= 0 ? 'positive' : 'negative'}">${Utils.formatUnits(totalUnits)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">ROI</div>
                    <div class="stat-value ${roi >= 0 ? 'positive' : 'negative'}">${Utils.formatPct(roi)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">TAXA DE ACERTO</div>
                    <div class="stat-value accent">${winRate.toFixed(1)}%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">APOSTAS</div>
                    <div class="stat-value">${executed.length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">ODD MDIA</div>
                    <div class="stat-value">${avgOdd.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">PENDENTES</div>
                    <div class="stat-value" style="color:var(--yellow)">${pending}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">BANCA ATUAL</div>
                    <div class="stat-value accent">${Utils.formatCurrency(bancaAtual)}</div>
                </div>
            </div>

            <div class="main-panel">
                <div class="panel-header">
                    <div class="panel-title">
                        <span class="live-indicator"></span>
                        CENTRAL RDT
                    </div>
                    <div class="panel-tabs">
                        <button class="panel-tab active" data-chart="unidades">UNIDADES</button>
                        <button class="panel-tab" data-chart="banca">BANCA</button>
                        <button class="panel-tab" data-chart="lucro">LUCRO</button>
                    </div>
                </div>
                <div class="panel-body">
                    <div style="padding:0 0 12px 0">
                        <div style="font-size:0.65rem;color:var(--text-muted);letter-spacing:1px;margin-bottom:8px">PLACAR RDT  HOJE</div>
                        <div class="placar-rdt">
                            <div class="placar-item placar-green"><div class="count">${todayGreens}</div><div class="plabel">GREEN</div></div>
                            <div class="placar-item placar-red"><div class="count">${todayReds}</div><div class="plabel">RED</div></div>
                            <div class="placar-item placar-void"><div class="count">${todayVoids}</div><div class="plabel">VOID</div></div>
                            <div class="placar-item placar-pending"><div class="count">${todayPending}</div><div class="plabel">PENDENTE</div></div>
                        </div>
                        <div style="display:flex;gap:16px;font-size:0.7rem;color:var(--text-secondary)">
                            <span>Unidades: <strong style="color:${todayUnits >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatUnits(todayUnits)}</strong></span>
                            <span>ROI do dia: <strong style="color:${todayROI >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatPct(todayROI)}</strong></span>
                        </div>
                    </div>
                    <div style="font-size:0.65rem;color:var(--text-muted);letter-spacing:1px;margin-bottom:8px">EVOLUO DA BANCA / UNIDADES</div>
                    <div class="chart-container"><canvas id="main-chart"></canvas></div>

                    <div class="sub-charts">
                        <div class="sub-chart-card">
                            <h4>Performance por Grupo</h4>
                            <div class="mini-chart"><canvas id="group-chart"></canvas></div>
                        </div>
                        <div class="sub-chart-card">
                            <h4>Greens x Reds x Voids</h4>
                            <div class="mini-chart"><canvas id="dist-chart"></canvas></div>
                        </div>
                        <div class="sub-chart-card">
                            <h4>ROI por Participante</h4>
                            <div class="mini-chart"><canvas id="roi-chart"></canvas></div>
                        </div>
                        <div class="sub-chart-card">
                            <h4>Desempenho por Faixa de Odds</h4>
                            <div class="mini-chart"><canvas id="odds-chart"></canvas></div>
                        </div>
                    </div>

                    ${insights.length ? `
                    <div class="insights-container">
                        <div style="font-size:0.65rem;color:var(--text-muted);letter-spacing:1px;margin:16px 0 8px">INSIGHTS RDT</div>
                        ${insights.map(i => `
                            <div class="insight-card">
                                <span class="insight-icon">&#9889;</span>
                                <span>${i}</span>
                            </div>
                        `).join('')}
                        ${Utils.isSmallSample(executed.length) ? '<div class="insight-card insight-small-sample"><span class="insight-icon">&#9888;</span><span>AMOSTRA PEQUENA  Resultados podem no ser conclusivos</span></div>' : ''}
                    </div>` : ''}
                </div>
            </div>

            <div class="side-panel">
                <div class="panel-header">
                    <div class="panel-title">PAINEL DOS ESPECIALISTAS</div>
                </div>
                <div class="side-panel-filters">
                    <span class="filter-chip active" data-side-filter="todos">TODOS</span>
                    ${DB.getGroups().map(g => `<span class="filter-chip" data-side-filter="${g.id}">${g.name}</span>`).join('')}
                </div>
                <div class="side-panel-filters">
                    <span class="filter-chip active" data-side-period="todos">TODOS</span>
                    <span class="filter-chip" data-side-period="hoje">HOJE</span>
                    <span class="filter-chip" data-side-period="ontem">ONTEM</span>
                    <span class="filter-chip" data-side-period="7dias">7 DIAS</span>
                    <span class="filter-chip" data-side-period="30dias">30 DIAS</span>
                </div>
                <div class="side-entries" id="side-entries">
                    ${this._renderSideEntries(entries)}
                </div>
            </div>
        </div>`;
    },

    _renderSideEntries(entries, groupFilter = 'todos', periodFilter = 'todos') {
        let filtered = entries;
        if (groupFilter !== 'todos') filtered = filtered.filter(e => e.group === groupFilter);
        if (periodFilter !== 'todos') filtered = Utils.filterByPeriod(filtered, periodFilter);

        if (!filtered.length) {
            return '<div class="empty-state"><div class="empty-state-icon">&#128203;</div><div class="empty-state-text">Nenhuma entrada encontrada</div></div>';
        }

        const participants = DB.getParticipants();
        return filtered.slice(0, 50).map(e => {
            const p = participants.find(pp => pp.id === e.participant);
            const name = p ? p.name : (e.participant || 'Desconhecido');
            const avatar = p ? p.avatar : '??';
            const profit = Utils.calcProfit(e);
            return `
            <div class="entry-card" data-entry-id="${e.id}">
                <div class="entry-avatar" style="background:${Utils.getAvatarColor(p ? p.id : '')}">${avatar}</div>
                <div class="entry-info">
                    <div class="entry-name">${name}</div>
                    <div class="entry-match">${e.match || ''}</div>
                    <div class="entry-details">
                        <span>${e.market || ''}</span>
                        <span>Odd ${Number(e.odd || 0).toFixed(2)}</span>
                        <span>${Number(e.units || 0).toFixed(1)}u</span>
                    </div>
                </div>
                <div class="entry-status ${Utils.getStatusClass(e.status)}">${Utils.getStatusLabel(e.status)}</div>
            </div>`;
        }).join('');
    },

    // ==================== CENTRAL DO DIA ====================
    centralDia() {
        const entries = DB.getEntries().filter(e => e.state !== 'descartada');
        const todayEntries = Utils.filterByPeriod(entries, 'hoje');
        const greens = todayEntries.filter(e => e.status === 'green').length;
        const reds = todayEntries.filter(e => e.status === 'red').length;
        const voids = todayEntries.filter(e => e.status === 'void').length;
        const pending = todayEntries.filter(e => e.status === 'pendente').length;
        const units = Utils.calcTotalUnits(todayEntries);

        const groups = DB.getGroups();
        const participants = DB.getParticipants();

        let bestParticipant = null, bestUnits = -Infinity;
        let worstParticipant = null, worstUnits = Infinity;
        for (const p of participants) {
            const pEntries = todayEntries.filter(e => e.participant === p.id);
            if (!pEntries.length) continue;
            const u = Utils.calcTotalUnits(pEntries);
            if (u > bestUnits) { bestUnits = u; bestParticipant = p; }
            if (u < worstUnits) { worstUnits = u; worstParticipant = p; }
        }

        return `
        <div class="central-dia-layout">
            <div class="central-header">
                <div class="central-title">
                    <h1>CENTRAL DO DIA</h1>
                    <span class="central-live">RDT AO VIVO</span>
                </div>
                <div>
                    <button class="btn-sm btn-secondary" id="btn-encerrar-dia">ENCERRAR DIA</button>
                </div>
            </div>

            <div class="main-panel">
                <div class="panel-header">
                    <div class="panel-title"><span class="live-indicator"></span> PAINEL EM TEMPO REAL</div>
                </div>
                <div class="panel-body">
                    <div class="placar-rdt">
                        <div class="placar-item placar-green"><div class="count">${greens}</div><div class="plabel">GREEN</div></div>
                        <div class="placar-item placar-red"><div class="count">${reds}</div><div class="plabel">RED</div></div>
                        <div class="placar-item placar-void"><div class="count">${voids}</div><div class="plabel">VOID</div></div>
                        <div class="placar-item placar-pending"><div class="count">${pending}</div><div class="plabel">PENDENTE</div></div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
                        <div class="stat-card"><div class="stat-label">UNIDADES HOJE</div><div class="stat-value ${units >= 0 ? 'positive' : 'negative'}">${Utils.formatUnits(units)}</div></div>
                        <div class="stat-card"><div class="stat-label">APOSTAS HOJE</div><div class="stat-value">${todayEntries.length}</div></div>
                        <div class="stat-card"><div class="stat-label">ROI DO DIA</div><div class="stat-value ${Utils.calcROI(todayEntries) >= 0 ? 'positive' : 'negative'}">${Utils.formatPct(Utils.calcROI(todayEntries))}</div></div>
                    </div>

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
                        ${bestParticipant ? `<div class="stat-card"><div class="stat-label">MELHOR DO DIA</div><div class="stat-value" style="font-size:0.9rem">${bestParticipant.name}</div><div class="stat-sub">${Utils.formatUnits(bestUnits)}</div></div>` : ''}
                        ${worstParticipant && worstUnits < 0 ? `<div class="stat-card"><div class="stat-label">PIOR DO DIA</div><div class="stat-value negative" style="font-size:0.9rem">${worstParticipant.name}</div><div class="stat-sub">${Utils.formatUnits(worstUnits)}</div></div>` : ''}
                    </div>

                    <div style="font-size:0.65rem;color:var(--text-muted);letter-spacing:1px;margin-bottom:8px">DESEMPENHO POR GRUPO  HOJE</div>
                    ${groups.map(g => {
                        const gEntries = todayEntries.filter(e => e.group === g.id);
                        const gUnits = Utils.calcTotalUnits(gEntries);
                        return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:0.75rem">
                            <span style="color:var(--text-secondary)">${g.name}</span>
                            <span style="font-weight:700;color:${gUnits >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatUnits(gUnits)} (${gEntries.length} apostas)</span>
                        </div>`;
                    }).join('')}

                    <div class="chart-container" style="margin-top:16px"><canvas id="central-chart"></canvas></div>
                </div>
            </div>

            <div class="side-panel">
                <div class="panel-header">
                    <div class="panel-title">LTIMAS MOVIMENTAES</div>
                </div>
                <div class="side-entries" id="side-entries-central">
                    ${this._renderSideEntries(todayEntries)}
                </div>
            </div>
        </div>`;
    },

    // ==================== ENTRADAS ====================
    entradas() {
        const entries = DB.getEntries();
        const groups = DB.getGroups();
        const participants = DB.getParticipants();

        return `
        <div class="entradas-page">
            <div class="page-header">
                <div class="page-title">ENTRADAS</div>
                <div class="page-actions">
                    <button class="btn-sm btn-secondary" id="btn-export-entries">EXPORTAR</button>
                    <button class="btn-nova-entrada" id="btn-nova-entrada-page">+ NOVA ENTRADA</button>
                </div>
            </div>

            <div class="filter-bar">
                <input type="text" class="search-input" id="entry-search" placeholder="Pesquisar jogos, mercados...">
                <select id="filter-group">
                    <option value="">Todos os grupos</option>
                    ${groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                </select>
                <select id="filter-participant">
                    <option value="">Todos os participantes</option>
                    ${participants.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
                <select id="filter-status">
                    <option value="">Todos os status</option>
                    <option value="green">Green</option>
                    <option value="red">Red</option>
                    <option value="void">Void</option>
                    <option value="pendente">Pendente</option>
                </select>
                <select id="filter-type">
                    <option value="">Todos os tipos</option>
                    <option value="pre-jogo">Pr-jogo</option>
                    <option value="ao-vivo">Ao vivo</option>
                </select>
                <select id="filter-state">
                    <option value="">Todos</option>
                    <option value="executada">Executada</option>
                    <option value="indicada">Indicada</option>
                    <option value="descartada">Descartada</option>
                </select>
            </div>

            <div class="rdt-table-wrapper">
                <table class="rdt-table" id="entries-table">
                    <thead>
                        <tr>
                            <th data-sort="date">DATA</th>
                            <th data-sort="match">JOGO</th>
                            <th data-sort="market">MERCADO</th>
                            <th data-sort="odd">ODD</th>
                            <th data-sort="units">UNID.</th>
                            <th data-sort="group">GRUPO</th>
                            <th data-sort="participant">PARTICIPANTE</th>
                            <th data-sort="type">TIPO</th>
                            <th data-sort="state">ESTADO</th>
                            <th data-sort="status">RESULTADO</th>
                            <th>LUCRO</th>
                        </tr>
                    </thead>
                    <tbody id="entries-tbody">
                        ${this._renderEntriesTable(entries, participants, groups)}
                    </tbody>
                </table>
            </div>
        </div>`;
    },

    _renderEntriesTable(entries, participants, groups, filters = {}) {
        let filtered = [...entries];
        if (filters.search) {
            const q = filters.search.toLowerCase();
            filtered = filtered.filter(e => (e.match || '').toLowerCase().includes(q) || (e.market || '').toLowerCase().includes(q) || (e.championship || '').toLowerCase().includes(q) || (e.tags || '').toLowerCase().includes(q));
        }
        if (filters.group) filtered = filtered.filter(e => e.group === filters.group);
        if (filters.participant) filtered = filtered.filter(e => e.participant === filters.participant);
        if (filters.status) filtered = filtered.filter(e => e.status === filters.status);
        if (filters.type) filtered = filtered.filter(e => e.type === filters.type);
        if (filters.state) filtered = filtered.filter(e => e.state === filters.state);

        if (!filtered.length) {
            return '<tr><td colspan="11" style="text-align:center;padding:32px;color:var(--text-muted)">Nenhuma entrada encontrada</td></tr>';
        }

        return filtered.map(e => {
            const p = participants.find(pp => pp.id === e.participant);
            const g = groups.find(gg => gg.id === e.group);
            const profit = Utils.calcProfit(e);
            const stateMap = { executada: 'EXEC', indicada: 'INDIC', descartada: 'DESC' };
            return `
            <tr data-entry-id="${e.id}">
                <td>${Utils.formatDate(e.date)}</td>
                <td style="color:var(--text-primary);font-weight:600">${e.match || ''}</td>
                <td>${e.market || ''}</td>
                <td>${Number(e.odd || 0).toFixed(2)}</td>
                <td>${Number(e.units || 0).toFixed(1)}</td>
                <td><span class="badge badge-blue">${g ? g.name : ''}</span></td>
                <td>${p ? p.name : ''}</td>
                <td>${e.type === 'ao-vivo' ? 'AO VIVO' : 'PR'}</td>
                <td>${stateMap[e.state] || 'EXEC'}</td>
                <td><span class="entry-status ${Utils.getStatusClass(e.status)}">${Utils.getStatusLabel(e.status)}</span></td>
                <td style="font-weight:700;color:${profit >= 0 ? 'var(--green)' : profit < 0 ? 'var(--red)' : 'var(--text-muted)'}">${e.status === 'pendente' ? '-' : Utils.formatUnits(profit)}</td>
            </tr>`;
        }).join('');
    },

    // ==================== ANÁLISES ====================
    analises() {
        const analyses = DB.getAnalyses();
        const decisionLabels = { entrar: 'ENTRAR', aguardar: 'AGUARDAR', 'ao-vivo': 'AO VIVO', 'nao-entrar': 'NO ENTRAR' };
        const decisionClasses = { entrar: 'decision-entrar', aguardar: 'decision-aguardar', 'ao-vivo': 'decision-ao-vivo', 'nao-entrar': 'decision-nao-entrar' };

        return `
        <div class="analises-page">
            <div class="page-header">
                <div class="page-title">ANLISES</div>
                <div class="page-actions">
                    <button class="btn-nova-entrada" id="btn-nova-analise">+ NOVA ANLISE</button>
                </div>
            </div>

            ${!analyses.length ? '<div class="empty-state"><div class="empty-state-icon">&#128269;</div><div class="empty-state-text">Nenhuma anlise registrada</div><button class="btn-primary" id="btn-nova-analise-empty">+ NOVA ANLISE</button></div>' : ''}

            ${analyses.map(a => `
                <div class="analysis-card" data-analysis-id="${a.id}">
                    <div class="analysis-card-header">
                        <h3>${a.match || 'Sem jogo'}</h3>
                        <span class="analysis-decision ${decisionClasses[a.decision] || ''}">${decisionLabels[a.decision] || ''}</span>
                    </div>
                    <div class="analysis-meta">
                        <span>${Utils.formatDate(a.date)}</span>
                        <span>${a.championship || ''}</span>
                        <span>${a.market || ''}</span>
                        <span>Odd: ${Number(a.odd || 0).toFixed(2)}</span>
                        ${a.fairOdd ? `<span>Justa: ${Number(a.fairOdd).toFixed(2)}</span>` : ''}
                        ${a.probability ? `<span>Prob: ${a.probability}%</span>` : ''}
                    </div>
                    ${a.conclusion ? `<div style="margin-top:8px;font-size:0.72rem;color:var(--text-secondary)">${a.conclusion}</div>` : ''}
                </div>
            `).join('')}
        </div>`;
    },

    // ==================== FOMO ====================
    fomo() {
        const fomos = DB.getFomos();
        const totalFomos = fomos.length;
        const greens = fomos.filter(f => f.result === 'green');
        const reds = fomos.filter(f => f.result === 'red');
        const voids = fomos.filter(f => f.result === 'void');

        const unitsAvoided = reds.reduce((s, f) => s + (Number(f.units) || 0), 0);
        const unitsMissed = greens.reduce((s, f) => s + ((Number(f.units) || 0) * ((Number(f.odd) || 1) - 1)), 0);

        return `
        <div class="fomo-page">
            <div class="page-header">
                <div class="page-title">FOMO  ENTRADAS QUE DEIXAMOS PASSAR</div>
                <div class="page-actions">
                    <button class="btn-nova-entrada" id="btn-novo-fomo">+ REGISTRAR FOMO</button>
                </div>
            </div>

            <div class="fomo-summary">
                <div class="fomo-stat-card">
                    <div class="fomo-val" style="color:var(--accent-cyan)">${totalFomos}</div>
                    <div class="fomo-lab">TOTAL DE FOMOS</div>
                </div>
                <div class="fomo-stat-card">
                    <div class="fomo-val" style="color:var(--green)">${greens.length}</div>
                    <div class="fomo-lab">TERIAM SIDO GREEN</div>
                </div>
                <div class="fomo-stat-card">
                    <div class="fomo-val" style="color:var(--red)">${reds.length}</div>
                    <div class="fomo-lab">TERIAM SIDO RED</div>
                </div>
                <div class="fomo-stat-card">
                    <div class="fomo-val" style="color:var(--green)">${Utils.formatUnits(-unitsAvoided)}</div>
                    <div class="fomo-lab">FOMO EVITADO (hipottico)</div>
                </div>
                <div class="fomo-stat-card">
                    <div class="fomo-val" style="color:var(--yellow)">${Utils.formatUnits(unitsMissed)}</div>
                    <div class="fomo-lab">OPORTUNIDADES PERDIDAS (hipottico)</div>
                </div>
            </div>

            ${!fomos.length ? '<div class="empty-state"><div class="empty-state-icon">&#129300;</div><div class="empty-state-text">Nenhum FOMO registrado</div></div>' : ''}

            ${fomos.map(f => {
                let classification = 'PENDENTE';
                let classCSS = 'badge-yellow';
                if (f.result === 'red') { classification = 'FOMO EVITADO'; classCSS = 'badge-green'; }
                else if (f.result === 'green') { classification = 'OPORTUNIDADE PERDIDA'; classCSS = 'badge-yellow'; }
                else if (f.result === 'void') { classification = 'NEUTRO'; classCSS = 'badge-void'; }

                return `
                <div class="fomo-card">
                    <div class="fomo-card-header">
                        <h3>${f.match || 'Sem jogo'}</h3>
                        <span class="badge ${classCSS}">${classification}</span>
                    </div>
                    <div class="fomo-details">
                        <span>${f.market || ''}</span>
                        <span>Odd: ${Number(f.odd || 0).toFixed(2)}</span>
                        <span>${Number(f.units || 0).toFixed(1)}u pensadas</span>
                        <span>Vontade: ${f.desire || 3}/5</span>
                    </div>
                    ${f.reasonEnter ? `<div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:4px">Motivo de querer entrar: ${f.reasonEnter}</div>` : ''}
                    ${f.reasonSkip ? `<div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:4px">Motivo de NO entrar: ${f.reasonSkip}</div>` : ''}
                    ${f.lesson ? `<div class="fomo-lesson">${f.lesson}</div>` : ''}
                </div>`;
            }).join('')}
        </div>`;
    },

    // ==================== ESPECIALISTAS ====================
    especialistas() {
        const participants = DB.getParticipants();
        const entries = DB.getEntries().filter(e => e.state !== 'descartada');
        const groups = DB.getGroups();

        const conselhoMembers = participants.filter(p => p.group === 'conselho-rdt');

        return `
        <div>
            <div class="page-header">
                <div class="page-title">ESPECIALISTAS</div>
                <div class="page-actions">
                    <button class="btn-sm btn-secondary" id="btn-novo-grupo">+ NOVO GRUPO</button>
                    <button class="btn-nova-entrada" id="btn-novo-participante">+ NOVO PARTICIPANTE</button>
                </div>
            </div>

            <div style="margin-bottom:24px">
                <div style="font-size:0.75rem;font-weight:700;letter-spacing:1px;color:var(--accent-cyan);margin-bottom:12px">CONSELHO RDT</div>
                <div class="conselho-grid">
                    ${conselhoMembers.map(p => {
                        const pEntries = entries.filter(e => e.participant === p.id);
                        const phase = Utils.getPhase(pEntries);
                        const phaseClass = phase === 'good' ? 'phase-good' : phase === 'bad' ? 'phase-bad' : 'phase-neutral';
                        return `
                        <div class="conselho-member" data-participant-id="${p.id}">
                            <div class="conselho-avatar" style="background:${Utils.getAvatarColor(p.id)}">
                                ${p.avatar}
                                <span class="phase-indicator ${phaseClass}" style="position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;border:2px solid var(--bg-card)"></span>
                            </div>
                            <div class="conselho-name">${p.name}</div>
                            <div class="conselho-role">${p.alias || p.specialty || ''}</div>
                            <div class="conselho-mini-stats">${pEntries.length} entradas  ${Utils.formatPct(Utils.calcROI(pEntries))} ROI</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            ${groups.filter(g => g.id !== 'conselho-rdt').map(g => {
                const gParticipants = participants.filter(p => p.group === g.id);
                return `
                <div style="margin-bottom:24px">
                    <div style="font-size:0.75rem;font-weight:700;letter-spacing:1px;color:var(--accent-cyan);margin-bottom:12px">${g.name}</div>
                    ${gParticipants.length ? `
                    <div class="specialists-grid">
                        ${gParticipants.map(p => {
                            const pEntries = entries.filter(e => e.participant === p.id);
                            const units = Utils.calcTotalUnits(pEntries);
                            const roi = Utils.calcROI(pEntries);
                            const wr = Utils.calcWinRate(pEntries);
                            const phase = Utils.getPhase(pEntries);
                            return `
                            <div class="specialist-card" data-participant-id="${p.id}">
                                <div class="specialist-avatar" style="background:${Utils.getAvatarColor(p.id)}">
                                    ${p.avatar}
                                    <span class="phase-indicator phase-${phase}"></span>
                                </div>
                                <div class="specialist-name">${p.name}</div>
                                <div class="specialist-alias">${p.alias || p.specialty || ''}</div>
                                <div class="specialist-stats">
                                    <div class="specialist-stat"><div class="val">${pEntries.length}</div><div class="slab">ENTRADAS</div></div>
                                    <div class="specialist-stat"><div class="val" style="color:${roi >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatPct(roi)}</div><div class="slab">ROI</div></div>
                                    <div class="specialist-stat"><div class="val">${wr.toFixed(0)}%</div><div class="slab">ACERTO</div></div>
                                    <div class="specialist-stat"><div class="val" style="color:${units >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatUnits(units)}</div><div class="slab">UNID.</div></div>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>` : '<div style="font-size:0.75rem;color:var(--text-muted)">Nenhum participante neste grupo</div>'}
                </div>`;
            }).join('')}
        </div>`;
    },

    // ==================== PERFIL DO PARTICIPANTE ====================
    perfilParticipante(participantId) {
        const participants = DB.getParticipants();
        const p = participants.find(pp => pp.id === participantId);
        if (!p) return '<div class="empty-state"><div class="empty-state-text">Participante no encontrado</div></div>';

        const entries = DB.getEntries().filter(e => e.participant === p.id && e.state !== 'descartada');
        const group = DB.getGroups().find(g => g.id === p.group);
        const greens = entries.filter(e => e.status === 'green').length;
        const reds = entries.filter(e => e.status === 'red').length;
        const voidsCount = entries.filter(e => e.status === 'void').length;
        const pending = entries.filter(e => e.status === 'pendente').length;
        const units = Utils.calcTotalUnits(entries);
        const roi = Utils.calcROI(entries);
        const avgOdd = Utils.calcAvgOdd(entries);
        const wr = Utils.calcWinRate(entries);

        const marketPerf = {};
        for (const e of entries.filter(e => e.market && e.status !== 'pendente')) {
            if (!marketPerf[e.market]) marketPerf[e.market] = [];
            marketPerf[e.market].push(e);
        }
        const bestMarkets = Object.entries(marketPerf)
            .map(([m, list]) => ({ market: m, roi: Utils.calcROI(list), count: list.length }))
            .filter(m => m.count >= 2)
            .sort((a, b) => b.roi - a.roi)
            .slice(0, 5);

        return `
        <div>
            <div style="margin-bottom:12px"><button class="btn-sm btn-secondary" onclick="App.navigate('especialistas')">&#8592; Voltar</button></div>
            <div class="profile-header">
                <div class="profile-avatar" style="background:${Utils.getAvatarColor(p.id)}">${p.avatar}</div>
                <div class="profile-info">
                    <h2>${p.name}</h2>
                    <div class="profile-alias">${p.alias || ''}</div>
                    <div class="profile-group">${group ? group.name : ''} ${p.specialty ? ' ' + p.specialty : ''}</div>
                </div>
                <div class="profile-stats">
                    <div class="profile-stat"><div class="pval">${entries.length}</div><div class="plab">ENTRADAS</div></div>
                    <div class="profile-stat"><div class="pval" style="color:var(--green)">${greens}</div><div class="plab">GREENS</div></div>
                    <div class="profile-stat"><div class="pval" style="color:var(--red)">${reds}</div><div class="plab">REDS</div></div>
                    <div class="profile-stat"><div class="pval" style="color:var(--void-gray)">${voidsCount}</div><div class="plab">VOIDS</div></div>
                    <div class="profile-stat"><div class="pval" style="color:${roi >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatPct(roi)}</div><div class="plab">ROI</div></div>
                    <div class="profile-stat"><div class="pval" style="color:${units >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatUnits(units)}</div><div class="plab">UNID.</div></div>
                    <div class="profile-stat"><div class="pval">${avgOdd.toFixed(2)}</div><div class="plab">ODD MD.</div></div>
                    <div class="profile-stat"><div class="pval accent">${wr.toFixed(0)}%</div><div class="plab">ACERTO</div></div>
                </div>
            </div>
            ${Utils.isSmallSample(entries.length) ? '<div class="insight-card insight-small-sample" style="margin-bottom:12px"><span class="insight-icon">&#9888;</span><span>AMOSTRA PEQUENA  Resultados podem no ser conclusivos</span></div>' : ''}

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div class="main-panel">
                    <div class="panel-header"><div class="panel-title">EVOLUO</div></div>
                    <div class="panel-body"><div class="chart-container"><canvas id="profile-chart"></canvas></div></div>
                </div>
                <div>
                    <div style="font-size:0.65rem;color:var(--text-muted);letter-spacing:1px;margin-bottom:8px">MELHORES MERCADOS</div>
                    ${bestMarkets.map(m => `
                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.75rem">
                            <span style="color:var(--text-secondary)">${m.market}</span>
                            <span style="font-weight:700;color:${m.roi >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatPct(m.roi)} (${m.count})</span>
                        </div>
                    `).join('')}

                    <div style="font-size:0.65rem;color:var(--text-muted);letter-spacing:1px;margin:16px 0 8px">LTIMAS ENTRADAS</div>
                    ${entries.slice(0, 8).map(e => `
                        <div class="entry-card" data-entry-id="${e.id}">
                            <div class="entry-info">
                                <div class="entry-match">${e.match || ''}</div>
                                <div class="entry-details">
                                    <span>${e.market || ''}</span>
                                    <span>Odd ${Number(e.odd || 0).toFixed(2)}</span>
                                    <span>${Number(e.units || 0).toFixed(1)}u</span>
                                </div>
                            </div>
                            <div class="entry-status ${Utils.getStatusClass(e.status)}">${Utils.getStatusLabel(e.status)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>`;
    },

    // ==================== RANKING ====================
    ranking() {
        const entries = DB.getEntries().filter(e => e.state !== 'descartada');
        const groups = DB.getGroups();
        const participants = DB.getParticipants();

        const groupRanking = groups.map(g => {
            const gEntries = entries.filter(e => e.group === g.id);
            return {
                name: g.name,
                entries: gEntries.length,
                greens: gEntries.filter(e => e.status === 'green').length,
                reds: gEntries.filter(e => e.status === 'red').length,
                voids: gEntries.filter(e => e.status === 'void').length,
                roi: Utils.calcROI(gEntries),
                units: Utils.calcTotalUnits(gEntries),
                winRate: Utils.calcWinRate(gEntries),
                avgOdd: Utils.calcAvgOdd(gEntries)
            };
        }).sort((a, b) => b.units - a.units);

        const participantRanking = participants.map(p => {
            const pEntries = entries.filter(e => e.participant === p.id);
            const group = groups.find(g => g.id === p.group);
            return {
                id: p.id,
                name: p.name,
                alias: p.alias,
                avatar: p.avatar,
                group: group ? group.name : '',
                entries: pEntries.length,
                greens: pEntries.filter(e => e.status === 'green').length,
                reds: pEntries.filter(e => e.status === 'red').length,
                roi: Utils.calcROI(pEntries),
                units: Utils.calcTotalUnits(pEntries),
                winRate: Utils.calcWinRate(pEntries)
            };
        }).filter(p => p.entries > 0).sort((a, b) => b.units - a.units);

        return `
        <div class="ranking-page">
            <div class="page-header">
                <div class="page-title">RANKING RDT</div>
            </div>

            <div class="ranking-section">
                <div class="ranking-section-header"><h3>RANKING DE GRUPOS</h3></div>
                ${groupRanking.map((g, i) => `
                    <div class="ranking-row">
                        <div class="ranking-pos ${i === 0 ? 'first' : i === 1 ? 'second' : i === 2 ? 'third' : ''}">${i + 1}</div>
                        <div class="ranking-info">
                            <div class="ranking-name">${g.name}</div>
                            <div class="ranking-sub">${g.entries} apostas  ${g.greens}G / ${g.reds}R / ${g.voids}V</div>
                        </div>
                        <div class="ranking-stats">
                            <div class="ranking-stat"><div class="rval" style="color:${g.units >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatUnits(g.units)}</div><div class="rlab">UNID.</div></div>
                            <div class="ranking-stat"><div class="rval" style="color:${g.roi >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatPct(g.roi)}</div><div class="rlab">ROI</div></div>
                            <div class="ranking-stat"><div class="rval">${g.winRate.toFixed(0)}%</div><div class="rlab">ACERTO</div></div>
                            <div class="ranking-stat"><div class="rval">${g.avgOdd.toFixed(2)}</div><div class="rlab">ODD MD.</div></div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="ranking-section">
                <div class="ranking-section-header"><h3>RANKING INDIVIDUAL</h3></div>
                ${participantRanking.map((p, i) => `
                    <div class="ranking-row" style="cursor:pointer" data-participant-id="${p.id}">
                        <div class="ranking-pos ${i === 0 ? 'first' : i === 1 ? 'second' : i === 2 ? 'third' : ''}">${i + 1}</div>
                        <div class="entry-avatar" style="background:${Utils.getAvatarColor(p.id)};width:32px;height:32px;font-size:0.65rem">${p.avatar}</div>
                        <div class="ranking-info">
                            <div class="ranking-name">${p.name}</div>
                            <div class="ranking-sub">${p.group}  ${p.entries} apostas  ${p.greens}G / ${p.reds}R</div>
                        </div>
                        <div class="ranking-stats">
                            <div class="ranking-stat"><div class="rval" style="color:${p.units >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatUnits(p.units)}</div><div class="rlab">UNID.</div></div>
                            <div class="ranking-stat"><div class="rval" style="color:${p.roi >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatPct(p.roi)}</div><div class="rlab">ROI</div></div>
                            <div class="ranking-stat"><div class="rval">${p.winRate.toFixed(0)}%</div><div class="rlab">ACERTO</div></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    },

    // ==================== MERCADOS ====================
    mercados() {
        const entries = DB.getEntries().filter(e => e.state !== 'descartada' && e.market);
        const marketMap = {};
        for (const e of entries) {
            const m = e.market.toLowerCase().trim();
            if (!marketMap[m]) marketMap[m] = { name: e.market, entries: [] };
            marketMap[m].entries.push(e);
        }

        const markets = Object.values(marketMap)
            .map(m => ({
                name: m.name,
                count: m.entries.length,
                roi: Utils.calcROI(m.entries),
                units: Utils.calcTotalUnits(m.entries),
                winRate: Utils.calcWinRate(m.entries),
                avgOdd: Utils.calcAvgOdd(m.entries)
            }))
            .sort((a, b) => b.units - a.units);

        const champMap = {};
        for (const e of entries.filter(e => e.championship)) {
            const c = e.championship;
            if (!champMap[c]) champMap[c] = [];
            champMap[c].push(e);
        }
        const championships = Object.entries(champMap)
            .map(([name, list]) => ({ name, units: Utils.calcTotalUnits(list), count: list.length, roi: Utils.calcROI(list) }))
            .sort((a, b) => b.units - a.units);

        return `
        <div>
            <div class="page-header">
                <div class="page-title">ONDE GANHAMOS?</div>
            </div>

            <div class="tabs-row">
                <button class="tab-btn active" data-mercado-tab="mercados">MERCADOS</button>
                <button class="tab-btn" data-mercado-tab="campeonatos">CAMPEONATOS</button>
                <button class="tab-btn" data-mercado-tab="odds">FAIXAS DE ODDS</button>
                <button class="tab-btn" data-mercado-tab="drawdown">DRAWDOWN</button>
                <button class="tab-btn" data-mercado-tab="comparacao">REAL X HIPOTTICO</button>
            </div>

            <div id="mercado-content">
                ${this._renderMercadosTab(markets)}
            </div>
        </div>`;
    },

    _renderMercadosTab(markets) {
        return `
        <div class="mercados-grid">
            ${markets.map(m => `
                <div class="mercado-card">
                    <h3>${m.name}</h3>
                    <div class="mercado-stats">
                        <div class="mercado-stat"><div class="mval">${m.count}</div><div class="mlab">APOSTAS</div></div>
                        <div class="mercado-stat"><div class="mval" style="color:${m.roi >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatPct(m.roi)}</div><div class="mlab">ROI</div></div>
                        <div class="mercado-stat"><div class="mval" style="color:${m.units >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatUnits(m.units)}</div><div class="mlab">UNID.</div></div>
                        <div class="mercado-stat"><div class="mval">${m.winRate.toFixed(0)}%</div><div class="mlab">ACERTO</div></div>
                        <div class="mercado-stat"><div class="mval">${m.avgOdd.toFixed(2)}</div><div class="mlab">ODD MD.</div></div>
                    </div>
                </div>
            `).join('')}
            ${!markets.length ? '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-text">Nenhum mercado registrado</div></div>' : ''}
        </div>`;
    },

    _renderCampeonatosTab() {
        const entries = DB.getEntries().filter(e => e.state !== 'descartada' && e.championship);
        const champMap = {};
        for (const e of entries) {
            if (!champMap[e.championship]) champMap[e.championship] = [];
            champMap[e.championship].push(e);
        }
        const list = Object.entries(champMap)
            .map(([name, arr]) => ({ name, units: Utils.calcTotalUnits(arr), count: arr.length, roi: Utils.calcROI(arr) }))
            .sort((a, b) => b.units - a.units);

        return `<div class="ranking-section">
            ${list.map((c, i) => `
                <div class="ranking-row">
                    <div class="ranking-pos ${i < 3 ? ['first','second','third'][i] : ''}">${i + 1}</div>
                    <div class="ranking-info"><div class="ranking-name">${c.name}</div><div class="ranking-sub">${c.count} apostas</div></div>
                    <div class="ranking-stats">
                        <div class="ranking-stat"><div class="rval" style="color:${c.units >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatUnits(c.units)}</div><div class="rlab">UNID.</div></div>
                        <div class="ranking-stat"><div class="rval" style="color:${c.roi >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatPct(c.roi)}</div><div class="rlab">ROI</div></div>
                    </div>
                </div>
            `).join('')}
            ${!list.length ? '<div style="padding:24px;text-align:center;color:var(--text-muted)">Nenhum campeonato registrado</div>' : ''}
        </div>`;
    },

    _renderOddsTab() {
        const entries = DB.getEntries().filter(e => e.state !== 'descartada');
        const ranges = ['1.01-1.49', '1.50-1.69', '1.70-1.89', '1.90-2.19', '2.20-2.99', '3.00+'];
        return `<div class="mercados-grid">
            ${ranges.map(r => {
                const rEntries = entries.filter(e => Utils.getOddRange(e.odd) === r && (e.status === 'green' || e.status === 'red'));
                const all = entries.filter(e => Utils.getOddRange(e.odd) === r);
                return `<div class="mercado-card">
                    <h3>${r}</h3>
                    <div class="mercado-stats">
                        <div class="mercado-stat"><div class="mval">${all.length}</div><div class="mlab">APOSTAS</div></div>
                        <div class="mercado-stat"><div class="mval" style="color:${Utils.calcROI(rEntries) >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatPct(Utils.calcROI(rEntries))}</div><div class="mlab">ROI</div></div>
                        <div class="mercado-stat"><div class="mval" style="color:${Utils.calcTotalUnits(rEntries) >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatUnits(Utils.calcTotalUnits(rEntries))}</div><div class="mlab">UNID.</div></div>
                        <div class="mercado-stat"><div class="mval">${Utils.calcWinRate(rEntries).toFixed(0)}%</div><div class="mlab">ACERTO</div></div>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    },

    _renderDrawdownTab() {
        const entries = DB.getEntries().filter(e => e.state !== 'descartada');
        const dd = Utils.calcDrawdown(entries);
        const streaks = Utils.calcStreaks(entries);
        const daily = {};
        for (const e of entries.filter(e => e.date && e.status !== 'pendente')) {
            if (!daily[e.date]) daily[e.date] = 0;
            daily[e.date] += Utils.calcProfit(e);
        }
        const days = Object.entries(daily);
        const bestDay = days.length ? days.reduce((a, b) => a[1] > b[1] ? a : b) : null;
        const worstDay = days.length ? days.reduce((a, b) => a[1] < b[1] ? a : b) : null;

        return `
        <div class="drawdown-stats" style="margin-bottom:16px">
            <div class="stat-card"><div class="stat-label">DRAWDOWN ATUAL</div><div class="stat-value negative">${dd.current.toFixed(2)}u</div></div>
            <div class="stat-card"><div class="stat-label">DRAWDOWN MXIMO</div><div class="stat-value negative">${dd.max.toFixed(2)}u</div></div>
            <div class="stat-card"><div class="stat-label">MAIOR SEQUNCIA GREENS</div><div class="stat-value positive">${streaks.maxGreen}</div></div>
            <div class="stat-card"><div class="stat-label">MAIOR SEQUNCIA REDS</div><div class="stat-value negative">${streaks.maxRed}</div></div>
            ${bestDay ? `<div class="stat-card"><div class="stat-label">MELHOR DIA</div><div class="stat-value positive">${Utils.formatUnits(bestDay[1])}</div><div class="stat-sub">${Utils.formatDate(bestDay[0])}</div></div>` : ''}
            ${worstDay ? `<div class="stat-card"><div class="stat-label">PIOR DIA</div><div class="stat-value negative">${Utils.formatUnits(worstDay[1])}</div><div class="stat-sub">${Utils.formatDate(worstDay[0])}</div></div>` : ''}
        </div>
        <div class="main-panel"><div class="panel-header"><div class="panel-title">DRAWDOWN</div></div><div class="panel-body"><div class="chart-container"><canvas id="drawdown-chart"></canvas></div></div></div>`;
    },

    _renderComparacaoTab() {
        const entries = DB.getEntries().filter(e => e.state === 'executada' || !e.state);
        const fomos = DB.getFomos();
        const realUnits = Utils.calcTotalUnits(entries);
        const fomoGreenUnits = fomos.filter(f => f.result === 'green').reduce((s, f) => s + ((Number(f.units) || 0) * ((Number(f.odd) || 1) - 1)), 0);
        const fomoRedUnits = fomos.filter(f => f.result === 'red').reduce((s, f) => s + (Number(f.units) || 0), 0);
        const fomoUnits = fomoGreenUnits - fomoRedUnits;

        return `
        <div style="font-size:0.65rem;color:var(--text-muted);letter-spacing:1px;margin-bottom:12px">O QUE ACONTECEU X O QUE PODERIA TER ACONTECIDO</div>
        <div class="comparison-grid">
            <div class="comparison-block">
                <h3>APOSTAS REALIZADAS</h3>
                <div class="comparison-val" style="color:${realUnits >= 0 ? 'var(--green)' : 'var(--red)'}">${Utils.formatUnits(realUnits)}</div>
                <div class="comparison-sub">Resultado real</div>
            </div>
            <div class="comparison-block">
                <h3>FOMOS NO REALIZADOS</h3>
                <div class="comparison-val" style="color:${fomoUnits >= 0 ? 'var(--yellow)' : 'var(--text-muted)'}">${Utils.formatUnits(fomoUnits)}</div>
                <div class="comparison-sub">Resultado hipottico</div>
            </div>
            <div class="comparison-block">
                <h3>SALDO SE TIVESSE ENTRADO</h3>
                <div class="comparison-val" style="color:var(--text-muted)">${Utils.formatUnits(realUnits + fomoUnits)}</div>
                <div class="comparison-sub">Hipottico  No confundir com resultado real</div>
            </div>
        </div>`;
    },

    // ==================== CALENDÁRIO ====================
    calendario() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const entries = DB.getEntries();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthNames = ['Janeiro','Fevereiro','Maro','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

        let cells = '';
        for (let i = 0; i < firstDay; i++) cells += '<div class="cal-day"><div class="day-empty"></div></div>';
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEntries = entries.filter(e => e.date === dateStr);
            const isToday = d === now.getDate();
            const dayUnits = Utils.calcTotalUnits(dayEntries);
            const g = dayEntries.filter(e => e.status === 'green').length;
            const r = dayEntries.filter(e => e.status === 'red').length;

            cells += `<div class="cal-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                <div class="day-num">${d}</div>
                ${dayEntries.length ? `<div class="day-summary" style="color:${dayUnits >= 0 ? 'var(--green)' : 'var(--red)'}">
                    ${Utils.formatUnits(dayUnits)}<br>${g}G / ${r}R
                </div>` : ''}
            </div>`;
        }

        return `
        <div>
            <div class="page-header">
                <div class="page-title">CALENDRIO RDT  ${monthNames[month]} ${year}</div>
            </div>
            <div class="calendar-grid">
                <div class="cal-header">DOM</div>
                <div class="cal-header">SEG</div>
                <div class="cal-header">TER</div>
                <div class="cal-header">QUA</div>
                <div class="cal-header">QUI</div>
                <div class="cal-header">SEX</div>
                <div class="cal-header">SB</div>
                ${cells}
            </div>
        </div>`;
    },

    // ==================== DIÁRIO DH ====================
    diario() {
        const diary = DB.getDiary();

        return `
        <div>
            <div class="page-header">
                <div class="page-title">DIRIO DH</div>
                <div class="page-actions">
                    <button class="btn-nova-entrada" id="btn-nova-anotacao">+ NOVA ANOTAO</button>
                </div>
            </div>

            ${!diary.length ? '<div class="empty-state"><div class="empty-state-icon">&#128221;</div><div class="empty-state-text">Nenhuma anotao no dirio</div></div>' : ''}

            ${diary.map(d => `
                <div class="diary-entry">
                    <div class="diary-time">${Utils.formatDateTime(d.createdAt)}</div>
                    <div class="diary-text">${d.note}</div>
                    ${d.related ? `<div class="diary-related">Relacionado: ${d.related}</div>` : ''}
                </div>
            `).join('')}
        </div>`;
    },

    // ==================== PESQUISA ====================
    pesquisa() {
        return `
        <div>
            <div class="page-header">
                <div class="page-title">PESQUISA GLOBAL</div>
            </div>
            <div class="filter-bar">
                <input type="text" class="search-input" id="global-search" placeholder="Pesquisar em tudo: jogos, mercados, participantes, anlises..." style="flex:1;min-width:300px" autofocus>
            </div>
            <div id="search-results"></div>
        </div>`;
    },

    _renderSearchResults(query) {
        if (!query || query.length < 2) return '';
        const q = query.toLowerCase();
        const results = [];

        const entries = DB.getEntries();
        const participants = DB.getParticipants();
        const analyses = DB.getAnalyses();
        const fomos = DB.getFomos();
        const diary = DB.getDiary();

        for (const e of entries) {
            if ((e.match || '').toLowerCase().includes(q) || (e.market || '').toLowerCase().includes(q) || (e.championship || '').toLowerCase().includes(q) || (e.tags || '').toLowerCase().includes(q)) {
                results.push({ type: 'APOSTA', title: e.match || 'Sem jogo', sub: `${e.market || ''} - ${Utils.formatDate(e.date)}`, id: e.id, category: 'entry' });
            }
        }

        for (const p of participants) {
            if (p.name.toLowerCase().includes(q) || (p.alias || '').toLowerCase().includes(q)) {
                results.push({ type: 'PARTICIPANTE', title: p.name, sub: p.alias || p.group, id: p.id, category: 'participant' });
            }
        }

        for (const a of analyses) {
            if ((a.match || '').toLowerCase().includes(q) || (a.market || '').toLowerCase().includes(q)) {
                results.push({ type: 'ANLISE', title: a.match || 'Sem jogo', sub: `${a.market || ''} - ${Utils.formatDate(a.date)}`, id: a.id, category: 'analysis' });
            }
        }

        for (const f of fomos) {
            if ((f.match || '').toLowerCase().includes(q) || (f.market || '').toLowerCase().includes(q)) {
                results.push({ type: 'FOMO', title: f.match || 'Sem jogo', sub: `${f.market || ''}`, id: f.id, category: 'fomo' });
            }
        }

        for (const d of diary) {
            if ((d.note || '').toLowerCase().includes(q)) {
                results.push({ type: 'DIRIO', title: d.note.substring(0, 60) + '...', sub: Utils.formatDateTime(d.createdAt), id: d.id, category: 'diary' });
            }
        }

        if (!results.length) return '<div class="empty-state"><div class="empty-state-text">Nenhum resultado encontrado</div></div>';

        return `<div class="search-results">
            ${results.slice(0, 30).map(r => `
                <div class="search-result" data-result-type="${r.category}" data-result-id="${r.id}">
                    <div class="search-result-type">${r.type}</div>
                    <div class="search-result-title">${r.title}</div>
                    <div class="search-result-sub">${r.sub}</div>
                </div>
            `).join('')}
        </div>`;
    }
};

const App = {
    currentPage: 'dashboard',
    currentParticipant: null,
    sideGroupFilter: 'todos',
    sidePeriodFilter: 'todos',

    init() {
        this.bindNav();
        this.bindModals();
        this.bindHeader();
        this.bindFormActions();
        this.navigate('dashboard');
        this.updateTicker();
        this.updateBancaDisplay();
    },

    navigate(page, data) {
        this.currentPage = page;
        const main = document.getElementById('main-content');

        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.toggle('active', n.dataset.page === page);
        });

        let html = '';
        switch (page) {
            case 'dashboard': html = Pages.dashboard(); break;
            case 'central-dia': html = Pages.centralDia(); break;
            case 'entradas': html = Pages.entradas(); break;
            case 'analises': html = Pages.analises(); break;
            case 'fomo': html = Pages.fomo(); break;
            case 'especialistas': html = Pages.especialistas(); break;
            case 'ranking': html = Pages.ranking(); break;
            case 'mercados': html = Pages.mercados(); break;
            case 'calendario': html = Pages.calendario(); break;
            case 'diario': html = Pages.diario(); break;
            case 'pesquisa': html = Pages.pesquisa(); break;
            case 'perfil': html = Pages.perfilParticipante(data); break;
            default: html = Pages.dashboard();
        }

        main.innerHTML = html;
        this.bindPageEvents(page);
        this.initCharts(page);
        main.scrollTop = 0;
    },

    bindNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(item.dataset.page);
            });
        });
    },

    bindHeader() {
        document.getElementById('btn-nova-entrada').addEventListener('click', () => this.openModal('modal-nova-entrada'));
        document.getElementById('btn-entrada-rapida').addEventListener('click', () => this.openModal('modal-entrada-rapida'));
        document.querySelector('.banca-display').addEventListener('click', () => {
            const banca = DB.getBanca();
            document.getElementById('banca-initial').value = banca.initial;
            document.getElementById('banca-unit').value = banca.unitValue;
            this.openModal('modal-banca');
        });
    },

    bindModals() {
        document.querySelectorAll('.modal-close, [data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.close || btn.closest('.modal-overlay').id;
                this.closeModal(id);
            });
        });
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal.id);
            });
        });

        document.querySelectorAll('.confidence-selector').forEach(sel => {
            sel.querySelectorAll('.conf-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    sel.querySelectorAll('.conf-dot').forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                });
            });
        });
    },

    bindFormActions() {
        document.getElementById('btn-save-entry').addEventListener('click', () => this.saveEntry());
        document.getElementById('btn-quick-save').addEventListener('click', () => this.saveQuickEntry());
        document.getElementById('btn-save-fomo').addEventListener('click', () => this.saveFomo());
        document.getElementById('btn-save-analysis').addEventListener('click', () => this.saveAnalysis());
        document.getElementById('btn-save-diary').addEventListener('click', () => this.saveDiary());
        document.getElementById('btn-save-banca').addEventListener('click', () => this.saveBanca());
        document.getElementById('btn-save-participant').addEventListener('click', () => this.saveParticipant());
        document.getElementById('btn-save-group').addEventListener('click', () => this.saveGroup());
    },

    bindPageEvents(page) {
        // Entry clicks
        document.querySelectorAll('[data-entry-id]').forEach(el => {
            el.addEventListener('click', () => this.showEntryDetail(el.dataset.entryId));
        });

        // Participant clicks
        document.querySelectorAll('[data-participant-id]').forEach(el => {
            el.addEventListener('click', () => this.navigate('perfil', el.dataset.participantId));
        });

        if (page === 'dashboard') {
            // Chart tabs
            document.querySelectorAll('[data-chart]').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('[data-chart]').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    const entries = DB.getEntries().filter(e => e.state !== 'descartada');
                    Charts.evolutionChart('main-chart', entries, tab.dataset.chart);
                });
            });

            // Side panel filters
            document.querySelectorAll('[data-side-filter]').forEach(chip => {
                chip.addEventListener('click', () => {
                    document.querySelectorAll('[data-side-filter]').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    this.sideGroupFilter = chip.dataset.sideFilter;
                    this.updateSidePanel();
                });
            });
            document.querySelectorAll('[data-side-period]').forEach(chip => {
                chip.addEventListener('click', () => {
                    document.querySelectorAll('[data-side-period]').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    this.sidePeriodFilter = chip.dataset.sidePeriod;
                    this.updateSidePanel();
                });
            });
        }

        if (page === 'entradas') {
            document.getElementById('btn-nova-entrada-page')?.addEventListener('click', () => this.openModal('modal-nova-entrada'));

            const filterHandler = () => {
                const filters = {
                    search: document.getElementById('entry-search')?.value || '',
                    group: document.getElementById('filter-group')?.value || '',
                    participant: document.getElementById('filter-participant')?.value || '',
                    status: document.getElementById('filter-status')?.value || '',
                    type: document.getElementById('filter-type')?.value || '',
                    state: document.getElementById('filter-state')?.value || ''
                };
                const tbody = document.getElementById('entries-tbody');
                if (tbody) {
                    tbody.innerHTML = Pages._renderEntriesTable(DB.getEntries(), DB.getParticipants(), DB.getGroups(), filters);
                    tbody.querySelectorAll('[data-entry-id]').forEach(el => {
                        el.addEventListener('click', () => this.showEntryDetail(el.dataset.entryId));
                    });
                }
            };

            ['entry-search', 'filter-group', 'filter-participant', 'filter-status', 'filter-type', 'filter-state'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', filterHandler);
            });

            document.getElementById('btn-export-entries')?.addEventListener('click', () => this.exportCSV());

            // Table sort
            document.querySelectorAll('[data-sort]').forEach(th => {
                th.addEventListener('click', () => {
                    // Simple sort toggle - re-render would be needed for full impl
                    Utils.toast('Ordenao aplicada', 'info');
                });
            });
        }

        if (page === 'analises') {
            document.getElementById('btn-nova-analise')?.addEventListener('click', () => this.openModal('modal-analise'));
            document.getElementById('btn-nova-analise-empty')?.addEventListener('click', () => this.openModal('modal-analise'));
        }

        if (page === 'fomo') {
            document.getElementById('btn-novo-fomo')?.addEventListener('click', () => this.openModal('modal-fomo'));
        }

        if (page === 'especialistas') {
            document.getElementById('btn-novo-participante')?.addEventListener('click', () => this.openModal('modal-participante'));
            document.getElementById('btn-novo-grupo')?.addEventListener('click', () => this.openModal('modal-grupo'));
        }

        if (page === 'diario') {
            document.getElementById('btn-nova-anotacao')?.addEventListener('click', () => this.openModal('modal-diario'));
        }

        if (page === 'pesquisa') {
            document.getElementById('global-search')?.addEventListener('input', (e) => {
                const results = document.getElementById('search-results');
                if (results) results.innerHTML = Pages._renderSearchResults(e.target.value);
                // Rebind search result clicks
                document.querySelectorAll('.search-result').forEach(r => {
                    r.addEventListener('click', () => {
                        const type = r.dataset.resultType;
                        const id = r.dataset.resultId;
                        if (type === 'entry') this.showEntryDetail(id);
                        else if (type === 'participant') this.navigate('perfil', id);
                        else if (type === 'analysis') this.navigate('analises');
                        else if (type === 'fomo') this.navigate('fomo');
                    });
                });
            });
        }

        if (page === 'mercados') {
            document.querySelectorAll('[data-mercado-tab]').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('[data-mercado-tab]').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    const content = document.getElementById('mercado-content');
                    switch (tab.dataset.mercadoTab) {
                        case 'mercados':
                            const entries = DB.getEntries().filter(e => e.state !== 'descartada' && e.market);
                            const mMap = {};
                            for (const e of entries) {
                                const m = e.market.toLowerCase().trim();
                                if (!mMap[m]) mMap[m] = { name: e.market, entries: [] };
                                mMap[m].entries.push(e);
                            }
                            const markets = Object.values(mMap).map(m => ({ name: m.name, count: m.entries.length, roi: Utils.calcROI(m.entries), units: Utils.calcTotalUnits(m.entries), winRate: Utils.calcWinRate(m.entries), avgOdd: Utils.calcAvgOdd(m.entries) })).sort((a, b) => b.units - a.units);
                            content.innerHTML = Pages._renderMercadosTab(markets);
                            break;
                        case 'campeonatos': content.innerHTML = Pages._renderCampeonatosTab(); break;
                        case 'odds': content.innerHTML = Pages._renderOddsTab(); break;
                        case 'drawdown':
                            content.innerHTML = Pages._renderDrawdownTab();
                            Charts.drawdownChart('drawdown-chart', DB.getEntries().filter(e => e.state !== 'descartada'));
                            break;
                        case 'comparacao': content.innerHTML = Pages._renderComparacaoTab(); break;
                    }
                });
            });
        }

        if (page === 'central-dia') {
            document.getElementById('btn-encerrar-dia')?.addEventListener('click', () => this.encerrarDia());
        }
    },

    initCharts(page) {
        const entries = DB.getEntries().filter(e => e.state !== 'descartada');
        if (page === 'dashboard') {
            setTimeout(() => {
                Charts.evolutionChart('main-chart', entries, 'unidades');
                Charts.groupPerformanceChart('group-chart', entries);
                Charts.resultDistributionChart('dist-chart', entries);
                Charts.participantROIChart('roi-chart', entries);
                Charts.oddRangeChart('odds-chart', entries);
            }, 100);
        }
        if (page === 'central-dia') {
            setTimeout(() => {
                const todayEntries = Utils.filterByPeriod(entries, 'hoje');
                Charts.evolutionChart('central-chart', todayEntries, 'unidades');
            }, 100);
        }
        if (page === 'perfil') {
            setTimeout(() => {
                const pEntries = entries.filter(e => e.participant === this.currentParticipant);
                Charts.evolutionChart('profile-chart', pEntries, 'unidades');
            }, 100);
        }
    },

    updateSidePanel() {
        const entries = DB.getEntries().filter(e => e.state !== 'descartada');
        const sideEl = document.getElementById('side-entries');
        if (sideEl) {
            sideEl.innerHTML = Pages._renderSideEntries(entries, this.sideGroupFilter, this.sidePeriodFilter);
            sideEl.querySelectorAll('[data-entry-id]').forEach(el => {
                el.addEventListener('click', () => this.showEntryDetail(el.dataset.entryId));
            });
        }
    },

    openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.add('show');
        this.populateDropdowns(id);

        if (id === 'modal-nova-entrada') {
            document.getElementById('entry-date').value = Utils.today();
            document.getElementById('entry-time').value = new Date().toTimeString().slice(0, 5);
        }
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('show');
    },

    populateDropdowns(modalId) {
        const groups = DB.getGroups();
        const participants = DB.getParticipants();

        const groupSelects = ['entry-group', 'quick-group', 'fomo-group', 'part-group'];
        groupSelects.forEach(selId => {
            const sel = document.getElementById(selId);
            if (!sel) return;
            sel.innerHTML = groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
        });

        const partSelect = document.getElementById('entry-participant');
        if (partSelect) {
            const updateParticipants = () => {
                const groupId = document.getElementById('entry-group')?.value;
                const filtered = groupId ? participants.filter(p => p.group === groupId) : participants;
                partSelect.innerHTML = filtered.map(p => `<option value="${p.id}">${p.name}</option>`).join('') + '<option value="">Sem participante</option>';
            };
            updateParticipants();
            document.getElementById('entry-group')?.addEventListener('change', updateParticipants);
        }
    },

    saveEntry() {
        const entry = {
            date: document.getElementById('entry-date').value,
            time: document.getElementById('entry-time').value,
            sport: document.getElementById('entry-sport').value,
            championship: document.getElementById('entry-championship').value,
            match: document.getElementById('entry-match').value,
            type: document.getElementById('entry-type').value,
            group: document.getElementById('entry-group').value,
            participant: document.getElementById('entry-participant').value,
            market: document.getElementById('entry-market').value,
            selection: document.getElementById('entry-selection').value,
            odd: document.getElementById('entry-odd').value,
            units: document.getElementById('entry-units').value,
            value: document.getElementById('entry-value').value,
            status: document.getElementById('entry-status').value,
            state: document.getElementById('entry-state').value,
            confidence: document.querySelector('#entry-confidence .conf-dot.active')?.dataset.val || '3',
            oddAnalyzed: document.getElementById('entry-odd-analyzed').value,
            oddBest: document.getElementById('entry-odd-best').value,
            oddClosing: document.getElementById('entry-odd-closing').value,
            analysis: document.getElementById('entry-analysis').value,
            tags: document.getElementById('entry-tags').value,
            link: document.getElementById('entry-link').value,
            attention: document.getElementById('entry-attention').checked
        };

        if (!entry.match) {
            Utils.toast('Informe o jogo/evento', 'error');
            return;
        }

        // Duplicate check
        const dupes = Utils.detectDuplicates(entry, DB.getEntries());
        if (dupes.length) {
            if (!confirm(`Possvel entrada duplicada detectada!\n\nJ existe: ${dupes[0].match} - ${dupes[0].market}\n\nDeseja registrar mesmo assim?`)) {
                return;
            }
        }

        DB.addEntry(entry);
        this.closeModal('modal-nova-entrada');
        this.clearForm('modal-nova-entrada');
        Utils.toast('Entrada registrada com sucesso!');
        this.updateTicker();
        this.updateBancaDisplay();
        this.navigate(this.currentPage);
    },

    saveQuickEntry() {
        const entry = {
            date: Utils.today(),
            time: new Date().toTimeString().slice(0, 5),
            match: document.getElementById('quick-match').value,
            market: document.getElementById('quick-market').value,
            odd: document.getElementById('quick-odd').value,
            units: document.getElementById('quick-units').value,
            group: document.getElementById('quick-group').value,
            status: 'pendente',
            state: 'executada',
            type: 'pre-jogo',
            confidence: '3'
        };

        if (!entry.match) {
            Utils.toast('Informe o jogo', 'error');
            return;
        }

        DB.addEntry(entry);
        this.closeModal('modal-entrada-rapida');
        this.clearForm('modal-entrada-rapida');
        Utils.toast('Entrada rpida registrada!');
        this.updateBancaDisplay();
        this.navigate(this.currentPage);
    },

    saveFomo() {
        const fomo = {
            match: document.getElementById('fomo-match').value,
            market: document.getElementById('fomo-market').value,
            odd: document.getElementById('fomo-odd').value,
            units: document.getElementById('fomo-units').value,
            group: document.getElementById('fomo-group').value,
            source: document.getElementById('fomo-source').value,
            reasonEnter: document.getElementById('fomo-reason-enter').value,
            reasonSkip: document.getElementById('fomo-reason-skip').value,
            desire: document.querySelector('#fomo-desire .conf-dot.active')?.dataset.val || '3',
            result: document.getElementById('fomo-result').value,
            lesson: document.getElementById('fomo-lesson').value
        };

        if (!fomo.match) {
            Utils.toast('Informe o jogo', 'error');
            return;
        }

        DB.addFomo(fomo);
        this.closeModal('modal-fomo');
        this.clearForm('modal-fomo');
        Utils.toast('FOMO registrado!');
        this.navigate(this.currentPage);
    },

    saveAnalysis() {
        const analysis = {
            match: document.getElementById('analysis-match').value,
            date: document.getElementById('analysis-date').value,
            championship: document.getElementById('analysis-championship').value,
            market: document.getElementById('analysis-market').value,
            odd: document.getElementById('analysis-odd').value,
            fairOdd: document.getElementById('analysis-fair-odd').value,
            probability: document.getElementById('analysis-probability').value,
            risk: document.getElementById('analysis-risk').value,
            context: document.getElementById('analysis-context').value,
            pros: document.getElementById('analysis-pros').value,
            cons: document.getElementById('analysis-cons').value,
            conclusion: document.getElementById('analysis-conclusion').value,
            decision: document.getElementById('analysis-decision').value,
            minOdd: document.getElementById('analysis-min-odd').value,
            idealOdd: document.getElementById('analysis-ideal-odd').value
        };

        if (!analysis.match) {
            Utils.toast('Informe o jogo', 'error');
            return;
        }

        DB.addAnalysis(analysis);
        this.closeModal('modal-analise');
        this.clearForm('modal-analise');
        Utils.toast('Anlise registrada!');
        this.navigate(this.currentPage);
    },

    saveDiary() {
        const note = document.getElementById('diary-note').value;
        if (!note) { Utils.toast('Escreva algo', 'error'); return; }
        DB.addDiaryEntry({
            note,
            related: document.getElementById('diary-related').value
        });
        this.closeModal('modal-diario');
        this.clearForm('modal-diario');
        Utils.toast('Anotao registrada!');
        this.navigate(this.currentPage);
    },

    saveBanca() {
        const banca = DB.getBanca();
        banca.initial = Number(document.getElementById('banca-initial').value) || 5000;
        banca.unitValue = Number(document.getElementById('banca-unit').value) || 50;
        DB.saveBanca(banca);
        this.closeModal('modal-banca');
        this.updateBancaDisplay();
        Utils.toast('Banca atualizada!');
        this.navigate(this.currentPage);
    },

    saveParticipant() {
        const p = {
            name: document.getElementById('part-name').value,
            alias: document.getElementById('part-alias').value,
            group: document.getElementById('part-group').value,
            specialty: document.getElementById('part-specialty').value
        };
        if (!p.name) { Utils.toast('Informe o nome', 'error'); return; }
        DB.addParticipant(p);
        this.closeModal('modal-participante');
        this.clearForm('modal-participante');
        Utils.toast('Participante adicionado!');
        this.navigate(this.currentPage);
    },

    saveGroup() {
        const name = document.getElementById('group-name').value;
        if (!name) { Utils.toast('Informe o nome do grupo', 'error'); return; }
        DB.addGroup({ name: name.toUpperCase() });
        this.closeModal('modal-grupo');
        this.clearForm('modal-grupo');
        Utils.toast('Grupo criado!');
        this.navigate(this.currentPage);
    },

    clearForm(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.querySelectorAll('input:not([type="checkbox"])').forEach(i => i.value = '');
        modal.querySelectorAll('textarea').forEach(t => t.value = '');
        modal.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
        modal.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
    },

    showEntryDetail(entryId) {
        const entry = DB.getEntries().find(e => e.id === entryId);
        if (!entry) return;

        const participants = DB.getParticipants();
        const groups = DB.getGroups();
        const p = participants.find(pp => pp.id === entry.participant);
        const g = groups.find(gg => gg.id === entry.group);
        const profit = Utils.calcProfit(entry);
        const clv = Utils.calcCLV(entry);

        const content = document.getElementById('entry-detail-content');
        content.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item"><div class="detail-label">JOGO</div><div class="detail-value">${entry.match || ''}</div></div>
                <div class="detail-item"><div class="detail-label">DATA</div><div class="detail-value">${Utils.formatDate(entry.date)} ${entry.time || ''}</div></div>
                <div class="detail-item"><div class="detail-label">MERCADO</div><div class="detail-value">${entry.market || ''}</div></div>
                <div class="detail-item"><div class="detail-label">SELEO</div><div class="detail-value">${entry.selection || ''}</div></div>
                <div class="detail-item"><div class="detail-label">ODD</div><div class="detail-value">${Number(entry.odd || 0).toFixed(2)}</div></div>
                <div class="detail-item"><div class="detail-label">UNIDADES</div><div class="detail-value">${Number(entry.units || 0).toFixed(1)}u</div></div>
                <div class="detail-item"><div class="detail-label">GRUPO</div><div class="detail-value">${g ? g.name : ''}</div></div>
                <div class="detail-item"><div class="detail-label">PARTICIPANTE</div><div class="detail-value">${p ? p.name : ''}</div></div>
                <div class="detail-item"><div class="detail-label">TIPO</div><div class="detail-value">${entry.type === 'ao-vivo' ? 'AO VIVO' : 'PR-JOGO'}</div></div>
                <div class="detail-item"><div class="detail-label">ESTADO</div><div class="detail-value">${(entry.state || 'executada').toUpperCase()}</div></div>
                <div class="detail-item"><div class="detail-label">STATUS</div><div class="detail-value"><span class="entry-status ${Utils.getStatusClass(entry.status)}">${Utils.getStatusLabel(entry.status)}</span></div></div>
                <div class="detail-item"><div class="detail-label">LUCRO</div><div class="detail-value" style="color:${profit >= 0 ? 'var(--green)' : 'var(--red)'}">${entry.status === 'pendente' ? '-' : Utils.formatUnits(profit)}</div></div>
                <div class="detail-item"><div class="detail-label">CONFIANA</div><div class="detail-value">${entry.confidence || '-'}/5</div></div>
                <div class="detail-item"><div class="detail-label">CAMPEONATO</div><div class="detail-value">${entry.championship || '-'}</div></div>
                ${entry.oddAnalyzed ? `<div class="detail-item"><div class="detail-label">ODD ANALISADA</div><div class="detail-value">${Number(entry.oddAnalyzed).toFixed(2)}</div></div>` : ''}
                ${entry.oddBest ? `<div class="detail-item"><div class="detail-label">MELHOR ODD</div><div class="detail-value">${Number(entry.oddBest).toFixed(2)}</div></div>` : ''}
                ${entry.oddClosing ? `<div class="detail-item"><div class="detail-label">ODD FECHAMENTO</div><div class="detail-value">${Number(entry.oddClosing).toFixed(2)}</div></div>` : ''}
                ${clv !== null ? `<div class="detail-item"><div class="detail-label">VALOR CONTRA FECHAMENTO (CLV)</div><div class="detail-value" style="color:${clv >= 0 ? 'var(--green)' : 'var(--red)'}">
                    ${clv >= 0 ? 'ENTRAMOS MELHOR QUE O MERCADO' : 'MERCADO FECHOU MELHOR'} ${Utils.formatPct(clv)}
                </div></div>` : ''}
                ${entry.analysis ? `<div class="detail-item detail-full"><div class="detail-label">ANLISE</div><div class="detail-value" style="font-size:0.8rem;line-height:1.6;color:var(--text-secondary)">${entry.analysis}</div></div>` : ''}
                ${entry.tags ? `<div class="detail-item detail-full"><div class="detail-label">TAGS</div><div class="detail-value" style="color:var(--accent-blue)">${entry.tags}</div></div>` : ''}
            </div>

            ${entry.history && entry.history.length ? `
            <div style="margin-top:16px">
                <div style="font-size:0.65rem;color:var(--text-muted);letter-spacing:1px;margin-bottom:8px">HISTRICO</div>
                <div class="timeline">
                    ${entry.history.map(h => `
                        <div class="timeline-item">
                            <div class="timeline-time">${Utils.formatDateTime(h.timestamp)}</div>
                            <div class="timeline-text">${h.action}</div>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}
        `;

        document.getElementById('btn-edit-entry').onclick = () => {
            this.closeModal('modal-entry-detail');
            this.editEntry(entryId);
        };

        this.openModal('modal-entry-detail');
    },

    editEntry(entryId) {
        const entry = DB.getEntries().find(e => e.id === entryId);
        if (!entry) return;

        this.populateDropdowns('modal-nova-entrada');

        document.getElementById('entry-date').value = entry.date || '';
        document.getElementById('entry-time').value = entry.time || '';
        document.getElementById('entry-sport').value = entry.sport || 'futebol';
        document.getElementById('entry-championship').value = entry.championship || '';
        document.getElementById('entry-match').value = entry.match || '';
        document.getElementById('entry-type').value = entry.type || 'pre-jogo';
        document.getElementById('entry-group').value = entry.group || '';

        setTimeout(() => {
            document.getElementById('entry-participant').value = entry.participant || '';
        }, 50);

        document.getElementById('entry-market').value = entry.market || '';
        document.getElementById('entry-selection').value = entry.selection || '';
        document.getElementById('entry-odd').value = entry.odd || '';
        document.getElementById('entry-units').value = entry.units || '';
        document.getElementById('entry-value').value = entry.value || '';
        document.getElementById('entry-status').value = entry.status || 'pendente';
        document.getElementById('entry-state').value = entry.state || 'executada';
        document.getElementById('entry-odd-analyzed').value = entry.oddAnalyzed || '';
        document.getElementById('entry-odd-best').value = entry.oddBest || '';
        document.getElementById('entry-odd-closing').value = entry.oddClosing || '';
        document.getElementById('entry-analysis').value = entry.analysis || '';
        document.getElementById('entry-tags').value = entry.tags || '';
        document.getElementById('entry-link').value = entry.link || '';
        document.getElementById('entry-attention').checked = entry.attention || false;

        const confDots = document.querySelectorAll('#entry-confidence .conf-dot');
        confDots.forEach(d => d.classList.toggle('active', d.dataset.val === String(entry.confidence || 3)));

        // Override save to update
        const saveBtn = document.getElementById('btn-save-entry');
        const originalClick = saveBtn.onclick;
        saveBtn.onclick = null;

        const newHandler = () => {
            const updates = {
                date: document.getElementById('entry-date').value,
                time: document.getElementById('entry-time').value,
                sport: document.getElementById('entry-sport').value,
                championship: document.getElementById('entry-championship').value,
                match: document.getElementById('entry-match').value,
                type: document.getElementById('entry-type').value,
                group: document.getElementById('entry-group').value,
                participant: document.getElementById('entry-participant').value,
                market: document.getElementById('entry-market').value,
                selection: document.getElementById('entry-selection').value,
                odd: document.getElementById('entry-odd').value,
                units: document.getElementById('entry-units').value,
                value: document.getElementById('entry-value').value,
                status: document.getElementById('entry-status').value,
                state: document.getElementById('entry-state').value,
                confidence: document.querySelector('#entry-confidence .conf-dot.active')?.dataset.val || '3',
                oddAnalyzed: document.getElementById('entry-odd-analyzed').value,
                oddBest: document.getElementById('entry-odd-best').value,
                oddClosing: document.getElementById('entry-odd-closing').value,
                analysis: document.getElementById('entry-analysis').value,
                tags: document.getElementById('entry-tags').value,
                link: document.getElementById('entry-link').value,
                attention: document.getElementById('entry-attention').checked
            };

            DB.updateEntry(entryId, updates);
            this.closeModal('modal-nova-entrada');
            this.clearForm('modal-nova-entrada');
            Utils.toast('Entrada atualizada!');
            this.updateTicker();
            this.updateBancaDisplay();
            saveBtn.removeEventListener('click', newHandler);
            saveBtn.addEventListener('click', () => this.saveEntry());
            this.navigate(this.currentPage);
        };

        saveBtn.addEventListener('click', newHandler);
        this.openModal('modal-nova-entrada');
    },

    updateTicker() {
        const alerts = DB.getAlerts();
        const track = document.getElementById('ticker-track');
        if (!track) return;

        if (!alerts.length) {
            track.innerHTML = '<span class="ticker-placeholder">Nenhuma aposta em observao no momento</span>';
            return;
        }

        track.innerHTML = alerts.map(a =>
            `<span>${a.match || ''} &mdash; ${a.market || ''} @${Number(a.odd || 0).toFixed(2)}</span>`
        ).join('');
    },

    updateBancaDisplay() {
        const banca = DB.getBanca();
        const entries = DB.getEntries().filter(e => e.state !== 'descartada');
        const totalUnits = Utils.calcTotalUnits(entries);
        const bancaAtual = banca.initial + (totalUnits * banca.unitValue);
        document.getElementById('header-banca').textContent = Utils.formatCurrency(bancaAtual);
    },

    encerrarDia() {
        const entries = DB.getEntries().filter(e => e.state !== 'descartada');
        const today = Utils.filterByPeriod(entries, 'hoje');
        const greens = today.filter(e => e.status === 'green').length;
        const reds = today.filter(e => e.status === 'red').length;
        const voidsCount = today.filter(e => e.status === 'void').length;
        const pending = today.filter(e => e.status === 'pendente').length;
        const units = Utils.calcTotalUnits(today);
        const roi = Utils.calcROI(today);
        const banca = DB.getBanca();

        const bestEntry = today.filter(e => e.status !== 'pendente').sort((a, b) => Utils.calcProfit(b) - Utils.calcProfit(a))[0];
        const worstEntry = today.filter(e => e.status !== 'pendente').sort((a, b) => Utils.calcProfit(a) - Utils.calcProfit(b))[0];

        const fomos = DB.getFomos();
        const todayFomos = Utils.filterByPeriod(fomos, 'hoje');
        const evitados = todayFomos.filter(f => f.result === 'red').length;
        const oportunidades = todayFomos.filter(f => f.result === 'green').length;

        const content = document.getElementById('resumo-dia-content');
        content.innerHTML = `
            <div style="text-align:center;margin-bottom:16px">
                <div style="font-size:0.65rem;color:var(--text-muted);letter-spacing:1.5px">RDT  RESUMO DO DIA</div>
                <div style="font-size:0.75rem;color:var(--text-secondary)">${Utils.formatDate(Utils.today())}</div>
            </div>
            <div class="placar-rdt">
                <div class="placar-item placar-green"><div class="count">${greens}</div><div class="plabel">GREEN</div></div>
                <div class="placar-item placar-red"><div class="count">${reds}</div><div class="plabel">RED</div></div>
                <div class="placar-item placar-void"><div class="count">${voidsCount}</div><div class="plabel">VOID</div></div>
                <div class="placar-item placar-pending"><div class="count">${pending}</div><div class="plabel">PENDENTE</div></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0">
                <div class="stat-card"><div class="stat-label">RESULTADO</div><div class="stat-value ${units >= 0 ? 'positive' : 'negative'}">${Utils.formatUnits(units)}</div></div>
                <div class="stat-card"><div class="stat-label">ROI DO DIA</div><div class="stat-value ${roi >= 0 ? 'positive' : 'negative'}">${Utils.formatPct(roi)}</div></div>
                <div class="stat-card"><div class="stat-label">ENTRADAS</div><div class="stat-value">${today.length}</div></div>
                <div class="stat-card"><div class="stat-label">LUCRO EM R$</div><div class="stat-value ${units >= 0 ? 'positive' : 'negative'}">${Utils.formatCurrency(units * banca.unitValue)}</div></div>
            </div>
            ${bestEntry ? `<div style="font-size:0.7rem;color:var(--text-secondary);margin-bottom:4px">Melhor entrada: <strong style="color:var(--green)">${bestEntry.match} ${bestEntry.market} ${Utils.formatUnits(Utils.calcProfit(bestEntry))}</strong></div>` : ''}
            ${worstEntry && Utils.calcProfit(worstEntry) < 0 ? `<div style="font-size:0.7rem;color:var(--text-secondary);margin-bottom:12px">Maior prejuzo: <strong style="color:var(--red)">${worstEntry.match} ${worstEntry.market} ${Utils.formatUnits(Utils.calcProfit(worstEntry))}</strong></div>` : ''}
            <div style="display:flex;gap:16px;font-size:0.7rem;color:var(--text-muted)">
                <span>FOMOs evitados: ${evitados}</span>
                <span>Oportunidades perdidas: ${oportunidades}</span>
            </div>
        `;

        this.openModal('modal-encerrar-dia');
    },

    exportCSV() {
        const entries = DB.getEntries();
        const participants = DB.getParticipants();
        const groups = DB.getGroups();

        const headers = ['Data', 'Jogo', 'Mercado', 'Odd', 'Unidades', 'Grupo', 'Participante', 'Tipo', 'Estado', 'Status', 'Lucro'];
        const rows = entries.map(e => {
            const p = participants.find(pp => pp.id === e.participant);
            const g = groups.find(gg => gg.id === e.group);
            return [
                e.date || '', e.match || '', e.market || '',
                e.odd || '', e.units || '',
                g ? g.name : '', p ? p.name : '',
                e.type || '', e.state || '', e.status || '',
                Utils.calcProfit(e).toFixed(2)
            ];
        });

        let csv = headers.join(';') + '\n';
        for (const row of rows) {
            csv += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';') + '\n';
        }

        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rdt_entradas_${Utils.today()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.toast('Exportao concluda!', 'info');
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());

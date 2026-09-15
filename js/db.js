const DB = {
    _get(key) {
        try {
            const data = localStorage.getItem('rdt_' + key);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    },
    _set(key, value) {
        try {
            localStorage.setItem('rdt_' + key, JSON.stringify(value));
        } catch { /* storage full */ }
    },

    // BANCA
    getBanca() {
        return this._get('banca') || { initial: 5000, unitValue: 50, history: [] };
    },
    saveBanca(banca) { this._set('banca', banca); },

    // GRUPOS
    getGroups() {
        let groups = this._get('groups');
        if (!groups) {
            groups = [
                { id: 'conselho-rdt', name: 'CONSELHO RDT', createdAt: new Date().toISOString() },
                { id: 'germanboys', name: 'GERMANBOYS', createdAt: new Date().toISOString() },
                { id: 'moneybank', name: 'MONEYBANK', createdAt: new Date().toISOString() }
            ];
            this._set('groups', groups);
        }
        return groups;
    },
    saveGroups(groups) { this._set('groups', groups); },
    addGroup(group) {
        const groups = this.getGroups();
        group.id = 'group-' + Date.now();
        group.createdAt = new Date().toISOString();
        groups.push(group);
        this.saveGroups(groups);
        return group;
    },

    // PARTICIPANTES
    getParticipants() {
        let participants = this._get('participants');
        if (!participants) {
            participants = [
                { id: 'p1', name: 'Michael Corleone', alias: 'O Don do Preo', group: 'conselho-rdt', specialty: 'Preo', avatar: 'MC' },
                { id: 'p2', name: 'Dr. Gregory House', alias: 'O Diagnstico', group: 'conselho-rdt', specialty: 'Diagnstico', avatar: 'GH' },
                { id: 'p3', name: 'Thomas Shelby', alias: 'O Homem da Linha', group: 'conselho-rdt', specialty: 'Linha', avatar: 'TS' },
                { id: 'p4', name: 'Sheldon Cooper', alias: 'A Probabilidade', group: 'conselho-rdt', specialty: 'Probabilidade', avatar: 'SC' },
                { id: 'p5', name: 'Kobe Bryant', alias: 'Mamba Edge', group: 'conselho-rdt', specialty: 'Edge', avatar: 'KB' },
                { id: 'p6', name: 'Hermione Granger', alias: 'A Bibliotecria', group: 'conselho-rdt', specialty: 'Pesquisa', avatar: 'HG' },
                { id: 'p7', name: 'Jos Mourinho', alias: 'O Especial', group: 'conselho-rdt', specialty: 'Ttica', avatar: 'JM' },
                { id: 'p8', name: 'Jack Bauer', alias: '', group: 'conselho-rdt', specialty: 'Operaes', avatar: 'JB' },
                { id: 'p9', name: 'Mike Ross', alias: '', group: 'conselho-rdt', specialty: 'Anlise', avatar: 'MR' },
                { id: 'p10', name: 'Bruce Wayne', alias: 'O Protocolo', group: 'conselho-rdt', specialty: 'Gesto de Risco', avatar: 'BW' },
                { id: 'p11', name: 'Wendy Rhoades', alias: 'A Psicloga da Banca', group: 'conselho-rdt', specialty: 'Psicologia', avatar: 'WR' },
                { id: 'p12', name: 'Natalie Cook', alias: 'A Agente do Caos', group: 'conselho-rdt', specialty: 'Caos / Ao Vivo', avatar: 'NC' }
            ];
            this._set('participants', participants);
        }
        return participants;
    },
    saveParticipants(p) { this._set('participants', p); },
    addParticipant(p) {
        const list = this.getParticipants();
        p.id = 'p-' + Date.now();
        p.avatar = p.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        list.push(p);
        this.saveParticipants(list);
        return p;
    },

    // ENTRADAS (APOSTAS)
    getEntries() { return this._get('entries') || []; },
    saveEntries(entries) { this._set('entries', entries); },
    addEntry(entry) {
        const entries = this.getEntries();
        entry.id = 'e-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
        entry.createdAt = new Date().toISOString();
        entry.history = [{ action: 'Entrada criada', timestamp: new Date().toISOString() }];
        entries.unshift(entry);
        this.saveEntries(entries);
        return entry;
    },
    updateEntry(id, updates) {
        const entries = this.getEntries();
        const idx = entries.findIndex(e => e.id === id);
        if (idx === -1) return null;
        const old = { ...entries[idx] };
        Object.assign(entries[idx], updates);
        if (!entries[idx].history) entries[idx].history = [];
        const changes = [];
        for (const key of Object.keys(updates)) {
            if (old[key] !== updates[key] && key !== 'history') {
                changes.push(`${key}: ${old[key]} → ${updates[key]}`);
            }
        }
        if (changes.length) {
            entries[idx].history.push({
                action: changes.join(', '),
                timestamp: new Date().toISOString()
            });
        }
        this.saveEntries(entries);
        return entries[idx];
    },
    deleteEntry(id) {
        const entries = this.getEntries().filter(e => e.id !== id);
        this.saveEntries(entries);
    },

    // ANÁLISES
    getAnalyses() { return this._get('analyses') || []; },
    saveAnalyses(a) { this._set('analyses', a); },
    addAnalysis(a) {
        const list = this.getAnalyses();
        a.id = 'a-' + Date.now();
        a.createdAt = new Date().toISOString();
        list.unshift(a);
        this.saveAnalyses(list);
        return a;
    },

    // FOMO
    getFomos() { return this._get('fomos') || []; },
    saveFomos(f) { this._set('fomos', f); },
    addFomo(f) {
        const list = this.getFomos();
        f.id = 'f-' + Date.now();
        f.createdAt = new Date().toISOString();
        list.unshift(f);
        this.saveFomos(list);
        return f;
    },
    updateFomo(id, updates) {
        const list = this.getFomos();
        const idx = list.findIndex(f => f.id === id);
        if (idx === -1) return null;
        Object.assign(list[idx], updates);
        this.saveFomos(list);
        return list[idx];
    },

    // DIÁRIO
    getDiary() { return this._get('diary') || []; },
    saveDiary(d) { this._set('diary', d); },
    addDiaryEntry(d) {
        const list = this.getDiary();
        d.id = 'd-' + Date.now();
        d.createdAt = new Date().toISOString();
        list.unshift(d);
        this.saveDiary(list);
        return d;
    },

    // ALERTAS / ATENÇÃO
    getAlerts() {
        return this.getEntries().filter(e => e.attention);
    },

    // FAVORITOS
    getFavorites() { return this._get('favorites') || []; },
    toggleFavorite(type, id) {
        const favs = this.getFavorites();
        const key = type + ':' + id;
        const idx = favs.indexOf(key);
        if (idx >= 0) favs.splice(idx, 1);
        else favs.push(key);
        this._set('favorites', favs);
        return idx < 0;
    },
    isFavorite(type, id) {
        return this.getFavorites().includes(type + ':' + id);
    },

    // TEMPLATES
    getTemplates() {
        return this._get('templates') || [
            { id: 't1', name: 'Futebol  Moneyline', sport: 'futebol', market: 'Moneyline' },
            { id: 't2', name: 'Futebol  Over Gols', sport: 'futebol', market: 'Over gols' },
            { id: 't3', name: 'Futebol  BTTS', sport: 'futebol', market: 'BTTS' },
            { id: 't4', name: 'Escanteios', sport: 'futebol', market: 'Escanteios' },
            { id: 't5', name: 'Cartes', sport: 'futebol', market: 'Cartes' }
        ];
    }
};

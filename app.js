
const app = {
    state: {
        songs: [],
        filteredSongs: [],
        currentView: 'homeView',
        ghUsername: '',
        ghRepo: '',
        ghToken: '',
        googleApiKey: '',
        theme: 'dark',
        scrollInterval: null,
        scrollSpeed: 3,
        currentSongId: null,
        pendingLyricsImages: [],
        pendingPatternImages: [],
        currentStrumSteps: [],
        selectedStrumIndex: -1,
        selectedModel: null
    },

    init() {
        this.loadSettings();
        this.applyTheme();
        this.bindEvents();
        this.loadDraft();
        this.renderStrumBuilder();
        this.updatePreview();

        if (!this.hasGitHubConfig()) {
            this.openSettings();
        }
    },

    bindEvents() {
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('addSongForm').addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleSaveSong();
        });

        document.getElementById('searchInput').addEventListener('input', (event) => this.applyLibraryFilters(event.target.value));
        document.getElementById('sortSelect').addEventListener('change', () => this.applyLibraryFilters());

        document.getElementById('runAiBtn').addEventListener('click', () => this.runSongAiExtraction({ fromTextOnly: false }));
        document.getElementById('fillMetaFromTextBtn').addEventListener('click', () => this.runSongAiExtraction({ fromTextOnly: true }));
        document.getElementById('previewSongBtn').addEventListener('click', () => this.updatePreview());
        document.getElementById('normalizeTextBtn').addEventListener('click', () => {
            const textArea = document.getElementById('songText');
            textArea.value = this.normalizeSongText(textArea.value);
            this.persistDraft();
            this.updatePreview();
        });

        document.getElementById('lyricsImageInput').addEventListener('change', (event) => {
            this.prepareImages(event.target.files, 'pendingLyricsImages', 'lyricsUploadSummary', 'Скрины текста');
        });

        document.getElementById('patternImageInput').addEventListener('change', (event) => {
            this.prepareImages(event.target.files, 'pendingPatternImages', 'patternUploadSummary', 'Скрины боя');
        });

        document.getElementById('songText').addEventListener('input', () => {
            this.persistDraft();
            this.updatePreview();
        });

        ['songArtist', 'songTitle', 'songKey', 'songBpm', 'songCapo', 'songTuning', 'songVideoUrl', 'songFingerings', 'strumNotes'].forEach((id) => {
            document.getElementById(id).addEventListener('input', () => this.persistDraft());
        });

        document.querySelectorAll('.stroke-btn').forEach((button) => {
            button.addEventListener('click', () => this.addStrumStep(button.dataset.direction));
        });

        document.getElementById('toggleAccentBtn').addEventListener('click', () => this.toggleSelectedStrumFlag('accent'));
        document.getElementById('toggleMuteBtn').addEventListener('click', () => this.toggleSelectedStrumFlag('muted'));
        document.getElementById('deleteStepBtn').addEventListener('click', () => this.deleteSelectedStrumStep());
        document.getElementById('clearStrumBtn').addEventListener('click', () => this.clearStrumSteps());
        document.getElementById('studyHelperBtn').addEventListener('click', () => this.runStudyHelper());
        document.getElementById('songText').addEventListener('paste', (event) => this.handleSongTextPaste(event));
    },

    hasGitHubConfig() {
        return Boolean(this.state.ghUsername && this.state.ghRepo && this.state.ghToken);
    },

    loadSettings() {
        this.state.ghUsername = localStorage.getItem('ghUsername') || '';
        this.state.ghRepo = localStorage.getItem('ghRepo') || '';
        this.state.ghToken = localStorage.getItem('ghToken') || '';
        this.state.googleApiKey = localStorage.getItem('googleApiKey') || '';
        this.state.theme = localStorage.getItem('theme') || 'dark';
    },

    saveSettings() {
        this.state.ghUsername = document.getElementById('ghUsername').value.trim();
        this.state.ghRepo = document.getElementById('ghRepo').value.trim();
        this.state.ghToken = document.getElementById('ghToken').value.trim();
        this.state.googleApiKey = document.getElementById('googleApiKey').value.trim();

        localStorage.setItem('ghUsername', this.state.ghUsername);
        localStorage.setItem('ghRepo', this.state.ghRepo);
        localStorage.setItem('ghToken', this.state.ghToken);
        localStorage.setItem('googleApiKey', this.state.googleApiKey);

        this.closeSettings();
        if (this.state.currentView === 'libraryView') {
            this.loadSongs();
        }
    },

    openSettings() {
        document.getElementById('ghUsername').value = this.state.ghUsername;
        document.getElementById('ghRepo').value = this.state.ghRepo;
        document.getElementById('ghToken').value = this.state.ghToken;
        document.getElementById('googleApiKey').value = this.state.googleApiKey;
        document.getElementById('settingsModal').classList.remove('hidden');
    },

    closeSettings() {
        document.getElementById('settingsModal').classList.add('hidden');
    },

    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.state.theme);
        this.applyTheme();
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
        const toggleBtn = document.getElementById('themeToggleBtn');
        toggleBtn.textContent = this.state.theme === 'dark' ? '☾' : '☀';
    },

    showView(viewId) {
        this.stopAutoscroll();
        document.querySelectorAll('.view').forEach((element) => {
            element.classList.remove('active');
            element.classList.add('hidden');
        });

        const nextView = document.getElementById(viewId);
        nextView.classList.add('active');
        nextView.classList.remove('hidden');
        this.state.currentView = viewId;

        if (viewId === 'libraryView') {
            this.loadSongs();
        }

        if (viewId === 'addView') {
            this.updatePreview();
        }
    },

    persistDraft() {
        const draft = {
            artist: document.getElementById('songArtist').value,
            title: document.getElementById('songTitle').value,
            key: document.getElementById('songKey').value,
            bpm: document.getElementById('songBpm').value,
            capo: document.getElementById('songCapo').value,
            tuning: document.getElementById('songTuning').value,
            videoUrl: document.getElementById('songVideoUrl').value,
            fingerings: document.getElementById('songFingerings').value,
            strumNotes: document.getElementById('strumNotes').value,
            text: document.getElementById('songText').value,
            strumSteps: this.state.currentStrumSteps
        };

        localStorage.setItem('songDraft', JSON.stringify(draft));
    },

    loadDraft() {
        try {
            const rawDraft = localStorage.getItem('songDraft');
            if (!rawDraft) {
                return;
            }

            const draft = JSON.parse(rawDraft);
            document.getElementById('songArtist').value = draft.artist || '';
            document.getElementById('songTitle').value = draft.title || '';
            document.getElementById('songKey').value = draft.key || '';
            document.getElementById('songBpm').value = draft.bpm || '';
            document.getElementById('songCapo').value = draft.capo || '';
            document.getElementById('songTuning').value = draft.tuning || '';
            document.getElementById('songVideoUrl').value = draft.videoUrl || '';
            document.getElementById('songFingerings').value = draft.fingerings || '';
            document.getElementById('strumNotes').value = draft.strumNotes || '';
            document.getElementById('songText').value = draft.text || '';
            this.state.currentStrumSteps = Array.isArray(draft.strumSteps) ? draft.strumSteps : [];
            this.state.selectedStrumIndex = this.state.currentStrumSteps.length ? 0 : -1;
        } catch (error) {
            console.error('Не удалось загрузить черновик:', error);
        }
    },

    clearDraft() {
        localStorage.removeItem('songDraft');
    },

    handleSongTextPaste(event) {
        const items = (event.clipboardData || event.originalEvent?.clipboardData)?.items || [];
        const imageFiles = [];

        for (let index = 0; index < items.length; index += 1) {
            const item = items[index];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                event.preventDefault();
                imageFiles.push(item.getAsFile());
            }
        }

        if (imageFiles.length) {
            this.prepareImages(imageFiles, 'pendingLyricsImages', 'lyricsUploadSummary', 'Скрины текста');
        }
    },

    prepareImages(fileList, stateKey, summaryId, label) {
        this.state[stateKey] = Array.from(fileList || []);
        const summaryNode = document.getElementById(summaryId);
        summaryNode.textContent = this.state[stateKey].length
            ? `${label}: ${this.state[stateKey].length} шт.`
            : `${label} не выбраны`;
    },

    addStrumStep(direction) {
        this.state.currentStrumSteps.push({ direction, accent: false, muted: false });
        this.state.selectedStrumIndex = this.state.currentStrumSteps.length - 1;
        this.renderStrumBuilder();
        this.persistDraft();
    },

    toggleSelectedStrumFlag(flagName) {
        const step = this.state.currentStrumSteps[this.state.selectedStrumIndex];
        if (!step) {
            alert('Сначала выберите шаг боя.');
            return;
        }

        step[flagName] = !step[flagName];
        this.renderStrumBuilder();
        this.persistDraft();
    },

    deleteSelectedStrumStep() {
        if (this.state.selectedStrumIndex < 0) {
            return;
        }

        this.state.currentStrumSteps.splice(this.state.selectedStrumIndex, 1);
        this.state.selectedStrumIndex = Math.min(this.state.selectedStrumIndex, this.state.currentStrumSteps.length - 1);
        this.renderStrumBuilder();
        this.persistDraft();
    },

    clearStrumSteps() {
        this.state.currentStrumSteps = [];
        this.state.selectedStrumIndex = -1;
        this.renderStrumBuilder();
        this.persistDraft();
    },
    renderStrumBuilder(target = document.getElementById('strumBuilder'), steps = this.state.currentStrumSteps, interactive = true) {
        if (!target) {
            return;
        }

        if (!steps.length) {
            target.classList.add('empty');
            target.innerHTML = interactive ? 'Добавь шаги боя кнопками выше' : 'Бой не заполнен';
            return;
        }

        target.classList.remove('empty');
        target.innerHTML = '';
        steps.forEach((step, index) => {
            const button = document.createElement(interactive ? 'button' : 'div');
            button.className = `strum-step${step.accent ? ' accent' : ''}${step.muted ? ' muted' : ''}${index === this.state.selectedStrumIndex && interactive ? ' selected' : ''}`;
            button.innerHTML = `
                <span class="strum-step-direction">${step.direction === 'down' ? '↓' : '↑'}</span>
                <span class="strum-step-meta">${this.describeStep(step)}</span>
            `;

            if (interactive) {
                button.type = 'button';
                button.addEventListener('click', () => {
                    this.state.selectedStrumIndex = index;
                    this.renderStrumBuilder();
                });
            }

            target.appendChild(button);
        });
    },

    describeStep(step) {
        const parts = [];
        if (step.accent) {
            parts.push('акцент');
        }
        if (step.muted) {
            parts.push('глушка');
        }
        return parts.length ? parts.join(' · ') : 'обычно';
    },

    buildStrumSummary(steps = this.state.currentStrumSteps) {
        return steps.map((step) => {
            const direction = step.direction === 'down' ? '↓' : '↑';
            const accent = step.accent ? '!' : '';
            const muted = step.muted ? 'x' : '';
            return `${direction}${accent}${muted}`;
        }).join(' ');
    },

    updatePreview() {
        const previewNode = document.getElementById('songPreview');
        const text = this.normalizeSongText(document.getElementById('songText').value);
        const strumSummary = this.buildStrumSummary();
        const previewPieces = [];

        if (strumSummary) {
            previewPieces.push(`<div class="song-line-single"><strong>Бой:</strong> ${this.escapeHtml(strumSummary)}</div>`);
        }

        if (text.trim()) {
            previewPieces.push(this.renderSongMarkup(text));
            previewNode.classList.remove('song-preview-empty');
            previewNode.innerHTML = previewPieces.join('');
        } else {
            previewNode.classList.add('song-preview-empty');
            previewNode.innerHTML = previewPieces.length ? previewPieces.join('') : 'Предпросмотр появится после ввода текста или запуска AI.';
        }
    },

    normalizeSongText(rawText) {
        if (!rawText) {
            return '';
        }

        let text = rawText.replace(/\r/g, '');
        text = text.replace(/\t/g, '    ');
        text = text.replace(/[ ]+$/gm, '');

        const replacements = [
            [/\bАm\b/g, 'Am'],
            [/\bС\b/g, 'C'],
            [/\bЕ\b/g, 'E'],
            [/\bВ\b/g, 'B'],
            [/\bН\b/g, 'H'],
            [/\bА\b/g, 'A'],
            [/\b([A-GH])\s+m\b/g, '$1m']
        ];

        replacements.forEach(([pattern, replacement]) => {
            text = text.replace(pattern, replacement);
        });

        text = text.replace(/\n{4,}/g, '\n\n\n');
        return text;
    },

    isChordLine(line) {
        const trimmed = line.trim();
        if (!trimmed) {
            return false;
        }

        const tokens = trimmed.split(/\s+/).filter(Boolean);
        if (!tokens.length) {
            return false;
        }

        return tokens.every((token) => /^[A-GH](?:#|b)?(?:m|maj7|maj|min|dim|aug|sus2|sus4|sus|add9|m7|7|9|11|13)?(?:\/[A-GH](?:#|b)?)?$/.test(token));
    },

    renderSongMarkup(rawText) {
        const text = this.normalizeSongText(rawText);
        const lines = text.split('\n');
        const blocks = [];

        for (let index = 0; index < lines.length; index += 1) {
            const currentLine = lines[index];
            const nextLine = lines[index + 1];
            const trimmed = currentLine.trim();

            if (!trimmed) {
                blocks.push('<div class="song-line-single">&nbsp;</div>');
                continue;
            }

            if (this.isChordLine(currentLine) && typeof nextLine === 'string' && nextLine.trim() && !this.isChordLine(nextLine)) {
                blocks.push(`
                    <div class="song-line-pair">
                        <div class="chord-line">${this.escapeHtml(currentLine)}</div>
                        <div class="lyric-line">${this.escapeHtml(nextLine)}</div>
                    </div>
                `);
                index += 1;
                continue;
            }

            if (/^[А-ЯA-Z][^:]{0,40}:$/u.test(trimmed)) {
                blocks.push(`<div class="song-line-single section-label">${this.escapeHtml(trimmed)}</div>`);
                continue;
            }

            blocks.push(`<div class="song-line-single">${this.escapeHtml(currentLine)}</div>`);
        }

        return blocks.join('');
    },

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    async getGitHubFile() {
        const url = `https://api.github.com/repos/${this.state.ghUsername}/${this.state.ghRepo}/contents/songs.json`;
        const response = await fetch(url, {
            headers: {
                Authorization: `token ${this.state.ghToken}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            return { content: [], sha: null };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Не удалось получить songs.json из GitHub.');
        }

        const data = await response.json();
        const decoded = decodeURIComponent(escape(atob(data.content)));
        const content = JSON.parse(decoded);
        return { content, sha: data.sha };
    },

    async saveSongsToGitHub(songs, message) {
        const url = `https://api.github.com/repos/${this.state.ghUsername}/${this.state.ghRepo}/contents/songs.json`;
        const { sha } = await this.getGitHubFile();
        const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(songs, null, 2))));
        const body = {
            message,
            content: encodedContent,
            sha
        };

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                Authorization: `token ${this.state.ghToken}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Не удалось сохранить songs.json в GitHub.');
        }
    },

    normalizeSongObject(song) {
        return {
            id: song.id || Date.now().toString(),
            title: song.title || 'Без названия',
            artist: song.artist || 'Неизвестный исполнитель',
            key: song.key || '',
            bpm: Number(song.bpm) || null,
            capo: Number.isFinite(Number(song.capo)) ? Number(song.capo) : null,
            tuning: song.tuning || '',
            video_url: song.video_url || song.youtube_url || '',
            fingerings: song.fingerings || '',
            strum_notes: song.strum_notes || '',
            strum_pattern: song.strum_pattern || '',
            strum_steps: Array.isArray(song.strum_steps) ? song.strum_steps : [],
            text: this.normalizeSongText(song.text || ''),
            createdAt: song.createdAt || new Date().toISOString(),
            updatedAt: song.updatedAt || song.createdAt || new Date().toISOString(),
            study_tips: Array.isArray(song.study_tips) ? song.study_tips : []
        };
    },

    async loadSongs() {
        const grid = document.getElementById('songsGrid');
        grid.innerHTML = '<p class="loading-text">Синхронизация с GitHub...</p>';

        if (!this.hasGitHubConfig()) {
            grid.innerHTML = '<p class="error-text">Откройте настройки и укажите GitHub Username, Repo и Token.</p>';
            return;
        }

        try {
            const { content } = await this.getGitHubFile();
            this.state.songs = Array.isArray(content) ? content.map((song) => this.normalizeSongObject(song)) : [];
            this.applyLibraryFilters();
        } catch (error) {
            console.error(error);
            grid.innerHTML = `<p class="error-text">${this.escapeHtml(error.message)}</p>`;
        }
    },

    applyLibraryFilters(queryValue) {
        const query = (typeof queryValue === 'string' ? queryValue : document.getElementById('searchInput').value).trim().toLowerCase();
        const sortValue = document.getElementById('sortSelect').value;

        const filtered = this.state.songs.filter((song) => {
            if (!query) {
                return true;
            }

            return [song.title, song.artist, song.key, song.strum_pattern, song.tuning]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query));
        });

        filtered.sort((a, b) => {
            if (sortValue === 'title') {
                return a.title.localeCompare(b.title, 'ru');
            }
            if (sortValue === 'updated') {
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
            return a.artist.localeCompare(b.artist, 'ru');
        });

        this.state.filteredSongs = filtered;
        this.renderSongs(filtered);
    },
    renderSongs(songs) {
        const grid = document.getElementById('songsGrid');
        if (!songs.length) {
            grid.innerHTML = '<p class="loading-text">Пока пусто. Добавьте первую песню из текста, скрина или видеоразбора.</p>';
            return;
        }

        grid.innerHTML = '';
        songs.forEach((song) => {
            const card = document.createElement('article');
            card.className = 'song-card';
            const metaBadges = [song.key && `Тональность: ${song.key}`, song.bpm && `BPM: ${song.bpm}`, song.strum_pattern && `Бой: ${song.strum_pattern}`]
                .filter(Boolean)
                .map((badge) => `<span class="song-badge">${this.escapeHtml(badge)}</span>`)
                .join('');

            card.innerHTML = `
                <div class="song-card-top">
                    <div>
                        <h3>${this.escapeHtml(song.title)}</h3>
                        <p>${this.escapeHtml(song.artist)}</p>
                    </div>
                    <button class="delete-inline-btn" type="button">Удалить</button>
                </div>
                <div class="song-meta">${metaBadges || '<span class="song-badge">Метаданные не заполнены</span>'}</div>
            `;

            card.addEventListener('click', () => this.openSongView(song.id));
            card.querySelector('.delete-inline-btn').addEventListener('click', (event) => {
                event.stopPropagation();
                this.deleteSongById(song.id);
            });
            grid.appendChild(card);
        });
    },

    getCurrentSong() {
        return this.state.songs.find((song) => song.id === this.state.currentSongId) || null;
    },

    openSongView(songId) {
        const song = this.state.songs.find((item) => item.id === songId);
        if (!song) {
            return;
        }

        this.state.currentSongId = song.id;
        document.getElementById('viewTitle').textContent = song.title;
        document.getElementById('viewArtist').textContent = song.artist;
        document.getElementById('viewText').innerHTML = this.renderSongMarkup(song.text);
        document.getElementById('studyHelperPanel').classList.add('hidden');
        document.getElementById('studyHelperOutput').innerHTML = this.renderStoredStudyTips(song.study_tips);

        const metaNode = document.getElementById('viewMeta');
        metaNode.innerHTML = [
            song.key && `Тональность: ${song.key}`,
            song.bpm && `BPM: ${song.bpm}`,
            Number.isFinite(song.capo) ? `Капо: ${song.capo}` : '',
            song.tuning && `Строй: ${song.tuning}`,
            song.fingerings && 'Есть заметки по аппликатуре'
        ].filter(Boolean).map((meta) => `<span class="song-badge">${this.escapeHtml(meta)}</span>`).join('');

        this.renderSongStrum(song);
        this.renderSongVideo(song.video_url);
        this.showView('songView');
    },

    renderSongStrum(song) {
        const section = document.getElementById('viewStrumSection');
        const preview = document.getElementById('viewStrumPreview');
        const notes = document.getElementById('viewStrumNotes');

        if (!song.strum_steps.length && !song.strum_pattern && !song.strum_notes) {
            section.classList.add('hidden');
            preview.innerHTML = '';
            notes.textContent = '';
            return;
        }

        section.classList.remove('hidden');
        notes.textContent = song.strum_notes || song.strum_pattern || '';
        this.renderStrumBuilder(preview, song.strum_steps.length ? song.strum_steps : this.parseSummaryToSteps(song.strum_pattern), false);
    },

    parseSummaryToSteps(summary) {
        if (!summary) {
            return [];
        }

        return summary.split(/\s+/).filter(Boolean).map((token) => ({
            direction: token.includes('↑') ? 'up' : 'down',
            accent: token.includes('!'),
            muted: token.includes('x')
        }));
    },

    renderSongVideo(url) {
        const section = document.getElementById('viewLinksSection');
        const embedWrapper = document.getElementById('viewVideoEmbed');
        const iframe = document.getElementById('viewYoutube');
        const linkNode = document.getElementById('viewVideoLink');

        section.classList.add('hidden');
        embedWrapper.classList.add('hidden');
        linkNode.classList.add('hidden');
        iframe.src = '';

        if (!url) {
            return;
        }

        section.classList.remove('hidden');
        const youtubeId = this.extractYoutubeId(url);
        if (youtubeId) {
            embedWrapper.classList.remove('hidden');
            iframe.src = `https://www.youtube.com/embed/${youtubeId}`;
        }

        linkNode.href = url;
        linkNode.classList.remove('hidden');
    },

    extractYoutubeId(url) {
        const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.*\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
        return match ? match[1] : null;
    },

    async handleSaveSong() {
        if (!this.hasGitHubConfig()) {
            alert('Сначала заполните GitHub-настройки.');
            this.openSettings();
            return;
        }

        const title = document.getElementById('songTitle').value.trim();
        const artist = document.getElementById('songArtist').value.trim();
        const text = this.normalizeSongText(document.getElementById('songText').value);

        if (!title || !artist) {
            alert('Нужно заполнить хотя бы название и исполнителя.');
            return;
        }

        if (!text) {
            alert('Добавьте текст песни или распознайте его со скрина.');
            return;
        }

        const song = this.normalizeSongObject({
            id: Date.now().toString(),
            title,
            artist,
            key: document.getElementById('songKey').value.trim(),
            bpm: document.getElementById('songBpm').value,
            capo: document.getElementById('songCapo').value,
            tuning: document.getElementById('songTuning').value.trim(),
            video_url: document.getElementById('songVideoUrl').value.trim(),
            fingerings: document.getElementById('songFingerings').value.trim(),
            strum_notes: document.getElementById('strumNotes').value.trim(),
            strum_pattern: this.buildStrumSummary(),
            strum_steps: this.state.currentStrumSteps,
            text,
            study_tips: []
        });

        const duplicate = this.state.songs.find((item) => item.title.toLowerCase() === song.title.toLowerCase() && item.artist.toLowerCase() === song.artist.toLowerCase());
        if (duplicate && !confirm('Такая песня уже есть. Сохранить ещё одну копию?')) {
            return;
        }

        const updatedSongs = [...this.state.songs, song];
        try {
            await this.saveSongsToGitHub(updatedSongs, `Добавлена песня: ${song.title} — ${song.artist}`);
            this.state.songs = updatedSongs;
            this.clearSongForm();
            this.showView('libraryView');
        } catch (error) {
            console.error(error);
            alert(`Не удалось сохранить песню: ${error.message}`);
        }
    },

    clearSongForm() {
        document.getElementById('addSongForm').reset();
        this.state.currentStrumSteps = [];
        this.state.selectedStrumIndex = -1;
        this.state.pendingLyricsImages = [];
        this.state.pendingPatternImages = [];
        document.getElementById('lyricsUploadSummary').textContent = 'Скрины текста не выбраны';
        document.getElementById('patternUploadSummary').textContent = 'Скрины боя не выбраны';
        this.renderStrumBuilder();
        this.updatePreview();
        this.clearDraft();
    },

    async deleteSongById(songId) {
        const song = this.state.songs.find((item) => item.id === songId);
        if (!song) {
            return;
        }

        if (!confirm(`Удалить песню "${song.title}"?`)) {
            return;
        }

        const nextSongs = this.state.songs.filter((item) => item.id !== songId);
        try {
            await this.saveSongsToGitHub(nextSongs, `Удалена песня: ${song.title}`);
            this.state.songs = nextSongs;
            if (this.state.currentSongId === songId) {
                this.state.currentSongId = null;
                this.showView('libraryView');
            } else {
                this.applyLibraryFilters();
            }
        } catch (error) {
            console.error(error);
            alert(`Не удалось удалить песню: ${error.message}`);
        }
    },

    deleteCurrentSong() {
        if (!this.state.currentSongId) {
            return;
        }

        this.deleteSongById(this.state.currentSongId);
    },

    async filesToInlineData(files) {
        return Promise.all(files.map((file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
                inlineData: {
                    mimeType: file.type || 'image/png',
                    data: String(reader.result).split(',')[1]
                }
            });
            reader.onerror = () => reject(new Error(`Не удалось прочитать файл ${file.name}`));
            reader.readAsDataURL(file);
        })));
    },

    async ensureGeminiModel() {
        if (this.state.selectedModel) {
            return this.state.selectedModel;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.state.googleApiKey}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || 'Не удалось получить список моделей Gemini.');
        }

        const priority = ['models/gemini-2.5-flash', 'models/gemini-2.0-flash', 'models/gemini-1.5-flash'];
        const available = data.models || [];
        this.state.selectedModel = priority.find((name) => available.some((model) => model.name === name && model.supportedGenerationMethods?.includes('generateContent')))
            || available.find((model) => model.name.includes('gemini') && model.supportedGenerationMethods?.includes('generateContent'))?.name;

        if (!this.state.selectedModel) {
            throw new Error('Подходящая модель Gemini не найдена для текущего ключа.');
        }

        return this.state.selectedModel;
    },
    async requestGemini(parts) {
        if (!this.state.googleApiKey) {
            throw new Error('Добавьте Google Gemini API Key в настройках.');
        }

        const model = await this.ensureGeminiModel();
        const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${this.state.googleApiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                    temperature: 0.15,
                    topP: 0.9,
                    maxOutputTokens: 4096
                }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || 'Gemini вернул ошибку.');
        }

        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },

    extractJsonBlock(text) {
        const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) {
            throw new Error('AI не вернул JSON.');
        }
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    },

    applyAiSongData(result, { replaceText }) {
        if (result.title) {
            document.getElementById('songTitle').value = result.title;
        }
        if (result.artist) {
            document.getElementById('songArtist').value = result.artist;
        }
        if (result.key) {
            document.getElementById('songKey').value = result.key;
        }
        if (result.bpm) {
            document.getElementById('songBpm').value = result.bpm;
        }
        if (Number.isFinite(Number(result.capo))) {
            document.getElementById('songCapo').value = result.capo;
        }
        if (result.tuning) {
            document.getElementById('songTuning').value = result.tuning;
        }
        if (result.video_url) {
            document.getElementById('songVideoUrl').value = result.video_url;
        }
        if (result.fingering_notes) {
            document.getElementById('songFingerings').value = result.fingering_notes;
        }
        if (result.strum?.notes) {
            document.getElementById('strumNotes').value = result.strum.notes;
        }
        if (replaceText && result.text) {
            document.getElementById('songText').value = this.normalizeSongText(result.text);
        }

        if (Array.isArray(result.strum?.steps) && result.strum.steps.length) {
            this.state.currentStrumSteps = result.strum.steps.map((step) => ({
                direction: step.direction === 'up' ? 'up' : 'down',
                accent: Boolean(step.accent),
                muted: Boolean(step.muted)
            }));
            this.state.selectedStrumIndex = this.state.currentStrumSteps.length ? 0 : -1;
            this.renderStrumBuilder();
        }

        this.persistDraft();
        this.updatePreview();
    },

    async runSongAiExtraction({ fromTextOnly }) {
        const statusNode = document.getElementById('ocrStatus');
        const statusText = document.getElementById('ocrStatusText');
        const manualText = document.getElementById('songText').value.trim();
        const hasImages = this.state.pendingLyricsImages.length || this.state.pendingPatternImages.length;

        if (!fromTextOnly && !hasImages && !manualText) {
            alert('Добавьте скрины или вставьте текст перед запуском AI.');
            return;
        }

        if (fromTextOnly && !manualText) {
            alert('Сначала вставьте текст песни.');
            return;
        }

        statusNode.classList.remove('hidden');
        statusText.textContent = fromTextOnly ? 'AI добирает метаданные из текста...' : 'AI разбирает скрины и заполняет песню...';

        try {
            const imageParts = fromTextOnly
                ? []
                : [
                    ...(await this.filesToInlineData(this.state.pendingLyricsImages)),
                    ...(await this.filesToInlineData(this.state.pendingPatternImages))
                ];

            const prompt = `
Ты помогаешь собрать карточку гитарной песни из скринов и текста.
Верни только JSON без markdown и пояснений.

Требования:
- Если на скрине есть аккорды над текстом, сохрани их как отдельные строки аккордов над строками текста.
- Не теряй ведущие пробелы в строках с аккордами.
- Если виден бой, распознай его как массив шагов.
- Если есть акценты, пометь accent=true.
- Если есть глушение, пометь muted=true.
- Если метаданные не видны, оставь null или пустую строку.
- Если есть строй, BPM, капо, аппликатура, советы по сложным местам, вынеси их.

Схема JSON:
{
  "title": "",
  "artist": "",
  "key": "",
  "bpm": null,
  "capo": null,
  "tuning": "",
  "video_url": "",
  "fingering_notes": "",
  "text": "",
  "strum": {
    "notes": "",
    "steps": [
      { "direction": "down", "accent": false, "muted": false }
    ]
  },
  "study_tips": ["", ""]
}
`.trim();

            const parts = [{ text: prompt }];
            if (manualText) {
                parts.push({ text: `Уже введённый текст/заметки пользователя:\n${manualText}` });
            }
            imageParts.forEach((part) => parts.push(part));

            const rawResponse = await this.requestGemini(parts);
            const parsed = this.extractJsonBlock(rawResponse);
            this.applyAiSongData(parsed, { replaceText: true });
            alert('AI заполнил песню. Проверь текст и при необходимости поправь вручную.');
        } catch (error) {
            console.error(error);
            alert(`Не удалось обработать материалы: ${error.message}`);
        } finally {
            statusNode.classList.add('hidden');
        }
    },

    renderStoredStudyTips(studyTips) {
        if (!Array.isArray(studyTips) || !studyTips.length) {
            return '<p class="muted-copy">Нажми "Помочь в разборе", чтобы получить советы по изучению, замене баррэ и сложным местам.</p>';
        }

        return `
            <div>
                <h3>Короткие советы</h3>
                <ul>${studyTips.map((tip) => `<li>${this.escapeHtml(tip)}</li>`).join('')}</ul>
            </div>
        `;
    },

    async runStudyHelper() {
        const song = this.getCurrentSong();
        if (!song) {
            return;
        }

        const panel = document.getElementById('studyHelperPanel');
        const status = document.getElementById('studyHelperStatus');
        const output = document.getElementById('studyHelperOutput');
        panel.classList.remove('hidden');
        status.classList.remove('hidden');
        output.innerHTML = '';

        try {
            const prompt = `
Ты — помощник по гитарному разбору песни.
Верни только JSON.

Песня:
Название: ${song.title}
Исполнитель: ${song.artist}
Тональность: ${song.key || 'не указана'}
BPM: ${song.bpm || 'не указан'}
Строй: ${song.tuning || 'не указан'}
Бой: ${song.strum_pattern || 'не указан'}
Аппликатура: ${song.fingerings || 'нет'}
Текст:
${song.text}

Нужен JSON такого вида:
{
  "overview": "",
  "practice_plan": ["", ""],
  "barre_replacements": ["", ""],
  "hard_spots": ["", ""],
  "performance_advice": ["", ""],
  "study_tips": ["", ""]
}
`.trim();

            const rawResponse = await this.requestGemini([{ text: prompt }]);
            const parsed = this.extractJsonBlock(rawResponse);
            song.study_tips = parsed.study_tips || [];
            output.innerHTML = this.renderStudyHelper(parsed);
        } catch (error) {
            console.error(error);
            output.innerHTML = `<p class="error-text">${this.escapeHtml(error.message)}</p>`;
        } finally {
            status.classList.add('hidden');
        }
    },

    renderStudyHelper(data) {
        const sections = [
            ['Обзор', data.overview ? `<p>${this.escapeHtml(data.overview)}</p>` : ''],
            ['План разучивания', this.renderList(data.practice_plan)],
            ['Чем заменить баррэ', this.renderList(data.barre_replacements)],
            ['Сложные места', this.renderList(data.hard_spots)],
            ['Советы по исполнению', this.renderList(data.performance_advice)],
            ['Быстрые подсказки', this.renderList(data.study_tips)]
        ].filter(([, content]) => content);

        return sections.map(([title, content]) => `<div><h3>${this.escapeHtml(title)}</h3>${content}</div>`).join('');
    },

    renderList(items) {
        if (!Array.isArray(items) || !items.length) {
            return '';
        }
        return `<ul>${items.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>`;
    },

    toggleAutoscroll() {
        if (this.state.scrollInterval) {
            this.stopAutoscroll();
            return;
        }
        this.startAutoscroll();
    },

    startAutoscroll() {
        const button = document.getElementById('autoscrollBtn');
        button.textContent = 'Пауза';
        this.state.scrollInterval = setInterval(() => {
            window.scrollBy({ top: this.state.scrollSpeed / 1.8, left: 0, behavior: 'auto' });
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
                this.stopAutoscroll();
            }
        }, 45);
    },

    stopAutoscroll() {
        if (this.state.scrollInterval) {
            clearInterval(this.state.scrollInterval);
            this.state.scrollInterval = null;
        }
        const button = document.getElementById('autoscrollBtn');
        if (button) {
            button.textContent = 'Автоскролл';
        }
    },

    updateScrollSpeed(value) {
        this.state.scrollSpeed = Number(value) || 3;
        document.getElementById('speedValue').textContent = String(this.state.scrollSpeed);
    }
};

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((error) => {
            console.error('Ошибка регистрации service worker:', error);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => app.init());

const STRUM_PATTERN_LIBRARY = [
    {
        id: 'shesterka',
        name: 'Шестёрка',
        aliases: ['шестерка', 'шестёрка', 'бой шестерка', 'бой шестёрка', '6', 'six'],
        steps: [
            { direction: 'down', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false }
        ]
    },
    {
        id: 'vosmerka',
        name: 'Восьмёрка',
        aliases: ['восьмерка', 'восьмёрка', 'бой восьмерка', 'бой восьмёрка', '8', 'eight'],
        steps: [
            { direction: 'down', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false }
        ]
    },
    {
        id: 'chetverka',
        name: 'Четвёрка',
        aliases: ['четверка', 'четвёрка', 'бой четверка', 'бой четвёрка', '4', 'four'],
        steps: [
            { direction: 'down', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false },
            { direction: 'down', accent: false, muted: true },
            { direction: 'up', accent: false, muted: false }
        ]
    },
    {
        id: 'tsoi',
        name: 'Бой Цоя',
        aliases: ['бой цоя', 'цой', 'tsoi'],
        steps: [
            { direction: 'down', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false },
            { direction: 'down', accent: true, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'up', accent: true, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false }
        ]
    },
    {
        id: 'vysotsky',
        name: 'Бой Высоцкого',
        aliases: ['бой высоцкого', 'высоцкий'],
        steps: [
            { direction: 'up', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false }
        ]
    },
    {
        id: 'spanish',
        name: 'Испанский бой',
        aliases: ['испанский бой', 'расгеадо', 'rasgueado'],
        steps: [
            { direction: 'down', accent: true, muted: false },
            { direction: 'up', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false }
        ]
    },
    {
        id: 'rozenbaum',
        name: 'Бой Розенбаума',
        aliases: ['бой розенбаума', 'розенбаум'],
        steps: [
            { direction: 'up', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false },
            { direction: 'down', accent: false, muted: true },
            { direction: 'up', accent: false, muted: false }
        ]
    },
    {
        id: 'reggae',
        name: 'Бой регги',
        aliases: ['бой регги', 'регги'],
        steps: [
            { direction: 'down', accent: false, muted: true },
            { direction: 'down', accent: true, muted: false }
        ]
    },
    {
        id: 'country',
        name: 'Бой кантри',
        aliases: ['бой кантри', 'кантри'],
        steps: [
            { direction: 'down', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false }
        ]
    },
    {
        id: 'waltz',
        name: 'Вальсовый бой',
        aliases: ['вальсовый бой', 'вальс', '3/4'],
        steps: [
            { direction: 'down', accent: true, muted: false },
            { direction: 'up', accent: false, muted: false },
            { direction: 'up', accent: false, muted: false }
        ]
    },
    {
        id: 'chechen',
        name: 'Чеченский бой',
        aliases: ['чеченский бой', 'чеченский'],
        steps: [
            { direction: 'down', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'down', accent: false, muted: false },
            { direction: 'down', accent: true, muted: false }
        ]
    }
];

const app = {
    state: {
        songs: [],
        filteredSongs: [],
        currentView: 'homeView',
        currentWizardStep: 1,
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
        studyHelperCollapsed: false,
        selectedModel: null,
        previewObjectUrls: []
    },

    init() {
        this.loadSettings();
        this.applyTheme();
        this.bindEvents();
        this.loadDraft();
        this.renderStrumBuilder();
        this.renderStrumPresetOptions();
        this.updateWizard();
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

        document.getElementById('wizardPrevBtn').addEventListener('click', () => this.goWizardStep(-1));
        document.getElementById('wizardNextBtn').addEventListener('click', () => this.goWizardStep(1));
        document.querySelectorAll('.wizard-step').forEach((button) => {
            button.addEventListener('click', () => this.setWizardStep(Number(button.dataset.step)));
        });

        document.getElementById('lyricsImageInput').addEventListener('change', (event) => {
            this.prepareImages(event.target.files, 'pendingLyricsImages', 'lyricsUploadSummary', 'Скрины текста');
        });
        document.getElementById('patternImageInput').addEventListener('change', (event) => {
            this.prepareImages(event.target.files, 'pendingPatternImages', 'patternUploadSummary', 'Скрины боя');
        });

        const pasteZone = document.getElementById('lyricsPasteZone');
        pasteZone.addEventListener('click', () => pasteZone.focus());
        pasteZone.addEventListener('paste', (event) => this.handleImagePaste(event));

        document.addEventListener('paste', (event) => {
            if (event.defaultPrevented) {
                return;
            }
            const target = event.target;
            const isFormInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
            if (this.state.currentView !== 'addView' || isFormInput) {
                return;
            }
            this.handleImagePaste(event);
        });

        ['songArtist', 'songTitle', 'songVideoUrl', 'songKey', 'songBpm', 'songCapo', 'songTuning', 'songFingerings', 'strumNotes'].forEach((id) => {
            document.getElementById(id).addEventListener('input', () => this.persistDraft());
        });

        document.getElementById('songText').addEventListener('input', () => {
            this.persistDraft();
            this.updatePreview();
        });

        document.querySelectorAll('.stroke-btn').forEach((button) => {
            button.addEventListener('click', () => this.addStrumStep(button.dataset.direction));
        });
        document.getElementById('toggleAccentBtn').addEventListener('click', () => this.toggleSelectedStrumFlag('accent'));
        document.getElementById('toggleMuteBtn').addEventListener('click', () => this.toggleSelectedStrumFlag('muted'));
        document.getElementById('deleteStepBtn').addEventListener('click', () => this.deleteSelectedStrumStep());
        document.getElementById('clearStrumBtn').addEventListener('click', () => this.clearStrumSteps());
        document.getElementById('strumPresetSelect').addEventListener('change', (event) => this.applyStrumPreset(event.target.value));
        document.getElementById('studyHelperBtn').addEventListener('click', () => this.toggleStudyHelperPanel());
        document.getElementById('runStudyHelperBtn').addEventListener('click', () => this.runStudyHelper());
        const collapseBtn = document.getElementById('studyHelperCollapseBtn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => this.toggleStudyHelperContent());
        }
        document.getElementById('songTextQuick').addEventListener('input', (event) => this.syncQuickTextToMain(event.target.value));
        document.getElementById('songTuningPreset').addEventListener('change', (event) => this.applyTuningPreset(event.target.value));

        document.addEventListener('click', (event) => {
            const removeButton = event.target.closest('[data-remove-image]');
            if (removeButton) {
                this.removePendingImage(removeButton.dataset.type, Number(removeButton.dataset.index));
            }
            if (this.state.scrollInterval && this.state.currentView === 'songView' && !event.target.closest('#autoscrollBtn')) {
                this.stopAutoscroll();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (this.state.currentView === 'songView' && this.state.scrollInterval && event.code === 'Space') {
                event.preventDefault();
                this.stopAutoscroll();
            }
        });
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
        this.state.theme = document.getElementById('themeSelect').value;

        localStorage.setItem('ghUsername', this.state.ghUsername);
        localStorage.setItem('ghRepo', this.state.ghRepo);
        localStorage.setItem('ghToken', this.state.ghToken);
        localStorage.setItem('googleApiKey', this.state.googleApiKey);
        localStorage.setItem('theme', this.state.theme);
        this.applyTheme();

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
        document.getElementById('themeSelect').value = this.state.theme;
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
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = this.state.theme;
        }
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
            this.setWizardStep(1);
            this.updatePreview();
        }
        if (viewId !== 'songView') {
            this.toggleStudyHelperPanel(false);
        }
    },

    setWizardStep(step) {
        this.state.currentWizardStep = Math.max(1, Math.min(3, step));
        this.updateWizard();
        this.updatePreview();
    },

    goWizardStep(delta) {
        this.setWizardStep(this.state.currentWizardStep + delta);
    },

    updateWizard() {
        document.querySelectorAll('.wizard-step').forEach((button) => {
            button.classList.toggle('active', Number(button.dataset.step) === this.state.currentWizardStep);
        });
        document.querySelectorAll('.wizard-page').forEach((section) => {
            section.classList.toggle('active', Number(section.dataset.page) === this.state.currentWizardStep);
        });
        const nextButton = document.getElementById('wizardNextBtn');
        document.getElementById('wizardPrevBtn').disabled = this.state.currentWizardStep === 1;
        nextButton.disabled = this.state.currentWizardStep === 3;
        nextButton.classList.toggle('hidden', this.state.currentWizardStep === 3);
        nextButton.textContent = this.state.currentWizardStep === 1 ? 'К проверке' : 'К сохранению';
    },

    persistDraft() {
        const draft = {
            artist: document.getElementById('songArtist').value,
            title: document.getElementById('songTitle').value,
            videoUrl: document.getElementById('songVideoUrl').value,
            key: document.getElementById('songKey').value,
            bpm: document.getElementById('songBpm').value,
            capo: document.getElementById('songCapo').value,
            tuning: document.getElementById('songTuning').value,
            fingerings: document.getElementById('songFingerings').value,
            strumNotes: document.getElementById('strumNotes').value,
            text: document.getElementById('songText').value,
            quickText: document.getElementById('songTextQuick').value,
            tuningPreset: document.getElementById('songTuningPreset').value,
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
            document.getElementById('songVideoUrl').value = draft.videoUrl || '';
            document.getElementById('songKey').value = draft.key || '';
            document.getElementById('songBpm').value = draft.bpm || '';
            document.getElementById('songCapo').value = draft.capo || '';
            document.getElementById('songTuning').value = draft.tuning || '';
            document.getElementById('songTuningPreset').value = draft.tuningPreset || '';
            document.getElementById('songFingerings').value = draft.fingerings || '';
            document.getElementById('strumNotes').value = draft.strumNotes || '';
            document.getElementById('songText').value = draft.text || '';
            document.getElementById('songTextQuick').value = draft.quickText || draft.text || '';
            this.state.currentStrumSteps = Array.isArray(draft.strumSteps) ? draft.strumSteps : [];
            this.state.selectedStrumIndex = this.state.currentStrumSteps.length ? 0 : -1;
        } catch (error) {
            console.error('Не удалось загрузить черновик:', error);
        }
    },

    clearDraft() {
        localStorage.removeItem('songDraft');
    },

    syncQuickTextToMain(value) {
        document.getElementById('songText').value = value;
        this.persistDraft();
        this.updatePreview();
    },

    applyTuningPreset(value) {
        if (value) {
            document.getElementById('songTuning').value = value;
        }
        this.persistDraft();
    },

    handleImagePaste(event) {
        if (event.defaultPrevented) {
            return;
        }
        const items = (event.clipboardData || event.originalEvent?.clipboardData)?.items || [];
        const imageFiles = [];
        for (let index = 0; index < items.length; index += 1) {
            const item = items[index];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                imageFiles.push(item.getAsFile());
            }
        }
        if (imageFiles.length) {
            event.preventDefault();
            this.prepareImages(imageFiles, 'pendingLyricsImages', 'lyricsUploadSummary', 'Скрины текста');
            this.setWizardStep(1);
        }
    },

    prepareImages(fileList, stateKey, summaryId, label) {
        const nextFiles = Array.from(fileList || []).filter(Boolean);
        this.state[stateKey] = [...this.state[stateKey], ...nextFiles];
        this.updateUploadUi(stateKey, summaryId, label);
    },

    updateUploadUi(stateKey, summaryId, label) {
        document.getElementById(summaryId).textContent = this.state[stateKey].length
            ? label + ': ' + this.state[stateKey].length + ' шт.'
            : label + ' не выбраны';

        const listId = stateKey === 'pendingLyricsImages' ? 'lyricsUploadList' : 'patternUploadList';
        this.renderUploadList(listId, stateKey);

        if (stateKey === 'pendingLyricsImages') {
            const pasteZone = document.getElementById('lyricsPasteZone');
            const hasContent = this.state[stateKey].length > 0;
            pasteZone.classList.toggle('has-content', hasContent);
            pasteZone.querySelector('strong').textContent = hasContent ? 'Скрины добавлены в очередь' : 'Вставить скрин из буфера';
            pasteZone.querySelector('span').textContent = hasContent
                ? 'Можно запускать AI или продолжать докидывать материалы.'
                : 'Кликни сюда и нажми Ctrl + V. На телефоне используй выбор файла.';
        }
    },
    renderUploadList(listId, stateKey) {
        const node = document.getElementById(listId);
        if (!node) {
            return;
        }
        const files = this.state[stateKey];
        if (!files.length) {
            node.className = 'upload-list empty';
            node.textContent = stateKey === 'pendingLyricsImages' ? 'Пока нет добавленных скринов текста.' : 'Пока нет добавленных скринов боя.';
            return;
        }
        node.className = 'upload-list';
        node.innerHTML = files.map((file, index) => `
            <div class="upload-item">
                <span>${this.escapeHtml(file.name || `Файл ${index + 1}`)}</span>
                <button type="button" class="ghost-btn upload-remove-btn" data-remove-image data-type="${stateKey}" data-index="${index}">Убрать</button>
            </div>
        `).join('');
    },
    removePendingImage(stateKey, index) {
        if (!Array.isArray(this.state[stateKey])) {
            return;
        }
        this.state[stateKey].splice(index, 1);
        const summaryId = stateKey === 'pendingLyricsImages' ? 'lyricsUploadSummary' : 'patternUploadSummary';
        const label = stateKey === 'pendingLyricsImages' ? 'Скрины текста' : 'Скрины боя';
        this.updateUploadUi(stateKey, summaryId, label);
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
            const node = document.createElement(interactive ? 'button' : 'div');
            node.className = `strum-step${step.accent ? ' accent' : ''}${step.muted ? ' muted' : ''}${interactive && index === this.state.selectedStrumIndex ? ' selected' : ''}`;
            node.innerHTML = `
                <span class="strum-step-direction">${step.direction === 'up' ? '↑' : '↓'}</span>
                <span class="strum-step-meta">${this.describeStep(step)}</span>
            `;
            if (interactive) {
                node.type = 'button';
                node.addEventListener('click', () => {
                    this.state.selectedStrumIndex = index;
                    this.renderStrumBuilder();
                });
            }
            target.appendChild(node);
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
        return parts.length ? parts.join(' / ') : 'обычно';
    },
    renderStrumPresetOptions() {
        const select = document.getElementById('strumPresetSelect');
        if (!select) {
            return;
        }
        select.innerHTML = '<option value="">Выбрать шаблон</option>'
            + STRUM_PATTERN_LIBRARY.map((pattern) => `<option value="${pattern.id}">${this.escapeHtml(pattern.name)}</option>`).join('');
    },

    clonePatternSteps(steps) {
        return steps.map((step) => ({
            direction: step.direction === 'up' ? 'up' : 'down',
            accent: Boolean(step.accent),
            muted: Boolean(step.muted)
        }));
    },

    applyStrumPreset(patternId) {
        if (!patternId) {
            return;
        }
        const pattern = STRUM_PATTERN_LIBRARY.find((item) => item.id === patternId);
        if (!pattern) {
            return;
        }
        this.state.currentStrumSteps = this.clonePatternSteps(pattern.steps);
        this.state.selectedStrumIndex = this.state.currentStrumSteps.length ? 0 : -1;
        document.getElementById('strumNotes').value = `Шаблон: ${pattern.name}`;
        this.renderStrumBuilder();
        this.persistDraft();
        this.updatePreview();
    },

    normalizeStrumText(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/ё/g, 'е')
            .replace(/[.,;:()\[\]{}]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    },

    parseArrowSteps(text) {
        const normalized = String(text || '')
            .replace(/вниз/gi, '↓')
            .replace(/вверх/gi, '↑')
            .replace(/down/gi, '↓')
            .replace(/up/gi, '↑');
        const tokens = normalized.match(/[↓↑][!xх]?/g) || [];
        if (!tokens.length) {
            return [];
        }
        return tokens.map((token) => ({
            direction: token.startsWith('↑') ? 'up' : 'down',
            accent: token.includes('!'),
            muted: /x|х/i.test(token)
        }));
    },

    matchStrumPatternByText(rawText) {
        const textValue = this.normalizeStrumText(rawText);
        if (!textValue) {
            return null;
        }
        return STRUM_PATTERN_LIBRARY.find((pattern) => pattern.aliases.some((alias) => textValue.includes(this.normalizeStrumText(alias)))) || null;
    },

    resolveStrumStepsFromAi(result) {
        if (Array.isArray(result?.strum?.steps) && result.strum.steps.length) {
            return this.clonePatternSteps(result.strum.steps);
        }

        const textCandidates = [result?.strum?.notes, result?.strum_pattern, result?.text].filter(Boolean).join(' \n ');

        const arrowSteps = this.parseArrowSteps(textCandidates);
        if (arrowSteps.length) {
            return arrowSteps;
        }

        const matched = this.matchStrumPatternByText(textCandidates);
        if (matched) {
            return this.clonePatternSteps(matched.steps);
        }

        return [];
    },
    buildStrumSummary(steps = this.state.currentStrumSteps) {
        return steps.map((step) => {
            const direction = step.direction === 'up' ? '↑' : '↓';
            const accent = step.accent ? '!' : '';
            const muted = step.muted ? 'x' : '';
            return `${direction}${accent}${muted}`;
        }).join(' ');
    },
    normalizeSongText(rawText) {
        if (!rawText) {
            return '';
        }
        let text = rawText.replace(/\r/g, '').replace(/\t/g, '    ').replace(/[ ]+$/gm, '');
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
        return text.replace(/\n{4,}/g, '\n\n\n');
    },
    isChordLine(line) {
        const trimmed = line.trim();
        if (!trimmed) {
            return false;
        }
        const tokens = trimmed.split(/\s+/).filter(Boolean);
        return tokens.length > 0 && tokens.every((token) => /^[A-GH](?:#|b)?(?:m|maj7|maj|min|dim|aug|sus2|sus4|sus|add9|m7|7|9|11|13)?(?:\/[A-GH](?:#|b)?)?$/.test(token));
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
            if (/^[\u0410-\u042FA-Z][^:]{0,40}:$/u.test(trimmed)) {
                blocks.push(`<div class="song-line-single section-label">${this.escapeHtml(trimmed)}</div>`);
                continue;
            }
            blocks.push(`<div class="song-line-single">${this.escapeHtml(currentLine)}</div>`);
        }
        return blocks.join('');
    },

    updatePreview() {
        this.renderSourcePreview();
        const text = this.normalizeSongText(document.getElementById('songText').value);
        const previewNode = document.getElementById('songPreview');
        const parts = [];
        const strumSummary = this.buildStrumSummary();
        if (strumSummary) {
            parts.push(`<div class="song-line-single"><strong>Бой:</strong> ${this.escapeHtml(strumSummary)}</div>`);
        }
        if (text.trim()) {
            previewNode.classList.remove('song-preview-empty');
            previewNode.innerHTML = parts.join('') + this.renderSongMarkup(text);
        } else {
            previewNode.classList.add('song-preview-empty');
            previewNode.innerHTML = parts.length ? parts.join('') : 'Предпросмотр появится после ввода текста или запуска AI.';
        }
    },
    revokePreviewUrls() {
        if (!Array.isArray(this.state.previewObjectUrls)) {
            this.state.previewObjectUrls = [];
            return;
        }
        this.state.previewObjectUrls.forEach((url) => URL.revokeObjectURL(url));
        this.state.previewObjectUrls = [];
    },

    renderSourcePreview() {
        const node = document.getElementById('sourcePreview');
        if (!node) {
            return;
        }

        this.revokePreviewUrls();

        const groups = [
            { title: 'Текст/аккорды', files: this.state.pendingLyricsImages || [] },
            { title: 'Бой/схемы', files: this.state.pendingPatternImages || [] }
        ].filter((group) => group.files.length);

        if (!groups.length) {
            node.classList.add('hidden');
            node.innerHTML = '';
            return;
        }

        const thumbs = [];
        groups.forEach((group) => {
            group.files.forEach((file, index) => {
                const url = URL.createObjectURL(file);
                this.state.previewObjectUrls.push(url);
                thumbs.push(
                    '<div class="source-preview-thumb">'
                    + `<img src="${url}" alt="${this.escapeHtml(group.title)} ${index + 1}">`
                    + `<span>${this.escapeHtml(group.title)} ${index + 1}</span>`
                    + '</div>'
                );
            });
        });

        node.classList.remove('hidden');
        node.innerHTML = '<span class="source-preview-title">Загруженные материалы из шага 1</span>'
            + `<div class="source-preview-grid">${thumbs.join('')}</div>`;
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
        return { content: JSON.parse(decoded), sha: data.sha };
    },

    async saveSongsToGitHub(songs, message) {
        const url = `https://api.github.com/repos/${this.state.ghUsername}/${this.state.ghRepo}/contents/songs.json`;
        const { sha } = await this.getGitHubFile();
        const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(songs, null, 2))));
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                Authorization: `token ${this.state.ghToken}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message, content: encodedContent, sha })
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
            return [song.title, song.artist, song.key, song.tuning].filter(Boolean).some((value) => value.toLowerCase().includes(query));
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
            grid.innerHTML = '<p class="loading-text">Пока пусто. Добавьте первую песню через мастер.</p>';
            return;
        }
        grid.innerHTML = '';
        songs.forEach((song) => {
            const card = document.createElement('article');
            card.className = 'song-card';
            const badges = [song.key && `Тональность: ${song.key}`, song.bpm && `BPM: ${song.bpm}`, song.strum_pattern && `Бой: ${song.strum_pattern}`]
                .filter(Boolean)
                .map((badge) => `<span class="song-badge">${this.escapeHtml(badge)}</span>`)
                .join('');
            card.innerHTML = `
                <div class="song-card-top">
                    <div>
                        <h3>${this.escapeHtml(song.title)}</h3>
                        <p>${this.escapeHtml(song.artist)}</p>
                    </div>
                    <button class="danger-btn" type="button">Удалить</button>
                </div>
                <div class="song-meta">${badges || '<span class="song-badge">Метаданные не заполнены</span>'}</div>
            `;
            card.addEventListener('click', () => this.openSongView(song.id));
            card.querySelector('.danger-btn').addEventListener('click', (event) => {
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
        document.getElementById('viewMeta').innerHTML = [
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
        const steps = song.strum_steps.length ? song.strum_steps : this.parseSummaryToSteps(song.strum_pattern);
        section.classList.remove('hidden');
        notes.textContent = song.strum_notes || '';
        preview.innerHTML = steps.length
            ? `<div class="strum-inline">${steps.map((step) => `<span class="strum-chip${step.accent ? ' accent' : ''}${step.muted ? ' muted' : ''}">${step.direction === 'up' ? '↑' : '↓'}</span>`).join('')}</div>`
            : `<div class="strum-pattern-text">${this.escapeHtml(song.strum_pattern)}</div>`;
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
            this.setWizardStep(1);
            return;
        }
        if (!text) {
            alert('Добавьте текст песни или распознайте его со скрина.');
            this.setWizardStep(2);
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
            this.applyLibraryFilters();
            this.openSongView(song.id);
        } catch (error) {
            alert(`Не удалось сохранить песню: ${error.message}`);
        }
    },
    clearSongForm() {
        document.getElementById('addSongForm').reset();
        this.state.currentStrumSteps = [];
        this.state.selectedStrumIndex = -1;
        this.state.pendingLyricsImages = [];
        this.state.pendingPatternImages = [];
        this.revokePreviewUrls();
        document.getElementById('lyricsUploadSummary').textContent = 'Скрины текста не выбраны';
        document.getElementById('patternUploadSummary').textContent = 'Скрины боя не выбраны';
        document.getElementById('lyricsUploadList').textContent = 'Пока нет добавленных скринов текста.';
        document.getElementById('lyricsUploadList').className = 'upload-list empty';
        document.getElementById('patternUploadList').textContent = 'Пока нет добавленных скринов боя.';
        document.getElementById('patternUploadList').className = 'upload-list empty';
        document.getElementById('songTextQuick').value = '';
        document.getElementById('songTuningPreset').value = '';
        document.getElementById('strumPresetSelect').value = '';
        const pasteZone = document.getElementById('lyricsPasteZone');
        pasteZone.classList.remove('has-content');
        pasteZone.querySelector('strong').textContent = 'Вставить скрин из буфера';
        pasteZone.querySelector('span').textContent = 'Кликни сюда и нажми Ctrl + V. На телефоне используй выбор файла.';
        this.renderStrumBuilder();
        this.updatePreview();
        this.clearDraft();
        this.setWizardStep(1);
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
            alert(`Не удалось удалить песню: ${error.message}`);
        }
    },
    deleteCurrentSong() {
        if (this.state.currentSongId) {
            this.deleteSongById(this.state.currentSongId);
        }
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${this.state.googleApiKey}`, {
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

    showView(viewId) {
        document.querySelectorAll('.view').forEach((view) => view.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');

        if (viewId === 'homeView') {
            document.querySelectorAll('.app-header .header-actions:not(.minimal-actions)').forEach(el => el.classList.remove('hidden'));
            this.state.currentView = 'homeView';
        } else if (viewId === 'libraryView') {
            this.loadSongs();
            this.state.currentView = 'libraryView';
        } else if (viewId === 'addView') {
            this.state.currentView = 'addView';
            this.renderStrumBuilder();
        } else if (viewId === 'songView') {
            this.state.currentView = 'songView';
        }
        window.scrollTo(0, 0);
    },

    applyAiSongData(result, { replaceText }) {
        if (result.title) document.getElementById('songTitle').value = result.title;
        if (result.artist) document.getElementById('songArtist').value = result.artist;
        if (result.video_url) document.getElementById('songVideoUrl').value = result.video_url;
        if (result.key) document.getElementById('songKey').value = result.key;
        if (result.bpm) document.getElementById('songBpm').value = result.bpm;
        if (Number.isFinite(Number(result.capo))) document.getElementById('songCapo').value = result.capo;
        if (result.tuning) document.getElementById('songTuning').value = result.tuning;
        if (result.fingering_notes) document.getElementById('songFingerings').value = result.fingering_notes;
        if (result.strum?.notes) document.getElementById('strumNotes').value = result.strum.notes;
        if (replaceText && result.text) document.getElementById('songText').value = this.normalizeSongText(result.text);
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
        this.setWizardStep(2);
    },
    async runSongAiExtraction({ fromTextOnly }) {
        const statusNode = document.getElementById('ocrStatus');
        const statusText = document.getElementById('ocrStatusText');
        const manualText = document.getElementById('songText').value.trim();
        const hasImages = this.state.pendingLyricsImages.length || this.state.pendingPatternImages.length;
        if (!fromTextOnly && !hasImages && !manualText) {
            alert('Добавьте скрины или вставьте текст перед запуском AI.');
            this.setWizardStep(1);
            return;
        }
        if (fromTextOnly && !manualText) {
            alert('Сначала вставьте текст песни.');
            this.setWizardStep(2);
            return;
        }
        statusNode.classList.remove('hidden');
        statusText.textContent = fromTextOnly ? 'AI добирает метаданные из текста...' : 'AI разбирает скрины и заполняет песню...';
        try {
            const lyricImageParts = fromTextOnly ? [] : await this.filesToInlineData(this.state.pendingLyricsImages);
            const patternImageParts = fromTextOnly ? [] : await this.filesToInlineData(this.state.pendingPatternImages);
            const prompt = `
Ты помогаешь собрать карточку гитарной песни из скринов и текста.
Верни только JSON без markdown и пояснений.

Требования:
- Если на скрине есть аккорды над текстом, сохрани их как отдельные строки аккордов над строками текста.
- Не теряй ведущие пробелы в строках с аккордами.
- Если виден бой, распознай его как массив шагов.
- Ориентируйся на базовые шаблоны: Шестёрка, Восьмёрка, Четвёрка, Бой Цоя, Бой Высоцкого, Испанский бой, Бой Розенбаума, Бой регги, Бой кантри, Вальсовый бой, Чеченский бой.
- Если есть акценты, пометь accent=true.
- Если есть глушение, пометь muted=true.
- Если метаданные не видны, оставь null или пустую строку.
- Если есть строй, BPM, капо и аппликатура, вынеси их.

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
                parts.push({ text: `Уже введённый текст пользователя:\n${manualText}` });
            }
            if (lyricImageParts.length) {
                parts.push({ text: 'Скрины текста и аккордов:' });
                lyricImageParts.forEach((part) => parts.push(part));
            }
            if (patternImageParts.length) {
                parts.push({ text: 'Скрины боя и схем ударов:' });
                patternImageParts.forEach((part) => parts.push(part));
            }
            const rawResponse = await this.requestGemini(parts);
            const parsed = this.extractJsonBlock(rawResponse);
            this.applyAiSongData(parsed, { replaceText: true });
            alert('AI заполнил песню. Проверь результат на шаге 2.');
        } catch (error) {
            alert(`Не удалось обработать материалы: ${error.message}`);
        } finally {
            statusNode.classList.add('hidden');
        }
    },

    renderStoredStudyTips(studyTips) {
        if (!Array.isArray(studyTips) || !studyTips.length) {
            return '<p class="muted-copy">Открой AI-помощь и выбери, с чем нужна помощь по этой песне.</p>';
        }
        return `<section class="helper-card"><h3>Короткие советы</h3><div class="helper-list">${studyTips.map((tip) => `<p>${this.escapeHtml(tip)}</p>`).join('')}</div></section>`;
    },

    toggleStudyHelperPanel(forceOpen) {
        const panel = document.getElementById('studyHelperPanel');
        const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : panel.classList.contains('hidden');
        panel.classList.toggle('hidden', !shouldOpen);
        if (shouldOpen) {
            this.toggleStudyHelperContent(false);
            if (!document.getElementById('studyHelperOutput').innerHTML.trim()) {
                document.getElementById('studyHelperOutput').innerHTML = this.renderStoredStudyTips(this.getCurrentSong()?.study_tips || []);
            }
        }
    },

    toggleStudyHelperContent(forceCollapsed) {
        const content = document.getElementById('studyHelperContent');
        const button = document.getElementById('studyHelperCollapseBtn');
        const panel = document.getElementById('studyHelperPanel');
        if (!content || !button || !panel) {
            return;
        }
        const collapse = typeof forceCollapsed === 'boolean'
            ? forceCollapsed
            : !this.state.studyHelperCollapsed;
        this.state.studyHelperCollapsed = collapse;
        content.classList.toggle('hidden', collapse);
        panel.classList.toggle('helper-collapsed', collapse);
        button.textContent = collapse ? 'Развернуть советы' : 'Свернуть советы';
    },

    async runStudyHelper() {
        const song = this.getCurrentSong();
        if (!song) {
            return;
        }
        const mode = document.getElementById('studyHelperMode').value;
        const panel = document.getElementById('studyHelperPanel');
        const status = document.getElementById('studyHelperStatus');
        const output = document.getElementById('studyHelperOutput');
        const modePrompts = {
            overview: 'Нужна общая помощь по разбору песни: как играть, на что обратить внимание, как воспринимать форму.',
            chords: 'Нужна помощь именно по аккордам: какие переходы сложные, что проверить, как упростить.',
            barre: 'Нужна помощь по замене баррэ и упрощённым вариантам аккордов.',
            practice: 'Нужен план, как быстрее выучить песню и довести до уверенного исполнения.'
        };
        panel.classList.remove('hidden');
        this.toggleStudyHelperContent(false);
        status.classList.remove('hidden');
        output.innerHTML = '';
        try {
            const prompt = `
Ты — помощник по гитарному разбору песни.
Верни только JSON без markdown-разметки внутри строк (не используй **, __, списки с маркерами).

Запрос пользователя:
${modePrompts[mode] || modePrompts.overview}

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
            song.study_tips = Array.isArray(parsed.study_tips) ? parsed.study_tips.map((tip) => this.sanitizeAiText(tip)).filter(Boolean) : [];
            output.innerHTML = this.renderStudyHelper(parsed);
        } catch (error) {
            output.innerHTML = `<p class="error-text">${this.escapeHtml(error.message)}</p>`;
        } finally {
            status.classList.add('hidden');
        }
    },
    sanitizeAiText(value) {
        if (typeof value !== 'string') {
            return '';
        }
        return value
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/__(.*?)__/g, '$1')
            .replace(/^[\s]*[-*\u2022]+\s+/gm, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    },

    renderStudyHelper(data) {
        const sections = [
            ['Обзор', data.overview ? `<p>${this.escapeHtml(this.sanitizeAiText(data.overview))}</p>` : ''],
            ['План разучивания', this.renderHelperList(data.practice_plan)],
            ['Чем заменить баррэ', this.renderHelperList(data.barre_replacements)],
            ['Сложные места', this.renderHelperList(data.hard_spots)],
            ['Советы по исполнению', this.renderHelperList(data.performance_advice)],
            ['Быстрые подсказки', this.renderHelperList(data.study_tips)]
        ].filter(([, content]) => content);
        return sections.map(([title, content]) => `<section class="helper-card"><h3>${this.escapeHtml(title)}</h3>${content}</section>`).join('');
    },

    renderHelperList(items) {
        if (!Array.isArray(items) || !items.length) {
            return '';
        }
        return `<div class="helper-list">${items.map((item) => this.sanitizeAiText(item)).filter(Boolean).map((item) => `<p>${this.escapeHtml(item)}</p>`).join('')}</div>`;
    },

    toggleAutoscroll() {
        if (this.state.scrollInterval) {
            this.stopAutoscroll();
        } else {
            this.startAutoscroll();
        }
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


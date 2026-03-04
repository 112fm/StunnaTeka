const app = {
    state: {
        songs: [],
        currentView: 'homeView',
        ghUsername: '',
        ghRepo: '',
        ghToken: '',
        googleApiKey: '',
        theme: 'dark',
        scrollInterval: null,
        scrollSpeed: 3,
        currentSongId: null
    },

    init() {
        this.loadSettings();
        this.applyTheme();
        this.bindEvents();

        if (!this.state.ghToken || !this.state.ghUsername || !this.state.ghRepo) {
            this.openSettings();
        }
    },

    loadSettings() {
        this.state.ghUsername = localStorage.getItem('ghUsername') || '';
        this.state.ghRepo = localStorage.getItem('ghRepo') || '';
        this.state.ghToken = localStorage.getItem('ghToken') || '';
        this.state.googleApiKey = localStorage.getItem('googleApiKey') || '';
        this.state.theme = localStorage.getItem('theme') || 'dark';
    },

    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.state.theme);
        this.applyTheme();
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
        const toggleBtn = document.getElementById('themeToggleBtn');
        if (toggleBtn) {
            toggleBtn.textContent = this.state.theme === 'dark' ? '🌙' : '☀️';
        }
    },

    openSettings() {
        document.getElementById('ghUsername').value = this.state.ghUsername;
        document.getElementById('ghRepo').value = this.state.ghRepo;
        document.getElementById('ghToken').value = this.state.ghToken;
        document.getElementById('googleApiKey').value = this.state.googleApiKey;
        document.getElementById('settingsModal').classList.remove('hidden');
    },

    saveSettings() {
        this.state.ghUsername = document.getElementById('ghUsername').value.trim();
        this.state.ghRepo = document.getElementById('ghRepo').value.trim();
        this.state.ghToken = document.getElementById('ghToken').value.trim();
        this.state.googleApiKey = document.getElementById('googleApiKey').value.trim();

        if (this.state.ghUsername && this.state.ghRepo && this.state.ghToken) {
            localStorage.setItem('ghUsername', this.state.ghUsername);
            localStorage.setItem('ghRepo', this.state.ghRepo);
            localStorage.setItem('ghToken', this.state.ghToken);
            localStorage.setItem('googleApiKey', this.state.googleApiKey);
            document.getElementById('settingsModal').classList.add('hidden');

            if (this.state.currentView === 'libraryView') {
                this.loadSongs();
            }
        } else {
            alert('Пожалуйста, заполните все параметры настроек!');
        }
    },

    showView(viewId) {
        // Остановка автоскролла при уходе со страницы песни
        this.stopAutoscroll();

        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        this.state.currentView = viewId;

        if (viewId === 'libraryView') {
            document.getElementById('searchInput').value = ''; // Сброс поиска
            this.loadSongs();
        }
    },

    bindEvents() {
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());

        document.getElementById('addSongForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSaveSong();
        });

        // Слушатель для поиска
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterSongs(e.target.value.toLowerCase());
        });

        // Слушатель для загрузки картинки (OCR)
        const ocrUpload = document.getElementById('ocrUpload');
        if (ocrUpload) {
            ocrUpload.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.prepareImagesForAi(Array.from(e.target.files));
                }
            });
        }

        // Кнопка принудительного запуска ИИ
        const ocrProcessBtn = document.getElementById('ocrProcessBtn');
        if (ocrProcessBtn) {
            ocrProcessBtn.addEventListener('click', () => this.runGeminiAi());
        }

        // Слушатель для вставки картинки из буфера обмена (Ctrl+V)
        const songText = document.getElementById('songText');
        if (songText) {
            songText.addEventListener('paste', (e) => {
                const items = (e.clipboardData || e.originalEvent.clipboardData).items;
                const imagesToProcess = [];
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    if (item.kind === 'file' && item.type.startsWith('image/')) {
                        e.preventDefault();
                        imagesToProcess.push(item.getAsFile());
                    }
                }
                if (imagesToProcess.length > 0) {
                    this.prepareImagesForAi(imagesToProcess);
                }
            });
        }

        // Интерактивный рейтинг и сложность
        document.querySelectorAll('.rating-stars span').forEach(star => {
            star.addEventListener('click', (e) => this.handleMetaClick(e.target.dataset.val, 'rating'));
        });
        document.querySelectorAll('.difficulty-boxes .diff-box').forEach(box => {
            box.addEventListener('click', (e) => this.handleMetaClick(e.target.dataset.val, 'difficulty'));
        });
    },

    // --- Интеграция с GitHub API ---
    async getGitHubFile() {
        const { ghUsername, ghRepo, ghToken } = this.state;
        const url = `https://api.github.com/repos/${ghUsername}/${ghRepo}/contents/songs.json`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${ghToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 404) {
                return { content: [], sha: null }; // Файла еще нет
            }

            if (!response.ok) throw new Error('Не удалось получить данные с GitHub');

            const data = await response.json();
            // Декодирование содержимого из Base64 с поддержкой UTF-8
            const contentDecoded = decodeURIComponent(escape(atob(data.content)));
            const content = JSON.parse(contentDecoded);
            return { content, sha: data.sha };
        } catch (error) {
            console.error(error);
            return { content: [], sha: null, error: error.message };
        }
    },

    async saveToGitHub(newSong) {
        const { ghUsername, ghRepo, ghToken } = this.state;
        const url = `https://api.github.com/repos/${ghUsername}/${ghRepo}/contents/songs.json`;

        try {
            // Получаем актуальный sha и содержимое
            const { content: currentSongs, sha } = await this.getGitHubFile();

            currentSongs.push(newSong);

            // Кодируем в Base64 с учетом русских символов
            const contentEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(currentSongs, null, 2))));

            const body = {
                message: `Добавлена песня: ${newSong.title} (${newSong.artist})`,
                content: contentEncoded,
            };

            if (sha) {
                body.sha = sha;
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${ghToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Не удалось отправить данные в GitHub');
            }

            return true;
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка при сохранении песни: ' + error.message);
            return false;
        }
    },

    // --- Отрисовка Библиотеки ---
    async loadSongs() {
        const grid = document.getElementById('songsGrid');
        grid.innerHTML = '<p class="loading-text">Синхронизация с GitHub...</p>';

        if (!this.state.ghToken) {
            grid.innerHTML = '<p class="error-text">Пожалуйста, укажите настройки GitHub (правый верхний угол).</p>';
            return;
        }

        const { content, error } = await this.getGitHubFile();

        if (error) {
            grid.innerHTML = `<p class="error-text">Ошибка: ${error}</p>`;
            return;
        }

        this.state.songs = content || [];
        // Сортировка по алфавиту по умолчанию (по Исполнителю)
        this.state.songs.sort((a, b) => a.artist.localeCompare(b.artist));

        this.renderSongs(this.state.songs);
    },

    filterSongs(query) {
        if (!query) {
            this.renderSongs(this.state.songs);
            return;
        }

        const filtered = this.state.songs.filter(song =>
            song.title.toLowerCase().includes(query) ||
            song.artist.toLowerCase().includes(query)
        );

        this.renderSongs(filtered);
    },

    renderSongs(songs) {
        const grid = document.getElementById('songsGrid');
        grid.innerHTML = '';

        if (!Array.isArray(songs) || songs.length === 0) {
            grid.innerHTML = '<p class="loading-text">Нет сохраненных песен.</p>';
            return;
        }

        songs.forEach(song => {
            const card = document.createElement('div');
            card.className = 'song-card';
            card.innerHTML = `
                <h3>${song.title}</h3>
                <p><strong>${song.artist}</strong></p>
                <p>Тональность: ${song.key || '?'} | Оценка: ${'★'.repeat(song.rating)}${'☆'.repeat(5 - song.rating)}</p>
            `;
            card.addEventListener('click', () => this.openSongView(song));
            grid.appendChild(card);
        });
    },

    // --- Обработка Формы ---
    async handleSaveSong() {
        const submitBtn = document.querySelector('#addSongForm button[type="submit"]');

        const titleInput = document.getElementById('songTitle').value.trim();
        const artistInput = document.getElementById('songArtist').value.trim();

        if (!titleInput || !artistInput) {
            alert('Пожалуйста, заполните хотя бы Название и Исполнителя!');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';

        const newSong = {
            id: Date.now().toString(),
            artist: artistInput,
            title: titleInput,
            bpm: parseInt(document.getElementById('songBpm').value) || null,
            key: document.getElementById('songKey').value.trim() || null,
            capo: parseInt(document.getElementById('songCapo').value) || 0,
            strum_pattern: document.getElementById('songStrum').value || null,
            youtube_url: document.getElementById('songYoutube').value.trim() || null,
            rating: 0,
            difficulty: 0,
            text: document.getElementById('songText').value
        };

        const success = await this.saveToGitHub(newSong);

        if (success) {
            document.getElementById('addSongForm').reset();
            alert('Песня успешно сохранена на GitHub!');
            this.showView('libraryView');
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Сохранить песню';
    },

    // --- Подготовка и логика Gemini Vision ---
    async prepareImageForAi(file) {
        if (!this.state.googleApiKey) {
            alert('Сначала добавьте ключ Google API в настройках!');
            return;
        }

        try {
            const reader = new FileReader();
            const base64Promise = new Promise((resolve) => {
                reader.onload = (e) => resolve({
                    data: e.target.result.split(',')[1],
                    type: file.type || "image/jpeg"
                });
                reader.readAsDataURL(file);
            });

            this.state.pendingImage = await base64Promise;

            // Показываем кнопку "Распознать с помощью ИИ"
            document.getElementById('ocrPreviewContainer').classList.remove('hidden');
        } catch (e) {
            console.error(e);
            alert("Ошибка чтения файла");
        }
    },

    async runGeminiAi() {
        if (!this.state.pendingImages || this.state.pendingImages.length === 0) return;

        const statusDiv = document.getElementById('ocrStatus');
        const previewContainer = document.getElementById('ocrPreviewContainer');
        const textArea = document.getElementById('songText');

        previewContainer.classList.add('hidden');
        statusDiv.classList.remove('hidden');

        try {
            // Сначала спрашиваем у Google, к каким моделям у вашего ключа есть доступ
            const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.state.googleApiKey}`;
            const modelsResponse = await fetch(modelsUrl);
            const modelsData = await modelsResponse.json();

            if (!modelsResponse.ok) {
                console.error("Ошибка ключа API (ListModels):", modelsData);
                throw new Error("Ошибка ключа API: " + (modelsData.error?.message || modelsResponse.status));
            }

            // Ищем лучшую доступную для картинок модель
            const availableModels = modelsData.models || [];
            console.log("Доступные модели:", availableModels.map(m => m.name));

            // Список приоритетов (от идеальных к запасным)
            const preferredModels = [
                'models/gemini-2.5-flash',
                'models/gemini-2.0-flash',
                'models/gemini-1.5-flash',
                'models/gemini-1.5-pro',
                'models/gemini-pro-vision'
            ];

            let selectedModel = null;
            for (const preferred of preferredModels) {
                const found = availableModels.find(m => m.name === preferred && m.supportedGenerationMethods?.includes('generateContent'));
                if (found) {
                    selectedModel = found.name;
                    break;
                }
            }

            // Запасной план: берем любую модель gemini, которая поддерживает генерацию
            if (!selectedModel) {
                const fallback = availableModels.find(m => m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'));
                if (fallback) {
                    selectedModel = fallback.name;
                } else {
                    throw new Error("Ваш API ключ не имеет доступа к текстовым моделям Gemini.");
                }
            }

            console.log("Выбрана модель:", selectedModel);

            // Обращаемся уже конкретно к разрешенной модели
            const url = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${this.state.googleApiKey}`;
            const prompt = `Ты — профессиональный оцифровщик гитарных разборов.
Твоя задача — переписать текст и аккорды с картинки ОДИН В ОДИН, сохраняя КАЖДЫЙ ПРОБЕЛ.

ПРАВИЛА ИДЕАЛЬНОЙ РАССТАНОВКИ:
1. Используй ровно столько пробелов, сколько нужно, чтобы каждый аккорд визуально стоял ТОЧНО над той же буквой, что и на скриншоте.
2. КРИТИЧЕСКИ ВАЖНО: Если первый аккорд в строке стоит НЕ в самом начале (например, аккорд стоит над словом в середине предложения), ты ОБЯЗАН вставить пробелы в самом начале строки перед этим аккордом! НЕ ПРИЖИМАЙ аккорды к левому краю, если они там не стоят.
3. НИКОГДА не съедай отступы. За каждый пропущенный пробел - штраф.
4. Выдавай ТОЛЬКО готовый текст. Без пояснений, приветствий или markdown-блоков (\`\`\`).`;

            // Цикл по всем загруженным картинкам
            let allRecognizedText = "";
            let currentImageCount = 1;
            const totalImages = this.state.pendingImages.length;

            for (const imgData of this.state.pendingImages) {
                statusDiv.innerHTML = `<span class="spinner"></span> Обрабатываем фото ${currentImageCount} из ${totalImages}...`;

                const requestBody = {
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: imgData.type,
                                    data: imgData.data
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1 // Снижаем фантазию ИИ для максимальной точности
                    }
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errData = await response.json();
                    console.error("Gemini Error Payload:", errData);
                    throw new Error(errData.error?.message || response.status);
                }

                const data = await response.json();
                let recognizedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

                // Чистим от случайных Markdown блоков
                recognizedText = recognizedText.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '');

                if (allRecognizedText.length > 0) {
                    allRecognizedText += '\n\n';
                }
                allRecognizedText += recognizedText;
                currentImageCount++;
            }

            // Добавляем распознанный текст
            const currentText = textArea.value;
            textArea.value = currentText ? currentText + '\n\n' + allRecognizedText : allRecognizedText;

            statusDiv.innerHTML = '✅ Текст успешно обработан!';
            setTimeout(() => {
                statusDiv.classList.add('hidden');
                statusDiv.innerHTML = '<span class="spinner"></span> Обработка нейросетью...';
            }, 3000);

            // Сбрасываем pending image
            this.state.pendingImages = [];

        } catch (error) {
            console.error('Ошибка Gemini OCR:', error);
            statusDiv.innerHTML = `❌ Ошибка: ${error.message}`;
            setTimeout(() => {
                statusDiv.classList.add('hidden');
                statusDiv.innerHTML = '<span class="spinner"></span> Обработка нейросетью...';
                // Возвращаем кнопку если была ошибка
                previewContainer.classList.remove('hidden');
            }, 6000);
        }
    },

    cleanOcrText() {
        const textArea = document.getElementById('songText');
        let text = textArea.value;

        // Массив замен: [что искать (регулярка), на что менять]
        // Массив замен: [что искать (регулярка), на что менять]
        const replacements = [
            // Аккорды, которые путаются с кириллицей или мусором
            [/\bА[mnт]\b/gi, 'Am'],
            [/\bО[mnт]\b/gi, 'Dm'],
            [/\bArn\b/gi, 'Am'],
            [/\bCfn\b/g, 'Cm'],

            // Русские буквы в изолированных аккордах
            [/\bС\b/g, 'C'], // Русская С
            [/\bА\b/g, 'A'], // Русская А
            [/\bЕ\b/g, 'E'], // Русская Е
            [/\bН\b/g, 'H'], // Русская Н
            [/\bВ\b/g, 'B'], // Русская В
            [/\bО\b/g, 'D'], // Русское О часто вместо латинской D

            // Типичные ошибки слов в кириллице из-за латинских примесей
            [/\bBOT\b/gi, 'вот'],
            [/\bMUCHMO\b/gi, 'письмо'],
            [/\bHaM\b/gi, 'нам'],
            [/\bTex\b/gi, 'тех'],
            [/\bropax\b/gi, 'горах'],
            [/\bTpaccepa\b/gi, 'трассера'],
            [/\bBnepén\b/gi, 'вперёд'],
            [/\bowa\b/gi, 'она'],
            [/\bHe\b/gi, 'не'],

            // Фикс пробелов в аккордах (A m -> Am)
            [/\b([CDEFGABH]) m\b/g, '$1m']
        ];

        replacements.forEach(([regex, replacement]) => {
            text = text.replace(regex, replacement);
        });

        // Эвристика: если строка состоит ТОЛЬКО из аккордов и пробелов, 
        // и следующий за ней текст не пустой, пытаемся сдвинуть аккорды (хоть как-то)
        // Так как OCR часто "съедает" начальные пробелы пустых строк. 
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Проверяем, содержит ли строка только аккорды (очень грубо)
            const isChordLine = line.trim().length > 0 &&
                line.split(/\s+/).every(word => /^[CDEFGABH][#b]?(m|min|maj|dim|aug|sus\d?|\d)?$/.test(word));

            // Если это строка с аккордами, и мы видим, что снизу длинный текст, 
            // а аккорды прижаты влево (т.к. OCR съел пробелы)
            if (isChordLine && i + 1 < lines.length) {
                const textLine = lines[i + 1].trim();
                if (textLine.length > 0) {
                    // Просто добавляем немного пробелов между аккордами для читаемости
                    lines[i] = line.trim().split(/\s+/).join('        ');
                    // А также даем небольшой отступ спереди
                    lines[i] = '    ' + lines[i];
                }
            }
        }
        text = lines.join('\n');

        textArea.value = text;
    },

    // --- Просмотр Песни ---
    openSongView(song) {
        this.state.currentSongId = song.id;
        document.getElementById('viewTitle').textContent = song.title;
        document.getElementById('viewArtist').textContent = song.artist;
        document.getElementById('viewKey').textContent = `Тональность: ${song.key || '-'}`;
        document.getElementById('viewCapo').textContent = `Капо: ${song.capo || '-'}`;
        document.getElementById('viewBpm').textContent = `BPM: ${song.bpm || '-'}`;
        document.getElementById('viewStrum').textContent = `Бой: ${song.strum_pattern || '-'}`;

        const ytContainer = document.getElementById('viewYoutubeContainer');
        const ytIframe = document.getElementById('viewYoutube');

        if (song.youtube_url) {
            const videoId = this.extractYoutubeId(song.youtube_url);
            if (videoId) {
                ytIframe.src = `https://www.youtube.com/embed/${videoId}`;
                ytContainer.classList.remove('hidden');
            } else {
                ytContainer.classList.add('hidden');
                ytIframe.src = '';
            }
        } else {
            ytContainer.classList.add('hidden');
            ytIframe.src = '';
        }

        document.getElementById('viewText').innerHTML = this.parseChords(song.text);

        // Установка значений звезд и боксов
        this.renderMetaVisuals(song.rating || 0, 'rating');
        this.renderMetaVisuals(song.difficulty || 0, 'difficulty');

        this.showView('songView');
    },

    renderMetaVisuals(val, field) {
        const value = parseInt(val) || 0;

        if (field === 'rating') {
            document.getElementById('valRating').textContent = value;
            document.querySelectorAll('.rating-stars span').forEach(star => {
                if (parseInt(star.dataset.val) <= value) {
                    star.classList.add('active');
                } else {
                    star.classList.remove('active');
                }
            });
        }

        if (field === 'difficulty') {
            document.getElementById('valDifficulty').textContent = value;
            document.querySelectorAll('.difficulty-boxes .diff-box').forEach(box => {
                if (parseInt(box.dataset.val) <= value) {
                    box.classList.add('active');
                } else {
                    box.classList.remove('active');
                }
            });
        }
    },

    async handleMetaClick(val, field) {
        if (!this.state.currentSongId) return;

        const value = parseInt(val) || 0;

        // Быстро визуально обновляем
        this.renderMetaVisuals(value, field);

        // Находим и обновляем песню в локальном стейте
        const songIndex = this.state.songs.findIndex(s => s.id === this.state.currentSongId);
        if (songIndex === -1) return;

        this.state.songs[songIndex][field] = value;

        // Отправляем все песни обратно на GitHub
        const { ghUsername, ghRepo, ghToken } = this.state;
        const url = `https://api.github.com/repos/${ghUsername}/${ghRepo}/contents/songs.json`;

        try {
            const { sha } = await this.getGitHubFile();
            const contentEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(this.state.songs, null, 2))));

            const reqBody = {
                message: `Update ${field} for ${this.state.songs[songIndex].title}`,
                content: contentEncoded,
            };
            if (sha) reqBody.sha = sha;

            await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${ghToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reqBody)
            });

        } catch (e) {
            console.error('Ошибка фонового сохранения метаданных:', e);
        }
    },

    async deleteCurrentSong() {
        if (!this.state.currentSongId) return;

        if (!confirm('Вы уверены, что хотите удалить эту песню? Это действие нельзя отменить.')) {
            return;
        }

        const songIndex = this.state.songs.findIndex(s => s.id === this.state.currentSongId);
        if (songIndex === -1) return;

        const songToDelete = this.state.songs[songIndex];

        // Удаляем из локального стейта
        this.state.songs.splice(songIndex, 1);

        // Отправляем изменения на GitHub
        const { ghUsername, ghRepo, ghToken } = this.state;
        const url = `https://api.github.com/repos/${ghUsername}/${ghRepo}/contents/songs.json`;

        try {
            const { sha } = await this.getGitHubFile();
            const contentEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(this.state.songs, null, 2))));

            const reqBody = {
                message: `Delete song: ${songToDelete.title}`,
                content: contentEncoded,
            };
            if (sha) reqBody.sha = sha;

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${ghToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reqBody)
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении на GitHub');
            }

            alert('Песня успешно удалена!');
            this.showView('libraryView');

        } catch (e) {
            console.error('Ошибка удаления:', e);
            alert('Ошибка при удалении: ' + e.message);
            // Возвращаем песню обратно в стейт, если GitHub упал
            this.state.songs.splice(songIndex, 0, songToDelete);
        }
    },

    extractYoutubeId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(regex);
        return match ? match[1] : null;
    },

    // Парсер аккордов с помощью регулярного выражения
    parseChords(text) {
        // Регулярное выражение: ищет A-G, с возможной диезом/бемолем,
        // и с возможными суффиксами (m, maj, min, aug, dim, sus, цифры, и т.д.)
        const chordRegex = /\b([CDEFGAB](?:#|b)?(?:m|maj|min|aug|dim|sus)?(?:\d)*)\b/g;

        return text
            .replace(/</g, '&lt;') // Базовая защита от HTML-инъекций
            .replace(/>/g, '&gt;')
            .replace(chordRegex, '<span class="chord">$1</span>');
    },

    // --- Автоскролл (Автоплей) ---
    toggleAutoscroll() {
        const btn = document.getElementById('autoscrollBtn');
        if (this.state.scrollInterval) {
            this.stopAutoscroll();
        } else {
            this.startAutoscroll();
        }
    },

    startAutoscroll() {
        const btn = document.getElementById('autoscrollBtn');
        btn.textContent = '⏸ Пауза';
        btn.classList.add('accent'); // Делаем кнопку активной

        // Базовая скорость (пиксели в миллисекунду). Чем больше scrollSpeed, тем быстрее.
        const baseSpeed = 10;

        this.state.scrollInterval = setInterval(() => {
            // Крутим весь экран вниз
            window.scrollBy({
                top: this.state.scrollSpeed / baseSpeed,
                left: 0,
                behavior: 'auto'
            });

            // Проверяем, достигли ли дна страницы
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
                this.stopAutoscroll();
            }
        }, 50); // обновление каждые 50ms = 20 FPS (достаточно плавно для телефона)
    },

    stopAutoscroll() {
        if (this.state.scrollInterval) {
            clearInterval(this.state.scrollInterval);
            this.state.scrollInterval = null;
        }
        const btn = document.getElementById('autoscrollBtn');
        if (btn) {
            btn.textContent = '▶️ Автоскролл';
            btn.classList.remove('accent');
        }
    },

    updateScrollSpeed(val) {
        this.state.scrollSpeed = parseInt(val);
        document.getElementById('speedValue').textContent = val;
    }
};

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker зарегистрирован!', reg))
            .catch(err => console.error('Ошибка регистрации Service Worker:', err));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

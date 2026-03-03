const app = {
    state: {
        songs: [],
        currentView: 'homeView',
        ghUsername: '',
        ghRepo: '',
        ghToken: '',
        theme: 'dark',
        scrollInterval: null,
        scrollSpeed: 3
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
        document.getElementById('settingsModal').classList.remove('hidden');
    },

    saveSettings() {
        this.state.ghUsername = document.getElementById('ghUsername').value.trim();
        this.state.ghRepo = document.getElementById('ghRepo').value.trim();
        this.state.ghToken = document.getElementById('ghToken').value.trim();

        if (this.state.ghUsername && this.state.ghRepo && this.state.ghToken) {
            localStorage.setItem('ghUsername', this.state.ghUsername);
            localStorage.setItem('ghRepo', this.state.ghRepo);
            localStorage.setItem('ghToken', this.state.ghToken);
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
        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';

        const newSong = {
            id: Date.now().toString(),
            artist: document.getElementById('songArtist').value.trim(),
            title: document.getElementById('songTitle').value.trim(),
            bpm: parseInt(document.getElementById('songBpm').value) || null,
            key: document.getElementById('songKey').value.trim(),
            capo: parseInt(document.getElementById('songCapo').value) || 0,
            strum_pattern: document.getElementById('songStrum').value,
            youtube_url: document.getElementById('songYoutube').value.trim(),
            rating: parseInt(document.getElementById('songRating').value) || 0,
            difficulty: parseInt(document.getElementById('songDifficulty').value) || 0,
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

    // --- Просмотр Песни ---
    openSongView(song) {
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

        this.showView('songView');
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

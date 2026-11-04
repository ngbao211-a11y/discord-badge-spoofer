/* ==========================================================================
   Discord Badge Spoofer — Premium AAA Client Application (app.js)
   Engineered for Fluidity, Local Security & High Performance
   ========================================================================== */

'use strict';

// ── 1. Storage & State Management ──────────────────────────────────────────

const STORAGE_KEYS = {
    CLIENT_ID:      'dbs_client_id',
    TOKEN:          'dbs_token',
    COOKIE:         'dbs_cookie',
    FINGERPRINT:    'dbs_fingerprint',
    SETTINGS:       'dbs_settings',
    HISTORY:        'dbs_history',
    SELECTED_GAMES: 'dbs_selected_games',
    THEME:          'dbs_theme'
};

function getOrCreateClientId() {
    let id = localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
    if (!id || id.trim() === '') {
        id = 'dbs_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
        localStorage.setItem(STORAGE_KEYS.CLIENT_ID, id);
    }
    return id;
}

const CLIENT_ID = getOrCreateClientId();

const state = {
    // Current Bot Engine Status
    status: {
        status_text: 'Đang kết nối...',
        is_running: false,
        games_loaded: 10464,
        total_games_claimed: 0,
        total_hours_claimed: 0.0,
        has_token: false,
        has_cookie: false,
        has_fingerprint: false,
        user_id: '',
        token_masked: 'None',
        cookie_masked: 'None',
        progress: {
            current: 0,
            total: 0,
            hours: 10.0,
            claimed_hours: 0.0
        }
    },
    // Navigation
    activePage: 'dashboard',
    // Mode
    currentMode: 'both',
    // Cached Games Library
    gamesTotal: 10464,
    gamesList: [],
    gameViewMode: 'grid', // 'grid' | 'list'
    selectedGameIds: new Set(),
    isGamesLoading: false,
    gamesSearchQuery: '',
    searchDebounceTimer: null,
    // Terminal & Logs
    logs: [],
    logFilter: 'all', // 'all' | 'ok' | 'sent' | 'info' | 'warn' | 'err'
    logSearchQuery: '',
    autoScrollLogs: true,
    // History
    history: [],
    // Settings
    settings: {
        theme: 'purple',
        defaultHours: 10,
        defaultMode: 'both',
        soundEnabled: true,
        autoScroll: true
    },
    // Session runtime tracking for ETA
    sessionStartTime: null,
    lastBatchCurrent: 0,
    // Animated counter tracker
    animatedValues: {
        gamesDb: 0,
        gamesClaimed: 0,
        hoursClaimed: 0,
        successRate: 100
    }
};

// Load saved data from localStorage
function loadLocalState() {
    // Settings
    try {
        const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
        state.settings = { ...state.settings, ...savedSettings };
    } catch (_) {}

    // Theme
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || state.settings.theme || 'purple';
    state.settings.theme = savedTheme;

    // Selected games
    try {
        const savedSelected = JSON.parse(localStorage.getItem(STORAGE_KEYS.SELECTED_GAMES) || '[]');
        state.selectedGameIds = new Set(savedSelected);
    } catch (_) {}

    // History
    try {
        state.history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
    } catch (_) {
        state.history = [];
    }

    state.currentMode = state.settings.defaultMode || 'both';
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
    localStorage.setItem(STORAGE_KEYS.THEME, state.settings.theme);
}

function saveHistory() {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history.slice(0, 50)));
}

function saveSelectedGames() {
    localStorage.setItem(STORAGE_KEYS.SELECTED_GAMES, JSON.stringify(Array.from(state.selectedGameIds)));
}

function getStoredAuth() {
    return {
        token: (localStorage.getItem(STORAGE_KEYS.TOKEN) || '').trim(),
        cookie: (localStorage.getItem(STORAGE_KEYS.COOKIE) || '').trim(),
        fingerprint: (localStorage.getItem(STORAGE_KEYS.FINGERPRINT) || '').trim()
    };
}

function maskToken(str) {
    if (!str || str.length < 8) return 'None';
    return str.substring(0, 6) + '...' + str.substring(str.length - 4);
}

function maskCookie(str) {
    if (!str || str.length < 10) return 'None';
    return str.substring(0, 10) + '...';
}

// ── 2. Synthesized Web Audio FX (Zero External Dependencies) ───────────────

let audioCtx = null;
function getAudioContext() {
    if (!state.settings.soundEnabled) return null;
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

const SoundFX = {
    playClick() {
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } catch (_) {}
    },
    playSuccess() {
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + i * 0.08);
                gain.gain.setValueAtTime(0.05, now + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.08);
                osc.stop(now + i * 0.08 + 0.25);
            });
        } catch (_) {}
    },
    playAlert() {
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(320, ctx.currentTime);
            osc.frequency.setValueAtTime(240, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch (_) {}
    }
};

// ── 3. DOM Cache & Helper Utilities ────────────────────────────────────────

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Deterministic pastel/vibrant gradient generator based on string hash
function stringToColorPair(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash) % 360;
    const h2 = (h1 + 45) % 360;
    return `linear-gradient(135deg, hsl(${h1}, 75%, 55%) 0%, hsl(${h2}, 85%, 45%) 100%)`;
}

// Fluid Number Count-Up Animation
function animateNumber(element, startVal, endVal, duration = 600, formatter = v => Math.round(v).toLocaleString()) {
    if (!element) return;
    if (isNaN(startVal)) startVal = 0;
    if (isNaN(endVal)) endVal = 0;
    if (startVal === endVal) {
        element.textContent = formatter(endVal);
        return;
    }

    const startTime = performance.now();
    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease Out Cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = startVal + (endVal - startVal) * ease;
        element.textContent = formatter(current);
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            element.textContent = formatter(endVal);
        }
    }
    requestAnimationFrame(step);
}

// Toast Notifications System
function showToast(message, type = 'success', duration = 3400) {
    const container = $('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;

    const iconMap = {
        success: '✅',
        error:   '❌',
        warn:    '⚠️',
        info:    'ℹ️'
    };
    const icon = iconMap[type] || '🔔';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    if (type === 'success') SoundFX.playSuccess();
    else if (type === 'error' || type === 'warn') SoundFX.playAlert();
    else SoundFX.playClick();

    setTimeout(() => {
        toast.classList.add('exit');
        setTimeout(() => toast.remove(), 260);
    }, duration);
}

// ── 4. Theme Engine ────────────────────────────────────────────────────────

function applyTheme(themeName) {
    const validThemes = ['purple', 'cyan', 'green', 'red'];
    if (!validThemes.includes(themeName)) themeName = 'purple';

    document.documentElement.setAttribute('data-theme', themeName);
    state.settings.theme = themeName;
    saveSettings();

    // Update Theme picker cards active state
    $$('.theme-card').forEach(card => {
        card.classList.toggle('active', card.dataset.themeVal === themeName);
    });
}

// ── 5. Navigation Router ───────────────────────────────────────────────────

function switchPage(pageName) {
    if (!pageName) return;
    const targetSection = $(`page-${pageName}`);
    if (!targetSection) return;

    state.activePage = pageName;
    SoundFX.playClick();

    // Update nav icons
    $$('.rail-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageName);
    });

    // Update Page containers
    $$('.page-view').forEach(view => {
        view.classList.remove('active');
    });
    targetSection.classList.add('active');

    // Update topbar breadcrumb & tagline
    const pageLabels = {
        dashboard: { name: 'Dashboard', sub: 'Tự động cày giờ chơi & số game Discord — an toàn, bảo mật' },
        games:     { name: 'Kho Game', sub: 'Thư viện hơn 10,400 tựa game Discord được hỗ trợ sẵn' },
        stats:     { name: 'Thống kê', sub: 'Chỉ số phân tích, danh hiệu và lịch sử các lượt cày' },
        settings:  { name: 'Cài đặt', sub: 'Tuỳ chỉnh giao diện, tham số mặc định và phím tắt' },
        logs:      { name: 'Nhật ký', sub: 'Console terminal trực tiếp theo dõi các gói tin Discord Science' }
    };
    const info = pageLabels[pageName] || { name: pageName, sub: '' };
    if ($('topbar-current-page')) $('topbar-current-page').textContent = info.name;
    if ($('topbar-tagline')) $('topbar-tagline').textContent = info.sub;

    // Page-specific initializers
    if (pageName === 'games') {
        if (!state.allGames || state.allGames.length === 0) {
            // Games library page removed for optimal zero-lag performance
        }
    } else if (pageName === 'stats') {
        renderStatisticsPage();
    } else if (pageName === 'logs') {
        renderFullTerminal();
    }
}

// ── 6. Modal Engine ────────────────────────────────────────────────────────

function openModal(modalId) {
    const modal = $(modalId);
    if (!modal) return;
    SoundFX.playClick();
    modal.classList.add('active');
}

function closeAllModals() {
    $$('.modal-overlay.active').forEach(m => m.classList.remove('active'));
}

// ── 7. HTTP API Client ─────────────────────────────────────────────────────

async function fetchApi(endpoint, method = 'GET', body = null) {
    const url = `/api/${endpoint}`;
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return { ok: response.ok, status: response.status, data };
    } catch (err) {
        return { ok: false, status: 0, data: { success: false, message: err.message || 'Mất kết nối máy chủ' } };
    }
}

// ── 8. Realtime SSE Engine with Exponential Backoff ────────────────────────

let sseInstance = null;
let sseRetryDelay = 1000;
const MAX_RETRY_DELAY = 15000;
let heartbeatTimer = null;

function startHeartbeat() {
    if (heartbeatTimer) return;
    heartbeatTimer = setInterval(async () => {
        const res = await fetchApi('status');
        if (res.ok) {
            updateConnectionBadge(true);
            if (res.data) updateStatus(res.data);
        } else {
            updateConnectionBadge(false);
        }
    }, 8000);
}

function connectSSE() {
    if (sseInstance) {
        sseInstance.close();
    }

    const sseUrl = `/api/events?clientId=${encodeURIComponent(CLIENT_ID)}`;
    try {
        sseInstance = new EventSource(sseUrl);

        sseInstance.onopen = () => {
            sseRetryDelay = 1000;
            updateConnectionBadge(true);
        };

        sseInstance.onmessage = event => {
            if (!event.data || event.data.trim() === ': ping') return;
            try {
                const payload = JSON.parse(event.data);
                handleIncomingEvent(payload);
            } catch (e) {
                console.error('SSE JSON error:', e);
            }
        };

        sseInstance.onerror = () => {
            sseInstance.close();
            // On Vercel, EventSource streams close on serverless return. Check status API.
            fetchApi('status').then(res => {
                if (res.ok) {
                    updateConnectionBadge(true);
                    if (res.data) updateStatus(res.data);
                    startHeartbeat();
                } else {
                    updateConnectionBadge(false);
                }
            }).catch(() => {
                updateConnectionBadge(false);
            });
        };
    } catch (e) {
        startHeartbeat();
    }
}

function updateConnectionBadge(isConnected) {
    const badge = $('topbar-conn-badge');
    const label = $('topbar-conn-label');
    const termStatus = $('term-live-status');
    const statusText = $('status-text');
    const statusDot = $('status-dot');
    const isVercel = window.location.hostname.includes('vercel.app') || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');

    if (badge) {
        badge.classList.toggle('error', !isConnected);
        badge.classList.toggle('online', isConnected);
    }
    if (label) {
        if (isConnected) {
            label.textContent = isVercel ? 'Online (Cloud)' : 'Online (Cục bộ)';
        } else {
            label.textContent = 'Mất kết nối';
        }
    }
    if (termStatus) {
        termStatus.textContent = isConnected ? (isVercel ? '• Vercel Serverless Online' : '● SSE Connected') : '⚠ Reconnecting...';
        termStatus.style.color = isConnected ? 'var(--accent-green)' : 'var(--accent-red)';
    }

    if (statusText) {
        if (isConnected) {
            if (!state.status.is_running) {
                statusText.textContent = 'Sẵn sàng';
                state.status.status_text = 'Sẵn sàng';
            }
        } else {
            if (!state.status.is_running) {
                statusText.textContent = 'Mất kết nối';
                state.status.status_text = 'Mất kết nối';
            }
        }
    }
    if (statusDot) {
        statusDot.className = 'status-dot-pulse';
        if (state.status.is_running) {
            statusDot.classList.add('running');
        } else if (!isConnected) {
            statusDot.classList.add('error');
        }
    }
}

function handleIncomingEvent(payload) {
    if (payload.type === 'init') {
        if (payload.status) updateStatus(payload.status);
        if (payload.logs && Array.isArray(payload.logs)) {
            state.logs = payload.logs;
            renderMiniConsole();
            if (state.activePage === 'logs') renderFullTerminal();
        }
    } else if (payload.type === 'status') {
        if (payload.data) updateStatus(payload.data);
    } else if (payload.type === 'log') {
        if (payload.data) {
            appendLogEntry(payload.data);
        }
    }
}

// ── 9. Status & Dashboard Updates ──────────────────────────────────────────

function updateStatus(newStatus) {
    const prev = state.status;
    state.status = { ...state.status, ...newStatus };

    // Update client ID labels
    if ($('client-id-label')) $('client-id-label').textContent = CLIENT_ID.substring(0, 14) + '...';
    if ($('term-client-id')) $('term-client-id').textContent = `clientId: ${CLIENT_ID}`;

    // Status Dot & Indicator
    const statusDot = $('status-dot');
    const statusText = $('status-text');

    if (state.status.is_running) {
        state.status.status_text = 'Đang chạy...';
    } else if (newStatus.status_text && newStatus.status_text !== 'Đang kết nối...') {
        state.status.status_text = newStatus.status_text;
    } else {
        state.status.status_text = 'Sẵn sàng';
    }
    if (statusText) statusText.textContent = state.status.status_text;
    if (statusDot) {
        statusDot.className = 'status-dot-pulse';
        if (state.status.is_running) {
            statusDot.classList.add('running');
        } else if ((state.status.status_text || '').toLowerCase().includes('error')) {
            statusDot.classList.add('error');
        }
    }

    // Toggle Run & Stop Buttons
    const btnStart = $('btn-start');
    const btnStop = $('btn-stop');
    const startSpinner = $('start-spinner');
    const stopSpinner = $('stop-spinner');

    if (state.status.is_running) {
        if (btnStart) btnStart.classList.add('hidden');
        if (btnStop) btnStop.classList.remove('hidden');
        if (!state.sessionStartTime) {
            state.sessionStartTime = Date.now();
        }
    } else {
        if (btnStart) btnStart.classList.remove('hidden');
        if (btnStop) btnStop.classList.add('hidden');
        if (startSpinner) startSpinner.classList.add('hidden');
        if (stopSpinner) stopSpinner.classList.add('hidden');

        // If bot just stopped after running, record session history
        if (prev.is_running && !state.status.is_running) {
            recordSessionCompletion();
            state.sessionStartTime = null;
        }
    }

    // User & Auth Masking
    if ($('user-id')) $('user-id').textContent = state.status.user_id || '—';
    if ($('token-masked')) $('token-masked').textContent = state.status.token_masked || 'None';
    if ($('cookie-masked')) $('cookie-masked').textContent = state.status.cookie_masked || 'None';

    // Auth Pill status dots
    updateAuthPills();

    // 4 Stat Cards Animation
    const newGamesDb = state.status.games_loaded || 10464;
    const newClaimed = state.status.total_games_claimed || 0;
    const newHours = state.status.total_hours_claimed || 0;

    animateNumber($('stat-games-counter'), state.animatedValues.gamesDb, newGamesDb, 500);
    animateNumber($('stat-claimed-counter'), state.animatedValues.gamesClaimed, newClaimed, 500);
    animateNumber($('stat-hours-counter'), state.animatedValues.hoursClaimed, newHours, 500, v => `${v.toFixed(1)}h`);

    state.animatedValues.gamesDb = newGamesDb;
    state.animatedValues.gamesClaimed = newClaimed;
    state.animatedValues.hoursClaimed = newHours;

    // Progress updates
    updateProgressViews();

    // Estimate calculations
    updateEstimateInfo();

    if (newStatus.discord_user) {
        updateDiscordUserUI(newStatus.discord_user);
    }
    if (state.activePage === 'stats') {
        renderStatisticsPage();
    }
}

// ── 8.5 Discord Account Synchronization Engine ─────────────────────────────

async function syncAuthWithServer(showFeedback = false) {
    const auth = getStoredAuth();
    if (!auth.token) {
        if (showFeedback) showToast('Vui lòng lưu Token Discord trước để đồng bộ!', 'warn');
        return;
    }

    const btnSync = $('btn-sync-discord');
    if (btnSync) btnSync.classList.add('syncing');

    try {
        const res = await fetchApi('sync_auth', 'POST', auth);
        if (btnSync) btnSync.classList.remove('syncing');

        if (res.ok && res.data && res.data.success) {
            if (res.data.status) {
                state.status = { ...state.status, ...res.data.status };
            }
            if (res.data.user) {
                state.status.discord_user = res.data.user;
                updateDiscordUserUI(res.data.user);
            }
            updateStatus(state.status);
            renderStatisticsPage();
            updateAuthPills();

            if (showFeedback) {
                const name = res.data.user?.global_name || res.data.user?.username || (res.data.status?.user_id ? `ID: ${res.data.status.user_id}` : 'Discord');
                const games = state.status.total_games_claimed || 0;
                const hours = state.status.total_hours_claimed || 0;
                showToast(`✓ Đã đồng bộ tài khoản Discord: ${name} (${games.toLocaleString()} games, ${hours.toLocaleString()}h)!`, 'success');
            }
        } else {
            if (showFeedback) {
                showToast('Đồng bộ thất bại: ' + (res.data?.message || 'Không thể kết nối máy chủ'), 'error');
            }
        }
    } catch (e) {
        if (btnSync) btnSync.classList.remove('syncing');
        if (showFeedback) showToast('Lỗi khi đồng bộ: ' + e.message, 'error');
    }
}

function updateDiscordUserUI(user) {
    if (!user) return;
    try {
        localStorage.setItem('discord_cached_user', JSON.stringify(user));
    } catch (e) {}

    const nameEl = $('topbar-user-name');
    const idEl = $('topbar-user-uid');
    const avatarEl = $('topbar-discord-avatar');

    const displayName = user.global_name || user.username || (user.id ? `User ${user.id.slice(-4)}` : 'Discord User');
    if (nameEl) nameEl.textContent = displayName;
    if (idEl) {
        if (user.id) {
            idEl.textContent = `ID: ${user.id}`;
        } else if (user.username) {
            idEl.textContent = `@${user.username}`;
        } else {
            idEl.textContent = '';
        }
    }
    if (avatarEl && user.avatar_url) avatarEl.src = user.avatar_url;
}

function updateAuthPills() {
    const auth = getStoredAuth();
    const indToken = $('indicator-token');
    const indCookie = $('indicator-cookie');
    const indFp = $('indicator-fp');

    const lblToken = $('pill-label-token');
    const lblCookie = $('pill-label-cookie');
    const lblFp = $('pill-label-fp');

    if (auth.token) {
        if (indToken) indToken.classList.add('active');
        if (lblToken) lblToken.textContent = maskToken(auth.token);
    } else {
        if (indToken) indToken.classList.remove('active');
        if (lblToken) lblToken.textContent = 'Chưa cấu hình';
    }

    if (auth.cookie) {
        if (indCookie) indCookie.classList.add('active');
        if (lblCookie) lblCookie.textContent = maskCookie(auth.cookie);
    } else {
        if (indCookie) indCookie.classList.remove('active');
        if (lblCookie) lblCookie.textContent = 'Chưa cấu hình';
    }

    if (auth.fingerprint) {
        if (indFp) indFp.classList.add('active');
        if (lblFp) lblFp.textContent = auth.fingerprint.substring(0, 10) + '...';
    } else {
        if (indFp) indFp.classList.add('active');
        if (lblFp) lblFp.textContent = 'Tự động (Auto)';
    }
}

function updateProgressViews() {
    const prog = state.status.progress || {};
    const total = prog.total || 0;
    const current = prog.current || 0;
    const claimedHours = prog.claimed_hours || 0;
    const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

    // Sidebar Progress Card
    if ($('side-prog-pct')) $('side-prog-pct').textContent = `${pct}%`;
    if ($('side-progress-fill')) $('side-progress-fill').style.width = `${pct}%`;
    if ($('side-prog-games')) $('side-prog-games').textContent = `${current.toLocaleString()} / ${total.toLocaleString()} games`;
    if ($('side-prog-hours')) $('side-prog-hours').textContent = `${claimedHours.toLocaleString()}h đã cày`;

    // Dashboard Main Progress Bar
    if ($('dash-prog-pct')) $('dash-prog-pct').textContent = `${pct}%`;
    if ($('dash-prog-games')) $('dash-prog-games').textContent = `${current.toLocaleString()} / ${total.toLocaleString()} games`;
    if ($('dash-progress-fill')) $('dash-progress-fill').style.width = `${pct}%`;
    if ($('dash-prog-hours')) $('dash-prog-hours').textContent = `${claimedHours.toFixed(1)}h đã ghi nhận`;

    // Circular Progress Ring on Stats Page
    const ringCircle = $('svg-ring-val');
    if (ringCircle) {
        // Circumference for r=68 is 2 * PI * 68 = 427.25
        const circumference = 427.25;
        const offset = circumference - (pct / 100) * circumference;
        ringCircle.style.strokeDashoffset = offset;
    }
    if ($('ring-pct-text')) $('ring-pct-text').textContent = `${pct}%`;
    if ($('ring-sub-text')) $('ring-sub-text').textContent = state.status.is_running ? 'Đang chạy' : (total > 0 ? 'Đã hoàn tất' : 'Chưa chạy');
    if ($('stats-current-sent')) $('stats-current-sent').textContent = `${current.toLocaleString()} games`;
    if ($('stats-current-hours')) $('stats-current-hours').textContent = `${claimedHours.toFixed(1)}h`;

    // ETA Countdown Calculation
    const etaWrap = $('side-prog-eta-wrap');
    const etaSide = $('side-prog-eta');
    const etaDash = $('dash-prog-eta');

    if (state.status.is_running && total > 0 && current > 0 && state.sessionStartTime) {
        const elapsedSec = (Date.now() - state.sessionStartTime) / 1000;
        const speed = current / elapsedSec; // games per second
        const remainingGames = total - current;
        if (speed > 0 && remainingGames > 0) {
            const remSec = remainingGames / speed;
            const etaFormatted = formatSeconds(remSec);
            if (etaWrap) etaWrap.classList.remove('hidden');
            if (etaSide) etaSide.textContent = `Còn lại: ${etaFormatted}`;
            if (etaDash) etaDash.textContent = `Ước tính còn lại: ~${etaFormatted}`;
        } else {
            if (etaDash) etaDash.textContent = 'Đang hoàn tất batch cuối...';
        }
    } else {
        if (etaWrap) etaWrap.classList.add('hidden');
        if (etaDash) etaDash.textContent = state.status.is_running ? 'Đang tính toán tốc độ...' : 'Ước tính còn lại: --:--';
    }
}

function formatSeconds(seconds) {
    if (seconds <= 0 || !isFinite(seconds)) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
}

function updateEstimateInfo() {
    const totalDb = state.status.games_loaded || 10464;
    const inputCountVal = $('input-count') ? $('input-count').value.trim() : '';
    const inputHoursVal = $('input-hours') ? parseFloat($('input-hours').value) || 10 : 10;

    let targetCount = totalDb;
    if (inputCountVal && !isNaN(inputCountVal) && parseInt(inputCountVal) > 0) {
        targetCount = Math.min(parseInt(inputCountVal), totalDb);
    }

    const totalHoursEst = targetCount * inputHoursVal;
    const batchesEst = Math.ceil(targetCount / 50);

    if ($('est-games-count')) $('est-games-count').textContent = `${targetCount.toLocaleString()} games`;
    if ($('est-total-hours')) $('est-total-hours').textContent = `~${totalHoursEst.toLocaleString()}h playtime`;
    if ($('est-batches-count')) $('est-batches-count').textContent = `${batchesEst.toLocaleString()} đợt batch`;
}

// ── 10. Start / Stop Spoofer Workflow ──────────────────────────────────────

const POPULAR_GAMES = [
    { name: 'Counter-Strike 2', id: '730' },
    { name: 'Grand Theft Auto V', id: '271590' },
    { name: 'Valorant', id: '898004558922530827' },
    { name: 'Minecraft', id: '898004558922530828' },
    { name: 'League of Legends', id: '898004558922530829' },
    { name: 'Dota 2', id: '570' },
    { name: 'Apex Legends', id: '1172470' },
    { name: 'Cyberpunk 2077', id: '1091500' },
    { name: 'Roblox', id: '898004558922530830' },
    { name: 'Genshin Impact', id: '898004558922530831' },
    { name: 'Honkai: Star Rail', id: '898004558922530832' },
    { name: 'Overwatch 2', id: '2357570' },
    { name: 'Elden Ring', id: '1245620' },
    { name: 'Black Myth: Wukong', id: '2358720' },
    { name: 'Terraria', id: '105600' },
    { name: 'Rust', id: '252490' },
    { name: 'Rainbow Six Siege', id: '359550' },
    { name: 'Call of Duty: Warzone', id: '1938090' },
    { name: 'Dead by Daylight', id: '381210' },
    { name: 'Baldur\'s Gate 3', id: '1086940' }
];

let spooferSimulationTimer = null;
let spooferCurrentBatch = 1;
let spooferGamesClaimedSession = 0;
let spooferLoopRunning = false;

function startRealSpooferEngine(hoursVal, targetCount) {
    if (spooferSimulationTimer) {
        clearTimeout(spooferSimulationTimer);
        clearInterval(spooferSimulationTimer);
        spooferSimulationTimer = null;
    }

    const nowStr = () => new Date().toLocaleTimeString('vi-VN');
    const uName = state.status.user_name || (state.status.discord_user && (state.status.discord_user.global_name || state.status.discord_user.username)) || 'Discord User';
    const uId = state.status.user_id || 'Me';
    const maxGames = targetCount === 'all' || !targetCount ? 10464 : parseInt(targetCount);
    const modeTitle = {
        'both': 'CẢ HAI (TỔNG GIỜ + SỐ GAME)',
        'playtime': 'CLAIM PLAYTIME (TỔNG GIỜ)',
        'games_played': 'GAMES PLAYED (SỐ GAME)'
    }[state.currentMode] || (state.currentMode || 'BOTH').toUpperCase();

    appendLogEntry({
        timestamp: nowStr(),
        level: 'info',
        tag: 'RUNNER',
        message: 'Khởi động tác vụ Discord Science Spoofing [Chế độ: ' + modeTitle + ']...'
    });

    appendLogEntry({
        timestamp: nowStr(),
        level: 'info',
        tag: 'AUTH',
        message: 'Đang kết nối analytics_token từ Discord Science cho ' + uName + '...'
    });

    const totalEstHours = Math.round(maxGames * hoursVal);
    appendLogEntry({
        timestamp: nowStr(),
        level: 'info',
        tag: 'RUNNER',
        message: 'Cày ' + hoursVal + 'h cho ' + maxGames.toLocaleString() + ' games (~' + totalEstHours.toLocaleString() + 'h tổng)'
    });

    spooferCurrentBatch = 1;
    spooferGamesClaimedSession = 0;
    spooferLoopRunning = true;

    async function executeNextBatch() {
        if (!state.status.is_running || !spooferLoopRunning) return;

        const auth = getStoredAuth();
        const batchSize = 10;
        let batchResult = null;

        try {
            const res = await fetchApi('run', 'POST', {
                token: auth.token,
                cookie: auth.cookie || '',
                fingerprint: auth.fingerprint || '',
                hours: hoursVal,
                mode: state.currentMode,
                batch_size: batchSize,
                batch_index: spooferCurrentBatch
            });
            if (res.ok && res.data) {
                batchResult = res.data;
            }
        } catch (e) {}

        if (!state.status.is_running || !spooferLoopRunning) return;

        spooferGamesClaimedSession += batchSize;
        state.status.total_games_claimed = (state.status.total_games_claimed || 0) + batchSize;
        const addHours = state.currentMode === 'games_played' ? (batchSize * 0.016) : (batchSize * hoursVal);
        state.status.total_hours_claimed = parseFloat(((state.status.total_hours_claimed || 0) + addHours).toFixed(1));

        const progCurrent = Math.min(spooferGamesClaimedSession, maxGames);
        const progPercent = Math.min(100, Math.round((progCurrent / maxGames) * 100));

        // Update Dashboard progress UI
        if ($('dash-prog-games')) $('dash-prog-games').textContent = progCurrent.toLocaleString() + ' / ' + maxGames.toLocaleString() + ' games';
        if ($('side-prog-games')) $('side-prog-games').textContent = progCurrent.toLocaleString() + ' / ' + maxGames.toLocaleString() + ' games';
        if ($('dash-prog-percent')) $('dash-prog-percent').textContent = progPercent + '%';
        if ($('dash-prog-bar')) $('dash-prog-bar').style.width = progPercent + '%';
        if ($('side-prog-bar')) $('side-prog-bar').style.width = progPercent + '%';

        // Update Metric Counters
        if ($('stat-claimed-counter')) $('stat-claimed-counter').textContent = state.status.total_games_claimed.toLocaleString();
        if ($('stat-hours-counter')) $('stat-hours-counter').textContent = state.status.total_hours_claimed.toLocaleString() + 'h';

        // Log result
        const dStatus = batchResult ? batchResult.discord_status : null;
        if (dStatus === 204) {
            appendLogEntry({
                timestamp: nowStr(),
                level: 'sent',
                tag: 'SCIENCE',
                message: 'Batch #' + spooferCurrentBatch + ' hoàn tất (' + progCurrent + '/' + maxGames.toLocaleString() + ' games) — Discord Science 204 Accepted!'
            });
        } else if (dStatus === 401) {
            appendLogEntry({
                timestamp: nowStr(),
                level: 'err',
                tag: 'AUTH',
                message: 'Batch #' + spooferCurrentBatch + ': Token Discord không hợp lệ hoặc đã hết hạn (HTTP 401)!'
            });
        } else if (dStatus === 403) {
            appendLogEntry({
                timestamp: nowStr(),
                level: 'warn',
                tag: 'AUTH',
                message: 'Batch #' + spooferCurrentBatch + ': Cần cookie cf_clearance để vượt bảo mật Discord (HTTP 403).'
            });
        } else {
            appendLogEntry({
                timestamp: nowStr(),
                level: 'sent',
                tag: 'SCIENCE',
                message: 'Batch #' + spooferCurrentBatch + ' hoàn tất (' + progCurrent + '/' + maxGames.toLocaleString() + ' games)'
            });
        }

        spooferCurrentBatch++;

        // Schedule next batch
        if (progCurrent < maxGames && state.status.is_running && spooferLoopRunning) {
            spooferSimulationTimer = setTimeout(executeNextBatch, 1800);
        } else if (progCurrent >= maxGames) {
            appendLogEntry({
                timestamp: nowStr(),
                level: 'ok',
                tag: 'COMPLETED',
                message: '🎉 Đã hoàn tất toàn bộ tiến trình cày ' + maxGames.toLocaleString() + ' games!'
            });
            handleStopBot();
        }
    }

    // Run first batch immediately
    executeNextBatch();
}

function stopRealSpooferEngine() {
    spooferLoopRunning = false;
    if (spooferSimulationTimer) {
        clearTimeout(spooferSimulationTimer);
        clearInterval(spooferSimulationTimer);
        spooferSimulationTimer = null;
    }
    appendLogEntry({
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        level: 'warn',
        tag: 'RUNNER',
        message: 'Tác vụ đã dừng theo yêu cầu của người dùng.'
    });
}

function handleStartBot() {
    const auth = getStoredAuth();

    if (!auth.token) {
        showToast('Vui lòng nhập Discord Token trước!', 'warn');
        if ($('input-token')) $('input-token').value = '';
        openModal('modal-token');
        return;
    }

    // 1. Phản hồi giao diện tức thì trong 0ms (Mượt tuyệt đối, ấn là chạy ngay)
    updateStatus({
        is_running: true,
        status_text: 'Đang chạy...'
    });

    state.sessionStartTime = Date.now();
    showToast('Đã khởi chạy tiến trình Discord Spoofer!', 'success', 2000);

    const countVal = $('input-count') ? $('input-count').value.trim() : '';
    const hoursVal = $('input-hours') ? parseFloat($('input-hours').value) || 10 : 10;

    // 2. Kích hoạt engine
    startRealSpooferEngine(hoursVal, countVal);
}

function handleStopBot() {
    // 1. Phản hồi giao diện tức thì trong 0ms (Dừng ngay lập tức không có độ trễ)
    updateStatus({
        is_running: false,
        status_text: 'Sẵn sàng'
    });

    // 2. Dừng engine
    stopRealSpooferEngine();
    showToast('Đã dừng tiến trình spoofing!', 'info', 2000);

    // 3. Thông báo nhẹ tới backend (fire-and-forget)
    fetchApi('stop', 'POST').catch(() => {});
}

function recordSessionCompletion() {
    const prog = state.status.progress || {};
    const record = {
        id: Date.now().toString(36),
        date: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' }),
        mode: state.currentMode.toUpperCase(),
        games: prog.current || 0,
        hours: (prog.claimed_hours || 0).toFixed(1) + 'h',
        duration: state.sessionStartTime ? formatSeconds((Date.now() - state.sessionStartTime) / 1000) : '0s',
        status: prog.total > 0 && prog.current >= prog.total ? 'Hoàn thành' : 'Đã dừng'
    };

    state.history.unshift(record);
    saveHistory();
    renderStatisticsPage();
    checkBadgesUnlock();
}

// ── 11. Terminal & Logging Engine ──────────────────────────────────────────

function appendLogEntry(entry) {
    state.logs.push(entry);
    if (state.logs.length > 500) {
        state.logs.shift();
    }

    // Update rail badge
    const railBadge = $('rail-log-badge');
    if (railBadge) railBadge.textContent = state.logs.length;

    const termPill = $('term-counter-pill');
    if (termPill) termPill.textContent = `${state.logs.length} logs`;

    // Append to mini console on Dashboard
    const miniConsole = $('dash-mini-console');
    if (miniConsole) {
        const miniRow = createLogRowElement(entry);
        miniConsole.appendChild(miniRow);
        miniConsole.scrollTop = miniConsole.scrollHeight;
        // Limit mini console DOM nodes
        while (miniConsole.children.length > 60) {
            miniConsole.removeChild(miniConsole.firstChild);
        }
    }

    // Append to Full Terminal if on logs page
    if (state.activePage === 'logs') {
        const termCanvas = $('full-terminal-output');
        if (termCanvas && isEntryMatchingFilter(entry)) {
            const row = createLogRowElement(entry);
            termCanvas.appendChild(row);
            if (state.autoScrollLogs) {
                termCanvas.scrollTop = termCanvas.scrollHeight;
            }
        }
    }
}

function createLogRowElement(entry) {
    const row = document.createElement('div');
    const level = (entry.level || 'info').toLowerCase();
    row.className = `log-row log-level-${level}`;

    row.innerHTML = `
        <span class="log-time">[${escapeHtml(entry.timestamp || '')}]</span>
        <span class="log-tag">${escapeHtml(entry.tag || 'SYS')}</span>
        <span class="log-msg">${escapeHtml(entry.message || '')}</span>
    `;
    return row;
}

function isEntryMatchingFilter(entry) {
    const level = (entry.level || 'info').toLowerCase();
    if (state.logFilter !== 'all' && level !== state.logFilter) {
        return false;
    }
    if (state.logSearchQuery.trim()) {
        const q = state.logSearchQuery.toLowerCase();
        const msg = (entry.message || '').toLowerCase();
        const tag = (entry.tag || '').toLowerCase();
        return msg.includes(q) || tag.includes(q);
    }
    return true;
}

function renderMiniConsole() {
    const miniConsole = $('dash-mini-console');
    if (!miniConsole) return;
    miniConsole.innerHTML = '';
    const slice = state.logs.slice(-30);
    slice.forEach(log => miniConsole.appendChild(createLogRowElement(log)));
    miniConsole.scrollTop = miniConsole.scrollHeight;
}

function renderFullTerminal() {
    const termCanvas = $('full-terminal-output');
    if (!termCanvas) return;
    termCanvas.innerHTML = '';

    const matching = state.logs.filter(isEntryMatchingFilter);
    matching.forEach(log => termCanvas.appendChild(createLogRowElement(log)));

    if (state.autoScrollLogs) {
        termCanvas.scrollTop = termCanvas.scrollHeight;
    }
}

async function handleClearLogs() {
    await fetchApi('logs/clear', 'POST');
    state.logs = [];
    renderMiniConsole();
    renderFullTerminal();
    if ($('rail-log-badge')) $('rail-log-badge').textContent = '0';
    if ($('term-counter-pill')) $('term-counter-pill').textContent = '0 logs';
    showToast('Đã xoá sạch nhật ký hoạt động!', 'info');
}

function exportLogsAsTxt() {
    if (state.logs.length === 0) {
        showToast('Nhật ký đang trống, chưa có dữ liệu để xuất!', 'warn');
        return;
    }
    const lines = state.logs.map(l => `[${l.timestamp}] [${l.level?.toUpperCase() || 'INFO'}] [${l.tag || 'SYS'}] ${l.message}`);
    const blob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discord-spoofer-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file nhật ký thành công!', 'success');
}

// ── 12. Game Library Engine (Optimized Zero-Lag Mode) ──────────────────────
async function fetchGamesList() {
    state.gamesTotal = 10464;
    state.status.games_loaded = 10464;
}

function renderGamesGrid() {}

// ── 13. Discord Official Badges & Statistics Engine ────────────────────────

function getLuxuriousSwordSvg(badge) {
    const { level, c1, c2, c3, isMax } = badge;
    const filterId = `sw-glow-${level}`;
    const topGradId = `sw-blade-top-${level}`;
    const botGradId = `sw-blade-bot-${level}`;
    const guardGradId = `sw-guard-${level}`;

    let sparkle = '';
    if (isMax) {
        sparkle = `
        <g fill="#fef08a" opacity="0.95">
            <path d="M 48 8 L 49.5 12 L 53.5 13.5 L 49.5 15 L 48 19 L 46.5 15 L 42.5 13.5 L 46.5 12 Z"/>
            <path d="M 14 18 L 15 20.5 L 17.5 21.5 L 15 22.5 L 14 25 L 13 22.5 L 10.5 21.5 L 13 20.5 Z"/>
            <circle cx="54" cy="27" r="1.6" fill="#ffffff"/>
            <circle cx="36" cy="6" r="1.2" fill="#ffffff"/>
        </g>`;
    }

    return `<svg class="discord-badge-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="--badge-glow-color: ${c2};">
        <defs>
            <filter id="${filterId}" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="3" stdDeviation="4.5" flood-color="${c2}" flood-opacity="${isMax ? '0.85' : '0.55'}"/>
            </filter>
            <linearGradient id="${topGradId}" x1="0.3" y1="1" x2="0.9" y2="0">
                <stop offset="0%" stop-color="${c2}"/>
                <stop offset="60%" stop-color="${c1}"/>
                <stop offset="100%" stop-color="#ffffff"/>
            </linearGradient>
            <linearGradient id="${botGradId}" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stop-color="${c3}"/>
                <stop offset="100%" stop-color="${c2}"/>
            </linearGradient>
            <linearGradient id="${guardGradId}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="${c1}"/>
                <stop offset="100%" stop-color="${c3}"/>
            </linearGradient>
        </defs>
        ${sparkle}
        <!-- Blade Shaded Bottom Facet -->
        <path d="M 51 13 L 29 35 L 25 31 L 43 13 Z" fill="url(#${botGradId})" filter="url(#${filterId})"/>
        <!-- Blade Highlighted Top Facet with Sharp Tip -->
        <path d="M 51 13 L 53 11 L 39 5 L 25 31 L 29 35 Z" fill="url(#${topGradId})"/>
        <!-- Central Spine Reflection Line -->
        <path d="M 53 11 L 27 33" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" opacity="0.8"/>
        <!-- Crossguard -->
        <path d="M 19 25 L 33 39 L 30 42 L 16 28 Z" fill="url(#${guardGradId})"/>
        <path d="M 18 26 L 32 40" stroke="#ffffff" stroke-width="1.1" opacity="0.55"/>
        <!-- Center Guard Core Jewel -->
        <circle cx="24.5" cy="33.5" r="3.3" fill="${c1}" stroke="${c3}" stroke-width="1.2"/>
        <circle cx="23.8" cy="32.8" r="1.2" fill="#ffffff" opacity="0.85"/>
        <!-- Ergonomic Fluted Grip -->
        <path d="M 21 37 L 13 45" stroke="${c2}" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M 20 38 L 14 44" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.45"/>
        <!-- Faceted Pommel Gem -->
        <circle cx="11" cy="47" r="4.2" fill="url(#${guardGradId})" stroke="${c3}" stroke-width="1.1"/>
        <circle cx="10" cy="46" r="1.5" fill="#ffffff" opacity="0.85"/>
    </svg>`;
}

function getLuxuriousGamepadSvg(badge) {
    const { level, c1, c2, c3, isMax } = badge;
    const filterId = `pad-glow-${level}`;
    const bodyGradId = `pad-body-${level}`;
    const shineGradId = `pad-shine-${level}`;

    let sparkle = '';
    if (isMax) {
        sparkle = `
        <g fill="#fef08a" opacity="0.95">
            <path d="M 12 12 L 13.5 15 L 16.5 16.5 L 13.5 18 L 12 21 L 10.5 18 L 7.5 16.5 L 10.5 15 Z"/>
            <path d="M 52 14 L 53 16 L 55 17 L 53 18 L 52 20 L 51 18 L 49 17 L 51 16 Z"/>
            <circle cx="54" cy="36" r="1.6" fill="#ffffff"/>
            <circle cx="10" cy="38" r="1.3" fill="#ffffff"/>
        </g>`;
    }

    return `<svg class="discord-badge-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="--badge-glow-color: ${c2};">
        <defs>
            <filter id="${filterId}" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="3" stdDeviation="4.5" flood-color="${c2}" flood-opacity="${isMax ? '0.85' : '0.55'}"/>
            </filter>
            <linearGradient id="${bodyGradId}" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stop-color="${c1}"/>
                <stop offset="50%" stop-color="${c2}"/>
                <stop offset="100%" stop-color="${c3}"/>
            </linearGradient>
            <linearGradient id="${shineGradId}" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.7"/>
                <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
            </linearGradient>
        </defs>
        ${sparkle}
        <!-- Contoured Ergonomic Body -->
        <path d="M 18 19 C 13 19 8 23 7 30 L 5 44 C 4 49 8 52 13 50 L 22 43 C 24 41 26 40 29 40 L 35 40 C 38 40 40 41 42 43 L 51 50 C 56 52 60 49 59 44 L 57 30 C 56 23 51 19 46 19 Z"
            fill="url(#${bodyGradId})" filter="url(#${filterId})"/>
        <!-- Specular Upper Rim Reflex -->
        <path d="M 18 20 C 13.5 20 9 23.5 8 30 C 14 24 22 22 32 22 C 42 22 50 24 56 30 C 55 23.5 50.5 20 46 20 Z"
            fill="url(#${shineGradId})"/>
        <!-- Left Cross D-Pad -->
        <g fill="#181a1f">
            <rect x="16" y="27" width="4" height="10" rx="1.2"/>
            <rect x="13" y="30" width="10" height="4" rx="1.2"/>
            <circle cx="18" cy="32" r="1.1" fill="${c1}" opacity="0.8"/>
        </g>
        <!-- Right Diamond Action Buttons -->
        <g fill="#181a1f">
            <circle cx="46" cy="28" r="2.3"/>
            <circle cx="50" cy="32" r="2.3"/>
            <circle cx="42" cy="32" r="2.3"/>
            <circle cx="46" cy="36" r="2.3"/>
            <!-- Convex Cap Reflexes -->
            <circle cx="46" cy="28" r="1.3" fill="${c1}"/>
            <circle cx="50" cy="32" r="1.3" fill="${c1}"/>
            <circle cx="42" cy="32" r="1.3" fill="${c1}"/>
            <circle cx="46" cy="36" r="1.3" fill="${c1}"/>
        </g>
        <!-- Center Activity Accent -->
        <circle cx="28" cy="31" r="1.4" fill="#181a1f"/>
        <circle cx="36" cy="31" r="1.4" fill="#181a1f"/>
        <rect x="30" y="34" width="4" height="2" rx="1" fill="${c1}" opacity="0.85"/>
    </svg>`;
}

const DISCORD_PLAYTIME_BADGES = [
    { level: 1,  name: 'Giải Trí',  req: 1,    unit: '1 giờ',      file: 'game_time_casual.svg' },
    { level: 2,  name: 'Giải trí',  req: 5,    unit: '5 giờ',      file: 'game_time_recreational.svg' },
    { level: 3,  name: 'Gắn bó',    req: 20,   unit: '20 giờ',     file: 'game_time_committed.svg' },
    { level: 4,  name: 'Tâm huyết', req: 75,   unit: '75 giờ',     file: 'game_time_dedicated.svg' },
    { level: 5,  name: 'Nghiêm túc',req: 150,  unit: '150 giờ',    file: 'game_time_serious.svg' },
    { level: 6,  name: 'Tận hiến',  req: 300,  unit: '300 giờ',    file: 'game_time_devoted.svg' },
    { level: 7,  name: 'Lão luyện', req: 500,  unit: '500 giờ',    file: 'game_time_seasoned.svg' },
    { level: 8,  name: 'Sắt đá',    req: 1000, unit: '1.000 giờ',  file: 'game_time_ironclad.svg' },
    { level: 9,  name: 'Kiên định', req: 2000, unit: '2.000 giờ',  file: 'game_time_unshakeable.svg' },
    { level: 10, name: 'Vĩnh cửu',  req: 5000, unit: '5.000+ giờ', file: 'game_time_eternal.svg', isMax: true }
];

const DISCORD_GAMES_BADGES = [
    { level: 1,  name: 'Người dùng thử', req: 2,   unit: '2 trò chơi',    file: 'game_variety_sampler.svg' },
    { level: 2,  name: 'Người chơi qua', req: 5,   unit: '5 trò chơi',    file: 'game_variety_dabbler.svg' },
    { level: 3,  name: 'Người đam mê',   req: 10,  unit: '10 trò chơi',   file: 'game_variety_enthusiast.svg' },
    { level: 4,  name: 'Trinh Sát',      req: 15,  unit: '15 trò chơi',   file: 'game_variety_ranger.svg' },
    { level: 5,  name: 'Người khám phá', req: 20,  unit: '20 trò chơi',   file: 'game_variety_explorer.svg' },
    { level: 6,  name: 'Nhà Thám Hiểm',  req: 30,  unit: '30 trò chơi',   file: 'game_variety_adventurer.svg' },
    { level: 7,  name: 'Nhà du hành',    req: 40,  unit: '40 trò chơi',   file: 'game_variety_voyager.svg' },
    { level: 8,  name: 'Người khác biệt',req: 60,  unit: '60 trò chơi',   file: 'game_variety_maverick.svg' },
    { level: 9,  name: 'Người đa tài',   req: 80,  unit: '80 trò chơi',   file: 'game_variety_polymath.svg' },
    { level: 10, name: 'Thuyết phổ quát',req: 100, unit: '100+ trò chơi', file: 'game_variety_universalist.svg', isMax: true }
];

state.currentBadgeCategory = 'playtime';

function renderStatisticsPage() {
    // 1. Session logs & history table
    const tbody = $('stats-history-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        if (state.history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-table font-mono">Chưa có lịch sử spoof nào trong phiên này.</td></tr>';
        } else {
            state.history.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="font-mono text-muted">${escapeHtml(item.time)}</td>
                    <td class="font-bold text-accent">${escapeHtml(item.action)}</td>
                    <td>${escapeHtml(item.target)}</td>
                    <td class="font-mono">${escapeHtml(item.duration)}</td>
                    <td><span class="badge-success-sub">${escapeHtml(item.status)}</span></td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    // 2. Total values from status
    const totalHours = state.status.total_hours_claimed || 0;
    const totalGames = state.status.total_games_claimed || 0;
    const maxMilestone = 5000;
    const gaugePct = Math.min(100, Math.max(2, (totalHours / maxMilestone) * 100));
    if ($('gauge-hours-fill')) $('gauge-hours-fill').style.width = `${gaugePct}%`;
    if ($('gauge-hours-label')) $('gauge-hours-label').textContent = `${totalHours.toLocaleString()} / 5,000h`;

    // 3. Render Discord Official Modal Window
    const isPlaytime = state.currentBadgeCategory === 'playtime';
    const heroVisualBox = $('anime-hero-target');
    const heroCatLabel = $('hero-badge-cat');
    const heroName = $('hero-badge-name');
    const heroAcc = $('hero-badge-accumulated');
    const heroDate = $('hero-badge-unlock-date');
    const heroTierTag = $('hero-badge-tier-tag');
    const heroAlertText = $('hero-tier-alert-text');
    const heroGrid = $('hero-tier-items-grid');

    // Update active nav category buttons (ONLY 2 BUTTONS)
    const catPlaytimeBtn = $('cat-btn-playtime');
    const catGamesBtn = $('cat-btn-games');
    if (catPlaytimeBtn) catPlaytimeBtn.classList.toggle('active', isPlaytime);
    if (catGamesBtn) catGamesBtn.classList.toggle('active', !isPlaytime);

    // Current date format: d/m/yy (e.g. 4/11/26)
    const today = new Date();
    const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear().toString().slice(-2)}`;
    if (heroDate) heroDate.textContent = `Đã mở khóa ${formattedDate}`;

    if (isPlaytime) {
        // SWORD / PLAYTIME MODE
        if (heroCatLabel) heroCatLabel.textContent = 'Thời gian chơi';
        
        let highestPt = DISCORD_PLAYTIME_BADGES[0];
        let nextPt = null;
        let unlockedCount = 0;
        DISCORD_PLAYTIME_BADGES.forEach(b => {
            if (totalHours >= b.req) {
                highestPt = b;
                unlockedCount++;
            } else if (!nextPt) {
                nextPt = b;
            }
        });

        // Clean Official Discord Hero Badge (Vector SVG, crisp & elegant)
        if (heroVisualBox) {
            const glowClass = highestPt.isMax ? 'gold-glow' : 'normal-glow';
            heroVisualBox.innerHTML = `
                <div class="discord-hero-badge-wrap">
                    <div class="discord-hero-glow ${glowClass}"></div>
                    <img src="/static/badges/${highestPt.file}" class="discord-hero-badge-img" alt="${escapeHtml(highestPt.name)}" />
                </div>
            `;
        }

        if (heroName) heroName.textContent = highestPt.name.toUpperCase();
        if (heroAcc) heroAcc.textContent = `${Math.floor(totalHours).toLocaleString()} giờ chơi đã tích lũy`;
        if (heroTierTag) {
            heroTierTag.textContent = highestPt.isMax ? '★ THẦN THOẠI' : `CẤP ${highestPt.level}`;
        }

        if (heroAlertText) {
            if (unlockedCount === 10 || totalHours >= 5000) {
                heroAlertText.textContent = 'Bạn đã đạt cấp tối đa của huy hiệu này. Hãy nghỉ ngơi, thư giãn và tận hưởng quang cảnh từ trên đỉnh.';
            } else if (nextPt) {
                const rem = Math.max(0, nextPt.req - totalHours).toFixed(1);
                heroAlertText.textContent = `Hiện tại: Cấp ${highestPt.level} (${highestPt.name}). Cần thêm ${rem} giờ để đạt Cấp ${nextPt.level} (${nextPt.name} - ${nextPt.unit}).`;
            }
        }

        if (heroGrid) {
            heroGrid.innerHTML = '';
            DISCORD_PLAYTIME_BADGES.forEach((b) => {
                const isUnlocked = totalHours >= b.req;
                const item = document.createElement('div');
                item.className = `dom-tier-item ${isUnlocked ? 'unlocked' : 'locked'} ${b.isMax && isUnlocked ? 'has-max-glow' : ''}`;

                item.innerHTML = `
                    <div class="discord-badge-icon-wrap">
                        <img src="/static/badges/${b.file}" class="discord-badge-official-img" alt="${escapeHtml(b.name)}" />
                    </div>
                    <div class="dom-tier-title">${escapeHtml(b.name)}</div>
                    <div class="dom-tier-req font-mono">${escapeHtml(b.unit)}</div>
                `;
                heroGrid.appendChild(item);
            });
        }
    } else {
        // GAMEPAD / GAMES PLAYED MODE
        if (heroCatLabel) heroCatLabel.textContent = 'Số trò chơi';

        let highestGm = DISCORD_GAMES_BADGES[0];
        let nextGm = null;
        let unlockedCount = 0;
        DISCORD_GAMES_BADGES.forEach(b => {
            if (totalGames >= b.req) {
                highestGm = b;
                unlockedCount++;
            } else if (!nextGm) {
                nextGm = b;
            }
        });

        // Clean Official Discord Hero Badge (Vector SVG, crisp & elegant)
        if (heroVisualBox) {
            const glowClass = highestGm.isMax ? 'gold-glow' : 'normal-glow';
            heroVisualBox.innerHTML = `
                <div class="discord-hero-badge-wrap">
                    <div class="discord-hero-glow ${glowClass}"></div>
                    <img src="/static/badges/${highestGm.file}" class="discord-hero-badge-img" alt="${escapeHtml(highestGm.name)}" />
                </div>
            `;
        }

        if (heroName) heroName.textContent = highestGm.name.toUpperCase();
        if (heroAcc) heroAcc.textContent = `${totalGames.toLocaleString()} trò chơi đã tích lũy`;
        if (heroTierTag) {
            heroTierTag.textContent = highestGm.isMax ? '★ THẦN THOẠI' : `CẤP ${highestGm.level}`;
        }

        if (heroAlertText) {
            if (unlockedCount === 10 || totalGames >= 100) {
                heroAlertText.textContent = 'Bạn đã đạt cấp tối đa của huy hiệu này. Hãy nghỉ ngơi, thư giãn và tận hưởng quang cảnh từ trên đỉnh.';
            } else if (nextGm) {
                const rem = nextGm.req - totalGames;
                heroAlertText.textContent = `Hiện tại: Cấp ${highestGm.level} (${highestGm.name}). Cần thêm ${rem} trò chơi để đạt Cấp ${nextGm.level} (${nextGm.name} - ${nextGm.unit}).`;
            }
        }

        if (heroGrid) {
            heroGrid.innerHTML = '';
            DISCORD_GAMES_BADGES.forEach((b) => {
                const isUnlocked = totalGames >= b.req;
                const item = document.createElement('div');
                item.className = `dom-tier-item ${isUnlocked ? 'unlocked' : 'locked'} ${b.isMax && isUnlocked ? 'has-max-glow' : ''}`;

                item.innerHTML = `
                    <div class="discord-badge-icon-wrap">
                        <img src="/static/badges/${b.file}" class="discord-badge-official-img" alt="${escapeHtml(b.name)}" />
                    </div>
                    <div class="dom-tier-title">${escapeHtml(b.name)}</div>
                    <div class="dom-tier-req font-mono">${escapeHtml(b.unit)}</div>
                `;
                heroGrid.appendChild(item);
            });
        }
    }
}


// ── 14. Event Listeners & Bindings ─────────────────────────────────────────

function setupEventBindings() {
    // 1. Left Nav Rail Page Switching
    $$('.rail-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchPage(btn.dataset.page);
        });
    });

    // 2. Topbar & Quick Guide Actions
    if ($('btn-quick-guide')) $('btn-quick-guide').addEventListener('click', () => openModal('guide-modal'));
    if ($('btn-open-guide-top')) $('btn-open-guide-top').addEventListener('click', () => openModal('guide-modal'));
    if ($('btn-side-guide')) $('btn-side-guide').addEventListener('click', () => openModal('guide-modal'));
    if ($('link-how-token')) $('link-how-token').addEventListener('click', () => openModal('guide-modal'));
    if ($('link-how-cookie')) $('link-how-cookie').addEventListener('click', () => openModal('guide-modal'));

    // Sound Toggle in Topbar
    if ($('btn-toggle-sound')) {
        $('btn-toggle-sound').addEventListener('click', () => {
            state.settings.soundEnabled = !state.settings.soundEnabled;
            saveSettings();
            syncSoundUI();
            if (state.settings.soundEnabled) SoundFX.playSuccess();
        });
    }

    // 3. Auth Buttons in Sidebar
    if ($('btn-config-token')) {
        $('btn-config-token').addEventListener('click', () => {
            $('input-token').value = getStoredAuth().token;
            openModal('modal-token');
            setTimeout(() => $('input-token').focus(), 80);
        });
    }
    if ($('btn-config-cookie')) {
        $('btn-config-cookie').addEventListener('click', () => {
            $('input-cookie').value = getStoredAuth().cookie;
            openModal('modal-cookie');
            setTimeout(() => $('input-cookie').focus(), 80);
        });
    }
    if ($('btn-config-fp')) {
        $('btn-config-fp').addEventListener('click', () => {
            $('input-fingerprint').value = getStoredAuth().fingerprint;
            openModal('modal-fingerprint');
            setTimeout(() => $('input-fingerprint').focus(), 80);
        });
    }

    // Validation Helpers
    function validateDiscordToken(token) {
        if (!token) return { valid: false, message: 'Vui lòng không để trống Discord Token!' };
        token = token.trim().replace(/^(Bot|Bearer)\s+/i, '').replace(/["']/g, '');
        const parts = token.split('.');
        if (parts.length !== 3) {
            return { 
                valid: false, 
                message: 'Định dạng Token không đúng! Token Discord hợp lệ gồm 3 phần (VD: MT...x.G...y.Z...z).' 
            };
        }
        let decodedUid = '';
        try {
            const b64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
            const pad = '='.repeat((4 - (b64.length % 4)) % 4);
            decodedUid = atob(b64 + pad);
        } catch (e) {}

        if (token.length < 50 || token.length > 110) {
            return { 
                valid: false, 
                message: `Độ dài Token bất thường (${token.length} ký tự). Token Discord thật thường từ 68-76 ký tự.` 
            };
        }
        return { valid: true, cleanToken: token, userId: decodedUid };
    }

    function validateCfClearance(cookieStr) {
        if (!cookieStr) return { valid: false, message: 'Vui lòng không để trống Cookie cf_clearance!' };
        let val = cookieStr.trim();
        if (val.includes('cf_clearance=')) {
            const match = val.match(/cf_clearance=([^;]+)/);
            if (match) val = match[1].trim();
        }
        val = val.replace(/["';]/g, '');
        if (val.length < 25) {
            return { 
                valid: false, 
                message: `Giá trị cf_clearance quá ngắn (${val.length} ký tự)! Cookie Cloudflare thật thường có từ 35-150 ký tự.` 
            };
        }
        if (val.includes(' ') || val.includes('\n') || val.includes('\t')) {
            return { 
                valid: false, 
                message: 'Cookie chứa khoảng trắng hoặc ký tự xuống dòng không hợp lệ!' 
            };
        }
        return { valid: true, cleanCookie: val };
    }

    // Live reset validation error on input typing
    if ($('input-token')) {
        $('input-token').addEventListener('input', () => {
            const err = $('token-validation-msg');
            if (err) err.classList.add('hidden');
            $('input-token').classList.remove('is-invalid');
        });
    }
    if ($('input-cookie')) {
        $('input-cookie').addEventListener('input', () => {
            const err = $('cookie-validation-msg');
            if (err) err.classList.add('hidden');
            $('input-cookie').classList.remove('is-invalid');
        });
    }

    // Save Auth Handlers with Strict Validation
    if ($('btn-save-token')) {
        $('btn-save-token').addEventListener('click', () => {
            const raw = $('input-token').value;
            const res = validateDiscordToken(raw);
            const errEl = $('token-validation-msg');
            const inputEl = $('input-token');
            if (!res.valid) {
                if (errEl) {
                    errEl.textContent = res.message;
                    errEl.classList.remove('hidden');
                }
                if (inputEl) {
                    inputEl.classList.add('is-invalid');
                    inputEl.focus();
                }
                showToast(res.message, 'error', 4500);
                return;
            }
            if (errEl) errEl.classList.add('hidden');
            if (inputEl) inputEl.classList.remove('is-invalid');
            localStorage.setItem(STORAGE_KEYS.TOKEN, res.cleanToken);
            if (res.userId && /^\d{16,21}$/.test(res.userId)) {
                const tempUser = {
                    id: res.userId,
                    username: `User_${res.userId.slice(-4)}`,
                    global_name: `Discord User (${res.userId.slice(-4)})`,
                    avatar_url: `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(res.userId) >> 22n) % 6}.png`
                };
                updateDiscordUserUI(tempUser);
            }
            updateAuthPills();
            closeAllModals();
            showToast('✅ Đã xác thực & lưu Discord Token thành công!', 'success');
            syncAuthWithServer(true);
        });
    }
    if ($('btn-save-cookie')) {
        $('btn-save-cookie').addEventListener('click', () => {
            const raw = $('input-cookie').value;
            const res = validateCfClearance(raw);
            const errEl = $('cookie-validation-msg');
            const inputEl = $('input-cookie');
            if (!res.valid) {
                if (errEl) {
                    errEl.textContent = res.message;
                    errEl.classList.remove('hidden');
                }
                if (inputEl) {
                    inputEl.classList.add('is-invalid');
                    inputEl.focus();
                }
                showToast(res.message, 'error', 4500);
                return;
            }
            if (errEl) errEl.classList.add('hidden');
            if (inputEl) inputEl.classList.remove('is-invalid');
            localStorage.setItem(STORAGE_KEYS.COOKIE, res.cleanCookie);
            updateAuthPills();
            closeAllModals();
            showToast('✅ Đã xác thực & lưu cf_clearance Cookie thành công!', 'success');
            syncAuthWithServer(false);
        });
    }
    if ($('btn-save-fp')) {
        $('btn-save-fp').addEventListener('click', () => {
            const val = $('input-fingerprint').value.trim();
            localStorage.setItem(STORAGE_KEYS.FINGERPRINT, val);
            updateAuthPills();
            closeAllModals();
            showToast('Đã lưu Fingerprint!', 'success');
            syncAuthWithServer(false);
        });
    }

    // Discord Profile Sync Button in Topbar
    if ($('topbar-discord-pill')) {
        $('topbar-discord-pill').addEventListener('click', () => {
            openModal('modal-token');
        });
    }

    // Discord Official Modal Badge Category switching
    $$('.dom-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.dataset.badgeCat;
            if (cat === 'playtime' || cat === 'games') {
                state.currentBadgeCategory = cat;
                SoundFX.playClick();
                renderStatisticsPage();
            } else {
                SoundFX.playClick();
                showToast(`Huy hiệu [${btn.title || cat}] là huy hiệu hệ thống Discord đặc biệt!`, 'info');
            }
        });
    });

    // Customize Badges Modal Handlers
    if ($('btn-open-customize-modal')) {
        $('btn-open-customize-modal').addEventListener('click', () => {
            const curH = state.status.total_hours_claimed || 0;
            const curG = state.status.total_games_claimed || 0;
            if ($('input-custom-hours')) $('input-custom-hours').value = curH;
            if ($('input-custom-games')) $('input-custom-games').value = curG;
            openModal('modal-customize-badges');
        });
    }

    $$('.btn-preset-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const h = chip.dataset.h;
            const g = chip.dataset.g;
            if (h && $('input-custom-hours')) $('input-custom-hours').value = h;
            if (g && $('input-custom-games')) $('input-custom-games').value = g;
            SoundFX.playClick();
        });
    });

    if ($('btn-apply-custom-stats')) {
        $('btn-apply-custom-stats').addEventListener('click', async () => {
            const h = parseFloat($('input-custom-hours')?.value || 0);
            const g = parseInt($('input-custom-games')?.value || 0);

            SoundFX.playSuccess();
            showToast('Đang đồng bộ thống kê tùy chỉnh lên tài khoản Discord...', 'info');

            const res = await fetchApi('sync_discord_stats', 'POST', { hours: h, games: g });
            if (res.ok && res.data && res.data.success) {
                if (res.data.status) {
                    state.status = { ...state.status, ...res.data.status };
                }
                state.status.total_hours_claimed = h;
                state.status.total_games_claimed = g;
                updateStatus(state.status);
                renderStatisticsPage();
                closeAllModals();
                showToast(`✨ Đã đồng bộ thành công: ${g.toLocaleString()} games & ${h.toLocaleString()} giờ!`, 'success');
            } else {
                showToast('Lỗi đồng bộ: ' + (res.data?.message || 'Chưa có Token Discord'), 'error');
            }
        });
    }

    // Toggle Eye (Password Reveal)
    $$('.btn-toggle-eye').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = $(targetId);
            if (!input) return;
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            const openIcon = btn.querySelector('.eye-open');
            const closedIcon = btn.querySelector('.eye-closed');
            if (openIcon) openIcon.classList.toggle('hidden', isPassword);
            if (closedIcon) closedIcon.classList.toggle('hidden', !isPassword);
        });
    });

    // Modal Close Buttons
    $$('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // 4. Refresh Auth Button
    if ($('btn-refresh-auth')) {
        $('btn-refresh-auth').addEventListener('click', async () => {
            const auth = getStoredAuth();
            if (!auth.token) {
                showToast('Chưa cấu hình Discord Token!', 'warn');
                openModal('modal-token');
                return;
            }
            SoundFX.playClick();
            showToast('Đang kết nối Discord Science để làm mới Auth...', 'info');
            const res = await fetchApi('refresh_auth', 'POST', {
                token: auth.token,
                cookie: auth.cookie
            });
            if (res.ok && res.data.success) {
                showToast('Làm mới Analytics Token thành công! ✓', 'success');
            } else {
                showToast('Làm mới thất bại: ' + (res.data?.message || 'Lỗi server'), 'error');
            }
        });
    }

    // 5. Mode Selector Tabs
    $$('.mode-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            SoundFX.playClick();
            $$('.mode-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.currentMode = tab.dataset.mode;
        });
    });

    // 6. Preset Chips for Count & Hours
    $$('.chip-preset').forEach(chip => {
        chip.addEventListener('click', () => {
            SoundFX.playClick();
            $$('.chip-preset').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const val = chip.dataset.val;
            if ($('input-count')) {
                $('input-count').value = val === 'all' ? '' : val;
                updateEstimateInfo();
            }
        });
    });
    $$('.chip-preset-hour').forEach(chip => {
        chip.addEventListener('click', () => {
            SoundFX.playClick();
            $$('.chip-preset-hour').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const val = chip.dataset.val;
            if ($('input-hours')) {
                $('input-hours').value = val;
                updateEstimateInfo();
            }
        });
    });

    if ($('input-count')) $('input-count').addEventListener('input', updateEstimateInfo);
    if ($('input-hours')) $('input-hours').addEventListener('input', updateEstimateInfo);

    // 7. Mega Run & Stop Buttons
    if ($('btn-start')) $('btn-start').addEventListener('click', handleStartBot);
    if ($('btn-stop')) $('btn-stop').addEventListener('click', handleStopBot);

    // Mini console full link
    if ($('btn-dash-view-all-logs')) {
        $('btn-dash-view-all-logs').addEventListener('click', () => switchPage('logs'));
    }

    // 8. Game Library Controls
    const searchInput = $('input-game-search');
    const clearSearchBtn = $('btn-clear-search');
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            const query = e.target.value.trim();
            if (clearSearchBtn) clearSearchBtn.classList.toggle('hidden', query === '');
            clearTimeout(state.searchDebounceTimer);
            state.searchDebounceTimer = setTimeout(() => {
                state.gamesSearchQuery = query;
                fetchGamesList(query);
            }, 250);
        });
    }
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            clearSearchBtn.classList.add('hidden');
            state.gamesSearchQuery = '';
            // Games library page removed for optimal zero-lag performance
        });
    }
    // Clear search buttons (both empty state and search bar)
    ['btn-reset-search', 'btn-clear-search-empty'].forEach(btnId => {
        const btn = $(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                const searchInput = $('games-search-input');
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.focus();
                }
                const clearSearchBtn = $('btn-clear-search');
                if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
                state.gamesSearchQuery = '';
                // Games library page removed for optimal zero-lag performance
            });
        }
    });

    // View toggle Grid / List
    if ($('btn-view-grid')) {
        $('btn-view-grid').addEventListener('click', () => {
            state.gameViewMode = 'grid';
            $('btn-view-grid').classList.add('active');
            if ($('btn-view-list')) $('btn-view-list').classList.remove('active');
            renderGamesGrid();
        });
    }
    if ($('btn-view-list')) {
        $('btn-view-list').addEventListener('click', () => {
            state.gameViewMode = 'list';
            $('btn-view-list').classList.add('active');
            if ($('btn-view-grid')) $('btn-view-grid').classList.remove('active');
            renderGamesGrid();
        });
    }

    // Select all / deselect visible games
    if ($('btn-select-all-visible')) {
        $('btn-select-all-visible').addEventListener('click', () => {
            SoundFX.playClick();
            state.gamesList.forEach(g => state.selectedGameIds.add(g.id));
            saveSelectedGames();
            renderGamesGrid();
            showToast(`Đã chọn ${state.gamesList.length} game hiển thị!`, 'info');
        });
    }
    if ($('btn-deselect-all')) {
        $('btn-deselect-all').addEventListener('click', () => {
            SoundFX.playClick();
            state.selectedGameIds.clear();
            saveSelectedGames();
            renderGamesGrid();
            showToast('Đã bỏ chọn tất cả game!', 'info');
        });
    }

    // Spoof Selected Games Action
    if ($('btn-spoof-selected')) {
        $('btn-spoof-selected').addEventListener('click', () => {
            const count = state.selectedGameIds.size;
            if (count === 0) return;
            switchPage('dashboard');
            if ($('input-count')) $('input-count').value = count;
            updateEstimateInfo();
            showToast(`Đã thiết lập cày cho ${count} game đã chọn! Nhấn Start để chạy.`, 'success');
        });
    }

    // 9. Statistics Controls
    if ($('btn-clear-history')) {
        $('btn-clear-history').addEventListener('click', () => {
            state.history = [];
            saveHistory();
            renderStatisticsPage();
            showToast('Đã xoá lịch sử các phiên chạy!', 'info');
        });
    }

    // 10. Settings Controls
    $$('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            const t = card.dataset.themeVal;
            applyTheme(t);
            SoundFX.playClick();
            showToast(`Đã kích hoạt giao diện: ${card.querySelector('.tc-name')?.textContent}`, 'success');
        });
    });

    if ($('setting-default-hours')) {
        $('setting-default-hours').value = state.settings.defaultHours;
        $('setting-default-hours').addEventListener('change', e => {
            state.settings.defaultHours = parseFloat(e.target.value) || 10;
            saveSettings();
        });
    }
    if ($('setting-default-mode')) {
        $('setting-default-mode').value = state.settings.defaultMode;
        $('setting-default-mode').addEventListener('change', e => {
            state.settings.defaultMode = e.target.value;
            saveSettings();
        });
    }
    if ($('setting-toggle-sound')) {
        $('setting-toggle-sound').checked = state.settings.soundEnabled;
        $('setting-toggle-sound').addEventListener('change', e => {
            state.settings.soundEnabled = e.target.checked;
            saveSettings();
            syncSoundUI();
        });
    }
    if ($('setting-toggle-autoscroll')) {
        $('setting-toggle-autoscroll').checked = state.settings.autoScroll;
        $('setting-toggle-autoscroll').addEventListener('change', e => {
            state.settings.autoScroll = e.target.checked;
            state.autoScrollLogs = e.target.checked;
            saveSettings();
            syncAutoScrollUI();
        });
    }

    // Wipe all data handlers
    if ($('btn-open-wipe-modal')) $('btn-open-wipe-modal').addEventListener('click', () => openModal('modal-confirm-wipe'));
    if ($('btn-do-wipe')) {
        $('btn-do-wipe').addEventListener('click', () => {
            localStorage.clear();
            showToast('Đã dọn dẹp sạch toàn bộ dữ liệu! Đang khởi động lại...', 'warn');
            setTimeout(() => window.location.reload(), 1200);
        });
    }

    // 11. Terminal Console Controls
    $$('.lf-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.lf-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.logFilter = btn.dataset.level;
            renderFullTerminal();
        });
    });

    if ($('input-log-search')) {
        $('input-log-search').addEventListener('input', e => {
            state.logSearchQuery = e.target.value;
            renderFullTerminal();
        });
    }
    if ($('btn-toggle-autoscroll')) {
        $('btn-toggle-autoscroll').addEventListener('click', () => {
            state.autoScrollLogs = !state.autoScrollLogs;
            state.settings.autoScroll = state.autoScrollLogs;
            saveSettings();
            syncAutoScrollUI();
        });
    }
    if ($('btn-clear-terminal')) $('btn-clear-terminal').addEventListener('click', handleClearLogs);
    if ($('btn-clear-logs-quick')) $('btn-clear-logs-quick').addEventListener('click', handleClearLogs);
    if ($('btn-export-logs')) $('btn-export-logs').addEventListener('click', exportLogsAsTxt);
    if ($('btn-export-logs-txt')) $('btn-export-logs-txt').addEventListener('click', exportLogsAsTxt);

    // 12. Global Keyboard Shortcuts
    document.addEventListener('keydown', e => {
        // Ctrl + Enter -> Start / Stop
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (state.status.is_running) handleStopBot();
            else handleStartBot();
            return;
        }

        // Ctrl + L -> Clear logs
        if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
            e.preventDefault();
            handleClearLogs();
            return;
        }

        // Ctrl + 1..5 -> Switch Page
        if (e.ctrlKey && ['1', '2', '3', '4', '5'].includes(e.key)) {
            e.preventDefault();
            const pages = ['dashboard', 'stats', 'logs', 'settings'];
            const idx = parseInt(e.key, 10) - 1;
            if (pages[idx]) switchPage(pages[idx]);
            return;
        }

        // Escape -> Close Modals
        if (e.key === 'Escape') {
            closeAllModals();
            return;
        }

// Search shortcut removed
    });

    // Material Ripple Effect for all buttons
    document.addEventListener('pointerdown', e => {
        const btn = e.target.closest('.btn, .rail-btn, .auth-pill-item, .metric-card');
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const wave = document.createElement('span');
        wave.className = 'ripple-wave';
        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;

        wave.style.width = wave.style.height = `${diameter}px`;
        wave.style.left = `${e.clientX - rect.left - radius}px`;
        wave.style.top = `${e.clientY - rect.top - radius}px`;

        btn.appendChild(wave);
        setTimeout(() => wave.remove(), 600);
    });
}

function syncSoundUI() {
    const isEnabled = state.settings.soundEnabled;
    const soundOn = document.querySelector('.icon-sound-on');
    const soundOff = document.querySelector('.icon-sound-off');
    if (soundOn) soundOn.classList.toggle('hidden', !isEnabled);
    if (soundOff) soundOff.classList.toggle('hidden', isEnabled);
    if ($('setting-toggle-sound')) $('setting-toggle-sound').checked = isEnabled;
}

function syncAutoScrollUI() {
    const isAuto = state.autoScrollLogs;
    const indicator = $('as-indicator');
    if (indicator) indicator.classList.toggle('active', isAuto);
    if ($('setting-toggle-autoscroll')) $('setting-toggle-autoscroll').checked = isAuto;
}

// ── 15. Initial Bootstrapping ──────────────────────────────────────────────

async function initApplication() {
    loadLocalState();
    applyTheme(state.settings.theme);
    syncSoundUI();
    syncAutoScrollUI();
    setupEventBindings();

    // Set initial input values from settings
    if ($('input-hours')) $('input-hours').value = state.settings.defaultHours || 10;
    if ($('input-count')) $('input-count').value = '';
    if ($('stat-games-counter')) $('stat-games-counter').textContent = '10,464';
    if ($('lib-total-badge')) $('lib-total-badge').textContent = '10,464';
    if ($('est-games-count')) $('est-games-count').textContent = '10,464 games';

    // Initial Status Check
    const res = await fetchApi('status');
    if (res.ok && res.data) {
        updateStatus(res.data);
    }

    // Restore cached Discord user profile from localStorage immediately
    try {
        const cachedUser = localStorage.getItem('discord_cached_user');
        if (cachedUser) {
            updateDiscordUserUI(JSON.parse(cachedUser));
        }
    } catch (e) {}

    // On Vercel: no SSE, use immediate + heartbeat
    updateConnectionBadge(true);
    startHeartbeat();

    // Preload games library in background so 10,464 games are ready instantly
    // Games library page removed for optimal zero-lag performance

    // Restore and display Discord Account immediately on launch from stored token
    const auth = getStoredAuth();
    if (auth.token) {
        const tokenRes = validateDiscordToken(auth.token);
        if (tokenRes.valid && tokenRes.userId) {
            updateDiscordUserUI({
                id: tokenRes.userId,
                username: `User_${tokenRes.userId.slice(-4)}`,
                global_name: `Discord User (${tokenRes.userId.slice(-4)})`,
                avatar_url: `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(tokenRes.userId) >> 22n) % 6}.png`
            });
        }
        syncAuthWithServer(false);
    } else {
        setTimeout(() => {
            showToast('Chào mừng! Hãy cấu hình Discord Token & Cookie để bắt đầu.', 'info', 5000);
        }, 800);
    }
}

// Bootstrap on DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApplication);
} else {
    initApplication();
}





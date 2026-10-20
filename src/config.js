// NyaitterUI の設定。公開設定 (NyaitterServerStatus.client_config.ui) があれば初期値にし、無くても既定値で動く。

const THEMES = ['auto', 'light', 'dark'];

const DEFAULTS = Object.freeze({
    theme: 'auto',
    accent: '',
    features: Object.freeze({}),
    locale: '',
    fallbackLocale: 'ja',
    messages: Object.freeze({}),
    styleUrl: '',
});

function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeFeatures(value) {
    const features = {};
    if (!isPlainObject(value)) return features;
    for (const [key, entry] of Object.entries(value)) {
        features[key] = entry !== false;
    }
    return features;
}

function normalizeMessages(value) {
    if (!isPlainObject(value)) return {};
    const messages = {};
    for (const [locale, dict] of Object.entries(value)) {
        if (isPlainObject(dict)) messages[locale] = dict;
    }
    return messages;
}

function normalizeLocale(value, fallback) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readPublicConfig() {
    const client = globalThis.NyaitterServerStatus?.client_config;
    const ui = isPlainObject(client?.ui) ? client.ui : {};
    return {
        theme: THEMES.includes(ui.theme) ? ui.theme : DEFAULTS.theme,
        accent: typeof ui.accent === 'string' ? ui.accent.trim() : DEFAULTS.accent,
        features: normalizeFeatures(ui.features),
        locale: normalizeLocale(ui.locale, DEFAULTS.locale),
        fallbackLocale: normalizeLocale(ui.fallbackLocale, DEFAULTS.fallbackLocale),
        messages: normalizeMessages(ui.messages),
        styleUrl: typeof ui.styleUrl === 'string' ? ui.styleUrl.trim() : DEFAULTS.styleUrl,
    };
}

function mergeConfig(current, options) {
    const source = isPlainObject(options) ? options : {};
    return {
        theme: THEMES.includes(source.theme) ? source.theme : current.theme,
        accent: typeof source.accent === 'string' ? source.accent.trim() : current.accent,
        features: { ...current.features, ...normalizeFeatures(source.features) },
        locale: source.locale === undefined ? current.locale : normalizeLocale(source.locale, ''),
        fallbackLocale: normalizeLocale(source.fallbackLocale, current.fallbackLocale),
        messages: isPlainObject(source.messages)
            ? { ...current.messages, ...normalizeMessages(source.messages) }
            : current.messages,
        styleUrl: typeof source.styleUrl === 'string' ? source.styleUrl.trim() : current.styleUrl,
    };
}

let config = null;
const listeners = new Set();

export function getConfig() {
    if (!config) config = readPublicConfig();
    return config;
}

export function onConfigChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function notify() {
    const active = getConfig();
    for (const listener of listeners) listener(active);
}

// テーマとアクセントを CSS 変数へ反映する。
function applyTheme() {
    if (typeof document === 'undefined') return;
    const active = getConfig();
    const root = document.documentElement;
    root.dataset.nuiTheme = active.theme;
    if (active.accent) root.style.setProperty('--nui-accent', active.accent);
    else root.style.removeProperty('--nui-accent');
}

export function configure(options = {}) {
    config = mergeConfig(getConfig(), options);
    applyTheme();
    notify();
    return config;
}

export function resetConfig() {
    config = readPublicConfig();
    applyTheme();
    notify();
    return config;
}

// 公開設定があるときは読み込み時にテーマ/アクセントを一度反映する。
if (globalThis.NyaitterServerStatus) applyTheme();

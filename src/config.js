// NyaitterUI の設定。既定値だけを持ち、利用側が configure() で上書きする。

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

function createDefaultConfig() {
    return {
        theme: DEFAULTS.theme,
        accent: DEFAULTS.accent,
        features: {},
        locale: DEFAULTS.locale,
        fallbackLocale: DEFAULTS.fallbackLocale,
        messages: {},
        styleUrl: DEFAULTS.styleUrl,
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
    if (!config) config = createDefaultConfig();
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
    config = createDefaultConfig();
    applyTheme();
    notify();
    return config;
}

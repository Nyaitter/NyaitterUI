// 翻訳。現在のロケールは ref で持つので、t() を使うコンポーネントは setLocale() で描き直される。
import { ref } from './reactivity.js';
import { getConfig, onConfigChange } from './config.js';

// あらかじめ入れておく最小の文言。ユーザーの messages で上書きできる。
const DEFAULT_MESSAGES = {
    ja: { common: { close: '閉じる' } },
    en: { common: { close: 'Close' } },
};

const localeRef = ref(null);
const store = {};

function isObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(target, source) {
    for (const [key, value] of Object.entries(source)) {
        if (isObject(value)) {
            if (!isObject(target[key])) target[key] = {};
            deepMerge(target[key], value);
        } else {
            target[key] = value;
        }
    }
    return target;
}

function detectLocale() {
    if (typeof navigator !== 'undefined' && navigator.language) return navigator.language;
    return null;
}

export function getLocale() {
    return localeRef.value || detectLocale() || getConfig().fallbackLocale;
}

export function setLocale(locale) {
    localeRef.value = locale || null;
}

// 探す順番: 指定ロケール → 言語部分（ja-JP → ja）→ fallback。
function localeChain(locale) {
    const chain = [];
    const add = (value) => {
        if (value && !chain.includes(value)) chain.push(value);
    };
    add(locale);
    if (locale && locale.includes('-')) add(locale.split('-')[0]);
    add(getConfig().fallbackLocale);
    return chain;
}

function lookup(dictionary, key) {
    if (!isObject(dictionary)) return undefined;
    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
        const value = dictionary[key];
        return isObject(value) ? undefined : value;
    }
    let current = dictionary;
    for (const part of key.split('.')) {
        if (isObject(current) && Object.prototype.hasOwnProperty.call(current, part)) current = current[part];
        else return undefined;
    }
    return isObject(current) ? undefined : current;
}

function interpolate(text, params) {
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, (match, name) => (
        Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
    ));
}

// 見つからなければ key をそのまま返す。
export function t(key, params) {
    const locale = localeRef.value || detectLocale() || getConfig().fallbackLocale;
    for (const name of localeChain(locale)) {
        const value = lookup(store[name], key);
        if (value != null) return interpolate(String(value), params);
    }
    return key;
}

export function addMessages(locale, dictionary) {
    if (!locale || !isObject(dictionary)) return;
    store[locale] = deepMerge(store[locale] || {}, dictionary);
}

export function setMessages(messages) {
    for (const locale of Object.keys(store)) delete store[locale];
    deepMerge(store, DEFAULT_MESSAGES);
    if (isObject(messages)) {
        for (const [locale, dictionary] of Object.entries(messages)) addMessages(locale, dictionary);
    }
}

// data-i18n を付けた静的な要素を訳す（任意の補助）。
export function translateNodes(root) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    for (const el of root.querySelectorAll('[data-i18n]')) {
        const key = el.getAttribute('data-i18n');
        if (!key) continue;
        const text = t(key);
        const attribute = el.getAttribute('data-i18n-attr');
        if (attribute) el.setAttribute(attribute, text);
        else el.textContent = text;
    }
}

// コンポーネント用。locale は ref なので .value で読む。
export function useI18n() {
    return { t, locale: localeRef, setLocale, getLocale };
}

function applyConfig() {
    const config = getConfig();
    if (isObject(config.messages)) {
        for (const [locale, dictionary] of Object.entries(config.messages)) addMessages(locale, dictionary);
    }
    if (config.locale) localeRef.value = config.locale;
}

setMessages(null);
onConfigChange(applyConfig);
applyConfig();

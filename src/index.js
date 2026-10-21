// NyaitterUI の入り口。公開 API をまとめ、globalThis.NyaitterUI と data-nui の自動変換を用意する。
import { h, Fragment, render, defineComponent, createApp } from './runtime.js';
import { ref, computed, effect, watch } from './reactivity.js';
import {
    t,
    useI18n,
    setLocale,
    getLocale,
    addMessages,
    setMessages,
    translateNodes,
} from './i18n.js';
import { configure, getConfig, resetConfig } from './config.js';
import { enhance, upgradeElement, classForKind, start, stop } from './enhance.js';
import * as components from './components.js';
import { name, version, description, repository } from './version.js';

// クライアント指定の URL か、設定の styleUrl か、読み込んだ script の隣の .css を使う。
function resolveStyleUrl(url) {
    if (url) return url;
    const configured = getConfig().styleUrl;
    if (configured) return configured;
    const script = typeof document !== 'undefined' ? document.currentScript : null;
    if (script && script.src) return script.src.replace(/\.js(?=$|[?#])/, '.css');
    return '';
}

// url 省略時は設定か script の隣の .css を使う。
export function injectStyles(url) {
    if (typeof document === 'undefined') return null;
    const href = resolveStyleUrl(url);
    if (!href) return null;
    const existing = document.querySelector('link[data-nui-styles]');
    if (existing) {
        if (url) existing.href = href;
        return existing;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-nui-styles', '');
    document.head.append(link);
    return link;
}

const NyaitterUI = Object.freeze({
    name,
    version,
    description,
    repository,
    h,
    Fragment,
    render,
    defineComponent,
    createApp,
    ref,
    computed,
    effect,
    watch,
    t,
    useI18n,
    setLocale,
    getLocale,
    addMessages,
    setMessages,
    translateNodes,
    configure,
    getConfig,
    resetConfig,
    injectStyles,
    enhance,
    upgradeElement,
    classForKind,
    start,
    stop,
    components,
});

if (typeof globalThis !== 'undefined') globalThis.NyaitterUI = NyaitterUI;

// data-nui の印が付いた素の HTML を自動で変換する (コンポーネント API だけ使う場合は無害)。
if (typeof document !== 'undefined') start();

export default NyaitterUI;
export {
    h,
    Fragment,
    render,
    defineComponent,
    createApp,
    ref,
    computed,
    effect,
    watch,
    t,
    useI18n,
    setLocale,
    getLocale,
    addMessages,
    setMessages,
    translateNodes,
    configure,
    getConfig,
    resetConfig,
    enhance,
    upgradeElement,
    classForKind,
    start,
    stop,
    components,
    name,
    version,
    description,
    repository,
};

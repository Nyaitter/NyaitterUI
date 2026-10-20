// data-nui の印を付けた素の HTML を変換する。
//   <button data-nui="button">   → class="nui-button"
//   <div data-nui-feature="groupCreate">  → features が false なら hidden
// コンポーネント API を使わず文字列テンプレートで組む場合の薄い層。
import { getConfig, onConfigChange } from './config.js';

const CLASS_BY_KIND = Object.freeze({
    page: 'nui-page',
    'page-heading': 'nui-page-heading',
    section: 'nui-section',
    card: 'nui-card',
    list: 'nui-list',
    'list-item': 'nui-list-item',
    nav: 'nui-nav',
    'nav-item': 'nui-nav-item',
    split: 'nui-split',
    toolbar: 'nui-toolbar',
    tabs: 'nui-tabs',
    form: 'nui-form',
    field: 'nui-field',
    heading: 'nui-heading',
    badge: 'nui-badge',
    avatar: 'nui-avatar',
    icon: 'nui-icon',
    button: 'nui-button',
    'button-secondary': 'nui-button-secondary',
    'button-danger': 'nui-button-danger',
    'empty-text': 'nui-empty-text',
});

const SELECTOR = '[data-nui], [data-nui-feature]';

function addClass(element, name) {
    if (name && !element.classList.contains(name)) element.classList.add(name);
}

function applyFeature(element) {
    const name = element.dataset.nuiFeature;
    const features = getConfig().features || {};
    element.hidden = features[name] === false;
}

// 1要素を変換する。変換したら true。
export function upgradeElement(element) {
    if (!element || element.nodeType !== 1) return false;
    let upgraded = false;
    const kind = element.dataset.nui;
    if (kind && CLASS_BY_KIND[kind]) {
        const before = element.className;
        addClass(element, CLASS_BY_KIND[kind]);
        if (element.className !== before) upgraded = true;
    }
    if (element.hasAttribute('data-nui-feature')) {
        applyFeature(element);
        upgraded = true;
    }
    return upgraded;
}

// root 配下 (root 自身も含む) を変換する。
export function enhance(root) {
    if (typeof document === 'undefined') return 0;
    const scope = root || document;
    let count = 0;
    for (const element of scope.querySelectorAll(SELECTOR)) {
        if (upgradeElement(element)) count += 1;
    }
    if (scope.nodeType === 1 && upgradeElement(scope)) count += 1;
    return count;
}

let observer = null;
let started = false;

function refreshFeatures() {
    if (typeof document === 'undefined') return;
    for (const element of document.querySelectorAll('[data-nui-feature]')) applyFeature(element);
}

// DOMContentLoaded と DOM 変化に追随して自動変換を始める。
export function start(root) {
    if (typeof document === 'undefined' || started) return;
    started = true;

    const runEnhance = () => enhance(document);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runEnhance, { once: true });
    } else {
        runEnhance();
    }

    const target = root || document.body || document.documentElement;
    if (typeof MutationObserver !== 'undefined' && target) {
        observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes') {
                    upgradeElement(mutation.target);
                    continue;
                }
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (node.matches?.(SELECTOR)) upgradeElement(node);
                    enhance(node);
                }
            }
        });
        observer.observe(target, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-nui', 'data-nui-feature'],
        });
    }

    onConfigChange(refreshFeatures);
}

export function stop() {
    if (observer) observer.disconnect();
    observer = null;
    started = false;
}

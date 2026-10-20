// h() で仮想ノードを作り、render() / createApp().mount() で DOM に反映する。
import { effect } from './reactivity.js';

export const Fragment = Symbol('Fragment');

// テキストノードは type に null を使う。
const TEXT = null;

function isComponentType(type) {
    return Boolean(type) && (type.__nuiComponent === true || typeof type === 'function');
}

function isObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function wrapText(value) {
    return { type: TEXT, text: String(value), props: null, children: [], key: null, els: [] };
}

// 文字列・数値・配列・null を仮想ノードにそろえる。
function normalizeVNode(input) {
    if (input === null || input === undefined || typeof input === 'boolean') return wrapText('');
    if (Array.isArray(input)) {
        return { type: Fragment, props: null, children: flattenChildren([input]), key: null, els: [] };
    }
    if (typeof input === 'string' || typeof input === 'number') return wrapText(input);
    return input;
}

function flattenChildren(input, out = []) {
    for (const child of input) {
        if (Array.isArray(child)) flattenChildren(child, out);
        else if (child === null || child === undefined || typeof child === 'boolean') continue;
        else if (typeof child === 'string' || typeof child === 'number') out.push(wrapText(child));
        else out.push(child);
    }
    return out;
}

// 仮想ノードを作る。type はタグ名 / Fragment / defineComponent の戻り値。
export function h(type, props, ...children) {
    let rawProps = props;
    if (rawProps && (!isObject(rawProps))) {
        children.unshift(rawProps);
        rawProps = null;
    }
    rawProps = rawProps || {};

    const cleanProps = {};
    for (const name in rawProps) {
        if (name === 'key' || name === 'children') continue;
        cleanProps[name] = rawProps[name];
    }

    const kids = flattenChildren(children);
    if (kids.length === 0 && rawProps.children != null) {
        flattenChildren([rawProps.children], kids);
    }

    return {
        type,
        props: cleanProps,
        children: kids,
        key: rawProps.key != null ? rawProps.key : null,
        els: [],
    };
}

function collectEls(children) {
    const els = [];
    for (const child of children) {
        for (const el of child.els) els.push(el);
    }
    return els;
}

function moveBefore(parent, vnode, reference) {
    for (const el of vnode.els) {
        if (el.parentNode !== parent || el === reference) continue;
        parent.insertBefore(el, reference);
    }
}

// 前のノードの位置に後ろのノードを合わせる。
function patch(oldVNode, vnode, parent, anchor) {
    if (!oldVNode) {
        mount(vnode, parent, anchor);
        return;
    }

    if (oldVNode.type !== vnode.type || oldVNode.key !== vnode.key) {
        const reference = oldVNode.els.length ? oldVNode.els[0] : anchor;
        unmount(oldVNode, parent);
        mount(vnode, parent, reference);
        return;
    }

    if (vnode.type === TEXT) {
        vnode.els = oldVNode.els;
        if (oldVNode.text !== vnode.text) oldVNode.els[0].nodeValue = vnode.text;
        return;
    }

    if (vnode.type === Fragment) {
        patchChildren(parent, oldVNode.children, vnode.children, anchor);
        vnode.els = collectEls(vnode.children);
        return;
    }

    if (isComponentType(vnode.type)) {
        patchComponent(oldVNode, vnode, parent, anchor);
        return;
    }

    vnode.el = oldVNode.el;
    vnode.els = [vnode.el];
    applyProps(vnode.el, oldVNode.props, vnode.props);
    patchChildren(vnode.el, oldVNode.children, vnode.children, null);
}

function patchChildren(parent, oldChildren, newChildren, anchor) {
    const keyed = new Map();
    const unkeyed = [];
    for (const child of oldChildren) {
        if (child.key != null) keyed.set(child.key, child);
        else unkeyed.push(child);
    }

    const matched = new Array(newChildren.length).fill(null);
    const used = new Set();
    for (let i = 0; i < newChildren.length; i++) {
        const next = newChildren[i];
        let previous = null;
        if (next.key != null) previous = keyed.get(next.key) || null;
        else {
            const candidate = unkeyed[i];
            if (candidate && !used.has(candidate)) previous = candidate;
        }
        if (previous) {
            used.add(previous);
            matched[i] = previous;
        }
    }

    // 後ろから合わせると、位置がずれても挿入先が一意に決まる。
    let reference = anchor;
    for (let i = newChildren.length - 1; i >= 0; i--) {
        const next = newChildren[i];
        const previous = matched[i];
        if (previous) {
            patch(previous, next, parent, reference);
            moveBefore(parent, next, reference);
        } else {
            mount(next, parent, reference);
        }
        reference = next.els.length ? next.els[0] : reference;
    }

    for (const child of oldChildren) {
        if (!used.has(child)) unmount(child, parent);
    }
}

function unmount(vnode, parent) {
    if (!vnode) return;
    if (vnode.type === Fragment) {
        for (const child of vnode.children) unmount(child, parent);
        return;
    }
    if (isComponentType(vnode.type)) {
        unmountComponent(vnode, parent);
        return;
    }
    for (const el of vnode.els) {
        if (el.parentNode === parent) parent.removeChild(el);
    }
}

function mount(vnode, parent, anchor) {
    const type = vnode.type;

    if (type === TEXT) {
        const node = document.createTextNode(vnode.text);
        parent.insertBefore(node, anchor);
        vnode.els = [node];
        return;
    }

    if (type === Fragment) {
        for (const child of vnode.children) mount(child, parent, anchor);
        vnode.els = collectEls(vnode.children);
        return;
    }

    if (isComponentType(type)) {
        mountComponent(vnode, parent, anchor);
        return;
    }

    const el = document.createElement(type);
    vnode.el = el;
    vnode.els = [el];
    parent.insertBefore(el, anchor);
    applyProps(el, null, vnode.props);
    for (const child of vnode.children) mount(child, el, null);
}

/* --------------------------- コンポーネント --------------------------- */

const ROOT = Symbol('nui-root');

// defineComponent で作った部品。setup / render / onMount / onUpdate / onUnmount を持つ。
export function defineComponent(options) {
    return { __nuiComponent: true, name: 'Component', ...options };
}

function renderFunctionFor(options, instance) {
    if (typeof options === 'function') return () => options(instance.props, instance);
    if (typeof options.render === 'function') return () => options.render(instance);
    return () => null;
}

function syncProps(instance, props) {
    const target = instance.props;
    for (const name in props) target[name] = props[name];
    for (const name in target) {
        if (!(name in props)) delete target[name];
    }
}

function scheduleUpdate(instance) {
    if (instance.scheduled) return;
    instance.scheduled = true;
    queueMicrotask(() => {
        instance.scheduled = false;
        if (instance.mounted) updateInstance(instance);
    });
}

function makeInstance(options, vnode, parent, anchor) {
    const instance = {
        name: options.name || 'Component',
        options,
        props: {},
        children: vnode.children,
        parent,
        anchor,
        mounted: false,
        scheduled: false,
        subtree: null,
        nextSubtree: null,
        vnode,
        effect: null,
    };
    syncProps(instance, vnode.props);

    if (typeof options.setup === 'function') {
        const state = options.setup(instance.props, instance);
        if (isObject(state)) Object.assign(instance, state);
    }

    const run = renderFunctionFor(options, instance);
    instance.effect = effect(
        () => {
            instance.nextSubtree = normalizeVNode(run());
        },
        () => scheduleUpdate(instance),
    );
    return instance;
}

function updateInstance(instance) {
    const previous = instance.subtree;
    instance.effect.run();
    const next = instance.nextSubtree;
    patch(previous, next, instance.parent, instance.anchor);
    instance.subtree = next;
    if (instance.vnode) instance.vnode.els = next.els;
    if (instance.mounted && typeof instance.options.onUpdate === 'function') {
        instance.options.onUpdate(instance);
    }
}

function mountComponent(vnode, parent, anchor) {
    const options = isObject(vnode.type) && vnode.type.__nuiComponent
        ? vnode.type
        : { render: vnode.type };

    const instance = makeInstance(options, vnode, parent, anchor);
    vnode.component = instance;

    instance.subtree = instance.nextSubtree;
    mount(instance.subtree, parent, anchor);
    vnode.els = instance.subtree.els;

    instance.mounted = true;
    if (typeof options.onMount === 'function') options.onMount(instance);
}

function patchComponent(oldVNode, vnode, parent, anchor) {
    const instance = oldVNode.component;
    vnode.component = instance;
    instance.vnode = vnode;
    instance.parent = parent;
    instance.anchor = anchor;
    instance.children = vnode.children;
    syncProps(instance, vnode.props);
    updateInstance(instance);
    vnode.els = instance.subtree.els;
}

function unmountComponent(vnode, parent) {
    const instance = vnode.component;
    if (!instance) return;
    instance.mounted = false;
    instance.effect.stop();
    if (typeof instance.options.onUnmount === 'function') instance.options.onUnmount(instance);
    unmount(instance.subtree, parent);
}

/* ------------------------------ アプリ ------------------------------ */

export function render(vnode, container) {
    const previous = container[ROOT];
    const next = normalizeVNode(vnode);
    if (previous) patch(previous, next, container, null);
    else mount(next, container, null);
    container[ROOT] = next;
    return next;
}

export function createApp(rootComponent, rootProps = {}) {
    let container = null;
    let root = null;
    return {
        mount(target) {
            container = target;
            if (container.classList) container.classList.add('nui-root');
            root = render(h(rootComponent, rootProps), container);
            return root.component || null;
        },
        unmount() {
            if (root && container) {
                unmount(root, container);
                container[ROOT] = null;
            }
            root = null;
        },
    };
}

/* ------------------------------ 属性 ------------------------------ */

function classString(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(classString).filter(Boolean).join(' ');
    if (isObject(value)) {
        return Object.keys(value).filter((name) => value[name]).join(' ');
    }
    return String(value);
}

function setStyle(el, style) {
    el.removeAttribute('style');
    if (typeof style === 'string') {
        el.setAttribute('style', style);
        return;
    }
    if (!isObject(style)) return;
    for (const name in style) {
        const value = style[name];
        if (value == null) continue;
        const cssName = name.startsWith('--') ? name : name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
        el.style.setProperty(cssName, value);
    }
}

const BOOLEAN_PROPS = new Set(['checked', 'disabled', 'selected', 'readOnly', 'multiple', 'hidden']);

function setEvent(el, name, handler) {
    const type = name.slice(2).toLowerCase();
    el._nuiEvents = el._nuiEvents || {};
    const previous = el._nuiEvents[type];
    if (previous) el.removeEventListener(type, previous);
    if (handler) {
        el.addEventListener(type, handler);
        el._nuiEvents[type] = handler;
    } else {
        delete el._nuiEvents[type];
    }
}

function setProp(el, name, next) {
    if (name === 'ref') return;
    if (name === 'class' || name === 'className') {
        el.className = classString(next);
        return;
    }
    if (name === 'style') {
        setStyle(el, next);
        return;
    }
    if (/^on[A-Z]/.test(name)) {
        setEvent(el, name, next);
        return;
    }
    if (name === 'value') {
        const value = next == null ? '' : next;
        if (el.value !== value) el.value = value;
        return;
    }
    if (BOOLEAN_PROPS.has(name)) {
        el[name] = Boolean(next);
        if (next) el.setAttribute(name, '');
        else el.removeAttribute(name);
        return;
    }
    if (next == null || next === false) {
        el.removeAttribute(name);
        return;
    }
    el.setAttribute(name, next === true ? '' : String(next));
}

function removeProp(el, name) {
    if (name === 'class' || name === 'className') {
        el.className = '';
        return;
    }
    if (name === 'style') {
        el.removeAttribute('style');
        return;
    }
    if (/^on[A-Z]/.test(name)) {
        setEvent(el, name, null);
        return;
    }
    if (name === 'value') {
        el.value = '';
        return;
    }
    if (BOOLEAN_PROPS.has(name)) {
        el[name] = false;
        el.removeAttribute(name);
        return;
    }
    el.removeAttribute(name);
}

function applyProps(el, oldProps, newProps) {
    const previous = oldProps || {};
    for (const name in previous) {
        if (!(name in newProps)) removeProp(el, name);
    }
    for (const name in newProps) {
        if (previous[name] !== newProps[name]) setProp(el, name, newProps[name]);
    }
}

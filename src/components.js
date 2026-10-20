// 付属コンポーネント。h() と nui-* クラスを薄く包んだだけで、見た目は CSS が担当する。
import { h, defineComponent } from './runtime.js';
import { t } from './i18n.js';

export const Button = defineComponent({
    name: 'NuiButton',
    render(ctx) {
        const props = ctx.props;
        const variant = props.variant || 'primary';
        const className = variant === 'secondary' ? 'nui-button-secondary'
            : variant === 'danger' ? 'nui-button-danger'
                : 'nui-button';
        return h('button', {
            type: props.type || 'button',
            class: [className, props.class],
            disabled: props.disabled,
            onClick: props.onClick,
        }, ctx.children.length ? ctx.children : (props.label != null ? props.label : ''));
    },
});

export const Input = defineComponent({
    name: 'NuiInput',
    render(ctx) {
        const props = ctx.props;
        return h('input', {
            class: ['nui-input', props.class],
            type: props.type || 'text',
            name: props.name,
            value: props.value,
            placeholder: props.placeholder,
            disabled: props.disabled,
            onInput: props.onInput,
            onChange: props.onChange,
        });
    },
});

export const Card = defineComponent({
    name: 'NuiCard',
    render(ctx) {
        const props = ctx.props;
        return h('div', {
            class: ['nui-card', props.interactive && 'is-interactive', props.danger && 'nui-danger-card', props.class],
        }, ctx.children);
    },
});

export const Modal = defineComponent({
    name: 'NuiModal',
    render(ctx) {
        const props = ctx.props;
        if (!props.open) return null;
        const close = props.onClose;
        return h('div', {
            class: ['nui-modal-backdrop', props.class],
            onClick: (event) => {
                if (close && event.target === event.currentTarget) close();
            },
        }, h('div', { class: 'nui-modal', role: 'dialog', 'aria-modal': 'true' },
            props.title != null ? h('h3', { class: 'nui-modal-title' }, props.title) : null,
            h('div', { class: 'nui-modal-body' }, ctx.children),
            close ? h('button', {
                type: 'button',
                class: 'nui-button-secondary',
                onClick: close,
            }, props.closeLabel != null ? props.closeLabel : t('common.close')) : null,
        ));
    },
});

export const Tabs = defineComponent({
    name: 'NuiTabs',
    render(ctx) {
        const props = ctx.props;
        const tabs = props.tabs || [];
        const active = props.active != null ? props.active : (tabs[0] && tabs[0].key);
        return h('div', { class: ['nui-tabs', props.class], role: 'tablist' },
            tabs.map((tab) => h('button', {
                key: tab.key,
                type: 'button',
                role: 'tab',
                class: ['nui-tab', active === tab.key && 'is-active'],
                'aria-selected': active === tab.key ? 'true' : 'false',
                onClick: () => props.onSelect && props.onSelect(tab.key),
            }, tab.label)),
        );
    },
});

export const Toggle = defineComponent({
    name: 'NuiToggle',
    render(ctx) {
        const props = ctx.props;
        return h('label', { class: ['nui-toggle', props.disabled && 'is-disabled', props.class] },
            h('input', {
                type: 'checkbox',
                class: 'nui-toggle-input',
                checked: props.checked,
                disabled: props.disabled,
                onChange: (event) => props.onChange && props.onChange(event.target.checked),
            }),
            h('span', { class: 'nui-toggle-track' }, h('span', { class: 'nui-toggle-thumb' })),
            props.label != null ? h('span', { class: 'nui-toggle-label' }, props.label) : null,
        );
    },
});

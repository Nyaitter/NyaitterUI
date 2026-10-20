// 小さなリアクティビティ。ref / computed / effect / watch のみ。深い監視はしない。
let activeEffect = null;

function track(dep) {
    if (!activeEffect) return;
    dep.add(activeEffect);
    activeEffect.deps.add(dep);
}

function trigger(dep) {
    for (const listener of [...dep]) {
        if (listener.scheduler) listener.scheduler();
        else listener.run();
    }
}

function cleanup(listener) {
    for (const dep of listener.deps) dep.delete(listener);
    listener.deps.clear();
}

// 依存を集めながら fn を実行する。fn をもう一度実行するには run() を呼ぶ。
export function effect(fn, scheduler = null) {
    const listener = {
        fn,
        scheduler,
        deps: new Set(),
        active: true,
        run() {
            if (!listener.active) return;
            cleanup(listener);
            const previous = activeEffect;
            activeEffect = listener;
            try {
                listener.fn();
            } finally {
                activeEffect = previous;
            }
        },
        stop() {
            cleanup(listener);
            listener.active = false;
        },
    };
    listener.run();
    return listener;
}

// 値を入れる箱。value を読むと依存が記録され、書き換えると再実行される。
export function ref(initial) {
    let value = initial;
    const dep = new Set();
    return {
        __isRef: true,
        get value() {
            track(dep);
            return value;
        },
        set value(next) {
            if (Object.is(next, value)) return;
            value = next;
            trigger(dep);
        },
    };
}

// 他の値から作る読み取り専用の箱。依存が変わったときだけ計算し直す。
export function computed(getter) {
    const dep = new Set();
    let value;
    let dirty = true;
    const runner = effect(
        () => {
            value = getter();
            dirty = false;
        },
        () => {
            dirty = true;
            trigger(dep);
        },
    );
    return {
        __isRef: true,
        get value() {
            track(dep);
            if (dirty) runner.run();
            return value;
        },
    };
}

// 値の変化を監視して callback(newValue, oldValue) を呼ぶ。停止関数を返す。
export function watch(source, callback) {
    const getter = typeof source === 'function' ? source : () => source.value;
    let oldValue;
    let initialized = false;
    const runner = effect(() => {
        const value = getter();
        if (!initialized) {
            initialized = true;
            oldValue = value;
            return;
        }
        const previous = oldValue;
        oldValue = value;
        callback(value, previous);
    });
    return () => runner.stop();
}

# NyaitterUI

Nyaitter の画面をそろえる CSS と、依存なしの小さな部品集です。CSS を 1 行読み込み、HTML に `data-nui` を付けるだけで使えます。

## 最短で使う

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nyaitter-ui/dist/nyaitter-ui.css">

<main data-nui="page">
  <h1 data-nui="page-heading">設定</h1>
  <section data-nui="section">…</section>
  <button data-nui="button">保存</button>
</main>
```

これだけで Nyaitter の見た目になります。JavaScript は不要です。

`nyaitter-ui.js` を読み込むと、後から追加された要素も自動で変換されます。

```html
<script src="https://cdn.jsdelivr.net/npm/nyaitter-ui/dist/nyaitter-ui.js"></script>
```

npm やバンドラで使う場合:

```js
import 'nyaitter-ui/css';
// または
import { injectStyles } from 'nyaitter-ui';
injectStyles();
```

## `data-nui="<種類>"`

付けた要素に `nui-<種類>` クラスを付けます。見た目は CSS 側で決まります。

| 種類 | 付くクラス | 種類 | 付くクラス |
| --- | --- | --- | --- |
| `page` | `nui-page` | `nav` | `nui-nav` |
| `page-heading` | `nui-page-heading` | `nav-item` | `nui-nav-item` |
| `section` | `nui-section` | `split` | `nui-split` |
| `card` | `nui-card` | `toolbar` | `nui-toolbar` |
| `list` | `nui-list` | `tabs` | `nui-tabs` |
| `list-item` | `nui-list-item` | `form` | `nui-form` |
| `field` | `nui-field` | `heading` | `nui-heading` |
| `badge` | `nui-badge` | `avatar` | `nui-avatar` |
| `icon` | `nui-icon` | `button` | `nui-button` |
| `button-secondary` | `nui-button-secondary` | `button-danger` | `nui-button-danger` |
| `empty-text` | `nui-empty-text` | | |

手動で変換するときは `enhance(root)`、1 要素だけなら `upgradeElement(el)` を使います。

## `data-nui-feature="名前"`

設定の `features` が `false` のときだけ要素を隠します。未設定なら表示されます。右上のメニューなど、機能ごとに出し分けたい部分に使います。

```html
<div data-nui-feature="groupCreate">グループ作成</div>
```

```js
import { configure } from 'nyaitter-ui';
configure({ features: { groupCreate: false } });
```

`configure()` で切り替えると、表示中の要素にもすぐ反映されます。

## 使えるクラス（`nui-*`）

`data-nui` を使わず、クラスを直接付けても同じ見た目になります。

- **レイアウト**: `nui-page` `nui-page-heading` `nui-section` `nui-section-heading` `nui-section-title` `nui-split` `nui-toolbar` `nui-row` `nui-actions` `nui-card` `nui-danger-card`（`is-interactive` でホバー）
- **リスト**: `nui-list` `nui-list-item` `nui-list-link` `nui-list-copy` `nui-list-title` `nui-list-meta`
- **連結リスト**: `nui-list` に `nui-list--flush` を足すと、外枠を 1 つにまとめて行の間だけを区切ります。通知や DM など、続けて読む一覧向けです。
- **ナビ・タブ**: `nui-nav` `nui-nav-item`（`is-active` で選択中） `nui-tabs` `nui-tab`（`is-active`）
- **フォーム**: `nui-form` `nui-field` `nui-input` `nui-help-text` `nui-toggle` `nui-toggle-input` `nui-toggle-track` `nui-toggle-thumb` `nui-toggle-label`
- **ボタン**: `nui-button` `nui-button-secondary` `nui-button-danger`
- **表示**: `nui-badge`（`nui-badge-accent` / `nui-badge-danger`） `nui-avatar` `nui-icon` `nui-heading` `nui-empty-text` `nui-link` `nui-stat`
- **テーブル**: `nui-table-wrap` `nui-table`
- **モーダル**: `nui-modal-backdrop` `nui-modal` `nui-modal-title` `nui-modal-body`
- **プロフィール・管理**: `nui-profile` `nui-profile-header` `nui-profile-main` `nui-profile-avatar` `nui-profile-copy` `nui-profile-actions` `nui-manage-detail`
- **ルート**: `nui-root`（`createApp` が自動で付けます）

## 色と角丸を変える

CSS 変数か `configure({ theme, accent })` で変更できます。

| 変数 | 用途 | 変数 | 用途 |
| --- | --- | --- | --- |
| `--nui-accent` | アクセント色 | `--nui-danger` | 危険色 |
| `--nui-bg` | 背景 | `--nui-danger-bg` | 危険色の薄い背景 |
| `--nui-surface` | 面 | `--nui-radius` / `--nui-radius-sm` | 角丸 |
| `--nui-border` | 枠線 | `--nui-font` | フォント |
| `--nui-text` | 文字 | `--nui-shadow` | 影 |
| `--nui-muted` | 補助文字 | | |

テーマは `<html data-nui-theme="light|dark|auto">` で切り替えます。`auto` は OS の設定に合わせます。

## 翻訳（i18n）

```js
import { addMessages, setLocale, t } from 'nyaitter-ui';

addMessages('ja', { greeting: 'こんにちは、{name}さん', menu: { home: 'ホーム' } });
addMessages('en', { greeting: 'Hello, {name}!', menu: { home: 'Home' } });

setLocale('en');
t('greeting', { name: 'Nyaitter' });
t('menu.home');
```

- キーはドットで入れ子をたどります（`menu.home`）。
- `{name}` は第 2 引数で置き換えます。
- 見つからない場合は言語の基本部分（`en-US` → `en`）、次に `fallbackLocale`（既定 `ja`）、それでも無ければキーをそのまま返します。
- `setLocale()` を呼ぶと、`t()` を使っているコンポーネントは自動で描き直されます。

## コンポーネントで書く（任意）

CSS クラスを JavaScript から組み立てたい場合に使います。

```js
import { h, ref, defineComponent, createApp, t, components } from 'nyaitter-ui';

const App = defineComponent({
  setup() { return { count: ref(0) }; },
  render(ctx) {
    return h('div', { class: 'nui-card' },
      h('h1', null, t('greeting', { name: 'Nyaitter' })),
      h(components.Button, { variant: 'primary', onClick: () => ctx.count.value++ }, `クリック ${ctx.count.value}`),
    );
  },
});

createApp(App).mount(document.getElementById('app'));
```

`components` には `Button`、`Input`、`Card`、`Toggle`、`Tabs`、`Modal` があります。

## 設定

```js
import { configure } from 'nyaitter-ui';

configure({
  theme: 'auto',
  accent: '#ff9900',
  locale: 'ja',
  fallbackLocale: 'ja',
  messages: { ja: { hello: 'やあ' } },
  features: { groupCreate: false },
  styleUrl: '',
});
```

`NyaitterServerStatus.client_config.ui` があれば、それを初期値にします。設定が無くても既定値だけで動きます。

## 公開 API

`import { ... } from 'nyaitter-ui'` と、ブラウザの `globalThis.NyaitterUI` から使えます。

| API | 説明 |
| --- | --- |
| `h(type, props, ...children)` / `Fragment` | 仮想ノードを作る |
| `render(vnode, container)` | その場に描画する |
| `defineComponent(options)` / `createApp(component, props?)` | 部品を定義する / アプリを `mount`・`unmount` する |
| `ref` / `computed` / `effect` / `watch` | リアクティブな値 |
| `t(key, params?)` / `useI18n()` | 翻訳する |
| `setLocale` / `getLocale` / `addMessages` / `setMessages` / `translateNodes` | 言語の切り替え、翻訳の登録 |
| `configure` / `getConfig` / `resetConfig` | 設定の上書き・取得・初期化 |
| `enhance(root?)` / `upgradeElement(el)` | `data-nui` を手動で変換する |
| `start(root?)` / `stop()` | 自動変換の開始・停止 |
| `injectStyles(url?)` | CSS を読み込む |
| `components` | 付属コンポーネント |
| `name` / `version` / `description` / `repository` | パッケージ情報 |

## 開発

```bash
npm install
npm run build
```

`dist/` に次のファイルができます。

- `index.js`（ESM）
- `index.cjs`（CJS）
- `nyaitter-ui.js`（ブラウザ用。`NyaitterUI` を定義）
- `nyaitter-ui.css`

## 公開

GitHub Release を公開すると、GitHub Actions がビルドして npm に公開します。初回だけ、npm の Trusted Publisher に GitHub リポジトリと `.github/workflows/publish.yml` を登録してください。公開前に `package.json` のバージョンを更新します。npm トークンを GitHub に登録する必要はありません。

## ライセンス

MIT License

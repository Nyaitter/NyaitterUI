# NyaitterUI

Nyaitter の画面をそろえる CSS と、依存なしの小さな部品集です。

## 使い始める
CSS を読み込み、HTML に `data-nui` を付けます。

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nyaitter-ui/dist/nyaitter-ui.css">

<main data-nui="page">
  <h3 data-nui="page-heading">設定</h3>
  <button data-nui="button">保存</button>
</main>
```

`nyaitter-ui.js` を追加すると、後から追加した要素も自動で変換されます。

```html
<script src="https://cdn.jsdelivr.net/npm/nyaitter-ui/dist/nyaitter-ui.js"></script>
```

npm / バンドラの場合:

```js
import 'nyaitter-ui/css';
// または
import { injectStyles } from 'nyaitter-ui';
injectStyles();
```

## リファレンス

### `data-nui` / `data-nui-feature`
`data-nui` は要素に `nui-<種類>` クラスを付けます。

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
| `empty-text` | `nui-empty-text` | `cover` | `nui-cover` |

手動変換は `enhance(root)`、1 要素だけなら `upgradeElement(el)` を使います。

`data-nui-feature` は設定の `features` が `false` のときだけ要素を隠します（未設定なら表示）。

```html
<div data-nui-feature="exampleFeature">表示を切り替える要素</div>
```

```js
configure({ features: { exampleFeature: false } });
```

`configure()` の変更は表示中の要素にもすぐ反映されます。

### クラス（`nui-*`）
`data-nui` を使わず、直接付けても同じ見た目になります。

- **レイアウト**: `nui-page` `nui-page-heading` `nui-section` `nui-section-heading` `nui-section-title` `nui-split` `nui-toolbar` `nui-row` `nui-actions` `nui-card` `nui-cover` `nui-danger-card`（`is-interactive` でホバー）
- **リスト**: `nui-list` `nui-list-item` `nui-list-link` `nui-list-copy` `nui-list-title` `nui-list-meta`。`nui-list--flush` で外枠を 1 つにまとめます。
- **ナビ・タブ**: `nui-nav` `nui-nav-item`（`is-active` / `active` で選択中） `nui-tabs` `nui-tab`（`is-active` / `active`）
- **フォーム**: `nui-form` `nui-field` `nui-input` `nui-help-text` `nui-toggle` `nui-toggle-input` `nui-toggle-track` `nui-toggle-thumb` `nui-toggle-label`
- **ボタン**: `nui-button` `nui-button-secondary` `nui-button-danger`
- **表示**: `nui-badge`（`nui-badge-accent` / `nui-badge-danger`） `nui-avatar` `nui-icon` `nui-heading` `nui-empty-text` `nui-link` `nui-stat`
- **テーブル・モーダル**: `nui-table-wrap` `nui-table` `nui-modal-backdrop` `nui-modal` `nui-modal-title` `nui-modal-body`
- **ルート**: `nui-root`（`createApp` が自動で付けます。CSS だけ使う場合も base スタイルを使うなら付けてください）

### テーマ
色と角丸は CSS 変数か `configure({ theme, accent })` で変更できます。

| 変数 | 用途 | 変数 | 用途 |
| --- | --- | --- | --- |
| `--nui-accent` | アクセント色 | `--nui-danger` | 危険色 |
| `--nui-bg` | 背景 | `--nui-danger-bg` | 危険色の薄い背景 |
| `--nui-surface` | 面 | `--nui-radius` / `--nui-radius-sm` | 角丸 |
| `--nui-border` | 枠線 | `--nui-font` | フォント |
| `--nui-text` | 文字 | `--nui-shadow` | 影 |
| `--nui-muted` | 補助文字 | | |

`<html data-nui-theme="light|dark|auto">` で切り替えます。`auto` は OS の設定に従います。

### 翻訳（i18n）
```js
import { addMessages, setLocale, t } from 'nyaitter-ui';

addMessages('ja', { greeting: 'こんにちは、{name}さん', menu: { home: 'ホーム' } });
addMessages('en', { greeting: 'Hello, {name}!', menu: { home: 'Home' } });
setLocale('en');
t('greeting', { name: 'Nyaitter' }); // Hello, Nyaitter!
```

キーはドット区切り、`{name}` は第 2 引数で置換します。見つからない場合は基本言語（`en-US` → `en`）→ `fallbackLocale`（既定 `ja`）→ キーの順で解決します。`setLocale()` は `t()` を使うコンポーネントを描き直します。

### コンポーネント
JavaScript から組み立てる場合に使います。

```js
import { h, ref, defineComponent, createApp, components } from 'nyaitter-ui';

const App = defineComponent({
  setup: () => ({ count: ref(0) }),
  render: ({ count }) => h('div', { class: 'nui-card' },
    h(components.Button, { onClick: () => count.value++ }, `クリック ${count.value}`)),
});
createApp(App).mount(document.getElementById('app'));
```

`components` には `Button`、`Input`、`Card`、`Toggle`、`Tabs`、`Modal` があります。

### 設定
```js
configure({
  theme: 'auto', accent: '#ff9900', locale: 'ja', fallbackLocale: 'ja',
  messages: { ja: { hello: 'やあ' } }, features: { exampleFeature: false }, styleUrl: '',
});
```

設定が無くても既定値で動きます。クライアント側で取得した設定を `configure()` に渡してください。

### 公開 API
`import { ... } from 'nyaitter-ui'` と `globalThis.NyaitterUI` から使えます。

| API | 説明 |
| --- | --- |
| `h(type, props, ...children)` / `Fragment` | 仮想ノードを作る |
| `render(vnode, container)` | その場に描画する |
| `defineComponent(options)` / `createApp(component, props?)` | 部品の定義 / アプリの `mount`・`unmount` |
| `ref` / `computed` / `effect` / `watch` | リアクティブな値 |
| `t(key, params?)` / `useI18n()` | 翻訳する |
| `setLocale` / `getLocale` / `addMessages` / `setMessages` / `translateNodes` | 言語の切り替え、翻訳の登録 |
| `configure` / `getConfig` / `resetConfig` | 設定の上書き・取得・初期化 |
| `enhance(root?)` / `upgradeElement(el)` / `classForKind(kind)` | `data-nui` の変換、種類に対応するクラス名の取得 |
| `start(root?)` / `stop()` / `injectStyles(url?)` | 自動変換の開始・停止 / CSS の読み込み |
| `components` / `name` / `version` / `description` / `repository` | 付属コンポーネント / パッケージ情報 |

## 開発
```bash
npm install
npm run build
```

`dist/` に `index.js`（ESM）、`index.cjs`（CJS）、`nyaitter-ui.js`（ブラウザ用、`NyaitterUI`）、`nyaitter-ui.css` ができます。

## 公開
GitHub Actions は、GitHub Release の公開・ワークフローの手動実行・`package.json` の変更を `main` に push したときに動きます。バージョンが変わっていない場合、または同じバージョンが npm に公開済みの場合はスキップされます。公開前に `package.json` のバージョンを更新してください。

初回だけ、npm の Trusted Publisher に GitHub リポジトリと `.github/workflows/publish.yml` を登録します。npm トークンを GitHub に登録する必要はありません。

## ライセンス
MIT License

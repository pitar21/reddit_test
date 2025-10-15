# Reddit Web Game Starter (Devvit Web 埋め込み用)
サーバー不要。Redditの「投稿パーマリンク.json」を読み、コメントに含まれるキーワードでスコアリングします。

## 使い方（ローカル）
- `index.html` をブラウザで開いて、対象スレッドのパーマリンクを入力 → 集計

## デプロイ（静的）
- GitHub Pages / Netlify / Cloudflare Pages などに `index.html`, `main.js`, `style.css` を配置

## Devvit Web への埋め込み
- Devvit Webからこの `index.html` の公開URLを埋め込む
- 埋め込み先URLに `?permalink=<スレのパーマリンク>` を付与すると自動入力
  - 例: `https://your.pages.dev/index.html?permalink=https://www.reddit.com/r/xxxxx/comments/abcdef/title/`

## ルール変更
- ルールは `main.js` 冒頭の `RULES` を編集（正規表現と加点）

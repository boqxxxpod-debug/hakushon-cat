# ハクション・キャット

くしゃみの風で箱を動かし、反動でネコ自身をクッションまで運ぶ、スマートフォン向け物理パズルゲームです。

- 公開版: <https://boqxxxpod-debug.github.io/hakushon-cat/>
- リポジトリ: <https://github.com/boqxxxpod-debug/hakushon-cat>

## 開発

Node.js 22.13 以上を使用します。

```bash
npm ci
npm run dev
```

変更を提出する前に、次の検証をすべて通してください。

```bash
npm test
npm run build
```

## Issue 駆動の運用

開発は GitHub Issue を起点にします。`codex` ラベル付き Issue 1件につき `codex/issue-<番号>-<概要>` ブランチと Pull Request 1件を作成し、PR 本文に `Closes #<番号>` を記載します。

CI、競合、変更範囲、レビュー条件を確認できた安全な変更だけを自動マージします。`main` への反映後、GitHub Actions が `dist/` を GitHub Pages へ公開します。詳しい安全規則は [AGENTS.md](./AGENTS.md) と [STATE.md](./STATE.md) を参照してください。

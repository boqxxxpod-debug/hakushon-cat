# ハクション・キャット開発ルール

## プロジェクト

- React + TypeScript + Vite の静的 Canvas ゲームです。バックエンドはありません。
- スマートフォンを優先し、Android 9 世代でも動く出力を維持します。
- 正式公開先は GitHub Pages です。アセット参照は `import.meta.env.BASE_URL` または相対パスを使います。
- コア仕様は「くしゃみの風で物体を押し、ネコは反動で逆方向へ動く」です。明示的な Issue がない限り、この操作原理を変更しません。

## 作業開始前

1. このファイル、`STATE.md`、対象 Issue、automation-control Issue を読む。
2. 対象は open かつ `codex` ラベル付き Issue だけとする。
3. Issue が曖昧、競合、依存関係、権限不足、外部障害がある場合は停止し、automation-control Issue に理由を残す。

## 1 Issue = 1 PR

- 1件の Issue に対して、`codex/issue-<番号>-<短い概要>` ブランチと PR を1件だけ作る。
- PR 本文に `Closes #<番号>` を記載し、`codex` ラベルを付ける。
- 同時に進行する製品 Issue / PR は1件までとする。
- Issue は PR が `main` にマージされたことを確認してから閉じる。

## 必須検証

各変更で次を実行する。

```bash
npm ci
npm test
npm run build
```

加えて、Issue の受け入れ条件に対応するテストを追加または更新する。テストの削除、スキップ、期待値の弱体化で CI を通してはいけない。

## 自動マージできない変更

以下は安全な製品変更として扱わず、`manual-review` ラベルを付けて停止する。

- `.github/**`、`AGENTS.md`、`STATE.md`、`CODEOWNERS`
- `package.json`、`package-lock.json`、`tsconfig*.json`、`vite.config.*`、ビルド・配布設定
- 依存関係、セキュリティ、認証、secret、権限、GitHub リポジトリ設定
- 大規模なデータ消去、履歴改変、テスト回避

上記の変更は Issue に明記されていても人のレビューが必要で、自動マージしない。

## 自動マージ条件

安全な変更は、次をすべて満たす場合だけ squash merge できる。

- PR が draft ではなく、同一リポジトリの `codex/*` ブランチから作成されている
- 対象 Issue が open かつ `codex` ラベル付きで、PR に `Closes #...` がある
- `manual-review` ラベルがない
- 必須 CI が PR の正確な head SHA で成功している
- mergeable で競合がなく、要求されたレビューやチェックが残っていない
- 上記の保護対象ファイルを変更していない

条件を確認できないときは推測で進めず停止する。

## 上限

automation-control Issue に記録された自動マージ成功数が10件に達したら、自動開発を停止して人の確認を待つ。

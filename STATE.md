# Autonomous Development State

- State: `enabled`
- Bootstrap issue: `#1` (`[bootstrap] GitHub PagesとIssue駆動開発基盤を構築`)
- Control issue: `#3` (`[automation-control] Autonomous development loop`)
- Active issue: `none`
- Successful product merges: `0 / 10`
- Queue policy: open かつ `codex` ラベル付き Issue を番号の小さい順に1件ずつ処理
- Concurrency: 製品 Issue / PR は常に1件まで
- Merge mode: 安全条件を満たす製品変更のみ squash merge
- Stop conditions: CI失敗、競合、曖昧な要件、権限不足、外部障害、保護対象ファイルの変更、10件到達

自動処理は各実行で状態を再取得し、PR の正確な head SHA に対する CI を確認します。Issue は対応 PR が `main` にマージされたことを確認してから閉じます。監査履歴は control issue のコメントに追記します。

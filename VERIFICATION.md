# 検証記録

## 完了

- Nodeテスト8件：シャッフル、ID判定、回答変更ロック、スタミナ再出題、未回答の進行防止、苦手ルール、複合絞り込み、ラーニング。
- 上記8件に含むPGlite/PostgreSQL検証：SQL実行、他ユーザーのRLS分離、親子所有者チェック、保存ロールバック、競合拒否、サーバーでの正誤判定、回答UUIDの重複排除、表示番号の検証、学習閲覧の集計除外、Storage分離、削除時の履歴連動。
- Chromium画面操作：390×844、1024×1366。横はみ出しなし。ラーニングの正解と解説、通常テストの回答ロック、スタミナ2周目、検索。JavaScriptの画面エラーなし。
- 模擬Supabaseで画面操作：問題集／問題の作成、画像、更新、保存失敗時の入力保持、未送信回答の再送。WebMCPの正常／不正入力、読み取り専用属性。

## 実サービスでの確認

Supabaseの専用プロジェクト設定後に、Google OAuthの往復、実Storageの画像保存、実際のiPhone／iPad間同期を確認します。PGliteと模擬通信のテストは実サービスでの確認を代替しません。

2026年9月19日：専用Supabaseの空スキーマ確認後、001_initial.sqlを適用し成功を確認。実Googleログイン・実Storageへの保存はOAuth設定完了後に確認予定。Nodeテスト8件も再実行して成功。

2026年9月20日：ChatGPTログイン要求の原因はSitesの所有者限定アクセス設定と特定。アプリ入口を公開アクセスに変更。Cookie・AuthorizationなしのHTTP取得で200、リダイレクトなし、アプリHTMLを確認。Supabase Auth設定APIはGoogle無効を返すため、Google Cloudのポリシー同意とOAuthクライアント設定は未完了。個人データの実同期完了とは扱わない。

## 2026-09-20: 5-choice and question-book workflow
- Migration 002 applied to dedicated Supabase project successfully. Existing data retained.
- 11 engine/parser/database tests passed, including fifth-choice grading and RLS.
- Photo uploads are separated into question and answer/explanation roles; answer photos only shown after answering.
- OCR backend source is prepared but not deployed/configured. Automatic OCR is disabled in the UI. Manual text splitting is available.
- Actual authenticated device-to-device saves and OCR require further live verification.

- Local browser QA with an isolated in-memory Supabase fixture: book metadata registration; 5-way text splitting; save-and-next advancing to question 2; answer photo upload; answer photo hidden before answering and visible after; correct grading after shuffled display. No production test records created.
- Fixed HTML form named-id collision found by browser QA.

## 2026-09-21: Bulk import
18 automated tests passed including existing engine/database regressions. New parser, mapping, partial failure, retry, lost-response and owner-change tests; imported payload tested against existing SQL/RLS. Browser fixture verified preview/edit/exclude, 2 saved / 1 failed / 1 skipped, retry to 3 saved without duplicates, learning subset, CSV file read, and 390px / 820px layouts. No production test records inserted. Full scope and limitations: IMPORT.md.


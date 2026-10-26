# ヨンスタ — 4択・5択学習

## 使える機能

- Googleログイン／ログアウトとアカウント表示
- Supabaseを正本とする問題・画像・回答履歴の同期
- 問題集作成、問題の登録・編集・削除、画像だけの問題文、複数画像と拡大表示
- 大分類／ジャンル候補、頻出A〜C、難易度1〜5、形式、タグ
- ラーニング、通常テスト、スタミナ。選択肢の固有UUIDによるシャッフル・正誤判定
- 出題条件の組み合わせ、10／15／20／全問、苦手問題抽出
- 回答履歴、正答率、連続正解、最終回答日時、学習済み
- 端末内の一時下書き、未送信回答の再送、更新競合の検出
- オリジナルのサンプル8問（図あり1問）
- iPhone／iPad向け画面、ホーム画面追加用manifest・アイコン

## 初期設定

Supabaseの管理先は **super.soumuman**。既存HanaTalkのプロジェクト／テーブルには適用せず、専用の `yonstudy` プロジェクトを使います。

設定状況（2026年9月20日）：専用プロジェクト `fceijivvdssqhqxoyqyd` へのSQL適用と `dist/config.js` の接続設定は完了。Googleプロバイダー設定済みです。実アカウントでの端末間同期は要確認です。以下は再構築時の手順です。

1. SupabaseのSQL Editorで `supabase/001_initial.sql` を実行します（専用の空プロジェクト向け、一度だけ）。続けて `supabase/002_five_choices_books.sql` を実行します。
2. Google CloudのOAuthクライアントを設定し、SupabaseのAuthentication → Sign In / Providers → GoogleへクライアントIDとシークレットを設定します。
3. Google側の承認済みリダイレクトURIに `https://<PROJECT_REF>.supabase.co/auth/v1/callback` を登録します。
4. SupabaseのAuthentication → URL Configurationで、Site URLを公開したアプリのURLに設定し、Redirect URLsにも同じURL（末尾 `/`）を追加します。ローカル確認をする場合は `http://127.0.0.1:4317/` も追加します。
5. アプリの `dist/config.js` にProject URLとpublishable keyを指定します。設定画面で端末ごとに入力することもできます。service_role／secret key／Google client secretをフロント側へ入れないでください。
6. 同じGoogleアカウントで両端末からログインします。

参考：[Supabase Google認証公式手順](https://supabase.com/docs/guides/auth/social-login/auth-google)、[Storageのアクセス制御](https://supabase.com/docs/guides/storage/security/access-control)。

## iPhone・iPadでの確認

1. iPadのSafariでアプリを開き、Googleログイン。
2. 問題登録で問題集・4択・正解・画像・解説を入力し「クラウドに保存」。
3. iPhoneで同じURLとGoogleアカウントを使い、問題一覧から同じ問題を確認。
4. 通常テストで一度回答し、回答ボタンが変更できないことを確認。
5. iPadで学習履歴を開き「再取得」。回答日時・正誤が反映されることを確認。
6. スタミナでわざと間違え、次の周が誤答だけになることを確認。
7. Safariの共有メニューから「ホーム画面に追加」。追加後のアプリでも同じGoogleアカウントでログイン。

## 保存と同期

起動／ログイン／画面再表示／オンライン復帰／問題保存／学習終了時に取得し直します。回答は一問ごとに送信し、送信失敗分だけIndexedDBへ一時保管します。設定画面からも再送できます。同じ回答UUIDの再送はDBで重複排除します。学習履歴の正本はSupabaseです。

問題保存はRPCの1トランザクション。画像アップロード後にDBへ登録します。通信不良時に保存済みか不明な場合も下書きを残し、revisionで古い問題の上書きを防ぎます。競合時は下書きを残して一覧の新しい問題と見比べてください。ブラウザーのサイトデータ削除・プライベート閲覧終了は端末内の下書きや未送信履歴を消すため、先にクラウドへ保存してください。

苦手判定：未回答は除外。正答率50％以下、または直近3回答のうち2回以上不正解。ラーニングの閲覧は正答率に含めません。再挑戦回数は「初回問題数を超えた回答数」です。

## ファイル

新規プロジェクトです。既存プロジェクトの変更はありません。

|ファイル|役割|
|---|---|
|dist/index.html / style.css|画面の土台・レスポンシブデザイン|
|dist/app.js|画面、フォーム、認証、学習フロー|
|dist/engine.js|シャッフル、スタミナ、苦手判定|
|dist/repository.js|Supabase通信・端末内の一時保存|
|dist/config.js|公開接続情報|
|dist/supabase.js|固定バージョンの公式SDKバンドル|
|dist/samples.js / sample-rectangle.svg|オリジナルサンプル|
|dist/manifest.webmanifest / icon*|ホーム画面追加|
|supabase/001_initial.sql / DESIGN.md|DB・RLS・Storage・設計|
|tests/*.test.js|学習ロジック、DB権限と整合性の検証|
|build.mjs / serve.mjs / package*.json|SDKビルド・ローカル起動・依存関係|
|.openai/hosting.json|Sitesの配布先設定|

## ローカル起動・検証

Node.js 22以上でプロジェクトのディレクトリから実行：

```sh
npm ci
npm run build
npm test
npm run dev
```

`http://127.0.0.1:4317/` を開きます。配布用ファイルはdistに揃っているため、そのまま静的HTTPSホスティングでも動作します。

## 今回実装しない機能

OCR、AI、課金、問題集販売、他ユーザーへの公開、音声・動画、英語会話AI、高度なオフライン編集、メモの装飾。PWAのオフラインキャッシュ用Service Workerも未実装です。

## 既知の制約

- 初回MVPは全問題・全履歴をページング取得して画面側で絞り込みます。数万件規模ではサーバー絞り込みへの変更が必要です。
- 画像のアップロード成功後に問題保存や画像削除が失敗すると、非公開Storageに未参照画像が残る場合があります。問題データは消しません。
- 画像はJPEG／PNG／WebP／GIF、1枚10MB以下。HEICは写真アプリなどでJPEGへ変換してください。
- 競合は検出しますが、自動マージはしません。
- ラーニングの同じ問題の往復閲覧は1セッション1回の閲覧履歴として保存します。
- アプリの入口はログイン不要です。問題・画像・履歴・メモの保存と取得にはSupabase AuthのGoogleログインを使い、ユーザー別RLSと非公開Storageで分離します。ChatGPT/OpenAIログインは使いません。



## 問題作成の流れ

1. 問題集管理でタイトル・年・回・ジャンル・予定問題数・4択/5択を登録。
2. 問題集を選択して問題作成。問題写真と解答/解説写真を複数枚追加。
3. テキストを手入力、または読み取りテキスト欄から問題・選択肢・解答・解説へ振り分け。
4. 正解と内容を確認し「登録して次の問題へ」。同じ問題集の次番号を開きます。

自動写真OCRは未接続のため無効です。バックエンドの準備ソースと設定手順は supabase/OCR_SETUP.md を参照。OpenAIキーは配布ファイルへ入れません。

## 一括インポート
問題一覧・問題集管理からCSVまたは構造化テキストを取り込めます。プレビュー修正・除外・登録結果・再試行に対応。4択/5択可。詳しい仕様と確認結果は [IMPORT.md](IMPORT.md) を参照してください。


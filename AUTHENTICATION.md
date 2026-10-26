# 認証の分離

## 現在の構成

- 配布：Sites。2026年9月20日に入口の所有者限定制限を解除。URLからアプリ画面を開く際のChatGPT/OpenAIログインは不要。
- ユーザー認証：Supabase Auth + Google OAuth（PKCE）。dist/app.jsのinitAuthとsignInWithOAuthで実装。
- 共通ユーザーID：Supabase auth.uid()。iPadとiPhoneで同じGoogleアカウントにログインすると同じユーザーのクラウドデータを取得。
- データ：問題、選択肢、メモ、画像情報、回答履歴はユーザー別RLS。画像本体は非公開StorageとユーザーIDごとのパス。未ログイン利用者はオリジナルサンプルのみ。
- Google Cloud OAuthクライアントとSupabase Googleプロバイダーは設定済み。実アカウントで保存・再読み込み・端末間同期の確認が必要。

## 将来のAI機能

OpenAI APIを追加するときもログインはGoogle / Supabase Authのまま維持する。バックエンドでSupabase JWTと対象データの所有権を確認してからOpenAI APIを呼ぶ。OpenAI APIキーはバックエンドの秘密設定だけに保存し、フロントエンドへ配布しない。OCRバックエンドの準備ソースはあるが未配備・APIキー未設定。OpenAIをユーザー認証に使用しない。

## HanaTalk

参照可能なワークスペース検索でHanaTalkのソースは見つからず、参照・変更していない。

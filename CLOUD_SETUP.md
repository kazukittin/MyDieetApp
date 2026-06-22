# Supabaseで複数ユーザー対応を有効にする

このアプリはSupabase Authでユーザーを識別し、Row Level Security（RLS）で本人のデータだけを読み書きします。

## 1. テーブルとRLSを作成

SupabaseのSQL Editorで `SUPABASE_SETUP.sql` を実行します。

旧 `diet_app_sync` テーブルは新しいアプリから使われません。必要なデータを移行し終えるまでは削除せず、移行後に削除してください。

## 2. メール認証を設定

Supabase DashboardのAuthenticationでEmail認証を有効にします。

- 本番運用では「Confirm email」を有効にする
- URL ConfigurationのSite URLに公開先URLを設定する
- Redirect URLsにも公開先URLを追加する

## 3. アプリへ接続情報を設定

`config.js` にSupabaseのProject URLとPublishable keyを設定します。

```js
window.MY_DIET_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "sb_publishable_...",
  authRedirectUrl: "https://YOUR_PUBLIC_APP_URL/",
};
```

Publishable keyはブラウザで使う公開用キーです。`service_role`キーは絶対に設定しないでください。

`authRedirectUrl`には、利用者が実際にアプリを開く公開URLを設定します。空欄の場合は、新規登録時にブラウザで開いていたURLを使用します。

Supabase Dashboardの **Authentication → URL Configuration** でも次のように設定してください。

- Site URL: `https://YOUR_PUBLIC_APP_URL/`
- Redirect URLs: `https://YOUR_PUBLIC_APP_URL/`

GitHub Pagesでサブディレクトリを使う場合は、リポジトリ名まで含む正確なURLを設定します。例: `https://username.github.io/MyDieetApp/`

設定変更前に送信済みの確認メールには古いURLが残ります。古いリンクではなく、設定後に送った確認メールを使用してください。古いリンクをクリックした時点でメール確認だけ完了している場合もあるため、先に通常ログインを試しても構いません。

## 4. 公開

次のファイルを同じ場所へ公開します。

- `index.html`
- `styles.css`
- `app.js`
- `config.js`

利用者はログイン画面から各自のメールアドレスで登録します。ログイン後のデータはユーザーID別に分離され、端末内キャッシュも別々に保存されます。

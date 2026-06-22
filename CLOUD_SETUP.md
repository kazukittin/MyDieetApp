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
};
```

Publishable keyはブラウザで使う公開用キーです。`service_role`キーは絶対に設定しないでください。

## 4. 公開

次のファイルを同じ場所へ公開します。

- `index.html`
- `styles.css`
- `app.js`
- `config.js`

利用者はログイン画面から各自のメールアドレスで登録します。ログイン後のデータはユーザーID別に分離され、端末内キャッシュも別々に保存されます。

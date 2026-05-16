# PCを開きっぱなしにしない同期

PCを閉じてもスマホとPCで同じデータを見るには、アプリ本体を公開ページに置き、記録データをSupabaseに保存します。
記録データはアプリ側で暗号化してから保存します。

## 1. Supabaseで保存場所を作る

Supabaseで新しいプロジェクトを作り、SQL Editorで次を実行します。

```sql
create table public.diet_app_sync (
  id text primary key,
  encrypted_payload text not null,
  updated_at timestamptz not null default now()
);

alter table public.diet_app_sync enable row level security;

create policy "Anyone can read encrypted diet sync rows"
on public.diet_app_sync
for select
to anon
using (true);

create policy "Anyone can create encrypted diet sync rows"
on public.diet_app_sync
for insert
to anon
with check (true);

create policy "Anyone can update encrypted diet sync rows"
on public.diet_app_sync
for update
to anon
using (true)
with check (true);
```

Project SettingsのAPI画面から、次の2つを控えます。

- Project URL
- Publishable key

## 2. アプリをネット上に置く

GitHub Pagesなどの静的サイト hosting に、このフォルダの次のファイルを置きます。

- `index.html`
- `styles.css`
- `app.js`

`server.js` と `start-app.bat` は、家の中だけで使うローカル同期用なので、クラウド版には不要です。

## 3. アプリで同期設定を入れる

公開したアプリをPCとスマホで開き、クラウド同期欄に同じ内容を入れます。

- Supabase URL: SupabaseのProject URL
- Anon key: SupabaseのPublishable key。`sb_publishable_...` で始まるキー
- 同期ID: 好きな名前。例 `my-diet-note`
- 同期パスワード: 長めの自分だけの言葉

同期パスワードを変えると、前のデータは読めません。
スマホとPCでは必ず同じ同期IDと同期パスワードを使います。

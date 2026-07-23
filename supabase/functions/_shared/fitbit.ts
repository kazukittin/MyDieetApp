import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export async function requireUser(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) throw new Error("認証が必要です。");
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } },
  );
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("ログイン情報を確認できません。");
  return data.user;
}

export function googleHealthRedirectUri() {
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/fitbit-callback`;
}

export async function exchangeGoogleHealthToken(params: URLSearchParams) {
  const clientId = Deno.env.get("GOOGLE_HEALTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_HEALTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Google Healthの認証情報が未設定です。");
  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const payload = await response.json();
  if (!response.ok) {
    const code = String(payload?.error || "token_exchange_failed");
    const description = String(payload?.error_description || "Google Health認証に失敗しました。");
    throw new Error(`${code}: ${description}`);
  }
  return payload;
}

export function tokenExpiry(expiresIn: number) {
  return new Date(Date.now() + Number(expiresIn || 0) * 1000).toISOString();
}

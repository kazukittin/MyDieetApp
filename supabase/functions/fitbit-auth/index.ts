import { adminClient, corsHeaders, googleHealthRedirectUri, json, requireUser } from "../_shared/fitbit.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const configuredReturnUrl = Deno.env.get("GOOGLE_HEALTH_APP_URL");
    if (!configuredReturnUrl) return json({ error: "アプリの戻り先URLが未設定です。" }, 500);
    const returnUrl = configuredReturnUrl;
    if (!returnUrl.startsWith("https://") && !returnUrl.startsWith("http://localhost")) {
      return json({ error: "戻り先URLが不正です。" }, 400);
    }

    const state = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    const admin = adminClient();
    await admin.from("google_health_oauth_states").delete().eq("user_id", user.id);
    const { error } = await admin.from("google_health_oauth_states").insert({
      state,
      user_id: user.id,
      return_url: returnUrl,
    });
    if (error) throw error;

    const query = new URLSearchParams({
      response_type: "code",
      client_id: Deno.env.get("GOOGLE_HEALTH_CLIENT_ID") || "",
      redirect_uri: googleHealthRedirectUri(),
      scope: "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state,
    });
    return json({ authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${query}` });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Google Health連携を開始できませんでした。" }, 401);
  }
});

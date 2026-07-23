import { adminClient, exchangeGoogleHealthToken, googleHealthRedirectUri, tokenExpiry } from "../_shared/fitbit.ts";

function redirect(url: string, result: string, errorCode = "") {
  const target = new URL(url);
  target.searchParams.set("fitbit", result);
  if (errorCode) target.searchParams.set("fitbit_error", errorCode);
  return Response.redirect(target.toString(), 302);
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const state = url.searchParams.get("state") || "";
  const admin = adminClient();
  const { data: pending } = await admin
    .from("google_health_oauth_states")
    .select("user_id,return_url,expires_at")
    .eq("state", state)
    .maybeSingle();

  if (!pending || new Date(pending.expires_at) < new Date()) {
    return new Response("Google Health連携の有効期限が切れました。アプリからやり直してください。", { status: 400 });
  }
  await admin.from("google_health_oauth_states").delete().eq("state", state);
  if (url.searchParams.get("error")) return redirect(pending.return_url, "cancelled");

  try {
    const token = await exchangeGoogleHealthToken(new URLSearchParams({
      grant_type: "authorization_code",
      code: url.searchParams.get("code") || "",
      redirect_uri: googleHealthRedirectUri(),
    }));
    if (!token.refresh_token) throw new Error("Refresh token was not returned.");
    const { error } = await admin.from("google_health_connections").upsert({
      user_id: pending.user_id,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: tokenExpiry(token.expires_in),
      scope: token.scope || "activity",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) throw error;
    return redirect(pending.return_url, "connected");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Google Health OAuth callback failed:", message);
    const errorCode = message.includes("Refresh token")
      ? "missing_refresh_token"
      : message.includes("invalid_client")
        ? "invalid_client"
      : message.includes("invalid_grant")
          ? "invalid_grant"
          : message.includes("google_health_connections")
            ? "storage_failed"
          : "callback_failed";
    return redirect(pending.return_url, "error", errorCode);
  }
});

import { adminClient, corsHeaders, exchangeGoogleHealthToken, json, requireUser, tokenExpiry } from "../_shared/fitbit.ts";

async function getConnection(userId: string) {
  const admin = adminClient();
  const { data, error } = await admin.from("google_health_connections").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

async function validAccessToken(connection: Record<string, unknown>) {
  if (new Date(String(connection.expires_at)).getTime() > Date.now() + 60_000) {
    return String(connection.access_token);
  }
  const admin = adminClient();
  let token;
  try {
    token = await exchangeGoogleHealthToken(new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: String(connection.refresh_token),
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("invalid_grant")) {
      // An expired/revoked refresh token cannot recover. Remove the stale
      // connection so the app can immediately offer OAuth reconnection.
      await admin.from("google_health_connections").delete().eq("user_id", connection.user_id);
      throw new Error("Google Healthの認証期限が切れました。もう一度連携してください。");
    }
    throw error;
  }
  const { error } = await admin.from("google_health_connections").update({
    access_token: token.access_token,
    refresh_token: token.refresh_token || connection.refresh_token,
    expires_at: tokenExpiry(token.expires_in),
    updated_at: new Date().toISOString(),
  }).eq("user_id", connection.user_id);
  if (error) throw error;
  return String(token.access_token);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "status");
    const admin = adminClient();
    const connection = await getConnection(user.id);

    if (action === "status") {
      return json({
        connected: Boolean(connection),
        lastSyncedAt: connection?.last_synced_at || null,
      });
    }
    if (action === "disconnect") {
      if (connection) {
        const token = await validAccessToken(connection);
        await fetch("https://oauth2.googleapis.com/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ token }),
        }).catch(() => {});
      }
      await admin.from("google_health_connections").delete().eq("user_id", user.id);
      return json({ connected: false });
    }
    if (action !== "sync") return json({ error: "未対応の操作です。" }, 400);
    if (!connection) return json({ error: "Fitbitが未連携です。" }, 409);

    // Google Health dailyRollUp accepts at most 90 days and requires a
    // closed-open civil-time range aligned to whole-day windows.
    const days = Math.min(90, Math.max(1, Number(body.days || 30)));
    const requestedEndDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.endDate || ""))
      ? String(body.endDate)
      : new Date().toISOString().slice(0, 10);
    const end = new Date(`${requestedEndDate}T00:00:00Z`);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    const endExclusive = new Date(end);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    const token = await validAccessToken(connection);
    const civil = (date: Date) => ({
      date: { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() },
      time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 },
    });
    const response = await fetch("https://health.googleapis.com/v4/users/me/dataTypes/steps/dataPoints:dailyRollUp", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range: { start: civil(start), end: civil(endExclusive) },
        windowSizeDays: 1,
      }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || "Google Health歩数を取得できませんでした。");
    const steps = (payload.rollupDataPoints || []).map((item: {
      civilStartTime?: { date?: { year?: number; month?: number; day?: number } };
      steps?: { countSum?: string };
    }) => {
      const date = item.civilStartTime?.date || {};
      return {
        date: `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`,
        steps: Number(item.steps?.countSum) || 0,
      };
    });
    const syncedAt = new Date().toISOString();
    await admin.from("google_health_connections").update({ last_synced_at: syncedAt, updated_at: syncedAt }).eq("user_id", user.id);
    return json({ connected: true, lastSyncedAt: syncedAt, steps });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Fitbitとの通信に失敗しました。" }, 400);
  }
});

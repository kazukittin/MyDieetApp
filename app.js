const storageKey = "my-diet-notebook:v1";
const today = new Date();
const isoToday = toIsoDate(today);

const form = document.querySelector("#entry-form");
const dateInput = document.querySelector("#entry-date");
const clearTodayButton = document.querySelector("#clear-today");
const exportButton = document.querySelector("#export-data");
const syncStatus = document.querySelector("#sync-status");
const cloudForm = document.querySelector("#cloud-form");
const syncNowButton = document.querySelector("#sync-now");
const canUseServerSync = isPrivateHost(location.hostname);
const cloudStorageKey = "my-diet-notebook:cloud:v1";
const cloudTable = "diet_app_sync";

let entries = loadEntries();
let cloudConfig = loadCloudConfig();

dateInput.value = isoToday;
document.querySelector("#today-label").textContent = formatDateLabel(isoToday);
syncStatus.textContent = canUseServerSync ? "共有保存" : "端末保存";
fillCloudForm();
syncFromServer();
syncFromCloud();

window.addEventListener("focus", syncFromServer);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    syncFromServer();
    syncFromCloud();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const date = formData.get("date");
  const entry = {
    date,
    weight: numberOrNull(formData.get("weight")),
    sleep: numberOrNull(formData.get("sleep")),
    meal: Number(formData.get("meal") || 2),
    habits: formData.getAll("habits"),
    mood: formData.get("mood"),
    note: String(formData.get("note") || "").trim(),
    updatedAt: new Date().toISOString(),
  };

  entries = entries.filter((item) => item.date !== date);
  entries.push(entry);
  entries.sort((a, b) => b.date.localeCompare(a.date));
  saveEntries();
  render();
});

dateInput.addEventListener("change", () => {
  fillFormForDate(dateInput.value);
});

clearTodayButton.addEventListener("click", () => {
  const date = dateInput.value || isoToday;
  entries = entries.filter((item) => item.date !== date);
  saveEntries();
  form.reset();
  dateInput.value = date;
  document.querySelector('input[name="meal"][value="3"]').checked = true;
  render();
});

exportButton.addEventListener("click", () => {
  const text = JSON.stringify(entries, null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `my-diet-notebook-${isoToday}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

cloudForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(cloudForm);
  cloudConfig = {
    url: String(formData.get("cloudUrl") || "").trim().replace(/\/$/, ""),
    key: String(formData.get("cloudKey") || "").trim(),
    id: String(formData.get("cloudId") || "").trim(),
    password: String(formData.get("cloudPassword") || ""),
  };
  localStorage.setItem(cloudStorageKey, JSON.stringify(cloudConfig));
  syncFromCloud({ pushWhenEmpty: true });
});

syncNowButton.addEventListener("click", () => {
  syncFromCloud({ pushWhenEmpty: true });
});

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(storageKey, JSON.stringify(entries));
  if (canUseServerSync) {
    pushEntriesToServer();
  }
  if (hasCloudConfig()) {
    pushEntriesToCloud().catch(() => {
      syncStatus.textContent = "同期エラー";
      document.querySelector("#daily-message").textContent = "端末内に保存中";
    });
  }
}

function loadCloudConfig() {
  try {
    return JSON.parse(localStorage.getItem(cloudStorageKey)) || {};
  } catch {
    return {};
  }
}

function fillCloudForm() {
  document.querySelector("#cloud-url").value = cloudConfig.url || "";
  document.querySelector("#cloud-key").value = cloudConfig.key || "";
  document.querySelector("#cloud-id").value = cloudConfig.id || "";
  document.querySelector("#cloud-password").value = cloudConfig.password || "";
  if (hasCloudConfig()) syncStatus.textContent = "クラウド同期";
}

function hasCloudConfig() {
  return Boolean(cloudConfig.url && cloudConfig.key && cloudConfig.id && cloudConfig.password);
}

async function syncFromServer() {
  if (!canUseServerSync) {
    render();
    return;
  }

  try {
    const response = await fetch("/api/entries", { cache: "no-store" });
    if (!response.ok) throw new Error("Sync failed");
    const serverEntries = await response.json();
    if (Array.isArray(serverEntries)) {
      entries = mergeEntries(entries, serverEntries);
      entries.sort((a, b) => b.date.localeCompare(a.date));
      localStorage.setItem(storageKey, JSON.stringify(entries));
      if (entries.length !== serverEntries.length) saveEntries();
      syncStatus.textContent = "共有保存";
    }
  } catch {
    syncStatus.textContent = "端末保存";
    document.querySelector("#daily-message").textContent = "端末内に保存中";
  }

  render();
}

async function pushEntriesToServer() {
  try {
    const response = await fetch("/api/entries", { cache: "no-store" });
    const serverEntries = response.ok ? await response.json() : [];
    entries = mergeEntries(entries, Array.isArray(serverEntries) ? serverEntries : []);
    entries.sort((a, b) => b.date.localeCompare(a.date));

    const saveResponse = await fetch("/api/entries", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entries),
    });

    if (!saveResponse.ok) throw new Error("Save failed");
    syncStatus.textContent = "共有保存";
  } catch {
    syncStatus.textContent = "端末保存";
    document.querySelector("#daily-message").textContent = "端末内に保存中";
  }
}

function mergeEntries(localEntries, serverEntries) {
  const byDate = new Map();
  [...serverEntries, ...localEntries].forEach((entry) => {
    const current = byDate.get(entry.date);
    if (!current || new Date(entry.updatedAt || 0) > new Date(current.updatedAt || 0)) {
      byDate.set(entry.date, entry);
    }
  });
  return Array.from(byDate.values());
}

async function syncFromCloud(options = {}) {
  if (!hasCloudConfig()) return;

  try {
    const cloudEntry = await fetchCloudEntry();
    if (!cloudEntry) {
      if (options.pushWhenEmpty || entries.length) await pushEntriesToCloud();
      syncStatus.textContent = "クラウド同期";
      return;
    }

    const cloudEntries = await decryptEntries(cloudEntry.encrypted_payload);
    entries = mergeEntries(entries, Array.isArray(cloudEntries) ? cloudEntries : []);
    entries.sort((a, b) => b.date.localeCompare(a.date));
    localStorage.setItem(storageKey, JSON.stringify(entries));
    await pushEntriesToCloud();
    syncStatus.textContent = "クラウド同期";
    render();
  } catch {
    syncStatus.textContent = "同期エラー";
    document.querySelector("#daily-message").textContent = "端末内に保存中";
  }
}

async function pushEntriesToCloud() {
  if (!hasCloudConfig()) return;

  const encryptedPayload = await encryptEntries(entries);
  const response = await fetch(`${cloudConfig.url}/rest/v1/${cloudTable}?on_conflict=id`, {
    method: "POST",
    headers: cloudHeaders({ prefer: "resolution=merge-duplicates" }),
    body: JSON.stringify({
      id: cloudConfig.id,
      encrypted_payload: encryptedPayload,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) throw new Error("Cloud save failed");
  syncStatus.textContent = "クラウド同期";
}

async function fetchCloudEntry() {
  const response = await fetch(
    `${cloudConfig.url}/rest/v1/${cloudTable}?id=eq.${encodeURIComponent(cloudConfig.id)}&select=id,encrypted_payload,updated_at`,
    { headers: cloudHeaders() },
  );
  if (!response.ok) throw new Error("Cloud load failed");
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : null;
}

function cloudHeaders(extra = {}) {
  return {
    apikey: cloudConfig.key,
    Authorization: `Bearer ${cloudConfig.key}`,
    "Content-Type": "application/json",
    Prefer: extra.prefer || "return=minimal",
  };
}

async function encryptEntries(value) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveCloudKey();
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return `${base64FromBytes(iv)}.${base64FromBytes(new Uint8Array(encrypted))}`;
}

async function decryptEntries(payload) {
  const [ivText, encryptedText] = String(payload || "").split(".");
  if (!ivText || !encryptedText) return [];
  const key = await deriveCloudKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bytesFromBase64(ivText) },
    key,
    bytesFromBase64(encryptedText),
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}

async function deriveCloudKey() {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(cloudConfig.password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(`my-diet-notebook:${cloudConfig.id}`),
      iterations: 150000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function base64FromBytes(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function bytesFromBase64(text) {
  return Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
}

function render() {
  renderSummary();
  renderAdvice();
  renderHistory();
  fillFormForDate(dateInput.value, false);
}

function renderSummary() {
  const latestWithWeight = entries.find((entry) => entry.weight !== null);
  document.querySelector("#current-weight").textContent = latestWithWeight
    ? `${latestWithWeight.weight.toFixed(1)} kg`
    : "-- kg";

  const previousWithWeight = entries
    .filter((entry) => entry.weight !== null && entry.date !== latestWithWeight?.date)
    .at(0);

  document.querySelector("#weight-trend").textContent = getWeightTrend(latestWithWeight, previousWithWeight);

  const weekEntries = getRecentEntries(7);
  const score = weekEntries.length ? Math.round(weekEntries.reduce((sum, entry) => sum + scoreEntry(entry), 0) / weekEntries.length) : null;
  document.querySelector("#weekly-score").textContent = score === null ? "--" : `${score}点`;

  const habitRatio = getHabitRatio(weekEntries);
  document.querySelector("#habit-progress").style.width = `${habitRatio}%`;
  document.querySelector("#habit-progress-label").textContent = `${habitRatio}%`;
  document.querySelector("#streak-count").textContent = `${getStreak()}日`;
  document.querySelector("#daily-message").textContent = getDailyMessage(score);
}

function renderAdvice() {
  const adviceList = document.querySelector("#advice-list");
  const selected = entries.find((entry) => entry.date === dateInput.value);
  const items = buildAdvice(selected);
  adviceList.innerHTML = items
    .map((item) => `<div class="advice-item"><strong>${item.title}</strong><p>${item.body}</p></div>`)
    .join("");
}

function renderHistory() {
  const historyList = document.querySelector("#history-list");
  if (!entries.length) {
    historyList.innerHTML = '<p class="empty">まだ記録がありません。今日の状態をひとつ残してみましょう。</p>';
    return;
  }

  historyList.innerHTML = entries
    .slice(0, 14)
    .map((entry) => {
      const weight = entry.weight === null ? "体重未入力" : `${entry.weight.toFixed(1)}kg`;
      const sleep = entry.sleep === null ? "睡眠未入力" : `${entry.sleep}時間睡眠`;
      const habits = entry.habits.length ? `${entry.habits.length}個の行動` : "行動チェックなし";
      return `
        <article class="history-item">
          <div class="history-date">${formatDateLabel(entry.date)}</div>
          <div class="history-detail">${weight} / ${sleep} / ${habits}</div>
          <div class="score-pill">${scoreEntry(entry)}点</div>
        </article>
      `;
    })
    .join("");
}

function fillFormForDate(date, overwrite = true) {
  const entry = entries.find((item) => item.date === date);
  if (!entry || !overwrite) return;

  form.reset();
  dateInput.value = date;
  document.querySelector("#weight").value = entry.weight ?? "";
  document.querySelector("#sleep").value = entry.sleep ?? "";
  document.querySelector(`input[name="meal"][value="${entry.meal}"]`).checked = true;
  document.querySelector("#mood").value = entry.mood;
  document.querySelector("#note").value = entry.note;
  document.querySelectorAll('input[name="habits"]').forEach((checkbox) => {
    checkbox.checked = entry.habits.includes(checkbox.value);
  });
}

function buildAdvice(entry) {
  if (!entry) {
    return [
      { title: "今日の記録から始める", body: "体重だけでなく、睡眠や食事の整い方も残すと体調の流れが見えます。" },
      { title: "小さく勝つ", body: "水分、たんぱく質、歩くことのどれか一つで十分です。続く量が正解です。" },
    ];
  }

  const advice = [];
  if (entry.sleep !== null && entry.sleep < 6) {
    advice.push({ title: "睡眠を優先", body: "睡眠不足の日は食欲が強くなりやすいので、明日は早めに休む作戦がよさそうです。" });
  }
  if (!entry.habits.includes("protein")) {
    advice.push({ title: "たんぱく質を足す", body: "卵、魚、豆腐、鶏肉、ヨーグルトなどを一品足すと満足感が安定しやすいです。" });
  }
  if (!entry.habits.includes("walk")) {
    advice.push({ title: "軽く動く", body: "長い運動でなくて大丈夫。10分歩くだけでも、明日の自分に効いてきます。" });
  }
  if (entry.mood === "stress" || entry.mood === "hungry") {
    advice.push({ title: "責めない日", body: "ストレスや空腹が強い日は、制限よりも整える日。温かい飲み物や早めの夕食が味方です。" });
  }
  if (!advice.length) {
    advice.push({ title: "いい流れです", body: "食事・睡眠・行動の土台が整っています。この調子で急がず続けましょう。" });
  }
  return advice.slice(0, 3);
}

function scoreEntry(entry) {
  let score = 30;
  score += entry.meal * 12;
  score += Math.min(entry.habits.length, 5) * 7;
  if (entry.sleep !== null) {
    score += entry.sleep >= 7 ? 18 : entry.sleep >= 6 ? 10 : 4;
  }
  if (entry.mood === "good" || entry.mood === "calm") score += 10;
  return Math.min(100, score);
}

function getHabitRatio(weekEntries) {
  if (!weekEntries.length) return 0;
  const done = weekEntries.reduce((sum, entry) => sum + entry.habits.length, 0);
  return Math.round((done / (weekEntries.length * 5)) * 100);
}

function getRecentEntries(days) {
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return entries.filter((entry) => new Date(`${entry.date}T00:00:00`) >= start);
}

function getStreak() {
  const dateSet = new Set(entries.map((entry) => entry.date));
  let count = 0;
  const cursor = new Date(today);
  while (dateSet.has(toIsoDate(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function getWeightTrend(latest, previous) {
  if (!latest) return "記録を始めましょう";
  if (!previous) return `${formatDateLabel(latest.date)}に記録`;
  const diff = latest.weight - previous.weight;
  if (Math.abs(diff) < 0.1) return "前回からほぼ変化なし";
  const sign = diff > 0 ? "+" : "";
  return `前回から${sign}${diff.toFixed(1)}kg`;
}

function getDailyMessage(score) {
  if (score === null) return "焦らず整える";
  if (score >= 85) return "かなりいい流れ";
  if (score >= 70) return "土台が整っている";
  if (score >= 55) return "できたことを見る";
  return "回復を優先";
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && value !== "" ? number : null;
}

function toIsoDate(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00`));
}

function isPrivateHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

render();

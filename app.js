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
const saveCloudConfigButton = document.querySelector("#save-cloud-config");
const cloudFeedback = document.querySelector("#cloud-feedback");
const onboarding = document.querySelector("#onboarding");
const onboardingForm = document.querySelector("#onboarding-form");
const skipOnboardingButton = document.querySelector("#skip-onboarding");
const settingsScreen = document.querySelector("#settings-screen");
const openSettingsButton = document.querySelector("#open-settings");
const closeSettingsButton = document.querySelector("#close-settings");
const profileForm = document.querySelector("#profile-form");
const profileFeedback = document.querySelector("#profile-feedback");
const pageButtons = document.querySelectorAll("[data-page-target]");
const appPages = document.querySelectorAll(".app-page");
const canUseServerSync = isPrivateHost(location.hostname);
const cloudStorageKey = "my-diet-notebook:cloud:v1";
const profileStorageKey = "my-diet-notebook:profile:v1";
const cloudTable = "diet_app_sync";
const foodHabitValues = ["water", "protein", "vegetables", "no_snack", "slow_eating"];
const exerciseHabitValues = ["walk", "stretch", "strength"];

let entries = loadEntries();
let cloudConfig = loadCloudConfig();
let profile = loadProfile();

dateInput.value = isoToday;
if (document.querySelector("#today-label")) {
  document.querySelector("#today-label").textContent = formatDateLabel(isoToday);
}
if (syncStatus) {
  syncStatus.textContent = canUseServerSync ? "共有保存" : "端末保存";
}
fillCloudForm();
fillProfileForm();
showOnboardingIfNeeded();
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
  const scope = event.submitter?.dataset.saveScope || "all";
  const previous = entries.find((item) => item.date === date);
  const entry = {
    date,
    weight: previous?.weight ?? null,
    sleep: previous?.sleep ?? null,
    meal: previous?.meal ?? 2,
    meals: previous?.meals ?? [],
    habits: previous?.habits ?? [],
    mood: previous?.mood ?? "calm",
    note: previous?.note ?? "",
    updatedAt: new Date().toISOString(),
  };

  if (scope === "weight" || scope === "all") {
    entry.weight = numberOrNull(formData.get("weight"));
    entry.sleep = numberOrNull(formData.get("sleep"));
  }

  if (scope === "food" || scope === "all") {
    const selectedHabits = formData.getAll("habits");
    const preservedExercise = entry.habits.filter((habit) => exerciseHabitValues.includes(habit));
    const selectedFood = selectedHabits.filter((habit) => foodHabitValues.includes(habit));
    entry.meal = Number(formData.get("meal") || 2);
    entry.meals = formData.getAll("meals");
    entry.habits = [...new Set([...preservedExercise, ...selectedFood])];
    entry.mood = formData.get("mood");
    entry.note = String(formData.get("note") || "").trim();
  }

  if (scope === "exercise" || scope === "all") {
    const selectedHabits = formData.getAll("habits");
    const preservedFood = entry.habits.filter((habit) => foodHabitValues.includes(habit));
    const selectedExercise = selectedHabits.filter((habit) => exerciseHabitValues.includes(habit));
    entry.habits = [...new Set([...preservedFood, ...selectedExercise])];
  }

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
  setCloudFeedback("loading", "クラウド設定を保存しています...");
  const formData = new FormData(cloudForm);
  cloudConfig = {
    url: normalizeSupabaseUrl(formData.get("cloudUrl")),
    key: String(formData.get("cloudKey") || "").trim(),
    id: String(formData.get("cloudId") || "").trim(),
    password: String(formData.get("cloudPassword") || ""),
  };
  localStorage.setItem(cloudStorageKey, JSON.stringify(cloudConfig));
  withCloudBusy(saveCloudConfigButton, "保存中...", async () => {
    await syncFromCloud({ pushWhenEmpty: true });
    setCloudFeedback("success", "クラウド設定を保存して同期しました。");
  });
});

syncNowButton.addEventListener("click", (event) => {
  event.preventDefault();
  if (!hasCloudConfig()) {
    setCloudFeedback("error", "Supabase URL、キー、同期ID、同期パスワードを入れてください。");
    return;
  }
  setCloudFeedback("loading", "クラウドと同期しています...");
  withCloudBusy(syncNowButton, "同期中...", async () => {
    await syncFromCloud({ pushWhenEmpty: true });
    setCloudFeedback("success", "最新データに同期しました。");
  });
});

openSettingsButton.addEventListener("click", openSettings);
pageButtons.forEach((button) => {
  button.addEventListener("click", () => switchPage(button.dataset.pageTarget));
});
closeSettingsButton.addEventListener("click", closeSettings);
settingsScreen.addEventListener("click", (event) => {
  if (event.target === settingsScreen) closeSettings();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !settingsScreen.hidden) closeSettings();
});

onboardingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(onboardingForm);
  const setupWeight = numberOrNull(formData.get("setupWeight"));
  const setupGoalWeight = numberOrNull(formData.get("setupGoalWeight"));
  const setupHeight = numberOrNull(formData.get("setupHeight"));

  profile = {
    startDate: isoToday,
    startWeight: setupWeight,
    goalWeight: setupGoalWeight,
    height: setupHeight,
    pace: String(formData.get("setupPace") || "steady"),
    note: String(formData.get("setupNote") || "").trim(),
    skipped: false,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(profileStorageKey, JSON.stringify(profile));
  if (setupWeight !== null && !entries.some((entry) => entry.date === isoToday)) {
    entries.push({
      date: isoToday,
      weight: setupWeight,
      sleep: null,
      meal: 3,
      meals: [],
      habits: ["water"],
      mood: "calm",
      note: profile.note,
      updatedAt: new Date().toISOString(),
    });
    entries.sort((a, b) => b.date.localeCompare(a.date));
    saveEntries();
  }

  onboarding.hidden = true;
  fillFormForDate(isoToday);
  render();
});

skipOnboardingButton.addEventListener("click", () => {
  profile = { skipped: true, updatedAt: new Date().toISOString() };
  localStorage.setItem(profileStorageKey, JSON.stringify(profile));
  onboarding.hidden = true;
  render();
});

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(profileForm);
  profile = {
    ...profile,
    startDate: profile.startDate || isoToday,
    startWeight: numberOrNull(formData.get("profileStartWeight")),
    goalWeight: numberOrNull(formData.get("profileGoalWeight")),
    height: numberOrNull(formData.get("profileHeight")),
    pace: String(formData.get("profilePace") || "steady"),
    note: String(formData.get("profileNote") || "").trim(),
    skipped: false,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(profileStorageKey, JSON.stringify(profile));
  setProfileFeedback("success", "初期設定を保存しました。");
  render();
  if (hasCloudConfig()) {
    pushEntriesToCloud().catch((error) => {
      setProfileFeedback("error", getCloudErrorMessage(error));
    });
  }
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
    pushEntriesToCloud().catch((error) => {
      setSyncState("同期エラー", getCloudErrorMessage(error));
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

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(profileStorageKey)) || {};
  } catch {
    return {};
  }
}

function showOnboardingIfNeeded() {
  if (!profile.startWeight && !profile.skipped && !entries.length) {
    onboarding.hidden = false;
  }
}

function fillCloudForm() {
  document.querySelector("#cloud-url").value = cloudConfig.url || "";
  document.querySelector("#cloud-key").value = cloudConfig.key || "";
  document.querySelector("#cloud-id").value = cloudConfig.id || "";
  document.querySelector("#cloud-password").value = cloudConfig.password || "";
  if (hasCloudConfig()) setSyncState("クラウド同期");
}

function fillProfileForm() {
  document.querySelector("#profile-start-weight").value = profile.startWeight ?? "";
  document.querySelector("#profile-goal-weight").value = profile.goalWeight ?? "";
  document.querySelector("#profile-height").value = profile.height ?? "";
  document.querySelector("#profile-pace").value = profile.pace || "steady";
  document.querySelector("#profile-note").value = profile.note || "";
}

function openSettings() {
  fillCloudForm();
  fillProfileForm();
  settingsScreen.hidden = false;
}

function closeSettings() {
  settingsScreen.hidden = true;
}

function switchPage(pageName) {
  appPages.forEach((page) => {
    page.classList.toggle("is-active", page.dataset.page === pageName);
  });
  document.querySelectorAll(".tab-button[data-page-target]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.pageTarget === pageName);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
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
      setSyncState("共有保存");
    }
  } catch {
    setSyncState("端末保存", "端末内に保存中");
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
    setSyncState("共有保存");
  } catch {
    setSyncState("端末保存", "端末内に保存中");
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
    setSyncState("同期中");
    const cloudEntry = await fetchCloudEntry();
    if (!cloudEntry) {
      if (options.pushWhenEmpty || entries.length) await pushEntriesToCloud();
      setSyncState("クラウド同期");
      return;
    }

    const cloudData = await decryptCloudData(cloudEntry.encrypted_payload);
    const cloudEntries = Array.isArray(cloudData) ? cloudData : cloudData.entries;
    entries = mergeEntries(entries, Array.isArray(cloudEntries) ? cloudEntries : []);
    if (!profile.startWeight && cloudData.profile) {
      profile = cloudData.profile;
      localStorage.setItem(profileStorageKey, JSON.stringify(profile));
    }
    entries.sort((a, b) => b.date.localeCompare(a.date));
    localStorage.setItem(storageKey, JSON.stringify(entries));
    await pushEntriesToCloud();
    setSyncState("クラウド同期");
    render();
  } catch (error) {
    const message = getCloudErrorMessage(error);
    setSyncState("同期エラー", message);
    setCloudFeedback("error", message);
    throw error;
  }
}

async function pushEntriesToCloud() {
  if (!hasCloudConfig()) return;

  const encryptedPayload = await encryptCloudData({ entries, profile });
  const response = await fetch(`${cloudConfig.url}/rest/v1/${cloudTable}?on_conflict=id`, {
    method: "POST",
    headers: cloudHeaders({ prefer: "resolution=merge-duplicates" }),
    body: JSON.stringify({
      id: cloudConfig.id,
      encrypted_payload: encryptedPayload,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) throw new Error(await getSupabaseError(response, "Cloud save failed"));
  setSyncState("クラウド同期");
}

async function fetchCloudEntry() {
  const response = await fetch(
    `${cloudConfig.url}/rest/v1/${cloudTable}?id=eq.${encodeURIComponent(cloudConfig.id)}&select=id,encrypted_payload,updated_at`,
    { headers: cloudHeaders() },
  );
  if (!response.ok) throw new Error(await getSupabaseError(response, "Cloud load failed"));
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : null;
}

function cloudHeaders(extra = {}) {
  const headers = {
    apikey: cloudConfig.key,
    "Content-Type": "application/json",
    Prefer: extra.prefer || "return=minimal",
  };
  if (!cloudConfig.key.startsWith("sb_publishable_")) {
    headers.Authorization = `Bearer ${cloudConfig.key}`;
  }
  return headers;
}

async function getSupabaseError(response, fallback) {
  let detail = "";
  try {
    const payload = await response.json();
    detail = payload.message || payload.error || payload.hint || "";
  } catch {
    detail = await response.text().catch(() => "");
  }
  return `${fallback}: ${response.status}${detail ? ` ${detail}` : ""}`;
}

function getCloudErrorMessage(error) {
  const message = String(error?.message || "");
  if (message.includes("404") || message.includes("Could not find the table")) {
    return "Supabaseのテーブルが見つかりません";
  }
  if (message.includes("401") || message.includes("403") || message.includes("permission denied") || message.includes("row-level security")) {
    return "SupabaseのキーかRLS設定を確認";
  }
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "Supabase URLを確認";
  }
  return "Supabase設定を確認";
}

function setSyncState(status, message) {
  if (syncStatus) syncStatus.textContent = status;
  if (message) document.querySelector("#daily-message").textContent = message;
}

async function withCloudBusy(button, busyText, action) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = busyText;
  try {
    await action();
  } catch {
    // Detailed feedback is set where the cloud error is classified.
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function setCloudFeedback(type, message) {
  cloudFeedback.textContent = message;
  cloudFeedback.className = `cloud-feedback is-${type}`;
}

function setProfileFeedback(type, message) {
  profileFeedback.textContent = message;
  profileFeedback.className = `cloud-feedback is-${type}`;
}

function normalizeSupabaseUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  try {
    const url = new URL(text.startsWith("http") ? text : `https://${text}`);
    return url.origin.replace(/\/$/, "");
  } catch {
    return text.replace(/\/rest\/v1\/?$/i, "").replace(/\/rest\/?$/i, "").replace(/\/$/, "");
  }
}

async function encryptCloudData(value) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveCloudKey();
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return `${base64FromBytes(iv)}.${base64FromBytes(new Uint8Array(encrypted))}`;
}

async function decryptCloudData(payload) {
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
  renderWeightChart();
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
  document.querySelector("#weekly-score-detail").textContent = getScoreDetail(score);
  renderWeeklyAverage(weekEntries);

  const habitRatio = getHabitRatio(weekEntries);
  document.querySelector("#habit-progress").style.width = `${habitRatio}%`;
  document.querySelector("#habit-progress-label").textContent = `${habitRatio}%`;
  const selected = entries.find((entry) => entry.date === dateInput.value);
  const dailyMessage = getDailyMessage(score, selected);
  document.querySelector("#daily-message").textContent = dailyMessage;
  renderGoalSummary(latestWithWeight);
}

function renderWeeklyAverage(weekEntries) {
  const weights = weekEntries.filter((entry) => entry.weight !== null).map((entry) => entry.weight);
  const average = weights.length ? weights.reduce((sum, weight) => sum + weight, 0) / weights.length : null;
  document.querySelector("#weekly-average").textContent = average === null ? "-- kg" : `${average.toFixed(1)} kg`;
  document.querySelector("#weekly-average-detail").textContent = weights.length
    ? `${weights.length}件の記録から計算`
    : "体重を記録すると表示";
}

function renderGoalSummary(latestWithWeight) {
  const remaining = document.querySelector("#goal-remaining");
  const detail = document.querySelector("#goal-detail");
  const paceDetail = document.querySelector("#pace-detail");
  if (!profile.goalWeight || !latestWithWeight) {
    remaining.textContent = "-- kg";
    detail.textContent = "初回設定で表示されます";
    paceDetail.textContent = "無理なく続くペースで";
    return;
  }

  const diff = latestWithWeight.weight - profile.goalWeight;
  const absolute = Math.abs(diff).toFixed(1);
  remaining.textContent = diff > 0 ? `${absolute} kg` : "達成中";
  paceDetail.textContent = getPaceLabel(profile.pace);

  if (profile.startWeight) {
    const total = Math.abs(profile.startWeight - profile.goalWeight);
    const done = Math.min(total, Math.max(0, Math.abs(profile.startWeight - latestWithWeight.weight)));
    const percent = total ? Math.round((done / total) * 100) : 100;
    const targetDate = getEstimatedTargetDate(profile.startWeight, profile.goalWeight, profile.pace, profile.startDate);
    detail.textContent = targetDate ? `開始から${percent}% / 目安 ${targetDate}` : `開始から${percent}%進行`;
    return;
  }

  detail.textContent = `目標 ${profile.goalWeight.toFixed(1)}kg`;
}

function renderAdvice() {
  const adviceList = document.querySelector("#advice-list");
  const selected = entries.find((entry) => entry.date === dateInput.value);
  const items = buildAdvice(selected);
  renderCoachCard(selected, items);
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
      const meals = getMealLogLabel(entry.meals || []);
      return `
        <article class="history-item">
          <div class="history-date">${formatDateLabel(entry.date)}</div>
          <div class="history-detail">${weight} / ${sleep} / ${meals} / ${habits}</div>
          <div class="score-pill">${scoreEntry(entry)}点</div>
        </article>
      `;
    })
    .join("");
}

function renderWeightChart() {
  const svg = document.querySelector("#weight-chart");
  const empty = document.querySelector("#chart-empty");
  const points = entries
    .filter((entry) => entry.weight !== null)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  svg.innerHTML = '<title id="weight-chart-title">体重の推移グラフ</title>';
  if (points.length < 2) {
    svg.hidden = true;
    empty.hidden = false;
    return;
  }

  svg.hidden = false;
  empty.hidden = true;

  const width = 720;
  const height = 280;
  const pad = { top: 22, right: 26, bottom: 42, left: 52 };
  const weights = points.map((point) => point.weight);
  const min = Math.floor(Math.min(...weights) - 0.5);
  const max = Math.ceil(Math.max(...weights) + 0.5);
  const range = Math.max(1, max - min);
  const xStep = (width - pad.left - pad.right) / Math.max(1, points.length - 1);
  const x = (index) => pad.left + index * xStep;
  const y = (weight) => pad.top + ((max - weight) / range) * (height - pad.top - pad.bottom);
  const actualPath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(point.weight).toFixed(1)}`).join(" ");
  const averagePoints = points.map((point, index) => ({
    date: point.date,
    weight: averageWeight(points.slice(Math.max(0, index - 6), index + 1)),
  }));
  const averagePath = averagePoints.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(point.weight).toFixed(1)}`).join(" ");
  const grid = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = max - range * ratio;
    const yy = pad.top + ratio * (height - pad.top - pad.bottom);
    return `<g><line class="chart-grid" x1="${pad.left}" y1="${yy}" x2="${width - pad.right}" y2="${yy}"></line><text class="chart-label" x="10" y="${yy + 4}">${value.toFixed(1)}</text></g>`;
  }).join("");
  const labels = [0, Math.floor((points.length - 1) / 2), points.length - 1]
    .filter((value, index, array) => array.indexOf(value) === index)
    .map((index) => `<text class="chart-label" x="${x(index)}" y="${height - 12}" text-anchor="middle">${formatShortDate(points[index].date)}</text>`)
    .join("");
  const dots = points.map((point, index) => `<circle class="chart-dot" cx="${x(index)}" cy="${y(point.weight)}" r="4"><title>${formatDateLabel(point.date)} ${point.weight.toFixed(1)}kg</title></circle>`).join("");

  svg.insertAdjacentHTML("beforeend", `
    ${grid}
    <path class="chart-average" d="${averagePath}"></path>
    <path class="chart-line" d="${actualPath}"></path>
    ${dots}
    ${labels}
  `);
}

function averageWeight(items) {
  return items.reduce((sum, item) => sum + item.weight, 0) / items.length;
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
  document.querySelectorAll('input[name="meals"]').forEach((checkbox) => {
    checkbox.checked = (entry.meals || []).includes(checkbox.value);
  });
  document.querySelectorAll('input[name="habits"]').forEach((checkbox) => {
    checkbox.checked = entry.habits.includes(checkbox.value);
  });
}

function renderCoachCard(entry, adviceItems) {
  const tone = document.querySelector("#coach-tone");
  const focus = document.querySelector("#coach-focus");
  if (!entry) {
    tone.textContent = "小さく整える";
    focus.textContent = "まず今日の状態を一つ残す";
    return;
  }
  const score = scoreEntry(entry);
  tone.textContent = score >= 80 ? "いい流れ" : score >= 60 ? "土台づくり" : "回復優先";
  focus.textContent = adviceItems[0]?.title || "今日できたことを見る";
}

function buildAdvice(entry) {
  if (!entry) {
    const starter = [
      { title: "今日の記録から始める", body: "体重は週平均で見ます。今日は食事・睡眠・行動のどれか一つを残せば十分です。" },
      { title: "小さく勝つ", body: "水分、たんぱく質、野菜、歩くことのどれか一つで十分です。続く量が正解です。" },
    ];
    if (profile.goalWeight) {
      starter.unshift({ title: "目標ペース", body: `${getPaceLabel(profile.pace)}で見ています。急ぐより、続く体調を優先しましょう。` });
    }
    return starter.slice(0, 3);
  }

  const advice = [];
  const latestWithWeight = entries.find((item) => item.weight !== null);
  if (profile.goalWeight && latestWithWeight) {
    const diff = latestWithWeight.weight - profile.goalWeight;
    if (diff > 0) {
      advice.push({ title: "目標は週単位で見る", body: `${getPaceLabel(profile.pace)}。今日の増減より、7日平均と健康行動を見ていきましょう。` });
    }
  }
  if (entry.meal === 1) {
    advice.push({ title: "食事を立て直す", body: "乱れた日は失敗ではなく情報です。次の食事でたんぱく質か野菜を一つ足しましょう。" });
  }
  if ((entry.meals || []).length < 2) {
    advice.push({ title: "食事ログを軽く残す", body: "朝昼夜を全部詳しく書かなくて大丈夫。まずは食べたタイミングだけ残すと流れが見えます。" });
  }
  if (entry.sleep !== null && entry.sleep < 6) {
    advice.push({ title: "睡眠を優先", body: "睡眠不足の日は食欲が強くなりやすいので、明日は早めに休む作戦がよさそうです。" });
  }
  if (!entry.habits.includes("protein")) {
    advice.push({ title: "たんぱく質を足す", body: "卵、魚、豆腐、鶏肉、ヨーグルトなどを一品足すと満足感が安定しやすいです。" });
  }
  if (!entry.habits.includes("walk")) {
    advice.push({ title: "軽く動く", body: "長い運動でなくて大丈夫。10分歩くだけでも、明日の自分に効いてきます。" });
  }
  if (!entry.habits.includes("slow_eating")) {
    advice.push({ title: "食べ方をゆっくりに", body: "量を減らす前に、よく噛んでゆっくり食べるだけでも満足感を作りやすくなります。" });
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
  let score = 18;
  score += entry.meal * 10;
  score += Math.min((entry.meals || []).length, 4) * 3;
  score += Math.min(entry.habits.length, 8) * 4;
  if (entry.sleep !== null) {
    score += entry.sleep >= 7 ? 20 : entry.sleep >= 6 ? 12 : 5;
  }
  if (entry.mood === "good" || entry.mood === "calm") score += 10;
  return Math.min(100, score);
}

function getHabitRatio(weekEntries) {
  if (!weekEntries.length) return 0;
  const done = weekEntries.reduce((sum, entry) => sum + entry.habits.length, 0);
  return Math.round((done / (weekEntries.length * 8)) * 100);
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

function getDailyMessage(score, entry) {
  if (entry && (entry.meals || []).length === 0) return "食事の流れを一つ残す";
  if (entry && entry.habits.length === 0) return "小さな健康行動を選ぶ";
  if (score === null) return "焦らず整える";
  if (score >= 85) return "かなりいい流れ";
  if (score >= 70) return "土台が整っている";
  if (score >= 55) return "できたことを見る";
  return "回復を優先";
}

function getMealLogLabel(meals) {
  if (!meals.length) return "食事ログなし";
  const labels = { breakfast: "朝", lunch: "昼", dinner: "夜", snack: "間食" };
  return meals.map((meal) => labels[meal]).filter(Boolean).join("・");
}

function getScoreDetail(score) {
  if (score === null) return "食事・運動・睡眠・気分";
  if (score >= 85) return "今週はかなり安定";
  if (score >= 70) return "健康行動が積み上がり中";
  if (score >= 55) return "小さな行動を増やしたい";
  return "まず睡眠と食事を整える";
}

function getPaceLabel(pace) {
  const labels = {
    gentle: "ゆるやか 週0.25kg目安",
    steady: "標準 週0.5kg目安",
    active: "しっかり 週0.75kg目安",
  };
  return labels[pace] || "標準 週0.5kg目安";
}

function getPaceKgPerWeek(pace) {
  const paces = { gentle: 0.25, steady: 0.5, active: 0.75 };
  return paces[pace] || 0.5;
}

function getEstimatedTargetDate(startWeight, goalWeight, pace, startDate) {
  const total = Math.abs(startWeight - goalWeight);
  if (!total) return null;
  const weeks = Math.ceil(total / getPaceKgPerWeek(pace));
  const date = new Date(`${startDate || isoToday}T00:00:00`);
  date.setDate(date.getDate() + weeks * 7);
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(date);
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

function formatShortDate(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
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

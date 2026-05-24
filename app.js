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
const loadDemoDataButton = document.querySelector("#load-demo-data");
const demoFeedback = document.querySelector("#demo-feedback");
const pageButtons = document.querySelectorAll("[data-page-target]");
const appPages = document.querySelectorAll(".app-page");
const rangeButtons = document.querySelectorAll("[data-range-days]");
const canUseServerSync = isPrivateHost(location.hostname);
const cloudStorageKey = "my-diet-notebook:cloud:v1";
const profileStorageKey = "my-diet-notebook:profile:v1";
const cloudTable = "diet_app_sync";
const foodHabitValues = ["water", "protein", "vegetables", "no_snack", "slow_eating"];
const exerciseHabitValues = ["walk", "stretch", "strength"];

let entries = loadEntries();
let cloudConfig = loadCloudConfig();
let profile = loadProfile();
let comboChartRangeDays = 31;

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
  setSaveFeedback(scope, "saving", "保存しています...");
  const previous = entries.find((item) => item.date === date);
  const entry = {
    date,
    weight: previous?.weight ?? null,
    weightMorning: previous?.weightMorning ?? null,
    weightNight: previous?.weightNight ?? null,
    sleep: previous?.sleep ?? null,
    intakeCalories: previous?.intakeCalories ?? null,
    burnCalories: previous?.burnCalories ?? null,
    meal: previous?.meal ?? 2,
    meals: previous?.meals ?? [],
    habits: previous?.habits ?? [],
    mood: previous?.mood ?? "calm",
    note: previous?.note ?? "",
    updatedAt: new Date().toISOString(),
  };

  if (scope === "weight" || scope === "all") {
    entry.weightMorning = numberOrNull(formData.get("weightMorning"));
    entry.weightNight = numberOrNull(formData.get("weightNight"));
    entry.weight = getPrimaryWeight(entry);
    entry.sleep = numberOrNull(formData.get("sleep"));
  }

  if (scope === "food" || scope === "all") {
    const selectedHabits = formData.getAll("habits");
    const preservedExercise = entry.habits.filter((habit) => exerciseHabitValues.includes(habit));
    const selectedFood = selectedHabits.filter((habit) => foodHabitValues.includes(habit));
    entry.meal = Number(formData.get("meal") || 2);
    entry.intakeCalories = numberOrNull(formData.get("intakeCalories"));
    entry.meals = formData.getAll("meals");
    entry.habits = [...new Set([...preservedExercise, ...selectedFood])];
    entry.mood = formData.get("mood");
    entry.note = String(formData.get("note") || "").trim();
  }

  if (scope === "exercise" || scope === "all") {
    const selectedHabits = formData.getAll("habits");
    const preservedFood = entry.habits.filter((habit) => foodHabitValues.includes(habit));
    const selectedExercise = selectedHabits.filter((habit) => exerciseHabitValues.includes(habit));
    entry.burnCalories = numberOrNull(formData.get("burnCalories"));
    entry.habits = [...new Set([...preservedFood, ...selectedExercise])];
  }

  entries = entries.filter((item) => item.date !== date);
  entries.push(entry);
  entries.sort((a, b) => b.date.localeCompare(a.date));
  saveEntries();
  render();
  setSaveFeedback(scope, "success", getSaveSuccessMessage(scope));
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
rangeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    comboChartRangeDays = Number(button.dataset.rangeDays);
    rangeButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderCalorieComboChart();
  });
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
      weightMorning: setupWeight,
      weightNight: null,
      sleep: null,
      intakeCalories: null,
      burnCalories: null,
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

loadDemoDataButton.addEventListener("click", () => {
  const shouldLoad = confirm("現在の端末内データをデモデータに置き換えます。クラウドには同期しません。");
  if (!shouldLoad) return;
  const demo = buildDemoData();
  entries = demo.entries;
  profile = demo.profile;
  localStorage.setItem(storageKey, JSON.stringify(entries));
  localStorage.setItem(profileStorageKey, JSON.stringify(profile));
  fillProfileForm();
  fillFormForDate(isoToday);
  render();
  setDemoFeedback("success", "朝・夜の体重入りデモデータを入れました。");
  switchPage("dashboard");
});

function loadEntries() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey)) || [];
    return Array.isArray(stored) ? stored.map(normalizeEntryWeights) : [];
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
      setSaveFeedback("all", "error", `端末には保存しました。${getCloudErrorMessage(error)}`);
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

function normalizeEntryWeights(entry) {
  if (!entry || typeof entry !== "object") return entry;
  const weightMorning = numberOrNull(entry.weightMorning);
  const weightNight = numberOrNull(entry.weightNight);
  const weight = numberOrNull(entry.weight);
  return {
    ...entry,
    weightMorning,
    weightNight,
    weight: weightNight ?? weightMorning ?? weight,
  };
}

function getPrimaryWeight(entry) {
  if (!entry) return null;
  return numberOrNull(entry.weightNight) ?? numberOrNull(entry.weightMorning) ?? numberOrNull(entry.weight);
}

function hasWeightEntry(entry) {
  return getPrimaryWeight(entry) !== null;
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
    const normalized = normalizeEntryWeights(entry);
    if (!normalized?.date) return;
    const current = byDate.get(normalized.date);
    if (!current || new Date(entry.updatedAt || 0) > new Date(current.updatedAt || 0)) {
      byDate.set(normalized.date, normalized);
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
  if (message && cloudFeedback) setCloudFeedback("error", message);
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

function setDemoFeedback(type, message) {
  demoFeedback.textContent = message;
  demoFeedback.className = `cloud-feedback is-${type}`;
}

function buildDemoData() {
  const demoEntries = [];
  const baseWeight = 72.4;
  const start = new Date(today);
  start.setDate(start.getDate() - 13);
  const intakeValues = [2050, 1980, 2140, 1900, 2020, 1850, 1970, 1930, 1880, 1990, 1820, 1900, 1760, 1840];
  const burnValues = [260, 340, 220, 410, 300, 520, 280, 360, 430, 310, 540, 380, 460, 420];
  const sleepValues = [6.5, 7, 6, 7.5, 6.5, 8, 7, 6, 7.5, 6.5, 7, 8, 7.5, 7];
  const moods = ["calm", "good", "tired", "calm", "good", "good", "calm", "stress", "calm", "good", "good", "calm", "good", "calm"];

  for (let index = 0; index < 14; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const morningWeight = baseWeight - index * 0.13 + (index % 3 === 0 ? 0.15 : index % 4 === 0 ? -0.08 : 0);
    const nightWeight = morningWeight + 0.35 + (index % 4 === 0 ? 0.1 : 0);
    const habits = ["water", "protein", "vegetables"];
    if (index % 2 === 0) habits.push("walk");
    if (index % 3 !== 0) habits.push("no_snack");
    if (index % 4 !== 0) habits.push("slow_eating");
    if (index % 5 === 0) habits.push("stretch");

    demoEntries.push({
      date: toIsoDate(date),
      weightMorning: Number(morningWeight.toFixed(1)),
      weightNight: Number(nightWeight.toFixed(1)),
      weight: Number(nightWeight.toFixed(1)),
      sleep: sleepValues[index],
      intakeCalories: intakeValues[index],
      burnCalories: burnValues[index],
      meal: index % 5 === 0 ? 2 : 3,
      meals: index % 4 === 0 ? ["breakfast", "lunch", "dinner"] : ["breakfast", "lunch", "dinner", "snack"],
      habits,
      mood: moods[index],
      note: index === 13 ? "デモ: 朝と夜の体重差を見ながら整える。" : "",
      updatedAt: new Date().toISOString(),
    });
  }

  const sortedEntries = demoEntries.sort((a, b) => b.date.localeCompare(a.date));

  return {
    entries: sortedEntries,
    profile: {
      startDate: sortedEntries[sortedEntries.length - 1].date,
      startWeight: 72.4,
      goalWeight: 68,
      height: 170,
      pace: "steady",
      note: "デモ: 朝体重を基準に、夜体重も記録する",
      skipped: false,
      updatedAt: new Date().toISOString(),
    },
  };
}

function setSaveFeedback(scope, type, message) {
  const targets = scope === "all"
    ? ["weight", "exercise", "food"]
    : [scope];
  targets.forEach((target) => {
    const element = document.querySelector(`#${target}-save-feedback`);
    if (!element) return;
    element.textContent = message;
    element.className = `save-feedback is-${type}`;
  });
}

function getSaveSuccessMessage(scope) {
  const labels = {
    weight: "体重を保存しました。",
    exercise: "運動記録を保存しました。",
    food: "食事記録を保存しました。",
    all: "記録を保存しました。",
  };
  return labels[scope] || labels.all;
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
  renderWeightPageSummary();
  renderWeightChart();
  renderHistory();
  fillFormForDate(dateInput.value, false);
}

function renderSummary() {
  const latestWithWeight = entries.find(hasWeightEntry);
  const latestWeight = getPrimaryWeight(latestWithWeight);
  document.querySelector("#current-weight").textContent = latestWithWeight
    ? `${latestWeight.toFixed(1)} kg`
    : "-- kg";

  const previousWithWeight = entries
    .filter((entry) => hasWeightEntry(entry) && entry.date !== latestWithWeight?.date)
    .at(0);

  document.querySelector("#weight-trend").textContent = getWeightTrend(latestWithWeight, previousWithWeight);

  const selected = entries.find((entry) => entry.date === dateInput.value);
  const weekEntries = getRecentEntries(7);
  const score = weekEntries.length ? Math.round(weekEntries.reduce((sum, entry) => sum + scoreEntry(entry), 0) / weekEntries.length) : null;
  document.querySelector("#weekly-score").textContent = score === null ? "--" : `${score}点`;
  document.querySelector("#weekly-score-detail").textContent = getScoreDetail(score);
  renderWeeklyAverage(weekEntries);
  renderCalorieDashboard(selected);
  renderDailyStatus(selected);

  const habitRatio = getHabitRatio(weekEntries);
  document.querySelector("#habit-progress").style.width = `${habitRatio}%`;
  document.querySelector("#habit-progress-label").textContent = `${habitRatio}%`;
  renderGoalSummary(latestWithWeight);
}

function renderDailyStatus(entry) {
  setStatusPill("#weight-status-pill", "体重", hasWeightEntry(entry));
  setStatusPill("#food-status-pill", "食事", entry?.intakeCalories !== null && entry?.intakeCalories !== undefined);
  setStatusPill("#exercise-status-pill", "運動", entry?.burnCalories !== null && entry?.burnCalories !== undefined);
}

function setStatusPill(selector, label, isDone) {
  const element = document.querySelector(selector);
  if (!element) return;
  element.textContent = `${label} ${isDone ? "入力済み" : "未入力"}`;
  element.classList.toggle("is-done", isDone);
}

function renderCalorieDashboard(entry) {
  const intake = entry?.intakeCalories ?? null;
  const burn = entry?.burnCalories ?? null;
  const weight = getPrimaryWeight(entry);

  document.querySelector("#intake-calorie-label").textContent = intake === null ? "-- kcal" : `${Math.round(intake)} kcal`;
  document.querySelector("#burn-calorie-label").textContent = burn === null ? "-- kcal" : `${Math.round(burn)} kcal`;
  document.querySelector("#combo-weight-label").textContent = weight === null ? "-- kg" : `${weight.toFixed(1)} kg`;

  const balanceLabel = document.querySelector("#calorie-balance-label");
  if (intake === null && burn === null) {
    balanceLabel.textContent = "記録すると表示されます";
    balanceLabel.className = "calorie-balance-label";
  } else {
    const diff = (intake || 0) - (burn || 0);
    balanceLabel.textContent = diff >= 0 ? `差分 +${Math.round(diff)} kcal` : `差分 ${Math.round(diff)} kcal`;
    balanceLabel.className = `calorie-balance-label ${diff > 0 ? "is-plus" : "is-minus"}`;
  }

  renderCalorieComboChart();
}

function renderCalorieComboChart() {
  const svg = document.querySelector("#calorie-combo-chart");
  const empty = document.querySelector("#calorie-chart-empty");
  const rangePoints = entries
    .filter((item) => item.intakeCalories !== null || item.burnCalories !== null || hasWeightEntry(item))
    .filter((item) => isWithinRange(item.date, comboChartRangeDays))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  const points = sampleChartPoints(rangePoints, 120);

  svg.innerHTML = '<title id="calorie-chart-title">摂取カロリーは線グラフ、消費カロリーは棒グラフ、体重は線グラフ</title>';
  if (!points.length) {
    svg.hidden = true;
    empty.hidden = false;
    return;
  }

  svg.hidden = false;
  empty.hidden = true;

  const width = 720;
  const height = 260;
  const pad = { top: 24, right: 58, bottom: 42, left: 58 };
  const calorieValues = points.flatMap((point) => [point.intakeCalories, point.burnCalories]).filter((value) => value !== null);
  const weightValues = points.map(getPrimaryWeight).filter((value) => value !== null);
  const max = calorieValues.length ? Math.max(500, Math.ceil(Math.max(...calorieValues) / 250) * 250) : 500;
  const minWeight = weightValues.length ? Math.floor((Math.min(...weightValues) - 0.5) * 10) / 10 : 0;
  const maxWeight = weightValues.length ? Math.ceil((Math.max(...weightValues) + 0.5) * 10) / 10 : 1;
  const weightRange = Math.max(0.1, maxWeight - minWeight);
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const step = innerWidth / Math.max(1, points.length);
  const barWidth = Math.min(32, Math.max(14, step * 0.45));
  const xCenter = (index) => pad.left + step * index + step / 2;
  const y = (value) => pad.top + innerHeight - ((value || 0) / max) * innerHeight;
  const yWeight = (value) => pad.top + innerHeight - ((value - minWeight) / weightRange) * innerHeight;
  let intakeIndex = 0;
  const linePoints = points
    .map((point, index) => {
      if (point.intakeCalories === null) return null;
      const command = intakeIndex === 0 ? "M" : "L";
      intakeIndex += 1;
      return `${command} ${xCenter(index).toFixed(1)} ${y(point.intakeCalories).toFixed(1)}`;
    })
    .filter(Boolean)
    .join(" ");
  let weightIndex = 0;
  const weightLinePoints = points
    .map((point, index) => {
      const weight = getPrimaryWeight(point);
      if (weight === null) return null;
      const command = weightIndex === 0 ? "M" : "L";
      weightIndex += 1;
      return `${command} ${xCenter(index).toFixed(1)} ${yWeight(weight).toFixed(1)}`;
    })
    .filter(Boolean)
    .join(" ");
  const bars = points.map((point, index) => {
    const value = point.burnCalories || 0;
    const barHeight = Math.max(0, pad.top + innerHeight - y(value));
    const x = xCenter(index) - barWidth / 2;
    return `<rect class="calorie-burn-bar" x="${x.toFixed(1)}" y="${y(value).toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" rx="6"><title>${formatDateLabel(point.date)} 消費 ${Math.round(value)}kcal</title></rect>`;
  }).join("");
  const dots = points
    .map((point, index) => point.intakeCalories === null ? "" : `<circle class="calorie-intake-dot" cx="${xCenter(index).toFixed(1)}" cy="${y(point.intakeCalories).toFixed(1)}" r="4"><title>${formatDateLabel(point.date)} 摂取 ${Math.round(point.intakeCalories)}kcal</title></circle>`)
    .join("");
  const weightDots = points
    .map((point, index) => {
      const weight = getPrimaryWeight(point);
      return weight === null ? "" : `<circle class="combo-weight-dot" cx="${xCenter(index).toFixed(1)}" cy="${yWeight(weight).toFixed(1)}" r="4"><title>${formatDateLabel(point.date)} 体重 ${weight.toFixed(1)}kg</title></circle>`;
    })
    .join("");
  const grid = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = Math.round(max * (1 - ratio));
    const yy = pad.top + innerHeight * ratio;
    return `<g><line class="chart-grid" x1="${pad.left}" y1="${yy}" x2="${width - pad.right}" y2="${yy}"></line><text class="chart-label" x="10" y="${yy + 4}">${value}</text></g>`;
  }).join("");
  const weightAxis = [0, 0.5, 1].map((ratio) => {
    const value = maxWeight - weightRange * ratio;
    const yy = pad.top + innerHeight * ratio;
    return `<text class="chart-label combo-weight-axis" x="${width - 10}" y="${yy + 4}" text-anchor="end">${value.toFixed(1)}kg</text>`;
  }).join("");
  const labelInterval = Math.max(1, Math.ceil(points.length / 8));
  const labels = points.map((point, index) => {
    if (points.length > 8 && index !== 0 && index !== points.length - 1 && index % labelInterval !== 0) return "";
    return `<text class="chart-label" x="${xCenter(index).toFixed(1)}" y="${height - 12}" text-anchor="middle">${formatShortDate(point.date)}</text>`;
  }).join("");

  svg.insertAdjacentHTML("beforeend", `
    ${grid}
    ${bars}
    <path class="calorie-intake-line" d="${linePoints}"></path>
    ${dots}
    <path class="combo-weight-line" d="${weightLinePoints}"></path>
    ${weightDots}
    ${weightAxis}
    ${labels}
  `);
}

function isWithinRange(date, days) {
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return new Date(`${date}T00:00:00`) >= start;
}

function sampleChartPoints(points, maxCount) {
  if (points.length <= maxCount) return points;
  const lastIndex = points.length - 1;
  return Array.from({ length: maxCount }, (_, index) => {
    const pointIndex = Math.round((index * lastIndex) / (maxCount - 1));
    return points[pointIndex];
  });
}

function renderWeeklyAverage(weekEntries) {
  const weights = weekEntries.map(getPrimaryWeight).filter((weight) => weight !== null);
  const average = weights.length ? weights.reduce((sum, weight) => sum + weight, 0) / weights.length : null;
  document.querySelector("#weekly-average").textContent = average === null ? "-- kg" : `${average.toFixed(1)} kg`;
  document.querySelector("#weekly-average-detail").textContent = weights.length
    ? `${weights.length}件の記録から計算`
    : "体重を記録すると表示";
}

function renderGoalSummary(latestWithWeight) {
  const remaining = document.querySelector("#goal-remaining");
  const detail = document.querySelector("#goal-detail");
  if (!profile.goalWeight || !latestWithWeight) {
    remaining.textContent = "-- kg";
    detail.textContent = "初回設定で表示されます";
    return;
  }

  const latestWeight = getPrimaryWeight(latestWithWeight);
  const diff = latestWeight - profile.goalWeight;
  const absolute = Math.abs(diff).toFixed(1);
  remaining.textContent = diff > 0 ? `${absolute} kg` : "達成中";

  if (profile.startWeight) {
    const total = Math.abs(profile.startWeight - profile.goalWeight);
    const done = Math.min(total, Math.max(0, Math.abs(profile.startWeight - latestWeight)));
    const percent = total ? Math.round((done / total) * 100) : 100;
    const targetDate = getEstimatedTargetDate(profile.startWeight, profile.goalWeight, profile.pace, profile.startDate);
    detail.textContent = targetDate ? `開始から${percent}% / 目安 ${targetDate}` : `開始から${percent}%進行`;
    return;
  }

  detail.textContent = `目標 ${profile.goalWeight.toFixed(1)}kg`;
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
      const weight = getWeightHistoryLabel(entry);
      const sleep = entry.sleep === null ? "睡眠未入力" : `${entry.sleep}時間睡眠`;
      const calories = getCalorieLabel(entry);
      const habits = entry.habits.length ? `${entry.habits.length}個の行動` : "行動チェックなし";
      const meals = getMealLogLabel(entry.meals || []);
      return `
        <article class="history-item">
          <div class="history-date">${formatDateLabel(entry.date)}</div>
          <div class="history-detail">${weight} / ${sleep} / ${calories} / ${meals} / ${habits}</div>
          <div class="score-pill">${scoreEntry(entry)}点</div>
        </article>
      `;
    })
    .join("");
}

function renderWeightPageSummary() {
  const latestMorning = entries.find((entry) => numberOrNull(entry.weightMorning) !== null);
  const latestNight = entries.find((entry) => numberOrNull(entry.weightNight) !== null);
  const latestGap = entries.find((entry) => numberOrNull(entry.weightMorning) !== null && numberOrNull(entry.weightNight) !== null);
  const monthChange = getWeightChangeForDays(30);

  setWeightMetric("#weight-morning-latest", "#weight-morning-detail", latestMorning?.weightMorning, latestMorning ? `${formatDateLabel(latestMorning.date)}の朝` : "朝の記録で表示");
  setWeightMetric("#weight-night-latest", "#weight-night-detail", latestNight?.weightNight, latestNight ? `${formatDateLabel(latestNight.date)}の夜` : "夜の記録で表示");

  if (latestGap) {
    const gap = latestGap.weightNight - latestGap.weightMorning;
    document.querySelector("#weight-day-gap").textContent = `${gap >= 0 ? "+" : ""}${gap.toFixed(1)} kg`;
    document.querySelector("#weight-day-gap-detail").textContent = `${formatDateLabel(latestGap.date)}の朝夜差`;
  } else {
    document.querySelector("#weight-day-gap").textContent = "-- kg";
    document.querySelector("#weight-day-gap-detail").textContent = "同じ日の朝夜で計算";
  }

  if (monthChange === null) {
    document.querySelector("#weight-month-change").textContent = "-- kg";
    document.querySelector("#weight-month-change-detail").textContent = "2件以上で表示";
  } else {
    document.querySelector("#weight-month-change").textContent = `${monthChange >= 0 ? "+" : ""}${monthChange.toFixed(1)} kg`;
    document.querySelector("#weight-month-change-detail").textContent = "直近30日の代表体重";
  }
}

function setWeightMetric(valueSelector, detailSelector, value, detail) {
  const weight = numberOrNull(value);
  document.querySelector(valueSelector).textContent = weight === null ? "-- kg" : `${weight.toFixed(1)} kg`;
  document.querySelector(detailSelector).textContent = detail;
}

function getWeightChangeForDays(days) {
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  const points = entries
    .filter((entry) => hasWeightEntry(entry) && new Date(`${entry.date}T00:00:00`) >= start)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  if (points.length < 2) return null;
  return getPrimaryWeight(points[points.length - 1]) - getPrimaryWeight(points[0]);
}

function getWeightHistoryLabel(entry) {
  const morning = numberOrNull(entry.weightMorning);
  const night = numberOrNull(entry.weightNight);
  if (morning === null && night === null) {
    const weight = getPrimaryWeight(entry);
    return weight === null ? "体重未入力" : `${weight.toFixed(1)}kg`;
  }
  const morningText = morning === null ? "朝--" : `朝${morning.toFixed(1)}kg`;
  const nightText = night === null ? "夜--" : `夜${night.toFixed(1)}kg`;
  return `${morningText} / ${nightText}`;
}

function renderWeightChart() {
  const svg = document.querySelector("#weight-chart");
  const empty = document.querySelector("#chart-empty");
  const points = entries
    .filter(hasWeightEntry)
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
  const weights = points
    .flatMap((point) => [getPrimaryWeight(point), numberOrNull(point.weightMorning), numberOrNull(point.weightNight)])
    .filter((weight) => weight !== null);
  const min = Math.floor(Math.min(...weights) - 0.5);
  const max = Math.ceil(Math.max(...weights) + 0.5);
  const range = Math.max(1, max - min);
  const xStep = (width - pad.left - pad.right) / Math.max(1, points.length - 1);
  const x = (index) => pad.left + index * xStep;
  const y = (weight) => pad.top + ((max - weight) / range) * (height - pad.top - pad.bottom);
  const morningPath = buildWeightPath(points, x, y, (point) => numberOrNull(point.weightMorning));
  const nightPath = buildWeightPath(points, x, y, (point) => numberOrNull(point.weightNight));
  const fallbackPath = !morningPath && !nightPath ? buildWeightPath(points, x, y, getPrimaryWeight) : "";
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
  const morningDots = buildWeightDots(points, x, y, (point) => numberOrNull(point.weightMorning), "chart-morning-dot", "朝");
  const nightDots = buildWeightDots(points, x, y, (point) => numberOrNull(point.weightNight), "chart-night-dot", "夜");
  const fallbackDots = !morningPath && !nightPath ? buildWeightDots(points, x, y, getPrimaryWeight, "chart-dot", "体重") : "";

  svg.insertAdjacentHTML("beforeend", `
    ${grid}
    <path class="chart-average" d="${averagePath}"></path>
    ${fallbackPath ? `<path class="chart-line" d="${fallbackPath}"></path>` : ""}
    ${morningPath ? `<path class="chart-morning-line" d="${morningPath}"></path>` : ""}
    ${nightPath ? `<path class="chart-night-line" d="${nightPath}"></path>` : ""}
    ${fallbackDots}
    ${morningDots}
    ${nightDots}
    ${labels}
  `);
}

function buildWeightPath(points, x, y, getValue) {
  let lineIndex = 0;
  return points
    .map((point, index) => {
      const weight = getValue(point);
      if (weight === null) return null;
      const command = lineIndex === 0 ? "M" : "L";
      lineIndex += 1;
      return `${command} ${x(index).toFixed(1)} ${y(weight).toFixed(1)}`;
    })
    .filter(Boolean)
    .join(" ");
}

function buildWeightDots(points, x, y, getValue, className, label) {
  return points
    .map((point, index) => {
      const weight = getValue(point);
      if (weight === null) return "";
      return `<circle class="${className}" cx="${x(index)}" cy="${y(weight)}" r="4"><title>${formatDateLabel(point.date)} ${label} ${weight.toFixed(1)}kg</title></circle>`;
    })
    .join("");
}

function averageWeight(items) {
  return items.reduce((sum, item) => sum + getPrimaryWeight(item), 0) / items.length;
}

function fillFormForDate(date, overwrite = true) {
  const entry = entries.find((item) => item.date === date);
  if (!entry || !overwrite) return;

  form.reset();
  dateInput.value = date;
  document.querySelector("#weight-morning").value = entry.weightMorning ?? (entry.weightNight === null || entry.weightNight === undefined ? entry.weight ?? "" : "");
  document.querySelector("#weight-night").value = entry.weightNight ?? "";
  document.querySelector("#sleep").value = entry.sleep ?? "";
  document.querySelector("#intake-calories").value = entry.intakeCalories ?? "";
  document.querySelector("#burn-calories").value = entry.burnCalories ?? "";
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
  const diff = getPrimaryWeight(latest) - getPrimaryWeight(previous);
  if (Math.abs(diff) < 0.1) return "前回からほぼ変化なし";
  const sign = diff > 0 ? "+" : "";
  return `前回から${sign}${diff.toFixed(1)}kg`;
}

function getMealLogLabel(meals) {
  if (!meals.length) return "食事ログなし";
  const labels = { breakfast: "朝", lunch: "昼", dinner: "夜", snack: "間食" };
  return meals.map((meal) => labels[meal]).filter(Boolean).join("・");
}

function getCalorieLabel(entry) {
  const intake = entry.intakeCalories ?? null;
  const burn = entry.burnCalories ?? null;
  if (intake === null && burn === null) return "カロリー未入力";
  const intakeText = intake === null ? "--" : Math.round(intake);
  const burnText = burn === null ? "--" : Math.round(burn);
  return `摂取${intakeText} / 消費${burnText}kcal`;
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

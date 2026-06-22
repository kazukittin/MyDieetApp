const storageKey = "my-diet-notebook:v2";
const recordDayBoundaryHour = 3;
const today = getRecordDayDate(new Date());
const isoToday = toIsoDate(today);

const form = document.querySelector("#entry-form");
const dateInput = document.querySelector("#entry-date");
const clearTodayButton = document.querySelector("#clear-today");
const exportButton = document.querySelector("#export-data");
const syncStatus = document.querySelector("#sync-status");
const syncNowButton = document.querySelector("#sync-now");
const cloudFeedback = document.querySelector("#cloud-feedback");
const authScreen = document.querySelector("#auth-screen");
const authForm = document.querySelector("#auth-form");
const authEmail = document.querySelector("#auth-email");
const authPassword = document.querySelector("#auth-password");
const authSubmit = document.querySelector("#auth-submit");
const authModeToggle = document.querySelector("#auth-mode-toggle");
const resendConfirmationButton = document.querySelector("#resend-confirmation");
const authFeedback = document.querySelector("#auth-feedback");
const authConfigHelp = document.querySelector("#auth-config-help");
const accountEmail = document.querySelector("#account-email");
const logoutButton = document.querySelector("#logout-button");
const appShell = document.querySelector(".app-shell");
const onboarding = document.querySelector("#onboarding");
const onboardingForm = document.querySelector("#onboarding-form");
const settingsScreen = document.querySelector("#settings-screen");
const openSettingsButton = document.querySelector("#open-settings");
const closeSettingsButton = document.querySelector("#close-settings");
const profileForm = document.querySelector("#profile-form");
const profileFeedback = document.querySelector("#profile-feedback");
const applyTodayPresetButton = document.querySelector("#apply-today-preset");
const saveWeekdayPresetButton = document.querySelector("#save-weekday-preset");
const exercisePresetList = document.querySelector("#exercise-preset-list");
const foodPresetList = document.querySelector("#food-preset-list");
const pageButtons = document.querySelectorAll("[data-page-target]");
const appPages = document.querySelectorAll(".app-page");
const rangeButtons = document.querySelectorAll("[data-range-days]");
const profileStorageKey = "my-diet-notebook:profile:v2";
const exercisePresetStorageKey = "my-diet-notebook:exercise-presets:v2";
const cloudTable = "diet_user_data";
const appConfig = window.MY_DIET_CONFIG || {};
const supabaseClient = hasSupabaseConfig() && window.supabase
  ? window.supabase.createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey)
  : null;
const foodHabitValues = ["water", "protein", "vegetables", "no_snack", "slow_eating"];
const exerciseHabitValues = ["walk", "stretch", "strength"];
const defaultExercisePresets = [
  { day: "日", type: "full_body", minutes: 20, burnCalories: 90, intensity: "light", habits: ["stretch"], note: "回復日。全身を軽く動かして整える。" },
  { day: "月", type: "walk", minutes: 30, burnCalories: 160, intensity: "normal", habits: ["walk"], note: "軽く歩いて週を始める。" },
  { day: "火", type: "legs", minutes: 25, burnCalories: 180, intensity: "normal", habits: ["strength"], note: "脚の日。スクワットや下半身を中心に。" },
  { day: "水", type: "back", minutes: 30, burnCalories: 190, intensity: "normal", habits: ["strength"], note: "背中の日。姿勢を意識して動く。" },
  { day: "木", type: "abs", minutes: 20, burnCalories: 110, intensity: "light", habits: ["strength", "stretch"], note: "お腹の日。体幹を軽めに。" },
  { day: "金", type: "chest", minutes: 30, burnCalories: 210, intensity: "hard", habits: ["strength"], note: "胸の日。週末前に少ししっかり動く。" },
  { day: "土", type: "walk", minutes: 45, burnCalories: 260, intensity: "normal", habits: ["walk", "stretch"], note: "長めに歩く。終わったらストレッチ。" },
];
const foodPresets = [
  { meal: "breakfast", label: "朝の定番", calories: 420, habits: ["water", "protein"], note: "朝はたんぱく質を入れる。" },
  { meal: "lunch", label: "昼の定番", calories: 650, habits: ["protein", "vegetables"], note: "昼は主食と野菜を揃える。" },
  { meal: "dinner", label: "夜の定番", calories: 700, habits: ["vegetables", "slow_eating"], note: "夜はゆっくり食べて整える。" },
  { meal: "snack", label: "間食控えめ", calories: 150, habits: ["no_snack"], note: "間食は軽めにする。" },
];

let activeUser = null;
let authMode = "login";
let entries = [];
let profile = {};
let exercisePresets = getDefaultExercisePresets();
let comboChartRangeDays = 31;

dateInput.value = isoToday;
if (document.querySelector("#today-label")) {
  document.querySelector("#today-label").textContent = formatDateLabel(isoToday);
}
if (syncStatus) syncStatus.textContent = "ログイン待ち";
initializeAuth();

window.addEventListener("focus", () => {
  if (activeUser) syncFromCloud();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && activeUser) syncFromCloud();
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
    mealCalories: previous?.mealCalories ?? {},
    burnCalories: previous?.burnCalories ?? null,
    exerciseMinutes: previous?.exerciseMinutes ?? null,
    exerciseType: previous?.exerciseType ?? "",
    exerciseIntensity: previous?.exerciseIntensity ?? "normal",
    exerciseNote: previous?.exerciseNote ?? "",
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
    entry.mealCalories = getMealCaloriesFromForm(formData);
    entry.intakeCalories = getMealCaloriesTotal(entry.mealCalories);
    entry.meals = formData.getAll("meals");
    entry.meal = deriveMealScore(entry.meals, selectedFood);
    entry.habits = [...new Set([...preservedExercise, ...selectedFood])];
    entry.mood = formData.get("mood");
    entry.note = String(formData.get("note") || "").trim();
  }

  if (scope === "exercise" || scope === "all") {
    const selectedHabits = formData.getAll("habits");
    const preservedFood = entry.habits.filter((habit) => foodHabitValues.includes(habit));
    const selectedExercise = selectedHabits.filter((habit) => exerciseHabitValues.includes(habit));
    entry.burnCalories = numberOrNull(formData.get("burnCalories"));
    entry.exerciseMinutes = numberOrNull(formData.get("exerciseMinutes"));
    entry.exerciseType = String(formData.get("exerciseType") || "");
    entry.exerciseIntensity = String(formData.get("exerciseIntensity") || "normal");
    entry.exerciseNote = String(formData.get("exerciseNote") || "").trim();
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
  updateIntakeCaloriesTotal();
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

syncNowButton.addEventListener("click", (event) => {
  event.preventDefault();
  if (!activeUser) {
    setCloudFeedback("error", "ログインしてください。");
    return;
  }
  setCloudFeedback("loading", "クラウドと同期しています...");
  withCloudBusy(syncNowButton, "同期中...", async () => {
    await syncFromCloud();
    setCloudFeedback("success", "最新データに同期しました。");
  });
});

authModeToggle.addEventListener("click", () => {
  authMode = authMode === "login" ? "signup" : "login";
  updateAuthMode();
});

resendConfirmationButton.addEventListener("click", async () => {
  if (!supabaseClient) return;
  const email = authEmail.value.trim();
  if (!email) {
    setAuthFeedback("error", "確認メールを送るメールアドレスを入力してください。");
    authEmail.focus();
    return;
  }

  setAuthBusy(true);
  setAuthFeedback("loading", "確認メールを再送しています...");
  const { error } = await supabaseClient.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });
  setAuthBusy(false);

  if (error) {
    setAuthFeedback("error", getResendErrorMessage(error));
    return;
  }
  setAuthFeedback("success", "確認メールを再送しました。迷惑メールフォルダも確認してください。");
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) {
    setAuthFeedback("error", "Supabaseの接続設定がありません。");
    return;
  }

  const email = authEmail.value.trim();
  const password = authPassword.value;
  setAuthBusy(true);
  setAuthFeedback("loading", authMode === "signup" ? "アカウントを作成しています..." : "ログインしています...");

  const result = authMode === "signup"
    ? await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    })
    : await supabaseClient.auth.signInWithPassword({ email, password });

  setAuthBusy(false);
  if (result.error) {
    setAuthFeedback("error", getAuthErrorMessage(result.error));
    return;
  }

  if (authMode === "signup" && !result.data.session) {
    setAuthFeedback("success", "確認メールを送りました。メール内のリンクを開いてからログインしてください。");
  }
});

logoutButton.addEventListener("click", async () => {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
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
if (applyTodayPresetButton) {
  applyTodayPresetButton.addEventListener("click", () => {
    applyExercisePreset(getPresetForDate(dateInput.value || isoToday));
    setSaveFeedback("exercise", "success", "今日の曜日メニューを入力しました。保存すると記録に残ります。");
  });
}
if (saveWeekdayPresetButton) {
  saveWeekdayPresetButton.addEventListener("click", saveCurrentExerciseAsWeekdayPreset);
}
document.querySelectorAll("[data-meal-calorie-input]").forEach((input) => {
  input.addEventListener("input", updateIntakeCaloriesTotal);
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

  saveProfileToDevice();
  if (setupWeight !== null && !entries.some((entry) => entry.date === isoToday)) {
    entries.push({
      date: isoToday,
      weight: setupWeight,
      weightMorning: setupWeight,
      weightNight: null,
      sleep: null,
      intakeCalories: null,
      mealCalories: {},
      burnCalories: null,
      exerciseMinutes: null,
      exerciseType: "",
      exerciseIntensity: "normal",
      exerciseNote: "",
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
  appShell.removeAttribute("inert");
  fillFormForDate(isoToday);
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
  saveProfileToDevice();
  setProfileFeedback("success", "初期設定を保存しました。");
  render();
  if (activeUser) {
    pushEntriesToCloud().catch((error) => {
      setProfileFeedback("error", getCloudErrorMessage(error));
    });
  }
});

function loadEntries() {
  try {
    const stored = JSON.parse(localStorage.getItem(getUserStorageKey(storageKey))) || [];
    return Array.isArray(stored) ? stored.map(normalizeEntryWeights) : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  if (!activeUser) return;
  localStorage.setItem(getUserStorageKey(storageKey), JSON.stringify(entries));
  if (activeUser) {
    pushEntriesToCloud().catch((error) => {
      setSyncState("同期エラー", getCloudErrorMessage(error));
      setSaveFeedback("all", "error", `端末には保存しました。${getCloudErrorMessage(error)}`);
    });
  }
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(getUserStorageKey(profileStorageKey))) || {};
  } catch {
    return {};
  }
}

function loadExercisePresets() {
  try {
    const stored = JSON.parse(localStorage.getItem(getUserStorageKey(exercisePresetStorageKey)));
    if (!Array.isArray(stored) || stored.length !== defaultExercisePresets.length) {
      return getDefaultExercisePresets();
    }
    return defaultExercisePresets.map((preset, index) => normalizeExercisePreset({ ...preset, ...stored[index], day: preset.day }));
  } catch {
    return getDefaultExercisePresets();
  }
}

function getDefaultExercisePresets() {
  return defaultExercisePresets.map((preset) => ({ ...preset, habits: [...preset.habits] }));
}

function normalizeExercisePreset(preset) {
  return {
    day: preset.day,
    type: typeof preset.type === "string" ? preset.type : "",
    minutes: numberOrNull(preset.minutes) ?? 0,
    burnCalories: numberOrNull(preset.burnCalories) ?? 0,
    intensity: ["light", "normal", "hard"].includes(preset.intensity) ? preset.intensity : "normal",
    habits: Array.isArray(preset.habits) ? preset.habits.filter((habit) => exerciseHabitValues.includes(habit)) : [],
    note: typeof preset.note === "string" ? preset.note : "",
  };
}

function saveExercisePresets() {
  if (!activeUser) return;
  localStorage.setItem(getUserStorageKey(exercisePresetStorageKey), JSON.stringify(exercisePresets));
}

function saveProfileToDevice() {
  if (!activeUser) return;
  localStorage.setItem(getUserStorageKey(profileStorageKey), JSON.stringify(profile));
}

function getUserStorageKey(baseKey) {
  return `${baseKey}:${activeUser?.id || "signed-out"}`;
}

function purgeLegacySampleData() {
  const legacyNoteMarker = "\u30c7\u30e2";
  const legacyExerciseMarker = "\u5915\u65b9\u306b\u30a6\u30a9\u30fc\u30ad\u30f3\u30b0";
  const profileLooksLegacy = String(profile.note || "").includes(legacyNoteMarker);
  const entriesLookLegacy = entries.some((entry) => (
    String(entry.note || "").includes(legacyNoteMarker)
    || String(entry.exerciseNote || "").includes(legacyExerciseMarker)
  ));

  if (!profileLooksLegacy && !entriesLookLegacy) return;

  entries = [];
  profile = {};
  localStorage.removeItem(getUserStorageKey(storageKey));
  localStorage.removeItem(getUserStorageKey(profileStorageKey));
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
  const isProfileComplete = (
    numberOrNull(profile.startWeight) !== null
    && numberOrNull(profile.goalWeight) !== null
    && numberOrNull(profile.height) !== null
    && Boolean(profile.pace)
  );
  if (!isProfileComplete) {
    onboarding.hidden = false;
    appShell.setAttribute("inert", "");
  } else {
    onboarding.hidden = true;
    appShell.removeAttribute("inert");
  }
}

function fillProfileForm() {
  document.querySelector("#profile-start-weight").value = profile.startWeight ?? "";
  document.querySelector("#profile-goal-weight").value = profile.goalWeight ?? "";
  document.querySelector("#profile-height").value = profile.height ?? "";
  document.querySelector("#profile-pace").value = profile.pace || "steady";
  document.querySelector("#profile-note").value = profile.note || "";
}

function openSettings() {
  fillProfileForm();
  accountEmail.textContent = activeUser?.email || "--";
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

async function syncFromCloud() {
  if (!activeUser || !supabaseClient) return;

  try {
    setSyncState("同期中");
    const { data: cloudEntry, error } = await supabaseClient
      .from(cloudTable)
      .select("payload,updated_at")
      .eq("user_id", activeUser.id)
      .maybeSingle();
    if (error) throw error;

    if (!cloudEntry?.payload) {
      await pushEntriesToCloud();
      setSyncState("同期済み");
      return;
    }

    const cloudData = cloudEntry.payload;
    const cloudEntries = Array.isArray(cloudData) ? cloudData : cloudData.entries;
    entries = mergeEntries(entries, Array.isArray(cloudEntries) ? cloudEntries : []);
    if (cloudData.profile) {
      profile = cloudData.profile;
      saveProfileToDevice();
    }
    if (Array.isArray(cloudData.exercisePresets)) {
      exercisePresets = defaultExercisePresets.map((preset, index) => (
        normalizeExercisePreset({ ...preset, ...cloudData.exercisePresets[index], day: preset.day })
      ));
      saveExercisePresets();
    }
    purgeLegacySampleData();
    entries.sort((a, b) => b.date.localeCompare(a.date));
    localStorage.setItem(getUserStorageKey(storageKey), JSON.stringify(entries));
    await pushEntriesToCloud();
    setSyncState("同期済み");
    fillProfileForm();
    showOnboardingIfNeeded();
    render();
  } catch (error) {
    const message = getCloudErrorMessage(error);
    setSyncState("同期エラー", message);
    setCloudFeedback("error", message);
    throw error;
  }
}

async function pushEntriesToCloud() {
  if (!activeUser || !supabaseClient) return;
  const { error } = await supabaseClient
    .from(cloudTable)
    .upsert({
      user_id: activeUser.id,
      payload: { entries, profile, exercisePresets },
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  if (error) throw error;
  setSyncState("同期済み");
}

function getCloudErrorMessage(error) {
  const message = String(error?.message || "");
  if (message.includes("does not exist") || message.includes("Could not find the table")) {
    return "Supabaseのdiet_user_dataテーブルが見つかりません。";
  }
  if (message.includes("permission denied") || message.includes("row-level security")) {
    return "データベースのRLS設定を確認してください。";
  }
  return "クラウド同期に失敗しました。";
}

function hasSupabaseConfig() {
  return Boolean(
    appConfig.supabaseUrl
    && appConfig.supabaseAnonKey
    && !String(appConfig.supabaseUrl).includes("YOUR_"),
  );
}

function getAuthRedirectUrl() {
  const configuredUrl = String(appConfig.authRedirectUrl || "").trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  return `${location.origin}${location.pathname}`;
}

async function initializeAuth() {
  appShell.setAttribute("inert", "");
  if (!supabaseClient) {
    authConfigHelp.hidden = false;
    authForm.querySelectorAll("input, button").forEach((element) => {
      element.disabled = true;
    });
    setAuthFeedback("error", "管理者によるSupabase接続設定が必要です。");
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  await applySession(data.session);
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => applySession(session), 0);
  });
}

async function applySession(session) {
  const nextUser = session?.user || null;
  if (nextUser?.id === activeUser?.id) return;

  activeUser = nextUser;
  if (!activeUser) {
    entries = [];
    profile = {};
    exercisePresets = getDefaultExercisePresets();
    authScreen.hidden = false;
    onboarding.hidden = true;
    settingsScreen.hidden = true;
    accountEmail.textContent = "--";
    appShell.setAttribute("inert", "");
    setSyncState("ログイン待ち");
    render();
    return;
  }

  authScreen.hidden = true;
  appShell.removeAttribute("inert");
  authPassword.value = "";
  importLegacyDeviceData();
  entries = loadEntries();
  profile = loadProfile();
  exercisePresets = loadExercisePresets();
  purgeLegacySampleData();
  accountEmail.textContent = activeUser.email || activeUser.id;
  fillProfileForm();
  showOnboardingIfNeeded();
  render();
  await syncFromCloud();
}

function importLegacyDeviceData() {
  const migrations = [
    ["my-diet-notebook:v1", getUserStorageKey(storageKey)],
    ["my-diet-notebook:profile:v1", getUserStorageKey(profileStorageKey)],
    ["my-diet-notebook:exercise-presets:v1", getUserStorageKey(exercisePresetStorageKey)],
  ];

  migrations.forEach(([legacyKey, userKey]) => {
    const legacyValue = localStorage.getItem(legacyKey);
    if (legacyValue !== null && localStorage.getItem(userKey) === null) {
      localStorage.setItem(userKey, legacyValue);
    }
    if (legacyValue !== null) localStorage.removeItem(legacyKey);
  });
}

function updateAuthMode() {
  const isSignup = authMode === "signup";
  authSubmit.textContent = isSignup ? "新規登録" : "ログイン";
  authModeToggle.textContent = isSignup
    ? "登録済みの方はこちら（ログイン）"
    : "初めての方はこちら（新規登録）";
  authPassword.autocomplete = isSignup ? "new-password" : "current-password";
  setAuthFeedback("", "");
}

function setAuthBusy(isBusy) {
  authSubmit.disabled = isBusy;
  authModeToggle.disabled = isBusy;
  resendConfirmationButton.disabled = isBusy;
  authEmail.disabled = isBusy;
  authPassword.disabled = isBusy;
}

function setAuthFeedback(type, message) {
  authFeedback.textContent = message;
  authFeedback.className = type ? `cloud-feedback is-${type}` : "cloud-feedback";
}

function getAuthErrorMessage(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("invalid login credentials")) return "メールアドレスかパスワードが正しくありません。";
  if (message.includes("email not confirmed")) return "確認メール内のリンクを開いてからログインしてください。";
  if (message.includes("already registered") || message.includes("already been registered")) return "このメールアドレスは登録済みです。";
  if (message.includes("password")) return "パスワードは8文字以上で設定してください。";
  return "認証に失敗しました。入力内容を確認してください。";
}

function getResendErrorMessage(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("rate limit") || message.includes("too many")) {
    return "短時間に何度も送信されています。しばらく待ってから再送してください。";
  }
  if (message.includes("already confirmed")) {
    return "このメールアドレスは確認済みです。通常のログインを試してください。";
  }
  return "確認メールを再送できませんでした。少し待ってから試してください。";
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

function render() {
  renderSummary();
  renderWeightPageSummary();
  renderExercisePage();
  renderFoodPage();
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
  setStatusPill("#food-status-pill", "食事", numberOrNull(entry?.intakeCalories) !== null);
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
    .filter((item) => numberOrNull(item.intakeCalories) !== null || numberOrNull(item.burnCalories) !== null || hasWeightEntry(item))
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
      const intake = numberOrNull(point.intakeCalories);
      if (intake === null) return null;
      const command = intakeIndex === 0 ? "M" : "L";
      intakeIndex += 1;
      return `${command} ${xCenter(index).toFixed(1)} ${y(intake).toFixed(1)}`;
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
    .map((point, index) => {
      const intake = numberOrNull(point.intakeCalories);
      return intake === null ? "" : `<circle class="calorie-intake-dot" cx="${xCenter(index).toFixed(1)}" cy="${y(intake).toFixed(1)}" r="4"><title>${formatDateLabel(point.date)} 摂取 ${Math.round(intake)}kcal</title></circle>`;
    })
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

function renderExercisePage() {
  const weekEntries = getRecentEntries(7);
  const exerciseEntries = weekEntries.filter(hasExerciseEntry);
  const totalMinutes = exerciseEntries.reduce((sum, entry) => sum + (entry.exerciseMinutes || 0), 0);
  const totalBurn = exerciseEntries.reduce((sum, entry) => sum + (entry.burnCalories || 0), 0);
  const todayEntry = entries.find((entry) => entry.date === dateInput.value);

  renderExercisePresets();
  document.querySelector("#exercise-week-minutes").textContent = totalMinutes ? `${Math.round(totalMinutes)} 分` : "-- 分";
  document.querySelector("#exercise-week-minutes-detail").textContent = exerciseEntries.length ? `${exerciseEntries.length}日の記録から計算` : "時間を入れると表示";
  document.querySelector("#exercise-week-burn").textContent = totalBurn ? `${Math.round(totalBurn)} kcal` : "-- kcal";
  document.querySelector("#exercise-week-burn-detail").textContent = exerciseEntries.length ? "直近7日の合計" : "消費カロリーから計算";
  document.querySelector("#exercise-week-days").textContent = exerciseEntries.length ? `${exerciseEntries.length} 日` : "-- 日";

  if (hasExerciseEntry(todayEntry)) {
    document.querySelector("#exercise-today-status").textContent = todayEntry.exerciseType ? getExerciseTypeLabel(todayEntry.exerciseType) : "入力済み";
    document.querySelector("#exercise-today-detail").textContent = getExerciseDetailLabel(todayEntry);
  } else {
    document.querySelector("#exercise-today-status").textContent = "未入力";
    document.querySelector("#exercise-today-detail").textContent = "保存すると表示";
  }

  renderExerciseHistory();
}

function renderExercisePresets() {
  if (!exercisePresetList) return;
  const selectedDay = new Date(`${dateInput.value || isoToday}T00:00:00`).getDay();
  exercisePresetList.innerHTML = exercisePresets
    .map((preset, index) => `
      <button class="preset-card ${index === selectedDay ? "is-today" : ""}" type="button" data-preset-day="${index}">
        <span>${preset.day}</span>
        <strong>${getExerciseTypeLabel(preset.type)}</strong>
        <small>${preset.minutes}分 / ${preset.burnCalories}kcal / ${getExerciseIntensityLabel(preset.intensity)}</small>
      </button>
    `)
    .join("");

  exercisePresetList.querySelectorAll("[data-preset-day]").forEach((button) => {
    button.addEventListener("click", () => {
      applyExercisePreset(exercisePresets[Number(button.dataset.presetDay)]);
      setSaveFeedback("exercise", "success", `${button.querySelector("span").textContent}曜メニューを入力しました。`);
    });
  });
}

function applyExercisePreset(preset) {
  if (!preset) return;
  document.querySelector("#exercise-minutes").value = preset.minutes;
  document.querySelector("#burn-calories").value = preset.burnCalories;
  setExerciseTypeValue(preset.type);
  const intensityInput = document.querySelector(`input[name="exerciseIntensity"][value="${preset.intensity}"]`);
  if (intensityInput) intensityInput.checked = true;
  document.querySelector("#exercise-note").value = preset.note;
  document.querySelectorAll('input[name="habits"]').forEach((checkbox) => {
    if (exerciseHabitValues.includes(checkbox.value)) checkbox.checked = preset.habits.includes(checkbox.value);
  });
}

function saveCurrentExerciseAsWeekdayPreset() {
  const selectedDate = dateInput.value || isoToday;
  const selectedDay = new Date(`${selectedDate}T00:00:00`).getDay();
  const currentDay = exercisePresets[selectedDay]?.day || defaultExercisePresets[selectedDay].day;
  const preset = normalizeExercisePreset({
    day: currentDay,
    type: document.querySelector("#exercise-type")?.value || "",
    minutes: document.querySelector("#exercise-minutes")?.value || 0,
    burnCalories: document.querySelector("#burn-calories")?.value || 0,
    intensity: document.querySelector('input[name="exerciseIntensity"]:checked')?.value || "normal",
    habits: Array.from(document.querySelectorAll('input[name="habits"]:checked'))
      .map((checkbox) => checkbox.value)
      .filter((habit) => exerciseHabitValues.includes(habit)),
    note: document.querySelector("#exercise-note")?.value.trim() || "",
  });

  exercisePresets[selectedDay] = preset;
  saveExercisePresets();
  if (activeUser) {
    pushEntriesToCloud().catch((error) => {
      setSaveFeedback("exercise", "error", getCloudErrorMessage(error));
    });
  }
  renderExercisePresets();
  setSaveFeedback("exercise", "success", `${currentDay}曜日のプリセットを保存しました。`);
}

function setExerciseTypeValue(value) {
  const select = document.querySelector("#exercise-type");
  if (!select) return;
  const option = Array.from(select.options).find((item) => item.value === value);
  select.value = option ? value : "";
}

function getPresetForDate(date) {
  return exercisePresets[new Date(`${date}T00:00:00`).getDay()];
}

function renderExerciseHistory() {
  const list = document.querySelector("#exercise-history-list");
  if (!list) return;
  const exerciseEntries = entries.filter(hasExerciseEntry).slice(0, 14);
  if (!exerciseEntries.length) {
    list.innerHTML = '<p class="empty">まだ運動記録がありません。短い運動から残してみましょう。</p>';
    return;
  }

  list.innerHTML = exerciseEntries
    .map((entry) => `
      <article class="exercise-history-item">
        <div>
          <strong>${formatDateLabel(entry.date)}</strong>
          <span>${getExerciseTypeLabel(entry.exerciseType)} / ${getExerciseIntensityLabel(entry.exerciseIntensity)}</span>
        </div>
        <div>${getExerciseDetailLabel(entry)}</div>
      </article>
    `)
    .join("");
}

function hasExerciseEntry(entry) {
  return Boolean(entry && (
    numberOrNull(entry.burnCalories) !== null
    || numberOrNull(entry.exerciseMinutes) !== null
    || entry.exerciseType
    || getExerciseHabits(entry).length
  ));
}

function getExerciseHabits(entry) {
  return (entry?.habits || []).filter((habit) => exerciseHabitValues.includes(habit));
}

function getExerciseDetailLabel(entry) {
  const minutes = entry.exerciseMinutes === null || entry.exerciseMinutes === undefined ? "--分" : `${Math.round(entry.exerciseMinutes)}分`;
  const burn = entry.burnCalories === null || entry.burnCalories === undefined ? "--kcal" : `${Math.round(entry.burnCalories)}kcal`;
  const habits = getExerciseHabits(entry).map(getExerciseTypeLabel).filter(Boolean).join("・");
  return habits ? `${minutes} / ${burn} / ${habits}` : `${minutes} / ${burn}`;
}

function getExerciseTypeLabel(value) {
  const labels = {
    walk: "ウォーキング",
    chest: "胸",
    back: "背中",
    shoulders: "肩",
    arms: "腕",
    abs: "お腹",
    legs: "脚",
    hips: "お尻",
    full_body: "全身",
    strength: "全身",
    stretch: "全身",
    other: "その他",
  };
  return labels[value] || "運動";
}

function getExerciseIntensityLabel(value) {
  const labels = { light: "軽め", normal: "普通", hard: "きつめ" };
  return labels[value] || "普通";
}

function renderFoodPage() {
  const todayEntry = entries.find((entry) => entry.date === dateInput.value);
  const weekEntries = getRecentEntries(7);
  const calorieEntries = weekEntries.filter((entry) => numberOrNull(entry.intakeCalories) !== null);
  const averageCalories = calorieEntries.length
    ? calorieEntries.reduce((sum, entry) => sum + numberOrNull(entry.intakeCalories), 0) / calorieEntries.length
    : null;
  const mealCount = (todayEntry?.meals || []).length;
  const habitCount = getFoodHabits(todayEntry).length;

  renderFoodPresets();
  document.querySelector("#food-today-calories").textContent = todayEntry?.intakeCalories === null || todayEntry?.intakeCalories === undefined
    ? "-- kcal"
    : `${Math.round(todayEntry.intakeCalories)} kcal`;
  document.querySelector("#food-today-calories-detail").textContent = todayEntry ? "朝・昼・夜・間食の合計" : "入力すると表示";
  document.querySelector("#food-meal-count").textContent = `${mealCount || "--"} / 4`;
  document.querySelector("#food-meal-count-detail").textContent = mealCount ? getMealLogLabel(todayEntry.meals || []) : "朝・昼・夜・間食";
  document.querySelector("#food-habit-count").textContent = `${habitCount || "--"} / ${foodHabitValues.length}`;
  document.querySelector("#food-week-average").textContent = averageCalories === null ? "-- kcal" : `${Math.round(averageCalories)} kcal`;
  document.querySelector("#food-week-average-detail").textContent = calorieEntries.length ? `${calorieEntries.length}日の記録から計算` : "摂取カロリー平均";

  renderFoodHistory();
}

function renderFoodPresets() {
  if (!foodPresetList) return;
  foodPresetList.innerHTML = foodPresets
    .map((preset) => `
      <button class="preset-card" type="button" data-food-preset="${preset.meal}">
        <span>${getMealName(preset.meal)}</span>
        <strong>${preset.label}</strong>
        <small>${preset.calories}kcal</small>
      </button>
    `)
    .join("");

  foodPresetList.querySelectorAll("[data-food-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = foodPresets.find((item) => item.meal === button.dataset.foodPreset);
      applyFoodPreset(preset);
      setSaveFeedback("food", "success", `${preset.label}を入力しました。保存すると記録に残ります。`);
    });
  });
}

function applyFoodPreset(preset) {
  if (!preset) return;
  const input = document.querySelector(`#${preset.meal}-calories`);
  if (input) input.value = preset.calories;
  const mealCheckbox = document.querySelector(`input[name="meals"][value="${preset.meal}"]`);
  if (mealCheckbox) mealCheckbox.checked = true;
  document.querySelectorAll('input[name="habits"]').forEach((checkbox) => {
    if (foodHabitValues.includes(checkbox.value) && preset.habits.includes(checkbox.value)) checkbox.checked = true;
  });
  const note = document.querySelector("#note");
  if (note && preset.note && !note.value.trim()) note.value = preset.note;
  updateIntakeCaloriesTotal();
}

function updateIntakeCaloriesTotal() {
  const total = getMealCaloriesTotal(getMealCaloriesFromInputs());
  const totalInput = document.querySelector("#intake-calories");
  if (totalInput) totalInput.value = total || "";
}

function renderFoodHistory() {
  const list = document.querySelector("#food-history-list");
  if (!list) return;
  const foodEntries = entries.filter(hasFoodEntry).slice(0, 14);
  if (!foodEntries.length) {
    list.innerHTML = '<p class="empty">まだ食事記録がありません。まずは今日の食事をひとつ残してみましょう。</p>';
    return;
  }

  list.innerHTML = foodEntries
    .map((entry) => `
      <article class="food-history-item">
        <div>
          <strong>${formatDateLabel(entry.date)}</strong>
          <span>${getCalorieLabel(entry)}</span>
        </div>
        <div>${getMealLogLabel(entry.meals || [])} / ${getMealCaloriesLabel(entry)}</div>
        <div>${getFoodHabits(entry).map(getFoodHabitLabel).join("・") || "健康チェックなし"}</div>
      </article>
    `)
    .join("");
}

function hasFoodEntry(entry) {
  return Boolean(entry && (
    numberOrNull(entry.intakeCalories) !== null
    || (entry.meals || []).length
    || getFoodHabits(entry).length
    || entry.note
  ));
}

function getFoodHabits(entry) {
  return (entry?.habits || []).filter((habit) => foodHabitValues.includes(habit));
}

function getMealCaloriesFromForm(formData) {
  return {
    breakfast: numberOrNull(formData.get("breakfastCalories")),
    lunch: numberOrNull(formData.get("lunchCalories")),
    dinner: numberOrNull(formData.get("dinnerCalories")),
    snack: numberOrNull(formData.get("snackCalories")),
  };
}

function getMealCaloriesFromInputs() {
  return {
    breakfast: numberOrNull(document.querySelector("#breakfast-calories")?.value),
    lunch: numberOrNull(document.querySelector("#lunch-calories")?.value),
    dinner: numberOrNull(document.querySelector("#dinner-calories")?.value),
    snack: numberOrNull(document.querySelector("#snack-calories")?.value),
  };
}

function getMealCaloriesTotal(mealCalories = {}) {
  const values = Object.values(mealCalories).map(numberOrNull).filter((value) => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
}

function getMealCaloriesLabel(entry) {
  const mealCalories = entry.mealCalories || {};
  const labels = ["breakfast", "lunch", "dinner", "snack"]
    .map((meal) => {
      const value = numberOrNull(mealCalories[meal]);
      return value === null ? "" : `${getMealName(meal)}${Math.round(value)}kcal`;
    })
    .filter(Boolean);
  return labels.length ? labels.join(" / ") : "内訳なし";
}

function deriveMealScore(meals, foodHabits) {
  const mealCount = meals.length;
  const habitCount = foodHabits.length;
  if (mealCount >= 3 && habitCount >= 3) return 3;
  if (mealCount >= 2 || habitCount >= 2) return 2;
  return 1;
}

function getMealName(value) {
  const labels = { breakfast: "朝", lunch: "昼", dinner: "夜", snack: "間食" };
  return labels[value] || value;
}

function getFoodHabitLabel(value) {
  const labels = {
    water: "水分",
    protein: "たんぱく質",
    vegetables: "野菜・海藻",
    no_snack: "間食控えめ",
    slow_eating: "ゆっくり",
  };
  return labels[value] || value;
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
  const mealCalories = entry.mealCalories || {};
  document.querySelector("#breakfast-calories").value = mealCalories.breakfast ?? "";
  document.querySelector("#lunch-calories").value = mealCalories.lunch ?? "";
  document.querySelector("#dinner-calories").value = mealCalories.dinner ?? "";
  document.querySelector("#snack-calories").value = mealCalories.snack ?? "";
  document.querySelector("#intake-calories").value = entry.intakeCalories ?? "";
  document.querySelector("#burn-calories").value = entry.burnCalories ?? "";
  document.querySelector("#exercise-minutes").value = entry.exerciseMinutes ?? "";
  setExerciseTypeValue(entry.exerciseType ?? "");
  const intensity = entry.exerciseIntensity || "normal";
  const intensityInput = document.querySelector(`input[name="exerciseIntensity"][value="${intensity}"]`);
  if (intensityInput) intensityInput.checked = true;
  document.querySelector("#exercise-note").value = entry.exerciseNote ?? "";
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
  score += Math.min((entry.meals || []).length, 4) * 8;
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

function getRecordDayDate(date) {
  const adjusted = new Date(date);
  adjusted.setHours(adjusted.getHours() - recordDayBoundaryHour);
  return adjusted;
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

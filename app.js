const storageKey = "my-diet-notebook:v2";
const recordDayBoundaryHour = 3;
const today = getRecordDayDate(new Date());
const isoToday = toIsoDate(today);

const weightForm = document.querySelector("#weight-form");
const exerciseForm = document.querySelector("#exercise-form");
const foodForm = document.querySelector("#food-form");
const weightDateInput = document.querySelector("#weight-date");
const exerciseDateInput = document.querySelector("#exercise-date");
const foodDateInput = document.querySelector("#food-date");
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
const forgotPasswordButton = document.querySelector("#forgot-password");
const resendConfirmationButton = document.querySelector("#resend-confirmation");
const authFeedback = document.querySelector("#auth-feedback");
const authConfigHelp = document.querySelector("#auth-config-help");
const accountEmail = document.querySelector("#account-email");
const logoutButton = document.querySelector("#logout-button");
const emailChangeForm = document.querySelector("#email-change-form");
const newAccountEmail = document.querySelector("#new-account-email");
const passwordChangeForm = document.querySelector("#password-change-form");
const newAccountPassword = document.querySelector("#new-account-password");
const deleteAccountButton = document.querySelector("#delete-account");
const appShell = document.querySelector(".app-shell");
const onboarding = document.querySelector("#onboarding");
const onboardingForm = document.querySelector("#onboarding-form");
const settingsScreen = document.querySelector("#settings-screen");
const openSettingsButton = document.querySelector("#open-settings");
const closeSettingsButton = document.querySelector("#close-settings");
const settingsTabButtons = document.querySelectorAll("[data-settings-tab]");
const settingsPanels = document.querySelectorAll("[data-settings-panel]");
const profileForm = document.querySelector("#profile-form");
const profileFeedback = document.querySelector("#profile-feedback");
const saveExercisePresetButton = document.querySelector("#save-exercise-preset");
const exercisePresetNameInput = document.querySelector("#exercise-preset-name");
const cancelExercisePresetEditButton = document.querySelector("#cancel-exercise-preset-edit");
const exercisePresetList = document.querySelector("#exercise-preset-list");
const foodPresetList = document.querySelector("#food-preset-list");
const saveFoodPresetButton = document.querySelector("#save-food-preset");
const foodPresetNameInput = document.querySelector("#food-preset-name");
const cancelFoodPresetEditButton = document.querySelector("#cancel-food-preset-edit");
const rangeButtons = document.querySelectorAll("[data-range-days]");
const summaryCarouselTitle = document.querySelector("#summary-carousel-title");
const summaryCarouselPosition = document.querySelector("#summary-carousel-position");
const summaryCarouselMount = document.querySelector("#summary-carousel-mount");
const historyCarouselTitle = document.querySelector("#history-carousel-title");
const historyCarouselPosition = document.querySelector("#history-carousel-position");
const historyCarouselMount = document.querySelector("#history-carousel-mount");
const unifiedChartMount = document.querySelector("#unified-chart-mount");
const balanceFilterGroup = document.querySelector("#balance-filter-group");
const weightFilterGroup = document.querySelector("#weight-filter-group");
const weightModal = document.querySelector("#weight-modal");
const openWeightModalButtons = document.querySelectorAll("[data-open-weight-modal]");
const closeWeightModalButton = document.querySelector("#close-weight-modal");
const openExerciseModalButtons = document.querySelectorAll("[data-open-exercise-modal]");
const openFoodModalButtons = document.querySelectorAll("[data-open-food-modal]");
const openRecordMenuButtons = document.querySelectorAll("[data-open-record-menu]");
const recordMenuModal = document.querySelector("#record-menu-modal");
const closeRecordMenuButton = document.querySelector("#close-record-menu");
const undoToast = document.querySelector("#undo-toast");
const undoMessage = document.querySelector("#undo-message");
const undoDeleteButton = document.querySelector("#undo-delete");
const profileStorageKey = "my-diet-notebook:profile:v2";
const exercisePresetStorageKey = "my-diet-notebook:exercise-presets:v2";
const foodPresetStorageKey = "my-diet-notebook:food-presets:v1";
const deletedEntriesStorageKey = "my-diet-notebook:deleted-entries:v1";
const settingsUpdatedStorageKey = "my-diet-notebook:settings-updated:v1";
const legacyCloudTable = "diet_user_data";
const entriesCloudTable = "diet_entries";
const settingsCloudTable = "diet_user_settings";
const appConfig = window.MY_DIET_CONFIG || {};
const supabaseClient = hasSupabaseConfig() && window.supabase
  ? window.supabase.createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey)
  : null;
const foodHabitValues = ["water", "protein", "vegetables", "no_snack", "slow_eating"];
const exerciseHabitValues = ["walk", "stretch", "strength"];
const defaultFoodPresets = [
  { meal: "breakfast", label: "朝の定番", calories: 420, habits: ["water", "protein"], note: "朝はたんぱく質を入れる。" },
  { meal: "lunch", label: "昼の定番", calories: 650, habits: ["protein", "vegetables"], note: "昼は主食と野菜を揃える。" },
  { meal: "dinner", label: "夜の定番", calories: 700, habits: ["vegetables", "slow_eating"], note: "夜はゆっくり食べて整える。" },
  { meal: "snack", label: "間食控えめ", calories: 150, habits: ["no_snack"], note: "間食は軽めにする。" },
];

let activeUser = null;
let authMode = "login";
let entries = [];
let deletedEntries = {};
let profile = {};
let exercisePresets = getDefaultExercisePresets();
let foodPresets = getDefaultFoodPresets();
let settingsUpdatedAt = new Date(0).toISOString();
let comboChartRangeDays = 31;
let summaryCarouselIndex = 0;
let historyCarouselIndex = 0;
let chartView = "balance";
const balanceSeries = new Set(["intake", "burn", "weight"]);
const weightSeries = new Set(["morning", "night", "average", "goal"]);
let lastDeletion = null;
let undoTimer = null;
const dirtyEntryDates = new Set();
let settingsDirty = false;
let editingExercisePresetId = null;
let editingFoodPresetId = null;

[weightDateInput, exerciseDateInput, foodDateInput].forEach((input) => {
  input.value = isoToday;
});
const exerciseModal = createEntryModal(exerciseForm, "exercise-modal", "運動記録を閉じる");
const foodModal = createEntryModal(foodForm, "food-modal", "食事記録を閉じる");
setupRecordModalNavigation(exerciseForm, "weight", "運動", "food");
setupRecordModalNavigation(foodForm, "exercise", "食事", "weight");
setupUnifiedScreen();
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

weightForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(weightForm);
  const date = formData.get("date");
  setSaveFeedback("weight", "saving", "保存しています...");
  const entry = getOrCreateEntry(date);
  entry.weightMorning = numberOrNull(formData.get("weightMorning"));
  entry.weightNight = numberOrNull(formData.get("weightNight"));
  entry.weight = getPrimaryWeight(entry);
  entry.sleep = numberOrNull(formData.get("sleep"));
  commitEntry(entry);
  saveEntries();
  render();
  setSaveFeedback("weight", "success", getSaveSuccessMessage("weight"));
});

exerciseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(exerciseForm);
  const date = formData.get("date");
  setSaveFeedback("exercise", "saving", "保存しています...");
  const entry = getOrCreateEntry(date);
  const selectedExercise = formData.getAll("habits").filter((habit) => exerciseHabitValues.includes(habit));
  const preservedFood = entry.habits.filter((habit) => foodHabitValues.includes(habit));
  entry.burnCalories = numberOrNull(formData.get("burnCalories"));
  entry.exerciseMinutes = numberOrNull(formData.get("exerciseMinutes"));
  entry.exerciseType = String(formData.get("exerciseType") || "");
  entry.exerciseIntensity = String(formData.get("exerciseIntensity") || "normal");
  entry.exerciseNote = String(formData.get("exerciseNote") || "").trim();
  entry.habits = [...new Set([...preservedFood, ...selectedExercise])];
  commitEntry(entry);
  saveEntries();
  render();
  setSaveFeedback("exercise", "success", getSaveSuccessMessage("exercise"));
});

foodForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(foodForm);
  const date = formData.get("date");
  setSaveFeedback("food", "saving", "保存しています...");
  const entry = getOrCreateEntry(date);
  const preservedExercise = entry.habits.filter((habit) => exerciseHabitValues.includes(habit));
  entry.mealCalories = getMealCaloriesFromInputs();
  entry.intakeCalories = getMealCaloriesTotal(entry.mealCalories);
  entry.meals = getMealsFromCalories(entry.mealCalories);
  entry.meal = deriveMealScore(entry.meals, []);
  entry.habits = preservedExercise;
  entry.mood = "calm";
  entry.note = String(formData.get("note") || "").trim();
  commitEntry(entry);
  saveEntries();
  render();
  setSaveFeedback("food", "success", getSaveSuccessMessage("food"));
});

weightDateInput.addEventListener("change", () => {
  fillWeightFieldsForDate(weightDateInput.value);
});
exerciseDateInput.addEventListener("change", () => {
  fillExerciseFormForDate(exerciseDateInput.value);
});
foodDateInput.addEventListener("change", () => {
  fillFoodFormForDate(foodDateInput.value);
});

clearTodayButton.addEventListener("click", () => {
  const date = isoToday;
  if (!window.confirm("今日の体重・食事・運動記録をすべて削除しますか？")) return;
  const previous = entries.find((entry) => entry.date === date);
  if (previous) lastDeletion = { entry: structuredClone(previous), scope: "all" };
  markEntryDeleted(date);
  entries = entries.filter((item) => item.date !== date);
  saveEntries();
  fillAllFormsForDate(date);
  updateIntakeCaloriesTotal();
  render();
  showUndoToast("今日の記録を削除しました。");
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
    dirtyEntryDates.clear();
    settingsDirty = false;
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

forgotPasswordButton.addEventListener("click", async () => {
  if (!supabaseClient) return;
  const email = authEmail.value.trim();
  if (!email) {
    setAuthFeedback("error", "登録したメールアドレスを入力してください。");
    authEmail.focus();
    return;
  }
  setAuthBusy(true);
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl(),
  });
  setAuthBusy(false);
  setAuthFeedback(error ? "error" : "success", error
    ? "再設定メールを送れませんでした。少し待ってから試してください。"
    : "パスワード再設定メールを送りました。");
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

emailChangeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const { error } = await supabaseClient.auth.updateUser({ email: newAccountEmail.value.trim() });
  setCloudFeedback(error ? "error" : "success", error
    ? "メールアドレスを変更できませんでした。"
    : "確認メールを送りました。メール内のリンクを開くと変更されます。");
  if (!error) emailChangeForm.reset();
});

passwordChangeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const { error } = await supabaseClient.auth.updateUser({ password: newAccountPassword.value });
  setCloudFeedback(error ? "error" : "success", error
    ? "パスワードを変更できませんでした。"
    : "パスワードを変更しました。");
  if (!error) passwordChangeForm.reset();
});

deleteAccountButton.addEventListener("click", async () => {
  const confirmation = window.prompt("完全に削除するには「削除」と入力してください。");
  if (confirmation !== "削除") return;
  deleteAccountButton.disabled = true;
  const { error } = await supabaseClient.rpc("delete_my_account");
  deleteAccountButton.disabled = false;
  if (error) {
    setCloudFeedback("error", "アカウントを削除できませんでした。SQL設定を確認してください。");
    return;
  }
  clearCurrentUserCache();
  await supabaseClient.auth.signOut({ scope: "local" });
  location.reload();
});

openWeightModalButtons.forEach((button) => {
  button.addEventListener("click", openWeightModal);
});
openExerciseModalButtons.forEach((button) => {
  button.addEventListener("click", () => openEntryModal(exerciseModal, "exercise"));
});
openFoodModalButtons.forEach((button) => {
  button.addEventListener("click", () => openEntryModal(foodModal, "food"));
});
openRecordMenuButtons.forEach((button) => {
  button.addEventListener("click", openRecordMenu);
});
closeRecordMenuButton.addEventListener("click", closeRecordMenu);
recordMenuModal.addEventListener("click", (event) => {
  if (event.target === recordMenuModal) closeRecordMenu();
});
recordMenuModal.querySelectorAll("[data-record-choice]").forEach((button) => {
  button.addEventListener("click", () => {
    closeRecordMenu();
    if (button.dataset.recordChoice === "weight") {
      openWeightModal();
    } else if (button.dataset.recordChoice === "exercise") {
      openEntryModal(exerciseModal, "exercise");
    } else {
      openEntryModal(foodModal, "food");
    }
  });
});
document.querySelectorAll("[data-record-navigate]").forEach((button) => {
  button.addEventListener("click", () => switchRecordModal(button.dataset.recordNavigate));
});
closeWeightModalButton.addEventListener("click", closeWeightModal);
weightModal.addEventListener("click", (event) => {
  if (event.target === weightModal) closeWeightModal();
});

document.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-entry]");
  if (editButton) {
    editEntryScope(editButton.dataset.editEntry, editButton.dataset.entryDate);
    return;
  }
  const deleteButton = event.target.closest("[data-delete-entry]");
  if (deleteButton) {
    deleteEntryScope(deleteButton.dataset.deleteEntry, deleteButton.dataset.entryDate);
  }
});

undoDeleteButton.addEventListener("click", undoLastDeletion);

openSettingsButton.addEventListener("click", openSettings);
document.querySelector("#summary-prev").addEventListener("click", () => moveSummaryCarousel(-1));
document.querySelector("#summary-next").addEventListener("click", () => moveSummaryCarousel(1));
document.querySelector("#history-prev").addEventListener("click", () => moveHistoryCarousel(-1));
document.querySelector("#history-next").addEventListener("click", () => moveHistoryCarousel(1));
document.querySelectorAll("[data-chart-view]").forEach((button) => {
  button.addEventListener("click", () => {
    chartView = button.dataset.chartView;
    document.querySelectorAll("[data-chart-view]").forEach((item) => item.classList.toggle("is-active", item === button));
    updateChartView();
  });
});
document.querySelectorAll("[data-unified-range]").forEach((button) => {
  button.addEventListener("click", () => {
    comboChartRangeDays = Number(button.dataset.unifiedRange);
    document.querySelectorAll("[data-unified-range]").forEach((item) => item.classList.toggle("is-active", item === button));
    renderCalorieComboChart();
    renderWeightChart();
  });
});
document.querySelectorAll("[data-balance-series]").forEach((input) => {
  input.addEventListener("change", () => {
    toggleSeries(balanceSeries, input.dataset.balanceSeries, input.checked);
    renderCalorieComboChart();
  });
});
document.querySelectorAll("[data-weight-series]").forEach((input) => {
  input.addEventListener("change", () => {
    toggleSeries(weightSeries, input.dataset.weightSeries, input.checked);
    renderWeightChart();
  });
});
rangeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    comboChartRangeDays = Number(button.dataset.rangeDays);
    rangeButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderCalorieComboChart();
  });
});
if (saveExercisePresetButton) {
  saveExercisePresetButton.addEventListener("click", saveCurrentExerciseAsPreset);
}
cancelExercisePresetEditButton.addEventListener("click", cancelExercisePresetEdit);
if (saveFoodPresetButton) {
  saveFoodPresetButton.addEventListener("click", saveCurrentFoodAsPreset);
}
cancelFoodPresetEditButton.addEventListener("click", cancelFoodPresetEdit);
document.querySelectorAll("[data-meal-calorie-input]").forEach((input) => {
  input.addEventListener("input", updateIntakeCaloriesTotal);
});
foodForm.querySelectorAll('input[name="selectedMeal"]').forEach((input) => {
  input.addEventListener("change", () => showSelectedMealInput(input.value));
});
closeSettingsButton.addEventListener("click", closeSettings);
settingsTabButtons.forEach((button) => {
  button.addEventListener("click", () => switchSettingsTab(button.dataset.settingsTab));
});
settingsScreen.addEventListener("click", (event) => {
  if (event.target === settingsScreen) closeSettings();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !weightModal.hidden) {
    closeWeightModal();
    return;
  }
  if (event.key === "Escape" && !exerciseModal.hidden) {
    closeEntryModal(exerciseModal);
    return;
  }
  if (event.key === "Escape" && !foodModal.hidden) {
    closeEntryModal(foodModal);
    return;
  }
  if (event.key === "Escape" && !recordMenuModal.hidden) {
    closeRecordMenu();
    return;
  }
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
  touchSettings();
  if (setupWeight !== null && !entries.some((entry) => entry.date === isoToday)) {
    commitEntry({
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
    saveEntries();
  }

  onboarding.hidden = true;
  appShell.removeAttribute("inert");
  fillAllFormsForDate(isoToday);
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
  touchSettings();
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
    if (!Array.isArray(stored)) return [];
    return stored.map(normalizeExercisePreset).filter((preset) => preset.name);
  } catch {
    return [];
  }
}

function loadDeletedEntries() {
  try {
    const value = JSON.parse(localStorage.getItem(getUserStorageKey(deletedEntriesStorageKey))) || {};
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function saveDeletedEntries() {
  if (!activeUser) return;
  localStorage.setItem(getUserStorageKey(deletedEntriesStorageKey), JSON.stringify(deletedEntries));
}

function markEntryDeleted(date) {
  deletedEntries[date] = new Date().toISOString();
  dirtyEntryDates.add(date);
  saveDeletedEntries();
}

function loadSettingsUpdatedAt() {
  return localStorage.getItem(getUserStorageKey(settingsUpdatedStorageKey)) || new Date(0).toISOString();
}

function touchSettings() {
  settingsUpdatedAt = new Date().toISOString();
  settingsDirty = true;
  localStorage.setItem(getUserStorageKey(settingsUpdatedStorageKey), settingsUpdatedAt);
}

function getOrCreateEntry(date) {
  const previous = entries.find((item) => item.date === date);
  return {
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
}

function commitEntry(entry) {
  delete deletedEntries[entry.date];
  dirtyEntryDates.add(entry.date);
  saveDeletedEntries();
  entries = entries.filter((item) => item.date !== entry.date);
  entries.push(entry);
  entries.sort((a, b) => b.date.localeCompare(a.date));
}

function getDefaultExercisePresets() {
  return [];
}

function normalizeExercisePreset(preset) {
  return {
    id: typeof preset.id === "string" ? preset.id : createId(),
    name: normalizeExercisePresetName(preset),
    type: typeof preset.type === "string" ? preset.type : "",
    minutes: numberOrNull(preset.minutes) ?? 0,
    burnCalories: numberOrNull(preset.burnCalories) ?? 0,
    intensity: ["light", "normal", "hard"].includes(preset.intensity) ? preset.intensity : "normal",
    habits: Array.isArray(preset.habits) ? preset.habits.filter((habit) => exerciseHabitValues.includes(habit)) : [],
    note: typeof preset.note === "string" ? preset.note : "",
  };
}

function normalizeExercisePresetName(preset) {
  const fallback = getExerciseTypeLabel(preset?.type);
  const name = String(preset?.name || fallback || "運動プリセット")
    .replace(/^[日月火水木金土](?:曜|曜日)\s*/u, "")
    .trim();
  return (name || fallback || "運動プリセット").slice(0, 40);
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveExercisePresets() {
  if (!activeUser) return;
  localStorage.setItem(getUserStorageKey(exercisePresetStorageKey), JSON.stringify(exercisePresets));
}

function getDefaultFoodPresets() {
  return defaultFoodPresets.map((preset) => normalizeFoodPreset({
    name: preset.label,
    mealCalories: { [preset.meal]: preset.calories },
    meals: [preset.meal],
    habits: preset.habits,
    mood: "calm",
    note: preset.note,
  }));
}

function loadFoodPresets() {
  try {
    const stored = JSON.parse(localStorage.getItem(getUserStorageKey(foodPresetStorageKey)));
    return Array.isArray(stored) ? stored.map(normalizeFoodPreset).filter((preset) => preset.name) : getDefaultFoodPresets();
  } catch {
    return getDefaultFoodPresets();
  }
}

function normalizeFoodPreset(preset) {
  return {
    id: typeof preset.id === "string" ? preset.id : createId(),
    name: String(preset.name || preset.label || "").trim().slice(0, 40),
    mealCalories: preset.mealCalories && typeof preset.mealCalories === "object" ? preset.mealCalories : {},
    meals: Array.isArray(preset.meals) ? preset.meals : (preset.meal ? [preset.meal] : []),
    habits: Array.isArray(preset.habits) ? preset.habits.filter((habit) => foodHabitValues.includes(habit)) : [],
    mood: typeof preset.mood === "string" ? preset.mood : "calm",
    note: typeof preset.note === "string" ? preset.note : "",
  };
}

function saveFoodPresets() {
  if (!activeUser) return;
  localStorage.setItem(getUserStorageKey(foodPresetStorageKey), JSON.stringify(foodPresets));
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
  switchSettingsTab("profile");
  settingsScreen.hidden = false;
}

function closeSettings() {
  settingsScreen.hidden = true;
}

function switchSettingsTab(tabName) {
  settingsTabButtons.forEach((button) => {
    const isActive = button.dataset.settingsTab === tabName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  settingsPanels.forEach((panel) => {
    const isActive = panel.dataset.settingsPanel === tabName;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });
}

function setupUnifiedScreen() {
  document.body.append(weightModal);
  const summarySources = [
    { label: "概要", element: document.querySelector(".summary-grid") },
    { label: "体重", element: document.querySelector(".weight-summary-grid") },
    { label: "運動", element: document.querySelector(".exercise-summary-grid") },
    { label: "食事", element: document.querySelector(".food-summary-grid") },
  ];
  summarySources.forEach(({ label, element }, index) => {
    const slide = document.createElement("div");
    slide.className = "carousel-slide summary-carousel-slide";
    slide.dataset.carouselLabel = label;
    slide.hidden = index !== 0;
    slide.append(element);
    summaryCarouselMount.append(slide);
  });

  const support = document.querySelector("#unified-support");
  const insights = document.querySelector(".insights");
  const dailyStatus = document.querySelector(".daily-status-panel");
  if (insights) support.append(insights);
  if (dailyStatus) support.append(dailyStatus);
  const streak = document.createElement("div");
  streak.className = "streak-badge";
  streak.innerHTML = '<span>連続記録</span><strong id="record-streak">0日</strong>';
  support.append(streak);

  const caloriePanel = document.querySelector(".calorie-panel");
  const weightChartPanel = document.querySelector(".chart-panel");
  caloriePanel.classList.add("unified-chart-source");
  caloriePanel.dataset.chartPanel = "balance";
  weightChartPanel.classList.add("unified-chart-source");
  weightChartPanel.dataset.chartPanel = "weight";
  weightChartPanel.hidden = true;
  unifiedChartMount.append(caloriePanel, weightChartPanel);

  const allHistory = document.querySelector(".history-panel");
  const exerciseHistory = document.querySelector(".exercise-history-panel");
  const foodHistory = document.querySelector(".food-history-panel");
  const weightHistory = document.createElement("section");
  weightHistory.className = "panel history-panel";
  weightHistory.innerHTML = `
    <div class="panel-heading">
      <div><p class="section-kicker">Weight history</p><h2>体重履歴</h2></div>
    </div>
    <div id="weight-only-history-list" class="history-list"></div>
  `;
  [
    { label: "すべての履歴", element: allHistory },
    { label: "体重履歴", element: weightHistory },
    { label: "運動履歴", element: exerciseHistory },
    { label: "食事履歴", element: foodHistory },
  ].forEach(({ label, element }, index) => {
    const slide = document.createElement("div");
    slide.className = "carousel-slide history-carousel-slide";
    slide.dataset.carouselLabel = label;
    slide.hidden = index !== 0;
    slide.append(element);
    historyCarouselMount.append(slide);
  });

  document.querySelector("#app-content").remove();
  updateSummaryCarousel();
  updateHistoryCarousel();
  updateChartView();
}

function moveSummaryCarousel(direction) {
  summaryCarouselIndex = (summaryCarouselIndex + direction + 4) % 4;
  updateSummaryCarousel();
}

function updateSummaryCarousel() {
  const slides = Array.from(summaryCarouselMount.querySelectorAll(".carousel-slide"));
  slides.forEach((slide, index) => {
    slide.hidden = index !== summaryCarouselIndex;
  });
  summaryCarouselTitle.textContent = slides[summaryCarouselIndex]?.dataset.carouselLabel || "概要";
  summaryCarouselPosition.textContent = `${summaryCarouselIndex + 1} / ${slides.length}`;
}

function moveHistoryCarousel(direction) {
  historyCarouselIndex = (historyCarouselIndex + direction + 4) % 4;
  updateHistoryCarousel();
}

function updateHistoryCarousel() {
  const slides = Array.from(historyCarouselMount.querySelectorAll(".carousel-slide"));
  slides.forEach((slide, index) => {
    slide.hidden = index !== historyCarouselIndex;
  });
  historyCarouselTitle.textContent = slides[historyCarouselIndex]?.dataset.carouselLabel || "すべての履歴";
  historyCarouselPosition.textContent = `${historyCarouselIndex + 1} / ${slides.length}`;
}

function updateChartView() {
  document.querySelectorAll("[data-chart-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.chartPanel !== chartView;
  });
  balanceFilterGroup.hidden = chartView !== "balance";
  weightFilterGroup.hidden = chartView !== "weight";
  if (chartView === "weight") renderWeightChart();
  else renderCalorieComboChart();
}

function toggleSeries(seriesSet, key, enabled) {
  if (enabled) seriesSet.add(key);
  else seriesSet.delete(key);
}

function openWeightModal() {
  const selectedDate = weightDateInput.value || isoToday;
  weightDateInput.value = selectedDate;
  fillWeightFieldsForDate(selectedDate);
  setSaveFeedback("weight", "", "朝か夜の体重を入力して保存できます。");
  weightModal.hidden = false;
  document.body.classList.add("modal-open");
  closeWeightModalButton.focus();
}

function closeWeightModal() {
  weightModal.hidden = true;
  updateModalOpenState();
}

function openRecordMenu() {
  recordMenuModal.hidden = false;
  document.body.classList.add("modal-open");
  closeRecordMenuButton.focus();
}

function closeRecordMenu() {
  recordMenuModal.hidden = true;
  updateModalOpenState();
}

function createEntryModal(entryForm, id, closeLabel) {
  const modal = document.createElement("div");
  modal.id = id;
  modal.className = "record-modal";
  modal.hidden = true;
  document.body.append(modal);
  modal.append(entryForm);
  entryForm.hidden = false;
  entryForm.classList.add("record-modal-card");
  entryForm.setAttribute("role", "dialog");
  entryForm.setAttribute("aria-modal", "true");

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "ghost-button modal-form-close";
  closeButton.textContent = "閉じる";
  closeButton.setAttribute("aria-label", closeLabel);
  entryForm.prepend(closeButton);
  closeButton.addEventListener("click", () => closeEntryModal(modal));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeEntryModal(modal);
  });
  return modal;
}

function setupRecordModalNavigation(entryForm, previousScope, label, nextScope) {
  const nav = document.createElement("div");
  nav.className = "record-modal-nav";
  nav.setAttribute("aria-label", "記録画面の切り替え");
  nav.innerHTML = `
    <button type="button" data-record-navigate="${previousScope}" aria-label="${getRecordScopeLabel(previousScope)}記録へ">←</button>
    <strong>${label}</strong>
    <button type="button" data-record-navigate="${nextScope}" aria-label="${getRecordScopeLabel(nextScope)}記録へ">→</button>
  `;
  const closeButton = entryForm.querySelector(".modal-form-close");
  closeButton.after(nav);
}

function getRecordScopeLabel(scope) {
  return { weight: "体重", exercise: "運動", food: "食事" }[scope] || "";
}

function switchRecordModal(scope) {
  weightModal.hidden = true;
  exerciseModal.hidden = true;
  foodModal.hidden = true;
  if (scope === "weight") {
    openWeightModal();
  } else if (scope === "exercise") {
    openEntryModal(exerciseModal, "exercise", false);
  } else {
    openEntryModal(foodModal, "food", false);
  }
}

function openEntryModal(modal, scope, reloadSavedData = true) {
  if (reloadSavedData && scope === "exercise") {
    const date = exerciseDateInput.value || isoToday;
    exerciseDateInput.value = date;
    fillExerciseFormForDate(date);
  }
  if (reloadSavedData && scope === "food") {
    const date = foodDateInput.value || isoToday;
    foodDateInput.value = date;
    fillFoodFormForDate(date);
  }
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modal.querySelector(".modal-form-close")?.focus();
}

function closeEntryModal(modal) {
  modal.hidden = true;
  updateModalOpenState();
}

function updateModalOpenState() {
  const hasOpenModal = [recordMenuModal, weightModal, exerciseModal, foodModal, settingsScreen]
    .some((modal) => modal && !modal.hidden);
  document.body.classList.toggle("modal-open", hasOpenModal);
}

function editEntryScope(scope, date) {
  if (scope === "weight") {
    weightDateInput.value = date;
    fillWeightFieldsForDate(date);
    openWeightModal();
    return;
  }
  if (scope === "exercise") {
    exerciseDateInput.value = date;
    fillExerciseFormForDate(date);
    openEntryModal(exerciseModal, "exercise");
    return;
  }
  foodDateInput.value = date;
  fillFoodFormForDate(date);
  openEntryModal(foodModal, "food");
}

function deleteEntryScope(scope, date) {
  const previous = entries.find((entry) => entry.date === date);
  if (!previous) return;
  const labels = { weight: "体重・睡眠", exercise: "運動", food: "食事" };
  if (!window.confirm(`${formatDateLabel(date)}の${labels[scope]}記録を削除しますか？`)) return;

  lastDeletion = { entry: structuredClone(previous), scope };
  const entry = { ...previous, habits: [...(previous.habits || [])], updatedAt: new Date().toISOString() };
  if (scope === "weight") {
    entry.weight = null;
    entry.weightMorning = null;
    entry.weightNight = null;
    entry.sleep = null;
  } else if (scope === "exercise") {
    entry.burnCalories = null;
    entry.exerciseMinutes = null;
    entry.exerciseType = "";
    entry.exerciseIntensity = "normal";
    entry.exerciseNote = "";
    entry.habits = entry.habits.filter((habit) => !exerciseHabitValues.includes(habit));
  } else {
    entry.intakeCalories = null;
    entry.mealCalories = {};
    entry.meal = 2;
    entry.meals = [];
    entry.mood = "calm";
    entry.note = "";
    entry.habits = entry.habits.filter((habit) => !foodHabitValues.includes(habit));
  }

  if (isEntryEmpty(entry)) {
    markEntryDeleted(date);
    entries = entries.filter((item) => item.date !== date);
  } else {
    commitEntry(entry);
  }
  saveEntries();
  fillAllFormsForDate(date);
  render();
  showUndoToast(`${labels[scope]}記録を削除しました。`);
}

function isEntryEmpty(entry) {
  return !hasWeightEntry(entry) && !hasExerciseEntry(entry) && !hasFoodEntry(entry);
}

function showUndoToast(message) {
  if (!lastDeletion) return;
  window.clearTimeout(undoTimer);
  undoMessage.textContent = message;
  undoToast.hidden = false;
  undoTimer = window.setTimeout(() => {
    undoToast.hidden = true;
    lastDeletion = null;
  }, 8000);
}

function undoLastDeletion() {
  if (!lastDeletion?.entry) return;
  commitEntry({ ...lastDeletion.entry, updatedAt: new Date().toISOString() });
  saveEntries();
  fillAllFormsForDate(lastDeletion.entry.date);
  render();
  undoToast.hidden = true;
  lastDeletion = null;
  window.clearTimeout(undoTimer);
}

function fillWeightFieldsForDate(date) {
  const entry = entries.find((item) => item.date === date);
  document.querySelector("#weight-morning").value = entry?.weightMorning
    ?? (entry && (entry.weightNight === null || entry.weightNight === undefined) ? entry.weight ?? "" : "");
  document.querySelector("#weight-night").value = entry?.weightNight ?? "";
  document.querySelector("#sleep").value = entry?.sleep ?? "";
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
    const [entryResult, settingsResult] = await Promise.all([
      supabaseClient
        .from(entriesCloudTable)
        .select("entry_date,payload,updated_at,deleted_at")
        .eq("user_id", activeUser.id),
      supabaseClient
        .from(settingsCloudTable)
        .select("payload,updated_at")
        .eq("user_id", activeUser.id)
        .maybeSingle(),
    ]);
    if (entryResult.error) throw entryResult.error;
    if (settingsResult.error) throw settingsResult.error;

    let cloudRows = entryResult.data || [];
    let cloudSettings = settingsResult.data;
    if (!cloudRows.length && !cloudSettings) {
      const legacyData = await fetchLegacyCloudData();
      if (legacyData) {
        const legacyEntries = Array.isArray(legacyData) ? legacyData : legacyData.entries;
        entries = mergeEntries(entries, Array.isArray(legacyEntries) ? legacyEntries : []);
        if (legacyData.profile) profile = legacyData.profile;
        if (Array.isArray(legacyData.exercisePresets)) {
          exercisePresets = legacyData.exercisePresets.map(normalizeExercisePreset).filter((preset) => preset.name);
        }
        if (Array.isArray(legacyData.foodPresets)) {
          foodPresets = legacyData.foodPresets.map(normalizeFoodPreset).filter((preset) => preset.name);
        }
        settingsUpdatedAt = new Date().toISOString();
      }
      entries.forEach((entry) => dirtyEntryDates.add(entry.date));
      Object.keys(deletedEntries).forEach((date) => dirtyEntryDates.add(date));
      settingsDirty = true;
    } else {
      mergeCloudEntryRows(cloudRows);
      if (cloudSettings?.payload && new Date(cloudSettings.updated_at) >= new Date(settingsUpdatedAt)) {
        profile = cloudSettings.payload.profile || {};
        exercisePresets = Array.isArray(cloudSettings.payload.exercisePresets)
          ? cloudSettings.payload.exercisePresets.map(normalizeExercisePreset).filter((preset) => preset.name)
          : [];
        foodPresets = Array.isArray(cloudSettings.payload.foodPresets)
          ? cloudSettings.payload.foodPresets.map(normalizeFoodPreset).filter((preset) => preset.name)
          : getDefaultFoodPresets();
        settingsUpdatedAt = cloudSettings.updated_at;
      } else {
        settingsDirty = true;
      }
    }

    purgeLegacySampleData();
    entries.sort((a, b) => b.date.localeCompare(a.date));
    localStorage.setItem(getUserStorageKey(storageKey), JSON.stringify(entries));
    saveDeletedEntries();
    saveProfileToDevice();
    saveExercisePresets();
    saveFoodPresets();
    localStorage.setItem(getUserStorageKey(settingsUpdatedStorageKey), settingsUpdatedAt);
    await pushEntriesToCloud();
    setSyncState("同期済み");
    fillProfileForm();
    fillAllFormsForDate(isoToday);
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

  const rows = Array.from(dirtyEntryDates).map((date) => {
    const entry = entries.find((item) => item.date === date);
    if (entry) {
      return {
        user_id: activeUser.id,
        entry_date: date,
        payload: entry,
        updated_at: entry.updatedAt || new Date().toISOString(),
        deleted_at: null,
      };
    }
    const deletedAt = deletedEntries[date] || new Date().toISOString();
    return {
      user_id: activeUser.id,
      entry_date: date,
      payload: {},
      updated_at: deletedAt,
      deleted_at: deletedAt,
    };
  });

  if (rows.length) {
    const { error: entryError } = await supabaseClient
      .from(entriesCloudTable)
      .upsert(rows, { onConflict: "user_id,entry_date" });
    if (entryError) throw entryError;
    rows.forEach((row) => dirtyEntryDates.delete(row.entry_date));
  }

  if (settingsDirty) {
    const { error: settingsError } = await supabaseClient
      .from(settingsCloudTable)
      .upsert({
        user_id: activeUser.id,
        payload: { profile, exercisePresets, foodPresets },
        updated_at: settingsUpdatedAt,
      }, { onConflict: "user_id" });
    if (settingsError) throw settingsError;
    settingsDirty = false;
  }
  setSyncState("同期済み");
}

function mergeCloudEntryRows(rows) {
  const localByDate = new Map(entries.map((entry) => [entry.date, entry]));
  const cloudDates = new Set(rows.map((row) => row.entry_date));
  rows.forEach((row) => {
    const date = row.entry_date;
    const localEntry = localByDate.get(date);
    const localUpdatedAt = localEntry?.updatedAt || new Date(0).toISOString();
    const localDeletedAt = deletedEntries[date] || new Date(0).toISOString();
    const localLatest = new Date(localDeletedAt) > new Date(localUpdatedAt) ? localDeletedAt : localUpdatedAt;
    const cloudLatest = row.deleted_at || row.updated_at || new Date(0).toISOString();
    if (new Date(cloudLatest) < new Date(localLatest)) {
      dirtyEntryDates.add(date);
      return;
    }

    if (row.deleted_at) {
      localByDate.delete(date);
      deletedEntries[date] = row.deleted_at;
      return;
    }

    const normalized = normalizeEntryWeights({ ...(row.payload || {}), date, updatedAt: row.updated_at });
    localByDate.set(date, normalized);
    delete deletedEntries[date];
  });
  localByDate.forEach((_entry, date) => {
    if (!cloudDates.has(date)) dirtyEntryDates.add(date);
  });
  Object.keys(deletedEntries).forEach((date) => {
    if (!cloudDates.has(date)) dirtyEntryDates.add(date);
  });
  entries = Array.from(localByDate.values());
}

async function fetchLegacyCloudData() {
  const { data, error } = await supabaseClient
    .from(legacyCloudTable)
    .select("payload")
    .eq("user_id", activeUser.id)
    .maybeSingle();
  if (error) return null;
  return data?.payload || null;
}

function getCloudErrorMessage(error) {
  const message = String(error?.message || "");
  if (message.includes("does not exist") || message.includes("Could not find the table")) {
    return "Supabaseの同期テーブルが見つかりません。SUPABASE_SETUP.sqlを実行してください。";
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
  supabaseClient.auth.onAuthStateChange((event, session) => {
    window.setTimeout(async () => {
      await applySession(session);
      if (event === "PASSWORD_RECOVERY") {
        openSettings();
        newAccountPassword.focus();
        setCloudFeedback("loading", "新しいパスワードを設定してください。");
      }
    }, 0);
  });
}

async function applySession(session) {
  const nextUser = session?.user || null;
  if (nextUser?.id === activeUser?.id) return;

  activeUser = nextUser;
  if (!activeUser) {
    entries = [];
    deletedEntries = {};
    profile = {};
    exercisePresets = getDefaultExercisePresets();
    foodPresets = getDefaultFoodPresets();
    settingsUpdatedAt = new Date(0).toISOString();
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
  dirtyEntryDates.clear();
  settingsDirty = false;
  importLegacyDeviceData();
  entries = loadEntries();
  deletedEntries = loadDeletedEntries();
  profile = loadProfile();
  exercisePresets = loadExercisePresets();
  foodPresets = loadFoodPresets();
  settingsUpdatedAt = loadSettingsUpdatedAt();
  purgeLegacySampleData();
  accountEmail.textContent = activeUser.email || activeUser.id;
  fillProfileForm();
  fillAllFormsForDate(isoToday);
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

function clearCurrentUserCache() {
  if (!activeUser) return;
  [
    storageKey,
    profileStorageKey,
    exercisePresetStorageKey,
    foodPresetStorageKey,
    deletedEntriesStorageKey,
    settingsUpdatedStorageKey,
  ].forEach((key) => localStorage.removeItem(getUserStorageKey(key)));
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
  forgotPasswordButton.disabled = isBusy;
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
  renderWeightOnlyHistory();
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

  const selected = entries.find((entry) => entry.date === isoToday);
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
  renderWeeklyReport(weekEntries);
}

function renderWeeklyReport(weekEntries) {
  const streak = getStreak();
  const element = document.querySelector("#record-streak");
  if (element) element.textContent = `${streak}日`;
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
    .filter((item) => (
      (balanceSeries.has("intake") && numberOrNull(item.intakeCalories) !== null)
      || (balanceSeries.has("burn") && numberOrNull(item.burnCalories) !== null)
      || (balanceSeries.has("weight") && hasWeightEntry(item))
    ))
    .filter((item) => isWithinRange(item.date, comboChartRangeDays))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  const points = sampleChartPoints(rangePoints, 120);

  svg.innerHTML = '<title id="calorie-chart-title">摂取カロリーは線グラフ、消費カロリーは棒グラフ、体重は線グラフ</title>';
  if (!points.length || !balanceSeries.size) {
    svg.hidden = true;
    empty.hidden = false;
    return;
  }

  svg.hidden = false;
  empty.hidden = true;

  const width = 720;
  const height = 260;
  const pad = { top: 24, right: 58, bottom: 42, left: 58 };
  const calorieValues = points.flatMap((point) => [
    balanceSeries.has("intake") ? point.intakeCalories : null,
    balanceSeries.has("burn") ? point.burnCalories : null,
  ]).filter((value) => value !== null);
  const weightValues = balanceSeries.has("weight") ? points.map(getPrimaryWeight).filter((value) => value !== null) : [];
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
  const bars = balanceSeries.has("burn") ? points.map((point, index) => {
    const value = point.burnCalories || 0;
    const barHeight = Math.max(0, pad.top + innerHeight - y(value));
    const x = xCenter(index) - barWidth / 2;
    return `<rect class="calorie-burn-bar" x="${x.toFixed(1)}" y="${y(value).toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" rx="6"><title>${formatDateLabel(point.date)} 消費 ${Math.round(value)}kcal</title></rect>`;
  }).join("") : "";
  const dots = balanceSeries.has("intake") ? points
    .map((point, index) => {
      const intake = numberOrNull(point.intakeCalories);
      return intake === null ? "" : `<circle class="calorie-intake-dot" cx="${xCenter(index).toFixed(1)}" cy="${y(intake).toFixed(1)}" r="4"><title>${formatDateLabel(point.date)} 摂取 ${Math.round(intake)}kcal</title></circle>`;
    })
    .join("") : "";
  const weightDots = balanceSeries.has("weight") ? points
    .map((point, index) => {
      const weight = getPrimaryWeight(point);
      return weight === null ? "" : `<circle class="combo-weight-dot" cx="${xCenter(index).toFixed(1)}" cy="${yWeight(weight).toFixed(1)}" r="4"><title>${formatDateLabel(point.date)} 体重 ${weight.toFixed(1)}kg</title></circle>`;
    })
    .join("") : "";
  const grid = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = Math.round(max * (1 - ratio));
    const yy = pad.top + innerHeight * ratio;
    return `<g><line class="chart-grid" x1="${pad.left}" y1="${yy}" x2="${width - pad.right}" y2="${yy}"></line><text class="chart-label" x="10" y="${yy + 4}">${value}</text></g>`;
  }).join("");
  const weightAxis = balanceSeries.has("weight") ? [0, 0.5, 1].map((ratio) => {
    const value = maxWeight - weightRange * ratio;
    const yy = pad.top + innerHeight * ratio;
    return `<text class="chart-label combo-weight-axis" x="${width - 10}" y="${yy + 4}" text-anchor="end">${value.toFixed(1)}kg</text>`;
  }).join("") : "";
  const labelInterval = Math.max(1, Math.ceil(points.length / 8));
  const labels = points.map((point, index) => {
    if (points.length > 8 && index !== 0 && index !== points.length - 1 && index % labelInterval !== 0) return "";
    return `<text class="chart-label" x="${xCenter(index).toFixed(1)}" y="${height - 12}" text-anchor="middle">${formatShortDate(point.date)}</text>`;
  }).join("");

  svg.insertAdjacentHTML("beforeend", `
    ${grid}
    ${bars}
    ${balanceSeries.has("intake") ? `<path class="calorie-intake-line" d="${linePoints}"></path>` : ""}
    ${dots}
    ${balanceSeries.has("weight") ? `<path class="combo-weight-line" d="${weightLinePoints}"></path>` : ""}
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
          <div class="history-actions">
            <button type="button" data-edit-entry="weight" data-entry-date="${entry.date}">体重を編集</button>
            <button type="button" data-delete-entry="weight" data-entry-date="${entry.date}">体重を削除</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderWeightOnlyHistory() {
  const list = document.querySelector("#weight-only-history-list");
  if (!list) return;
  const weightEntries = entries.filter(hasWeightEntry).slice(0, 14);
  if (!weightEntries.length) {
    list.innerHTML = '<p class="empty">まだ体重記録がありません。</p>';
    return;
  }
  list.innerHTML = weightEntries
    .map((entry) => `
      <article class="history-item">
        <div class="history-date">${formatDateLabel(entry.date)}</div>
        <div class="history-detail">${getWeightHistoryLabel(entry)} / ${entry.sleep === null ? "睡眠未入力" : `${entry.sleep}時間睡眠`}</div>
        <div class="history-actions">
          <button type="button" data-edit-entry="weight" data-entry-date="${entry.date}">編集</button>
          <button type="button" data-delete-entry="weight" data-entry-date="${entry.date}">削除</button>
        </div>
      </article>
    `)
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
  const todayEntry = entries.find((entry) => entry.date === isoToday);

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
  if (!exercisePresets.length) {
    exercisePresetList.innerHTML = '<p class="empty preset-empty">まだプリセットがありません。下の運動内容とプリセット名を入力して追加できます。</p>';
    return;
  }

  exercisePresetList.innerHTML = exercisePresets
    .map((preset) => `
      <article class="preset-card exercise-preset-card">
        <button class="preset-apply-button" type="button" data-preset-id="${escapeHtml(preset.id)}">
          <span>${escapeHtml(preset.name)}</span>
          <strong>${getExerciseTypeLabel(preset.type)}</strong>
          <small>${preset.minutes}分 / ${preset.burnCalories}kcal / ${getExerciseIntensityLabel(preset.intensity)}</small>
        </button>
        <div class="preset-card-actions">
          <button type="button" data-edit-preset-id="${escapeHtml(preset.id)}" aria-label="${escapeHtml(preset.name)}を編集">編集</button>
          <button type="button" data-delete-preset-id="${escapeHtml(preset.id)}" aria-label="${escapeHtml(preset.name)}を削除">削除</button>
        </div>
      </article>
    `)
    .join("");

  exercisePresetList.querySelectorAll("[data-preset-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = exercisePresets.find((item) => item.id === button.dataset.presetId);
      applyExercisePreset(preset);
      setSaveFeedback("exercise", "success", `${preset.name}を入力しました。運動を保存すると記録に残ります。`);
    });
  });

  exercisePresetList.querySelectorAll("[data-delete-preset-id]").forEach((button) => {
    button.addEventListener("click", () => {
      exercisePresets = exercisePresets.filter((item) => item.id !== button.dataset.deletePresetId);
      if (editingExercisePresetId === button.dataset.deletePresetId) cancelExercisePresetEdit();
      saveExercisePresets();
      touchSettings();
      syncExercisePresets();
      renderExercisePresets();
      setSaveFeedback("exercise", "success", "プリセットを削除しました。");
    });
  });
  exercisePresetList.querySelectorAll("[data-edit-preset-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = exercisePresets.find((item) => item.id === button.dataset.editPresetId);
      beginExercisePresetEdit(preset);
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applyExercisePreset(preset) {
  if (!preset) return;
  document.querySelector("#exercise-minutes").value = preset.minutes;
  document.querySelector("#burn-calories").value = preset.burnCalories;
  setExerciseTypeValue(preset.type);
  const intensityInput = document.querySelector(`input[name="exerciseIntensity"][value="${preset.intensity}"]`);
  if (intensityInput) intensityInput.checked = true;
  document.querySelector("#exercise-note").value = preset.note;
  exerciseForm.querySelectorAll('input[name="habits"]').forEach((checkbox) => {
    if (exerciseHabitValues.includes(checkbox.value)) checkbox.checked = preset.habits.includes(checkbox.value);
  });
}

function saveCurrentExerciseAsPreset() {
  const name = exercisePresetNameInput.value.trim();
  if (!name) {
    setSaveFeedback("exercise", "error", "プリセット名を入力してください。");
    exercisePresetNameInput.focus();
    return;
  }

  const preset = normalizeExercisePreset({
    id: editingExercisePresetId || createId(),
    name,
    type: document.querySelector("#exercise-type")?.value || "",
    minutes: document.querySelector("#exercise-minutes")?.value || 0,
    burnCalories: document.querySelector("#burn-calories")?.value || 0,
    intensity: document.querySelector('input[name="exerciseIntensity"]:checked')?.value || "normal",
    habits: Array.from(exerciseForm.querySelectorAll('input[name="habits"]:checked'))
      .map((checkbox) => checkbox.value)
      .filter((habit) => exerciseHabitValues.includes(habit)),
    note: document.querySelector("#exercise-note")?.value.trim() || "",
  });

  if (editingExercisePresetId) {
    exercisePresets = exercisePresets.map((item) => item.id === editingExercisePresetId ? preset : item);
  } else {
    exercisePresets.push(preset);
  }
  saveExercisePresets();
  touchSettings();
  syncExercisePresets();
  const wasEditing = Boolean(editingExercisePresetId);
  cancelExercisePresetEdit();
  renderExercisePresets();
  setSaveFeedback("exercise", "success", `${preset.name}をプリセット${wasEditing ? "更新" : "に追加"}しました。`);
}

function beginExercisePresetEdit(preset) {
  if (!preset) return;
  editingExercisePresetId = preset.id;
  applyExercisePreset(preset);
  exercisePresetNameInput.value = preset.name;
  saveExercisePresetButton.textContent = "プリセットを更新";
  cancelExercisePresetEditButton.hidden = false;
  exercisePresetNameInput.focus();
}

function cancelExercisePresetEdit() {
  editingExercisePresetId = null;
  exercisePresetNameInput.value = "";
  saveExercisePresetButton.textContent = "現在の内容をプリセットに追加";
  cancelExercisePresetEditButton.hidden = true;
}

function syncExercisePresets() {
  if (activeUser) {
    pushEntriesToCloud().catch((error) => {
      setSaveFeedback("exercise", "error", getCloudErrorMessage(error));
    });
  }
}

function setExerciseTypeValue(value) {
  const select = document.querySelector("#exercise-type");
  if (!select) return;
  const option = Array.from(select.options).find((item) => item.value === value);
  select.value = option ? value : "";
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
        <div class="history-actions">
          <button type="button" data-edit-entry="exercise" data-entry-date="${entry.date}">編集</button>
          <button type="button" data-delete-entry="exercise" data-entry-date="${entry.date}">削除</button>
        </div>
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
  const todayEntry = entries.find((entry) => entry.date === isoToday);
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
  if (!foodPresets.length) {
    foodPresetList.innerHTML = '<p class="empty preset-empty">まだ食事プリセットがありません。</p>';
    return;
  }
  foodPresetList.innerHTML = foodPresets
    .map((preset) => `
      <article class="preset-card exercise-preset-card">
        <button class="preset-apply-button" type="button" data-food-preset="${escapeHtml(preset.id)}">
          <span>${escapeHtml(preset.name)}</span>
          <strong>${getMealLogLabel(preset.meals)}</strong>
          <small>${getMealCaloriesTotal(preset.mealCalories) ?? 0}kcal</small>
        </button>
        <div class="preset-card-actions">
          <button type="button" data-edit-food-preset="${escapeHtml(preset.id)}" aria-label="${escapeHtml(preset.name)}を編集">編集</button>
          <button type="button" data-delete-food-preset="${escapeHtml(preset.id)}" aria-label="${escapeHtml(preset.name)}を削除">削除</button>
        </div>
      </article>
    `)
    .join("");

  foodPresetList.querySelectorAll("[data-food-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = foodPresets.find((item) => item.id === button.dataset.foodPreset);
      applyFoodPreset(preset);
      setSaveFeedback("food", "success", `${preset.name}を入力しました。保存すると記録に残ります。`);
    });
  });
  foodPresetList.querySelectorAll("[data-delete-food-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      foodPresets = foodPresets.filter((item) => item.id !== button.dataset.deleteFoodPreset);
      if (editingFoodPresetId === button.dataset.deleteFoodPreset) cancelFoodPresetEdit();
      saveFoodPresets();
      touchSettings();
      syncExercisePresets();
      renderFoodPresets();
    });
  });
  foodPresetList.querySelectorAll("[data-edit-food-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = foodPresets.find((item) => item.id === button.dataset.editFoodPreset);
      beginFoodPresetEdit(preset);
    });
  });
}

function applyFoodPreset(preset) {
  if (!preset) return;
  ["breakfast", "lunch", "dinner", "snack"].forEach((meal) => {
    document.querySelector(`#${meal}-calories`).value = preset.mealCalories[meal] ?? "";
  });
  foodForm.querySelectorAll('input[name="meals"]').forEach((checkbox) => {
    checkbox.checked = preset.meals.includes(checkbox.value);
  });
  const selectedMeal = preset.meals.find((meal) => numberOrNull(preset.mealCalories[meal]) !== null)
    || preset.meals[0]
    || "breakfast";
  selectMealInput(selectedMeal);
  document.querySelector("#note").value = preset.note;
  updateIntakeCaloriesTotal();
}

function saveCurrentFoodAsPreset() {
  const name = foodPresetNameInput.value.trim();
  if (!name) {
    setSaveFeedback("food", "error", "プリセット名を入力してください。");
    foodPresetNameInput.focus();
    return;
  }
  const formData = new FormData(foodForm);
  const mealCalories = getMealCaloriesFromInputs();
  const preset = normalizeFoodPreset({
    id: editingFoodPresetId || createId(),
    name,
    mealCalories: { ...mealCalories },
    meals: getMealsFromCalories(mealCalories),
    habits: [],
    mood: "calm",
    note: String(formData.get("note") || "").trim(),
  });
  if (editingFoodPresetId) {
    foodPresets = foodPresets.map((item) => item.id === editingFoodPresetId ? preset : item);
  } else {
    foodPresets.push(preset);
  }
  saveFoodPresets();
  touchSettings();
  syncExercisePresets();
  const wasEditing = Boolean(editingFoodPresetId);
  cancelFoodPresetEdit();
  renderFoodPresets();
  setSaveFeedback("food", "success", `${preset.name}をプリセット${wasEditing ? "更新" : "に追加"}しました。`);
}

function beginFoodPresetEdit(preset) {
  if (!preset) return;
  editingFoodPresetId = preset.id;
  applyFoodPreset(preset);
  foodPresetNameInput.value = preset.name;
  saveFoodPresetButton.textContent = "プリセットを更新";
  cancelFoodPresetEditButton.hidden = false;
  foodPresetNameInput.focus();
}

function cancelFoodPresetEdit() {
  editingFoodPresetId = null;
  foodPresetNameInput.value = "";
  saveFoodPresetButton.textContent = "現在の内容をプリセットに追加";
  cancelFoodPresetEditButton.hidden = true;
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
        <div class="history-actions">
          <button type="button" data-edit-entry="food" data-entry-date="${entry.date}">編集</button>
          <button type="button" data-delete-entry="food" data-entry-date="${entry.date}">削除</button>
        </div>
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

function getMealCaloriesFromInputs() {
  const values = {};
  ["breakfast", "lunch", "dinner", "snack"].forEach((meal) => {
    const input = foodForm.querySelector(`#${meal}-calories`);
    values[meal] = numberOrNull(input?.value);
  });
  return values;
}

function selectMealInput(meal) {
  const input = foodForm.querySelector(`input[name="selectedMeal"][value="${meal}"]`);
  if (input) input.checked = true;
  showSelectedMealInput(meal);
}

function showSelectedMealInput(meal) {
  foodForm.querySelectorAll("[data-meal-input-card]").forEach((card) => {
    card.hidden = card.dataset.mealInputCard !== meal;
  });
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
  const points = sampleChartPoints(
    entries
      .filter(hasWeightEntry)
      .filter((entry) => isWithinRange(entry.date, comboChartRangeDays))
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date)),
    120,
  );

  svg.innerHTML = '<title id="weight-chart-title">体重の推移グラフ</title>';
  if (points.length < 2 || !weightSeries.size) {
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
    .flatMap((point) => [
      weightSeries.has("average") ? getPrimaryWeight(point) : null,
      weightSeries.has("morning") ? numberOrNull(point.weightMorning) : null,
      weightSeries.has("night") ? numberOrNull(point.weightNight) : null,
    ])
    .filter((weight) => weight !== null);
  const goalWeight = numberOrNull(profile.goalWeight);
  if (goalWeight !== null && weightSeries.has("goal")) weights.push(goalWeight);
  if (!weights.length) {
    svg.hidden = true;
    empty.hidden = false;
    return;
  }
  const min = Math.floor(Math.min(...weights) - 0.5);
  const max = Math.ceil(Math.max(...weights) + 0.5);
  const range = Math.max(1, max - min);
  const xStep = (width - pad.left - pad.right) / Math.max(1, points.length - 1);
  const x = (index) => pad.left + index * xStep;
  const y = (weight) => pad.top + ((max - weight) / range) * (height - pad.top - pad.bottom);
  const morningPath = buildWeightPath(points, x, y, (point) => numberOrNull(point.weightMorning));
  const nightPath = buildWeightPath(points, x, y, (point) => numberOrNull(point.weightNight));
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
  const morningDots = weightSeries.has("morning") ? buildWeightDots(points, x, y, (point) => numberOrNull(point.weightMorning), "chart-morning-dot", "朝") : "";
  const nightDots = weightSeries.has("night") ? buildWeightDots(points, x, y, (point) => numberOrNull(point.weightNight), "chart-night-dot", "夜") : "";
  const goalLine = goalWeight === null || !weightSeries.has("goal") ? "" : `
    <line class="chart-goal-line" x1="${pad.left}" y1="${y(goalWeight)}" x2="${width - pad.right}" y2="${y(goalWeight)}"></line>
    <text class="chart-goal-label" x="${width - pad.right}" y="${y(goalWeight) - 7}" text-anchor="end">目標 ${goalWeight.toFixed(1)}kg</text>
  `;

  svg.insertAdjacentHTML("beforeend", `
    ${grid}
    ${goalLine}
    ${weightSeries.has("average") ? `<path class="chart-average" d="${averagePath}"></path>` : ""}
    ${weightSeries.has("morning") && morningPath ? `<path class="chart-morning-line" d="${morningPath}"></path>` : ""}
    ${weightSeries.has("night") && nightPath ? `<path class="chart-night-line" d="${nightPath}"></path>` : ""}
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

function fillAllFormsForDate(date) {
  weightDateInput.value = date;
  exerciseDateInput.value = date;
  foodDateInput.value = date;
  fillWeightFieldsForDate(date);
  fillExerciseFormForDate(date);
  fillFoodFormForDate(date);
}

function getMealsFromCalories(mealCalories = {}) {
  return ["breakfast", "lunch", "dinner", "snack"]
    .filter((meal) => numberOrNull(mealCalories[meal]) !== null);
}

function fillExerciseFormForDate(date) {
  const entry = entries.find((item) => item.date === date);
  exerciseForm.reset();
  exerciseDateInput.value = date;
  document.querySelector("#burn-calories").value = entry?.burnCalories ?? "";
  document.querySelector("#exercise-minutes").value = entry?.exerciseMinutes ?? "";
  setExerciseTypeValue(entry?.exerciseType ?? "");
  const intensity = entry?.exerciseIntensity || "normal";
  const intensityInput = exerciseForm.querySelector(`input[name="exerciseIntensity"][value="${intensity}"]`);
  if (intensityInput) intensityInput.checked = true;
  document.querySelector("#exercise-note").value = entry?.exerciseNote ?? "";
  exerciseForm.querySelectorAll('input[name="habits"]').forEach((checkbox) => {
    checkbox.checked = (entry?.habits || []).includes(checkbox.value);
  });
}

function fillFoodFormForDate(date) {
  const entry = entries.find((item) => item.date === date);
  foodForm.reset();
  foodDateInput.value = date;
  const mealCalories = entry?.mealCalories || {};
  document.querySelector("#breakfast-calories").value = mealCalories.breakfast ?? "";
  document.querySelector("#lunch-calories").value = mealCalories.lunch ?? "";
  document.querySelector("#dinner-calories").value = mealCalories.dinner ?? "";
  document.querySelector("#snack-calories").value = mealCalories.snack ?? "";
  document.querySelector("#intake-calories").value = entry?.intakeCalories ?? "";
  document.querySelector("#note").value = entry?.note ?? "";
  selectMealInput(getMealsFromCalories(mealCalories)[0] || "breakfast");
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

const storageKey = "my-diet-notebook:v2";
const recordDayBoundaryHour = 3;
const stepsPerWalkingMinute = 100;
const walkingStrideHeightRatio = 0.415;
const walkingCaloriesPerKgKm = 0.5;
const fallbackWalkingHeightCm = 165;
const fallbackWalkingWeightKg = 60;
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
const copyPreviousMealButton = document.querySelector("#copy-previous-meal");
const recentFoodList = document.querySelector("#recent-food-list");
const pendingSyncCount = document.querySelector("#pending-sync-count");
const appSettingsFeedback = document.querySelector("#app-settings-feedback");
const importBackupFile = document.querySelector("#import-backup-file");
const fitbitConnectButton = document.querySelector("#fitbit-connect");
const fitbitSyncButton = document.querySelector("#fitbit-sync");
const fitbitDisconnectButton = document.querySelector("#fitbit-disconnect");
const fitbitStatus = document.querySelector("#fitbit-status");
const fitbitLastSync = document.querySelector("#fitbit-last-sync");
const saveFoodPresetButton = document.querySelector("#save-food-preset");
const cancelFoodPresetEditButton = document.querySelector("#cancel-food-preset-edit");
const rangeButtons = document.querySelectorAll("[data-range-days]");
const summaryCarouselMount = document.querySelector("#summary-carousel-mount");
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
const openAssistantRecordButtons = document.querySelectorAll("[data-open-assistant-record]");
const assistantRecordModal = document.querySelector("#assistant-record-modal");
const assistantRecordForm = document.querySelector("#assistant-record-form");
const assistantRecordDate = document.querySelector("#assistant-record-date");
const closeAssistantRecordButton = document.querySelector("#close-assistant-record");
const assistantRecordFeedback = document.querySelector("#assistant-record-feedback");
const assistantRecordSummary = document.querySelector("#assistant-record-summary");
const assistantSyncStatus = document.querySelector("#assistant-sync-status");
const assistantPendingSyncCount = document.querySelector("#assistant-pending-sync-count");
const undoToast = document.querySelector("#undo-toast");
const undoMessage = document.querySelector("#undo-message");
const undoDeleteButton = document.querySelector("#undo-delete");
const addExerciseItemButton = document.querySelector("#add-exercise-item");
const exerciseItemList = document.querySelector("#exercise-item-list");
const exerciseItemsTotal = document.querySelector("#exercise-items-total");
const addFoodItemButton = document.querySelector("#add-food-item");
const foodItemList = document.querySelector("#food-item-list");
const selectedMealItemCount = document.querySelector("#selected-meal-item-count");
const profileStorageKey = "my-diet-notebook:profile:v2";
const exercisePresetStorageKey = "my-diet-notebook:exercise-presets:v2";
const foodPresetStorageKey = "my-diet-notebook:food-presets:v1";
const presetSeedStorageKey = "my-diet-notebook:preset-seed-version:v1";
const currentPresetSeedVersion = 1;
const deletedEntriesStorageKey = "my-diet-notebook:deleted-entries:v1";
const settingsUpdatedStorageKey = "my-diet-notebook:settings-updated:v1";
const legacyCloudTable = "diet_user_data";
const entriesCloudTable = "diet_entries";
const settingsCloudTable = "diet_user_settings";
const appConfig = window.MY_DIET_CONFIG || {};
const supabaseClient = hasSupabaseConfig() && window.supabase
  ? window.supabase.createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey)
  : null;
const exerciseHabitValues = ["walk", "stretch", "strength"];
let activeUser = null;
let authMode = "login";
let entries = [];
let deletedEntries = {};
let profile = {};
let exercisePresets = getDefaultExercisePresets();
let foodPresets = getDefaultFoodPresets();
let appliedPresetSeedVersion = 0;
let settingsUpdatedAt = new Date(0).toISOString();
let comboChartRangeDays = 7;
let chartView = "balance";
const balanceSeries = new Set(["intake", "burn", "weight"]);
const weightSeries = new Set(["morning", "night", "average", "goal"]);
let lastDeletion = null;
let undoTimer = null;
const dirtyEntryDates = new Set();
let settingsDirty = false;
let editingExercisePresetId = null;
let selectedExercisePresetId = null;
let editingFoodPresetId = null;
let selectedFoodMeal = "breakfast";
let foodMealItemsDraft = createEmptyMealItems();
let exerciseItemsDraft = [];
let deferredInstallPrompt = null;
let fitbitConnected = false;

[weightDateInput, exerciseDateInput, foodDateInput].forEach((input) => {
  input.value = isoToday;
});
assistantRecordDate.value = isoToday;
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
registerServiceWorker();
restoreReminderSettings();

window.addEventListener("focus", () => {
  if (activeUser) syncFromCloud();
});
window.addEventListener("online", () => {
  setSyncState("再接続・同期中");
  if (activeUser) syncFromCloud().catch(() => {});
});
window.addEventListener("offline", () => setSyncState("オフライン保存中"));
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.querySelector("#install-app").hidden = false;
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
  entry.exerciseItems = normalizeExerciseItems(exerciseItemsDraft);
  entry.burnCalories = sumExerciseItems(entry.exerciseItems, "burnCalories");
  entry.exerciseMinutes = sumExerciseItems(entry.exerciseItems, "minutes");
  entry.exerciseName = entry.exerciseItems[0]?.name || "";
  entry.exerciseType = "";
  entry.habits = [];
  commitEntry(entry);
  saveEntries();
  exerciseItemsDraft = normalizeExerciseItems(entry.exerciseItems);
  clearExerciseItemComposer();
  renderExerciseItems();
  render();
  setSaveFeedback("exercise", "success", getSaveSuccessMessage("exercise"));
});

foodForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (hasFoodItemComposerValue()) {
    addCurrentFoodItem();
    if (hasFoodItemComposerValue()) return;
  }
  const formData = new FormData(foodForm);
  const date = formData.get("date");
  setSaveFeedback("food", "saving", "保存しています...");
  const entry = getOrCreateEntry(date);
  entry.mealItems = normalizeMealItems(foodMealItemsDraft);
  entry.mealCalories = getMealCaloriesWithItems(entry.mealItems);
  entry.intakeCalories = getMealCaloriesTotal(entry.mealCalories);
  entry.meals = getMealsFromCalories(entry.mealCalories);
  entry.meal = deriveMealScore(entry.meals, []);
  entry.habits = entry.habits.filter((habit) => !exerciseHabitValues.includes(habit));
  commitEntry(entry);
  saveEntries();
  render();
  setSaveFeedback("food", "success", getSaveSuccessMessage("food"));
});

assistantRecordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveAssistantRecord();
});

weightDateInput.addEventListener("change", () => {
  fillWeightFieldsForDate(weightDateInput.value);
});
exerciseDateInput.addEventListener("change", () => {
  fillExerciseFormForDate(exerciseDateInput.value);
});
foodDateInput.addEventListener("change", () => {
  fillFoodFormForDate(foodDateInput.value);
  renderFoodShortcuts();
});
assistantRecordDate.addEventListener("change", () => {
  fillAssistantRecordForDate(assistantRecordDate.value);
});

copyPreviousMealButton.addEventListener("click", copyPreviousDayFood);
document.querySelectorAll("[data-quick-record]").forEach((button) => button.addEventListener("click", () => openQuickRecord(button.dataset.quickRecord)));
document.querySelectorAll("[data-scroll-target]").forEach((button) => button.addEventListener("click", () => {
  const target = button.dataset.scrollTarget === "top" ? document.body : document.querySelector(`#${button.dataset.scrollTarget}`);
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}));
document.querySelector("[data-open-settings-shortcut]").addEventListener("click", openSettings);
document.querySelector("#export-backup").addEventListener("click", exportFullBackup);
document.querySelector("#import-backup").addEventListener("click", () => importBackupFile.click());
importBackupFile.addEventListener("change", importFullBackup);
fitbitConnectButton.addEventListener("click", connectFitbit);
fitbitSyncButton.addEventListener("click", () => syncFitbitSteps(30));
fitbitDisconnectButton.addEventListener("click", disconnectFitbit);
document.querySelector("#install-app").addEventListener("click", installApp);
document.querySelector("#enable-reminder").addEventListener("click", enableReminder);
document.querySelector("#reminder-time").addEventListener("change", saveReminderSettings);

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
openAssistantRecordButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeRecordMenu();
    openAssistantRecord();
  });
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
closeAssistantRecordButton.addEventListener("click", closeAssistantRecord);
assistantRecordModal.addEventListener("click", (event) => {
  if (event.target === assistantRecordModal) closeAssistantRecord();
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
addExerciseItemButton.addEventListener("click", addCurrentExerciseItem);
addFoodItemButton.addEventListener("click", addCurrentFoodItem);
exerciseForm.querySelectorAll('input[name="exerciseMultiplier"]').forEach((input) => {
  input.addEventListener("change", updateExerciseCalculation);
});
foodForm.querySelectorAll('input[name="selectedMeal"]').forEach((input) => {
  input.addEventListener("change", () => changeSelectedMeal(input.value));
});
closeSettingsButton.addEventListener("click", closeSettings);
settingsTabButtons.forEach((button) => {
  button.addEventListener("click", () => switchSettingsTab(button.dataset.settingsTab));
});
settingsScreen.addEventListener("click", (event) => {
  if (event.target === settingsScreen) closeSettings();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !assistantRecordModal.hidden) {
    closeAssistantRecord();
    return;
  }
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
      intakeCalories: null,
      mealCalories: {},
      burnCalories: null,
      exerciseMinutes: null,
      exerciseType: "",
      meal: 3,
      meals: [],
      habits: ["water"],
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
    return normalizeExercisePresetList(stored);
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
    intakeCalories: previous?.intakeCalories ?? null,
    mealCalories: previous?.mealCalories ?? {},
    mealItems: normalizeMealItems(previous?.mealItems),
    burnCalories: previous?.burnCalories ?? null,
    exerciseMinutes: previous?.exerciseMinutes ?? null,
    exerciseType: previous?.exerciseType ?? "",
    exerciseName: previous?.exerciseName ?? "",
    exerciseItems: normalizeExerciseItems(previous?.exerciseItems),
    meal: previous?.meal ?? 2,
    meals: previous?.meals ?? [],
    habits: previous?.habits ?? [],
    fitbitSteps: previous?.fitbitSteps ?? null,
    fitbitSyncedAt: previous?.fitbitSyncedAt ?? null,
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
  return [
    { id: "default-exercise-walking-v1", name: "ウォーキング", exerciseName: "ウォーキング", baseUnit: "minute", baseAmount: 10, caloriesPerBase: 35 },
    { id: "default-exercise-stretch-v1", name: "ストレッチ", exerciseName: "ストレッチ", baseUnit: "minute", baseAmount: 10, caloriesPerBase: 25 },
    { id: "default-exercise-strength-v1", name: "自重筋トレ", exerciseName: "自重筋トレ", baseUnit: "minute", baseAmount: 10, caloriesPerBase: 45 },
    { id: "default-exercise-jogging-v1", name: "ジョギング", exerciseName: "ジョギング", baseUnit: "minute", baseAmount: 10, caloriesPerBase: 80 },
    { id: "default-exercise-squat-v1", name: "スクワット", exerciseName: "スクワット", baseUnit: "rep", baseAmount: 10, caloriesPerBase: 5 },
  ].map(normalizeExercisePreset);
}

function normalizeExercisePreset(preset) {
  const legacyMinutes = numberOrNull(preset.minutes);
  const baseUnit = preset.baseUnit === "rep" ? "rep" : "minute";
  const allowedBaseAmounts = baseUnit === "rep" ? [5, 10] : [1, 5, 10];
  const requestedBaseAmount = numberOrNull(preset.baseAmount);
  const baseAmount = allowedBaseAmounts.includes(requestedBaseAmount)
    ? requestedBaseAmount
    : (baseUnit === "minute" && legacyMinutes !== null ? (legacyMinutes >= 10 ? 10 : legacyMinutes >= 5 ? 5 : 1) : allowedBaseAmounts[0]);
  const legacyBurn = numberOrNull(preset.burnCalories);
  const caloriesPerBase = numberOrNull(preset.caloriesPerBase)
    ?? (legacyBurn !== null && legacyMinutes ? Math.round((legacyBurn / legacyMinutes) * baseAmount) : null);
  return {
    id: typeof preset.id === "string" ? preset.id : createId(),
    name: normalizeExercisePresetName(preset),
    exerciseName: String(preset.exerciseName || (preset.type ? getExerciseTypeLabel(preset.type) : "") || preset.name || "").trim().slice(0, 60),
    baseUnit,
    baseAmount,
    caloriesPerBase,
  };
}

function normalizeExercisePresetList(presets) {
  return presets
    .filter((preset) => !String(preset?.id || "").startsWith("starter-"))
    .map(normalizeExercisePreset)
    .filter((preset) => preset.name);
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
  return [
    { id: "default-food-rice-v1", name: "ご飯（茶碗1杯・150g）", calories: 234 },
    { id: "default-food-bread-v1", name: "食パン（6枚切り1枚）", calories: 149 },
    { id: "default-food-egg-v1", name: "卵（1個）", calories: 76 },
    { id: "default-food-natto-v1", name: "納豆（1パック）", calories: 90 },
    { id: "default-food-chicken-v1", name: "鶏むね肉（皮なし・100g）", calories: 113 },
    { id: "default-food-banana-v1", name: "バナナ（1本）", calories: 93 },
    { id: "default-food-miso-soup-v1", name: "みそ汁（1杯）", calories: 40 },
  ].map(normalizeFoodPreset);
}

function loadFoodPresets() {
  try {
    const stored = JSON.parse(localStorage.getItem(getUserStorageKey(foodPresetStorageKey)));
    return Array.isArray(stored)
      ? normalizeFoodPresetList(stored)
      : [];
  } catch {
    return [];
  }
}

function normalizeFoodPreset(preset) {
  const legacyItems = normalizeMealItems(preset.mealItems);
  const legacyItem = Object.values(legacyItems).flat()[0];
  const legacyCalories = getMealCaloriesTotal(preset.mealCalories || {});
  const foodName = String(preset.foodName || preset.name || preset.label || legacyItem?.name || "").trim().slice(0, 60);
  return {
    id: typeof preset.id === "string" ? preset.id : createId(),
    name: foodName,
    foodName,
    calories: numberOrNull(preset.calories) ?? numberOrNull(legacyItem?.calories) ?? legacyCalories,
  };
}

function normalizeFoodPresetList(presets) {
  const legacyStarters = new Set(["朝の定番:420", "昼の定番:650", "夜の定番:700", "間食控えめ:150"]);
  return presets
    .map(normalizeFoodPreset)
    .filter((preset) => preset.name && !legacyStarters.has(`${preset.foodName}:${preset.calories}`));
}

function saveFoodPresets() {
  if (!activeUser) return;
  localStorage.setItem(getUserStorageKey(foodPresetStorageKey), JSON.stringify(foodPresets));
}

function loadPresetSeedVersion() {
  const version = Number(localStorage.getItem(getUserStorageKey(presetSeedStorageKey)));
  return Number.isInteger(version) && version >= 0 ? version : 0;
}

function savePresetSeedVersion() {
  if (!activeUser) return;
  localStorage.setItem(getUserStorageKey(presetSeedStorageKey), String(appliedPresetSeedVersion));
}

function ensureInitialPresets() {
  if (!activeUser || appliedPresetSeedVersion >= currentPresetSeedVersion) return false;

  if (!exercisePresets.length) exercisePresets = getDefaultExercisePresets();
  if (!foodPresets.length) foodPresets = getDefaultFoodPresets();
  appliedPresetSeedVersion = currentPresetSeedVersion;
  saveExercisePresets();
  saveFoodPresets();
  savePresetSeedVersion();
  touchSettings();
  return true;
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
  const normalized = {
    ...entry,
    mealItems: normalizeMealItems(entry.mealItems),
    exerciseItems: normalizeExerciseItems(entry.exerciseItems),
    weightMorning,
    weightNight,
    weight: weightNight ?? weightMorning ?? weight,
  };
  delete normalized.sleep;
  return normalized;
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
  refreshFitbitStatus();
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
  summaryCarouselMount.append(document.querySelector(".summary-grid"));
  const detailMetricsMount = document.querySelector("#detail-metrics-mount");
  [
    ["体重", document.querySelector(".weight-summary-grid")],
    ["運動", document.querySelector(".exercise-summary-grid")],
    ["食事", document.querySelector(".food-summary-grid")],
  ].forEach(([label, element]) => {
    const section = document.createElement("section");
    section.className = "detail-metric-group";
    section.innerHTML = `<h3>${label}</h3>`;
    section.append(element);
    detailMetricsMount.append(section);
  });

  const support = document.querySelector("#unified-support");
  const insights = document.querySelector(".insights");
  const dailyStatus = document.querySelector(".daily-status-panel");
  if (insights) support.append(insights);
  if (dailyStatus) document.querySelector("#today-checklist-mount").append(dailyStatus);
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
  document.querySelector("#chart-advanced-content").append(balanceFilterGroup, weightFilterGroup);

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
  historyCarouselMount.append(allHistory);
  const categoryHistory = document.createElement("details");
  categoryHistory.className = "category-history";
  categoryHistory.innerHTML = "<summary>項目別の履歴を見る</summary>";
  categoryHistory.append(weightHistory, exerciseHistory, foodHistory);
  historyCarouselMount.append(categoryHistory);

  document.querySelector("#app-content").remove();
  updateChartView();
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

function openAssistantRecord() {
  const selectedDate = isoToday;
  assistantRecordDate.value = selectedDate;
  fillAssistantRecordForDate(selectedDate);
  setAssistantRecordFeedback("", "保存済みデータを読み込んでいます。必要な欄だけ編集できます。");
  assistantRecordModal.hidden = false;
  document.body.classList.add("modal-open");
  closeAssistantRecordButton.focus();
}

function closeAssistantRecord() {
  assistantRecordModal.hidden = true;
  updateModalOpenState();
}

function fillAssistantRecordForDate(date) {
  const entry = entries.find((item) => item.date === date);
  document.querySelector("#assistant-weight-morning").value = entry?.weightMorning ?? "";
  document.querySelector("#assistant-weight-night").value = entry?.weightNight ?? "";
  const mealItems = normalizeMealItems(entry?.mealItems);
  Object.keys(mealItems).forEach((meal) => {
    document.querySelector(`#assistant-meal-${meal}`).value = serializeAssistantMealItems(mealItems[meal]);
  });
  document.querySelector("#assistant-exercise-items").value = serializeAssistantExerciseItems(entry?.exerciseItems);
  renderAssistantRecordSummary(entry, date);
  setAssistantRecordFeedback(
    "",
    entry ? `${formatDateLabel(date)}の保存済みデータを読み込みました。` : `${formatDateLabel(date)}の新しい記録です。`,
  );
}

function serializeAssistantMealItems(items) {
  return items.map((item) => [
    item.name,
    item.amount,
    assistantFieldValue(item.calories),
    assistantFieldValue(item.protein),
    assistantFieldValue(item.fat),
    assistantFieldValue(item.carbs),
  ].join("｜")).join("\n");
}

function serializeAssistantExerciseItems(items) {
  return normalizeExerciseItems(items).map((item) => [
    item.name,
    assistantFieldValue(item.amount),
    getExerciseUnitLabel(item.baseUnit),
    assistantFieldValue(item.burnCalories),
  ].join("｜")).join("\n");
}

function assistantFieldValue(value) {
  const normalized = numberOrNull(value);
  return normalized === null ? "" : String(normalized);
}

function parseAssistantLines(value) {
  return String(value || "")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/[|｜\t]/u).map((column) => column.trim()));
}

function parseAssistantNumber(rawValue, label, lineNumber, { required = false, positive = false } = {}) {
  if (String(rawValue ?? "").trim() === "") {
    if (required) throw new Error(`${lineNumber}行目の${label}を入力してください。`);
    return null;
  }
  const value = numberOrNull(rawValue);
  if (value === null || value < 0 || (positive && value <= 0)) {
    throw new Error(`${lineNumber}行目の${label}は${positive ? "0より大きい" : "0以上の"}数値で入力してください。`);
  }
  return value;
}

function parseAssistantMealItems(value, meal) {
  return parseAssistantLines(value).map((columns, index) => {
    const lineNumber = index + 1;
    const [name, amount = "", caloriesRaw = "", proteinRaw = "", fatRaw = "", carbsRaw = ""] = columns;
    if (!name) throw new Error(`${getMealName(meal)}の${lineNumber}行目に食品名がありません。`);
    const protein = parseAssistantNumber(proteinRaw, "P", lineNumber);
    const fat = parseAssistantNumber(fatRaw, "F", lineNumber);
    const carbs = parseAssistantNumber(carbsRaw, "C", lineNumber);
    let calories = parseAssistantNumber(caloriesRaw, "kcal", lineNumber);
    if (calories === null && [protein, fat, carbs].some((nutrient) => nutrient !== null)) {
      calories = Math.round((protein || 0) * 4 + (fat || 0) * 9 + (carbs || 0) * 4);
    }
    if (calories === null) {
      throw new Error(`${getMealName(meal)}の${lineNumber}行目はkcalまたはPFCを入力してください。`);
    }
    return {
      id: createId(),
      name: name.slice(0, 60),
      amount: amount.slice(0, 30),
      calories,
      protein,
      fat,
      carbs,
    };
  });
}

function parseAssistantExerciseItems(value) {
  return normalizeExerciseItems(parseAssistantLines(value).map((columns, index) => {
    const lineNumber = index + 1;
    const [name, amountRaw = "", unitRaw = "分", caloriesRaw = ""] = columns;
    if (!name) throw new Error(`運動の${lineNumber}行目に運動名がありません。`);
    const amount = parseAssistantNumber(amountRaw, "量", lineNumber, { required: true, positive: true });
    const unit = unitRaw.toLowerCase();
    const baseUnit = unit.includes("回") || unit.includes("rep") ? "rep" : "minute";
    if (unit && !["分", "minute", "minutes", "min", "回", "rep", "reps"].some((label) => unit.includes(label))) {
      throw new Error(`運動の${lineNumber}行目の単位は「分」か「回」で入力してください。`);
    }
    const burnCalories = parseAssistantNumber(caloriesRaw, "消費kcal", lineNumber);
    return {
      id: createId(),
      name: name.slice(0, 60),
      baseUnit,
      baseAmount: amount,
      multiplier: 1,
      amount,
      caloriesPerBase: burnCalories,
      burnCalories,
    };
  }));
}

function saveAssistantRecord() {
  const date = assistantRecordDate.value;
  if (!date) {
    setAssistantRecordFeedback("error", "記録日を選択してください。");
    return;
  }
  try {
    const mealItems = createEmptyMealItems();
    Object.keys(mealItems).forEach((meal) => {
      mealItems[meal] = parseAssistantMealItems(
        document.querySelector(`#assistant-meal-${meal}`).value,
        meal,
      );
    });
    const exerciseItems = parseAssistantExerciseItems(document.querySelector("#assistant-exercise-items").value);
    const entry = getOrCreateEntry(date);
    entry.weightMorning = numberOrNull(document.querySelector("#assistant-weight-morning").value);
    entry.weightNight = numberOrNull(document.querySelector("#assistant-weight-night").value);
    entry.weight = entry.weightNight ?? entry.weightMorning ?? null;
    entry.mealItems = normalizeMealItems(mealItems);
    entry.mealCalories = Object.fromEntries(Object.entries(entry.mealItems).map(([meal, items]) => [
      meal,
      items.length ? Math.round(items.reduce((sum, item) => sum + (item.calories || 0), 0)) : null,
    ]));
    entry.intakeCalories = getMealCaloriesTotal(entry.mealCalories);
    entry.meals = getMealsFromCalories(entry.mealCalories);
    entry.meal = deriveMealScore(entry.meals, []);
    entry.exerciseItems = exerciseItems;
    entry.burnCalories = sumExerciseItems(exerciseItems, "burnCalories");
    entry.exerciseMinutes = sumExerciseItems(exerciseItems, "minutes");
    entry.exerciseName = exerciseItems[0]?.name || "";
    entry.exerciseType = "";
    entry.habits = Array.isArray(entry.habits) ? entry.habits : [];
    commitEntry(entry);
    saveEntries();
    render();
    renderAssistantRecordSummary(entry, date);
    setAssistantRecordFeedback("success", `${formatDateLabel(date)}の体重・食事・運動をまとめて保存しました。`);
  } catch (error) {
    setAssistantRecordFeedback("error", error.message || "入力形式を確認してください。");
  }
}

function renderAssistantRecordSummary(entry, date) {
  if (!entry) {
    assistantRecordSummary.textContent = `${formatDateLabel(date)}：保存済みの記録はありません。`;
    return;
  }
  const mealItems = Object.values(normalizeMealItems(entry.mealItems)).flat();
  const exerciseItems = normalizeExerciseItems(entry.exerciseItems);
  const weights = [
    numberOrNull(entry.weightMorning) === null ? "" : `朝${Number(entry.weightMorning).toFixed(1)}kg`,
    numberOrNull(entry.weightNight) === null ? "" : `夜${Number(entry.weightNight).toFixed(1)}kg`,
  ].filter(Boolean).join("・") || "体重なし";
  const intake = numberOrNull(entry.intakeCalories);
  const fitbit = getFitbitExerciseEstimate(entry);
  const burn = getExerciseBurnTotal(entry);
  const manualExerciseCount = exerciseItems.length || (hasManualExerciseEntry(entry) ? 1 : 0);
  const exerciseCount = manualExerciseCount + (fitbit ? 1 : 0);
  assistantRecordSummary.textContent = [
    formatDateLabel(date),
    weights,
    `食事${mealItems.length}品・${intake === null ? "--" : Math.round(intake)}kcal`,
    `運動${exerciseCount}件・${burn === null ? "--" : Math.round(burn)}kcal${fitbit ? "（歩数換算を含む）" : ""}`,
  ].join(" / ");
}

function setAssistantRecordFeedback(type, message) {
  assistantRecordFeedback.textContent = message;
  assistantRecordFeedback.className = `save-feedback${type ? ` is-${type}` : ""}`;
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
  const hasOpenModal = [recordMenuModal, assistantRecordModal, weightModal, exerciseModal, foodModal, settingsScreen]
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
  const labels = { weight: "体重", exercise: "運動", food: "食事" };
  if (!window.confirm(`${formatDateLabel(date)}の${labels[scope]}記録だけを削除しますか？ほかの項目は残ります。`)) return;

  lastDeletion = { entry: structuredClone(previous), scope };
  const entry = { ...previous, habits: [...(previous.habits || [])], updatedAt: new Date().toISOString() };
  if (scope === "weight") {
    entry.weight = null;
    entry.weightMorning = null;
    entry.weightNight = null;
  } else if (scope === "exercise") {
    entry.burnCalories = null;
    entry.exerciseMinutes = null;
    entry.exerciseType = "";
    entry.exerciseName = "";
    entry.exerciseItems = [];
    entry.habits = entry.habits.filter((habit) => !exerciseHabitValues.includes(habit));
  } else {
    entry.intakeCalories = null;
    entry.mealCalories = {};
    entry.mealItems = createEmptyMealItems();
    entry.meal = 2;
    entry.meals = [];
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
        appliedPresetSeedVersion = Number.isInteger(Number(legacyData.presetSeedVersion))
          ? Number(legacyData.presetSeedVersion)
          : appliedPresetSeedVersion;
        if (Array.isArray(legacyData.exercisePresets)) {
          exercisePresets = normalizeExercisePresetList(legacyData.exercisePresets);
        }
        if (Array.isArray(legacyData.foodPresets)) {
          foodPresets = normalizeFoodPresetList(legacyData.foodPresets);
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
          ? normalizeExercisePresetList(cloudSettings.payload.exercisePresets)
          : [];
        foodPresets = Array.isArray(cloudSettings.payload.foodPresets)
          ? normalizeFoodPresetList(cloudSettings.payload.foodPresets)
          : [];
        appliedPresetSeedVersion = Number.isInteger(Number(cloudSettings.payload.presetSeedVersion))
          ? Number(cloudSettings.payload.presetSeedVersion)
          : 0;
        settingsUpdatedAt = cloudSettings.updated_at;
      } else {
        settingsDirty = true;
      }
    }

    ensureInitialPresets();
    purgeLegacySampleData();
    entries.sort((a, b) => b.date.localeCompare(a.date));
    localStorage.setItem(getUserStorageKey(storageKey), JSON.stringify(entries));
    saveDeletedEntries();
    saveProfileToDevice();
    saveExercisePresets();
    saveFoodPresets();
    savePresetSeedVersion();
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
        payload: { profile, exercisePresets, foodPresets, presetSeedVersion: appliedPresetSeedVersion },
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

async function invokeFitbitFunction(name, body) {
  if (!supabaseClient || !activeUser) throw new Error("ログインが必要です。");
  const { data, error } = await supabaseClient.functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    try {
      const response = error.context;
      const payload = response && typeof response.json === "function" ? await response.json() : null;
      message = payload?.error || message;
    } catch {
      // Use the function client's original message.
    }
    throw new Error(message || "Fitbitとの通信に失敗しました。");
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

async function refreshFitbitStatus() {
  if (!activeUser) return;
  fitbitStatus.textContent = "接続状態を確認しています。";
  try {
    const data = await invokeFitbitFunction("fitbit-sync", { action: "status" });
    updateFitbitControls(Boolean(data.connected), data.lastSyncedAt);
  } catch (error) {
    fitbitStatus.textContent = "Google Health機能の設定を確認してください。";
    fitbitLastSync.textContent = error.message;
  }
}

function updateFitbitControls(connected, lastSyncedAt = null) {
  fitbitConnected = connected;
  fitbitStatus.textContent = connected ? "Google Healthと連携済みです。" : "まだGoogle Healthと連携していません。";
  fitbitLastSync.textContent = lastSyncedAt
    ? `最終同期: ${new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lastSyncedAt))}`
    : "";
  fitbitConnectButton.hidden = connected;
  fitbitSyncButton.hidden = !connected;
  fitbitDisconnectButton.hidden = !connected;
}

async function connectFitbit() {
  fitbitConnectButton.disabled = true;
  fitbitStatus.textContent = "Google Healthの認証画面を準備しています。";
  try {
    const returnUrl = `${location.origin}${location.pathname}`;
    const data = await invokeFitbitFunction("fitbit-auth", { returnUrl });
    location.assign(data.authorizationUrl);
  } catch (error) {
    fitbitStatus.textContent = error.message;
    fitbitConnectButton.disabled = false;
  }
}

async function syncFitbitSteps(days = 30) {
  fitbitSyncButton.disabled = true;
    fitbitStatus.textContent = "Google Healthから歩数を同期しています。";
  try {
    const data = await invokeFitbitFunction("fitbit-sync", { action: "sync", days, endDate: isoToday });
    const syncedAt = data.lastSyncedAt || new Date().toISOString();
    (data.steps || []).forEach((item) => {
      if (!item?.date) return;
      const entry = getOrCreateEntry(item.date);
      entry.fitbitSteps = Math.max(0, Math.round(Number(item.steps) || 0));
      entry.fitbitSyncedAt = syncedAt;
      commitEntry(entry);
    });
    saveEntries();
    render();
    updateFitbitControls(true, syncedAt);
    fitbitStatus.textContent = `${data.steps?.length || 0}日分の歩数を同期しました。`;
  } catch (error) {
    if (error.message.includes("認証期限が切れました")) {
      updateFitbitControls(false);
      fitbitStatus.textContent = `${error.message}「Google Healthを連携」から再接続できます。`;
    } else {
      fitbitStatus.textContent = error.message;
    }
  } finally {
    fitbitSyncButton.disabled = false;
  }
}

async function disconnectFitbit() {
  if (!window.confirm("Google Health連携を解除しますか？ 同期済みの歩数は記録に残ります。")) return;
  fitbitDisconnectButton.disabled = true;
  try {
    await invokeFitbitFunction("fitbit-sync", { action: "disconnect" });
    updateFitbitControls(false);
  } catch (error) {
    fitbitStatus.textContent = error.message;
  } finally {
    fitbitDisconnectButton.disabled = false;
  }
}

async function handleFitbitReturn() {
  const url = new URL(location.href);
  const result = url.searchParams.get("fitbit");
  const errorCode = url.searchParams.get("fitbit_error");
  if (!result) return;
  url.searchParams.delete("fitbit");
  url.searchParams.delete("fitbit_error");
  history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  openSettings();
  switchSettingsTab("app");
  if (result === "connected") {
    updateFitbitControls(true);
    await syncFitbitSteps(30);
  } else if (result === "cancelled") {
    fitbitStatus.textContent = "Google Health連携をキャンセルしました。";
  } else {
    const messages = {
      invalid_client: "Client IDとClient Secretの組み合わせが一致していません。",
      invalid_grant: "認証コードを交換できませんでした。もう一度連携してください。",
      missing_refresh_token: "継続同期用の許可を取得できませんでした。Google側のアクセスを解除してやり直してください。",
      storage_failed: "Google Healthの接続先テーブルを確認できませんでした。",
      callback_failed: "Google Healthの接続情報を保存できませんでした。",
    };
    fitbitStatus.textContent = messages[errorCode] || "Google Health連携を完了できませんでした。もう一度お試しください。";
  }
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
    appliedPresetSeedVersion = 0;
    settingsUpdatedAt = new Date(0).toISOString();
    fitbitConnected = false;
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
  appliedPresetSeedVersion = loadPresetSeedVersion();
  settingsUpdatedAt = loadSettingsUpdatedAt();
  purgeLegacySampleData();
  accountEmail.textContent = activeUser.email || activeUser.id;
  fillProfileForm();
  fillAllFormsForDate(isoToday);
  showOnboardingIfNeeded();
  render();
  await syncFromCloud();
  await handleFitbitReturn();
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
    presetSeedStorageKey,
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
  if (assistantSyncStatus) assistantSyncStatus.textContent = status;
  const pendingCountLabel = `${dirtyEntryDates.size + (settingsDirty ? 1 : 0)}件`;
  if (pendingSyncCount) pendingSyncCount.textContent = pendingCountLabel;
  if (assistantPendingSyncCount) assistantPendingSyncCount.textContent = pendingCountLabel;
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
  renderFoodShortcuts();
  renderActionInsights();
  setSyncState(!activeUser ? "ログイン待ち" : (navigator.onLine ? (dirtyEntryDates.size || settingsDirty ? "同期待ち" : "同期済み") : "オフライン保存中"));
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
  renderPfcSummary(selected);
  renderWeeklyReport(weekEntries);
  renderFitbitSteps(selected);
}

function renderFitbitSteps(entry) {
  const steps = numberOrNull(entry?.fitbitSteps);
  document.querySelector("#fitbit-steps").textContent = steps === null
    ? "-- 歩"
    : `${Math.round(steps).toLocaleString("ja-JP")} 歩`;
  document.querySelector("#fitbit-steps-detail").textContent = steps === null
    ? "Google Healthを連携すると表示"
    : "Google Healthの日別合計・運動に換算";
}

function renderWeeklyReport(weekEntries) {
  const streak = getStreak();
  const element = document.querySelector("#record-streak");
  if (element) element.textContent = `${streak}日`;
}

function renderDailyStatus(entry) {
  const weightDone = hasWeightEntry(entry);
  const foodDone = numberOrNull(entry?.intakeCalories) !== null;
  const exerciseDone = hasExerciseEntry(entry);
  const weight = getPrimaryWeight(entry);
  setStatusPill("#weight-status-pill", "体重", weightDone, weightDone ? `${weight.toFixed(1)}kg` : "入力する");
  setStatusPill("#food-status-pill", "食事", foodDone, foodDone ? `${Math.round(entry.intakeCalories)}kcal` : "入力する");
  setStatusPill("#exercise-status-pill", "運動", exerciseDone, exerciseDone ? getExerciseDetailLabel(entry) : "入力する");
  const completed = [weightDone, foodDone, exerciseDone].filter(Boolean).length;
  const badge = document.querySelector("#today-completion-badge");
  badge.textContent = completed === 3 ? "今日の記録完了 ✓" : `${completed} / 3`;
  badge.classList.toggle("is-complete", completed === 3);
}

function setStatusPill(selector, label, isDone, detail) {
  const element = document.querySelector(selector);
  if (!element) return;
  element.innerHTML = `<span>${isDone ? "✓ " : ""}${label}</span><strong>${escapeHtml(detail)}</strong>`;
  element.classList.toggle("is-done", isDone);
}

function renderCalorieDashboard(entry) {
  const intake = entry?.intakeCalories ?? null;
  const burn = getExerciseBurnTotal(entry);
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
    balanceLabel.textContent = diff >= 0 ? `摂取−運動 +${Math.round(diff)} kcal` : `摂取−運動 ${Math.round(diff)} kcal`;
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
      || (balanceSeries.has("burn") && getExerciseBurnTotal(item) !== null)
      || (balanceSeries.has("weight") && hasWeightEntry(item))
    ))
    .filter((item) => isWithinRange(item.date, comboChartRangeDays))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  const points = sampleChartPoints(rangePoints, 120);

  svg.innerHTML = '<title id="calorie-chart-title">摂取カロリーは線グラフ、運動消費の推定値は棒グラフ、体重は線グラフ</title>';
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
    balanceSeries.has("burn") ? getExerciseBurnTotal(point) : null,
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
    const value = getExerciseBurnTotal(point) || 0;
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

function renderPfcSummary(entry) {
  const items = Object.values(normalizeMealItems(entry?.mealItems)).flat();
  const protein = items.reduce((sum, item) => sum + (numberOrNull(item.protein) || 0), 0);
  const fat = items.reduce((sum, item) => sum + (numberOrNull(item.fat) || 0), 0);
  const carbs = items.reduce((sum, item) => sum + (numberOrNull(item.carbs) || 0), 0);
  const calories = { protein: protein * 4, fat: fat * 9, carbs: carbs * 4 };
  const total = calories.protein + calories.fat + calories.carbs;
  const bar = document.querySelector("#pfc-summary-bar");
  const detail = document.querySelector("#pfc-summary-detail");
  const values = { protein, fat, carbs };

  Object.entries(values).forEach(([key, grams]) => {
    const percent = total ? Math.round((calories[key] / total) * 100) : 0;
    document.querySelector(`#pfc-${key}-bar`).style.width = `${percent}%`;
    document.querySelector(`#pfc-${key}-label`).textContent = total ? `${Math.round(grams * 10) / 10}g` : "--";
  });

  if (!total) {
    bar.setAttribute("aria-label", "PFCは未入力です");
    detail.textContent = "今日のPFCを入力すると表示";
    return;
  }

  const proteinPercent = Math.round((calories.protein / total) * 100);
  const fatPercent = Math.round((calories.fat / total) * 100);
  const carbsPercent = Math.max(0, 100 - proteinPercent - fatPercent);
  bar.setAttribute("aria-label", `たんぱく質${proteinPercent}%、脂質${fatPercent}%、炭水化物${carbsPercent}%`);
  detail.textContent = `P ${proteinPercent}%・F ${fatPercent}%・C ${carbsPercent}%`;
}

function openQuickRecord(scope) {
  if (scope === "weight") openWeightModal();
  else if (scope === "food") openEntryModal(foodModal, "food");
  else openEntryModal(exerciseModal, "exercise");
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
      const calories = getCalorieLabel(entry);
      const meals = getMealLogLabel(entry.meals || []);
      return `
        <article class="history-item">
          <div class="history-date">${formatDateLabel(entry.date)}</div>
          <div class="history-detail">${weight} / ${calories} / ${meals}</div>
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
        <div class="history-detail">${getWeightHistoryLabel(entry)}</div>
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
  const totalMinutes = exerciseEntries.reduce((sum, entry) => sum + (getExerciseMinutesTotal(entry) || 0), 0);
  const totalReps = exerciseEntries.reduce((sum, entry) => (
    sum + (sumExerciseItems(normalizeExerciseItems(entry.exerciseItems), "reps") || 0)
  ), 0);
  const totalBurn = exerciseEntries.reduce((sum, entry) => sum + (getExerciseBurnTotal(entry) || 0), 0);
  const todayEntry = entries.find((entry) => entry.date === isoToday);

  renderExercisePresets();
  const weeklyAmount = [totalMinutes ? `${Math.round(totalMinutes)}分` : "", totalReps ? `${Math.round(totalReps)}回` : ""].filter(Boolean).join("・");
  document.querySelector("#exercise-week-minutes").textContent = weeklyAmount || "--";
  document.querySelector("#exercise-week-minutes-detail").textContent = exerciseEntries.length ? `${exerciseEntries.length}日の記録から計算` : "時間・回数を入れると表示";
  document.querySelector("#exercise-week-burn").textContent = totalBurn ? `${Math.round(totalBurn)} kcal` : "-- kcal";
  document.querySelector("#exercise-week-burn-detail").textContent = exerciseEntries.length ? "直近7日の推定合計" : "運動消費の推定値";
  document.querySelector("#exercise-week-days").textContent = exerciseEntries.length ? `${exerciseEntries.length} 日` : "-- 日";

  if (hasExerciseEntry(todayEntry)) {
    document.querySelector("#exercise-today-status").textContent = getExerciseEntryName(todayEntry);
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
    exercisePresetList.innerHTML = '<p class="empty preset-empty">まだプリセットがありません。下の作成欄で運動名・基準量・基準カロリーを登録してください。</p>';
    return;
  }

  exercisePresetList.innerHTML = exercisePresets
    .map((preset) => `
      <article class="preset-card exercise-preset-card ${preset.id === selectedExercisePresetId ? "is-selected" : ""}">
        <button class="preset-apply-button" type="button" data-preset-id="${escapeHtml(preset.id)}">
          <span>運動プリセット</span>
          <strong>${escapeHtml(preset.exerciseName)}</strong>
          <small>${preset.baseAmount}${getExerciseUnitLabel(preset.baseUnit)}あたり / ${preset.caloriesPerBase === null ? "カロリー未設定" : `${preset.caloriesPerBase}kcal`}</small>
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
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      exercisePresets = exercisePresets.filter((item) => item.id !== button.dataset.deletePresetId);
      if (selectedExercisePresetId === button.dataset.deletePresetId) clearSelectedExercisePreset();
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
  selectedExercisePresetId = preset.id;
  setExerciseMultiplierValue(1);
  updateExerciseCalculation();
  renderExercisePresets();
}

function saveCurrentExerciseAsPreset() {
  const name = exercisePresetNameInput.value.trim();
  const caloriesPerBase = numberOrNull(document.querySelector("#exercise-preset-calories").value);
  if (!name) {
    setSaveFeedback("exercise", "error", "運動名を入力してください。");
    exercisePresetNameInput.focus();
    return;
  }
  if (caloriesPerBase === null) {
    setSaveFeedback("exercise", "error", "基準運動消費の推定値を入力してください。");
    document.querySelector("#exercise-preset-calories").focus();
    return;
  }
  const [baseUnit, baseAmount] = document.querySelector("#exercise-preset-base").value.split(":");

  const preset = normalizeExercisePreset({
    id: editingExercisePresetId || createId(),
    name,
    exerciseName: name,
    baseUnit,
    baseAmount: Number(baseAmount),
    caloriesPerBase,
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
  exercisePresetNameInput.value = preset.name;
  document.querySelector("#exercise-preset-base").value = `${preset.baseUnit}:${preset.baseAmount}`;
  document.querySelector("#exercise-preset-calories").value = preset.caloriesPerBase ?? "";
  saveExercisePresetButton.textContent = "プリセットを更新";
  cancelExercisePresetEditButton.hidden = false;
  exercisePresetNameInput.focus();
}

function cancelExercisePresetEdit() {
  editingExercisePresetId = null;
  exercisePresetNameInput.value = "";
  document.querySelector("#exercise-preset-base").value = "minute:10";
  document.querySelector("#exercise-preset-calories").value = "";
  saveExercisePresetButton.textContent = "プリセットを作成";
  cancelExercisePresetEditButton.hidden = true;
}

function syncExercisePresets() {
  if (activeUser) {
    pushEntriesToCloud().catch((error) => {
      setSaveFeedback("exercise", "error", getCloudErrorMessage(error));
    });
  }
}

function normalizeExerciseItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const legacyMinutes = numberOrNull(item?.minutes);
      const baseUnit = item?.baseUnit === "rep" ? "rep" : "minute";
      const baseAmount = numberOrNull(item?.baseAmount) ?? (legacyMinutes || 1);
      const multiplier = numberOrNull(item?.multiplier) ?? 1;
      const amount = numberOrNull(item?.amount) ?? baseAmount * multiplier;
      const burnCalories = numberOrNull(item?.burnCalories);
      const caloriesPerBase = numberOrNull(item?.caloriesPerBase)
        ?? (burnCalories !== null && multiplier ? burnCalories / multiplier : null);
      return {
        id: typeof item?.id === "string" ? item.id : createId(),
        name: String(item?.name || (item?.type ? getExerciseTypeLabel(item.type) : "") || "運動").trim().slice(0, 60),
        baseUnit,
        baseAmount,
        multiplier,
        amount,
        caloriesPerBase,
        minutes: baseUnit === "minute" ? amount : null,
        reps: baseUnit === "rep" ? amount : null,
        burnCalories: burnCalories ?? (caloriesPerBase === null ? null : Math.round(caloriesPerBase * multiplier)),
      };
    })
    .filter((item) => item.name && item.amount > 0)
    .filter((item, index, normalizedItems) => (
      normalizedItems.findIndex((candidate) => getExerciseItemSignature(candidate) === getExerciseItemSignature(item)) === index
    ));
}

function getExerciseItemSignature(item) {
  return [item.name, item.baseUnit, item.baseAmount, item.multiplier, item.caloriesPerBase].join("|");
}

function hasLegacyExerciseValues(entry) {
  return Boolean(entry && (
    entry.exerciseName
    || entry.exerciseType
    || numberOrNull(entry.exerciseMinutes) !== null
    || numberOrNull(entry.burnCalories) !== null
  ));
}

function getExerciseItemFromForm() {
  const preset = exercisePresets.find((item) => item.id === selectedExercisePresetId);
  if (!preset || preset.caloriesPerBase === null) return null;
  const multiplier = getSelectedExerciseMultiplier();
  return normalizeExerciseItems([{
    name: preset.exerciseName,
    baseUnit: preset.baseUnit,
    baseAmount: preset.baseAmount,
    multiplier,
    amount: preset.baseAmount * multiplier,
    caloriesPerBase: preset.caloriesPerBase,
    burnCalories: preset.caloriesPerBase * multiplier,
  }])[0] || null;
}

function addCurrentExerciseItem() {
  const item = getExerciseItemFromForm();
  if (!item) {
    setSaveFeedback("exercise", "error", "カロリー設定済みのプリセットを選択してください。");
    return;
  }
  if (!exerciseItemsDraft.some((savedItem) => getExerciseItemSignature(savedItem) === getExerciseItemSignature(item))) {
    exerciseItemsDraft.push(item);
  }
  clearExerciseItemComposer();
  renderExerciseItems();
  setSaveFeedback("exercise", "success", `${item.name}を追加しました。`);
}

function clearExerciseItemComposer() {
  selectedExercisePresetId = null;
  setExerciseMultiplierValue(1);
  updateExerciseCalculation();
  renderExercisePresets();
}

function clearSelectedExercisePreset() {
  selectedExercisePresetId = null;
  setExerciseMultiplierValue(1);
  updateExerciseCalculation();
}

function renderExerciseItems() {
  if (!exerciseItemList) return;
  if (!exerciseItemsDraft.length) {
    exerciseItemList.innerHTML = '<p class="empty entry-item-empty">追加した運動がここに表示されます。</p>';
  } else {
    exerciseItemList.innerHTML = exerciseItemsDraft.map((item) => `
      <article class="entry-item-card">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <span>${item.amount}${getExerciseUnitLabel(item.baseUnit)}・${item.burnCalories ?? 0}kcal</span>
        </div>
        <button type="button" data-remove-exercise-item="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.name)}を削除">削除</button>
      </article>
    `).join("");
    exerciseItemList.querySelectorAll("[data-remove-exercise-item]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        exerciseItemsDraft = exerciseItemsDraft.filter((item) => item.id !== button.dataset.removeExerciseItem);
        renderExerciseItems();
        persistExerciseItemsDraft();
      });
    });
  }
  const minutes = sumExerciseItems(exerciseItemsDraft, "minutes") ?? 0;
  const reps = sumExerciseItems(exerciseItemsDraft, "reps") ?? 0;
  const amountText = [minutes ? `${minutes}分` : "", reps ? `${reps}回` : ""].filter(Boolean).join("・") || "0分";
  exerciseItemsTotal.textContent = `${amountText} / ${sumExerciseItems(exerciseItemsDraft, "burnCalories") ?? 0}kcal`;
}

function persistExerciseItemsDraft() {
  const date = exerciseDateInput.value;
  const previous = entries.find((entry) => entry.date === date);
  if (!previous) return;
  lastDeletion = { entry: structuredClone(previous), scope: "exercise" };
  const entry = getOrCreateEntry(date);
  entry.exerciseItems = normalizeExerciseItems(exerciseItemsDraft);
  entry.burnCalories = sumExerciseItems(entry.exerciseItems, "burnCalories");
  entry.exerciseMinutes = sumExerciseItems(entry.exerciseItems, "minutes");
  entry.exerciseName = entry.exerciseItems[0]?.name || "";
  entry.exerciseType = "";
  entry.habits = [];
  commitEntry(entry);
  saveEntries();
  render();
  showUndoToast("運動を削除しました。");
}

function sumExerciseItems(items, key) {
  const values = items.map((item) => numberOrNull(item[key])).filter((value) => value !== null);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0)) : null;
}

function getSelectedExerciseMultiplier() {
  return Number(exerciseForm.querySelector('input[name="exerciseMultiplier"]:checked')?.value || 1);
}

function setExerciseMultiplierValue(multiplier) {
  const input = exerciseForm.querySelector(`input[name="exerciseMultiplier"][value="${multiplier}"]`)
    || exerciseForm.querySelector('input[name="exerciseMultiplier"][value="1"]');
  if (input) input.checked = true;
}

function getExerciseUnitLabel(unit) {
  return unit === "rep" ? "回" : "分";
}

function updateExerciseCalculation() {
  const preset = exercisePresets.find((item) => item.id === selectedExercisePresetId);
  const multiplier = getSelectedExerciseMultiplier();
  const baseUnit = preset?.baseUnit || "minute";
  const baseAmount = preset?.baseAmount || 1;
  const totalCalories = preset?.caloriesPerBase === null || preset?.caloriesPerBase === undefined
    ? null
    : Math.round(preset.caloriesPerBase * multiplier);
  exerciseForm.querySelectorAll('input[name="exerciseMultiplier"]').forEach((input) => {
    const label = input.parentElement.querySelector("[data-exercise-multiplier-label]");
    if (label) label.textContent = preset
      ? `${baseAmount * Number(input.value)}${getExerciseUnitLabel(baseUnit)}`
      : `×${input.value}`;
  });
  document.querySelector("#selected-exercise-preset-name").textContent = preset?.exerciseName || "プリセットを選択してください";
  document.querySelector("#selected-exercise-preset-detail").textContent = preset
    ? `${preset.baseAmount}${getExerciseUnitLabel(preset.baseUnit)}あたり ${preset.caloriesPerBase ?? 0}kcal`
    : "カードを選ぶと実施量を設定できます。";
  document.querySelector("#exercise-calculation-preview").textContent = preset
    ? `${baseAmount * multiplier}${getExerciseUnitLabel(baseUnit)}・${totalCalories ?? 0}kcal`
    : "プリセット未選択";
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
          <span>${escapeHtml(getExerciseEntryName(entry))}</span>
        </div>
        <div>${getExerciseDetailLabel(entry)}</div>
        <div class="history-actions">
          ${hasManualExerciseEntry(entry) ? `
            <button type="button" data-edit-entry="exercise" data-entry-date="${entry.date}">手入力を編集</button>
            <button type="button" data-delete-entry="exercise" data-entry-date="${entry.date}">手入力を削除</button>
          ` : '<span class="sync-source-label">Google Healthの歩数</span>'}
        </div>
      </article>
    `)
    .join("");
}

function hasManualExerciseEntry(entry) {
  return Boolean(entry && (
    normalizeExerciseItems(entry.exerciseItems).length
    ||
    numberOrNull(entry.burnCalories) !== null
    || numberOrNull(entry.exerciseMinutes) !== null
    || entry.exerciseName
    || entry.exerciseType
  ));
}

function getFitbitExerciseEstimate(entry) {
  const steps = numberOrNull(entry?.fitbitSteps);
  if (steps === null || steps <= 0) return null;
  const profileHeight = numberOrNull(profile.height);
  const heightCm = profileHeight !== null && profileHeight > 0 ? profileHeight : fallbackWalkingHeightCm;
  const weightKg = getExerciseEstimateWeight(entry);
  const strideMeters = (heightCm * walkingStrideHeightRatio) / 100;
  const distanceKm = (steps * strideMeters) / 1000;
  return {
    steps: Math.round(steps),
    minutes: Math.max(1, Math.round(steps / stepsPerWalkingMinute)),
    distanceKm: Math.round(distanceKm * 100) / 100,
    burnCalories: Math.max(1, Math.round(distanceKm * weightKg * walkingCaloriesPerKgKm)),
  };
}

function getExerciseEstimateWeight(entry) {
  const getPositiveWeight = (item) => {
    const weight = getPrimaryWeight(item);
    return weight !== null && weight > 0 ? weight : null;
  };
  const sameDayWeight = getPositiveWeight(entry);
  if (sameDayWeight !== null) return sameDayWeight;
  const datedWeight = entries.find((item) => item.date <= entry.date && getPositiveWeight(item) !== null);
  const latestWeight = entries.find((item) => getPositiveWeight(item) !== null);
  const profileWeight = numberOrNull(profile.startWeight);
  return getPositiveWeight(datedWeight)
    ?? getPositiveWeight(latestWeight)
    ?? (profileWeight !== null && profileWeight > 0 ? profileWeight : null)
    ?? fallbackWalkingWeightKg;
}

function getExerciseMinutesTotal(entry) {
  const values = [
    numberOrNull(entry?.exerciseMinutes),
    getFitbitExerciseEstimate(entry)?.minutes ?? null,
  ].filter((value) => value !== null);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0)) : null;
}

function getExerciseBurnTotal(entry) {
  const values = [
    numberOrNull(entry?.burnCalories),
    getFitbitExerciseEstimate(entry)?.burnCalories ?? null,
  ].filter((value) => value !== null);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0)) : null;
}

function hasExerciseEntry(entry) {
  return hasManualExerciseEntry(entry) || getFitbitExerciseEstimate(entry) !== null;
}

function getExerciseEntryName(entry) {
  const firstItem = normalizeExerciseItems(entry?.exerciseItems)[0];
  const manualName = firstItem?.name || entry?.exerciseName || (entry?.exerciseType ? getExerciseTypeLabel(entry.exerciseType) : "");
  const fitbit = getFitbitExerciseEstimate(entry);
  if (manualName && fitbit) return `${manualName}＋歩数`;
  return manualName || (fitbit ? "歩数ウォーキング" : "入力済み");
}

function getExerciseDetailLabel(entry) {
  const items = normalizeExerciseItems(entry.exerciseItems);
  const fitbit = getFitbitExerciseEstimate(entry);
  const details = items.map((item) => `${escapeHtml(item.name)} ${item.amount}${getExerciseUnitLabel(item.baseUnit)}`);
  if (!items.length && hasManualExerciseEntry(entry)) {
    const manualMinutes = numberOrNull(entry.exerciseMinutes);
    if (manualMinutes !== null) details.push(`${Math.round(manualMinutes)}分`);
  }
  if (fitbit) {
    details.push(`${fitbit.steps.toLocaleString("ja-JP")}歩（約${fitbit.minutes}分）`);
  }
  const burn = getExerciseBurnTotal(entry);
  return `${details.join("・") || "運動入力済み"} / ${burn === null ? "--kcal" : `約${burn}kcal`}`;
}

function getExerciseTypeLabel(value) {
  const labels = {
    walk: "ウォーキング",
    run: "ランニング",
    cycle: "サイクリング",
    swim: "水泳",
    dance: "ダンス",
    yoga: "ヨガ",
    chest: "胸",
    back: "背中",
    shoulders: "肩",
    arms: "腕",
    abs: "お腹",
    legs: "脚",
    hips: "お尻",
    full_body: "全身",
    strength: "筋力トレーニング",
    stretch: "ストレッチ",
    other: "その他",
  };
  return labels[value] || "運動";
}

function renderFoodPage() {
  const todayEntry = entries.find((entry) => entry.date === isoToday);
  const weekEntries = getRecentEntries(7);
  const calorieEntries = weekEntries.filter((entry) => numberOrNull(entry.intakeCalories) !== null);
  const averageCalories = calorieEntries.length
    ? calorieEntries.reduce((sum, entry) => sum + numberOrNull(entry.intakeCalories), 0) / calorieEntries.length
    : null;
  const mealCount = (todayEntry?.meals || []).length;
  const recordedFoodDays = calorieEntries.length;

  renderFoodPresets();
  document.querySelector("#food-today-calories").textContent = todayEntry?.intakeCalories === null || todayEntry?.intakeCalories === undefined
    ? "-- kcal"
    : `${Math.round(todayEntry.intakeCalories)} kcal`;
  document.querySelector("#food-today-calories-detail").textContent = todayEntry ? "朝・昼・夜・間食の合計" : "入力すると表示";
  document.querySelector("#food-meal-count").textContent = `${mealCount || "--"} / 4`;
  document.querySelector("#food-meal-count-detail").textContent = mealCount ? getMealLogLabel(todayEntry.meals || []) : "朝・昼・夜・間食";
  document.querySelector("#food-habit-count").textContent = `${recordedFoodDays || "--"} / 7`;
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
          <span>食事プリセット</span>
          <strong>${escapeHtml(preset.foodName)}</strong>
          <small>${preset.calories ?? 0}kcal</small>
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
  const currentCalories = numberOrNull(document.querySelector(`#${selectedFoodMeal}-calories`).value);
  if (!foodMealItemsDraft[selectedFoodMeal].length && currentCalories !== null) {
    foodMealItemsDraft[selectedFoodMeal].push({
      id: createId(),
      name: "その他（入力済み）",
      amount: "",
      calories: currentCalories,
      protein: null,
      fat: null,
      carbs: null,
    });
  }
  foodMealItemsDraft[selectedFoodMeal].push({
    id: createId(),
    name: preset.foodName,
    amount: "",
    calories: preset.calories,
    protein: null,
    fat: null,
    carbs: null,
  });
  syncMealCaloriesFromItems(selectedFoodMeal);
  renderFoodItems();
  updateNutritionSummary();
}

function saveCurrentFoodAsPreset() {
  const foodName = document.querySelector("#food-item-name").value.trim();
  const calories = numberOrNull(document.querySelector("#food-item-calories").value);
  if (!foodName || calories === null) {
    setSaveFeedback("food", "error", "食事名とカロリーを入力してください。");
    (!foodName ? document.querySelector("#food-item-name") : document.querySelector("#food-item-calories")).focus();
    return;
  }
  const preset = normalizeFoodPreset({
    id: editingFoodPresetId || createId(),
    foodName,
    calories,
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
  clearFoodItemComposer();
  document.querySelector("#food-item-name").value = preset.foodName;
  document.querySelector("#food-item-calories").value = preset.calories ?? "";
  saveFoodPresetButton.textContent = "プリセットを更新";
  cancelFoodPresetEditButton.hidden = false;
  document.querySelector("#food-item-name").focus();
}

function cancelFoodPresetEdit() {
  editingFoodPresetId = null;
  clearFoodItemComposer();
  saveFoodPresetButton.textContent = "食事名とカロリーをプリセットに保存";
  cancelFoodPresetEditButton.hidden = true;
}

function createEmptyMealItems() {
  return { breakfast: [], lunch: [], dinner: [], snack: [] };
}

function normalizeMealItems(mealItems) {
  const normalized = createEmptyMealItems();
  if (!mealItems || typeof mealItems !== "object") return normalized;
  Object.keys(normalized).forEach((meal) => {
    if (!Array.isArray(mealItems[meal])) return;
    normalized[meal] = mealItems[meal]
      .map((item) => ({
        id: typeof item?.id === "string" ? item.id : createId(),
        name: String(item?.name || "").trim().slice(0, 60),
        amount: String(item?.amount || "").trim().slice(0, 30),
        calories: numberOrNull(item?.calories),
        protein: numberOrNull(item?.protein),
        fat: numberOrNull(item?.fat),
        carbs: numberOrNull(item?.carbs),
      }))
      .filter((item) => item.name);
  });
  return normalized;
}

function addCurrentFoodItem() {
  const nameInput = document.querySelector("#food-item-name");
  const protein = numberOrNull(document.querySelector("#food-item-protein").value);
  const fat = numberOrNull(document.querySelector("#food-item-fat").value);
  const carbs = numberOrNull(document.querySelector("#food-item-carbs").value);
  let calories = numberOrNull(document.querySelector("#food-item-calories").value);
  if (!nameInput.value.trim()) {
    setSaveFeedback("food", "error", "料理・食品名を入力してください。");
    nameInput.focus();
    return;
  }
  if (calories === null && [protein, fat, carbs].some((value) => value !== null)) {
    calories = Math.round((protein || 0) * 4 + (fat || 0) * 9 + (carbs || 0) * 4);
  }
  if (calories === null) {
    setSaveFeedback("food", "error", "カロリーか栄養素を入力してください。");
    document.querySelector("#food-item-calories").focus();
    return;
  }
  foodMealItemsDraft[selectedFoodMeal].push({
    id: createId(),
    name: nameInput.value.trim(),
    amount: document.querySelector("#food-item-amount").value.trim(),
    calories,
    protein,
    fat,
    carbs,
  });
  clearFoodItemComposer();
  syncMealCaloriesFromItems(selectedFoodMeal);
  renderFoodItems();
  updateNutritionSummary();
  setSaveFeedback("food", "success", `${getMealName(selectedFoodMeal)}に追加しました。`);
}

function hasFoodItemComposerValue() {
  return ["name", "amount", "calories", "protein", "fat", "carbs"]
    .some((field) => document.querySelector(`#food-item-${field}`).value.trim());
}

function clearFoodItemComposer() {
  ["name", "amount", "calories", "protein", "fat", "carbs"].forEach((field) => {
    document.querySelector(`#food-item-${field}`).value = "";
  });
}

function renderFoodItems() {
  if (!foodItemList) return;
  const items = foodMealItemsDraft[selectedFoodMeal] || [];
  selectedMealItemCount.textContent = `${items.length}品`;
  if (!items.length) {
    foodItemList.innerHTML = `<p class="empty entry-item-empty">${getMealName(selectedFoodMeal)}に追加した食品がここに表示されます。</p>`;
    return;
  }
  foodItemList.innerHTML = items.map((item) => `
    <article class="entry-item-card food-entry-item-card">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.amount || "量未入力")}・${item.calories ?? 0}kcal</span>
        <small>P ${formatNutrient(item.protein)} / F ${formatNutrient(item.fat)} / C ${formatNutrient(item.carbs)}</small>
      </div>
      <button type="button" data-remove-food-item="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.name)}を削除">削除</button>
    </article>
  `).join("");
  foodItemList.querySelectorAll("[data-remove-food-item]").forEach((button) => {
    button.addEventListener("click", () => {
      foodMealItemsDraft[selectedFoodMeal] = foodMealItemsDraft[selectedFoodMeal]
        .filter((item) => item.id !== button.dataset.removeFoodItem);
      syncMealCaloriesFromItems(selectedFoodMeal);
      renderFoodItems();
      updateNutritionSummary();
    });
  });
}

function syncMealCaloriesFromItems(meal) {
  const items = foodMealItemsDraft[meal] || [];
  const input = document.querySelector(`#${meal}-calories`);
  input.value = items.length ? String(Math.round(items.reduce((sum, item) => sum + (item.calories || 0), 0))) : "";
  updateIntakeCaloriesTotal();
}

function getMealCaloriesWithItems(mealItems) {
  const values = getMealCaloriesFromInputs();
  Object.keys(mealItems).forEach((meal) => {
    if (mealItems[meal].length) {
      values[meal] = Math.round(mealItems[meal].reduce((sum, item) => sum + (item.calories || 0), 0));
    }
  });
  return values;
}

function updateNutritionSummary() {
  const items = Object.values(foodMealItemsDraft).flat();
  const total = (key) => items.reduce((sum, item) => sum + (numberOrNull(item[key]) || 0), 0);
  document.querySelector("#food-protein-total").textContent = formatNutrient(total("protein"));
  document.querySelector("#food-fat-total").textContent = formatNutrient(total("fat"));
  document.querySelector("#food-carbs-total").textContent = formatNutrient(total("carbs"));
}

function formatNutrient(value) {
  const number = numberOrNull(value);
  return `${number === null ? 0 : Math.round(number * 10) / 10}g`;
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
        <div>${getMealItemsLabel(entry)}</div>
        <div class="history-actions">
          <button type="button" data-edit-entry="food" data-entry-date="${entry.date}">編集</button>
          <button type="button" data-delete-entry="food" data-entry-date="${entry.date}">削除</button>
        </div>
      </article>
    `)
    .join("");
}

function getMealItemsLabel(entry) {
  const mealItems = normalizeMealItems(entry.mealItems);
  const labels = Object.entries(mealItems)
    .filter(([, items]) => items.length)
    .map(([meal, items]) => `${getMealName(meal)}: ${items.map((item) => escapeHtml(item.name)).join("・")}`);
  return labels.length ? labels.join(" / ") : "食品内訳なし";
}

function hasFoodEntry(entry) {
  return Boolean(entry && (
    Object.values(normalizeMealItems(entry.mealItems)).some((items) => items.length)
    ||
    numberOrNull(entry.intakeCalories) !== null
    || (entry.meals || []).length
  ));
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
  selectedFoodMeal = meal;
  showSelectedMealInput(meal);
  renderFoodItems();
}

function changeSelectedMeal(meal) {
  selectMealInput(meal);
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
  exerciseItemsDraft = normalizeExerciseItems(entry?.exerciseItems);
  if (!exerciseItemsDraft.length && hasLegacyExerciseValues(entry)) {
    exerciseItemsDraft = normalizeExerciseItems([{
      name: entry.exerciseName || getExerciseTypeLabel(entry.exerciseType),
      type: entry.exerciseType,
      minutes: entry.exerciseMinutes,
      burnCalories: entry.burnCalories,
    }]);
  }
  clearExerciseItemComposer();
  renderExerciseItems();
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
  foodMealItemsDraft = normalizeMealItems(entry?.mealItems);
  selectMealInput(getMealsFromCalories(mealCalories)[0] || selectedFoodMeal || "breakfast");
  renderFoodItems();
  updateNutritionSummary();
}

function scoreEntry(entry) {
  let score = 0;
  if (hasWeightEntry(entry)) score += 34;
  if (hasFoodEntry(entry)) score += 33;
  if (hasExerciseEntry(entry)) score += 33;
  return score;
}

function getHabitRatio(weekEntries) {
  const recordedDays = new Set(weekEntries.map((entry) => entry.date)).size;
  return Math.round((recordedDays / 7) * 100);
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
  const burn = getExerciseBurnTotal(entry);
  if (intake === null && burn === null) return "カロリー未入力";
  const intakeText = intake === null ? "--" : Math.round(intake);
  const burnText = burn === null ? "--" : Math.round(burn);
  return `摂取${intakeText} / 運動消費${burnText}kcal`;
}

function getScoreDetail(score) {
  if (score === null) return "体重・食事・運動";
  if (score >= 85) return "今週はかなり安定";
  if (score >= 70) return "記録がしっかり続いています";
  if (score >= 55) return "小さな行動を増やしたい";
  return "まず1項目だけ記録してみる";
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

function renderFoodShortcuts() {
  if (!copyPreviousMealButton || !recentFoodList) return;
  const date = foodDateInput.value || isoToday;
  const previousDate = new Date(`${date}T00:00:00`);
  previousDate.setDate(previousDate.getDate() - 1);
  const previous = entries.find((entry) => entry.date === toIsoDate(previousDate) && hasFoodEntry(entry));
  copyPreviousMealButton.disabled = !previous;
  document.querySelector("#copy-previous-meal-help").textContent = previous
    ? `${formatDateLabel(previous.date)}の食事を複製できます。`
    : "前日に記録があると使えます。";

  const seen = new Set();
  const recent = entries.flatMap((entry) => Object.values(normalizeMealItems(entry.mealItems)).flat())
    .filter((item) => item.name && !seen.has(item.name) && seen.add(item.name))
    .slice(0, 8);
  recentFoodList.innerHTML = recent.length
    ? `<strong>最近使った食品</strong><div>${recent.map((item) => `<button type="button" data-recent-food="${escapeHtml(item.name)}">${escapeHtml(item.name)}</button>`).join("")}</div>`
    : "";
  recentFoodList.querySelectorAll("[data-recent-food]").forEach((button) => button.addEventListener("click", () => {
    const item = recent.find((candidate) => candidate.name === button.dataset.recentFood);
    if (!item) return;
    document.querySelector("#food-item-name").value = item.name;
    document.querySelector("#food-item-amount").value = item.amount || "";
    document.querySelector("#food-item-calories").value = item.calories ?? "";
    document.querySelector("#food-item-protein").value = item.protein ?? "";
    document.querySelector("#food-item-fat").value = item.fat ?? "";
    document.querySelector("#food-item-carbs").value = item.carbs ?? "";
  }));
}

function copyPreviousDayFood() {
  const date = foodDateInput.value || isoToday;
  const previousDate = new Date(`${date}T00:00:00`);
  previousDate.setDate(previousDate.getDate() - 1);
  const previous = entries.find((entry) => entry.date === toIsoDate(previousDate) && hasFoodEntry(entry));
  if (!previous) return;
  foodMealItemsDraft = structuredClone(normalizeMealItems(previous.mealItems));
  renderFoodItems();
  updateNutritionSummary();
  updateIntakeCaloriesTotal();
  setSaveFeedback("food", "success", "前日の食事をコピーしました。内容を確認して保存してください。");
}

function renderActionInsights() {
  const mount = document.querySelector("#action-insights");
  if (!mount) return;
  const week = getRecentEntries(7);
  const priorStart = new Date(today);
  priorStart.setDate(priorStart.getDate() - 13);
  const previousWeek = entries.filter((entry) => {
    const date = new Date(`${entry.date}T00:00:00`);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 7);
    return date >= priorStart && date <= cutoff;
  });
  const average = (list) => {
    const values = list.filter(hasWeightEntry).map(getPrimaryWeight);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  };
  const currentAverage = average(week);
  const previousAverage = average(previousWeek);
  const messages = [];
  if (currentAverage !== null && previousAverage !== null) {
    const diff = currentAverage - previousAverage;
    messages.push(`7日平均は前週より${diff > 0 ? "+" : ""}${diff.toFixed(1)}kgです。日々の増減より平均を見ましょう。`);
  }
  const morningNight = week.filter((entry) => numberOrNull(entry.weightMorning) !== null && numberOrNull(entry.weightNight) !== null);
  if (morningNight.length) {
    const gap = morningNight.reduce((sum, entry) => sum + entry.weightNight - entry.weightMorning, 0) / morningNight.length;
    messages.push(`夜は朝より平均${gap >= 0 ? "+" : ""}${gap.toFixed(1)}kgです。朝夜は分けて比較できます。`);
  }
  const missing = [!hasWeightEntry(entries.find((e) => e.date === isoToday)) && "体重", !hasFoodEntry(entries.find((e) => e.date === isoToday)) && "食事", !hasExerciseEntry(entries.find((e) => e.date === isoToday)) && "運動"].filter(Boolean);
  if (missing.length) messages.push(`今日は${missing.join("・")}が未入力です。まず1つだけ残してみましょう。`);
  mount.innerHTML = messages.slice(0, 2).map((message) => `<p>${escapeHtml(message)}</p>`).join("");
}

function exportFullBackup() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    entries,
    exercisePresets,
    foodPresets,
    presetSeedVersion: appliedPresetSeedVersion,
  };
  downloadJson(payload, `my-diet-notebook-backup-${isoToday}.json`);
  setAppSettingsFeedback("success", "バックアップを書き出しました。");
}

function downloadJson(payload, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function importFullBackup() {
  const file = importBackupFile.files?.[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (!Array.isArray(payload.entries) || !payload.profile || typeof payload.profile !== "object") throw new Error("invalid");
    if (!window.confirm(`${payload.entries.length}日分の記録で現在の端末データを置き換えますか？`)) return;
    entries = payload.entries.map(normalizeEntryWeights).filter((entry) => entry?.date);
    profile = payload.profile;
    exercisePresets = normalizeExercisePresetList(payload.exercisePresets || []);
    foodPresets = normalizeFoodPresetList(payload.foodPresets || []);
    appliedPresetSeedVersion = currentPresetSeedVersion;
    entries.forEach((entry) => dirtyEntryDates.add(entry.date));
    settingsDirty = true;
    saveProfileToDevice(); saveExercisePresets(); saveFoodPresets(); savePresetSeedVersion(); saveEntries();
    fillProfileForm(); fillAllFormsForDate(isoToday); render();
    setAppSettingsFeedback("success", "バックアップを復元しました。");
  } catch {
    setAppSettingsFeedback("error", "このファイルは復元できません。正しいバックアップを選んでください。");
  } finally {
    importBackupFile.value = "";
  }
}

function setAppSettingsFeedback(type, message) {
  appSettingsFeedback.textContent = message;
  appSettingsFeedback.className = `cloud-feedback is-${type}`;
}

async function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.querySelector("#install-app").hidden = true;
}

async function enableReminder() {
  if (!("Notification" in window)) return setAppSettingsFeedback("error", "このブラウザーは通知に対応していません。");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return setAppSettingsFeedback("error", "通知が許可されませんでした。");
  saveReminderSettings();
  setAppSettingsFeedback("success", "リマインダーを有効にしました。アプリ起動中に指定時刻を確認します。");
}

function saveReminderSettings() {
  localStorage.setItem("my-diet-notebook:reminder-time", document.querySelector("#reminder-time").value);
}

function restoreReminderSettings() {
  const input = document.querySelector("#reminder-time");
  input.value = localStorage.getItem("my-diet-notebook:reminder-time") || "21:00";
  window.setInterval(checkReminder, 60000);
}

function checkReminder() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = new Date();
  const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const key = `my-diet-notebook:reminded:${isoToday}`;
  if (current !== document.querySelector("#reminder-time").value || localStorage.getItem(key)) return;
  new Notification("My Diet Notebook", { body: "今日の体重・食事・運動を1つだけ記録しませんか？", icon: "icons/icon.svg" });
  localStorage.setItem(key, "1");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

function numberOrNull(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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

const API_BASE_URL = "https://campuswell-api-dah4.onrender.com/api/v1";
const token = localStorage.getItem("campuswell_access_token");

const $ = (id) => document.getElementById(id);
const scoreElement = $("wellnessScore");
const statusElement = $("wellnessStatus");
const progressElement = $("scoreProgress");
const moodElement = $("overviewMood");
const sleepElement = $("overviewSleep");
const activityElement = $("overviewActivity");
const stressElement = $("overviewStress");
const historyList = $("historyList");
const form = $("wellnessForm");
const formStatus = $("wellnessFormStatus");
const submitButton = $("wellnessSubmit");

if (!token) {
    window.location.replace("../student-login/student-login.html");
}

async function apiRequest(path, options = {}) {
    const response = await fetch(API_BASE_URL + path, {
        ...options,
        headers: {
            Authorization: "Bearer " + token,
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        }
    });

    if (response.status === 401) {
        ["campuswell_access_token", "campuswell_student_email", "campuswell_user"].forEach(key => localStorage.removeItem(key));
        window.location.replace("../student-login/student-login.html");
        throw new Error("Your session expired. Please sign in again.");
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "Something went wrong. Please try again.");
    return data;
}

function calculateScore(mood, sleep, energy, stress) {
    const moodScore = { Great: 100, Good: 85, Okay: 65, Low: 40, Stressed: 30 }[mood] || 60;
    const sleepScore = Math.max(20, 100 - Math.abs(8 - sleep) * 13);
    const energyScore = { High: 100, Moderate: 70, Low: 40 }[energy] || 60;
    const stressScore = { Low: 100, Moderate: 65, High: 30 }[stress] || 60;
    return Math.round((moodScore + sleepScore + energyScore + stressScore) / 4);
}

function normalizeRecords(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.checkins)) return payload.checkins;
    return [];
}

function renderHistory(records) {
    if (!historyList) return;
    if (!records.length) {
        historyList.innerHTML = '<div class="empty-history"><div>▤</div><strong>No check-ins yet</strong><p>Complete your first wellness check-in to start tracking your progress.</p></div>';
        return;
    }

    historyList.innerHTML = records.slice(0, 5).map(record => {
        const date = record.submitted_at ? new Date(record.submitted_at) : null;
        const dateText = date && !Number.isNaN(date.getTime())
            ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            : "Recent check-in";
        return '<div class="history-entry"><span>' + dateText + '</span><strong>' + (record.score ?? "—") + '/100</strong></div>';
    }).join("");
}

function updateOverview(records) {
    if (!records.length) {
        if (scoreElement) scoreElement.textContent = "—";
        if (progressElement) progressElement.style.width = "0%";
        if (statusElement) statusElement.textContent = "Your wellness journey starts here.";
        if (moodElement) moodElement.textContent = "—";
        if (sleepElement) sleepElement.textContent = "—";
        if (activityElement) activityElement.textContent = "—";
        if (stressElement) stressElement.textContent = "—";
        return;
    }

    const latest = records[0];
    const score = Number(latest.score ?? 0);
    if (scoreElement) scoreElement.textContent = String(score);
    if (progressElement) progressElement.style.width = Math.max(0, Math.min(100, score)) + "%";
    if (statusElement) statusElement.textContent = score >= 80
        ? "Your well-being is looking great!"
        : score >= 60
            ? "Your well-being is going steadily."
            : "Consider reaching out for support if you need it.";
    if (moodElement) moodElement.textContent = latest.mood || "Not recorded";
    if (sleepElement) sleepElement.textContent = latest.sleep_hours == null ? "Not recorded" : latest.sleep_hours + " hrs";
    if (activityElement) activityElement.textContent = latest.energy_level || "Not recorded";
    if (stressElement) stressElement.textContent = latest.stress_level || "Not recorded";
}

async function loadCheckins() {
    try {
        const payload = await apiRequest("/wellness/checkins");
        const records = normalizeRecords(payload);
        updateOverview(records);
        renderHistory(records);
    } catch (error) {
        if (formStatus) formStatus.textContent = error.message;
        if (historyList) {
            historyList.innerHTML = '<div class="empty-history"><strong>Unable to load check-ins</strong><p>' +
                String(error.message || "Please try again later.") + '</p></div>';
        }
    }
}

function selectOption(selector, inputId, value, dataKey) {
    const input = $(inputId);
    if (input) input.value = value;
    document.querySelectorAll(selector).forEach(button => {
        button.classList.toggle("selected", button.dataset[dataKey] === value);
    });
}

document.querySelectorAll("[data-mood]").forEach(button => button.addEventListener("click", () => {
    selectOption("[data-mood]", "moodInput", button.dataset.mood, "mood");
}));
document.querySelectorAll("[data-energy]").forEach(button => button.addEventListener("click", () => {
    selectOption("[data-energy]", "energyInput", button.dataset.energy, "energy");
}));
document.querySelectorAll("[data-stress]").forEach(button => button.addEventListener("click", () => {
    selectOption("[data-stress]", "stressInput", button.dataset.stress, "stress");
}));
document.querySelectorAll("[data-sleep]").forEach(button => button.addEventListener("click", () => {
    const sleepInput = $("sleepInput");
    if (sleepInput) sleepInput.value = button.dataset.sleep;
    document.querySelectorAll("[data-sleep]").forEach(item => item.classList.toggle("selected", item === button));
}));

if (form) {
    form.addEventListener("reset", () => {
        document.querySelectorAll(".mood-choice,.level-picker button,.sleep-quick-picks button")
            .forEach(item => item.classList.remove("selected"));
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const mood = $("moodInput")?.value || "";
        const sleepValue = $("sleepInput")?.value;
        const sleep = Number(sleepValue);
        const energy = $("energyInput")?.value || "";
        const stress = $("stressInput")?.value || "";
        const notes = $("notesInput")?.value.trim() || "";

        if (!mood || sleepValue === "" || !Number.isFinite(sleep) || !energy || !stress) {
            if (formStatus) formStatus.textContent = "Please complete your mood, sleep, energy and stress selections.";
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Saving...";
        }
        if (formStatus) formStatus.textContent = "";

        try {
            const score = calculateScore(mood, sleep, energy, stress);
            await apiRequest("/wellness/checkins", {
                method: "POST",
                body: JSON.stringify({
                    mood,
                    sleep_hours: sleep,
                    energy_level: energy,
                    stress_level: stress,
                    score,
                    notes: notes || null
                })
            });

            form.reset();
            if (formStatus) formStatus.textContent = "Your check-in has been saved securely.";
            await loadCheckins();
        } catch (error) {
            if (formStatus) formStatus.textContent = error.message;
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Save check-in";
            }
        }
    });
}

const viewAllButton = $("viewAllHistory");
if (viewAllButton && historyList) {
    viewAllButton.addEventListener("click", () => historyList.scrollIntoView({ behavior: "smooth", block: "center" }));
}

loadCheckins();

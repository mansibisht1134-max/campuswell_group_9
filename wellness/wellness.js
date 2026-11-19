const API_BASE_URL = "https://campuswell-api-dah4.onrender.com/api/v1";
const token = localStorage.getItem("campuswell_access_token");
const scoreElement = document.getElementById("wellnessScore");
const statusElement = document.getElementById("wellnessStatus");
const progressElement = document.getElementById("scoreProgress");
const moodElement = document.getElementById("overviewMood");
const sleepElement = document.getElementById("overviewSleep");
const activityElement = document.getElementById("overviewActivity");
const stressElement = document.getElementById("overviewStress");
const historyList = document.getElementById("historyList");
const form = document.getElementById("wellnessForm");
const formStatus = document.getElementById("wellnessFormStatus");

if (!token) {
    window.location.replace("../student-login/student-login.html");
}

async function apiRequest(path, options = {}) {
    const response = await fetch(API_BASE_URL + path, {
        ...options,
        headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/json",
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

function renderHistory(records) {
    if (!records.length) {
        historyList.innerHTML = '<div class="empty-history"><div>▤</div><strong>No check-ins yet</strong><p>Complete your first wellness check-in to start tracking your progress.</p></div>';
        return;
    }
    historyList.innerHTML = records.slice(0, 5).map(record => {
        const date = new Date(record.submitted_at);
        const dateText = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        return '<div class="history-entry"><span>' + dateText + '</span><strong>' + (record.score ?? "—") + '/100</strong></div>';
    }).join("");
}

function updateOverview(records) {
    if (!records.length) {
        scoreElement.textContent = "—";
        progressElement.style.width = "0%";
        statusElement.textContent = "Your wellness journey starts here.";
        return;
    }
    const latest = records[0];
    const score = latest.score ?? 0;
    scoreElement.textContent = score;
    progressElement.style.width = score + "%";
    statusElement.textContent = score >= 80 ? "Your well-being is looking great!" : score >= 60 ? "Your well-being is going steadily." : "Consider reaching out for support if you need it.";
    moodElement.textContent = latest.mood || "Not recorded";
    sleepElement.textContent = latest.sleep_hours == null ? "Not recorded" : latest.sleep_hours + " hrs";
    activityElement.textContent = latest.energy_level || "Not recorded";
    stressElement.textContent = latest.stress_level || "Not recorded";
}

async function loadCheckins() {
    try {
        const records = await apiRequest("/wellness/checkins");
        updateOverview(records);
        renderHistory(records);
    } catch (error) {
        formStatus.textContent = error.message;
    }
}


// Visual mood, energy, stress and sleep controls stay connected to the original form fields.
document.querySelectorAll("[data-mood]").forEach(button => button.addEventListener("click", () => {
    document.getElementById("moodInput").value = button.dataset.mood;
    document.querySelectorAll("[data-mood]").forEach(item => item.classList.toggle("selected", item === button));
}));
document.querySelectorAll("[data-energy]").forEach(button => button.addEventListener("click", () => {
    document.getElementById("energyInput").value = button.dataset.energy;
    document.querySelectorAll("[data-energy]").forEach(item => item.classList.toggle("selected", item === button));
}));
document.querySelectorAll("[data-stress]").forEach(button => button.addEventListener("click", () => {
    document.getElementById("stressInput").value = button.dataset.stress;
    document.querySelectorAll("[data-stress]").forEach(item => item.classList.toggle("selected", item === button));
}));
document.querySelectorAll("[data-sleep]").forEach(button => button.addEventListener("click", () => {
    document.getElementById("sleepInput").value = button.dataset.sleep;
    document.querySelectorAll("[data-sleep]").forEach(item => item.classList.toggle("selected", item === button));
}));
form.addEventListener("reset", () => document.querySelectorAll(".mood-choice,.level-picker button,.sleep-quick-picks button").forEach(item => item.classList.remove("selected")));

form.addEventListener("submit", async event => {
    event.preventDefault();
    const mood = document.getElementById("moodInput").value;
    const sleep = Number(document.getElementById("sleepInput").value);
    const energy = document.getElementById("energyInput").value;
    const stress = document.getElementById("stressInput").value;
    const notes = document.getElementById("notesInput").value.trim();
    const score = calculateScore(mood, sleep, energy, stress);
    const submit = document.getElementById("wellnessSubmit");
    submit.disabled = true;
    submit.textContent = "Saving...";
    formStatus.textContent = "";
    try {
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
        formStatus.textContent = "Your check-in has been saved securely.";
        await loadCheckins();
    } catch (error) {
        formStatus.textContent = error.message;
    } finally {
        submit.disabled = false;
        submit.textContent = "Save check-in";
    }
});

document.getElementById("viewAllHistory").addEventListener("click", () => {
    historyList.scrollIntoView({ behavior: "smooth", block: "center" });
});

loadCheckins();

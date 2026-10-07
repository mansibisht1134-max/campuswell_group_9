const storageKey = "campuswell_wellness_checkins";
const records = JSON.parse(localStorage.getItem(storageKey) || "[]");
const scoreElement = document.getElementById("wellnessScore");
const statusElement = document.getElementById("wellnessStatus");
const progressElement = document.getElementById("scoreProgress");
const moodElement = document.getElementById("overviewMood");
const sleepElement = document.getElementById("overviewSleep");
const activityElement = document.getElementById("overviewActivity");
const stressElement = document.getElementById("overviewStress");
const historyList = document.getElementById("historyList");
const toast = document.getElementById("toast");

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

function updateDashboard() {
    if (!records.length) return;
    const latest = records[0];
    const score = Math.round(latest.score || 78);
    scoreElement.textContent = score;
    progressElement.style.width = `${score}%`;
    if (score >= 80) statusElement.textContent = "Your well-being is looking great!";
    else if (score >= 60) statusElement.textContent = "Your well-being is going well!";
    else statusElement.textContent = "Let's take some time for yourself.";
    if (latest.moodLabel) moodElement.textContent = latest.moodLabel;
    if (latest.sleep) sleepElement.textContent = latest.sleep;
    if (latest.energy) activityElement.textContent = latest.energy;
    if (latest.stressLabel) stressElement.textContent = latest.stressLabel;
    renderHistory();
}

function renderHistory() {
    if (!records.length) {
        historyList.innerHTML = '<div class="empty-history"><div>▤</div><strong>No check-ins yet</strong><p>Complete your first wellness check-in to start tracking your progress.</p></div>';
        return;
    }
    historyList.innerHTML = records.slice(0, 4).map(record => {
        const date = new Date(record.date);
        return `<div class="history-entry"><span>${date.toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</span><strong>${Math.round(record.score)}/100</strong></div>`;
    }).join("");
}

document.getElementById("viewAllHistory").addEventListener("click", () => {
    if (records.length) showToast("Your recent check-ins are shown here.");
    else showToast("Complete your first wellness check-in.");
});

updateDashboard();
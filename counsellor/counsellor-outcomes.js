const initialOutcomeRecords = [
    {
        key: "outcome-1032",
        name: "Aarav Mehta",
        id: "STU1032",
        intervention: "Stress Management",
        initial: 62,
        latest: 84,
        status: "Improved",
        goalsDone: 3,
        goalsTotal: 4,
        date: "2025-05-12",
        notes: "Improved wellbeing score after stress-management support. Continue to reinforce coping strategies."
    },
    {
        key: "outcome-1056",
        name: "Simran Kaur",
        id: "STU1056",
        intervention: "Academic Support",
        initial: 55,
        latest: 63,
        status: "No Significant Change",
        goalsDone: 1,
        goalsTotal: 4,
        date: "2025-05-08",
        notes: "Some progress is visible, but academic anxiety remains. Review the support plan with the student."
    },
    {
        key: "outcome-1139",
        name: "Neha Singh",
        id: "STU1139",
        intervention: "Wellbeing & Resilience",
        initial: 70,
        latest: 88,
        status: "Improved",
        goalsDone: 4,
        goalsTotal: 5,
        date: "2025-05-02",
        notes: "Student reports better daily routine and concentration. Maintain existing protective habits."
    },
    {
        key: "outcome-1187",
        name: "Rohan Singh",
        id: "STU1187",
        intervention: "Group Workshop",
        initial: 48,
        latest: 60,
        status: "No Significant Change",
        goalsDone: 2,
        goalsTotal: 5,
        date: "2025-04-28",
        notes: "Student participated in the group workshop. Individual follow-up may help clarify remaining needs."
    },
    {
        key: "outcome-1210",
        name: "Isha Verma",
        id: "STU1210",
        intervention: "Academic Support",
        initial: 65,
        latest: 72,
        status: "Needs Further Support",
        goalsDone: 1,
        goalsTotal: 3,
        date: "2025-04-20",
        notes: "Some positive change, but student may benefit from a more tailored support plan."
    }
];

const storageKey = "campuswell_outcome_records_v1";
const outcomeTableBody = document.getElementById("outcomeTableBody");
const outcomeForm = document.getElementById("outcomeForm");
const outcomeModal = document.getElementById("outcomeModal");
const modalTitle = document.getElementById("modalTitle");
const tableSearch = document.getElementById("tableSearch");
const globalSearch = document.getElementById("globalSearch");
const outcomeFilter = document.getElementById("outcomeFilter");
const interventionFilter = document.getElementById("interventionFilter");
const dateFilter = document.getElementById("dateFilter");
const emptyState = document.getElementById("emptyState");
const recordCount = document.getElementById("recordCount");
const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");
let records = loadRecords();
let toastTimer;

function loadRecords() {
    try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                return parsed.filter(record => record && record.key && record.name && record.id).map(normalizeRecord);
            }
        }
    } catch (error) {
        console.warn("Outcome records could not be loaded from local storage.", error);
    }
    return initialOutcomeRecords.map(record => ({ ...record }));
}

function normalizeRecord(record) {
    return {
        ...record,
        initial: numberOrZero(record.initial),
        latest: numberOrZero(record.latest),
        goalsDone: numberOrZero(record.goalsDone),
        goalsTotal: numberOrZero(record.goalsTotal),
        date: String(record.date || ""),
        status: ["Improved", "No Significant Change", "Needs Further Support"].includes(record.status)
            ? record.status
            : "No Significant Change"
    };
}

function numberOrZero(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function saveRecords() {
    try {
        localStorage.setItem(storageKey, JSON.stringify(records));
        return true;
    } catch (error) {
        console.warn("Outcome records could not be saved to browser storage.", error);
        showToast("Changes are visible now, but browser storage is unavailable.");
        return false;
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function statusClass(status) {
    if (status === "Improved") return "status-improved";
    if (status === "No Significant Change") return "status-no-change";
    return "status-support";
}

function formatDate(isoDate) {
    if (!isoDate) return "—";
    const date = new Date(`${isoDate}T12:00:00`);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getOutcomeStats() {
    const total = records.length;
    const improved = records.filter(record => record.status === "Improved").length;
    const noChange = records.filter(record => record.status === "No Significant Change").length;
    const needsSupport = records.filter(record => record.status === "Needs Further Support").length;
    const goalsDone = records.reduce((sum, record) => sum + Math.max(0, numberOrZero(record.goalsDone)), 0);
    const goalsTotal = records.reduce((sum, record) => sum + Math.max(0, numberOrZero(record.goalsTotal)), 0);
    const averageGain = total
        ? records.reduce((sum, record) => sum + (numberOrZero(record.latest) - numberOrZero(record.initial)), 0) / total
        : 0;
    const averageInitial = total
        ? records.reduce((sum, record) => sum + numberOrZero(record.initial), 0) / total
        : 0;
    const averageLatest = total
        ? records.reduce((sum, record) => sum + numberOrZero(record.latest), 0) / total
        : 0;

    return {
        total,
        improved,
        noChange,
        needsSupport,
        improvedRate: total ? Math.round((improved / total) * 100) : 0,
        noChangeRate: total ? Math.round((noChange / total) * 100) : 0,
        supportRate: total ? Math.round((needsSupport / total) * 100) : 0,
        goalsDone,
        goalsTotal,
        goalRate: goalsTotal ? Math.round((goalsDone / goalsTotal) * 100) : 0,
        averageGain: Math.round(averageGain),
        averageInitial: Math.round(averageInitial),
        averageLatest: Math.round(averageLatest)
    };
}

function getBestInterventionGain() {
    const groups = new Map();
    records.forEach(record => {
        const intervention = record.intervention || "Unspecified intervention";
        if (!groups.has(intervention)) groups.set(intervention, []);
        groups.get(intervention).push(numberOrZero(record.latest) - numberOrZero(record.initial));
    });

    let best = null;
    groups.forEach((gains, name) => {
        const average = gains.reduce((sum, gain) => sum + gain, 0) / gains.length;
        if (!best || average > best.average) best = { name, average, count: gains.length };
    });
    return best;
}

function renderDashboard() {
    const stats = getOutcomeStats();
    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    setText("overallImprovement", `${stats.improvedRate}%`);
    setText("assessmentsMetric", stats.total);
    setText("improvedMetric", `${stats.improvedRate}%`);
    setText("goalsMetric", `${stats.goalRate}%`);
    setText("supportMetric", stats.needsSupport);
    setText("scoreGainMetric", `${stats.averageGain > 0 ? "+" : ""}${stats.averageGain} pts`);
    setText("goalRateMetric", `${stats.goalRate}%`);
    setText("supportRateMetric", `${stats.supportRate}%`);
    setText("distributionTotal", stats.total);
    setText("distributionImproved", `${stats.improvedRate}%`);
    setText("distributionNoChange", `${stats.noChangeRate}%`);
    setText("distributionSupport", `${stats.supportRate}%`);
    setText("assessmentsCaption", "Recorded evaluations");
    setText("improvedCaption", "Share of all outcomes");
    setText("goalsCaption", `${stats.goalsDone} of ${stats.goalsTotal} goals achieved`);
    setText("supportCaption", "Marked for more support");
    setText("progressDescription", stats.total
        ? `Based on ${stats.total} outcome ${stats.total === 1 ? "record" : "records"} saved in this browser.`
        : "Record an outcome to begin measuring student progress.");

    const improvementRing = document.getElementById("progressRing");
    const ringWrap = document.getElementById("improvementRingWrap");
    if (improvementRing) {
        const angle = stats.improvedRate * 3.6;
        improvementRing.style.background = stats.total
            ? `conic-gradient(from -8deg, #139b91 0deg, #0bab8e ${angle}deg, #dce7f5 ${angle}deg 360deg)`
            : "conic-gradient(#dce7f5 0deg 360deg)";
    }
    if (ringWrap) ringWrap.setAttribute("aria-label", `Overall improvement rate ${stats.improvedRate} percent, based on ${stats.total} outcome records`);

    const donut = document.getElementById("outcomeDonutChart");
    if (donut) {
        const improvedEnd = stats.total ? (stats.improved / stats.total) * 360 : 0;
        const noChangeEnd = stats.total ? improvedEnd + (stats.noChange / stats.total) * 360 : 0;
        donut.style.background = stats.total
            ? `conic-gradient(var(--teal) 0deg ${improvedEnd}deg, var(--amber) ${improvedEnd}deg ${noChangeEnd}deg, var(--pink) ${noChangeEnd}deg 360deg)`
            : "conic-gradient(#e5edf6 0deg 360deg)";
        donut.setAttribute("aria-label", `Outcome distribution: ${stats.improvedRate}% improved, ${stats.noChangeRate}% no significant change, ${stats.supportRate}% needs further support`);
    }

    const scoreArrow = document.getElementById("scoreGainArrow");
    if (scoreArrow) {
        scoreArrow.textContent = stats.averageGain > 0 ? "↗" : stats.averageGain < 0 ? "↘" : "→";
        scoreArrow.classList.toggle("negative", stats.averageGain < 0);
    }
    const supportArrow = document.getElementById("supportRateArrow");
    if (supportArrow) {
        supportArrow.textContent = stats.supportRate > 0 ? "↗" : "→";
        supportArrow.classList.toggle("negative", stats.supportRate > 0);
    }

    renderTrendChart();
    renderKeyInsights(stats);
}

function renderTrendChart() {
    const chart = document.getElementById("trendChart");
    if (!chart) return;

    const datedRecords = records.filter(record => /^\d{4}-\d{2}-\d{2}$/.test(record.date));
    const latestDate = datedRecords
        .map(record => new Date(`${record.date}T12:00:00`))
        .filter(date => !Number.isNaN(date.getTime()))
        .sort((a, b) => b - a)[0];

    if (!latestDate) {
        chart.innerHTML = makeChartGrid([]);
        chart.setAttribute("aria-label", "No dated outcome records are available for the progress trend chart");
        return;
    }

    const latestMonthIndex = latestDate.getFullYear() * 12 + latestDate.getMonth();
    const months = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
        const monthIndex = latestMonthIndex - offset;
        const year = Math.floor(monthIndex / 12);
        const month = monthIndex % 12;
        const monthDate = new Date(year, month, 1);
        const key = `${year}-${String(month + 1).padStart(2, "0")}`;
        const monthRecords = datedRecords.filter(record => record.date.startsWith(key));
        const average = field => monthRecords.length
            ? monthRecords.reduce((sum, record) => sum + numberOrZero(record[field]), 0) / monthRecords.length
            : null;
        months.push({
            key,
            label: monthDate.toLocaleDateString("en-US", { month: "short" }),
            year,
            count: monthRecords.length,
            initial: average("initial"),
            latest: average("latest")
        });
    }

    const left = 40;
    const right = 480;
    const top = 18;
    const bottom = 168;
    const xFor = index => left + (index * (right - left)) / (months.length - 1);
    const yFor = value => bottom - (Math.max(0, Math.min(100, value)) / 100) * (bottom - top);
    const latestPoints = [];
    const initialPoints = [];
    months.forEach((month, index) => {
        const x = xFor(index);
        if (month.latest !== null) latestPoints.push({ x, y: yFor(month.latest), value: month.latest, label: month.label });
        if (month.initial !== null) initialPoints.push({ x, y: yFor(month.initial), value: month.initial, label: month.label });
    });

    const latestPolyline = latestPoints.map(point => `${point.x},${point.y}`).join(" ");
    const initialPolyline = initialPoints.map(point => `${point.x},${point.y}`).join(" ");
    const pointCircles = (points, className, label) => points.map(point =>
        `<circle cx="${point.x}" cy="${point.y}" r="3.2"><title>${escapeHTML(point.label)} ${label}: ${Math.round(point.value)}</title></circle>`
    ).join("");
    const yLabels = [100, 80, 60, 40, 20, 0].map(value => {
        const y = yFor(value) + 4;
        return `<text x="10" y="${y}">${value}</text>`;
    }).join("");
    const xGrid = months.map((month, index) => `<line x1="${xFor(index)}" y1="${top}" x2="${xFor(index)}" y2="${bottom}"/>`).join("");
    const xLabels = months.map((month, index) => {
        const x = xFor(index);
        const suffix = month.year !== latestDate.getFullYear() ? ` '${String(month.year).slice(-2)}` : "";
        return `<text x="${x}" y="188" text-anchor="${index === 5 ? "end" : index === 0 ? "start" : "middle"}">${month.label}${suffix}</text>`;
    }).join("");
    chart.innerHTML = `
        <g class="chart-grid-lines">
            ${[18, 48, 78, 108, 138, 168].map(y => `<line x1="40" y1="${y}" x2="480" y2="${y}"/>`).join("")}
            ${xGrid}
        </g>
        <g class="chart-y-labels">${yLabels}</g>
        <polyline class="chart-line line-teal" points="${latestPolyline}"/>
        <polyline class="chart-line line-purple" points="${initialPolyline}"/>
        <g class="point-teal">${pointCircles(latestPoints, "point-teal", "latest assessment")}</g>
        <g class="point-purple">${pointCircles(initialPoints, "point-purple", "initial assessment")}</g>
        <g class="chart-x-labels">${xLabels}</g>
    `;
    const monthsWithRecords = months.filter(month => month.count > 0).length;
    chart.setAttribute("aria-label", `Initial versus latest assessment scores across the most recent six months. ${monthsWithRecords} months contain outcome records.`);
}

function makeChartGrid(labels) {
    const yLines = [18, 48, 78, 108, 138, 168].map(y => `<line x1="40" y1="${y}" x2="480" y2="${y}"/>`).join("");
    const yLabels = [100, 80, 60, 40, 20, 0].map((value, index) => `<text x="10" y="${[22, 52, 82, 112, 142, 172][index]}">${value}</text>`).join("");
    return `<g class="chart-grid-lines">${yLines}</g><g class="chart-y-labels">${yLabels}</g><text class="chart-x-labels" x="250" y="100" text-anchor="middle">No dated outcomes yet</text>`;
}

function renderKeyInsights(stats = getOutcomeStats()) {
    const list = document.getElementById("keyInsightsList");
    if (!list) return;
    const best = getBestInterventionGain();
    const gainText = stats.averageGain > 0 ? `+${stats.averageGain}` : `${stats.averageGain}`;
    const supportMessage = stats.needsSupport
        ? `${stats.supportRate}% (${stats.needsSupport}) ${stats.needsSupport === 1 ? "student is" : "students are"} marked for further support; review ${stats.needsSupport === 1 ? "their" : "their"} support plan.`
        : "No students are currently marked as needing further support in these records.";
    const messages = stats.total ? [
        `${stats.improvedRate}% of recorded students show improvement (${stats.improved} of ${stats.total} outcomes).`,
        best ? `${best.name} has the strongest average score change (${Math.round(best.average) > 0 ? "+" : ""}${Math.round(best.average)} points across ${best.count} ${best.count === 1 ? "record" : "records"}).` : `Average assessment score change is ${gainText} points.`,
        supportMessage
    ] : [
        "No outcome records have been saved yet.",
        "Record initial and latest assessment scores to begin comparing progress.",
        "Students needing further support will appear in this panel when outcomes are recorded."
    ];
    list.innerHTML = messages.map(message => `<li>${escapeHTML(message)}</li>`).join("");
}

function getSearchQuery() {
    const globalValue = globalSearch.value.trim().toLowerCase();
    const tableValue = tableSearch.value.trim().toLowerCase();
    return [globalValue, tableValue].filter(Boolean);
}

function getFilteredRecords() {
    const queries = getSearchQuery();
    return records.filter(record => {
        const searchable = `${record.name} ${record.id} ${record.intervention} ${record.status} ${record.notes || ""}`.toLowerCase();
        const matchesSearch = queries.every(query => searchable.includes(query));
        const matchesOutcome = outcomeFilter.value === "all" || record.status === outcomeFilter.value;
        const matchesIntervention = interventionFilter.value === "all" || record.intervention === interventionFilter.value;
        const matchesDate = !dateFilter.value || record.date === dateFilter.value;
        return matchesSearch && matchesOutcome && matchesIntervention && matchesDate;
    });
}

function renderRecords() {
    const filtered = getFilteredRecords();
    outcomeTableBody.innerHTML = filtered.map(record => `
        <tr>
            <td>${escapeHTML(record.name)}</td>
            <td>${escapeHTML(record.id)}</td>
            <td>${escapeHTML(record.intervention)}</td>
            <td>${escapeHTML(record.initial)}</td>
            <td>${escapeHTML(record.latest)}</td>
            <td><span class="status-badge ${statusClass(record.status)}">${escapeHTML(record.status)}</span></td>
            <td>${escapeHTML(record.goalsDone)} / ${escapeHTML(record.goalsTotal)}</td>
            <td>${escapeHTML(formatDate(record.date))}</td>
            <td><button class="row-action" type="button" data-edit-key="${escapeHTML(record.key)}"><i data-lucide="eye"></i><span>View / Edit</span></button></td>
        </tr>
    `).join("");
    emptyState.hidden = filtered.length !== 0;
    recordCount.textContent = `Showing ${filtered.length} of ${records.length} outcome ${records.length === 1 ? "record" : "records"}.`;
    outcomeTableBody.querySelectorAll("[data-edit-key]").forEach(button => {
        button.addEventListener("click", () => openModal(button.dataset.editKey));
    });
    refreshIcons();
}

function refreshIcons() {
    if (window.lucide?.createIcons) window.lucide.createIcons();
}

function showToast(message) {
    toastText.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function setValue(id, value) {
    const field = document.getElementById(id);
    if (field) field.value = value ?? "";
}

function openModal(key = "") {
    outcomeForm.reset();
    setValue("recordKey", "");
    setValue("evaluationDate", new Date().toISOString().slice(0, 10));
    setValue("initialAssessment", 50);
    setValue("latestAssessment", 50);
    setValue("goalsDone", 0);
    setValue("goalsTotal", 3);
    setValue("outcomeStatus", "Improved");
    modalTitle.textContent = key ? "View / Edit Outcome" : "Record Outcome";
    if (key) {
        const record = records.find(item => item.key === key);
        if (!record) {
            showToast("That outcome record could not be found.");
            return;
        }
        setValue("recordKey", record.key);
        setValue("studentName", record.name);
        setValue("studentId", record.id);
        setValue("interventionType", record.intervention);
        setValue("initialAssessment", record.initial);
        setValue("latestAssessment", record.latest);
        setValue("outcomeStatus", record.status);
        setValue("goalsDone", record.goalsDone);
        setValue("goalsTotal", record.goalsTotal);
        setValue("evaluationDate", record.date);
        setValue("outcomeNotes", record.notes);
    }
    outcomeModal.hidden = false;
    document.body.classList.add("modal-open");
    refreshIcons();
    setTimeout(() => document.getElementById("studentName").focus(), 30);
}

function closeModal() {
    outcomeModal.hidden = true;
    document.body.classList.remove("modal-open");
}

function clearFilters() {
    globalSearch.value = "";
    tableSearch.value = "";
    outcomeFilter.value = "all";
    interventionFilter.value = "all";
    dateFilter.value = "";
    renderRecords();
}

function recordOutcome(event) {
    event.preventDefault();
    const key = document.getElementById("recordKey").value;
    const name = document.getElementById("studentName").value.trim();
    const id = document.getElementById("studentId").value.trim().toUpperCase();
    const initial = Number(document.getElementById("initialAssessment").value);
    const latest = Number(document.getElementById("latestAssessment").value);
    const goalsDone = Number(document.getElementById("goalsDone").value);
    const goalsTotal = Number(document.getElementById("goalsTotal").value);
    if (!name || !id) {
        showToast("Enter the student's name and ID.");
        return;
    }
    if (![initial, latest].every(score => Number.isFinite(score) && score >= 0 && score <= 100)) {
        showToast("Assessment scores must be between 0 and 100.");
        return;
    }
    if (goalsTotal < 1 || goalsDone < 0 || goalsDone > goalsTotal) {
        showToast("Goals achieved must be between zero and total goals.");
        return;
    }
    const existing = key ? records.find(item => item.key === key) : null;
    const record = normalizeRecord({
        key: key || `outcome-${Date.now()}`,
        name,
        id,
        intervention: document.getElementById("interventionType").value,
        initial,
        latest,
        status: document.getElementById("outcomeStatus").value,
        goalsDone,
        goalsTotal,
        date: document.getElementById("evaluationDate").value,
        notes: document.getElementById("outcomeNotes").value.trim()
    });
    if (existing) {
        records = records.map(item => item.key === key ? record : item);
    } else {
        records.unshift(record);
    }
    const saved = saveRecords();
    closeModal();
    renderDashboard();
    renderRecords();
    if (saved) showToast(existing ? "Outcome updated. Cards and charts are recalculated." : "Outcome recorded. Cards and charts are recalculated.");
}

function buildDetailedInsightItems() {
    const stats = getOutcomeStats();
    const best = getBestInterventionGain();
    if (!stats.total) {
        return [
            { title: "Start recording outcomes", text: "Add assessment scores, outcome status, and goals so this dashboard can calculate the results." },
            { title: "Trend chart", text: "The trend chart will plot initial and latest scores by evaluation month." },
            { title: "Support planning", text: "Any records marked Needs Further Support will be reflected in the distribution and summary cards." }
        ];
    }
    return [
        { title: "Improvement", text: `${stats.improvedRate}% of recorded outcomes are marked Improved (${stats.improved} of ${stats.total}). Average initial score: ${stats.averageInitial}; average latest score: ${stats.averageLatest}.` },
        { title: "Goals", text: `${stats.goalsDone} of ${stats.goalsTotal} recorded goals are marked achieved (${stats.goalRate}%).` },
        { title: "Further support", text: `${stats.needsSupport} ${stats.needsSupport === 1 ? "record is" : "records are"} marked Needs Further Support (${stats.supportRate}%).${best ? ` Highest average score change by intervention: ${best.name} (${Math.round(best.average) > 0 ? "+" : ""}${Math.round(best.average)} points).` : ""}` }
    ];
}

function showInformation(title, message) {
    const oldDialog = document.getElementById("informationDialog");
    if (oldDialog) oldDialog.remove();
    const dialog = document.createElement("div");
    dialog.className = "modal-backdrop information-backdrop";
    dialog.id = "informationDialog";
    const details = buildDetailedInsightItems();
    dialog.innerHTML = `
        <section class="modal-card information-card" role="dialog" aria-modal="true" aria-labelledby="informationTitle">
            <div class="modal-header">
                <div><span class="modal-eyebrow">CAMPUSWELL INSIGHTS</span><h2 id="informationTitle">${escapeHTML(title)}</h2><p>${escapeHTML(message)}</p></div>
                <button type="button" class="modal-close" aria-label="Close"><i data-lucide="x"></i></button>
            </div>
            <div class="insight-detail-list">
                ${details.map((item, index) => `
                    <div><span class="insight-detail-dot ${["dot-teal", "dot-purple", "dot-orange"][index]}"></span><div><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.text)}</p></div></div>
                `).join("")}
            </div>
            <div class="modal-actions"><button type="button" class="primary-button" data-close-dialog>Close</button></div>
        </section>`;
    dialog.querySelector(".modal-close").addEventListener("click", () => dialog.remove());
    dialog.querySelector("[data-close-dialog]").addEventListener("click", () => dialog.remove());
    dialog.addEventListener("click", event => {
        if (event.target === dialog) dialog.remove();
    });
    document.body.appendChild(dialog);
    refreshIcons();
}

[tableSearch, globalSearch].forEach(input => input.addEventListener("input", renderRecords));
[outcomeFilter, interventionFilter, dateFilter].forEach(control => control.addEventListener("change", renderRecords));
document.getElementById("recordOutcomeButton").addEventListener("click", () => openModal());
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalCancel").addEventListener("click", closeModal);
outcomeForm.addEventListener("submit", recordOutcome);
outcomeModal.addEventListener("click", event => {
    if (event.target === outcomeModal) closeModal();
});
document.getElementById("clearFiltersButton").addEventListener("click", clearFilters);
document.getElementById("detailedInsightsButton").addEventListener("click", () => showInformation("Detailed outcome insights", "These insights are calculated from the outcome records currently saved in this browser."));
document.getElementById("insightsInfo").addEventListener("click", () => showInformation("About these insights", "Summary values update when an outcome is added or edited."));
document.getElementById("notificationButton").addEventListener("click", () => showToast("You are all caught up on outcome notifications."));
document.getElementById("profileButton").addEventListener("click", () => showToast("Signed in as Dr. Sharma."));
document.getElementById("supportButton").addEventListener("click", () => showInformation("CampusWell support", "Contact your institution's CampusWell administrator for portal assistance."));
document.querySelectorAll("[data-local-action]").forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    showToast(`${link.dataset.localAction} is a prototype action.`);
}));
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        if (!outcomeModal.hidden) closeModal();
        document.getElementById("informationDialog")?.remove();
    }
});

const extraDialogStyles = document.createElement("style");
extraDialogStyles.textContent = `
    .information-backdrop { z-index: 110; }
    .information-card { width: min(520px, 100%); }
    .insight-detail-list { display: grid; gap: 17px; }
    .insight-detail-list > div { display: grid; grid-template-columns: 10px 1fr; gap: 12px; align-items: start; }
    .insight-detail-dot { width: 9px; height: 9px; margin-top: 4px; border-radius: 50%; }
    .dot-teal { background: #10a58f; }
    .dot-purple { background: #8a55ed; }
    .dot-orange { background: #efa545; }
    .insight-detail-list strong { color: #17375d; font-size: 12px; }
    .insight-detail-list p { margin: 5px 0 0; color: #6a809d; font-size: 11px; line-height: 1.6; }
    body.modal-open { overflow: hidden; }
    .change-arrow.negative, .change-list strong.negative { color: #cc5969; }
`;
document.head.appendChild(extraDialogStyles);
renderDashboard();
renderRecords();
refreshIcons();

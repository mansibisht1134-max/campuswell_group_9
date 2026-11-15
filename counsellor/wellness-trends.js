const trendSearch = document.getElementById("trendSearch");
const trendPeriod = document.getElementById("trendPeriod");
const exportButton = document.getElementById("exportTrends");
const chartInfoButton = document.getElementById("trendChartInfo");

const trendMetrics = {
    "7": {
        mood: "3.5",
        stress: "3.0",
        sleep: "3.3",
        energy: "3.4",
        count: 58,
        moodValues: [3.0, 3.4, 3.2, 3.8, 3.6, 4.0, 3.8, 4.1],
        stressValues: [4.0, 3.7, 3.9, 3.3, 3.2, 2.9, 3.1, 2.8],
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri"]
    },
    "30": {
        mood: "3.6",
        stress: "2.8",
        sleep: "3.4",
        energy: "3.5",
        count: 248,
        moodValues: [3.2, 3.5, 3.1, 3.7, 3.9, 3.8, 4.2, 4.4],
        stressValues: [4.1, 3.7, 3.9, 3.3, 3.1, 2.8, 3.1, 2.6],
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Latest"]
    },
    "90": {
        mood: "3.7",
        stress: "2.6",
        sleep: "3.5",
        energy: "3.6",
        count: 692,
        moodValues: [2.9, 3.1, 3.4, 3.3, 3.7, 3.8, 4.0, 4.2],
        stressValues: [4.2, 4.0, 3.7, 3.5, 3.2, 3.0, 2.8, 2.6],
        labels: ["Month 1", "Month 2", "Month 3", "Latest"]
    }
};

function updateMetric(id, value) {
    const element = document.getElementById(id);

    if (element) {
        const suffix = element.querySelector("span");

        element.textContent = value;

        if (suffix) {
            element.appendChild(suffix);
        }
    }
}

function createLinePath(values) {
    return values.map((value, index) => {
        const x = index * (700 / (values.length - 1));
        const y = 230 - ((value - 1) / 4) * 200;

        return `${index === 0 ? "M" : "L"}${x} ${y}`;
    }).join(" ");
}

function updatePoints(selector, values) {
    const svg = document.querySelector(".main-trend-svg");

    if (!svg) {
        return;
    }

    svg.querySelectorAll(selector).forEach((point, index) => {
        const x = index * (700 / (values.length - 1));
        const y = 230 - ((values[index] - 1) / 4) * 200;

        point.setAttribute("cx", x);
        point.setAttribute("cy", y);
    });
}

function updateTrendChart(data) {
    const moodLine = document.querySelector(".mood-chart-line");
    const stressLine = document.querySelector(".stress-chart-line");
    const moodArea = document.querySelector(".main-mood-area");

    const xAxis = document.getElementById("trendXAxis");

    if (moodLine) {
        moodLine.setAttribute("d", createLinePath(data.moodValues));
    }

    if (stressLine) {
        stressLine.setAttribute("d", createLinePath(data.stressValues));
    }

    if (moodArea) {
        moodArea.setAttribute(
            "d",
            `${createLinePath(data.moodValues)} L700 250 L0 250 Z`
        );
    }

    updatePoints(".mood-chart-point", data.moodValues);
    updatePoints(".stress-chart-point", data.stressValues);

    if (xAxis) {
        const labels = data.labels;
        const spans = Array.from(xAxis.querySelectorAll("span"));

        spans.forEach((span, index) => {
            const labelIndex = Math.round(
                index * (labels.length - 1) / (spans.length - 1)
            );

            span.textContent = labels[labelIndex];
        });
    }
}

function updatePeriod() {
    const period = trendPeriod ? trendPeriod.value : "30";
    const data = trendMetrics[period];

    if (!data) {
        return;
    }

    updateMetric("averageMood", data.mood);
    updateMetric("averageStress", data.stress);
    updateMetric("sleepScore", data.sleep);
    updateMetric("energyScore", data.energy);

    const distributionTotal = document.querySelector(".distribution-ring strong");

    if (distributionTotal) {
        distributionTotal.textContent = data.count;
    }

    updateTrendChart(data);
}

function filterTrendContent() {
    const query = trendSearch ? trendSearch.value.trim().toLowerCase() : "";

    const searchableElements = [
        ...document.querySelectorAll(".trend-stat-card"),
        ...document.querySelectorAll(".trends-main-grid .panel"),
        ...document.querySelectorAll(".trends-secondary-grid .panel"),
        document.querySelector(".trend-insight")
    ].filter(Boolean);

    let matches = 0;

    searchableElements.forEach(element => {
        const isMatch = element.textContent.toLowerCase().includes(query);

        element.style.display = isMatch ? "" : "none";

        if (isMatch) {
            matches++;
        }
    });

    let message = document.getElementById("trendSearchMessage");

    if (!message) {
        message = document.createElement("div");
        message.id = "trendSearchMessage";
        message.style.padding = "24px";
        message.style.marginBottom = "20px";
        message.style.border = "1px solid #e2eaf3";
        message.style.borderRadius = "12px";
        message.style.background = "#ffffff";
        message.style.color = "#7a8ba0";
        message.style.textAlign = "center";

        const heading = document.querySelector(".page-heading");

        if (heading) {
            heading.insertAdjacentElement("afterend", message);
        }
    }

    message.textContent = "No matching wellness trends found.";
    message.style.display = matches === 0 ? "block" : "none";
}

function exportTrendSummary() {
    const period = trendPeriod ? trendPeriod.value : "30";
    const data = trendMetrics[period];

    if (!data) {
        return;
    }

    const rows = [
        ["CampusWell Wellness Trends"],
        ["Reporting period", trendPeriod.selectedOptions[0].textContent],
        ["Data type", "Illustrative demonstration data"],
        ["Total sample check-ins", data.count],
        ["Average reported mood", data.mood + "/5"],
        ["Average reported stress", data.stress + "/5"],
        ["Average sleep rating", data.sleep + "/5"],
        ["Average energy rating", data.energy + "/5"],
        [],
        ["Week or period", "Average mood", "Reported stress"],
        ...data.labels.map((label, index) => [
            label,
            data.moodValues[
                Math.round(index * (data.moodValues.length - 1) /
                    (data.labels.length - 1))
            ],
            data.stressValues[
                Math.round(index * (data.stressValues.length - 1) /
                    (data.labels.length - 1))
            ]
        ])
    ];

    const csv = rows.map(row =>
        row.map(value => {
            const text = String(value ? ? "");
            return `"${text.replace(/"/g, '""')}"`;
        }).join(",")
    ).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `campuswell-wellness-trends-${period}-days.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

if (trendPeriod) {
    trendPeriod.addEventListener("change", updatePeriod);
}

if (trendSearch) {
    trendSearch.addEventListener("input", filterTrendContent);
}

if (exportButton) {
    exportButton.addEventListener("click", exportTrendSummary);
}

if (chartInfoButton) {
    chartInfoButton.addEventListener("click", () => {
        window.alert(
            "These charts use illustrative student self-report data. Ratings are intended to support wellbeing conversations, not provide a clinical diagnosis."
        );
    });
}

const notificationButton = document.getElementById("notificationButton");

if (notificationButton) {
    notificationButton.addEventListener("click", () => {
        window.alert("You have 3 unread notifications.");
    });
}

const supportButton = document.getElementById("supportButton");

if (supportButton) {
    supportButton.addEventListener("click", event => {
        event.preventDefault();
        window.alert("Contact CampusWell administration for portal support.");
    });
}

document.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        window.alert(`${link.dataset.page} will be connected in a future step.`);
    });
});

if (window.lucide) {
    lucide.createIcons();
}

updatePeriod();
filterTrendContent();
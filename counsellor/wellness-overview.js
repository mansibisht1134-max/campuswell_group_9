const searchInput = document.getElementById("overviewSearch");
const periodSelect = document.getElementById("overviewPeriod");
const totalCheckins = document.getElementById("totalCheckins");
const todayCheckins = document.getElementById("todayCheckins");
const supportRequests = document.getElementById("supportRequests");
const pendingReviews = document.getElementById("pendingReviews");
const recentRows = Array.from(document.querySelectorAll("#recentCheckinRows tr"));
const attentionItems = Array.from(document.querySelectorAll(".attention-item"));

const periodData = {
    "7": {
        total: 58,
        support: 6,
        pending: 5
    },
    "30": {
        total: 248,
        support: 18,
        pending: 12
    },
    "90": {
        total: 692,
        support: 44,
        pending: 21
    }
};

function updatePeriod() {
    const selectedPeriod = periodSelect ? periodSelect.value : "30";
    const data = periodData[selectedPeriod];

    if (!data) {
        return;
    }

    if (totalCheckins) {
        totalCheckins.textContent = data.total;
    }

    if (todayCheckins) {
        todayCheckins.textContent = selectedPeriod === "7" ? "24" : selectedPeriod === "30" ? "24" : "24";
    }

    if (supportRequests) {
        supportRequests.textContent = data.support;
    }

    if (pendingReviews) {
        pendingReviews.textContent = data.pending;
    }

    const periodLabels = document.querySelectorAll(".stat-label");

    if (periodLabels.length >= 4) {
        periodLabels[0].textContent = selectedPeriod === "7" ? "This week" : selectedPeriod === "30" ? "This month" : "Last 90 days";
        periodLabels[2].textContent = "Selected period";
        periodLabels[3].textContent = "Pending review";
    }
}

function filterOverview() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    let visibleRows = 0;
    let visibleAttentionItems = 0;

    recentRows.forEach(row => {
        const searchableText = `${row.textContent} ${row.dataset.search || ""}`.toLowerCase();
        const matches = searchableText.includes(query);

        row.style.display = matches ? "" : "none";

        if (matches) {
            visibleRows++;
        }
    });

    attentionItems.forEach(item => {
        const matches = item.textContent.toLowerCase().includes(query);

        item.style.display = matches ? "" : "none";

        if (matches) {
            visibleAttentionItems++;
        }
    });

    showEmptyMessage(
        document.querySelector(".recent-table-wrap"),
        "recent-empty-message",
        "No check-ins match your search.",
        visibleRows === 0
    );

    showEmptyMessage(
        document.querySelector(".attention-list"),
        "attention-empty-message",
        "No students match your search.",
        visibleAttentionItems === 0
    );
}

function showEmptyMessage(container, messageId, message, shouldShow) {
    if (!container) {
        return;
    }

    let messageElement = document.getElementById(messageId);

    if (!messageElement) {
        messageElement = document.createElement("p");
        messageElement.id = messageId;
        messageElement.style.padding = "18px 8px";
        messageElement.style.color = "#8493a6";
        messageElement.style.fontSize = "12px";
        messageElement.style.textAlign = "center";
        container.appendChild(messageElement);
    }

    messageElement.textContent = message;
    messageElement.style.display = shouldShow ? "block" : "none";
}

if (searchInput) {
    searchInput.addEventListener("input", filterOverview);
}

if (periodSelect) {
    periodSelect.addEventListener("change", updatePeriod);
}

const notificationButton = document.getElementById("notificationButton");

if (notificationButton) {
    notificationButton.addEventListener("click", () => {
        window.alert("You have 3 unread notifications.");
    });
}

if (window.lucide) {
    lucide.createIcons();
}

updatePeriod();
filterOverview();
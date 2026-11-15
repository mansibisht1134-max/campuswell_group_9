const recordSearch = document.getElementById("recordSearch");
const tableSearch = document.getElementById("tableSearch");
const moodFilter = document.getElementById("moodFilter");
const stressFilter = document.getElementById("stressFilter");
const recordPeriod = document.getElementById("recordPeriod");
const recordsTableBody = document.getElementById("recordsTableBody");
const recordsEmpty = document.getElementById("recordsEmpty");
const recordsCount = document.getElementById("recordsCount");
const selectAllRecords = document.getElementById("selectAllRecords");
const resetFilters = document.getElementById("resetFilters");
const emptyReset = document.getElementById("emptyReset");
const rows = Array.from(document.querySelectorAll("#recordsTableBody tr"));
const tabs = Array.from(document.querySelectorAll(".record-tab"));

let activeStatus = "all";

function getSearchQuery() {
    return (tableSearch ? .value || recordSearch ? .value || "").trim().toLowerCase();
}

function updateSearchInputs(value, source) {
    if (source !== recordSearch && recordSearch) {
        recordSearch.value = value;
    }

    if (source !== tableSearch && tableSearch) {
        tableSearch.value = value;
    }
}

function getVisibleRows() {
    return rows.filter(row => row.style.display !== "none");
}

function filterRecords() {
    const query = getSearchQuery();
    const mood = moodFilter ? .value || "all";
    const stress = stressFilter ? .value || "all";
    let visibleCount = 0;

    rows.forEach(row => {
        const searchableText = [
            row.dataset.student,
            row.dataset.id,
            row.dataset.search,
            row.textContent
        ].join(" ").toLowerCase();

        const rowStatus = row.dataset.status || "pending";
        const rowMood = row.dataset.mood || "";
        const stressValue = Number(row.dataset.stressValue || 0);

        const matchesSearch = searchableText.includes(query);
        const matchesStatus = activeStatus === "all" || rowStatus === activeStatus;
        const matchesMood = mood === "all" || rowMood === mood;

        let matchesStress = true;

        if (stress === "low") {
            matchesStress = stressValue >= 1 && stressValue <= 2;
        } else if (stress === "medium") {
            matchesStress = stressValue === 3;
        } else if (stress === "high") {
            matchesStress = stressValue >= 4 && stressValue <= 5;
        }

        const visible = matchesSearch && matchesStatus && matchesMood && matchesStress;

        row.style.display = visible ? "" : "none";

        if (visible) {
            visibleCount++;
        }
    });

    if (recordsEmpty) {
        recordsEmpty.hidden = visibleCount !== 0;
    }

    if (recordsTableBody) {
        recordsTableBody.closest(".records-table-wrap").style.display =
            visibleCount === 0 ? "none" : "";
    }

    if (recordsCount) {
        recordsCount.textContent = `Showing ${visibleCount} of ${rows.length} sample records`;
    }

    if (selectAllRecords) {
        const visibleCheckboxes = getVisibleRows()
            .map(row => row.querySelector(".record-checkbox"))
            .filter(Boolean);

        selectAllRecords.checked =
            visibleCheckboxes.length > 0 &&
            visibleCheckboxes.every(checkbox => checkbox.checked);

        selectAllRecords.indeterminate =
            visibleCheckboxes.some(checkbox => checkbox.checked) &&
            !selectAllRecords.checked;
    }
}

function setActiveTab(status) {
    activeStatus = status;

    tabs.forEach(tab => {
        const active = tab.dataset.status === status;
        tab.classList.toggle("active", active);

        if (active) {
            tab.setAttribute("aria-pressed", "true");
        } else {
            tab.setAttribute("aria-pressed", "false");
        }
    });

    filterRecords();
}

function clearFilters() {
    if (recordSearch) {
        recordSearch.value = "";
    }

    if (tableSearch) {
        tableSearch.value = "";
    }

    if (moodFilter) {
        moodFilter.value = "all";
    }

    if (stressFilter) {
        stressFilter.value = "all";
    }

    if (recordPeriod) {
        recordPeriod.value = "30";
    }

    if (selectAllRecords) {
        selectAllRecords.checked = false;
        selectAllRecords.indeterminate = false;
    }

    rows.forEach(row => {
        const checkbox = row.querySelector(".record-checkbox");

        if (checkbox) {
            checkbox.checked = false;
        }
    });

    setActiveTab("all");
}

if (recordSearch) {
    recordSearch.addEventListener("input", () => {
        updateSearchInputs(recordSearch.value, recordSearch);
        filterRecords();
    });
}

if (tableSearch) {
    tableSearch.addEventListener("input", () => {
        updateSearchInputs(tableSearch.value, tableSearch);
        filterRecords();
    });
}

if (moodFilter) {
    moodFilter.addEventListener("change", filterRecords);
}

if (stressFilter) {
    stressFilter.addEventListener("change", filterRecords);
}

if (recordPeriod) {
    recordPeriod.addEventListener("change", () => {
        window.alert(
            "These six records are demonstration data. Date-range filtering will be available when actual submission dates are connected."
        );
    });
}

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        setActiveTab(tab.dataset.status || "all");
    });
});

if (selectAllRecords) {
    selectAllRecords.addEventListener("change", () => {
        getVisibleRows().forEach(row => {
            const checkbox = row.querySelector(".record-checkbox");

            if (checkbox) {
                checkbox.checked = selectAllRecords.checked;
            }
        });

        filterRecords();
    });
}

rows.forEach(row => {
    const checkbox = row.querySelector(".record-checkbox");

    if (checkbox) {
        checkbox.addEventListener("change", filterRecords);
    }
});

if (resetFilters) {
    resetFilters.addEventListener("click", clearFilters);
}

if (emptyReset) {
    emptyReset.addEventListener("click", clearFilters);
}

const initialFilter = new URLSearchParams(window.location.search).get("filter");

if (initialFilter === "review") {
    setActiveTab("pending");
} else {
    setActiveTab("all");
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

const nextPage = document.getElementById("nextPage");
const nextPageArrow = document.getElementById("nextPageArrow");

function showPaginationMessage() {
    window.alert(
        "This frontend preview currently contains six sample records. More records will appear when the database is connected."
    );
}

if (nextPage) {

    nextPage.addEventListener("click", showPaginationMessage);
}

if (nextPageArrow) {

    nextPageArrow.addEventListener("click", showPaginationMessage);
}

const previousPage = document.getElementById("previousPage");

if (previousPage) {

    previousPage.addEventListener("click", showPaginationMessage);
}

if (window.lucide) {

    lucide.createIcons();
}

filterRecords();
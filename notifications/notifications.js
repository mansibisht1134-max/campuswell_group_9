const notificationItems = [...document.querySelectorAll(".notification-item")];
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const search = document.getElementById("notificationSearch");
const markAll = document.getElementById("markAll");
const emptyState = document.getElementById("emptyState");
const allCount = document.getElementById("allCount");
const unreadCount = document.getElementById("unreadCount");
const importantCount = document.getElementById("importantCount");
const overviewUnread = document.getElementById("overviewUnread");
const sidebarCount = document.getElementById("sidebarCount");
const topBellCount = document.getElementById("topBellCount");
const toast = document.getElementById("toast");

let activeFilter = "all";

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2300);
}

function updateCounts() {
    const unread = notificationItems.filter(item => item.classList.contains("unread")).length;
    const important = notificationItems.filter(item => item.classList.contains("important")).length;

    allCount.textContent = notificationItems.length;
    unreadCount.textContent = unread;
    importantCount.textContent = important;
    overviewUnread.textContent = unread;
    sidebarCount.textContent = unread;
    topBellCount.textContent = unread;
}

function matchesFilter(item) {
    if (activeFilter === "all") {
        return true;
    }

    if (activeFilter === "unread") {
        return item.classList.contains("unread");
    }

    if (activeFilter === "important") {
        return item.classList.contains("important");
    }

    return item.dataset.type === activeFilter;
}

function matchesSearch(item) {
    const query = search.value.trim().toLowerCase();

    if (!query) {
        return true;
    }

    return item.textContent.toLowerCase().includes(query);
}

function renderNotifications() {
    let visible = 0;

    notificationItems.forEach(item => {
        const show = matchesFilter(item) && matchesSearch(item);

        item.style.display = show ? "grid" : "none";

        if (show) {
            visible++;
        }
    });

    emptyState.classList.toggle("show", visible === 0);
}

function setFilter(filter) {
    activeFilter = filter;

    filterButtons.forEach(button => {
        if (button.dataset.filter === filter) {
            button.classList.add("active");
        } else if (button.classList.contains("notification-stat") || button.classList.contains("notification-tab")) {
            button.classList.remove("active");
        }
    });

    renderNotifications();
}

document.querySelectorAll(".notification-stat").forEach(button => {
    button.addEventListener("click", () => {
        setFilter(button.dataset.filter);
    });
});

document.querySelectorAll(".notification-tab").forEach(button => {
    button.addEventListener("click", () => {
        setFilter(button.dataset.filter);
    });
});

search.addEventListener("input", renderNotifications);

notificationItems.forEach(item => {
    item.addEventListener("click", () => {
        item.classList.remove("unread");
        updateCounts();

        const page = item.dataset.page;

        if (page) {
            window.location.href = page;
        }
    });
});

markAll.addEventListener("click", () => {
    const unread = notificationItems.filter(item => item.classList.contains("unread"));

    if (!unread.length) {
        showToast("All notifications are already read.");
        return;
    }

    unread.forEach(item => item.classList.remove("unread"));

    updateCounts();
    renderNotifications();
    showToast("All notifications marked as read.");
});

updateCounts();
renderNotifications();
lucide.createIcons();
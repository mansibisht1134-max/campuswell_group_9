const API = "https://campuswell-api-dah4.onrender.com/api/v1";
const container = document.getElementById("notificationsContainer");
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
let notifications = [];
let activeFilter = "all";

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2300);
}
function typeFor(item) {
    const value = (item.notification_type || "").toLowerCase();
    if (value.includes("appointment")) return "appointments";
    if (value.includes("wellness")) return "wellness";
    if (value.includes("campus")) return "campus";
    if (value.includes("support")) return "support";
    return "other";
}
function iconFor(type) {
    return ({ appointments: "calendar-check-2", wellness: "heart-pulse", campus: "megaphone", support: "messages-square", other: "bell" })[type];
}
function safeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
}
function updateCounts() {
    const unread = notifications.filter(n => !n.is_read).length;
    allCount.textContent = notifications.length;
    unreadCount.textContent = unread;
    importantCount.textContent = notifications.filter(n => !n.is_read).length;
    overviewUnread.textContent = unread;
    sidebarCount.textContent = unread;
    topBellCount.textContent = unread;
}
function renderNotifications() {
    const query = search.value.trim().toLowerCase();
    const visible = notifications.filter(n => {
        const type = typeFor(n);
        const filterMatch = activeFilter === "all" || (activeFilter === "unread" ? !n.is_read : activeFilter === "important" ? !n.is_read : type === activeFilter);
        return filterMatch && (!query || `${n.title} ${n.message} ${type}`.toLowerCase().includes(query));
    });
    container.innerHTML = "";
    visible.forEach(n => {
        const type = typeFor(n);
        const item = document.createElement("button");
        item.type = "button";
        item.className = "notification-item" + (n.is_read ? "" : " unread");
        item.dataset.type = type;
        item.innerHTML = `
            <div class="notification-icon blue"><i data-lucide="${iconFor(type)}"></i></div>
            <div class="notification-content">
                <div class="notification-title-row"><strong>${safeText(n.title)}</strong>${n.is_read ? "" : '<span class="notification-dot"></span>'}</div>
                <p>${safeText(n.message)}</p>
                <div class="notification-meta"><span>${safeText(type === "other" ? "CampusWell" : type[0].toUpperCase()+type.slice(1))}</span><time>${new Date(n.created_at).toLocaleString()}</time></div>
            </div><i class="notification-arrow" data-lucide="chevron-right"></i>`;
        item.addEventListener("click", async () => {
            if (!n.is_read) await markRead(n);
            const target = n.target_url;
            if (target && (target.startsWith("../") || target.startsWith("/"))) window.location.href = target;
        });
        container.appendChild(item);
    });
    emptyState.classList.toggle("show", visible.length === 0);
    updateCounts();
    lucide.createIcons();
}
function setFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll("[data-filter]").forEach(button => button.classList.toggle("active", button.dataset.filter === filter));
    renderNotifications();
}
document.querySelectorAll(".notification-stat,.notification-tab").forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));
search.addEventListener("input", renderNotifications);
async function markRead(item) {
    const token = localStorage.getItem("campuswell_access_token");
    if (!token) return;
    try {
        const response = await fetch(`${API}/notifications/${item.id}/read`, { method:"PATCH", headers:{ Authorization:`Bearer ${token}` } });
        if (response.ok) item.is_read = true;
        renderNotifications();
    } catch (_) {}
}
markAll.addEventListener("click", async () => {
    const token = localStorage.getItem("campuswell_access_token");
    if (!token) return showToast("Please sign in again.");
    try {
        const response = await fetch(`${API}/notifications/read-all`, { method:"POST", headers:{ Authorization:`Bearer ${token}` } });
        if (!response.ok) throw new Error();
        notifications.forEach(n => n.is_read = true);
        renderNotifications();
        showToast("All notifications marked as read.");
    } catch (_) { showToast("Could not update notifications. Try again."); }
});
async function loadNotifications() {
    const token = localStorage.getItem("campuswell_access_token");
    if (!token) {
        container.innerHTML = "<p>Please sign in to view notifications.</p>";
        return;
    }
    try {
        const response = await fetch(`${API}/notifications?limit=100`, { headers:{ Authorization:`Bearer ${token}` } });
        if (response.status === 401) {
            localStorage.removeItem("campuswell_access_token");
            window.location.href = "../student-login/student-login.html";
            return;
        }
        if (!response.ok) throw new Error();
        notifications = await response.json();
        renderNotifications();
    } catch (_) { container.innerHTML = "<p>Unable to load notifications. Please refresh.</p>"; }
}
loadNotifications();
lucide.createIcons();

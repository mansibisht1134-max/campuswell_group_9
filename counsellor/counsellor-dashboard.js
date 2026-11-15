const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalClose = document.getElementById("modalClose");
const modalButton = document.getElementById("modalButton");
const searchInput = document.getElementById("dashboardSearch");

const routes = {
    Appointments: "counsellor-appointments.html",
    "Student Requests": "counsellor-request.html",
    "Follow-ups": "counsellor-followups.html"
};

function openModal(title, message) {
    if (!modal || !modalTitle || !modalText) return;
    modalTitle.textContent = title;
    modalText.textContent = message;
    modal.classList.add("show");
}

function closeModal() {
    if (modal) modal.classList.remove("show");
}

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase().trim();
        document.querySelectorAll(".appointment-item, .request-item, .followup-item").forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(query) ||
                (item.dataset.search || "").toLowerCase().includes(query) ? "" : "none";
        });
    });
}

document.querySelectorAll(".session-button").forEach(button => {
    button.addEventListener("click", () => {
        const item = button.closest(".appointment-item");
        const name = item?.querySelector(".appointment-info strong")?.textContent || "Appointment";
        const details = item?.querySelector(".appointment-info span")?.textContent || "Appointment details";
        openModal(name, details);
    });
});

document.querySelectorAll(".icon-action").forEach(button => {
    button.addEventListener("click", () => {
        window.location.href = routes["Follow-ups"];
    });
});

document.getElementById("newAppointmentButton")?.addEventListener("click", () => {
    window.location.href = routes.Appointments;
});

document.getElementById("notificationButton")?.addEventListener("click", () => {
    window.location.href = "counsellor-notifications.html";
});

document.getElementById("supportButton")?.addEventListener("click", event => {
    event.preventDefault();
    openModal("CampusWell Support", "Contact CampusWell administration for portal support.");
});

modalClose?.addEventListener("click", closeModal);
modalButton?.addEventListener("click", closeModal);
modal?.addEventListener("click", event => {
    if (event.target === modal) closeModal();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
});

const unread = JSON.parse(localStorage.getItem("campuswellCounsellorReadNotifications") || "[]");
const unreadCount = Math.max(0, 3 - unread.length);
const notificationCount = document.getElementById("notificationCount");
const bellDot = document.querySelector(".bell-dot");
if (notificationCount) notificationCount.textContent = unreadCount;
if (bellDot) bellDot.textContent = unreadCount;
if (typeof lucide !== "undefined") lucide.createIcons();

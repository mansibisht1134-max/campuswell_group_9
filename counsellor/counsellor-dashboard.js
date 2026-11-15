const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalClose = document.getElementById("modalClose");
const modalButton = document.getElementById("modalButton");
const searchInput = document.getElementById("dashboardSearch");

const routes = {
    "Dashboard": "counsellor-dashboard.html",
    "Appointments": "counsellor-appointments.html",
    "Student Requests": "counsellor-request.html",
    "Follow-ups": "counsellor-followups.html"
};

function openModal(title, text) {
    if (!modal || !modalTitle || !modalText) {
        return;
    }

    modalTitle.textContent = title;
    modalText.textContent = text;
    modal.classList.add("show");
}

function closeModal() {
    if (modal) {
        modal.classList.remove("show");
    }
}

function getLinkLabel(link) {
    const label = [...link.querySelectorAll("span")].find(
        span => !span.classList.contains("notification-count")
    );

    return (link.dataset.page || label ? .textContent || link.textContent)
        .replace(/\s+/g, " ")
        .trim();
}

document.querySelectorAll(".main-nav .nav-link").forEach(link => {
    const label = getLinkLabel(link);

    if (routes[label]) {
        link.href = routes[label];
        link.removeAttribute("data-page");
    }
});

document.querySelectorAll(".dashboard-grid .panel-header a.text-button").forEach(link => {
    const heading = link.closest(".panel-header") ? .querySelector("h2") ? .textContent.trim();

    const panelRoutes = {
        "Today's Appointments": "counsellor-appointments.html",
        "Student Support Requests": "counsellor-request.html",
        "Follow-ups Due": "counsellor-followups.html"
    };

    if (panelRoutes[heading]) {
        link.href = panelRoutes[heading];
        link.removeAttribute("data-page");
    }
});

document.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();

        const page = link.dataset.page;

        if (routes[page]) {
            window.location.href = routes[page];
            return;
        }

        openModal(
            page,
            `${page} will be connected to the FastAPI backend and PostgreSQL database.`
        );
    });
});

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase().trim();

        document.querySelectorAll(".appointment-item").forEach(item => {
            const text = `${item.dataset.search} ${item.textContent}`.toLowerCase();
            item.style.display = text.includes(query) ? "grid" : "none";
        });

        document.querySelectorAll(".request-item").forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(query) ?
                "flex" :
                "none";
        });

        document.querySelectorAll(".followup-item").forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(query) ?
                "grid" :
                "none";
        });
    });
}

document.querySelectorAll(".session-button").forEach(button => {
    button.addEventListener("click", () => {
        const item = button.closest(".appointment-item");
        const name = item ? .querySelector(".appointment-info strong") ? .textContent;
        const details = item ? .querySelector(".appointment-info span") ? .textContent;

        openModal(name || "Appointment", details || "Appointment details");
    });
});

document.querySelectorAll(".icon-action").forEach(button => {
    button.addEventListener("click", () => {
        window.location.href = routes["Follow-ups"];
    });
});

const newAppointmentButton = document.getElementById("newAppointmentButton");

if (newAppointmentButton) {
    newAppointmentButton.addEventListener("click", () => {
        window.location.href = routes["Appointments"];
    });
}

const notificationButton = document.getElementById("notificationButton");

if (notificationButton) {
    notificationButton.addEventListener("click", () => {
        openModal("Notifications", "You have 3 unread notifications.");
    });
}

const supportButton = document.getElementById("supportButton");

if (supportButton) {
    supportButton.addEventListener("click", event => {
        event.preventDefault();
        openModal("CampusWell Support", "Contact CampusWell administration for portal support.");
    });
}

if (modalClose) {
    modalClose.addEventListener("click", closeModal);
}

if (modalButton) {
    modalButton.addEventListener("click", closeModal);
}

if (modal) {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal();
        }
    });
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeModal();
    }
});

if (typeof lucide !== "undefined") {
    lucide.createIcons();
}
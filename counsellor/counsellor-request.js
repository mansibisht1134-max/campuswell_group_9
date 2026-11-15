const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalClose = document.getElementById("modalClose");
const modalButton = document.getElementById("modalButton");
const modalActions = document.getElementById("modalActions");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const priorityFilter = document.getElementById("priorityFilter");
const requestCards = [...document.querySelectorAll(".request-card")];
let draftText = "";

function openModal(title, text, actions = []) {
    modalTitle.textContent = title;
    modalText.textContent = text;
    modalActions.innerHTML = "";

    actions.forEach(action => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = action.label;
        button.addEventListener("click", action.onClick);
        modalActions.appendChild(button);
    });

    modal.classList.add("show");

    if (window.lucide) lucide.createIcons();
}

function closeModal() {
    modal.classList.remove("show");
}

function selectedCard() {
    return document.querySelector(".request-card.selected");
}

function getStatus(card) {
    return card.dataset.status || "new";
}

function getPriority(card) {
    return card.dataset.priority || "medium";
}

function filterRequests() {
    const query = searchInput.value.toLowerCase().trim();
    const category = categoryFilter.value;
    const priority = priorityFilter.value;
    const activeTab = document.querySelector(".tab.active");
    const tabFilter = activeTab ? activeTab.dataset.filter : "all";
    let visibleCount = 0;

    requestCards.forEach(card => {
        const searchable = `${card.dataset.search || ""} ${card.textContent}`.toLowerCase();
        const matchesSearch = searchable.includes(query);
        const matchesCategory = category === "all" || card.dataset.category === category;
        const matchesPriority = priority === "all" || getPriority(card) === priority;
        const matchesTab = tabFilter === "all" ||
            (tabFilter === "urgent" && getPriority(card) === "urgent") ||
            getStatus(card) === tabFilter;
        const visible = matchesSearch && matchesCategory && matchesPriority && matchesTab;

        card.style.display = visible ? "" : "none";
        if (visible) visibleCount++;
    });

    document.getElementById("resultCount").textContent = `${visibleCount} request${visibleCount === 1 ? "" : "s"}`;
}

function updateDetails(card) {
    if (!card) return;

    const name = card.querySelector(".student-info h3").textContent.trim();
    const studentId = card.querySelector(".student-info span").textContent.trim();
    const initials = card.querySelector(".student-avatar").textContent.trim();
    const category = card.querySelector(".request-category strong").textContent.trim();
    const message = card.querySelector(".request-message").textContent.trim();
    const priority = card.querySelector(".request-badges .priority");
    const status = card.querySelector(".request-badges .status");

    document.getElementById("selectedName").textContent = name;
    document.getElementById("selectedStudentId").textContent = studentId;
    document.getElementById("recordAvatar").textContent = initials;
    document.getElementById("recordName").textContent = name;
    document.getElementById("recordCategory").textContent = category;
    document.getElementById("detailCategory").textContent = category;
    document.getElementById("detailPriority").textContent = priority.textContent.trim();
    document.getElementById("detailPriority").className = priority.className;
    document.getElementById("detailStatus").textContent = status.textContent.trim();
    document.getElementById("selectedMessage").textContent = message;

    requestCards.forEach(item => item.classList.toggle("selected", item === card));
    document.getElementById("detailsPanel").style.display = "";
}

requestCards.forEach(card => {
    card.addEventListener("click", event => {
        if (!event.target.closest("button")) updateDetails(card);
    });

    card.querySelector(".review-button").addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        updateDetails(card);
    });
});

document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(item => item.classList.remove("active"));
        tab.classList.add("active");
        filterRequests();
    });
});

searchInput.addEventListener("input", filterRequests);
categoryFilter.addEventListener("change", filterRequests);
priorityFilter.addEventListener("change", filterRequests);

document.getElementById("closeDetails").addEventListener("click", () => {
    document.getElementById("detailsPanel").style.display = "none";
});

document.getElementById("saveDraft").addEventListener("click", () => {
    const response = document.getElementById("responseBox").value.trim();
    if (!response) {
        openModal("Empty Draft", "Write a response before saving it.");
        return;
    }
    draftText = response;
    openModal("Draft Saved", "Your response draft is saved for this browser session.");
});

document.getElementById("sendResponse").addEventListener("click", () => {
    const responseBox = document.getElementById("responseBox");
    const response = responseBox.value.trim();

    if (!response) {
        openModal("Response Required", "Write a response before sending it to the student.");
        return;
    }

    const name = document.getElementById("selectedName").textContent;
    openModal("Response Prepared", `Your response for ${name} is prepared. Actual delivery will work after the backend is connected.`);
    responseBox.value = "";
});

document.getElementById("appointmentAction").addEventListener("click", () => {
    window.location.assign("counsellor-appointments.html");
});

document.getElementById("conversationAction").addEventListener("click", () => {
    openModal("Start Conversation", "Student messaging will be connected when the backend is ready.");
});

document.getElementById("reviewAction").addEventListener("click", () => {
    const card = selectedCard();
    if (!card) return;
    card.dataset.status = "review";
    const status = card.querySelector(".request-badges .status");
    status.textContent = "In Review";
    status.className = "status review";
    document.getElementById("detailStatus").textContent = "In Review";
    filterRequests();
    openModal("Request Updated", `${document.getElementById("selectedName").textContent}’s request is now marked In Review.`);
});

document.getElementById("closeRequest").addEventListener("click", () => {
    const card = selectedCard();
    if (!card) return;
    card.dataset.status = "resolved";
    const status = card.querySelector(".request-badges .status");
    status.textContent = "Resolved";
    status.className = "status resolved";
    document.getElementById("detailStatus").textContent = "Resolved";
    filterRequests();
    openModal("Request Closed", `${document.getElementById("selectedName").textContent}’s request is marked as resolved in this demo.`);
});

document.getElementById("notificationButton").addEventListener("click", () => {
    openModal("Notifications", "You have 3 unread notifications.");
});

document.getElementById("supportButton").addEventListener("click", event => {
    event.preventDefault();
    openModal("CampusWell Support", "Contact CampusWell administration for portal support.");
});

document.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        openModal(link.dataset.page, `${link.dataset.page} will be connected to the FastAPI backend and PostgreSQL database.`);
    });
});

modalClose.addEventListener("click", closeModal);
modalButton.addEventListener("click", closeModal);
modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
});

filterRequests();
if (window.lucide) lucide.createIcons();

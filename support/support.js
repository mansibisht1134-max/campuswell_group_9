const categoryMessages = {
    Academic: "Start with an academic-focused counsellor or explore time-management and exam-stress resources.",
    "Stress & Anxiety": "You can connect with a counsellor who supports stress, anxiety and emotional wellbeing.",
    Personal: "A supportive counsellor can help you work through personal concerns and difficult emotions.",
    Career: "Explore career guidance, goal-setting support and academic planning with a suitable counsellor.",
    Relationships: "Relationship-focused support can help with communication, boundaries and personal wellbeing.",
    Other: "You can choose a counsellor and share what is on your mind during a private support session."
};

const categories = document.querySelectorAll(".support-category");
const categoryTitle = document.getElementById("categoryTitle");
const categoryText = document.getElementById("categoryText");
const counsellorGrid = document.getElementById("counsellorGrid");
const viewAllCounsellors = document.getElementById("viewAllCounsellors");
const profileButtons = document.querySelectorAll(".profile-button");
const bookButtons = document.querySelectorAll(".book-button");
const profileModal = document.getElementById("profileModal");
const profileClose = document.getElementById("profileClose");
const modalOverlay = document.querySelector("#profileModal .modal-overlay");
const modalAvatar = document.getElementById("modalAvatar");
const modalName = document.getElementById("modalName");
const modalSpecialization = document.getElementById("modalSpecialization");
const modalCategories = document.getElementById("modalCategories");
const toast = document.getElementById("toast");
const search = document.getElementById("supportSearch");

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2400);
}

function getInitials(name) {
    return name
        .replace("Dr. ", "")
        .replace("Ms. ", "")
        .split(" ")
        .map(word => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

let selectedSupportCategory = null;
let showAllCounsellors = false;

function matchesSupportCategory(card, category) {
    const profile = (card.dataset.category || "").toLowerCase();
    const specialization = (card.dataset.specialization || "").toLowerCase();
    const nameAndTags = (card.textContent || "").toLowerCase();
    const haystack = `${profile} ${specialization} ${nameAndTags}`;

    const rules = {
        "academic": ["academic", "study", "exam", "learning"],
        "stress & anxiety": ["stress", "anxiety", "emotional", "wellbeing", "wellness"],
        "personal": ["personal", "emotional", "wellbeing", "wellness", "clinical"],
        "career": ["career", "goal", "future", "professional"],
        "relationships": ["relationship", "communication", "family", "friends"],
        "other": []
    };
    const key = category.toLowerCase();
    if (key === "other") return true;
    const terms = rules[key] || [key];
    return terms.some(term => haystack.includes(term));
}

function renderCounsellorRecommendations(category = selectedSupportCategory) {
    const cards = [...document.querySelectorAll(".counsellor-card")];
    let matches = 0;

    cards.forEach(card => {
        const isMatch = !category || matchesSupportCategory(card, category);
        const isExtra = card.classList.contains("extra-counsellor");
        const visible = isMatch && (!isExtra || showAllCounsellors || !!category);
        card.style.display = visible ? "flex" : "none";
        if (visible) matches++;
    });

    if (category) {
        categoryTitle.textContent = `Recommended for ${category} support`;
        categoryText.textContent = categoryMessages[category] || "Here are counsellors whose expertise may help with this concern.";
    } else {
        categoryTitle.textContent = "Available counsellors";
        categoryText.textContent = "Choose a counsellor whose experience best matches your needs.";
    }
    return matches;
}

categories.forEach(button => {
    button.addEventListener("click", () => {
        categories.forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        selectedSupportCategory = button.dataset.category;
        showAllCounsellors = true;
        renderCounsellorRecommendations(selectedSupportCategory);
    });
});

viewAllCounsellors.addEventListener("click", () => {
    showAllCounsellors = !showAllCounsellors;
    if (selectedSupportCategory) {
        renderCounsellorRecommendations(selectedSupportCategory);
    } else {
        renderCounsellorRecommendations(null);
    }
    viewAllCounsellors.innerHTML = showAllCounsellors ?
        'Show less <i data-lucide="arrow-up"></i>' :
        'View all <i data-lucide="arrow-right"></i>';
    lucide.createIcons();
});

profileButtons.forEach(button => {
    button.addEventListener("click", () => {
        const card = button.closest(".counsellor-card");
        const name = button.dataset.counsellor;
        const specialization = card.dataset.specialization;
        const tags = [...card.querySelectorAll(".tag-row span")].map(item => item.textContent);

        modalAvatar.textContent = getInitials(name);
        modalName.textContent = name;
        modalSpecialization.textContent = specialization;
        modalCategories.textContent = tags.join(", ");

        profileModal.classList.add("show");
    });
});

bookButtons.forEach(button => {
    button.addEventListener("click", () => {
        localStorage.setItem("campuswell_selected_counsellor", button.dataset.counsellor);
        window.location.href = "../appointments/appointments.html";
    });
});

function hideModal() {
    profileModal.classList.remove("show");
}

profileClose.addEventListener("click", hideModal);
modalOverlay.addEventListener("click", hideModal);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        hideModal();
    }
});

search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();

    document.querySelectorAll(".counsellor-card").forEach(card => {
        const content = `${card.dataset.name} ${card.dataset.specialization} ${card.dataset.category} ${card.textContent}`.toLowerCase();

        if (!query) {
            card.style.display = card.classList.contains("extra-counsellor") ? "none" : "block";
            return;
        }

        card.style.display = content.includes(query) ? "block" : "none";
    });
});

document.querySelectorAll(".urgent-action").forEach(item => {
    item.addEventListener("click", () => {
        const title = item.querySelector("strong").textContent;
        showToast(title);
    });
});


// Connect support requests to the authenticated CampusWell API.
const SUPPORT_API = "https://campuswell-api-dah4.onrender.com/api/v1";
const supportToken = localStorage.getItem("campuswell_access_token");
const supportForm = document.getElementById("supportRequestForm");
const supportList = document.getElementById("mySupportRequests");
const supportMessage = document.getElementById("supportFormMessage");

function supportDate(value) {
    return value ? new Date(value).toLocaleDateString() : "—";
}

function renderSupportRequests(items) {
    if (!items.length) {
        supportList.innerHTML = '<div class="request-row"><span colspan="4">No support requests yet. You can submit one above.</span></div>';
        return;
    }
    supportList.innerHTML = '<div class="request-row request-head"><span>Request</span><span>Priority</span><span>Date</span><span>Status</span></div>' +
        items.map(item => `<div class="request-row"><strong>${escapeSupportText(item.title)}</strong><span>${escapeSupportText(item.priority)}</span><span>${supportDate(item.created_at)}</span><b class="status">${escapeSupportText(item.status)}</b></div>`).join("");
}

function escapeSupportText(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
}

async function loadSupportRequests() {
    if (!supportToken) {
        supportList.innerHTML = "<p>Please sign in to view your support requests.</p>";
        return;
    }
    try {
        const response = await fetch(`${SUPPORT_API}/support/requests`, {
            headers: { Authorization: `Bearer ${supportToken}` }
        });
        if (response.status === 401) {
            localStorage.removeItem("campuswell_access_token");
            window.location.href = "../student-login/student-login.html";
            return;
        }
        if (!response.ok) throw new Error("Could not load requests.");
        renderSupportRequests(await response.json());
    } catch (error) {
        supportList.innerHTML = "<p>Unable to load requests. Please refresh and try again.</p>";
    }
}

supportForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!supportToken) {
        supportMessage.textContent = "Please sign in again before submitting.";
        return;
    }
    const submitButton = document.getElementById("submitSupportRequest");
    submitButton.disabled = true;
    supportMessage.textContent = "Submitting...";
    const payload = {
        category: document.getElementById("requestCategory").value,
        priority: document.getElementById("requestPriority").value,
        title: document.getElementById("requestTitle").value.trim(),
        message: document.getElementById("requestMessage").value.trim()
    };
    try {
        const response = await fetch(`${SUPPORT_API}/support/requests`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supportToken}`
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || "Unable to submit your request.");
        supportForm.reset();
        supportMessage.textContent = "Your support request was submitted successfully.";
        await loadSupportRequests();
    } catch (error) {
        supportMessage.textContent = error.message;
    } finally {
        submitButton.disabled = false;
    }
});

document.getElementById("viewRequests")?.addEventListener("click", () => {
    loadSupportRequests();
    supportList?.scrollIntoView({ behavior: "smooth", block: "center" });
});

loadSupportRequests();

lucide.createIcons();
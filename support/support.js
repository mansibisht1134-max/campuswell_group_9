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

categories.forEach(button => {
    button.addEventListener("click", () => {
        categories.forEach(item => item.classList.remove("active"));
        button.classList.add("active");

        const category = button.dataset.category;

        categoryTitle.textContent = `Recommended for ${category} support`;
        categoryText.textContent = categoryMessages[category];

        document.querySelectorAll(".counsellor-card").forEach(card => {
            const values = card.dataset.category.toLowerCase();
            const match = values.includes(category.toLowerCase());

            if (card.classList.contains("extra-counsellor")) {
                card.style.display = match && counsellorGrid.classList.contains("show-all") ? "block" : "none";
            } else {
                card.style.display = match ? "block" : "none";
            }
        });
    });
});

viewAllCounsellors.addEventListener("click", () => {
    const showingAll = counsellorGrid.classList.toggle("show-all");

    document.querySelectorAll(".extra-counsellor").forEach(card => {
        card.style.display = showingAll ? "block" : "none";
    });

    viewAllCounsellors.innerHTML = showingAll ?
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

lucide.createIcons();
const STORAGE_KEY = "campuswell_voice_submissions";

const actionButtons = document.querySelectorAll(".voice-action");
const privacySubmit = document.getElementById("privacySubmit");
const anonymousToggle = document.getElementById("anonymousToggle");
const privacyLabel = document.getElementById("privacyLabel");
const modalAnonymous = document.getElementById("modalAnonymous");
const modal = document.getElementById("voiceModal");
const modalClose = document.getElementById("modalClose");
const modalOverlay = document.querySelector("#voiceModal .modal-overlay");
const voiceForm = document.getElementById("voiceForm");
const voiceCategory = document.getElementById("voiceCategory");
const voiceTitle = document.getElementById("voiceTitle");
const voiceMessage = document.getElementById("voiceMessage");
const messageCount = document.getElementById("messageCount");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const submissionList = document.getElementById("submissionList");
const totalSubmissions = document.getElementById("totalSubmissions");
const search = document.getElementById("voiceSearch");
const viewAllSubmissions = document.getElementById("viewAllSubmissions");
const pollOptions = document.querySelectorAll(".poll-option");
const pollSubmit = document.getElementById("pollSubmit");
const toast = document.getElementById("toast");

let selectedType = "Feedback";
let submissions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let selectedPoll = "";

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2400);
}

function openModal(type = "Feedback") {
    selectedType = type;
    modalTitle.textContent = type === "Issue" ? "Report an Issue" : type === "Suggestion" ? "Share a Suggestion" : type === "Poll" ? "Submit Survey Response" : "Submit Feedback";

    modalDescription.textContent =
        type === "Issue" ?
        "Tell us about a campus problem that needs attention." :
        type === "Suggestion" ?
        "Share an idea that could make campus life better." :
        type === "Poll" ?
        "Share your opinion and help shape campus improvements." :
        "Share your thoughts or experience with us.";

    voiceCategory.value = "";
    voiceTitle.value = "";
    voiceMessage.value = "";
    messageCount.textContent = "0/500";
    modalAnonymous.checked = anonymousToggle.checked;
    modal.classList.add("show");
}

function closeModal() {
    modal.classList.remove("show");
}

actionButtons.forEach(button => {
    button.addEventListener("click", () => {
        openModal(button.dataset.type);
    });
});

privacySubmit.addEventListener("click", () => {
    openModal("Feedback");
});

anonymousToggle.addEventListener("change", () => {
    privacyLabel.textContent = anonymousToggle.checked ? "Anonymous" : "Identified";
});

modalAnonymous.addEventListener("change", () => {
    anonymousToggle.checked = modalAnonymous.checked;
    privacyLabel.textContent = modalAnonymous.checked ? "Anonymous" : "Identified";
});

voiceMessage.addEventListener("input", () => {
    messageCount.textContent = `${voiceMessage.value.length}/500`;
});

voiceForm.addEventListener("submit", event => {
    event.preventDefault();

    const submission = {
        id: Date.now(),
        type: selectedType === "Poll" ? "Feedback" : selectedType,
        category: voiceCategory.value,
        title: voiceTitle.value.trim(),
        message: voiceMessage.value.trim(),
        date: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }),
        status: "Pending",
        anonymous: modalAnonymous.checked
    };

    submissions.unshift(submission);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));

    renderSubmissions();
    closeModal();
    showToast("Your submission has been sent successfully.");
});

function renderSubmissions() {
    const stored = submissions.length;

    totalSubmissions.textContent = 5 + stored;

    if (!stored) {
        return;
    }

    const rows = submissions
        .slice(0, 6)
        .map(item => {
            const typeClass = item.type.toLowerCase();

            return `
                <tr>
                    <td>
                        <span class="submission-type ${typeClass}">
                            <i data-lucide="${item.type === "Issue" ? "triangle-alert" : item.type === "Suggestion" ? "lightbulb" : "message-square"}"></i>
                            ${item.type}
                        </span>
                    </td>
                    <td>${item.title}</td>
                    <td>${item.date}</td>
                    <td><span class="status ${item.status.toLowerCase()}">${item.status}</span></td>
                </tr>
            `;
        })
        .join("");

    submissionList.insertAdjacentHTML("afterbegin", rows);
    lucide.createIcons();
}

search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();

    document.querySelectorAll(".update-card").forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(query) ? "block" : "none";
    });

    document.querySelectorAll("#submissionList tr").forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? "table-row" : "none";
    });

    document.querySelectorAll(".impact-item").forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(query) ? "flex" : "none";
    });
});

viewAllSubmissions.addEventListener("click", () => {
    document.querySelector(".submissions-card").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    showToast("Showing your recent submissions.");
});

document.getElementById("viewAllUpdates").addEventListener("click", () => {
    document.querySelector(".updates-card").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    showToast("Showing recent campus updates.");
});

document.getElementById("viewResponses").addEventListener("click", () => {
    document.querySelector(".impact-card").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    showToast("Here are some improvements driven by student feedback.");
});

pollOptions.forEach(option => {
    option.addEventListener("click", () => {
        pollOptions.forEach(item => item.classList.remove("selected"));
        option.classList.add("selected");
        selectedPoll = option.dataset.option;
        pollSubmit.textContent = "Submit poll response";
    });
});

pollSubmit.addEventListener("click", () => {
    if (!selectedPoll) {
        showToast("Please choose an option first.");
        return;
    }

    pollSubmit.textContent = "Response submitted";
    showToast("Thank you for sharing your opinion.");
});

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeModal();
    }
});

renderSubmissions();
lucide.createIcons();
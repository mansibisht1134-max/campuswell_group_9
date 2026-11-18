const editModal = document.getElementById("editModal");
const documentModal = document.getElementById("documentModal");
const idModal = document.getElementById("idModal");
const toast = document.getElementById("toast");
const profileForm = document.getElementById("profileForm");
const profileInitial = document.getElementById("profileInitial");
const displayName = document.getElementById("displayName");
const fullName = document.getElementById("fullName");
const emailAddress = document.getElementById("emailAddress");
const phoneNumber = document.getElementById("phoneNumber");
const documentTitle = document.getElementById("documentTitle");
const documentDescription = document.getElementById("documentDescription");

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2400);
}

function openModal(modal) {
    modal.classList.add("show");
}

function closeModal(modal) {
    modal.classList.remove("show");
}

function getInitial(name) {
    return name.trim().charAt(0).toUpperCase();
}

document.getElementById("editProfile").addEventListener("click", () => {
    openModal(editModal);
});

document.getElementById("bottomEdit").addEventListener("click", () => {
    openModal(editModal);
});

document.querySelectorAll(".mini-edit").forEach(button => {
    button.addEventListener("click", () => {
        const section = button.dataset.section;

        if (section === "documents") {
            showToast("Document upload options will be connected to the backend.");
            return;
        }

        openModal(editModal);
    });
});

profileForm.addEventListener("submit", async event => {
    event.preventDefault();
    const name = document.getElementById("editName").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const phone = document.getElementById("editPhone").value.trim();
    if (!name || !email) { showToast("Please enter your name."); return; }
    const token = localStorage.getItem("campuswell_access_token");
    if (!token) { showToast("Please sign in again to update your profile."); return; }
    const submit = profileForm.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    try {
        const response = await fetch("https://campuswell-api-dah4.onrender.com/api/v1/student/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({ full_name: name, phone: phone || null })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || "Could not save profile changes.");
        displayName.textContent = data.full_name;
        fullName.textContent = data.full_name;
        emailAddress.textContent = data.email;
        phoneNumber.textContent = data.phone || "Not provided";
        profileInitial.textContent = getInitial(data.full_name);
        document.querySelector(".student-profile .profile-info h4")?.replaceChildren(document.createTextNode(data.full_name));
        localStorage.setItem("campuswell_profile_name", data.full_name);
        localStorage.setItem("campuswell_profile_email", data.email);
        localStorage.setItem("campuswell_profile_phone", data.phone || "");
        closeModal(editModal);
        showToast("Profile updated successfully.");
    } catch (error) {
        showToast(error.message);
    } finally {
        if (submit) submit.disabled = false;
    }
});

document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
        const modal = document.getElementById(button.dataset.close);
        closeModal(modal);
    });
});

document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", () => {
        const modal = overlay.closest(".modal");
        closeModal(modal);
    });
});

document.querySelectorAll(".view-document").forEach(button => {
    button.addEventListener("click", () => {
        documentTitle.textContent = button.dataset.document;
        documentDescription.textContent = `${button.dataset.document} is a verified document in your student record.`;
        openModal(documentModal);
    });
});

document.querySelectorAll(".download-document").forEach(button => {
    button.addEventListener("click", () => {
        showToast(`${button.dataset.document} download will be connected to stored files.`);
    });
});

document.querySelectorAll(".upload-document").forEach(button => {
    button.addEventListener("click", () => {
        showToast(`Upload ${button.dataset.document} will be connected to the document system.`);
    });
});

document.getElementById("viewIdCard").addEventListener("click", () => {
    openModal(idModal);
});

document.getElementById("idViewButton").addEventListener("click", () => {
    openModal(idModal);
});

document.getElementById("idDownloadButton").addEventListener("click", () => {
    showToast("Student ID download will be connected to the document system.");
});

document.getElementById("idDownloadModal").addEventListener("click", () => {
    showToast("Student ID download will be connected to the document system.");
});

document.getElementById("contactMentor").addEventListener("click", () => {
    showToast("Mentor contact will be connected to the college communication system.");
});

document.querySelectorAll(".privacy-item").forEach(button => {
    button.addEventListener("click", () => {
        showToast(`${button.dataset.setting} will open here.`);
    });
});

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") {
        return;
    }

    closeModal(editModal);
    closeModal(documentModal);
    closeModal(idModal);
});

const savedName = localStorage.getItem("campuswell_profile_name");
const savedEmail = localStorage.getItem("campuswell_profile_email");
const savedPhone = localStorage.getItem("campuswell_profile_phone");

if (savedName) {
    displayName.textContent = savedName;
    fullName.textContent = savedName;
    profileInitial.textContent = getInitial(savedName);
    document.getElementById("editName").value = savedName;
}

if (savedEmail) {
    emailAddress.textContent = savedEmail;
    document.getElementById("editEmail").value = savedEmail;
}

if (savedPhone) {
    phoneNumber.textContent = savedPhone;
    document.getElementById("editPhone").value = savedPhone;
}


async function loadStudentProfile() {
    const token = localStorage.getItem("campuswell_access_token");
    if (!token) return;
    try {
        const response = await fetch("https://campuswell-api-dah4.onrender.com/api/v1/student/profile", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) return;
        const profile = await response.json();
        const name = profile.full_name || "Student";
        displayName.textContent = name;
        fullName.textContent = name;
        profileInitial.textContent = getInitial(name);
        emailAddress.textContent = profile.email || "—";
        phoneNumber.textContent = profile.phone || "Not provided";
        document.getElementById("editPhone").value = profile.phone || "";
        document.getElementById("editEmail").readOnly = true;
        document.getElementById("displayStudentId").textContent = profile.student_number || "Student account";
        document.querySelector(".student-profile .profile-info h4").textContent = name;
        document.querySelector(".student-profile .profile-info p").textContent = profile.course || profile.department || "Student";
        document.getElementById("editName").value = name;
        document.getElementById("editEmail").value = profile.email || "";
        const academic = document.querySelectorAll(".academic-grid .info-item strong");
        if (academic[0]) academic[0].textContent = profile.student_number || "Not provided";
        if (academic[1]) academic[1].textContent = profile.course || "Not provided";
        if (academic[2]) academic[2].textContent = profile.department || "Not provided";
        if (academic[3]) academic[3].textContent = profile.year_of_study ? `Year ${profile.year_of_study}` : "Not provided";
    } catch (_) {
        // Keep the page usable if the profile service is temporarily unavailable.
    }
}
loadStudentProfile();

lucide.createIcons();
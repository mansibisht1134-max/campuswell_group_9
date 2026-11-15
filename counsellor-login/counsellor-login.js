const form = document.getElementById("counsellorLoginForm");
const email = document.getElementById("counsellorEmail");
const password = document.getElementById("counsellorPassword");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const passwordToggle = document.getElementById("passwordToggle");
const forgotPassword = document.getElementById("forgotPassword");
const toast = document.getElementById("toast");

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

passwordToggle.addEventListener("click", () => {
    const showing = password.type === "text";

    password.type = showing ? "password" : "text";

    passwordToggle.innerHTML = showing ?
        '<i data-lucide="eye"></i>' :
        '<i data-lucide="eye-off"></i>';

    lucide.createIcons();
});

email.addEventListener("input", () => {
    emailError.textContent = "";
});

password.addEventListener("input", () => {
    passwordError.textContent = "";
});

forgotPassword.addEventListener("click", event => {
    event.preventDefault();
    showToast("Password recovery will be connected to the backend.");
});

form.addEventListener("submit", event => {
    event.preventDefault();

    emailError.textContent = "";
    passwordError.textContent = "";

    let valid = true;

    if (!email.value.trim()) {
        emailError.textContent = "Please enter your professional email.";
        valid = false;
    } else if (!email.validity.valid) {
        emailError.textContent = "Please enter a valid email address.";
        valid = false;
    }

    if (!password.value.trim()) {
        passwordError.textContent = "Please enter your password.";
        valid = false;
    }

    if (!valid) {
        return;
    }

    localStorage.setItem("campuswell_counsellor_email", email.value.trim());

    showToast("Login successful. Opening counsellor dashboard...");

    setTimeout(() => {
        window.location.href = "../counsellor/counsellor-dashboard.html";
    }, 700);
});

lucide.createIcons();
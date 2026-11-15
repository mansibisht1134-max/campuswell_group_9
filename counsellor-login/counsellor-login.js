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
    window.setTimeout(() => toast.classList.remove("show"), 2500);
}

passwordToggle.addEventListener("click", () => {
    const showPassword = password.type === "password";
    password.type = showPassword ? "text" : "password";
    passwordToggle.innerHTML = showPassword
        ? '<i data-lucide="eye-off"></i>'
        : '<i data-lucide="eye"></i>';
    passwordToggle.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
    lucide.createIcons();
});

email.addEventListener("input", () => emailError.textContent = "");
password.addEventListener("input", () => passwordError.textContent = "");

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

    if (!valid) return;

    if (document.getElementById("rememberMe").checked) {
        localStorage.setItem("campuswell_counsellor_email", email.value.trim());
    } else {
        localStorage.removeItem("campuswell_counsellor_email");
    }

    showToast("Login successful. Opening counsellor dashboard...");
    window.setTimeout(() => {
        window.location.href = "../counsellor/counsellor-dashboard.html";
    }, 700);
});

const rememberedEmail = localStorage.getItem("campuswell_counsellor_email");
if (rememberedEmail) {
    email.value = rememberedEmail;
    document.getElementById("rememberMe").checked = true;
}

lucide.createIcons();
const form = document.getElementById("studentLoginForm");
const email = document.getElementById("studentEmail");
const password = document.getElementById("studentPassword");
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
    const isPassword = password.type === "password";

    password.type = isPassword ? "text" : "password";

    passwordToggle.innerHTML = isPassword ?
        '<i data-lucide="eye-off"></i>' :
        '<i data-lucide="eye"></i>';

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
        emailError.textContent = "Please enter your student email.";
        valid = false;
    }

    if (!email.validity.valid && email.value.trim()) {
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

    localStorage.setItem("campuswell_student_email", email.value.trim());

    showToast("Login successful. Opening your dashboard...");

    setTimeout(() => {
        window.location.href = "../dashboard/dashboard.html";
    }, 700);
});

lucide.createIcons();
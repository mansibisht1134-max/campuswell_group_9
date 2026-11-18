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

form.addEventListener("submit", async event => {
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
    if (!password.value) {
        passwordError.textContent = "Please enter your password.";
        valid = false;
    }
    if (!valid) return;

    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    showToast("Verifying counsellor account...");
    try {
        const response = await fetch("https://campuswell-api-dah4.onrender.com/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ email: email.value.trim(), password: password.value })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || "Invalid email or password.");
        if (data.user?.role !== "counsellor") {
            throw new Error("This account does not have counsellor access.");
        }
        localStorage.setItem("campuswell_access_token", data.access_token);
        localStorage.setItem("campuswell_user", JSON.stringify(data.user));
        localStorage.setItem("campuswell_counsellor_email", data.user.email);
        showToast("Login successful. Opening counsellor dashboard...");
        window.location.href = "../counsellor/counsellor-dashboard.html";
    } catch (error) {
        showToast(error.message);
    } finally {
        if (submit) submit.disabled = false;
    }
});

lucide.createIcons();
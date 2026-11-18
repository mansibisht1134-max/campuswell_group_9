const API_BASE_URL = "https://campuswell-api-dah4.onrender.com/api/v1";

const form = document.getElementById("studentLoginForm");
const email = document.getElementById("studentEmail");
const password = document.getElementById("studentPassword");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const passwordToggle = document.getElementById("passwordToggle");
const forgotPassword = document.getElementById("forgotPassword");
const toast = document.getElementById("toast");
const submitButton = form.querySelector('button[type="submit"]');

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

passwordToggle.addEventListener("click", () => {
    const isPassword = password.type === "password";
    password.type = isPassword ? "text" : "password";
    passwordToggle.innerHTML = isPassword
        ? '<i data-lucide="eye-off"></i>'
        : '<i data-lucide="eye"></i>';
    lucide.createIcons();
});

email.addEventListener("input", () => { emailError.textContent = ""; });
password.addEventListener("input", () => { passwordError.textContent = ""; });

forgotPassword.addEventListener("click", event => {
    event.preventDefault();
    showToast("Please contact your CampusWell administrator for password assistance.");
});

form.addEventListener("submit", async event => {
    event.preventDefault();
    emailError.textContent = "";
    passwordError.textContent = "";

    if (!email.value.trim()) {
        emailError.textContent = "Please enter your student email.";
        return;
    }
    if (!email.validity.valid) {
        emailError.textContent = "Please enter a valid email address.";
        return;
    }
    if (!password.value) {
        passwordError.textContent = "Please enter your password.";
        return;
    }

    submitButton.disabled = true;
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = "<span>Signing in...</span>";

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({
                email: email.value.trim(),
                password: password.value
            })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            if (response.status === 401) {
                passwordError.textContent = "Incorrect email or password.";
            } else {
                showToast(data.detail || "Unable to sign in. Please try again.");
            }
            return;
        }

        if (!data.user || data.user.role !== "student") {
            passwordError.textContent = "This account is not a student account. Please use the correct portal.";
            return;
        }

        localStorage.setItem("campuswell_access_token", data.access_token);
        localStorage.setItem("campuswell_student_email", data.user.email);
        localStorage.setItem("campuswell_user", JSON.stringify(data.user));
        showToast("Login successful. Opening your dashboard...");
        setTimeout(() => {
            window.location.href = "../dashboard/dashboard.html";
        }, 700);
    } catch (error) {
        showToast("Cannot connect to CampusWell. Please try again in a moment.");
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
});

lucide.createIcons();

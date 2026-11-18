const API_BASE_URL = "https://campuswell-api-dah4.onrender.com/api/v1";
const token = localStorage.getItem("campuswell_access_token");
const counsellorCards = document.querySelectorAll(".counsellor-card");
const reasonOptions = document.querySelectorAll(".reason-option");
const appointmentReason = document.getElementById("appointmentReason");
const appointmentDate = document.getElementById("appointmentDate");
const appointmentTime = document.getElementById("appointmentTime");
const appointmentMessage = document.getElementById("appointmentMessage");
const characterCount = document.getElementById("characterCount");
const confirmAppointment = document.getElementById("confirmAppointment");
const startBooking = document.getElementById("startBooking");
const upcomingAppointment = document.getElementById("upcomingAppointment");
const appointmentHistory = document.getElementById("appointmentHistory");
const upcomingCount = document.getElementById("upcomingCount");
const completedCount = document.getElementById("completedCount");
const pendingCount = document.getElementById("pendingCount");
const totalCount = document.getElementById("totalCount");
const historyCount = document.getElementById("historyCount");
const toast = document.getElementById("toast");
const confirmationModal = document.getElementById("confirmationModal");
const closeModal = document.getElementById("closeModal");
const doneModal = document.getElementById("doneModal");
const modalCounsellor = document.getElementById("modalCounsellor");
const modalDate = document.getElementById("modalDate");
const modalTime = document.getElementById("modalTime");

let appointments = [];
let counsellors = [];
let selectedCounsellorId = null;
let selectedCounsellorName = "";

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2800);
}

function apiRequest(path, options = {}) {
    return fetch(API_BASE_URL + path, {
        ...options,
        headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        }
    }).then(async response => {
        if (response.status === 401) {
            ["campuswell_access_token", "campuswell_student_email", "campuswell_user"].forEach(key => localStorage.removeItem(key));
            window.location.replace("../student-login/student-login.html");
            throw new Error("Your session expired. Please sign in again.");
        }
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || "Request failed.");
        return data;
    });
}

function formatDate(value) {
    return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(value) {
    return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function showModal(appointment) {
    modalCounsellor.textContent = selectedCounsellorName;
    modalDate.textContent = formatDate(appointment.scheduled_at);
    modalTime.textContent = formatTime(appointment.scheduled_at);
    confirmationModal.classList.add("show");
}

function renderCounsellors() {
    const grid = document.querySelector(".counsellor-grid");
    if (!counsellors.length) {
        grid.innerHTML = "<p>No counsellors are currently available. Please contact student support.</p>";
        return;
    }
    grid.innerHTML = counsellors.map((person, index) => {
        const initials = person.full_name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
        return '<button type="button" class="counsellor-card ' + (index === 0 ? "active" : "") + '" data-id="' + person.id + '" data-name="' + person.full_name.replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '"><div class="counsellor-avatar">' + initials + '</div><div><strong>' + person.full_name + '</strong><span>' + (person.specialization || "Student Counsellor") + '</span><small>Available for requests</small></div></button>';
    }).join("");
    const cards = grid.querySelectorAll(".counsellor-card");
    cards.forEach((card, index) => card.addEventListener("click", () => {
        cards.forEach(item => item.classList.remove("active"));
        card.classList.add("active");
        selectedCounsellorId = Number(card.dataset.id);
        selectedCounsellorName = card.dataset.name;
    }));
    selectedCounsellorId = counsellors[0].id;
    selectedCounsellorName = counsellors[0].full_name;
}

function renderAppointments() {
    const now = new Date();
    const upcoming = appointments.filter(item => new Date(item.scheduled_at) >= now && !["Cancelled", "Declined", "Completed"].includes(item.status));
    const completed = appointments.filter(item => ["Completed", "Cancelled", "Declined"].includes(item.status) || new Date(item.scheduled_at) < now);
    const pending = appointments.filter(item => item.status === "Pending");
    upcomingCount.textContent = upcoming.length;
    completedCount.textContent = completed.length;
    pendingCount.textContent = pending.length;
    totalCount.textContent = appointments.length;
    historyCount.textContent = completed.length;

    if (!upcoming.length) {
        upcomingAppointment.innerHTML = '<div class="no-appointment"><div class="no-appointment-icon"><i data-lucide="calendar-off"></i></div><strong>No upcoming appointments</strong><p>Your requested sessions will appear here.</p><button id="startBooking">Book an Appointment</button></div>';
        document.getElementById("startBooking").addEventListener("click", scrollToBooking);
    } else {
        upcomingAppointment.innerHTML = upcoming.map(item => {
            const person = counsellors.find(c => c.id === item.counsellor_id);
            return '<div class="appointment-item upcoming-item"><strong>' + (person?.full_name || "Counsellor") + '</strong><span><i data-lucide="calendar"></i> ' + formatDate(item.scheduled_at) + '</span><span><i data-lucide="clock-3"></i> ' + formatTime(item.scheduled_at) + '</span><span><i data-lucide="message-circle"></i> ' + item.reason + '</span><small>Status: ' + item.status + '</small>' + (item.status === "Pending" ? '<button type="button" class="cancel-appointment" data-id="' + item.id + '">Cancel request</button>' : "") + '</div>';
        }).join("");
        upcomingAppointment.querySelectorAll(".cancel-appointment").forEach(button => button.addEventListener("click", () => updateAppointmentStatus(button.dataset.id, "Cancelled")));
    }

    if (!completed.length) {
        appointmentHistory.innerHTML = '<div class="empty-history"><i data-lucide="calendar-search"></i><p>No appointment history yet.</p></div>';
    } else {
        appointmentHistory.innerHTML = completed.map(item => '<div class="appointment-item"><strong>' + (counsellors.find(c => c.id === item.counsellor_id)?.full_name || "Counsellor") + '</strong><span>' + formatDate(item.scheduled_at) + ' • ' + formatTime(item.scheduled_at) + '</span><span>' + item.reason + '</span><small>' + item.status + '</small></div>').join("");
    }
    if (window.lucide) lucide.createIcons();
}

async function updateAppointmentStatus(id, status) {
    try {
        await apiRequest("/appointments/" + id + "/status", { method: "PATCH", body: JSON.stringify({ status }) });
        showToast("Appointment request cancelled.");
        await loadAppointments();
    } catch (error) { showToast(error.message); }
}

async function loadAppointments() {
    try {
        const [people, items] = await Promise.all([apiRequest("/counsellors"), apiRequest("/appointments")]);
        counsellors = people;
        appointments = items;
        renderCounsellors();
        renderAppointments();
    } catch (error) {
        showToast(error.message);
    }
}

function scrollToBooking() {
    document.getElementById("bookingSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

reasonOptions.forEach(option => option.addEventListener("click", () => {
    reasonOptions.forEach(item => item.classList.remove("active"));
    option.classList.add("active");
    appointmentReason.value = option.dataset.reason;
}));

appointmentMessage.addEventListener("input", () => {
    characterCount.textContent = appointmentMessage.value.length + "/300";
});

appointmentDate.min = new Date().toISOString().split("T")[0];

confirmAppointment.addEventListener("click", async () => {
    const date = appointmentDate.value;
    const time = appointmentTime.value;
    const reason = appointmentReason.value;
    if (!selectedCounsellorId) return showToast("No counsellor is currently available.");
    if (!date || !time || !reason) return showToast("Please select a date, time and reason.");
    const [clock, meridiem] = time.split(" ");
    let [hours, minutes] = clock.split(":").map(Number);
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    const scheduled = new Date(date + "T" + String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0") + ":00");
    if (scheduled <= new Date()) return showToast("Please choose a future date and time.");
    confirmAppointment.disabled = true;
    confirmAppointment.textContent = "Sending request...";
    try {
        const result = await apiRequest("/appointments", {
            method: "POST",
            body: JSON.stringify({
                counsellor_id: selectedCounsellorId,
                scheduled_at: scheduled.toISOString(),
                mode: "In-person",
                reason,
                message: appointmentMessage.value.trim() || null
            })
        });
        showModal(result);
        appointmentDate.value = "";
        appointmentTime.value = "";
        appointmentMessage.value = "";
        appointmentReason.value = "";
        characterCount.textContent = "0/300";
        reasonOptions.forEach(item => item.classList.remove("active"));
        await loadAppointments();
    } catch (error) {
        showToast(error.message);
    } finally {
        confirmAppointment.disabled = false;
        confirmAppointment.innerHTML = '<i data-lucide="calendar-check-2"></i>Confirm Appointment';
        if (window.lucide) lucide.createIcons();
    }
});

function hideModal() { confirmationModal.classList.remove("show"); }
closeModal.addEventListener("click", hideModal);
doneModal.addEventListener("click", hideModal);
document.querySelector(".modal-overlay").addEventListener("click", hideModal);
if (startBooking) startBooking.addEventListener("click", scrollToBooking);

if (!token) window.location.replace("../student-login/student-login.html");
else loadAppointments();
if (window.lucide) lucide.createIcons();

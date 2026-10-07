const STORAGE_KEY = "campuswell_appointments";

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

let appointments = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let selectedCounsellor = "Dr. Priya Sharma";

function saveAppointments() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function formatDate(date) {
    return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function getStatus(appointment) {
    const appointmentDateTime = new Date(`${appointment.date}T${convertTo24Hour(appointment.time)}`);
    if (appointmentDateTime < new Date()) {
        return "Completed";
    }
    return appointment.status || "Upcoming";
}

function convertTo24Hour(time) {
    const [value, modifier] = time.split(" ");
    let [hours, minutes] = value.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) {
        hours += 12;
    }

    if (modifier === "AM" && hours === 12) {
        hours = 0;
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

function updateStats() {
    const upcoming = appointments.filter(item => getStatus(item) === "Upcoming").length;
    const completed = appointments.filter(item => getStatus(item) === "Completed").length;
    const pending = appointments.filter(item => item.status === "Pending").length;

    upcomingCount.textContent = upcoming;
    completedCount.textContent = completed;
    pendingCount.textContent = pending;
    totalCount.textContent = appointments.length;
    historyCount.textContent = completed;
}

function renderUpcoming() {
    const upcoming = appointments
        .filter(item => getStatus(item) === "Upcoming")
        .sort((a, b) => new Date(`${a.date}T${convertTo24Hour(a.time)}`) - new Date(`${b.date}T${convertTo24Hour(b.time)}`));

    if (!upcoming.length) {
        upcomingAppointment.innerHTML = `
            <div class="no-appointment">
                <div class="no-appointment-icon"><i data-lucide="calendar-off"></i></div>
                <strong>No upcoming appointments</strong>
                <p>Your scheduled sessions will appear here.</p>
                <button id="startBooking">Book an Appointment</button>
            </div>
        `;

        document.getElementById("startBooking").addEventListener("click", scrollToBooking);
        lucide.createIcons();
        return;
    }

    const appointment = upcoming[0];

    upcomingAppointment.innerHTML = `
        <div class="appointment-item upcoming-item">
            <strong>${appointment.counsellor}</strong>
            <span><i data-lucide="calendar"></i> ${formatDate(appointment.date)}</span>
            <span><i data-lucide="clock-3"></i> ${appointment.time}</span>
            <span><i data-lucide="message-circle"></i> ${appointment.reason}</span>
            <small>Upcoming appointment</small>
        </div>
    `;

    lucide.createIcons();
}

function renderHistory() {
    const completed = appointments
        .filter(item => getStatus(item) === "Completed")
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!completed.length) {
        appointmentHistory.innerHTML = `
            <div class="empty-history">
                <i data-lucide="calendar-search"></i>
                <p>No appointment history yet.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    appointmentHistory.innerHTML = completed.map(appointment => `
        <div class="appointment-item">
            <strong>${appointment.counsellor}</strong>
            <span>${formatDate(appointment.date)} • ${appointment.time}</span>
            <span>${appointment.reason}</span>
            <small>Completed</small>
        </div>
    `).join("");

    lucide.createIcons();
}

function renderAll() {
    updateStats();
    renderUpcoming();
    renderHistory();
}

function scrollToBooking() {
    document.getElementById("bookingSection").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

counsellorCards.forEach(card => {
    card.addEventListener("click", () => {
        counsellorCards.forEach(item => item.classList.remove("active"));
        card.classList.add("active");
        selectedCounsellor = card.dataset.counsellor;
    });
});

reasonOptions.forEach(option => {
    option.addEventListener("click", () => {
        reasonOptions.forEach(item => item.classList.remove("active"));
        option.classList.add("active");
        appointmentReason.value = option.dataset.reason;
    });
});

appointmentMessage.addEventListener("input", () => {
    characterCount.textContent = `${appointmentMessage.value.length}/300`;
});

appointmentDate.min = new Date().toISOString().split("T")[0];

confirmAppointment.addEventListener("click", () => {
    const date = appointmentDate.value;
    const time = appointmentTime.value;
    const reason = appointmentReason.value;
    const message = appointmentMessage.value.trim();

    if (!date) {
        showToast("Please select an appointment date.");
        appointmentDate.focus();
        return;
    }

    if (!time) {
        showToast("Please select an appointment time.");
        appointmentTime.focus();
        return;
    }

    if (!reason) {
        showToast("Please select a reason for your appointment.");
        return;
    }

    const selectedDateTime = new Date(`${date}T${convertTo24Hour(time)}`);

    if (selectedDateTime < new Date()) {
        showToast("Please choose a future date and time.");
        return;
    }

    const newAppointment = {
        id: Date.now(),
        counsellor: selectedCounsellor,
        date,
        time,
        reason,
        message,
        status: "Upcoming",
        createdAt: new Date().toISOString()
    };

    appointments.push(newAppointment);
    saveAppointments();

    modalCounsellor.textContent = selectedCounsellor;
    modalDate.textContent = formatDate(date);
    modalTime.textContent = time;

    confirmationModal.classList.add("show");

    appointmentDate.value = "";
    appointmentTime.value = "";
    appointmentMessage.value = "";
    appointmentReason.value = "";
    characterCount.textContent = "0/300";

    reasonOptions.forEach(item => item.classList.remove("active"));

    renderAll();
});

function hideModal() {
    confirmationModal.classList.remove("show");
}

closeModal.addEventListener("click", hideModal);
doneModal.addEventListener("click", hideModal);

document.querySelector(".modal-overlay").addEventListener("click", hideModal);

if (startBooking) {
    startBooking.addEventListener("click", scrollToBooking);
}

renderAll();
lucide.createIcons();
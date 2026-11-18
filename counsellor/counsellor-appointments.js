const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalForm = document.getElementById("modalForm");
const modalActions = document.getElementById("modalActions");
const modalClose = document.getElementById("modalClose");
const modalButton = document.getElementById("modalButton");
const monthTitle = document.getElementById("monthTitle");
const searchInput = document.getElementById("searchInput");
let calendarDate = new Date(2026, 9, 1);
let primaryAction = null;
let appointmentNumber = 1;

function openModal(title, text, fields = [], actions = [], buttonText = "Close", onPrimary = null) {
    modalTitle.textContent = title;
    modalText.textContent = text;
    modalForm.innerHTML = "";
    modalActions.innerHTML = "";
    primaryAction = onPrimary;

    fields.forEach(field => {
        const wrapper = document.createElement("div");
        const label = document.createElement("label");
        label.textContent = field.label;
        label.htmlFor = field.id;
        wrapper.appendChild(label);

        let input;

        if (field.type === "select") {
            input = document.createElement("select");
            field.options.forEach(optionText => {
                const option = document.createElement("option");
                option.value = optionText;
                option.textContent = optionText;
                input.appendChild(option);
            });
        } else {
            input = document.createElement("input");
            input.type = field.type || "text";
        }

        input.id = field.id;
        input.placeholder = field.placeholder || "";
        input.value = field.value || "";
        input.required = Boolean(field.required);
        wrapper.appendChild(input);
        modalForm.appendChild(wrapper);
    });

    actions.forEach(action => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = action.label;
        button.addEventListener("click", action.onClick);
        modalActions.appendChild(button);
    });

    modalButton.textContent = buttonText;
    modal.classList.add("show");

    if (window.lucide) {
        lucide.createIcons();
    }
}

function closeModal() {
    modal.classList.remove("show");
    primaryAction = null;
}

function updateMonthTitle() {
    monthTitle.textContent = calendarDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });
}

function showAppointmentDetails(element) {
    openModal(
        element.dataset.name,
        element.dataset.details || "Counselling appointment details."
    );
}

function filterPage() {
    const query = searchInput.value.trim().toLowerCase();

    document.querySelectorAll(".appointment").forEach(item => {
        const text = `${item.dataset.name || ""} ${item.dataset.details || ""} ${item.textContent}`.toLowerCase();
        item.style.display = text.includes(query) ? "flex" : "none";
    });

    document.querySelectorAll(".right-workspace .request-card, .reschedule-item").forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(query) ? "" : "none";
    });

    document.querySelectorAll(".history-table .table-row").forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(query) ? "grid" : "none";
    });
}

document.querySelectorAll(".appointment").forEach(item => {
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.addEventListener("click", () => showAppointmentDetails(item));
    item.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            showAppointmentDetails(item);
        }
    });
});

document.getElementById("prevMonth").addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    updateMonthTitle();
});

document.getElementById("nextMonth").addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    updateMonthTitle();
});

document.getElementById("todayButton").addEventListener("click", () => {
    calendarDate = new Date();
    updateMonthTitle();
    openModal("Calendar Updated", "The calendar heading has been returned to the current month. The displayed sample appointments are demo data.");
});

document.querySelectorAll(".view-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".view-btn").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        if (button.dataset.view !== "week") {
            openModal(`${button.textContent.trim()} View`, `${button.textContent.trim()} view is selected. The displayed calendar entries are a sample week for this frontend demo.`);
        }
    });
});

document.getElementById("newAppointmentButton").addEventListener("click", () => {
    openModal("Add Appointment", "Enter the session details below.", [
        { id: "newStudent", label: "Student name", type: "text", placeholder: "Enter student name", required: true },
        { id: "newTopic", label: "Session topic", type: "text", placeholder: "For example, stress management", required: true },
        { id: "newDate", label: "Date", type: "date", value: "2026-10-05", required: true },
        { id: "newTime", label: "Time", type: "time", value: "10:00", required: true },
        { id: "newMode", label: "Session mode", type: "select", options: ["Online Session", "In-person", "Follow-up"] }
    ], [], "Save Appointment", () => {
        const name = document.getElementById("newStudent").value.trim();
        const topic = document.getElementById("newTopic").value.trim();
        const dateValue = document.getElementById("newDate").value;
        const timeValue = document.getElementById("newTime").value;
        const mode = document.getElementById("newMode").value;

        if (!name || !topic || !dateValue || !timeValue) {
            openModal("Missing Information", "Complete the student, topic, date and time fields before saving.");
            return;
        }

        const date = new Date(`${dateValue}T${timeValue}`);
        const weekdays = ["", "Mon", "Tue", "Wed", "Thu", "Fri"];
        const weekday = date.getDay();
        const columns = [...document.querySelectorAll(".calendar-body .day-column")];
        const columnIndex = weekday >= 1 && weekday <= 5 ? weekday - 1 : 0;
        const column = columns[columnIndex] || columns[0];
        const [hourValue, minuteValue] = timeValue.split(":").map(Number);
        const top = Math.max(4, Math.min(575, ((hourValue - 9) + minuteValue / 60) * 72));
        const timeLabel = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        const event = document.createElement("div");
        event.className = `appointment ${appointmentNumber % 2 ? "event-blue" : "event-purple"}`;
        event.style.top = `${top}px`;
        event.style.height = "55px";
        event.dataset.name = name;
        event.dataset.details = `${topic} · ${timeLabel} · ${mode} · ${date.toLocaleDateString("en-GB")}`;
        event.innerHTML = `<strong></strong><span></span><small></small>`;
        event.querySelector("strong").textContent = timeLabel;
        event.querySelector("span").textContent = name;
        event.querySelector("small").textContent = topic;
        event.tabIndex = 0;
        event.setAttribute("role", "button");
        event.addEventListener("click", () => showAppointmentDetails(event));
        event.addEventListener("keydown", keyEvent => {
            if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                keyEvent.preventDefault();
                showAppointmentDetails(event);
            }
        });
        column.appendChild(event);
        appointmentNumber++;
        filterPage();
        closeModal();
        openModal("Appointment Saved", `${name}'s appointment has been added to the sample calendar. Changes are stored only in this browser session.`);
    });
});

document.querySelectorAll(".accept").forEach(button => {
    button.addEventListener("click", () => {
        const card = button.closest(".request-card");
        const name = card.querySelector(".person strong").textContent;
        openModal("Accept Request", `Accept the appointment request from ${name}?`, [], [
            { label: "Cancel", onClick: closeModal },
            { label: "Accept Request", onClick: () => {
                card.remove();
                closeModal();
                openModal("Request Accepted", `${name}'s request has been marked as accepted in this demo.`);
            } }
        ]);
    });
});

document.querySelectorAll(".decline").forEach(button => {
    button.addEventListener("click", () => {
        const card = button.closest(".request-card");
        const name = card.querySelector(".person strong").textContent;
        openModal("Decline Request", `Decline the appointment request from ${name}?`, [], [
            { label: "Cancel", onClick: closeModal },
            { label: "Decline Request", onClick: () => {
                card.remove();
                closeModal();
                openModal("Request Declined", `${name}'s request has been removed from this sample inbox.`);
            } }
        ]);
    });
});

document.getElementById("allRequests").addEventListener("click", () => {
    window.location.assign("counsellor-request.html");
});

document.getElementById("manageAvailability").addEventListener("click", () => {
    openModal("Manage Availability", "Your demo availability is Monday to Friday, 9:00 AM to 5:00 PM.", [
        { id: "availabilityStart", label: "Start time", type: "time", value: "09:00", required: true },
        { id: "availabilityEnd", label: "End time", type: "time", value: "17:00", required: true }
    ], [], "Save Availability", () => {
        const start = document.getElementById("availabilityStart").value;
        const end = document.getElementById("availabilityEnd").value;
        if (!start || !end || start >= end) {
            openModal("Check Availability", "Choose an end time later than the start time.");
            return;
        }
        document.querySelector(".availability-card > strong").textContent = `${new Date(`2000-01-01T${start}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${new Date(`2000-01-01T${end}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
        closeModal();
        openModal("Availability Updated", "Your availability has been updated for this demo session.");
    });
});

document.querySelectorAll(".view-request").forEach(button => {
    button.addEventListener("click", () => {
        const item = button.closest(".reschedule-item");
        openModal("Reschedule Request", `${item.querySelector("strong").textContent} requested a change to ${item.querySelector("span").textContent}.`);
    });
});

document.getElementById("historyFilter").addEventListener("click", () => {
    const rows = [...document.querySelectorAll(".history-table .table-row")];
    openModal("Appointment History", rows.map(row => row.textContent.trim().replace(/\s+/g, " · ")).join("\n"));
});

document.getElementById("rulesButton").addEventListener("click", () => {
    openModal("Appointment Rules", "Session duration: 50 minutes. Buffer time: 10 minutes. Advance booking: 30 days. Cancellation notice: 12 hours.");
});

document.getElementById("notificationButton").addEventListener("click", () => {
    openModal("Notifications", "You have 3 unread notifications.");
});

document.getElementById("supportButton").addEventListener("click", event => {
    event.preventDefault();
    openModal("CampusWell Support", "Contact CampusWell administration for portal support.");
});

document.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        openModal(link.dataset.page, `${link.dataset.page} will be connected to the FastAPI backend and PostgreSQL database.`);
    });
});

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
});
modalButton.addEventListener("click", () => {
    if (primaryAction) {
        primaryAction();
    } else {
        closeModal();
    }
});

searchInput.addEventListener("input", filterPage);
updateMonthTitle();
if (window.lucide) lucide.createIcons();


const LIVE_API = "https://campuswell-api-dah4.onrender.com/api/v1";
function liveEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]);
}
async function loadLiveAppointments() {
    const token = localStorage.getItem("campuswell_access_token");
    const host = document.getElementById("liveAppointmentList");
    if (!token) { host.textContent = "Sign in with a counsellor account to view appointments."; return; }
    try {
        const response = await fetch(`${LIVE_API}/appointments`, { headers:{Authorization:`Bearer ${token}`} });
        if (response.status === 401) { host.textContent = "Session expired. Please sign in again."; return; }
        if (!response.ok) throw new Error("Could not load appointments.");
        const appointments = await response.json();
        host.innerHTML = "";
        if (!appointments.length) { host.textContent = "No appointments assigned to your account yet."; return; }
        appointments.forEach(item => {
            const row = document.createElement("div");
            row.style.cssText = "display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;padding:14px;border:1px solid #e5eaf1;border-radius:12px;margin:10px 0;background:#fff;";
            const date = new Date(item.scheduled_at);
            const details = document.createElement("div");
            details.innerHTML = `<strong>${liveEscape("Student #"+item.student_id)} · ${liveEscape(item.reason)}</strong><div style="color:#64748b;font-size:13px;margin-top:4px;">${date.toLocaleString()} · ${liveEscape(item.mode)} · ${liveEscape(item.status)}</div>`;
            row.appendChild(details);
            const actions = document.createElement("div");
            actions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;";
            const allowed = item.status === "Pending" ? ["Confirmed","Declined"] : item.status === "Confirmed" ? ["Completed"] : [];
            allowed.forEach(status => {
                const button = document.createElement("button");
                button.type = "button"; button.textContent = status;
                button.style.cssText = "padding:8px 12px;border:0;border-radius:8px;cursor:pointer;background:#eef2ff;color:#334155;";
                button.addEventListener("click", () => updateLiveAppointment(item.id,status));
                actions.appendChild(button);
            });
            row.appendChild(actions);
            host.appendChild(row);
        });
    } catch(error) { host.textContent = error.message; }
}
async function updateLiveAppointment(id,status) {
    const token = localStorage.getItem("campuswell_access_token");
    try {
        const response = await fetch(`${LIVE_API}/appointments/${id}/status`, {
            method:"PATCH",
            headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
            body:JSON.stringify({status})
        });
        const data = await response.json().catch(()=>({}));
        if (!response.ok) throw new Error(data.detail || "Could not update appointment.");
        await loadLiveAppointments();
        openModal("Appointment updated", `Appointment #${id} is now ${status}.`);
    } catch(error) { openModal("Update failed",error.message); }
}
const livePanel = document.createElement("section");
livePanel.style.cssText = "background:#fff;border:1px solid #e5eaf1;border-radius:16px;padding:20px;margin:0 0 22px;";
livePanel.innerHTML = '<h2 style="margin:0 0 8px;">Live Appointments</h2><p style="color:#64748b;margin:0 0 12px;">Appointments assigned to your counsellor account.</p><div id="liveAppointmentList">Loading appointments...</div>';
document.querySelector(".main-content").insertBefore(livePanel, document.querySelector(".appointment-tools"));
loadLiveAppointments();

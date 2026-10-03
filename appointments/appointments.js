const appointmentForm = document.getElementById("appointmentForm");
const message = document.getElementById("message");
appointmentForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const counsellor = document.getElementById("counsellor").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const reason = document.getElementById("reason").value.trim();
    if (!counsellor || !date || !time || !reason) {
        message.textContent = "Please complete all fields.";
        message.style.color = "red";
        return;
    }
    const appointment = {
        counsellor: counsellor,
        date: date,
        time: time,
        reason: reason
    };
    localStorage.setItem("campuswellAppointment", JSON.stringify(appointment));
    message.textContent = "Appointment booked successfully!";
    message.style.color = "green";
    appointmentForm.reset();
});
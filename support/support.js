const supportForm = document.getElementById("supportForm");
const message = document.getElementById("message");
supportForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const supportType = document.getElementById("supportType").value;
    const supportMessage = document.getElementById("supportMessage").value.trim();

    if (!supportType || !supportMessage) {
        message.textContent = "Please complete all fields.";
        message.style.color = "red";
        return;
    }
    const supportRequest = {
        type: supportType,
        message: supportMessage,
        submittedAt: new Date().toLocaleString()
    };
    localStorage.setItem(
        "campuswellSupportRequest",
        JSON.stringify(supportRequest)
    );
    message.textContent = "Your support request has been submitted successfully.";
    message.style.color = "green";

    supportForm.reset();
});
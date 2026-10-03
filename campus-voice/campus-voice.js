const voiceForm = document.getElementById("voiceForm");
const message = document.getElementById("message");
voiceForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const category = document.getElementById("category").value;
    const feedback = document.getElementById("feedback").value.trim();
    const anonymous = document.getElementById("anonymous").checked;
    if (!category || !feedback) {
        message.textContent = "Please complete all required fields.";
        message.style.color = "red";
        return;
    }
    const feedbackData = {
        category: category,
        feedback: feedback,
        anonymous: anonymous,
        submittedAt: new Date().toLocaleString()
    };
    localStorage.setItem(
        "campuswellCampusVoice",
        JSON.stringify(feedbackData)
    );
    message.textContent = "Your feedback has been submitted successfully.";
    message.style.color = "green";
    voiceForm.reset();
});
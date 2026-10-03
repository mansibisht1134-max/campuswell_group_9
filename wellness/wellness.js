const wellnessForm = document.getElementById("wellnessForm");
const message = document.getElementById("message");
wellnessForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const mood = document.getElementById("mood").value;
    const stress = document.getElementById("stress").value;
    if (!mood || !stress) {
        message.textContent = "Please select your mood and stress level.";
        message.style.color = "red";
        return;
    }
    message.textContent = "Your wellness check-in has been submitted successfully.";
    message.style.color = "green";
    wellnessForm.reset();
});
const searchInput = document.getElementById("wellnessSearch");
const navigationCards = Array.from(
    document.querySelectorAll(".wellness-navigation-card")
);

const navigationGrid = document.querySelector(".wellness-navigation-grid");

const noResults = document.createElement("div");
noResults.className = "no-results";
noResults.textContent = "No wellness sections found.";
noResults.style.display = "none";
noResults.style.padding = "24px";
noResults.style.textAlign = "center";
noResults.style.color = "#7a8ba0";
noResults.style.background = "#ffffff";
noResults.style.border = "1px solid #e2eaf3";
noResults.style.borderRadius = "12px";

if (navigationGrid) {
    navigationGrid.insertAdjacentElement("afterend", noResults);
}

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();
        let visibleCount = 0;

        navigationCards.forEach(card => {
            const searchableText = card.textContent.toLowerCase();
            const matches = searchableText.includes(query);

            card.style.display = matches ? "" : "none";

            if (matches) {
                visibleCount++;
            }
        });

        noResults.style.display = visibleCount === 0 ? "block" : "none";
    });
}

document.querySelectorAll(".main-nav a, .account-nav a").forEach(link => {
    if (link.getAttribute("href") === "#" && link.hasAttribute("data-page")) {
        link.addEventListener("click", event => {
            event.preventDefault();
        });
    }
});

const supportButton = document.getElementById("supportButton");

if (supportButton) {
    supportButton.addEventListener("click", event => {
        event.preventDefault();
    });
}

if (window.lucide) {
    lucide.createIcons();
}
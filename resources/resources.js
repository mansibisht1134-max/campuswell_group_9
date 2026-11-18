const resourceModal = document.getElementById("resourceModal");
const toolModal = document.getElementById("toolModal");
const modalClose = document.getElementById("modalClose");
const toolClose = document.getElementById("toolClose");
const modalOverlay = resourceModal.querySelector(".modal-overlay");
const toolOverlay = toolModal.querySelector(".modal-overlay");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
const modalTime = document.getElementById("modalTime");
const modalText = document.getElementById("modalText");
const modalAction = document.getElementById("modalAction");
const resourceSearch = document.getElementById("resourceSearch");
const resourceGrid = document.getElementById("resourceGrid");
const resourceTotal = document.getElementById("resourceTotal");
const personalResourceGrid = document.getElementById("personalResourceGrid");
const resourceTabs = document.querySelectorAll(".resource-tab");
const categoryFilters = document.querySelectorAll(".category-filter");
const toast = document.getElementById("toast");
const toolTitle = document.getElementById("toolTitle");
const toolText = document.getElementById("toolText");
const toolStart = document.getElementById("toolStart");
const breathingCircle = document.getElementById("breathingCircle");

let currentResource = null;
let currentTab = "recent";
let selectedCategory = "all";
let timer = null;

const toolsContent = {
    "Breathing Exercise": "Take a short pause and follow a simple breathing rhythm to slow down and reset.",
    "5-Minute Relaxation": "Give yourself five quiet minutes to relax your body and clear your mind.",
    "Sleep Check": "Reflect on your recent sleep routine and notice habits that may be affecting your rest.",
    "Study Break Timer": "Pause your study session, take a short break and return with a clearer mind."
};

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2400);
}

function saveRecent(title, category, time) {
    const key = "campuswell_recent_resources";
    const current = JSON.parse(localStorage.getItem(key)) || [];

    const updated = [
        { title, category, time },
        ...current.filter(item => item.title !== title)
    ].slice(0, 3);

    localStorage.setItem(key, JSON.stringify(updated));
}

function openResource(button) {
    currentResource = {
        title: button.dataset.title,
        category: button.dataset.category,
        time: button.dataset.time,
        text: button.dataset.text,
        resourceId: button.dataset.resourceId ? Number(button.dataset.resourceId) : null
    };

    modalTitle.textContent = currentResource.title;
    modalCategory.textContent = currentResource.category.toUpperCase();
    modalTime.innerHTML = `<i data-lucide="clock-3"></i>${currentResource.time}`;
    modalText.textContent = currentResource.text;

    saveRecent(
        currentResource.title,
        currentResource.category,
        currentResource.time
    );

    resourceModal.classList.add("show");
    renderPersonalResources();
    lucide.createIcons();
}

document.querySelectorAll(".resource-open").forEach(button => {
    button.addEventListener("click", () => {
        openResource(button);
    });
});

modalAction.addEventListener("click", async () => {
    if (!currentResource) return;
    const token = localStorage.getItem("campuswell_access_token");

    if (currentResource.resourceId && token) {
        try {
            const response = await fetch(`https://campuswell-api-dah4.onrender.com/api/v1/resources/${currentResource.resourceId}/save`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.detail || "Could not save resource.");
            showToast("Resource saved to your account.");
            await loadSavedResources();
        } catch (error) {
            showToast(error.message || "Could not save resource.");
            return;
        }
    } else {
        const saved = JSON.parse(localStorage.getItem("campuswell_saved_resources")) || [];
        const exists = saved.some(item => item.title === currentResource.title);
        if (!exists) {
            saved.push(currentResource);
            localStorage.setItem("campuswell_saved_resources", JSON.stringify(saved));
            showToast("Resource saved in this browser.");
        } else {
            showToast("This resource is already saved.");
        }
        renderPersonalResources();
    }
    closeResource();
});

function closeResource() {
    resourceModal.classList.remove("show");
}

function closeTool() {
    toolModal.classList.remove("show");

    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    breathingCircle.textContent = "3";
    toolStart.textContent = "Start Exercise";
}

modalClose.addEventListener("click", closeResource);
toolClose.addEventListener("click", closeTool);
modalOverlay.addEventListener("click", closeResource);
toolOverlay.addEventListener("click", closeTool);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeResource();
        closeTool();
    }
});

categoryFilters.forEach(button => {
    button.addEventListener("click", () => {
        categoryFilters.forEach(item => item.classList.remove("active"));
        button.classList.add("active");

        selectedCategory = button.dataset.category;
        filterResources();
    });
});

function filterResources() {
    const query = resourceSearch.value.trim().toLowerCase();
    let visible = 0;

    document.querySelectorAll(".resource-card").forEach(card => {
        const categoryMatch =
            selectedCategory === "all" ||
            card.dataset.category === selectedCategory;

        const textMatch = !query ||
            card.dataset.title.toLowerCase().includes(query) ||
            card.textContent.toLowerCase().includes(query);

        const show = categoryMatch && textMatch;

        card.style.display = show ? "flex" : "none";

        if (show) {
            visible++;
        }
    });

    resourceTotal.textContent = `${visible} resources`;
}

resourceSearch.addEventListener("input", filterResources);

document.querySelectorAll(".tool-item").forEach(tool => {
    tool.addEventListener("click", event => {
        event.preventDefault();

        const title = tool.dataset.tool;

        toolTitle.textContent = title;
        toolText.textContent = toolsContent[title];

        toolModal.classList.add("show");
        lucide.createIcons();
    });
});

toolStart.addEventListener("click", () => {
    if (toolTitle.textContent === "Breathing Exercise") {
        startBreathing();
        return;
    }

    if (toolTitle.textContent === "5-Minute Relaxation") {
        showToast("Relaxation exercise started.");
        toolStart.textContent = "Exercise Started";
        return;
    }

    if (toolTitle.textContent === "Sleep Check") {
        showToast("Sleep check coming next.");
        toolStart.textContent = "Check Started";
        return;
    }

    if (toolTitle.textContent === "Study Break Timer") {
        showToast("Study break started.");
        toolStart.textContent = "Break Started";
    }
});

function startBreathing() {
    let count = 3;

    toolStart.textContent = "Exercise Running";
    breathingCircle.textContent = count;

    if (timer) {
        clearInterval(timer);
    }

    timer = setInterval(() => {
        count--;

        if (count <= 0) {
            clearInterval(timer);
            timer = null;
            breathingCircle.textContent = "✓";
            toolStart.textContent = "Completed";
            showToast("Great job. Take one more calm breath.");
            return;
        }

        breathingCircle.textContent = count;
    }, 1000);
}

resourceTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        resourceTabs.forEach(item => item.classList.remove("active"));
        tab.classList.add("active");

        currentTab = tab.dataset.tab;
        renderPersonalResources();
    });
});

function renderPersonalResources() {
    const key =
        currentTab === "recent" ?
        "campuswell_recent_resources" :
        "campuswell_saved_resources";

    const items = JSON.parse(localStorage.getItem(key)) || [];

    if (!items.length) {
        personalResourceGrid.innerHTML = `
            <div class="personal-resource">
                <div class="personal-resource-icon">
                    <i data-lucide="book-open"></i>
                </div>
                <div>
                    <strong>${currentTab === "recent" ? "No recently viewed resources" : "No saved resources yet"}</strong>
                    <span>${currentTab === "recent" ? "Open a resource to see it here." : "Save useful resources for quick access later."}</span>
                </div>
            </div>
        `;

        lucide.createIcons();
        return;
    }

    personalResourceGrid.innerHTML = items.map(item => `
        <button type="button" class="personal-resource resource-history-item" data-title="${escapeResourceText(item.title)}" data-category="${escapeResourceText(item.category)}" data-time="${escapeResourceText(item.time)}" data-text="Explore this wellness resource and discover practical ways to support your wellbeing." data-resource-id="${item.id || ""}">
            <div class="personal-resource-icon">
                <i data-lucide="book-open"></i>
            </div>
            <div>
                <strong>${escapeResourceText(item.title)}</strong>
                <span><i data-lucide="clock-3"></i>${escapeResourceText(item.time)}</span>
            </div>
        </button>
    `).join("");

    document.querySelectorAll(".resource-history-item").forEach(button => {
        button.addEventListener("click", () => {
            openResource(button);
        });
    });

    lucide.createIcons();
}

document.querySelectorAll(".recommended-item.resource-open").forEach(button => {
    button.addEventListener("click", event => {
        event.preventDefault();
        openResource(button);
    });
});

renderPersonalResources();
filterResources();
lucide.createIcons();

async function loadSavedResources() {
    const token = localStorage.getItem("campuswell_access_token");
    if (!token) return;
    try {
        const response = await fetch("https://campuswell-api-dah4.onrender.com/api/v1/resources/saved", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) return;
        const resources = await response.json();
        const localItems = JSON.parse(localStorage.getItem("campuswell_saved_resources")) || [];
        const saved = resources.map(resource => ({
            id: resource.id,
            title: resource.title,
            category: resource.category || "Wellness",
            time: "Saved to account",
            text: resource.description || "Explore this wellness resource."
        }));
        saved.push(...localItems.filter(item => !item.id));
        localStorage.setItem("campuswell_saved_resources", JSON.stringify(saved));
        if (currentTab === "saved") renderPersonalResources();
    } catch (_) {
        // Keep locally saved items available if the API is offline.
    }
}

async function loadPublishedResources() {
    try {
        const response = await fetch("https://campuswell-api-dah4.onrender.com/api/v1/resources");
        if (!response.ok) return;
        const resources = await response.json();
        resources.forEach(resource => {
            if (document.querySelector(`.resource-card[data-api-resource="${resource.id}"]`)) return;
            const article = document.createElement("article");
            article.className = "resource-card";
            article.dataset.apiResource = resource.id;
            article.dataset.category = (resource.category || "other").toLowerCase().replace(/\\s+/g, "-");
            article.dataset.title = resource.title;
            const category = resource.category || "Wellness";
            article.innerHTML = `<div class="resource-icon blue"><i data-lucide="book-open"></i></div><span class="resource-category blue-text">${escapeResourceText(category.toUpperCase())}</span><h3>${escapeResourceText(resource.title)}</h3><p>${escapeResourceText(resource.description || "A CampusWell wellness resource.")}</p><div class="resource-card-bottom"><button type="button" class="read-button resource-open">Read <i data-lucide="arrow-right"></i></button></div>`;
            const button = article.querySelector(".resource-open");
            button.dataset.title = resource.title;
            button.dataset.category = category;
            button.dataset.time = "CampusWell resource";
            button.dataset.text = resource.description || "Explore this wellness resource.";
            button.dataset.resourceId = String(resource.id);
            button.addEventListener("click", () => openResource(button));
            resourceGrid.appendChild(article);
        });
        filterResources();
        lucide.createIcons();
    } catch (_) {
        // Keep the built-in collection available if the API is offline.
    }
}
function escapeResourceText(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
}
loadPublishedResources();
loadSavedResources();

const studentData = {
    priya: {
        name: "Priya Kapoor",
        id: "STU1024",
        initials: "PK",
        program: "B.Tech Computer Science · Year 2",
        date: "11 Oct 2026",
        time: "10:24 AM",
        mood: "Good",
        stress: 3,
        sleep: "Good",
        sleepScore: 4,
        energy: "Moderate",
        energyScore: 3,
        academics: "Manageable",
        support: "Not requested",
        comment: "I have had several assignments recently. I am trying to organise my study time and take regular breaks.",
        status: "pending",
        history: [
            ["08", "OCT", "Mood: Okay · Stress: 4/5", "Okay"],
            ["05", "OCT", "Mood: Good · Stress: 3/5", "Good"],
            ["01", "OCT", "Mood: Okay · Stress: 3/5", "Okay"]
        ]
    },
    rahul: {
        name: "Rahul Malik",
        id: "STU1087",
        initials: "RM",
        program: "B.Tech Mechanical · Year 3",
        date: "11 Oct 2026",
        time: "9:58 AM",
        mood: "Low",
        stress: 5,
        sleep: "Poor",
        sleepScore: 2,
        energy: "Very low",
        energyScore: 1,
        academics: "Difficult",
        support: "Requested",
        comment: "I have been feeling overwhelmed lately and would like to speak with a counsellor.",
        status: "support",
        history: [
            ["08", "OCT", "Mood: Low · Stress: 5/5", "Low"],
            ["04", "OCT", "Mood: Okay · Stress: 4/5", "Okay"],
            ["01", "OCT", "Mood: Low · Stress: 4/5", "Low"]
        ]
    },
    neha: {
        name: "Neha Singh",
        id: "STU1139",
        initials: "NS",
        program: "B.Com · Year 2",
        date: "11 Oct 2026",
        time: "9:15 AM",
        mood: "Okay",
        stress: 2,
        sleep: "Fair",
        sleepScore: 3,
        energy: "Moderate",
        energyScore: 3,
        academics: "Manageable",
        support: "Not requested",
        comment: "My sleep routine has been irregular, but I am trying to improve it.",
        status: "reviewed",
        history: [
            ["08", "OCT", "Mood: Okay · Stress: 3/5", "Okay"],
            ["05", "OCT", "Mood: Good · Stress: 2/5", "Good"],
            ["02", "OCT", "Mood: Okay · Stress: 3/5", "Okay"]
        ]
    },
    karan: {
        name: "Karan Verma",
        id: "STU1174",
        initials: "KV",
        program: "B.A. Economics · Year 2",
        date: "10 Oct 2026",
        time: "4:35 PM",
        mood: "Very good",
        stress: 1,
        sleep: "Very good",
        sleepScore: 5,
        energy: "High",
        energyScore: 5,
        academics: "Good",
        support: "Not requested",
        comment: "I have been managing my routine well and feel comfortable with my current workload.",
        status: "reviewed",
        history: [
            ["07", "OCT", "Mood: Good · Stress: 2/5", "Good"],
            ["04", "OCT", "Mood: Very good · Stress: 1/5", "Very good"],
            ["01", "OCT", "Mood: Good · Stress: 2/5", "Good"]
        ]
    },
    ishita: {
        name: "Ishita Sharma",
        id: "STU1211",
        initials: "IS",
        program: "B.Sc Psychology · Year 2",
        date: "10 Oct 2026",
        time: "3:42 PM",
        mood: "Low",
        stress: 4,
        sleep: "Poor",
        sleepScore: 2,
        energy: "Low",
        energyScore: 2,
        academics: "Difficult",
        support: "Not requested",
        comment: "I am finding it difficult to adjust to campus life and maintain a regular routine.",
        status: "pending",
        history: [
            ["07", "OCT", "Mood: Low · Stress: 4/5", "Low"],
            ["04", "OCT", "Mood: Okay · Stress: 3/5", "Okay"],
            ["01", "OCT", "Mood: Low · Stress: 4/5", "Low"]
        ]
    },
    mohit: {
        name: "Mohit Kumar",
        id: "STU1228",
        initials: "MK",
        program: "B.Com · Year 2",
        date: "10 Oct 2026",
        time: "2:20 PM",
        mood: "Very low",
        stress: 5,
        sleep: "Poor",
        sleepScore: 1,
        energy: "Very low",
        energyScore: 1,
        academics: "Difficult",
        support: "Requested",
        comment: "Financial concerns have been affecting my sleep and concentration. I would appreciate guidance.",
        status: "support",
        history: [
            ["07", "OCT", "Mood: Very low · Stress: 5/5", "Very low"],
            ["04", "OCT", "Mood: Low · Stress: 4/5", "Low"],
            ["01", "OCT", "Mood: Low · Stress: 4/5", "Low"]
        ]
    }
};

const studentKey = new URLSearchParams(window.location.search).get("student") || "priya";
const student = studentData[studentKey] || studentData.priya;

const storageKey = `campuswell-wellness-${student.id}`;
const savedData = readSavedData();

const statusLabels = {
    pending: "Pending Review",
    reviewed: "Reviewed",
    support: "Support Requested",
    followup: "Follow-up Planned"
};

const statusClasses = {
    pending: "pending",
    reviewed: "reviewed",
    support: "support",
    followup: "followup"
};

const moodClasses = {
    "Very good": "mood-very-good",
    Good: "mood-good",
    Okay: "mood-okay",
    Low: "mood-low",
    "Very low": "mood-very-low"
};

function readSavedData() {
    try {
        return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch {
        return {};
    }
}

function saveStoredData(data) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        return true;
    } catch {
        showToast("Unable to save in this browser.");
        return false;
    }
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function updateStressScale(value) {
    const scale = document.getElementById("stressScale");

    if (!scale) {
        return;
    }

    scale.querySelectorAll("i").forEach((dot, index) => {
        dot.classList.toggle("filled", index < value);
    });
}

function updateRatingBar(id, value, maximum = 5) {
    const element = document.getElementById(id);

    if (element) {
        element.style.width = `${(value / maximum) * 100}%`;
    }
}

function renderHistory() {
    const historyContainer = document.getElementById("studentHistory");

    if (!historyContainer) {
        return;
    }

    historyContainer.replaceChildren();

    student.history.forEach(item => {
        const row = document.createElement("div");
        row.className = "history-item";

        const date = document.createElement("div");
        date.className = "history-date";

        const day = document.createElement("strong");
        day.textContent = item[0];

        const month = document.createElement("span");
        month.textContent = item[1];

        date.append(day, month);

        const description = document.createElement("div");
        description.className = "history-description";

        const heading = document.createElement("strong");
        heading.textContent = "Previous check-in";

        const detail = document.createElement("span");
        detail.textContent = item[2];

        description.append(heading, detail);

        const mood = document.createElement("span");
        mood.className = `history-mood ${item[3] === "Good" ? "mood-history-good" : "mood-history-okay"}`;
        mood.textContent = item[3];

        row.append(date, description, mood);
        historyContainer.appendChild(row);
    });
}

function renderStudent() {
    setText("studentAvatar", student.initials);
    setText("studentName", student.name);
    setText("studentId", student.id);
    setText("studentProgram", student.program);
    setText("checkinDate", student.date);
    setText("checkinTime", student.time);
    setText("studentMood", student.mood);
    setText("studentStress", student.stress);
    setText("studentSleep", student.sleep);
    setText("studentEnergy", student.energy);
    setText("studentAcademics", student.academics);
    setText("studentSupport", student.support);
    setText("studentComment", student.comment);
    setText("summaryMood", student.mood);
    setText("summaryStress", `${student.stress}/5`);
    setText("summarySleep", `${student.sleepScore}/5`);
    setText("summaryEnergy", `${student.energyScore}/5`);

    const status = savedData.status || student.status;
    const statusElement = document.getElementById("checkinStatus");
    const statusSelect = document.getElementById("reviewStatus");

    if (statusElement) {
        statusElement.textContent = statusLabels[status] || statusLabels.pending;
        statusElement.className = `profile-status status-${statusClasses[status] || "pending"}`;
    }

    if (statusSelect) {
        statusSelect.value = status;
    }

    updateStressScale(student.stress);
    updateRatingBar("stressBar", student.stress);
    updateRatingBar("sleepBar", student.sleepScore);
    updateRatingBar("energyBar", student.energyScore);

    const moodElement = document.getElementById("studentMood");

    if (moodElement) {
        moodElement.className = moodClasses[student.mood] || "";
    }

    const notes = document.getElementById("counsellorNotes");

    if (notes) {
        notes.value = savedData.notes || "";
    }

    setText("notesStatus", savedData.notes ? "Saved in this browser" : "Not saved");

    renderHistory();
}

function showToast(message) {
    const toast = document.getElementById("notificationToast");
    const toastMessage = document.getElementById("toastMessage");

    if (!toast || !toastMessage) {
        window.alert(message);
        return;
    }

    toastMessage.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(showToast.timeout);

    showToast.timeout = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

function updateStatus() {
    const statusSelect = document.getElementById("reviewStatus");

    if (!statusSelect) {
        return;
    }

    const status = statusSelect.value;
    savedData.status = status;

    if (!saveStoredData(savedData)) {
        return;
    }

    renderStudent();
    showToast(`Status updated: ${statusLabels[status]}.`);
}

const statusSelect = document.getElementById("reviewStatus");

if (statusSelect) {
    statusSelect.addEventListener("change", updateStatus);
}

const markReviewed = document.getElementById("markReviewed");

if (markReviewed) {
    markReviewed.addEventListener("click", () => {
        if (statusSelect) {
            statusSelect.value = "reviewed";
        }

        updateStatus();
    });
}

const saveNotes = document.getElementById("saveNotes");

if (saveNotes) {
    saveNotes.addEventListener("click", () => {
        const notes = document.getElementById("counsellorNotes");

        if (!notes || !notes.value.trim()) {
            showToast("Enter a note before saving.");
            return;
        }

        savedData.notes = notes.value.trim();

        if (saveStoredData(savedData)) {
            setText("notesStatus", "Saved in this browser");
            showToast("Counsellor note saved in this browser.");
        }
    });
}

const detailSearch = document.getElementById("detailSearch");

if (detailSearch) {
    detailSearch.addEventListener("input", () => {
        const query = detailSearch.value.trim().toLowerCase();
        const sections = [
            document.querySelector(".student-profile-panel"),
            document.querySelector(".responses-panel"),
            document.querySelector(".history-panel"),
            ...document.querySelectorAll(".details-side-column .panel")
        ].filter(Boolean);

        let matches = 0;

        sections.forEach(section => {
            const visible = section.textContent.toLowerCase().includes(query);

            section.style.display = visible ? "" : "none";

            if (visible) {
                matches++;
            }
        });

        let message = document.getElementById("detailSearchMessage");

        if (!message) {
            message = document.createElement("div");
            message.id = "detailSearchMessage";
            message.style.padding = "20px";
            message.style.marginBottom = "18px";
            message.style.border = "1px solid #e2eaf3";
            message.style.borderRadius = "12px";
            message.style.background = "#ffffff";
            message.style.color = "#7a8ba0";
            message.style.textAlign = "center";

            document.querySelector(".details-layout").prepend(message);
        }

        message.textContent = "No matching sections found.";
        message.style.display = matches === 0 ? "block" : "none";
    });
}

const profileMore = document.getElementById("profileMore");

if (profileMore) {
    profileMore.addEventListener("click", () => {
        showToast("Student record options are not connected yet.");
    });
}

const notificationButton = document.getElementById("notificationButton");

if (notificationButton) {
    notificationButton.addEventListener("click", () => {
        showToast("You have 3 unread notifications.");
    });
}

const supportButton = document.getElementById("supportButton");

if (supportButton) {
    supportButton.addEventListener("click", event => {
        event.preventDefault();
        showToast("Contact CampusWell administration for portal support.");
    });
}

document.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showToast(`${link.dataset.page} will be connected in a future step.`);
    });
});

renderStudent();

if (window.lucide) {
    lucide.createIcons();
}
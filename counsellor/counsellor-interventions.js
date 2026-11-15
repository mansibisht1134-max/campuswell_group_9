(() => {
    const storageKey = "campuswellInterventionsV1";
    const metricStorageKey = "campuswellInterventionMetricsV1";
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const today = new Date();
    const localDate = (date) => {
        const offset = date.getTimezoneOffset();
        return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
    };
    const plusDays = (count) => {
        const result = new Date();
        result.setDate(result.getDate() + count);
        return localDate(result);
    };

    const demoPlans = [
        {
            id: "CW-INT-001",
            studentName: "Aarav Mehta",
            studentId: "STU1032",
            initials: "AM",
            avatarColor: "blue",
            interventionTitle: "Stress Management",
            type: "Individual Counselling",
            counsellor: "Dr. Sharma",
            startDate: "2026-09-10",
            targetDate: "2026-11-10",
            nextAction: "Follow-up Session",
            nextActionDate: "2026-10-20",
            status: "Active",
            priority: "Medium",
            progress: 70,
            goals: "Reduce academic stress and build healthy coping strategies.",
            actionPlan: "Attend individual counselling sessions, practice breathing exercises and review coping strategies during follow-up.",
            notes: "Student reports gradual improvement and is continuing the agreed coping activities."
        },
        {
            id: "CW-INT-002",
            studentName: "Simran Kaur",
            studentId: "STU1056",
            initials: "SK",
            avatarColor: "purple",
            interventionTitle: "Academic Anxiety",
            type: "Academic Support",
            counsellor: "Dr. Mehta",
            startDate: "2026-09-15",
            targetDate: "2026-11-15",
            nextAction: "Progress Review",
            nextActionDate: "2026-10-25",
            status: "Needs Review",
            priority: "High",
            progress: 45,
            goals: "Develop a manageable study plan and reduce anxiety around assessments.",
            actionPlan: "Review weekly study structure, identify barriers and practice grounding techniques ahead of exams.",
            notes: "Review the student's experience of the study plan and decide whether adjustments are needed."
        },
        {
            id: "CW-INT-003",
            studentName: "Rohan Singh",
            studentId: "STU1203",
            initials: "RS",
            avatarColor: "green",
            interventionTitle: "Wellbeing & Resilience",
            type: "Group Workshop",
            counsellor: "Dr. Sharma",
            startDate: "2026-10-05",
            targetDate: "2026-11-05",
            nextAction: "Workshop Session",
            nextActionDate: "2026-10-12",
            status: "Planned",
            priority: "Low",
            progress: 20,
            goals: "Build resilience skills and identify healthy ways to manage everyday pressure.",
            actionPlan: "Attend the wellbeing workshop and complete the reflection activity afterwards.",
            notes: "Workshop registration recorded."
        }
    ];

    const readStorage = (key, fallback) => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : fallback;
        } catch {
            return fallback;
        }
    };

    let plans = readStorage(storageKey, demoPlans);
    if (!Array.isArray(plans)) plans = demoPlans;
    let metrics = readStorage(metricStorageKey, { totalDelta: 0, studentDelta: 0, reviewDelta: 0, goalDelta: 0 });
    if (!metrics || typeof metrics !== "object") metrics = { totalDelta: 0, studentDelta: 0, reviewDelta: 0, goalDelta: 0 };
    let toastTimer;

    const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));

    const formatDate = (value) => {
        if (!value) return "Not set";
        const parsed = new Date(`${value}T12:00:00`);
        if (Number.isNaN(parsed.getTime())) return value;
        return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
    };

    const initialsFor = (name = "Student") => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "ST";

    const statusClass = (status) => ({
        "Active": "active",
        "Needs Review": "needs-review",
        "Planned": "planned",
        "On Hold": "on-hold",
        "Completed": "completed",
        "Cancelled": "cancelled"
    }[status] || "planned");

    const avatarClass = (plan) => plan.avatarColor || ({ "Completed": "green", "Needs Review": "purple", "Planned": "green" }[plan.status] || "blue");

    const persist = () => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(plans));
            localStorage.setItem(metricStorageKey, JSON.stringify(metrics));
        } catch {
            showToast("Changes are available in this session but could not be saved in this browser.");
        }
    };

    const showToast = (message) => {
        const toast = $("#toast");
        toast.textContent = message;
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
    };

    const renderMetrics = () => {
        $("#totalPlans").textContent = Math.max(0, 42 + Number(metrics.totalDelta || 0));
        $("#studentsSupported").textContent = Math.max(0, 35 + Number(metrics.studentDelta || 0));
        $("#goalsAchieved").textContent = `${Math.max(0, Math.min(100, 76 + Number(metrics.goalDelta || 0)))}%`;
        $("#plansReview").textContent = Math.max(0, 6 + Number(metrics.reviewDelta || 0));
    };

    const getFilteredPlans = () => {
        const searches = [$("#planSearch").value, $("#globalSearch").value].map((value) => value.trim().toLowerCase()).filter(Boolean);
        const type = $("#typeFilter").value;
        const status = $("#statusFilter").value;
        const priority = $("#priorityFilter").value;
        const from = $("#dateFrom").value;
        const to = $("#dateTo").value;

        return plans.filter((plan) => {
            const haystack = [plan.studentName, plan.studentId, plan.interventionTitle, plan.type, plan.counsellor, plan.nextAction].join(" ").toLowerCase();
            const matchesSearch = searches.length === 0 || searches.some((search) => haystack.includes(search));
            const matchesType = type === "all" || plan.type === type || plan.interventionTitle === type;
            const matchesStatus = status === "all" || plan.status === status;
            const matchesPriority = priority === "all" || plan.priority === priority;
            const matchesFrom = !from || !plan.startDate || plan.startDate >= from;
            const matchesTo = !to || !plan.startDate || plan.startDate <= to;
            return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesFrom && matchesTo;
        });
    };

    const renderPlan = (plan) => {
        const progress = Math.max(0, Math.min(100, Number(plan.progress) || 0));
        const progressClass = progress >= 75 ? "green" : (plan.status === "Needs Review" ? "orange" : "");
        const id = escapeHtml(plan.id);
        return `
            <article class="plan-row" data-plan-id="${id}">
                <div class="student-cell">
                    <div class="student-avatar ${escapeHtml(avatarClass(plan))}">${escapeHtml(plan.initials || initialsFor(plan.studentName))}</div>
                    <div class="student-meta"><h3>${escapeHtml(plan.studentName)}</h3><p>ID: ${escapeHtml(plan.studentId || "Not supplied")}</p></div>
                </div>
                <div class="plan-data-cell"><span>Intervention Type</span><strong>${escapeHtml(plan.interventionTitle || plan.type)}</strong><small>${escapeHtml(plan.type)}</small><div class="progress-cell"><span>Goal Progress: ${progress}%</span><div class="progress-track" role="progressbar" aria-label="Goal progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-fill ${progressClass}" style="width:${progress}%"></div></div></div></div>
                <div class="plan-data-cell"><span>Assigned Counsellor</span><strong>${escapeHtml(plan.counsellor || "Not assigned")}</strong><small>Priority: ${escapeHtml(plan.priority || "Medium")}</small></div>
                <div class="plan-data-cell"><span>Start Date</span><strong>${escapeHtml(formatDate(plan.startDate))}</strong><small>Target: ${escapeHtml(formatDate(plan.targetDate))}</small></div>
                <div class="plan-data-cell"><span>Next Action</span><strong>${escapeHtml(plan.nextAction || "Review plan")}</strong><small>${escapeHtml(formatDate(plan.nextActionDate))}</small></div>
                <div class="plan-actions">
                    <div class="plan-actions-top"><span class="status-pill ${statusClass(plan.status)}">${escapeHtml(plan.status || "Planned")}</span><div class="menu-wrap"><button class="menu-button" type="button" data-action="menu" aria-label="More actions for ${escapeHtml(plan.studentName)}" aria-expanded="false"><i data-lucide="more-vertical"></i></button><div class="menu-popover"><button type="button" data-action="edit">Edit plan</button><button type="button" data-action="review">Mark for review</button><button type="button" data-action="complete">Mark completed</button><button type="button" class="danger" data-action="delete">Delete plan</button></div></div></div>
                    <button class="view-edit-button" type="button" data-action="edit"><i data-lucide="eye"></i><span>View / Edit</span></button>
                </div>
            </article>`;
    };

    const renderPlans = () => {
        const filtered = getFilteredPlans();
        $("#plansList").innerHTML = filtered.map(renderPlan).join("");
        $("#emptyState").hidden = filtered.length > 0;
        $("#plansList").hidden = filtered.length === 0;
        $("#planCount").textContent = `${filtered.length} ${filtered.length === 1 ? "plan" : "plans"}`;
        $("#visibleCount").textContent = `Showing ${filtered.length} of ${plans.length} plans`;
        if (window.lucide) window.lucide.createIcons();
    };

    const renderAll = () => {
        renderMetrics();
        renderPlans();
    };

    const closeMenus = (except = null) => {
        $$(".menu-wrap.open").forEach((menu) => {
            if (menu !== except) {
                menu.classList.remove("open");
                const button = $("[data-action='menu']", menu);
                if (button) button.setAttribute("aria-expanded", "false");
            }
        });
    };

    const modal = $("#planModal");
    const form = $("#planForm");
    const setValue = (id, value) => {
        const field = $(`#${id}`);
        if (field) field.value = value ?? "";
    };

    const resetForm = () => {
        form.reset();
        setValue("planId", "");
        setValue("startDate", localDate(today));
        setValue("targetDate", plusDays(30));
        setValue("nextActionDate", plusDays(7));
        setValue("assignedCounsellor", "Dr. Sharma");
        setValue("planPriority", "Medium");
        setValue("planStatus", "Planned");
        setValue("goalProgress", 0);
        $("#modalTitle").textContent = "Create Intervention Plan";
        $("#saveButtonText").textContent = "Save Intervention";
        $("#formError").hidden = true;
    };

    const openModal = (plan = null) => {
        resetForm();
        if (plan) {
            setValue("planId", plan.id);
            setValue("studentName", plan.studentName);
            setValue("studentId", plan.studentId);
            setValue("interventionTitle", plan.interventionTitle);
            setValue("interventionType", plan.type);
            setValue("assignedCounsellor", plan.counsellor);
            setValue("planPriority", plan.priority || "Medium");
            setValue("planStatus", plan.status || "Planned");
            setValue("startDate", plan.startDate);
            setValue("targetDate", plan.targetDate);
            setValue("nextAction", plan.nextAction);
            setValue("nextActionDate", plan.nextActionDate);
            setValue("supportGoals", plan.goals);
            setValue("actionPlan", plan.actionPlan);
            setValue("goalProgress", plan.progress);
            setValue("progressNotes", plan.notes);
            $("#modalTitle").textContent = "View / Edit Intervention";
            $("#saveButtonText").textContent = "Save Changes";
        }
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        window.setTimeout(() => $("#studentName").focus(), 30);
    };

    const closeModal = () => {
        modal.hidden = true;
        document.body.style.overflow = "";
        $("#createPlanButton").focus();
    };

    const adjustStatusMetrics = (oldStatus, newStatus) => {
        if (oldStatus === "Needs Review") metrics.reviewDelta = Number(metrics.reviewDelta || 0) - 1;
        if (newStatus === "Needs Review") metrics.reviewDelta = Number(metrics.reviewDelta || 0) + 1;
        if (newStatus === "Completed" && oldStatus !== "Completed") metrics.goalDelta = Number(metrics.goalDelta || 0) + 1;
        if (oldStatus === "Completed" && newStatus !== "Completed") metrics.goalDelta = Number(metrics.goalDelta || 0) - 1;
    };

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const error = $("#formError");
        const studentName = $("#studentName").value.trim();
        const title = $("#interventionTitle").value.trim();
        const type = $("#interventionType").value;
        const counsellor = $("#assignedCounsellor").value.trim();
        const startDate = $("#startDate").value;
        const targetDate = $("#targetDate").value;
        const oldId = $("#planId").value;
        const oldPlan = plans.find((plan) => plan.id === oldId);

        if (!studentName || !title || !type || !counsellor || !startDate) {
            error.textContent = "Please complete all required fields before saving.";
            error.hidden = false;
            return;
        }
        if (targetDate && startDate && targetDate < startDate) {
            error.textContent = "Target completion date should be on or after the start date.";
            error.hidden = false;
            return;
        }

        error.hidden = true;
        const nextPlan = {
            id: oldId || `CW-INT-${Date.now()}`,
            studentName,
            studentId: $("#studentId").value.trim(),
            initials: initialsFor(studentName),
            interventionTitle: title,
            type,
            counsellor,
            priority: $("#planPriority").value,
            status: $("#planStatus").value,
            startDate,
            targetDate,
            nextAction: $("#nextAction").value.trim() || "Review plan",
            nextActionDate: $("#nextActionDate").value,
            goals: $("#supportGoals").value.trim(),
            actionPlan: $("#actionPlan").value.trim(),
            progress: Math.max(0, Math.min(100, Number($("#goalProgress").value) || 0)),
            notes: $("#progressNotes").value.trim(),
            avatarColor: oldPlan?.avatarColor || ["blue", "purple", "green", "orange"][plans.length % 4]
        };

        if (oldPlan) {
            if (oldPlan.status !== nextPlan.status) adjustStatusMetrics(oldPlan.status, nextPlan.status);
            Object.assign(oldPlan, nextPlan);
            showToast("Intervention plan updated.");
        } else {
            plans.unshift(nextPlan);
            metrics.totalDelta = Number(metrics.totalDelta || 0) + 1;
            const alreadySupported = plans.some((plan) => plan.id !== nextPlan.id && ((nextPlan.studentId && String(plan.studentId || "").toLowerCase() === nextPlan.studentId.toLowerCase()) || String(plan.studentName || "").toLowerCase() === nextPlan.studentName.toLowerCase()));
            if (!alreadySupported) metrics.studentDelta = Number(metrics.studentDelta || 0) + 1;
            if (nextPlan.status === "Needs Review") metrics.reviewDelta = Number(metrics.reviewDelta || 0) + 1;
            if (nextPlan.status === "Completed") metrics.goalDelta = Number(metrics.goalDelta || 0) + 1;
            showToast("New intervention plan created.");
        }

        persist();
        renderAll();
        closeModal();
    });

    const findPlan = (row) => plans.find((plan) => plan.id === row?.dataset.planId);

    $("#plansList").addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-action]");
        if (!actionButton) return;
        const row = actionButton.closest(".plan-row");
        const plan = findPlan(row);
        if (!plan) return;
        const action = actionButton.dataset.action;

        if (action === "menu") {
            const menu = actionButton.closest(".menu-wrap");
            const opening = !menu.classList.contains("open");
            closeMenus(menu);
            menu.classList.toggle("open", opening);
            actionButton.setAttribute("aria-expanded", String(opening));
            return;
        }
        closeMenus();

        if (action === "edit") {
            openModal(plan);
            return;
        }
        if (action === "review") {
            if (plan.status !== "Needs Review") adjustStatusMetrics(plan.status, "Needs Review");
            plan.status = "Needs Review";
            persist();
            renderAll();
            showToast(`${plan.studentName}'s plan was marked for review.`);
            return;
        }
        if (action === "complete") {
            if (plan.status !== "Completed") adjustStatusMetrics(plan.status, "Completed");
            plan.status = "Completed";
            plan.progress = 100;
            persist();
            renderAll();
            showToast(`${plan.studentName}'s intervention was marked completed.`);
            return;
        }
        if (action === "delete") {
            const confirmed = window.confirm(`Delete the intervention plan for ${plan.studentName}? This cannot be undone.`);
            if (!confirmed) return;
            if (plan.status === "Needs Review") metrics.reviewDelta = Number(metrics.reviewDelta || 0) - 1;
            if (plan.status === "Completed") metrics.goalDelta = Number(metrics.goalDelta || 0) - 1;
            metrics.totalDelta = Number(metrics.totalDelta || 0) - 1;
            plans = plans.filter((item) => item.id !== plan.id);
            persist();
            renderAll();
            showToast("Intervention plan deleted.");
        }
    });

    const resetFilters = () => {
        $("#planSearch").value = "";
        $("#globalSearch").value = "";
        $("#typeFilter").value = "all";
        $("#statusFilter").value = "all";
        $("#priorityFilter").value = "all";
        $("#dateFrom").value = "";
        $("#dateTo").value = "";
        renderPlans();
    };

    ["#planSearch", "#globalSearch"].forEach((selector) => $(selector).addEventListener("input", renderPlans));
    ["#typeFilter", "#statusFilter", "#priorityFilter", "#dateFrom", "#dateTo"].forEach((selector) => $(selector).addEventListener("change", renderPlans));
    $("#resetFilters").addEventListener("click", resetFilters);
    $("#clearEmptyFilters").addEventListener("click", resetFilters);
    $("#createPlanButton").addEventListener("click", () => openModal());
    $("#closeModalButton").addEventListener("click", closeModal);
    $("#cancelModalButton").addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".menu-wrap")) closeMenus();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (!modal.hidden) closeModal();
            closeMenus();
        }
    });

    $("#notificationButton").addEventListener("click", () => showToast("Notifications will be connected when the backend is added."));

    $$('[data-placeholder]').forEach((link) => link.addEventListener("click", (event) => {
        event.preventDefault();
        showToast(`${link.dataset.placeholder} is not part of this prototype screen yet.`);
    }));

    renderAll();
    if (window.lucide) window.lucide.createIcons();
})();

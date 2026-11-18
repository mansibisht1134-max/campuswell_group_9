const API = "https://campuswell-api-dah4.onrender.com/api/v1";
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalClose = document.getElementById("modalClose");
const modalButton = document.getElementById("modalButton");
const modalActions = document.getElementById("modalActions");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const priorityFilter = document.getElementById("priorityFilter");
const requestList = document.getElementById("requestList");
let requests = [];
let selectedId = null;
let draftText = "";

function openModal(title, text, actions = []) {
    modalTitle.textContent = title;
    modalText.textContent = text;
    modalActions.innerHTML = "";
    actions.forEach(action => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = action.label;
        button.addEventListener("click", action.onClick);
        modalActions.appendChild(button);
    });
    modal.classList.add("show");
    if (window.lucide) lucide.createIcons();
}
function closeModal() { modal.classList.remove("show"); }
function token() { return localStorage.getItem("campuswell_access_token"); }
function statusLabel(value) {
    return ({ Open:"New", "In Progress":"In Review", Resolved:"Resolved", Closed:"Closed" })[value] || value;
}
function statusKey(value) {
    return ({ Open:"new", "In Progress":"review", Resolved:"resolved", Closed:"resolved" })[value] || "new";
}
function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]);
}
function selectedRequest() { return requests.find(item => item.id === selectedId); }
function updateSummary() {
    const counts = {
        new: requests.filter(x => x.status === "Open").length,
        review: requests.filter(x => x.status === "In Progress").length,
        urgent: requests.filter(x => x.priority === "Urgent").length,
        resolved: requests.filter(x => ["Resolved","Closed"].includes(x.status)).length
    };
    const cards = document.querySelectorAll(".summary-card strong");
    [counts.new, counts.review, counts.urgent, counts.resolved].forEach((n,i) => { if(cards[i]) cards[i].textContent=n; });
    const badge = document.querySelector(".notification-count");
    if (badge) badge.textContent = counts.new + counts.urgent;
}
function renderList() {
    const query = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const priority = priorityFilter.value;
    const filter = document.querySelector(".tab.active")?.dataset.filter || "all";
    const visible = requests.filter(r => {
        const text = `${r.title} ${r.category} ${r.message} ${r.student_id}`.toLowerCase();
        const matchesCategory = category === "all" || r.category.toLowerCase().includes(category);
        const matchesPriority = priority === "all" || r.priority.toLowerCase() === priority;
        const matchesTab = filter === "all" ||
            (filter === "new" && r.status === "Open") ||
            (filter === "review" && r.status === "In Progress") ||
            (filter === "resolved" && ["Resolved","Closed"].includes(r.status)) ||
            (filter === "waiting" && r.status === "Open") ||
            (filter === "urgent" && r.priority === "Urgent");
        return text.includes(query) && matchesCategory && matchesPriority && matchesTab;
    });
    document.getElementById("resultCount").textContent = `${visible.length} request${visible.length===1?"":"s"}`;
    requestList.innerHTML = "";
    if (!visible.length) {
        requestList.innerHTML = '<div class="request-card"><p>No assigned support requests found.</p><small>New requests appear here after an administrator assigns them to your counsellor account.</small></div>';
        return;
    }
    visible.forEach(r => {
        const card = document.createElement("article");
        const initials = "S" + r.student_id;
        const key = statusKey(r.status);
        card.className = "request-card" + (r.id === selectedId ? " selected" : "");
        card.dataset.id = r.id;
        card.innerHTML = `
            <div class="request-top"><div class="student-info"><div class="student-avatar">${safe(initials)}</div><div><h3>Student #${r.student_id}</h3><span>Student ID: ${r.student_id}</span></div></div>
            <div class="request-badges"><span class="status ${key}">${safe(statusLabel(r.status))}</span><span class="priority ${safe(r.priority.toLowerCase())}">${safe(r.priority)}</span></div></div>
            <div class="request-category"><strong>${safe(r.category)}</strong></div><p class="request-message">${safe(r.title)} — ${safe(r.message)}</p>
            <div class="request-meta"><span>${new Date(r.created_at).toLocaleString()}</span><span>Request #${r.id}</span></div>
            <div class="request-footer"><span class="request-label">${safe(statusLabel(r.status))}</span><button class="review-button" type="button">Review Request →</button></div>`;
        card.addEventListener("click", () => selectRequest(r.id));
        card.querySelector("button").addEventListener("click", e => { e.stopPropagation(); selectRequest(r.id); });
        requestList.appendChild(card);
    });
}
function selectRequest(id) {
    selectedId = id;
    const r = selectedRequest();
    if (!r) return;
    document.getElementById("selectedName").textContent = `Student #${r.student_id}`;
    document.getElementById("selectedStudentId").textContent = `Student record · Request #${r.id}`;
    document.getElementById("recordAvatar").textContent = `S${r.student_id}`;
    document.getElementById("recordName").textContent = `Student #${r.student_id}`;
    document.getElementById("recordCategory").textContent = r.category;
    document.getElementById("detailCategory").textContent = r.category;
    const p = document.getElementById("detailPriority");
    p.textContent = r.priority; p.className = "priority " + r.priority.toLowerCase();
    document.getElementById("detailStatus").textContent = statusLabel(r.status);
    document.getElementById("selectedMessage").textContent = r.title + "\n\n" + r.message;
    document.getElementById("detailsPanel").style.display = "";
    renderList();
}
async function updateStatus(status) {
    const r = selectedRequest();
    if (!r) return;
    try {
        const response = await fetch(`${API}/support/requests/${r.id}`, {
            method:"PATCH",
            headers:{"Content-Type":"application/json",Authorization:`Bearer ${token()}`},
            body:JSON.stringify({status})
        });
        const data = await response.json().catch(()=>({}));
        if (!response.ok) throw new Error(data.detail || "Could not update request.");
        Object.assign(r,data);
        selectRequest(r.id);
        openModal("Request updated", `Request #${r.id} is now ${statusLabel(r.status)}.`);
    } catch(e) { openModal("Update failed",e.message); }
}
async function loadRequests() {
    if (!token()) { requestList.innerHTML="<p>Please sign in with your counsellor account.</p>"; return; }
    try {
        const response=await fetch(`${API}/support/requests`,{headers:{Authorization:`Bearer ${token()}`}});
        if(response.status===401){localStorage.removeItem("campuswell_access_token");requestList.innerHTML="<p>Session expired. Please sign in again.</p>";return;}
        if(!response.ok) throw new Error("Unable to load assigned requests.");
        requests=await response.json();
        selectedId=requests[0]?.id ?? null;
        updateSummary(); renderList();
        if(selectedId!==null) selectRequest(selectedId);
        else document.getElementById("detailsPanel").style.display="none";
    } catch(e) { requestList.innerHTML=`<p>${safe(e.message)}</p>`; }
}
document.querySelectorAll(".tab").forEach(tab=>tab.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    tab.classList.add("active");renderList();
}));
searchInput.addEventListener("input",renderList);
categoryFilter.addEventListener("change",renderList);
priorityFilter.addEventListener("change",renderList);
document.getElementById("closeDetails").addEventListener("click",()=>document.getElementById("detailsPanel").style.display="none");
document.getElementById("saveDraft").addEventListener("click",()=>{
    draftText=document.getElementById("responseBox").value.trim();
    openModal(draftText?"Draft saved in this browser session":"Empty draft","Counsellor messaging is not yet available in the backend; this saves text locally only.");
});
document.getElementById("sendResponse").addEventListener("click",()=>{
    openModal("Messaging not enabled","The current backend has no counsellor-to-student message endpoint yet. You can update the request workflow status below.");
});
document.getElementById("appointmentAction").addEventListener("click",()=>window.location.assign("counsellor-appointments.html"));
document.getElementById("conversationAction").addEventListener("click",()=>openModal("Messaging not enabled","Student conversation messaging is not yet available in the backend."));
document.getElementById("reviewAction").addEventListener("click",()=>updateStatus("In Progress"));
document.getElementById("closeRequest").addEventListener("click",()=>updateStatus("Resolved"));
document.getElementById("notificationButton").addEventListener("click",()=>openModal("Notifications","Open the notifications page to view updates."));
document.getElementById("supportButton").addEventListener("click",e=>{e.preventDefault();openModal("CampusWell Support","Contact CampusWell administration for portal support.");});
document.querySelectorAll("[data-page]").forEach(link=>link.addEventListener("click",e=>{e.preventDefault();openModal(link.dataset.page,"This section is being connected to the backend.");}));
modalClose.addEventListener("click",closeModal);modalButton.addEventListener("click",closeModal);
modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
loadRequests();
if(window.lucide)lucide.createIcons();

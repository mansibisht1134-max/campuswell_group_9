(() => {
  const API = "https://campuswell-api-dah4.onrender.com/api/v1";
  const token = localStorage.getItem("campuswell_access_token");
  const $ = id => document.getElementById(id);
  const list = $("requestList"), details = $("detailsPanel");
  const categoryFilter = $("categoryFilter"), priorityFilter = $("priorityFilter");
  let requests = [], selected = null;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const title = value => String(value || "").replace(/\b\w/g, c => c.toUpperCase());
  const categoryName = value => value || "General";
  const priorityClass = value => String(value || "Normal").toLowerCase();
  const statusName = value => value === "Open" ? "New" : value === "In Progress" ? "In Review" : value;
  async function api(path, options = {}) {
    const response = await fetch(API + path, { ...options, headers: { ...(options.headers || {}), Authorization: "Bearer " + token } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "Request failed");
    return data;
  }
  function filtered() {
    const tab = document.querySelector(".request-tab.active, .tab.active")?.dataset.filter || "all";
    const cat = categoryFilter?.value || "all", priority = priorityFilter?.value || "all";
    return requests.filter(item => {
      const status = String(item.status || "Open");
      const catText = String(item.category || "").toLowerCase();
      const catMatch = cat === "all" || catText.includes(cat) || (cat === "academic" && catText.includes("academic")) || (cat === "stress" && catText.includes("stress")) || (cat === "personal" && catText.includes("personal")) || (cat === "financial" && catText.includes("financial"));
      const priMatch = priority === "all" || priorityClass(item.priority) === priority;
      const tabMatch = tab === "all" || tab === "new" ? (tab === "all" || status === "Open") :
        tab === "urgent" ? ["High","Urgent"].includes(item.priority) :
        tab === "review" ? status === "In Progress" :
        tab === "waiting" ? status === "Open" :
        tab === "resolved" ? ["Resolved","Closed"].includes(status) : true;
      return catMatch && priMatch && tabMatch;
    });
  }
  function render() {
    if (!list) return;
    const items = filtered();
    $("resultCount").textContent = items.length + " requests";
    if (!items.length) { list.innerHTML = '<div class="empty-state">No matching support requests.</div>'; return; }
    list.innerHTML = items.map(item => {
      const active = selected && selected.id === item.id ? " selected" : "";
      return '<article class="request-card'+active+'" data-id="'+item.id+'"><div class="request-top"><div class="student-info"><div class="student-avatar">ST</div><div><h3>Student #'+item.student_id+'</h3><span>Student ID: '+item.student_id+'</span></div></div><div class="request-badges"><span class="status">'+esc(statusName(item.status))+'</span><span class="priority '+priorityClass(item.priority)+'">'+esc(item.priority)+'</span></div></div><div class="request-category"><strong>'+esc(categoryName(item.category))+'</strong></div><p class="request-message">'+esc(item.message)+'</p><div class="request-meta"><span>'+esc(new Date(item.created_at).toLocaleString())+'</span></div><div class="request-footer"><span class="request-label">'+esc(item.title)+'</span><button class="review-button" type="button" data-open="'+item.id+'">Review Request →</button></div></article>';
    }).join("");
    if (window.lucide) lucide.createIcons();
  }
  function openDetails(id) {
    selected = requests.find(item => item.id === Number(id)) || null;
    if (!selected) return;
    $("selectedName").textContent = "Student #" + selected.student_id;
    $("selectedStudentId").textContent = "Student record #" + selected.student_id;
    $("recordAvatar").textContent = "ST";
    $("recordName").textContent = "Student #" + selected.student_id;
    $("recordCategory").textContent = categoryName(selected.category);
    $("detailCategory").textContent = categoryName(selected.category);
    $("detailPriority").textContent = selected.priority;
    $("detailPriority").className = "priority " + priorityClass(selected.priority);
    $("detailStatus").textContent = statusName(selected.status);
    $("selectedMessage").textContent = selected.message;
    $("responseBox").value = localStorage.getItem("campuswell_support_draft_" + selected.id) || "";
    details.classList.add("open");
    render();
  }
  async function updateStatus(status) {
    if (!selected) return;
    try {
      const updated = await api("/support/requests/" + selected.id, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({status}) });
      requests = requests.map(item => item.id === updated.id ? updated : item);
      openDetails(updated.id);
    } catch (error) { alert(error.message); }
  }
  async function load() {
    if (!token) { list.textContent = "Please sign in with your counsellor account."; return; }
    try {
      const me = await api("/auth/me");
      if (me.role !== "counsellor") throw new Error("Counsellor access required.");
      requests = await api("/support/requests");
      render();
      if (requests.length) openDetails(requests[0].id);
      else details.classList.remove("open");
    } catch (error) { list.textContent = error.message; }
  }
  list.addEventListener("click", event => {
    const button = event.target.closest("[data-open]");
    const card = event.target.closest(".request-card");
    if (button) openDetails(button.dataset.open);
    else if (card) openDetails(card.dataset.id);
  });
  [categoryFilter, priorityFilter].forEach(el => el?.addEventListener("change", render));
  document.querySelectorAll("[data-filter]").forEach(tab => tab.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach(item => item.classList.remove("active"));
    tab.classList.add("active"); render();
  }));
  $("closeDetails")?.addEventListener("click", () => details.classList.remove("open"));
  $("reviewAction")?.addEventListener("click", () => updateStatus("In Progress"));
  $("closeRequest")?.addEventListener("click", () => updateStatus("Resolved"));
  $("appointmentAction")?.addEventListener("click", () => location.href = "counsellor-appointments.html");
  $("conversationAction")?.addEventListener("click", () => alert("Conversation messaging is not enabled yet. Use the support request details and schedule an appointment."));
  $("saveDraft")?.addEventListener("click", () => {
    if (!selected) return;
    localStorage.setItem("campuswell_support_draft_" + selected.id, $("responseBox").value);
    alert("Draft saved in this browser. It has not been sent to the student.");
  });
  $("sendResponse")?.addEventListener("click", () => alert("Student reply delivery is not available in the current API yet. Your draft can be saved locally."));
  load();
})();
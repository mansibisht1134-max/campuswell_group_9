const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalClose = document.getElementById("modalClose");
const modalButton = document.getElementById("modalButton");
const searchInput = document.getElementById("dashboardSearch");

const routes = {
    Appointments: "counsellor-appointments.html",
    "Student Requests": "counsellor-request.html",
    "Follow-ups": "counsellor-followups.html"
};

function openModal(title, message) {
    if (!modal || !modalTitle || !modalText) return;
    modalTitle.textContent = title;
    modalText.textContent = message;
    modal.classList.add("show");
}

function closeModal() {
    if (modal) modal.classList.remove("show");
}

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase().trim();
        document.querySelectorAll(".appointment-item, .request-item, .followup-item").forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(query) ||
                (item.dataset.search || "").toLowerCase().includes(query) ? "" : "none";
        });
    });
}

document.querySelectorAll(".session-button").forEach(button => {
    button.addEventListener("click", () => {
        const item = button.closest(".appointment-item");
        const name = item?.querySelector(".appointment-info strong")?.textContent || "Appointment";
        const details = item?.querySelector(".appointment-info span")?.textContent || "Appointment details";
        openModal(name, details);
    });
});

document.querySelectorAll(".icon-action").forEach(button => {
    button.addEventListener("click", () => {
        window.location.href = routes["Follow-ups"];
    });
});

document.getElementById("newAppointmentButton")?.addEventListener("click", () => {
    window.location.href = routes.Appointments;
});

document.getElementById("notificationButton")?.addEventListener("click", () => {
    window.location.href = "counsellor-notifications.html";
});

document.getElementById("supportButton")?.addEventListener("click", event => {
    event.preventDefault();
    openModal("CampusWell Support", "Contact CampusWell administration for portal support.");
});

modalClose?.addEventListener("click", closeModal);
modalButton?.addEventListener("click", closeModal);
modal?.addEventListener("click", event => {
    if (event.target === modal) closeModal();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
});

const unread = JSON.parse(localStorage.getItem("campuswellCounsellorReadNotifications") || "[]");
const unreadCount = Math.max(0, 3 - unread.length);
const notificationCount = document.getElementById("notificationCount");
const bellDot = document.querySelector(".bell-dot");
if (notificationCount) notificationCount.textContent = unreadCount;
if (bellDot) bellDot.textContent = unreadCount;
if (typeof lucide !== "undefined") lucide.createIcons();


/* Live counsellor dashboard data */
(async function loadLiveCounsellorDashboard(){
    const API="https://campuswell-api-dah4.onrender.com/api/v1";
    const token=localStorage.getItem("campuswell_access_token");
    const appointmentHost=document.getElementById("appointmentList");
    const requestHost=document.querySelector(".request-list");
    const followupHost=document.querySelector(".followup-list");
    const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    if(!token){
        if(appointmentHost)appointmentHost.innerHTML="<p>Please sign in with your counsellor account to view live dashboard data.</p>";
        return;
    }
    try{
        const headers={Authorization:"Bearer "+token};
        const [appointmentsRes,requestsRes,followupsRes,studentsRes]=await Promise.all([
            fetch(API+"/appointments",{headers}),
            fetch(API+"/support/requests",{headers}),
            fetch(API+"/counsellor/follow-ups",{headers}),
            fetch(API+"/counsellor/students",{headers})
        ]);
        const responses=[appointmentsRes,requestsRes,followupsRes,studentsRes];
        if(responses.some(r=>!r.ok))throw new Error("Some dashboard data could not be loaded. Please check your counsellor sign-in.");
        const [appointments,requests,followups,students]=await Promise.all(responses.map(r=>r.json()));
        const now=new Date(),todayKey=now.toLocaleDateString("en-CA");
        const todays=appointments.filter(a=>new Date(a.scheduled_at).toLocaleDateString("en-CA")===todayKey);
        const pending=requests.filter(r=>["Open","In Progress"].includes(r.status));
        const due=followups.filter(f=>f.status==="Scheduled"&&new Date(f.due_at)>=new Date(now.getFullYear(),now.getMonth(),now.getDate()));
        const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
        set("todayAppointments",todays.length);set("pendingRequests",pending.length);set("followUps",due.length);set("activeStudents",students.length);
        if(appointmentHost){
            appointmentHost.innerHTML=todays.length?todays.sort((a,b)=>new Date(a.scheduled_at)-new Date(b.scheduled_at)).map(a=>{
                const d=new Date(a.scheduled_at),time=d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}).split(" ");
                return '<div class="appointment-item"><div class="time-block"><strong>'+d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:false})+'</strong><span>'+d.toLocaleTimeString([],{hour:"2-digit",hour12:true}).replace(/[0-9: ]/g,"").toUpperCase()+'</span></div><div class="appointment-info"><strong>Student #'+a.student_id+'</strong><span>'+safe(a.reason)+' · '+safe(a.mode)+'</span></div><span class="status">'+safe(a.status)+'</span><button type="button" class="small-button session-button" data-detail="'+safe(a.id)+'">View</button></div>';
            }).join(""):"<p>No appointments scheduled for today.</p>";
            appointmentHost.querySelectorAll(".session-button").forEach(button=>button.addEventListener("click",()=>{
                const a=todays.find(x=>String(x.id)===button.dataset.detail);
                if(a)openModal("Appointment #"+a.id,"Student #"+a.student_id+" · "+a.reason+" · "+new Date(a.scheduled_at).toLocaleString()+" · "+a.status);
            }));
        }
        if(requestHost){
            requestHost.innerHTML=pending.length?pending.slice(0,5).map(r=>'<div class="request-item"><div class="request-avatar">S'+r.student_id+'</div><div class="request-info"><strong>Student #'+r.student_id+'</strong><span>'+safe(r.category)+' · '+safe(r.title)+'</span></div><span class="priority '+safe(r.priority.toLowerCase())+'">'+safe(r.priority)+'</span></div>').join(""):"<p>No pending support requests.</p>";
        }
        if(followupHost){
            followupHost.innerHTML=due.length?due.slice(0,5).map(f=>'<div class="followup-item"><div><strong>Student #'+f.student_id+'</strong><span>'+safe(f.notes||f.mode||"Follow-up")+'</span></div><div class="followup-date"><strong>'+new Date(f.due_at).toLocaleDateString()+'</strong><span>'+new Date(f.due_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})+'</span></div><button type="button" class="icon-action" aria-label="Open follow-ups"><i data-lucide="chevron-right"></i></button></div>').join(""):"<p>No follow-ups due.</p>";
            followupHost.querySelectorAll(".icon-action").forEach(button=>button.addEventListener("click",()=>window.location.href="counsellor-followups.html"));
        }
        if(typeof lucide!=="undefined")lucide.createIcons();
    }catch(error){
        if(appointmentHost)appointmentHost.innerHTML='<p>'+safe(error.message)+'</p>';
    }
})();

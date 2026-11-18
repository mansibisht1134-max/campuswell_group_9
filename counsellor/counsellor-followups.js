const caseCards = [...document.querySelectorAll('.case-card')];
const caseSearch = document.getElementById('caseSearch');
const globalSearch = document.getElementById('globalSearch');
const filterTabs = [...document.querySelectorAll('.filter-tab')];
const detailsPanel = document.getElementById('detailsPanel');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const modalForm = document.getElementById('modalForm');
const modalActions = document.getElementById('modalActions');
const modalPrimary = document.getElementById('modalPrimary');
let selectedCard = caseCards[0] || null;
let activeFilter = 'all';
let completedTotal = 26;
let savedNotes = {};
let activityItems = [];

function initials(name) {
    return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function openModal(title, text, fields = [], actions = [], primaryText = 'Done', onPrimary = null) {
    modalTitle.textContent = title;
    modalText.textContent = text;
    modalForm.innerHTML = '';
    modalActions.innerHTML = '';

    fields.forEach(field => {
        const wrapper = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = field.label;
        label.htmlFor = field.id;
        wrapper.appendChild(label);
        let input;
        if (field.type === 'textarea') {
            input = document.createElement('textarea');
        } else if (field.type === 'select') {
            input = document.createElement('select');
            field.options.forEach(optionText => {
                const option = document.createElement('option');
                option.textContent = optionText;
                option.value = optionText;
                input.appendChild(option);
            });
        } else {
            input = document.createElement('input');
            input.type = field.type || 'text';
        }
        input.id = field.id;
        input.value = field.value || '';
        input.placeholder = field.placeholder || '';
        if (field.required) input.required = true;
        wrapper.appendChild(input);
        modalForm.appendChild(wrapper);
    });

    actions.forEach(action => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = action.label;
        if (action.danger) {
            button.style.background = '#fff0f1';
            button.style.color = '#d94f59';
            button.style.borderColor = '#f4d1d5';
        }
        button.addEventListener('click', () => action.onClick());
        modalActions.appendChild(button);
    });

    modalPrimary.textContent = primaryText;
    modalPrimary.onclick = () => {
        if (onPrimary) onPrimary();
        else closeModal();
    };
    modal.classList.add('show');
    lucide.createIcons();
}

function closeModal() {
    modal.classList.remove('show');
}

function recordActivity(title, description) {
    activityItems.unshift({ title, description, time: 'Just now' });
    renderActivity();
}

function renderActivity() {
    const section = document.querySelector('.recent-activity');
    const defaults = [
        { title: 'Student check-in', description: selectedCard ? selectedCard.dataset.name : 'Student', time: '28 Sep 2026 · 4:12 PM', colour: 'green-dot' },
        { title: 'Progress note added', description: 'Dr. Sharma', time: '28 Sep 2026 · 5:03 PM', colour: 'purple-dot' },
        { title: 'Next follow-up scheduled', description: selectedCard ? selectedCard.dataset.name : 'Student', time: '28 Sep 2026 · 5:15 PM', colour: 'blue-dot' }
    ];
    const rows = activityItems.length ? activityItems.slice(0, 3).map((item, index) => ({ ...item, colour: index === 0 ? 'green-dot' : index === 1 ? 'purple-dot' : 'blue-dot' })) : defaults;
    section.querySelectorAll('.activity-row').forEach(row => row.remove());
    const heading = section.querySelector('.activity-heading');
    rows.forEach(item => {
        const row = document.createElement('div');
        row.className = 'activity-row';
        const dot = document.createElement('span');
        dot.className = `activity-dot ${item.colour}`;
        const body = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = item.title;
        const description = document.createElement('small');
        description.textContent = item.description;
        body.append(title, description);
        const time = document.createElement('time');
        time.textContent = item.time;
        row.append(dot, body, time);
        section.appendChild(row);
    });
    section.insertBefore(heading, section.firstChild);
}

function selectCase(card, scroll = false) {
    if (!card) return;
    selectedCard = card;
    detailsPanel.classList.remove('details-collapsed');
    document.querySelector('.detail-content').style.display = 'block';
    document.querySelector('.session-facts').style.display = 'grid';
    caseCards.forEach(item => item.classList.toggle('selected', item === card));

    const name = card.dataset.name;
    const studentId = card.dataset.id;
    const status = card.dataset.statuslabel;
    const priority = card.dataset.priority || 'medium';

    document.getElementById('detailAvatar').textContent = card.dataset.initials || initials(name);
    document.getElementById('detailName').textContent = name;
    document.getElementById('detailIdentity').textContent = `${studentId} · ${card.dataset.program}`;
    document.getElementById('previousSession').textContent = card.dataset.session;
    document.getElementById('previousMode').textContent = `(${card.dataset.mode})`;
    document.getElementById('detailConcern').textContent = card.dataset.concern;
    document.getElementById('detailCounsellor').textContent = card.dataset.counsellor;
    document.getElementById('goalOne').textContent = card.dataset.goal1;
    document.getElementById('goalTwo').textContent = card.dataset.goal2;
    document.getElementById('progressText').textContent = card.dataset.progress;
    document.getElementById('notesText').textContent = savedNotes[studentId] || card.dataset.notes;
    document.getElementById('nextDate').textContent = `${card.dataset.next} (${card.dataset.nextmode})`;
    document.getElementById('detailDueStatus').textContent = status;
    document.getElementById('detailDueStatus').className = `case-status ${card.dataset.status}`;
    document.getElementById('activityStudent').textContent = name;
    document.getElementById('activityNext').textContent = name;

    if (scroll) {
        detailsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function filterCases() {
    const query = (caseSearch.value || globalSearch.value).toLowerCase().trim();
    let visible = 0;

    caseCards.forEach(card => {
        const matchesStatus = activeFilter === 'all' || card.dataset.status === activeFilter;
        const searchable = `${card.dataset.search} ${card.dataset.name} ${card.dataset.id} ${card.dataset.concern}`.toLowerCase();
        const matchesSearch = !query || searchable.includes(query);
        const show = matchesStatus && matchesSearch;
        card.style.display = show ? 'grid' : 'none';
        if (show) visible++;
    });

    document.getElementById('caseCount').textContent = `${visible} follow-up${visible === 1 ? '' : 's'}`;
}

filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        filterTabs.forEach(item => item.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.dataset.filter;
        filterCases();
    });
});

caseSearch.addEventListener('input', filterCases);
globalSearch.addEventListener('input', () => {
    caseSearch.value = globalSearch.value;
    filterCases();
});

caseCards.forEach(card => {
    card.addEventListener('click', event => {
        if (event.target.closest('button')) return;
        selectCase(card, true);
    });
    card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectCase(card, true);
        }
    });
    const button = card.querySelector('.view-details');
    button.addEventListener('click', event => {
        event.stopPropagation();
        selectCase(card, true);
    });
});

document.getElementById('recordCheckin').addEventListener('click', () => {
    if (!selectedCard) return;
    openModal('Record Check-in', `Record an update for ${selectedCard.dataset.name}.`, [
        { id: 'checkinProgress', label: 'Progress update', type: 'textarea', placeholder: 'Describe the student’s reported progress...', required: true },
        { id: 'checkinNotes', label: 'Counsellor notes', type: 'textarea', placeholder: 'Add notes for this check-in...' },
        { id: 'checkinOutcome', label: 'Current outcome', type: 'select', options: ['Improving', 'No significant change', 'Needs additional support', 'Goal achieved'] }
    ], [], 'Save Check-in', () => {
        const progress = document.getElementById('checkinProgress').value.trim();
        const notes = document.getElementById('checkinNotes').value.trim();
        const outcome = document.getElementById('checkinOutcome').value;
        if (!progress) {
            document.getElementById('checkinProgress').focus();
            return;
        }
        selectedCard.dataset.progress = progress;
        document.getElementById('progressText').textContent = progress;
        if (notes) {
            selectedCard.dataset.notes = notes;
            savedNotes[selectedCard.dataset.id] = notes;
            document.getElementById('notesText').textContent = notes;
        }
        recordActivity('Student check-in recorded', `${selectedCard.dataset.name} · ${outcome}`);
        closeModal();
        openModal('Check-in Saved', `The check-in for ${selectedCard.dataset.name} has been recorded in this demo.`);
    });
});

document.getElementById('reschedule').addEventListener('click', () => {
    if (!selectedCard) return;
    openModal('Reschedule Follow-up', `Choose the next follow-up time for ${selectedCard.dataset.name}.`, [
        { id: 'followupDate', label: 'Date', type: 'date', required: true },
        { id: 'followupTime', label: 'Time', type: 'time', required: true },
        { id: 'followupMode', label: 'Session mode', type: 'select', options: ['Online', 'In-person'] }
    ], [], 'Save Schedule', () => {
        const dateValue = document.getElementById('followupDate').value;
        const timeValue = document.getElementById('followupTime').value;
        const mode = document.getElementById('followupMode').value;
        if (!dateValue || !timeValue) {
            return;
        }
        const date = new Date(`${dateValue}T${timeValue}`);
        const dateLabel = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeLabel = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        selectedCard.dataset.next = `${dateLabel} · ${timeLabel}`;
        selectedCard.dataset.nextmode = mode;
        selectedCard.dataset.status = 'upcoming';
        selectedCard.dataset.statuslabel = 'Upcoming';
        const statusBadge = selectedCard.querySelector('.case-status');
        statusBadge.className = 'case-status upcoming';
        statusBadge.textContent = 'Upcoming';
        selectCase(selectedCard, false);
        recordActivity('Next follow-up rescheduled', selectedCard.dataset.name);
        filterCases();
        closeModal();
        openModal('Follow-up Rescheduled', `The next follow-up for ${selectedCard.dataset.name} has been updated in this demo.`);
    });
});

document.getElementById('markCompleted').addEventListener('click', () => {
    if (!selectedCard) return;
    openModal('Complete Follow-up', `Mark the follow-up for ${selectedCard.dataset.name} as completed?`, [], [
        { label: 'Cancel', onClick: closeModal },
        { label: 'Mark Completed', onClick: () => {
            const name = selectedCard.dataset.name;
            selectedCard.dataset.status = 'completed';
            selectedCard.dataset.statuslabel = 'Completed';
            const badge = selectedCard.querySelector('.case-status');
            badge.textContent = 'Completed';
            badge.className = 'case-status completed';
            document.getElementById('detailDueStatus').textContent = 'Completed';
            document.getElementById('detailDueStatus').className = 'case-status completed';
            completedTotal++;
            document.getElementById('completedCount').textContent = completedTotal;
            recordActivity('Follow-up marked completed', name);
            closeModal();
            filterCases();
            openModal('Follow-up Completed', `${name}’s follow-up has been marked as completed in this demo.`);
        }}
    ]);
});

document.getElementById('editNext').addEventListener('click', () => {
    document.getElementById('reschedule').click();
});

document.getElementById('editNotes').addEventListener('click', () => {
    if (!selectedCard) return;
    openModal('Edit Counsellor Notes', `Update the private notes for ${selectedCard.dataset.name}.`, [
        { id: 'updatedNotes', label: 'Counsellor notes', type: 'textarea', value: document.getElementById('notesText').textContent, required: true }
    ], [], 'Save Notes', () => {
        const notes = document.getElementById('updatedNotes').value.trim();
        if (!notes) return;
        selectedCard.dataset.notes = notes;
        savedNotes[selectedCard.dataset.id] = notes;
        document.getElementById('notesText').textContent = notes;
        recordActivity('Progress note updated', selectedCard.dataset.name);
        closeModal();
    });
});

document.querySelectorAll('[data-panel-action]').forEach(button => {
    button.addEventListener('click', () => {
        if (button.dataset.panelAction === 'View Plan') {
            openModal('Support Plan', `${selectedCard.dataset.name}’s current support goals are shown below.`, [
                { id: 'goalEditOne', label: 'Goal 1', type: 'text', value: selectedCard.dataset.goal1, required: true },
                { id: 'goalEditTwo', label: 'Goal 2', type: 'text', value: selectedCard.dataset.goal2, required: true }
            ], [], 'Save Goals', () => {
                const one = document.getElementById('goalEditOne').value.trim();
                const two = document.getElementById('goalEditTwo').value.trim();
                if (!one || !two) return;
                selectedCard.dataset.goal1 = one;
                selectedCard.dataset.goal2 = two;
                document.getElementById('goalOne').textContent = one;
                document.getElementById('goalTwo').textContent = two;
                recordActivity('Support goals updated', selectedCard.dataset.name);
                closeModal();
            });
        } else {
            openModal('Student Progress', `${selectedCard.dataset.name}: ${selectedCard.dataset.progress}`);
        }
    });
});

document.getElementById('viewActivity').addEventListener('click', () => {
    const lines = activityItems.length ? activityItems.map(item => `${item.title}: ${item.description}`).join('\n') : 'Student check-in recorded\nProgress note added\nNext follow-up scheduled';
    openModal('Recent Activity', lines);
});

document.getElementById('closeDetails').addEventListener('click', () => {
    detailsPanel.classList.toggle('details-collapsed');
    const collapsed = detailsPanel.classList.contains('details-collapsed');
    document.querySelector('.detail-content').style.display = collapsed ? 'none' : 'block';
    document.querySelector('.session-facts').style.display = collapsed ? 'none' : 'grid';
    document.querySelector('.student-record');
});

document.getElementById('notificationButton').addEventListener('click', () => {
    openModal('Notifications', 'You have 3 unread notifications.');
});

document.getElementById('supportButton').addEventListener('click', event => {
    event.preventDefault();
    openModal('CampusWell Support', 'Contact CampusWell administration for portal support.');
});

document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        openModal(link.dataset.page, `${link.dataset.page} will be connected to the FastAPI backend and PostgreSQL database.`);
    });
});

modalPrimary.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModal();
});

selectCase(selectedCard, false);
filterCases();
lucide.createIcons();


/* Live follow-up scheduling and status management */
(function(){
 const API="https://campuswell-api-dah4.onrender.com/api/v1";
 const token=localStorage.getItem("campuswell_access_token");
 const form=document.getElementById("liveFollowupForm");
 if(!form)return;
 const student=document.getElementById("liveFollowupStudent");
 const list=document.getElementById("liveFollowupList");
 const message=document.getElementById("liveFollowupMessage");
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 async function request(path,options={}){
  const r=await fetch(API+path,{...options,headers:{...(options.headers||{}),Authorization:"Bearer "+token}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.detail||"Request failed.");
  return d;
 }
 async function load(){
  if(!token){list.textContent="Please sign in with your counsellor account.";return;}
  try{
   const [students,items]=await Promise.all([request("/counsellor/students"),request("/counsellor/follow-ups")]);
   student.innerHTML='<option value="">Choose linked student</option>'+students.map(s=>'<option value="'+s.id+'">'+esc(s.full_name)+' · #'+s.id+'</option>').join("");
   list.innerHTML="";
   if(!items.length){list.textContent="No follow-ups scheduled yet.";return;}
   items.sort((a,b)=>new Date(a.due_at)-new Date(b.due_at)).forEach(item=>{
    const row=document.createElement("div");row.style.cssText="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:13px;border:1px solid #dceaf8;border-radius:10px;margin:8px 0;";
    row.innerHTML='<div><strong>Student #'+item.student_id+' · '+esc(new Date(item.due_at).toLocaleString())+'</strong><p style="margin:4px 0;color:#6685a9;">'+esc(item.mode||"Not specified")+' · '+esc(item.status)+'</p><small>'+esc(item.notes||"No notes")+'</small></div>';
    const actions=document.createElement("div");actions.style.cssText="display:flex;gap:7px;flex-wrap:wrap;";
    if(item.status==="Scheduled")["Completed","Missed","Cancelled"].forEach(status=>{
     const b=document.createElement("button");b.type="button";b.textContent=status;b.className="primary-button";b.addEventListener("click",async()=>{
      b.disabled=true;try{await request("/counsellor/follow-ups/"+item.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});await load();}catch(e){b.disabled=false;message.textContent=e.message;}
     });actions.appendChild(b);
    });
    row.appendChild(actions);list.appendChild(row);
   });
  }catch(e){list.textContent=e.message;}
 }
 form.addEventListener("submit",async e=>{
  e.preventDefault();message.textContent="Scheduling...";
  try{
   const due=new Date(document.getElementById("liveFollowupDate").value);
   if(!Number.isFinite(due.getTime())||due<=new Date())throw new Error("Choose a future date and time.");
   await request("/counsellor/follow-ups",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    student_id:Number(student.value),due_at:due.toISOString(),mode:document.getElementById("liveFollowupMode").value,
    notes:document.getElementById("liveFollowupNotes").value.trim()||null
   })});
   message.textContent="Follow-up scheduled successfully.";form.reset();await load();
  }catch(e){message.textContent=e.message;}
 });
 load();
})();

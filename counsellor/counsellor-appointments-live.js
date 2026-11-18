(() => {
 const API="https://campuswell-api-dah4.onrender.com/api/v1", token=localStorage.getItem("campuswell_access_token");
 const $=id=>document.getElementById(id), esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 let appointments=[], weekStart=new Date();
 const monday=d=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-(x.getDay()+6)%7);return x;};
 weekStart=monday(weekStart);
 const dateFmt=d=>d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
 const timeFmt=d=>d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
 async function api(path,opts={}){const r=await fetch(API+path,{...opts,headers:{...(opts.headers||{}),Authorization:"Bearer "+token}});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.detail||"Request failed");return data;}
 function render(){
  const columns=[...document.querySelectorAll(".calendar-body .day-column")];
  columns.forEach(col=>col.replaceChildren());
  const header=document.querySelector(".week-header");
  if(header){const labels=["Mon","Tue","Wed","Thu","Fri"];header.innerHTML='<div class="time-column"></div>'+labels.map((label,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);return '<div>'+label+'<span>'+d.getDate()+'</span></div>';}).join("");}
  $("monthTitle").textContent=weekStart.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  appointments.filter(a=>!["Cancelled","Declined"].includes(a.status)).forEach(a=>{
   const d=new Date(a.scheduled_at), day=(d.getDay()+6)%7;if(day>4)return;
   const col=columns[day];if(!col)return;
   const minutes=d.getHours()*60+d.getMinutes(), top=Math.max(2,Math.min(575,((minutes-540)/60)*72));
   const node=document.createElement("div");node.className="appointment "+(["Confirmed","Completed"].includes(a.status)?"event-green":"event-blue");
   node.style.top=top+"px";node.style.height="55px";node.dataset.id=a.id;
   node.innerHTML='<strong>'+timeFmt(d)+'</strong><span>Student #'+a.student_id+'</span><small>'+esc(a.reason)+' · '+esc(a.status)+'</small>';
   node.title=a.reason+" · "+a.mode+" · "+a.status;
   col.appendChild(node);
  });
  const pending=appointments.filter(a=>a.status==="Pending");
  const requestPanel=document.querySelector(".right-workspace .mini-panel");
  const requestsHost=requestPanel?.querySelectorAll(".request-card");
  if(requestPanel){
   const heading=requestPanel.querySelector(".panel-title span");if(heading)heading.textContent=pending.length+" Pending";
   const old=[...requestPanel.querySelectorAll(".request-card")];old.forEach(n=>n.remove());
   pending.slice(0,5).forEach(a=>{
    const card=document.createElement("div");card.className="request-card";
    card.innerHTML='<div class="person"><div class="person-avatar">ST</div><div><strong>Student #'+a.student_id+'</strong><span>'+esc(a.reason)+'</span></div></div><div class="request-info"><span>Scheduled</span><strong>'+dateFmt(new Date(a.scheduled_at))+' · '+timeFmt(new Date(a.scheduled_at))+' · '+esc(a.mode)+'</strong></div><div class="request-actions"><button class="accept" data-status="Confirmed" data-id="'+a.id+'">Accept</button><button class="decline" data-status="Declined" data-id="'+a.id+'">Decline</button></div>';
    requestPanel.insertBefore(card,$("allRequests"));
   });
   if(!pending.length){const p=document.createElement("p");p.textContent="No pending appointment requests.";requestPanel.insertBefore(p,$("allRequests"));}
  }
  const history=document.querySelector(".history-table");
  if(history){
   const head=history.querySelector(".table-head");history.innerHTML="";history.appendChild(head);
   const past=appointments.filter(a=>["Completed","Cancelled","Declined"].includes(a.status)||new Date(a.scheduled_at)<new Date());
   past.forEach(a=>{const row=document.createElement("div");row.className="table-row";row.innerHTML='<span><strong>Student #'+a.student_id+'</strong><small>#'+a.student_id+'</small></span><span>'+dateFmt(new Date(a.scheduled_at))+'</span><span>'+esc(a.reason)+'</span><span>'+esc(a.mode)+'</span><b class="'+(a.status==="Completed"?"completed":"cancelled")+'">'+esc(a.status)+'</b><span></span>';history.appendChild(row);});
   if(!past.length){const p=document.createElement("p");p.textContent="No past appointments yet.";history.appendChild(p);}
  }
  if(window.lucide)lucide.createIcons();
 }
 async function update(id,status){try{await api("/appointments/"+id+"/status",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});await load();}catch(e){alert(e.message);}}
 async function load(){if(!token)return;try{const me=await api("/auth/me");if(me.role!=="counsellor")throw new Error("Counsellor access required.");appointments=await api("/appointments");render();}catch(e){const host=document.querySelector(".calendar-panel");if(host)host.insertAdjacentHTML("afterbegin",'<p role="alert">'+esc(e.message)+'</p>');}}
 document.addEventListener("click",e=>{
  const action=e.target.closest("[data-status][data-id]");if(action){update(action.dataset.id,action.dataset.status);return;}
  const appt=e.target.closest(".appointment[data-id]");if(appt){const a=appointments.find(x=>x.id===Number(appt.dataset.id));if(a)alert("Student #"+a.student_id+"\n"+a.reason+"\n"+new Date(a.scheduled_at).toLocaleString()+"\n"+a.mode+"\nStatus: "+a.status);}
 });
 $("prevMonth")?.addEventListener("click",()=>{weekStart.setDate(weekStart.getDate()-7);render();});
 $("nextMonth")?.addEventListener("click",()=>{weekStart.setDate(weekStart.getDate()+7);render();});
 $("todayButton")?.addEventListener("click",()=>{weekStart=monday(new Date());render();});
 $("newAppointmentButton")?.addEventListener("click",()=>alert("Students submit appointment requests from their portal. Review and confirm or decline them here."));
 $("allRequests")?.addEventListener("click",()=>location.href="counsellor-request.html");
 $("manageAvailability")?.addEventListener("click",async()=>{
  const button=$("manageAvailability");
  if(button)button.disabled=true;
  try{
   const profile=await api("/counsellors/me");
   const updated=await api("/counsellors/me",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_available:!profile.is_available})});
   alert(updated.is_available?"You are now marked available for new appointment requests.":"You are now marked unavailable for new appointment requests.");
   if(button)button.textContent=updated.is_available?"Set Unavailable":"Set Available";
  }catch(error){alert(error.message||"Could not update availability.");}
  finally{if(button)button.disabled=false;}
 });
 $("rulesButton")?.addEventListener("click",()=>alert("Appointment rule management is not connected to the current backend yet."));
 $("historyFilter")?.addEventListener("click",()=>document.querySelector(".history-panel")?.scrollIntoView({behavior:"smooth"}));
 $("searchInput")?.addEventListener("input",e=>{const q=e.target.value.toLowerCase();document.querySelectorAll(".appointment").forEach(n=>n.style.display=n.textContent.toLowerCase().includes(q)?"":"none");document.querySelectorAll(".request-card").forEach(n=>n.style.display=n.textContent.toLowerCase().includes(q)?"":"none");});
 load();
})();
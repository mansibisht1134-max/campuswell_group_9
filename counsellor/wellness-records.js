const API="https://campuswell-api-dah4.onrender.com/api/v1";
const token=localStorage.getItem("campuswell_access_token");
const body=document.getElementById("recordsTableBody");
const search=document.getElementById("recordSearch");
const moodFilter=document.getElementById("moodFilter");
const statusFilter=document.getElementById("statusFilter");
const empty=document.getElementById("recordsEmpty");
const count=document.getElementById("recordResultCount");
let records=[];
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function level(item){
 const score=Number(item.score??100);
 const stress=String(item.stress_level||"").toLowerCase();
 if(score<50||["high","very high"].includes(stress))return "Elevated";
 if(score<65||stress==="moderate")return "Watch";
 return "Routine";
}
function render(){
 const q=(search?.value||"").trim().toLowerCase();
 const mood=moodFilter?.value||"all";
 const status=statusFilter?.value||"all";
 const visible=records.filter(x=>{
  const label=level(x);
  const moodValue=String(x.mood||"").toLowerCase().replace(/\s+/g,"");
  return (!q||("student "+x.student_id+" "+(x.notes||"")).toLowerCase().includes(q))
   &&(mood==="all"||moodValue===mood)
   &&(status==="all"||label.toLowerCase()===status);
 });
 body.innerHTML=visible.map(x=>{
  const date=x.submitted_at?new Date(x.submitted_at).toLocaleString():"—";
  const statusText=level(x);
  return '<tr><td><strong>Student #'+x.student_id+'</strong></td><td>'+esc(date)+'</td><td>'+esc(x.mood||"Not reported")+'</td><td>'+esc(x.stress_level||"Not reported")+'</td><td>'+(x.sleep_hours??"—")+' hrs</td><td>'+esc(x.energy_level||"Not reported")+'</td><td><span class="status-badge">'+statusText+'</span></td><td>Self check-in</td><td><button type="button" class="view-record" data-id="'+x.id+'">View</button></td></tr>';
 }).join("");
 empty.hidden=visible.length>0;
 count.textContent="Showing "+visible.length+" of "+records.length+" live check-ins";
 body.querySelectorAll(".view-record").forEach(button=>button.addEventListener("click",()=>{
  const item=records.find(x=>String(x.id)===button.dataset.id);
  if(!item)return;
  const details="Student #"+item.student_id+"\nSubmitted: "+new Date(item.submitted_at).toLocaleString()+"\nMood: "+(item.mood||"Not reported")+"\nStress: "+(item.stress_level||"Not reported")+"\nSleep: "+(item.sleep_hours??"Not reported")+" hours\nEnergy: "+(item.energy_level||"Not reported")+"\nScore: "+(item.score??"Not calculated")+"\nNotes: "+(item.notes||"No notes");
  alert(details);
 }));
}
async function load(){
 if(!token){body.innerHTML='<tr><td colspan="9">Please sign in with your counsellor account.</td></tr>';return;}
 try{
  const r=await fetch(API+"/counsellor/wellness-checkins",{headers:{Authorization:"Bearer "+token}});
  const data=await r.json().catch(()=>[]);
  if(!r.ok)throw new Error(data.detail||"Unable to load wellness records.");
  records=Array.isArray(data)?data:[];
  records.sort((a,b)=>new Date(b.submitted_at)-new Date(a.submitted_at));
  render();
 }catch(e){body.innerHTML='<tr><td colspan="9">'+esc(e.message)+'</td></tr>';count.textContent="Records unavailable";}
}
search?.addEventListener("input",render);
moodFilter?.addEventListener("change",render);
statusFilter?.addEventListener("change",render);
if(statusFilter)statusFilter.innerHTML='<option value="all">Indicator (All)</option><option value="elevated">Elevated</option><option value="watch">Watch</option><option value="routine">Routine</option>';
load();

import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n || 0));
const safeDate = value => { try { if (!value) return "Date to be confirmed"; const d = value.toDate ? value.toDate() : new Date(value); return isNaN(d) ? "Date to be confirmed" : d.toLocaleDateString("en-US",{day:"numeric",month:"short",year:"numeric"}); } catch { return "Date to be confirmed"; } };
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const setHTML = (id, html) => { if ($(id)) $(id).innerHTML = html; };
function empty(text){ return `<p class="empty-state">${esc(text)}</p>`; }
function dateValue(v){ if (!v) return null; const d = v.toDate ? v.toDate() : new Date(v); return isNaN(d) ? null : d; }

document.querySelectorAll("[data-view]").forEach(link => link.addEventListener("click", e => {
  const view = link.dataset.view; if (!view) return;
  e.preventDefault(); document.querySelectorAll(".portal-view").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".portal-nav").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
  $("view-"+view)?.classList.add("active"); history.replaceState(null,"","#"+view); window.scrollTo({top:0,behavior:"smooth"});
}));
$("todayLabel").textContent = new Date().toLocaleDateString("en-US",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
$("footerYear").textContent = new Date().getFullYear();

async function readCollection(name, constraints=[]){
  const ref=collection(db,name); const snap=await getDocs(constraints.length?query(ref,...constraints):ref);
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}
function renderList(id, rows, renderer, message){setHTML(id, rows.length?rows.map(renderer).join(""):empty(message));}
function courseCard(c){return `<article class="portal-course"><div class="course-topline">${esc(c.category||"PROGRAMME")}</div><h3>${esc(c.title||c.name||"Untitled course")}</h3><p>${esc(c.description||"Course details will be provided by the institute.")}</p><div class="course-meta"><span>${esc(c.duration||"Duration TBC")}</span><span>${c.fee!=null?money(c.fee):"Fee TBC"}</span></div><span class="status-chip">${esc(c.status||"Published")}</span></article>`;}
function scheduleCard(s){return `<article class="portal-row"><div class="row-date"><strong>${esc(s.day||safeDate(s.date))}</strong><small>${esc(s.time||"Time TBC")}</small></div><div class="row-main"><strong>${esc(s.title||s.courseName||"Class session")}</strong><small>${esc([s.instructor,s.venue||s.location].filter(Boolean).join(" · ")||"Details to be confirmed")}</small></div><span class="status-chip">${esc(s.mode||"Class")}</span></article>`;}
onAuthStateChanged(auth, async user=>{
 if(!user){window.location.replace("auth.html");return;}
 $("sideStudentEmail").textContent=user.email||"";
 $("verifyNotice").hidden=user.emailVerified; $("verifyNotice").textContent=user.emailVerified?"":"Your email address is not yet verified. Please use the verification link sent to your inbox.";
 try{
  const profileSnap=await getDoc(doc(db,"users",user.uid)); const profile=profileSnap.exists()?profileSnap.data():{};
  const name=profile.fullName||"Student"; $("memberName").textContent=name; $("sideStudentName").textContent=name; $("headerStudentName").textContent=name.toUpperCase(); $("avatarInitials").textContent=name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  $("profileName").textContent=name; $("profileEmail").textContent=user.email||"—"; $("profileType").textContent=profile.accountType==="parent_guardian"?"Parent / Guardian":"Adult learner"; $("profileVerified").textContent=user.emailVerified?"Verified":"Not verified";
  const [courses, enrollments, fees, timetable, classes, attendance, results, materials, announcements] = await Promise.all([
   readCollection("courses"), readCollection("enrollments",[where("ownerUid","==",user.uid)]), readCollection("fees",[where("ownerUid","==",user.uid)]),
   readCollection("timetables"), readCollection("classes"), readCollection("attendance",[where("ownerUid","==",user.uid)]),
   readCollection("results",[where("ownerUid","==",user.uid)]), readCollection("materials"), readCollection("announcements")
  ]);
  const enrolledIds=new Set(enrollments.map(e=>e.courseId).filter(Boolean));
  const myCourses=courses.filter(c=>c.published===true && (enrolledIds.has(c.id) || c.openToAll===true));
  const visibleCourses=myCourses.length?myCourses:courses.filter(c=>c.published===true);
  const openFees=fees.filter(f=>!["paid","cancelled"].includes(String(f.status||"unpaid").toLowerCase()));
  const balance=openFees.reduce((sum,f)=>sum+Math.max(0,Number(f.amount||0)-Number(f.amountPaid||0)),0);
  const upcoming=[...classes,...timetable].filter(x=>{const d=dateValue(x.date||x.startsAt);return !d||d>=new Date(new Date().setHours(0,0,0,0));}).sort((a,b)=>(dateValue(a.date||a.startsAt)||new Date(8640000000000000))-(dateValue(b.date||b.startsAt)||new Date(8640000000000000)));
  $("statCourses").textContent=String(enrollments.length||myCourses.length); $("statFees").textContent=money(balance); $("statClasses").textContent=String(upcoming.length); $("statAttendance").textContent=String(attendance.length);
  $("feeBalance").textContent=money(balance);
  renderList("coursesList",visibleCourses,courseCard,"No courses have been published yet. Please check back or contact the institute.");
  renderList("overviewCourses",visibleCourses.slice(0,3),c=>`<div class="portal-row"><div class="row-main"><strong>${esc(c.title||c.name)}</strong><small>${esc(c.duration||"Programme")}</small></div><span class="status-chip">Available</span></div>`,"Your approved course enrolments will appear here.");
  renderList("overviewClasses",upcoming.slice(0,4),scheduleCard,"No upcoming classes have been published.");
  renderList("timetableList",timetable,scheduleCard,"No timetable has been published for your enrolment.");
  renderList("classesList",[...classes,...timetable],scheduleCard,"No upcoming classes have been scheduled.");
  renderList("overviewAnnouncements",announcements.slice(0,3),a=>`<div class="portal-row"><div class="row-main"><strong>${esc(a.title||"Institute announcement")}</strong><small>${esc(a.message||"")}</small></div><small>${safeDate(a.createdAt)}</small></div>`,"No announcements yet.");
  renderList("announcementsList",announcements,a=>`<article class="portal-card"><div class="course-topline">${safeDate(a.createdAt)}</div><h3>${esc(a.title||"Institute announcement")}</h3><p class="dashboard-muted">${esc(a.message||"")}</p></article>`,"There are no announcements at the moment.");
  setHTML("feesList",fees.length?`<table class="portal-table"><thead><tr><th>Description</th><th>Due date</th><th>Amount</th><th>Status</th></tr></thead><tbody>${fees.map(f=>`<tr><td>${esc(f.description||"Institute fee")}</td><td>${safeDate(f.dueDate)}</td><td>${money(f.amount)}</td><td><span class="status-chip">${esc(f.status||"unpaid")}</span></td></tr>`).join("")}</tbody></table>`:empty("No fee invoices have been issued."));
  renderList("attendanceList",attendance,a=>`<div class="portal-row"><div class="row-main"><strong>${esc(a.className||a.courseName||"Class session")}</strong><small>${safeDate(a.date)}</small></div><span class="status-chip">${esc(a.status||"Recorded")}</span></div>`,"Attendance records will appear after your instructor records a session.");
  renderList("resultsList",results,r=>`<div class="portal-row"><div class="row-main"><strong>${esc(r.title||r.courseName||"Assessment")}</strong><small>${safeDate(r.releasedAt||r.date)}</small></div><strong>${esc(r.score!=null?r.score+(r.outOf?"/"+r.outOf:""):"Result pending")}</strong></div>`,"Assessment results will appear here when released by the institute.");
  renderList("materialsList",materials.filter(m=>m.published===true),m=>`<article class="portal-course"><div class="course-topline">${esc(m.type||"LEARNING RESOURCE")}</div><h3>${esc(m.title||"Learning material")}</h3><p>${esc(m.description||"")}</p>${m.url?`<a class="under-link" href="${esc(m.url)}" target="_blank" rel="noopener">OPEN MATERIAL ↗</a>`:"<small>Resource link pending</small>"}</article>`,"Your instructors have not published learning materials yet.");
  $("portalStatus").hidden=true;
 }catch(err){console.error(err);$("portalStatus").textContent="Some portal information could not load. Please refresh or contact the institute if the problem continues."; }
});
$("logoutButton").addEventListener("click",async()=>{await signOut(auth);window.location.href="auth.html";});

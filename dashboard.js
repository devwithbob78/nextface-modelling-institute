import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n || 0));
const safeDate = value => { try { if (!value) return "Date to be confirmed"; const d = value.toDate ? value.toDate() : new Date(value); return isNaN(d) ? "Date to be confirmed" : d.toLocaleDateString("en-US",{day:"numeric",month:"short",year:"numeric"}); } catch { return "Date to be confirmed"; } };
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const setHTML = (id, html) => { if ($(id)) $(id).innerHTML = html; };
function empty(text){ return `<p class="empty-state">${esc(text)}</p>`; }
function dateValue(v){ if (!v) return null; const d = v.toDate ? v.toDate() : new Date(v); return isNaN(d) ? null : d; }
function receiptDate(v){ return safeDate(v); }
function printReceipt(f, studentName, email){
 const receiptNo=esc(f.receiptNumber||f.paymentReference||f.id);
 const paid=Number(f.amountPaid??f.amount??0);
 const popup=window.open("","_blank","width=760,height=900");
 if(!popup){alert("Please allow pop-ups for this site, then try again.");return;}
 popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Nextface Fee Receipt</title><style>body{font-family:Arial,sans-serif;color:#171717;padding:36px;max-width:760px;margin:auto}.brand{font: bold 24px Georgia,serif;letter-spacing:3px}.gold{color:#9a793c}.line{border-top:2px solid #b99a5b;margin:22px 0}.meta{display:flex;justify-content:space-between;gap:20px;margin:8px 0}.label{color:#666}.total{font-size:24px;font-weight:bold;margin-top:25px}.stamp{display:inline-block;border:2px solid #26734d;color:#26734d;padding:8px 14px;font-weight:bold;letter-spacing:2px;margin-top:15px}.foot{margin-top:50px;color:#777;font-size:12px}@media print{button{display:none}}</style></head><body><div class="brand">NEXTFACE <span class="gold">✦</span></div><div class="gold">MODELLING INSTITUTE</div><div class="line"></div><h1>School Fees Receipt</h1><div class="stamp">PAYMENT RECEIVED</div><div class="line"></div><div class="meta"><span class="label">Receipt number</span><strong>${receiptNo}</strong></div><div class="meta"><span class="label">Payment date</span><strong>${esc(receiptDate(f.paidAt||f.updatedAt||f.createdAt))}</strong></div><div class="meta"><span class="label">Student name</span><strong>${esc(studentName)}</strong></div><div class="meta"><span class="label">Student email</span><strong>${esc(email)}</strong></div><div class="meta"><span class="label">Description</span><strong>${esc(f.description||"School fees")}</strong></div><div class="meta"><span class="label">Payment reference</span><strong>${esc(f.paymentReference||f.receiptNumber||"Recorded by institute")}</strong></div><div class="line"></div><div class="meta total"><span>Amount paid</span><span>${esc(money(paid))}</span></div><p>Currency: USD</p><div class="foot">This receipt confirms that Nextface Modelling Institute has recorded the payment shown above. Keep this receipt for your records.</div><script>window.onload=()=>setTimeout(()=>window.print(),300);<\/script></body></html>`);
 popup.document.close();
}

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
// Load each portal section independently: one denied/misconfigured collection must not blank the whole dashboard.
async function readCollectionSafe(name, constraints=[]){
  try { return await readCollection(name,constraints); }
  catch(error) { console.error(`Nextface: could not load ${name}:`,error); return []; }
}
function renderList(id, rows, renderer, message){setHTML(id, rows.length?rows.map(renderer).join(""):empty(message));}
function courseCard(c){const topics=Array.isArray(c.syllabus)?`<ul class="course-syllabus">${c.syllabus.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"";return `<article class="portal-course"><div class="course-topline">${esc(c.category||"PROGRAMME")}</div><h3>${esc(c.title||c.name||"Untitled course")}</h3><p>${esc(c.description||"Course details will be provided by the institute.")}</p>${topics}<div class="course-meta"><span>${esc(c.duration||"Duration TBC")}</span><span>${c.fee!=null?money(c.fee):"Fee TBC"}</span></div><span class="status-chip">${esc(c.status||"Published")}</span></article>`;}
function scheduleCard(s){return `<article class="portal-row"><div class="row-date"><strong>${esc(s.day||safeDate(s.date))}</strong><small>${esc(s.time||"Time TBC")}</small></div><div class="row-main"><strong>${esc(s.title||s.courseName||"Class session")}</strong><small>${esc([s.sessionType,s.instructor,s.venue||s.location].filter(Boolean).join(" · ")||"Details to be confirmed")}</small></div><span class="status-chip">${esc(s.mode||"Class")}</span></article>`;}
let dashboardAuthStarted=false;
const dashboardWatchdog=setTimeout(()=>{
  if(!dashboardAuthStarted){
    const status=$("portalStatus");
    if(status){status.hidden=false;status.textContent="Dashboard is waiting for Firebase Authentication. Check your internet connection, Firebase configuration and browser console, then reload.";}
  }
},15000);
window.addEventListener("unhandledrejection",event=>{
  console.error("Nextface unhandled promise rejection:",event.reason);
  const status=$("portalStatus");
  if(status){status.hidden=false;status.textContent="A dashboard operation failed: "+(event.reason?.code||event.reason?.message||"Unknown error");}
});
window.addEventListener("error",event=>{
  console.error("Nextface dashboard runtime error:",event.error||event.message);
  const status=$("portalStatus");
  if(status){status.hidden=false;status.textContent="Dashboard error: "+(event.error?.message||event.message||"Unknown JavaScript error");}
});

onAuthStateChanged(auth, async user=>{
 dashboardAuthStarted=true; clearTimeout(dashboardWatchdog);
 if(!user){window.location.replace("auth.html");return;}
 $("sideStudentEmail").textContent=user.email||"";
 $("verifyNotice").hidden=user.emailVerified; $("verifyNotice").textContent=user.emailVerified?"":"Your email address is not yet verified. Please use the verification link sent to your inbox.";
 try{
  let profile={}; try { const profileSnap=await getDoc(doc(db,"users",user.uid)); profile=profileSnap.exists()?profileSnap.data():{}; } catch(profileError) { console.error("Nextface: student profile could not load:",profileError); }
  const name=profile.fullName||"Student"; $("memberName").textContent=name; $("sideStudentName").textContent=name; $("headerStudentName").textContent=name.toUpperCase(); $("avatarInitials").textContent=name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  $("profileName").textContent=name; $("profileEmail").textContent=user.email||"—"; $("profileType").textContent=profile.accountType==="parent_guardian"?"Parent / Guardian":"Adult learner"; $("profileVerified").textContent=user.emailVerified?"Verified":"Not verified"; $("profileGuardian").textContent=profile.guardianName||"Not provided"; $("profileGuardianContact").textContent=[profile.guardianEmail,profile.guardianPhone].filter(Boolean).join(" · ")||"Not provided"; $("profileEmergencyContact").textContent=[profile.emergencyName,profile.emergencyPhone].filter(Boolean).join(" · ")||"Not provided";
  const uid=user.uid;
  const [courses, enrollments, fees, timetable, classes, attendance, results, materials, announcements, assessments, lessons, examAttempts, notifications, supportTickets] = await Promise.all([
   readCollectionSafe("courses"), readCollectionSafe("enrollments",[where("ownerUid","==",uid)]), readCollectionSafe("fees",[where("ownerUid","==",uid)]),
   readCollectionSafe("timetables"), readCollectionSafe("classes"), readCollectionSafe("attendance",[where("ownerUid","==",uid)]),
   readCollectionSafe("results",[where("ownerUid","==",uid)]), readCollectionSafe("materials"), readCollectionSafe("announcements"), readCollectionSafe("assessments"), readCollectionSafe("lessons"), readCollectionSafe("examAttempts",[where("ownerUid","==",uid)]), readCollectionSafe("notifications",[where("ownerUid","==",uid)]), readCollectionSafe("support",[where("ownerUid","==",uid)])
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
  const orderedTimetable=[...timetable].sort((a,b)=>(a.sessionType==="Theory"?0:1)-(b.sessionType==="Theory"?0:1));
  renderList("timetableList",orderedTimetable,scheduleCard,"No timetable has been published for your enrolment.");
  renderList("classesList",[...classes,...timetable],scheduleCard,"No upcoming classes have been scheduled.");
  const visibleAssessments=assessments.filter(a=>a.published===true).sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")));
  const submittedExamIds=new Set(examAttempts.map(a=>a.examId));
  renderList("studentAssessments",visibleAssessments,a=>{const attempt=examAttempts.find(x=>x.examId===a.id);const isBuiltIn=a.mode==="built-in" || Number(a.questionCount||0)>0;return `<article class="portal-course"><div class="course-topline">${esc(a.type||"ASSESSMENT")} · ${esc(a.courseName||"")}</div><h3>${esc(a.title||"Assessment")}</h3><p>${esc(a.instructions||"Follow the instructions provided by your instructor.")}</p><div class="course-meta"><span>${esc(safeDate(a.date))} · ${esc(a.time||"Time TBC")}</span><span>${esc(String(a.duration||"—"))} min</span></div><p class="dashboard-muted">${esc(String(a.questionCount||"—"))} questions · Timed assessment</p>${attempt?`<span class="status-chip">${esc(attempt.status||"Submitted")}</span>`:isBuiltIn?`<button class="button button-gold start-exam" data-id="${esc(a.id)}">START EXAMINATION</button>`:a.url?`<a class="button button-gold" href="${esc(a.url)}" target="_blank" rel="noopener">OPEN ASSESSMENT ↗</a>`:`<span class="status-chip">Details coming soon</span>`}</article>`;},"No tests or examinations have been scheduled yet.");
  document.querySelectorAll(".start-exam").forEach(b=>b.addEventListener("click",()=>{const exam=visibleAssessments.find(a=>a.id===b.dataset.id);if(exam)startBuiltInExam(exam,user,examAttempts);}));
  renderList("examHistory",[...examAttempts].sort((a,b)=>(dateValue(b.submittedAt)||new Date(0))-(dateValue(a.submittedAt)||new Date(0))),a=>`<div class="portal-row"><div class="row-main"><strong>${esc(a.examTitle||"Examination")}</strong><small>${esc(safeDate(a.submittedAt))} · ${esc(a.status||"Submitted")}</small></div><strong>${a.status==="graded"?`${esc(a.score??0)} / ${esc(a.outOf??0)}`:"Awaiting grading"}</strong></div>`,"You have not submitted any examinations yet.");
  const visibleLessons=lessons.filter(l=>l.published===true);
  renderList("studentLessons",visibleLessons,l=>`<article class="portal-course"><div class="course-topline">${esc(l.type||"LESSON")} · ${esc(l.courseName||"")}</div><h3>${esc(l.title||"Lesson")}</h3><p>${esc(l.lessonNumber||"")}</p><div class="lesson-content">${esc(l.content||"").replace(/\n/g,"<br>")}</div>${l.url?`<p><a class="under-link" href="${esc(l.url)}" target="_blank" rel="noopener">OPEN LESSON RESOURCE ↗</a></p>`:""}</article>`,"No lessons have been published yet.");
  renderList("overviewAnnouncements",announcements.slice(0,3),a=>`<div class="portal-row"><div class="row-main"><strong>${esc(a.title||"Institute announcement")}</strong><small>${esc(a.message||"")}</small></div><small>${safeDate(a.createdAt)}</small></div>`,"No announcements yet.");
  renderList("announcementsList",announcements,a=>`<article class="portal-card"><div class="course-topline">${safeDate(a.createdAt)}</div><h3>${esc(a.title||"Institute announcement")}</h3><p class="dashboard-muted">${esc(a.message||"")}</p></article>`,"There are no announcements at the moment.");
  renderList("studentNotifications",notifications.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)),n=>`<article class="portal-card"><div class="course-topline">${safeDate(n.createdAt)}</div><h3>${esc(n.title||"Institute notification")}</h3><p>${esc(n.message||"")}</p></article>`,"No notifications yet.");
  renderList("studentSupportTickets",supportTickets.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)),t=>{
    const replyHtml=t.reply ? "<p><strong>Institute reply:</strong> "+esc(t.reply)+"</p>" : '<p class="dashboard-muted">Awaiting an institute reply.</p>';
    return '<article class="portal-card"><div class="course-topline">'+esc(t.status||"open").replace("_"," ")+'</div><h3>'+esc(t.subject||"Support request")+'</h3><p>'+esc(t.message||"")+'</p>'+replyHtml+'</article>';
  },"You have not submitted any support requests.");
  setHTML("feesList",fees.length?`<table class="portal-table"><thead><tr><th>Description</th><th>Due date</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead><tbody>${fees.map(f=>{const paid=String(f.status||"").toLowerCase()==="paid";return `<tr><td>${esc(f.description||"Institute fee")}</td><td>${safeDate(f.dueDate)}</td><td>${money(f.amount)}</td><td><span class="status-chip">${esc(f.status||"unpaid")}</span></td><td>${paid?`<button class="dashboard-action download-receipt" data-id="${esc(f.id)}">DOWNLOAD RECEIPT</button>`:"—"}</td></tr>`;}).join("")}</tbody></table>`:empty("No fee invoices have been issued."));
  document.querySelectorAll(".download-receipt").forEach(b=>b.addEventListener("click",()=>{const f=fees.find(x=>x.id===b.dataset.id);if(f)printReceipt(f,name,user.email||"");}));
  const attCounts={Present:0,Absent:0,Late:0,Excused:0};attendance.forEach(a=>{if(attCounts[a.status]!==undefined)attCounts[a.status]++;});const attTotal=attendance.length,attRate=attTotal?Math.round((attCounts.Present+attCounts.Late)/attTotal*100):0;$("studentAttendanceSummary").textContent=`${attTotal} recorded sessions · ${attCounts.Present} present · ${attCounts.Late} late · ${attCounts.Absent} absent · ${attCounts.Excused} excused · Attendance rate: ${attRate}%`;
  renderList("attendanceList",[...attendance].sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))),a=>`<div class="portal-row"><div class="row-main"><strong>${esc(a.className||a.courseName||"Class session")}</strong><small>${safeDate(a.date)}</small></div><span class="status-chip">${esc(a.status||"Recorded")}</span></div>`,"Attendance records will appear after your instructor records a session.");
  renderList("resultsList",results,r=>`<div class="portal-row"><div class="row-main"><strong>${esc(r.title||r.courseName||"Assessment")}</strong><small>${safeDate(r.releasedAt||r.date)} · ${esc(r.grade||"Result")}</small></div><strong>${esc(r.score!=null?r.score+(r.outOf?"/"+r.outOf:""):"Result pending")}</strong><button class="dashboard-action download-result" data-id="${esc(r.id)}">DOWNLOAD RESULT</button></div>`,"Assessment results will appear here when released by the institute.");
  document.querySelectorAll(".download-result").forEach(b=>b.addEventListener("click",()=>{const r=results.find(x=>x.id===b.dataset.id);if(!r)return;const w=window.open("","_blank","width=760,height=900");if(!w){alert("Please allow pop-ups to download your result.");return;}w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Nextface Assessment Result</title><style>body{font-family:Arial,sans-serif;color:#171717;padding:40px;max-width:760px;margin:auto}.brand{font: bold 25px Georgia,serif;letter-spacing:3px;color:#111}.gold{color:#9a793c}.rule{border-top:2px solid #b99a5b;margin:24px 0}.item{display:flex;justify-content:space-between;gap:20px;padding:12px 0;border-bottom:1px solid #ddd}.score{font-size:30px;font-weight:bold;margin:28px 0;color:#80612d}.foot{margin-top:50px;color:#777;font-size:12px}</style></head><body><div class="brand">NEXTFACE <span class="gold">✦</span></div><div class="gold">MODELLING INSTITUTE</div><div class="rule"></div><h1>Assessment Result</h1><div class="item"><span>Student</span><strong>${esc(name)}</strong></div><div class="item"><span>Assessment</span><strong>${esc(r.title||r.courseName||"Assessment")}</strong></div><div class="item"><span>Date released</span><strong>${esc(safeDate(r.releasedAt||r.date))}</strong></div><div class="score">${esc(r.score??"—")} / ${esc(r.outOf??"—")}</div><div class="item"><span>Grade</span><strong>${esc(r.grade||"Not specified")}</strong></div><div class="item"><span>Instructor comment</span><strong>${esc(r.comment||"—")}</strong></div><p class="foot">Official student result issued by Nextface Modelling Institute. Keep this document for your records.</p><script>window.onload=()=>setTimeout(()=>window.print(),250);<\/script></body></html>`);w.document.close();}));
  renderList("materialsList",materials.filter(m=>m.published===true),m=>`<article class="portal-course"><div class="course-topline">${esc(m.type||"LEARNING RESOURCE")}</div><h3>${esc(m.title||"Learning material")}</h3><p>${esc(m.description||"")}</p>${m.url?`<a class="under-link" href="${esc(m.url)}" target="_blank" rel="noopener">OPEN MATERIAL ↗</a>`:"<small>Resource link pending</small>"}</article>`,"Your instructors have not published learning materials yet.");
  $("portalStatus").hidden=true;
 }catch(err){console.error("Nextface student dashboard load failed:",err);const status=$("portalStatus");if(status){status.hidden=false;status.textContent="Dashboard loading error: "+(err?.code||err?.message||String(err));} }
});
async function startBuiltInExam(exam,user,existingAttempts=[]){
 if(!exam || !auth.currentUser)return;
 const host=$("studentAssessments");
 const alreadySubmitted=(existingAttempts||[]).some(a=>a.examId===exam.id);
 if(alreadySubmitted){alert("You have already submitted this examination. Check your examination history.");return;}
 try{
  // Use the attempts already loaded for this student. This avoids a compound
  // ownerUid + examId query that can fail when Firestore has no composite index.
  const snap=await getDocs(query(collection(db,"examQuestions"),where("examId","==",exam.id)));
  const questions=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>Number(a.order||0)-Number(b.order||0));
  if(!questions.length){alert("This examination has no questions yet. Ask the institute to add questions and publish it again.");return;}
  const malformed=questions.find(q=>!q.question || !["mcq","essay"].includes(q.type) || (q.type==="mcq" && (!Array.isArray(q.options)||q.options.length<2)));
  if(malformed){alert("This examination contains an incomplete question. Please contact the institute.");return;}
  const duration=Math.max(1,Number(exam.duration||30))*60;
  let remaining=duration,finished=false,interval=null;
  const renderQuestion=(q,index)=>`<div class="exam-question"><p><strong>${index+1}. ${esc(q.question)}</strong> <small>(${esc(q.marks)} marks)</small></p>${q.type==="mcq"?q.options.map((o,i)=>`<label class="exam-option"><input type="radio" name="answer-${esc(q.id)}" value="${i}"> ${esc(o)}</label>`).join(""):`<textarea class="exam-essay" data-question="${esc(q.id)}" rows="5" placeholder="Write your answer here..."></textarea>`}</div>`;
  host.innerHTML=`<article class="portal-card exam-paper"><div class="course-topline">${esc(exam.type||"EXAMINATION")} · ${esc(exam.courseName||"")}</div><h2>${esc(exam.title||"Examination")}</h2><p>${esc(exam.instructions||"Answer all questions before submitting.")}</p><div class="exam-timer" id="examTimer">Time remaining: ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")}</div><form id="builtInExamForm">${questions.map(renderQuestion).join("")}<button class="button button-gold" type="submit">SUBMIT EXAMINATION</button> <button class="dashboard-action" type="button" id="cancelExam">CANCEL</button></form></article>`;
  const form=$("builtInExamForm"),timer=$("examTimer");
  const submitExam=async(autoSubmit=false)=>{
   if(finished)return;finished=true;if(interval)clearInterval(interval);
   const answers=questions.map(q=>({questionId:q.id,type:q.type,answer:q.type==="mcq"?(form.querySelector(`input[name="answer-${q.id}"]:checked`)?.value??""):form.querySelector(`textarea[data-question="${q.id}"]`)?.value||"",marks:Number(q.marks||0)}));
   if(!autoSubmit && !confirm("Submit your examination now? You cannot change your answers afterwards.")){finished=false;interval=setInterval(tick,1000);return;}
   const submitButton=form.querySelector('button[type="submit"]');if(submitButton)submitButton.disabled=true;
   try{
    const mcqOutOf=questions.filter(q=>q.type==="mcq").reduce((n,q)=>n+Number(q.marks||0),0);
    const essayOutOf=questions.filter(q=>q.type==="essay").reduce((n,q)=>n+Number(q.marks||0),0);
    await addDoc(collection(db,"examAttempts"),{examId:exam.id,examTitle:exam.title||"Examination",ownerUid:auth.currentUser.uid,answers,mcqScore:0,mcqOutOf,essayOutOf,essayScore:0,status:"submitted",submittedAt:serverTimestamp(),duration:Number(exam.duration||30)});
    alert(autoSubmit?"Time is up. Your examination has been submitted.":"Your examination has been submitted successfully. Your instructor will mark your answers and release your result.");
    window.location.reload();
   }catch(err){console.error("Nextface exam submission failed:",err);finished=false;if(submitButton)submitButton.disabled=false;alert("Your answers could not be submitted: "+(err?.code||err?.message||"Please check your connection and try again."));}
  };
  function tick(){remaining--;timer.textContent=`Time remaining: ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")}`;if(remaining<=0){clearInterval(interval);submitExam(true);}}
  interval=setInterval(tick,1000);
  $("cancelExam").addEventListener("click",()=>{if(confirm("Leave this examination? Your answers will not be submitted.")){if(interval)clearInterval(interval);window.location.reload();}});
  form.addEventListener("submit",e=>{e.preventDefault();submitExam(false);});
 }catch(err){console.error("Nextface examination could not start:",err);alert("Unable to load this examination: "+(err?.code||err?.message||"Please try again."));}
}

$("supportTicketForm")?.addEventListener("submit",async e=>{
 e.preventDefault();
 const f=e.currentTarget,v=Object.fromEntries(new FormData(f).entries());
 const button=f.querySelector("button[type=submit]"); button.disabled=true;
 try{
  await addDoc(collection(db,"support"),{ownerUid:auth.currentUser.uid,email:auth.currentUser?.email||"",subject:(v.subject||"").trim(),message:(v.message||"").trim(),status:"open",createdAt:serverTimestamp()});
  f.reset(); $("supportTicketStatus").textContent="Your support request has been sent to the institute.";
  const refreshed=await readCollectionSafe("support",[where("ownerUid","==",auth.currentUser.uid)]);
  renderList("studentSupportTickets",refreshed,t=>'<article class="portal-card"><h3>'+esc(t.subject||"Support request")+'</h3><p>'+esc(t.message||"")+'</p><p>'+esc(t.reply||"Awaiting an institute reply.")+'</p></article>',"You have not submitted any support requests.");
 }catch(err){console.error("Nextface support submission failed:",err);$("supportTicketStatus").textContent="Could not submit your request: "+(err?.code||err?.message||"Please try again.");}
 finally{button.disabled=false;}
});

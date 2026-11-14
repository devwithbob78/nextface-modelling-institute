NEXTFACE MODELLING INSTITUTE — ACADEMIC PORTAL UPGRADE

This package builds on the existing Nextface site and retains its existing pages and features, including course catalogue/pricing, student fee invoices and receipts, admin dashboard, timetable, attendance, announcements, materials, and results.

STUDENT DASHBOARD
- My Courses: published programmes and course details.
- Timetable: published theory sessions appear before other session types.
- Lessons: published lesson notes and optional external resource links.
- Tests & Examinations: published assessments and built-in timed examinations.
- Examination History: shows submitted attempts, status, and final score after grading.
- Results: released results can be viewed and downloaded/printed as PDF.

BUILT-IN EXAMINATIONS
- Admin creates an assessment and enters questions as a JSON array in the admin form.
- MCQ question format:
  {"type":"mcq","question":"Question text?","options":["Option A","Option B","Option C"],"answer":0,"marks":2}
- Essay question format:
  {"type":"essay","question":"Explain your answer.","marks":10}
- MCQ answer keys are stored in the admin-only examAnswerKeys collection. Student-readable examQuestions documents do not contain correct answers.
- Students can submit one attempt per assessment. The timer submits the paper when time expires.
- In the admin dashboard, review an attempt, enter essay marks and feedback, then click AUTO-MARK MCQ, SAVE & RELEASE RESULT. MCQs are automatically marked at this stage; essays are graded by the instructor. The combined result is published to the student's Results page and examination history.

IMPORTANT TECHNICAL LIMITATION
This static Firebase Spark site does not use a trusted server/Cloud Function. For that reason, MCQ marking is performed by the administrator dashboard when the instructor releases the result, while the answer keys remain inaccessible to student accounts. This avoids exposing correct answers to students. Do not describe it as instant server-side grading at the moment of submission.

DEPLOYMENT
1. Back up the current GitHub repository before replacing files.
2. Extract this ZIP and upload the contents of nextface_phase2 to the repository root, replacing matching files.
3. In Firebase Console > Firestore Database > Rules, replace the rules with the included firestore.rules and Publish.
4. Do not manually create examAnswerKeys documents for students. The admin assessment form creates the question and answer-key records.
5. Test with a separate student account and an admin account. Create a sample exam with one MCQ and one essay, submit as the student, grade/release as admin, then verify the result and history as the student.

The package has JavaScript syntax checks only. Live Firebase deployment, rules behavior, and end-to-end student/admin flows must be tested after upload.

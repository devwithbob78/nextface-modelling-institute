NEXTFACE MODELLING INSTITUTE — PHASE 3 PORTAL UPGRADE
=====================================================

WHAT IS INCLUDED
- Responsive student portal with overview, courses, fee invoices, timetable, classes,
  attendance, results, learning materials, announcements, profile and support sections.
- Administrator console with role verification and basic management for courses,
  timetable entries, announcements, invoices and student profile viewing.
- Login now checks the admins/{UID} record and routes approved administrators to admin.html.
- Updated Firestore rules for the collections used by the portals.

IMPORTANT DEPLOYMENT STEPS
1. Extract this ZIP.
2. Upload/replace the files in the nextface_phase2 folder at the ROOT of your existing
   GitHub repository. Do not upload the enclosing folder itself.
3. Commit the changes and wait for GitHub Pages to publish.
4. In Firebase Console > Firestore Database > Rules, replace the rules with firestore.rules
   and Publish.
5. Test with a normal student account and a separate approved admin account.

ADMIN ACCOUNT
- Admin access is determined by existence of admins/{Firebase Auth UID}.
- Never create admin records through the public website.
- Keep the existing admin document and its exact UID. The rules do not permit client writes
  to the admins collection.

DATA SETUP
- Add courses from Admin > Courses. Set Published to show the course in the student portal.
- Add timetable entries from Admin > Timetable.
- Publish institute notices from Admin > Announcements.
- Issue invoices from Admin > Issue fees using the student's Firebase Authentication UID.
- Student fee records are stored in fees/{auto-id}, with ownerUid, description, amount,
  amountPaid, dueDate and status.
- Student course enrolment records use enrollments/{auto-id} with ownerUid and courseId.
- Attendance and results must include ownerUid to be visible to that student.\n- Create enrolments from Admin > Enrolments using the exact course document ID and student UID.
- Materials must have published=true to appear in the student portal.

IMPORTANT LIMITATIONS / SECURITY
- This is a static GitHub Pages frontend using Firebase Authentication and Firestore.
- Fee invoices are NOT payment processing. No money is collected or verified by this portal.
  Do not mark a fee paid based only on a screenshot or student claim.
- Payment records remain client-write locked. Integrate a trusted payment provider backend
  and server-side verification before enabling online payments.
- File uploads are not implemented. Storage is currently unavailable on the Firebase Spark
  plan shown in the project. Material links can be added by an administrator once hosted
  on an approved public resource.
- Live video classes, automatic email notifications, certificates, messaging, staff accounts,
  attendance marking UI, results entry UI, and full application/enrolment approval workflows
  are not yet implemented. The portal provides student-facing sections and database
  foundations, not those complete workflows.
- Firestore queries require records to follow the field names described above.
- Review Firestore rules before publishing and test student/admin access separately.
- Do not collect children's photographs, sensitive personal information or payments until
  the institute has appropriate guardian consent and safeguarding procedures.

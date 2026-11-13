NEXTFACE MODELLING INSTITUTE — PHASE 2 STARTER
================================================

This package adds a first Firebase Authentication + Firestore connection to the existing Phase 1 website.

FILES
- index.html / styles.css / index.js: public site and Student Portal link
- firebase.js: Firebase project configuration and SDK initialization
- auth.html / login.html / auth.js: adult learner or parent/guardian account creation, sign-in and password reset
- dashboard.html / dashboard.js: private account overview
- admin.html / admin.js: administrator access check (does not grant admin privileges)
- firestore.rules: starter Firestore security rules

DEPLOY TO THE EXISTING GITHUB REPOSITORY
1. Download and extract this ZIP on your phone.
2. Open the existing GitHub repository: nextface-modelling-institute.
3. Upload/replace all files from this folder in the repository root. Keep the files together.
4. Commit changes. GitHub Pages should publish the update after a short delay.

FIRESTORE SECURITY RULES — IMPORTANT
1. In Firebase Console > Firestore Database > Rules.
2. Replace the current rules with the contents of firestore.rules.
3. Review, then Publish. Do this before testing registration.
4. The rules allow each signed-in account to read its own basic profile, public course reads, and owner/admin access patterns for applications. They deny client writes to payments and admin records.

FIREBASE AUTHORIZED DOMAIN
1. Firebase Console > Authentication > Settings > Authorized domains.
2. Add: devwithbob78.github.io
3. Keep the existing Firebase domains. Do not add a domain you do not control.

TESTING
1. Visit https://devwithbob78.github.io/nextface-modelling-institute/auth.html
2. Create a test account using an adult learner or parent/guardian account type.
3. Check the email inbox for Firebase verification.
4. Sign in at /login.html.
5. The account page is /dashboard.html.

ADMIN ACCESS — DO NOT SELF-ASSIGN
1. Create the owner's account through the normal registration page.
2. Firebase Console > Authentication > Users: copy that user's UID.
3. Firestore Data > Start collection: admins.
4. Document ID must be the exact UID. Add a field such as active = true.
5. The admin page checks for this admins/{UID} document. Public users cannot create or edit admin records under the supplied rules.
6. Keep the project owner Google account secure. Do not share passwords or service-account keys.

IMPORTANT LIMITATIONS / COST SAFETY
- Keep Firebase on the Spark plan. Do not link a billing account or upgrade to Blaze.
- Firebase web config (including apiKey) is public client configuration; Firestore Rules and Authentication authorized domains are essential. Never publish service-account private keys.
- This is an initial authentication/profile foundation, not a complete student management system. It does not yet implement course enrollment workflows, admin CRUD tools, live-class scheduling, payments, or email delivery from a custom domain.
- The enquiry form is still a demo and does not save to Firestore.
- The account flow is limited to adults and parents/legal guardians. Do not create accounts directly for children or collect children's photos, dates of birth, sensitive details or payment information until the institute has approved a compliant guardian consent and safeguarding process.
- Payments are not connected. Never store card numbers or CVVs in Firestore. Payment records should be written only by a trusted payment-verification backend.
- GitHub Pages serves static files only. Firebase Authentication and Firestore are separate backend services.

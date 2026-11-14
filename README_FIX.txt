NEXTFACE DASHBOARD STABILITY FIX

Changed files only:
- dashboard.js
- admin.js

What this fixes:
1. Student dashboard data collections now load independently. A permission error or unavailable collection no longer prevents all other dashboard sections from rendering.
2. Student profile lookup failure is logged and handled without stopping the remaining dashboard.
3. Student support ticket submission now reads the signed-in email from auth.currentUser instead of an out-of-scope variable named user.
4. Admin dashboard collections also load independently, so one failing collection does not blank the entire admin console.

Installation:
1. Back up the current repository files.
2. Upload dashboard.js and admin.js from this folder to the repository root, replacing the existing files.
3. Commit the changes and wait for GitHub Pages to deploy.
4. Refresh the student and admin dashboards.

Firestore rules:
The supplied project rules already include access rules for every collection referenced by these two dashboards, including lessons and instructors. Do not replace Firestore rules for this specific fix. If a section still shows empty, inspect the browser console for the exact collection and Firebase error code before changing permissions.

This patch improves failure isolation and fixes the support form scope error. It does not prove every Firebase operation is live-tested; verify each dashboard section after deployment.

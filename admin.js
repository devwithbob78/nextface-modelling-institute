import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";
const status = document.getElementById("adminStatus");
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.replace("auth.html"); return; }
  try {
    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (!adminDoc.exists()) {
      status.textContent = "Access denied. This account has not been approved as an administrator.";
      return;
    }
    status.textContent = "Administrator access confirmed. The management tools will be added in the next build.";
  } catch (error) {
    status.textContent = "Unable to verify administrator access. Check Firestore rules.";
  }
});
document.getElementById("adminLogout").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "auth.html";
});

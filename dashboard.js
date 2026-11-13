import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const nameEl = document.getElementById("memberName");
const emailEl = document.getElementById("memberEmail");
const typeEl = document.getElementById("memberType");
const verifyEl = document.getElementById("verifyNotice");
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.replace("auth.html"); return; }
  emailEl.textContent = user.email || "";
  verifyEl.textContent = user.emailVerified ? "Email verified" : "Please verify your email using the link we sent you.";
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const profile = snap.data();
      nameEl.textContent = profile.fullName || "Member";
      typeEl.textContent = profile.accountType === "parent_guardian" ? "Parent / Guardian account" : "Adult learner account";
    } else {
      nameEl.textContent = "Member";
      typeEl.textContent = "Profile not found. Please contact the institute.";
    }
  } catch (error) {
    nameEl.textContent = "Member";
    typeEl.textContent = "Unable to load profile. Check Firestore rules.";
  }
});
document.getElementById("logoutButton").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "auth.html";
});

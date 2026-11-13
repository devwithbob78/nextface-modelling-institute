import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const status = document.getElementById("authStatus");
const showStatus = (message, error = false) => {
  if (!status) return;
  status.textContent = message;
  status.style.color = error ? "#ff9b91" : "#d8bd7b";
};
const friendlyError = (error) => {
  const messages = {
    "auth/email-already-in-use": "That email already has an account. Please sign in instead.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Please choose a stronger password (at least 6 characters).",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Please wait a while and try again."
  };
  return messages[error.code] || "Something went wrong. Please try again.";
};

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const accountType = document.getElementById("accountType").value;
    const consent = document.getElementById("adultConsent").checked;
    if (!consent) return showStatus("Please confirm that you are 18+ or the parent/legal guardian making this enquiry.", true);
    try {
      showStatus("Creating your account…");
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", credential.user.uid), {
        fullName: name,
        email,
        accountType,
        createdAt: serverTimestamp()
      });
      await sendEmailVerification(credential.user);
      showStatus("Account created. Please check your email for a verification link. Opening your dashboard…");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 1600);
    } catch (error) {
      showStatus(friendlyError(error), true);
    }
  });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      showStatus("Signing you in…");
      const credential = await signInWithEmailAndPassword(
        auth,
        document.getElementById("loginEmail").value.trim(),
        document.getElementById("loginPassword").value
      );
      const adminRecord = await getDoc(doc(db, "admins", credential.user.uid));
      window.location.href = adminRecord.exists() ? "admin.html" : "dashboard.html";
    } catch (error) {
      showStatus(friendlyError(error), true);
    }
  });
}

const resetButton = document.getElementById("resetPassword");
if (resetButton) {
  resetButton.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value.trim();
    if (!email) return showStatus("Enter your email address first, then tap Forgot password.", true);
    try {
      await sendPasswordResetEmail(auth, email);
      showStatus("Password reset email sent. Check your inbox.");
    } catch (error) {
      showStatus(friendlyError(error), true);
    }
  });
}

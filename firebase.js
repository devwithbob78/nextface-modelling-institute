// Nextface Modelling Institute — Firebase web configuration
// Firebase web config is intended for client-side use. Secure access with Firestore Rules.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB6xm4zpUNS3pK-9OeaqOT6VdUfTCHphMI",
  authDomain: "nextface-modelling-institute.firebaseapp.com",
  projectId: "nextface-modelling-institute",
  storageBucket: "nextface-modelling-institute.firebasestorage.app",
  messagingSenderId: "219565164851",
  appId: "1:219565164851:web:916fa81ab842b95f441646"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

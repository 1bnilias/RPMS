// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCqf9sMKj_Y1TJ8WhePy3cl8YxmWuBC4YM",
  authDomain: "rpms-9f6ae.firebaseapp.com",
  projectId: "rpms-9f6ae",
  storageBucket: "rpms-9f6ae.firebasestorage.app",
  messagingSenderId: "188230072181",
  appId: "1:188230072181:web:c1098bb36dd0fb528cc53c",
  measurementId: "G-NZ8LDZ4HPL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Initialize Firestore
const analytics = getAnalytics(app);

export { db }; // Export the Firestore instance
export default app; // Export the Firebase app instance
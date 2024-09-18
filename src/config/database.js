import { initializeApp } from "firebase/app";
import { getFirestore } from "@firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFT4rjvcG0vWQP4_BffAeNYS-2zZJksfk",
  authDomain: "pos-app-apin.firebaseapp.com",
  projectId: "pos-app-apin",
  storageBucket: "pos-app-apin.appspot.com",
  messagingSenderId: "121963451694",
  appId: "1:121963451694:web:252b25a8a935012cde16bf",
  measurementId: "G-48M07WXXFC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const dbImage = getStorage(app);
export const auth = getAuth(app);

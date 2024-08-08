import { initializeApp } from "firebase/app";
import { getFirestore } from "@firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDVYg29kdM9VQtNLqGXPDOKFjiDShS6f8",
  authDomain: "prototype-qfoozb.firebaseapp.com",
  projectId: "prototype-qfoozb",
  storageBucket: "prototype-qfoozb.appspot.com",
  messagingSenderId: "907799920979",
  appId: "1:907799920979:web:278b5991d7a4cb994f21a6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const dbImage = getStorage(app);
export const auth = getAuth(app);

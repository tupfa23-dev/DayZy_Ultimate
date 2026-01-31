// /src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBRyRLAlwWnJan9TtxwVRAOiNP9zJnExR8",
  authDomain: "dayzy-c9040.firebaseapp.com",
  projectId: "dayzy-c9040",
  storageBucket: "dayzy-c9040.firebasestorage.app",
  messagingSenderId: "849940276018",
  appId: "1:849940276018:web:49fec40131579c4bcc6d2b",
  measurementId: "G-RZFJD0JN12"
};

// Initialize firebase app
const app = initializeApp(firebaseConfig);

// Exports (ใช้ชื่อนี้ให้ตรงกับที่โค้ดอื่นเรียก)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

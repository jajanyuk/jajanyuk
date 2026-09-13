import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// ============================================================
// FIREBASE CONFIG
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyBKKsFvBJluM1PJfYCFsgR3ZfxF-JOKPKE",
  authDomain: "jajanyuk-2c7d8.firebaseapp.com",
  projectId: "jajanyuk-2c7d8",
  storageBucket: "jajanyuk-2c7d8.firebasestorage.app",
  messagingSenderId: "1085631977756",
  appId: "1:1085631977756:web:fe71dd21ce51fb3f7502d9",
  measurementId: "G-NQGH73XS1L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================
// COLLECTIONS
// ============================================================
const ordersCol   = collection(db, 'orders');
const depositsCol = collection(db, 'deposits');
const settingsCol = collection(db, 'settings');
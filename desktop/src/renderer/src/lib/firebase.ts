import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyBDxRPHc6ylXY5tZc63o4buEaSZIF65GjU",
  authDomain: "mydrive-torrent.firebaseapp.com",
  projectId: "mydrive-torrent",
  storageBucket: "mydrive-torrent.firebasestorage.app",
  messagingSenderId: "285864546140",
  appId: "1:285864546140:web:c3adb0ba4fbf6d8b8c3b99"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export const db2 = getDatabase(app);
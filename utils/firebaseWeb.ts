import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBfBd_6W9AndpyPJW0gPsBUvlyiG21UWjc",
  authDomain: "stproject-1dbc9.firebaseapp.com",
  projectId: "stproject-1dbc9",
  storageBucket: "stproject-1dbc9.firebasestorage.app",
  messagingSenderId: "1018607704367",
  appId: "1:1018607704367:android:458fd1820d5683b8b7a9da",
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const authWeb = getAuth(app);

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyArcVxFsd9hA6Z5eZr8sw35VVqAtdhYXCI",
  authDomain: "stproject-1dbc9.firebaseapp.com",
  databaseURL: "https://stproject-1dbc9.firebaseio.com",
  projectId: "stproject-1dbc9",
  storageBucket: "stproject-1dbc9.firebasestorage.app",
  messagingSenderId: "1018607704367",
  appId: "1:1018607704367:web:9fdd7d80becbb726b7a9da",
  measurementId: "G-8MPP79EK23"
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const authWeb = getAuth(app);

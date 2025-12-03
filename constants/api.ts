import { Platform } from 'react-native';

// =======================================================================
// API CONFIGURATION
// =======================================================================

// 1. FOR LOCAL DEVELOPMENT (Recommended for testing new features)
// Replace '10.56.226.180' with your computer's local IP address.
// You can find it by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux).
const LOCAL_IP = '10.56.226.180';

const LOCAL_URL = Platform.OS === 'android'
    ? `http://${LOCAL_IP}:3000/api`  // Android Emulator/Device needs IP
    : 'http://localhost:3000/api';   // iOS Simulator / Web can use localhost

// 2. FOR PRODUCTION (Render Deployment)
const PROD_URL = 'https://findmate-backend-her6.onrender.com/api';

// TOGGLE THIS: Set to true to use the deployed server, false for local
const USE_PROD = true; // Changed to true to use deployed backend

export const API_URL = USE_PROD ? PROD_URL : LOCAL_URL;

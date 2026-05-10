import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-ignore — metro bundler sometimes hides this
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  projectId: 'studio-6613366678-b4207',
  appId: '1:557965420799:web:2766c5a04e3bd40f7384ca',
  apiKey: 'AIzaSyCXqlZwo44HSS3BOVNTFP8o0xO4aOxwbVo',
  authDomain: 'studio-6613366678-b4207.firebaseapp.com',
  messagingSenderId: '557965420799',
};

// Initialize Firebase (singleton)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth with AsyncStorage persistence for React Native
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // If auth was already initialized (hot reload), reuse it
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };

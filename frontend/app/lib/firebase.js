import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyAqCCcbwxAyd-p6AYQUbGFigPJFUypqCH8',
  authDomain: 'lifeos-5706c.firebaseapp.com',
  projectId: 'lifeos-5706c',
  storageBucket: 'lifeos-5706c.firebasestorage.app',
  messagingSenderId: '933703748186',
  appId: '1:933703748186:web:19f5b80f0526f89366a663',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const getFirebaseMessaging = async () => {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
};
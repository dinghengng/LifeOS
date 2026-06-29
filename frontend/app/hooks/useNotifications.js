import { useEffect } from 'react';
import { getFirebaseMessaging } from '../lib/firebase';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export function useNotifications() {
  useEffect(() => {
    registerWebPush();
  }, []);
}

export async function registerWebPush() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return; 

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // const permission = await Notification.requestPermission();
    // if (permission !== 'granted') {
    //   console.log('Notification permission denied');
    //   return;
    // }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return;

    const { getToken } = await import('firebase/messaging');

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      serviceWorkerRegistration: registration,
    });

    console.log('FCM token obtained:', token ? 'yes' : 'empty'); // test

    if (!token) {
      console.warn('Empty FCM token, check VAPID key env var');
      return;
    }

    await fetch(`${BACKEND_URL}/api/notifications/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform: 'web' })
    });

    console.log('Web push registered');
  } catch (err) {
    console.error('Web push registration error:', err.message);
  }
}
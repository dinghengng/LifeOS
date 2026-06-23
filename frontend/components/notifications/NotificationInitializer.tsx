'use client';

import { useNotifications } from '../../app/hooks/useNotifications';

export default function NotificationInitializer() {
  useNotifications();
  return null;
}
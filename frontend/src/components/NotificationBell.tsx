import { useEffect, useState, useCallback, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { api, NotificationItem } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const POLL_INTERVAL_MS = 20_000;

const NotificationBell = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await api.notifications.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silently fail for polling
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const page = await api.notifications.getNotifications({ size: 10 });
      setNotifications(page.data);
      setUnreadCount(page.data.filter((n) => !n.isRead).length);
    } catch {
      // silently fail
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    fetchUnreadCount();
    fetchNotifications();

    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, fetchUnreadCount, fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-md text-muted-foreground transition-colors hover:text-primary"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('notifications.title')}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={handleMarkAllRead}
            >
              <Check className="mr-1 h-3 w-3" />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t('notifications.empty')}
          </div>
        ) : (
          notifications.slice(0, 10).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start gap-1 px-3 py-2 cursor-pointer ${
                !n.isRead ? 'bg-muted/50' : ''
              }`}
              onClick={() => {
                if (!n.isRead) handleMarkRead(n.id);
              }}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="text-sm font-medium leading-tight">{n.message}</span>
                {!n.isRead && (
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {n.createdAt ? n.createdAt.replace('T', ' ').slice(0, 16) : ''}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;

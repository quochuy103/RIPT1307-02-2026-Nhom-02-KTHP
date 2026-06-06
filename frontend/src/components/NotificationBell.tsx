import { useEffect, useState, useCallback, useRef, type UIEvent } from 'react';
import { Bell, Check, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api, NotificationItem } from '@/lib/api';
import { getLocalizedNotification } from '@/lib/notification-i18n';
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
const NOTIFICATION_PAGE_SIZE = 5;

const mergeNotifications = (current: NotificationItem[], incoming: NotificationItem[]) => {
  const seen = new Set<number>();
  return [...current, ...incoming].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const NotificationBell = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await api.notifications.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silently fail for polling
    }
  }, [isAuthenticated]);

  const loadNotificationsPage = useCallback(async (pageNumber: number, replace = false) => {
    if (!isAuthenticated) return;
    try {
      const page = await api.notifications.getNotifications({
        page: pageNumber,
        size: NOTIFICATION_PAGE_SIZE,
      });
      setNotifications((prev) => (replace ? page.data : mergeNotifications(prev, page.data)));
      setCurrentPage(page.meta.page);
      setHasMore(page.meta.page + 1 < page.meta.totalPages);
    } catch {
      // silently fail
    }
  }, [isAuthenticated]);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsRefreshing(true);
    setIsLoadingList(true);
    try {
      const [count, page] = await Promise.all([
        api.notifications.getUnreadCount(),
        api.notifications.getNotifications({ page: 0, size: NOTIFICATION_PAGE_SIZE }),
      ]);
      setUnreadCount(count);
      setNotifications(page.data);
      setCurrentPage(page.meta.page);
      setHasMore(page.meta.page + 1 < page.meta.totalPages);
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    } catch {
      // silently fail
    } finally {
      setIsRefreshing(false);
      setIsLoadingList(false);
    }
  }, [isAuthenticated]);

  const loadMoreNotifications = useCallback(async () => {
    if (!isAuthenticated || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      await loadNotificationsPage(currentPage + 1);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isAuthenticated, isLoadingMore, loadNotificationsPage]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setNotifications([]);
      setCurrentPage(0);
      setHasMore(false);
      return;
    }
    void refreshNotifications();

    intervalRef.current = setInterval(() => {
      void fetchUnreadCount();
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, fetchUnreadCount, refreshNotifications]);

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

  const getNotificationHref = (notification: NotificationItem) => {
    if (!notification.referenceId) return null;
    if (notification.referenceType === 'booking') {
      return `/my-bookings?focus=${notification.referenceId}`;
    }
    if (notification.referenceType === 'order') {
      return `/my-orders?focus=${notification.referenceId}`;
    }
    return null;
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await handleMarkRead(notification.id);
    }
    const href = getNotificationHref(notification);
    setOpen(false);
    if (href) {
      navigate(href);
    }
  };

  const handleListScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasMore || isLoadingMore) return;
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - scrollTop - clientHeight <= 24) {
      void loadMoreNotifications();
    }
  };

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          void refreshNotifications();
        }
      }}
    >
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={t('notifications.refresh', { defaultValue: 'Refresh notifications' })}
              onClick={() => {
                void refreshNotifications();
              }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
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
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoadingList && notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t('notifications.loading', { defaultValue: 'Loading notifications...' })}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t('notifications.empty')}
          </div>
        ) : (
          <div
            ref={listRef}
            className="max-h-[360px] overflow-y-auto"
            onScroll={handleListScroll}
          >
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={`flex flex-col items-start gap-1 px-3 py-2 cursor-pointer ${
                  !n.isRead ? 'bg-muted/50' : ''
                }`}
                onClick={() => {
                  void handleNotificationClick(n);
                }}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="text-sm font-medium leading-tight">{getLocalizedNotification(n, t)}</span>
                  {!n.isRead && (
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {n.createdAt ? n.createdAt.replace('T', ' ').slice(0, 16) : ''}
                </span>
              </DropdownMenuItem>
            ))}
            {hasMore && (
              <div className="border-t border-border/60 px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  disabled={isLoadingMore}
                  onClick={() => {
                    void loadMoreNotifications();
                  }}
                >
                  {isLoadingMore
                    ? t('notifications.loadingMore', { defaultValue: 'Loading more...' })
                    : t('notifications.loadMore', { defaultValue: 'Load more notifications' })}
                </Button>
              </div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;

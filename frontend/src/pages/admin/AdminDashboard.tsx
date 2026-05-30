import { CalendarDays, DollarSign, ShoppingCart, Users } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { AdminBooking, AdminOrder, AdminUser } from '@/data/adminMockData';
import { ApiError, api, type PaginatedResult } from '@/lib/api';
import StatsCard from '@/components/admin/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  confirmed: 'default',
  done: 'secondary',
  cancelled: 'destructive',
  pending: 'outline',
};

type DashboardData = Awaited<ReturnType<typeof api.admin.getDashboardStats>>;

const DASHBOARD_PAGE_SIZE = 200;
const COMPLETE_ORDER_STATUSES = new Set(['paid', 'shipping', 'shipped', 'delivered']);

const parseDateValue = (value?: string | null) => {
  if (!value) return null;

  const normalized = value.includes('T') ? value : `${value}T00:00:00`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isBetween = (date: Date | null, from: Date, to: Date) => (
  !!date && date.getTime() >= from.getTime() && date.getTime() < to.getTime()
);

const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round((((current - previous) / previous) * 100) * 10) / 10;
};

const isCompletedOrder = (status: string) => COMPLETE_ORDER_STATUSES.has(status.toLowerCase());
const isCompletedBooking = (status: string) => status.toLowerCase() === 'done';

const fetchAllPages = async <T,>(fetchPage: (page: number) => Promise<PaginatedResult<T>>) => {
  const firstPage = await fetchPage(0);

  if (firstPage.totalPages <= 1) {
    return firstPage.content;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) => fetchPage(index + 1)),
  );

  return [...firstPage.content, ...remainingPages.flatMap((page) => page.content)];
};

const sumOrderRevenueInRange = (orders: AdminOrder[], from: Date, to: Date) => (
  orders.reduce((sum, order) => (
    isCompletedOrder(order.status) && isBetween(parseDateValue(order.createdAt), from, to)
      ? sum + order.totalPrice
      : sum
  ), 0)
);

const sumBookingRevenueInRange = (bookings: AdminBooking[], from: Date, to: Date) => (
  bookings.reduce((sum, booking) => (
    isCompletedBooking(booking.status) && isBetween(parseDateValue(booking.date), from, to)
      ? sum + booking.price
      : sum
  ), 0)
);

const buildFallbackDashboard = async (): Promise<DashboardData> => {
  const [bookings, orders, users] = await Promise.all([
    fetchAllPages((page) => api.admin.getBookingsFiltered({
      page,
      size: DASHBOARD_PAGE_SIZE,
      sort: ['date,desc', 'time,desc'],
    })),
    fetchAllPages((page) => api.admin.getOrdersFiltered({
      page,
      size: DASHBOARD_PAGE_SIZE,
      sort: ['createdAt,desc'],
    })),
    fetchAllPages((page) => api.admin.getUsersFiltered({
      page,
      size: DASHBOARD_PAGE_SIZE,
      sort: ['createdAt,desc', 'id,desc'],
    })),
  ]);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
  const activeUsers = users.filter((user) => !user.deleted);

  const currentBookings = bookings.filter((booking) => isBetween(parseDateValue(booking.date), thirtyDaysAgo, now)).length;
  const previousBookings = bookings.filter((booking) => isBetween(parseDateValue(booking.date), sixtyDaysAgo, thirtyDaysAgo)).length;

  const currentOrders = orders.filter((order) => isBetween(parseDateValue(order.createdAt), thirtyDaysAgo, now)).length;
  const previousOrders = orders.filter((order) => isBetween(parseDateValue(order.createdAt), sixtyDaysAgo, thirtyDaysAgo)).length;

  const currentUsers = activeUsers.filter((user) => isBetween(parseDateValue(user.createdAt), thirtyDaysAgo, now)).length;
  const previousUsers = activeUsers.filter((user) => isBetween(parseDateValue(user.createdAt), sixtyDaysAgo, thirtyDaysAgo)).length;

  const totalRevenue = sumOrderRevenueInRange(orders, new Date(2000, 0, 1), new Date(2100, 0, 1))
    + sumBookingRevenueInRange(bookings, new Date(2000, 0, 1), new Date(2100, 0, 1));
  const currentRevenue = sumOrderRevenueInRange(orders, thirtyDaysAgo, now)
    + sumBookingRevenueInRange(bookings, thirtyDaysAgo, now);
  const previousRevenue = sumOrderRevenueInRange(orders, sixtyDaysAgo, thirtyDaysAgo)
    + sumBookingRevenueInRange(bookings, sixtyDaysAgo, thirtyDaysAgo);

  const revenueData = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const nextMonthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);

    return {
      month: monthDate.toLocaleString('en-US', { month: 'short' }),
      revenue: sumOrderRevenueInRange(orders, monthDate, nextMonthDate)
        + sumBookingRevenueInRange(bookings, monthDate, nextMonthDate),
      bookings: bookings.filter((booking) => isBetween(parseDateValue(booking.date), monthDate, nextMonthDate)).length,
    };
  });

  return {
    stats: {
      totalBookings: bookings.length,
      bookingGrowth: calculateGrowth(currentBookings, previousBookings),
      totalRevenue,
      revenueGrowth: calculateGrowth(currentRevenue, previousRevenue),
      totalUsers: activeUsers.length,
      userGrowth: calculateGrowth(currentUsers, previousUsers),
      totalOrders: orders.length,
      orderGrowth: calculateGrowth(currentOrders, previousOrders),
    },
    revenueData,
    recentBookings: bookings.slice(0, 5).map((booking) => ({
      id: booking.id,
      userName: booking.userName,
      serviceName: booking.serviceName,
      barberName: booking.barberName,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      price: booking.price,
    })),
  };
};

const AdminDashboard = () => {
  const { t } = useTranslation();

  const { data: dashboardData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      try {
        return await api.admin.getDashboardStats();
      } catch (queryError) {
        if (queryError instanceof ApiError && queryError.status === 404) {
          return buildFallbackDashboard();
        }

        throw queryError;
      }
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
        <h3 className="text-lg font-semibold">
          {t('admin.dashboardLoadError', { defaultValue: 'Không thể tải dashboard' })}
        </h3>
        <p className="text-sm">{error instanceof Error ? error.message : t('admin.common.loadFallback')}</p>
      </div>
    );
  }

  const { stats, revenueData, recentBookings } = dashboardData || {
    stats: {
      totalBookings: 0,
      bookingGrowth: 0,
      totalRevenue: 0,
      revenueGrowth: 0,
      totalUsers: 0,
      userGrowth: 0,
      totalOrders: 0,
      orderGrowth: 0,
    },
    revenueData: [],
    recentBookings: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.dashboard')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.welcome')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title={t('admin.stats.totalBookings')} value={stats.totalBookings.toLocaleString()} icon={CalendarDays} growth={stats.bookingGrowth} />
        <StatsCard title={t('admin.stats.totalRevenue')} value={`${stats.totalRevenue.toLocaleString('vi-VN')}đ`} icon={DollarSign} growth={stats.revenueGrowth} />
        <StatsCard title={t('admin.stats.totalUsers')} value={stats.totalUsers.toLocaleString()} icon={Users} growth={stats.userGrowth} />
        <StatsCard title={t('admin.stats.totalOrders')} value={stats.totalOrders.toLocaleString()} icon={ShoppingCart} growth={stats.orderGrowth} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t('admin.stats.revenueOverTime')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(value) => (
                    value >= 1000000 ? `${value / 1000000}M` : value.toLocaleString('vi-VN')
                  )}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(value: number | string) => [`${Number(value).toLocaleString('vi-VN')}đ`, t('admin.stats.totalRevenue')]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t('admin.stats.bookingTrends')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(value: number | string) => [`${value} ${t('admin.navigation.bookings').toLowerCase()}`, t('admin.navigation.bookings')]}
                />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">{t('admin.stats.recentBookings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>{t('admin.fields.client')}</TableHead>
                <TableHead>{t('admin.fields.service')}</TableHead>
                <TableHead>{t('admin.fields.barber')}</TableHead>
                <TableHead>{t('admin.fields.date')}</TableHead>
                <TableHead>{t('admin.fields.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBookings.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    {t('admin.table.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                recentBookings.map((booking) => (
                  <TableRow key={booking.id} className="border-border">
                    <TableCell className="font-medium">{booking.userName}</TableCell>
                    <TableCell>{booking.serviceName}</TableCell>
                    <TableCell>{booking.barberName}</TableCell>
                    <TableCell>{booking.date}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[booking.status.toLowerCase()] || 'outline'}>
                        {t(`admin.status.${booking.status.toLowerCase()}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

import { CalendarDays, DollarSign, Users, ShoppingCart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import StatsCard from '@/components/admin/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  confirmed: 'default',
  done: 'secondary',
  cancelled: 'destructive',
  pending: 'outline'
};

const AdminDashboard = () => {
  const { t } = useTranslation();

  const { data: dashboardData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: api.admin.getDashboardStats,
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
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive space-y-2">
        <h3 className="font-semibold text-lg">{t('admin.bookingsPage.loadError')}</h3>
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
      orderGrowth: 0
    },
    revenueData: [],
    recentBookings: []
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
          <CardHeader><CardTitle className="text-base">{t('admin.stats.revenueOverTime')}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(val) => `${val >= 1000000 ? (val / 1000000) + 'M' : val.toLocaleString('vi-VN')}`} />
                <Tooltip 
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} 
                  formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')}đ`, t('admin.stats.totalRevenue')]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-base">{t('admin.stats.bookingTrends')}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} 
                  formatter={(value: any) => [`${value} ${t('admin.navigation.bookings').toLowerCase()}`, t('admin.navigation.bookings')]}
                />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base">{t('admin.stats.recentBookings')}</CardTitle></CardHeader>
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
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    {t('admin.table.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                recentBookings.map((b) => (
                  <TableRow key={b.id} className="border-border">
                    <TableCell className="font-medium">{b.userName}</TableCell>
                    <TableCell>{b.serviceName}</TableCell>
                    <TableCell>{b.barberName}</TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[b.status] || 'outline'}>
                        {t(`admin.status.${b.status}`)}
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

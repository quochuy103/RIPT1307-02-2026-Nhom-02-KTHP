import { CalendarDays, DollarSign, Users, ShoppingCart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import StatsCard from '@/components/admin/StatsCard';
import { dashboardStats, revenueData, mockBookings } from '@/data/adminMockData';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from 'react-i18next';

const AdminDashboard = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.dashboard')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.welcome')}</p>
      </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard title={t('admin.stats.totalBookings')} value={dashboardStats.totalBookings.toLocaleString()} icon={CalendarDays} growth={dashboardStats.bookingGrowth} />
      <StatsCard title={t('admin.stats.totalRevenue')} value={dashboardStats.totalRevenue.toLocaleString()} icon={DollarSign} growth={dashboardStats.revenueGrowth} prefix="$" />
      <StatsCard title={t('admin.stats.totalUsers')} value={dashboardStats.totalUsers.toLocaleString()} icon={Users} growth={dashboardStats.userGrowth} />
      <StatsCard title={t('admin.stats.totalOrders')} value={dashboardStats.totalOrders.toLocaleString()} icon={ShoppingCart} growth={dashboardStats.orderGrowth} />
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base">{t('admin.stats.revenueOverTime')}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
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
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
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
              <TableHead>{t('admin.fields.client')}</TableHead><TableHead>{t('admin.fields.service')}</TableHead><TableHead>{t('admin.fields.barber')}</TableHead><TableHead>{t('admin.fields.date')}</TableHead><TableHead>{t('admin.fields.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockBookings.slice(0, 5).map((b) => (
              <TableRow key={b.id} className="border-border">
                <TableCell className="font-medium">{b.userName}</TableCell>
                <TableCell>{b.serviceName}</TableCell>
                <TableCell>{b.barberName}</TableCell>
                <TableCell>{b.date}</TableCell>
                <TableCell>
                  <Badge variant={b.status === 'confirmed' ? 'default' : b.status === 'done' ? 'secondary' : b.status === 'cancelled' ? 'destructive' : 'outline'}>
                    {t(`admin.status.${b.status}`)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </div>
  );
};

export default AdminDashboard;

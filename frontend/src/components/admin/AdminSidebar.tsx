import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarDays, Scissors, UserCheck,
  Package, ShoppingCart, Image, Star, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const navItems = [
  { labelKey: 'admin.navigation.dashboard', icon: LayoutDashboard, path: '/admin' },
  { labelKey: 'admin.navigation.users', icon: Users, path: '/admin/users' },
  { labelKey: 'admin.navigation.bookings', icon: CalendarDays, path: '/admin/bookings' },
  { labelKey: 'admin.navigation.services', icon: Scissors, path: '/admin/services' },
  { labelKey: 'admin.navigation.barbers', icon: UserCheck, path: '/admin/barbers' },
  { labelKey: 'admin.navigation.products', icon: Package, path: '/admin/products' },
  { labelKey: 'admin.navigation.orders', icon: ShoppingCart, path: '/admin/orders' },
  { labelKey: 'admin.navigation.gallery', icon: Image, path: '/admin/gallery' },
  { labelKey: 'admin.navigation.reviews', icon: Star, path: '/admin/reviews' },
  { labelKey: 'admin.navigation.settings', icon: Settings, path: '/admin/settings' },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar = ({ collapsed, onToggle }: Props) => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className={cn('flex items-center border-b border-border px-4 h-16', collapsed ? 'justify-center' : 'gap-3')}>
        <Scissors className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && <span className="truncate font-display text-sm font-bold text-foreground">{t('admin.brand')}</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? t(item.labelKey) : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
};

export default AdminSidebar;

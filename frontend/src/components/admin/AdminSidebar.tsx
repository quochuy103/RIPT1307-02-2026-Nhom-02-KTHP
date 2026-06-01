import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarDays, Scissors, UserCheck,
  Package, ShoppingCart, Image, Star, Settings, ChevronLeft, ChevronRight, X
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
  mobileOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const AdminSidebar = ({ collapsed, mobileOpen, onClose, onToggle }: Props) => {
  const location = useLocation();
  const { t } = useTranslation();
  const shouldCollapse = collapsed && !mobileOpen;

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-xl transition-transform duration-300 lg:relative lg:z-auto lg:max-w-none lg:shadow-none',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        shouldCollapse ? 'lg:w-16' : 'lg:w-64'
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-border px-4', shouldCollapse ? 'lg:justify-center' : 'justify-between lg:justify-start lg:gap-3')}>
        <Scissors className="h-6 w-6 text-primary shrink-0" />
        {!shouldCollapse && <span className="truncate font-display text-sm font-bold text-foreground">{t('admin.brand')}</span>}
        <button
          type="button"
          aria-label="Close admin navigation"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                shouldCollapse && 'lg:justify-center lg:px-2'
              )}
              title={shouldCollapse ? t(item.labelKey) : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!shouldCollapse && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground lg:flex"
      >
        {shouldCollapse ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
};

export default AdminSidebar;

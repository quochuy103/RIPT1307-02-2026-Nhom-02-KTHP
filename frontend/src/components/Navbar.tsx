import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, User, Scissors, Globe, LogOut } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationBell from '@/components/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/services', labelKey: 'nav.services' },
  { to: '/booking', labelKey: 'nav.bookNow' },
  { to: '/shop', labelKey: 'nav.shop' },
  { to: '/gallery', labelKey: 'nav.gallery' },
  { to: '/about', labelKey: 'nav.about' },
  { to: '/contact', labelKey: 'nav.contact' },
];

const getInitials = (name?: string | null) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout({ redirectTo: '/', showToast: true });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <Scissors className="h-5 w-5 shrink-0 text-primary sm:h-6 sm:w-6" />
            <span className="max-w-[150px] truncate font-display text-sm font-bold text-gradient-gold sm:max-w-[210px] sm:text-base md:max-w-none md:text-xl">
              Lì He Men's Hair Designer
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === link.to ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            <button
              onClick={toggleLang}
              aria-label="Toggle language"
              className="flex items-center gap-1 rounded-md p-2 text-[11px] font-bold text-muted-foreground transition-colors hover:text-primary sm:text-xs"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{i18n.language === 'vi' ? 'EN' : 'VI'}</span>
            </button>
            <NotificationBell />
            {user?.role !== 'admin' && (
              <button
                onClick={() => setIsCartOpen(true)}
                aria-label="Open cart"
                className="relative rounded-md p-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
            )
            }
            {
              isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || 'User'} />
                        <AvatarFallback className="text-xs">{getInitials(user?.name)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="space-y-1">
                      <span className="block font-medium text-foreground">{user?.name}</span>
                      <span className="block text-xs font-normal text-muted-foreground">{user?.email}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user?.role === 'admin' ? (
                      <DropdownMenuItem asChild>
                        <Link to="/admin">{t('admin.dashboard')}</Link>
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/profile">{t('nav.profile')}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/my-bookings">{t('nav.myBookings')}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/my-orders">{t('nav.myOrders')}</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth" className="rounded-md p-2 text-muted-foreground transition-colors hover:text-primary" aria-label="Sign in">
                  <User className="h-5 w-5" />
                </Link>
              )
            }
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:text-primary md:hidden"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div >
        </div >
      </div >

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg"
          >
            <div className="container mx-auto flex max-h-[calc(100vh-4rem)] flex-col gap-3 overflow-y-auto px-4 py-4">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`py-2 text-sm font-medium transition-colors ${location.pathname === link.to ? 'text-primary' : 'text-muted-foreground'
                    }`}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  {user?.role === 'admin' ? (
                    <Link
                      to="/admin"
                      className="py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      {t('admin.dashboard')}
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/profile"
                        className="py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                      >
                        {t('nav.profile')}
                      </Link>
                      <Link
                        to="/my-bookings"
                        className="py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                      >
                        {t('nav.myBookings')}
                      </Link>
                      <Link
                        to="/my-orders"
                        className="py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                      >
                        {t('nav.myOrders')}
                      </Link>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 py-2 text-sm font-medium text-destructive transition-colors hover:text-destructive/80"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {t('auth.signIn')}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav >
  );
};

export default Navbar;

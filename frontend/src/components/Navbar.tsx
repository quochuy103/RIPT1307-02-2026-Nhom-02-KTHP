import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, User, Scissors, Globe, LogOut } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
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

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout({ redirectTo: '/', showToast: true });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold text-gradient-gold">BLADE & CO</span>
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
            {isAuthenticated && (
              <Link
                to="/my-bookings"
                className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/my-bookings' ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                {t('nav.myBookings')}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="p-2 text-muted-foreground hover:text-primary transition-colors text-xs font-bold flex items-center gap-1">
              <Globe className="h-4 w-4" />
              {i18n.language === 'vi' ? 'EN' : 'VI'}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="space-y-1">
                    <span className="block font-medium text-foreground">{user?.name}</span>
                    <span className="block text-xs font-normal text-muted-foreground">{user?.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/my-bookings">{t('nav.myBookings')}</Link>
                  </DropdownMenuItem>
                  {user?.role === 'admin' && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth" className="p-2 text-muted-foreground hover:text-primary transition-colors">
                <User className="h-5 w-5" />
              </Link>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={`py-2 text-sm font-medium transition-colors ${location.pathname === link.to ? 'text-primary' : 'text-muted-foreground'
                    }`}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/my-bookings"
                    onClick={() => setIsOpen(false)}
                    className={`py-2 text-sm font-medium transition-colors ${location.pathname === '/my-bookings' ? 'text-primary' : 'text-muted-foreground'
                      }`}
                  >
                    {t('nav.myBookings')}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 py-2 text-sm font-medium text-destructive transition-colors hover:text-destructive/80"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsOpen(false)}
                  className="py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {t('auth.signIn')}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

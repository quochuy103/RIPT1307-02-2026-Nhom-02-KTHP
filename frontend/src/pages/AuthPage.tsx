import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scissors } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SocialLoginButtons from '@/components/SocialLoginButtons';


const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Redirect to the page that triggered the login, or home/admin depending on role.
  // Role is read from localStorage because React state may not be flushed yet
  // at the point navigate() is called (persistAuth writes to localStorage synchronously).
  const getRedirectPath = () => {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
    if (from && from !== '/auth') return from;
    try {
      const raw = localStorage.getItem('cutie_cuts_user');
      const storedUser = raw ? (JSON.parse(raw) as { role?: string }) : null;
      return storedUser?.role === 'admin' ? '/admin' : '/';
    } catch {
      return '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!form.email || !form.password) { toast.error(t('auth.fillAll')); return; }

    try {
      setIsSubmitting(true);

      if (!isLogin) {
        if (!form.name) { toast.error(t('auth.nameRequired')); return; }
        if (form.password !== form.confirmPassword) { toast.error(t('auth.passwordMismatch')); return; }
        await register(form.name, form.email, form.password);
        toast.success(t('auth.accountCreated'));
      } else {
        await login(form.email, form.password);
        toast.success(t('auth.welcomeBackToast'));
      }

      navigate(getRedirectPath());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <Scissors className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold">{isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{isLogin ? t('auth.signInSubtitle') : t('auth.signUpSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
          {!isLogin && (
            <Input placeholder={t('auth.fullName')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-border" />
          )}
          <Input type="email" placeholder={t('auth.email')} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="bg-secondary border-border" />
          <Input type="password" placeholder={t('auth.password')} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="bg-secondary border-border" />
          {!isLogin && (
            <Input type="password" placeholder={t('auth.confirmPassword')} value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} className="bg-secondary border-border" />
          )}
          <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {isSubmitting ? 'Please wait...' : isLogin ? t('auth.signIn') : t('auth.signUp')}
          </Button>
          <SocialLoginButtons disabled={isSubmitting} />
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
            <button type="button" disabled={isSubmitting} onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium disabled:opacity-50">
              {isLogin ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default AuthPage;

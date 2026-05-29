import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scissors, Mail, Lock, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SocialLoginButtons from '@/components/SocialLoginButtons';

type AuthStep = 'login' | 'register' | 'forgot-password' | 'verify-email' | 'reset-password';

const AuthPage = () => {
  const [step, setStep] = useState<AuthStep>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [emailForOtp, setEmailForOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { login, register, verifyEmail, resendVerification, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Handle changes in individual OTP digit slots
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Allow only digits

    const nextDigits = [...otpDigits];
    nextDigits[index] = value.slice(-1); // Only keep the last character typed
    setOtpDigits(nextDigits);

    // Auto-focus next input if a number is typed
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Focus previous input on backspace if current slot is empty
      const nextDigits = [...otpDigits];
      nextDigits[index - 1] = '';
      setOtpDigits(nextDigits);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return; // Ensure it's exactly 6 digits

    const nextDigits = pasteData.split('');
    setOtpDigits(nextDigits);
    otpRefs.current[5]?.focus();
  };

  // Redirect to the page that triggered the login, or home/admin depending on role.
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

  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (step === 'login') {
      if (!form.email || !form.password) { toast.error(t('auth.fillAll')); return; }
      try {
        setIsSubmitting(true);
        await login(form.email, form.password);
        toast.success(t('auth.welcomeBackToast'));
        navigate(getRedirectPath());
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Authentication failed';
        toast.error(errMsg);
        
        // EXCELLENT UX: If backend tells us email is not verified, send them directly to OTP verification
        if (errMsg.toLowerCase().includes('verified') || errMsg.toLowerCase().includes('chưa xác thực')) {
          setEmailForOtp(form.email);
          setOtpDigits(['', '', '', '', '', '']);
          setStep('verify-email');
          // Trigger resend cooldown initially just in case
          setResendCooldown(60);
        }
      } finally {
        setIsSubmitting(false);
      }
    } else if (step === 'register') {
      if (!form.name || !form.email || !form.password) { toast.error(t('auth.fillAll')); return; }
      if (form.password.length < 8) {
        toast.error('Mật khẩu phải có ít nhất 8 ký tự.');
        return;
      }
      if (form.password !== form.confirmPassword) { toast.error(t('auth.passwordMismatch')); return; }
      
      try {
        setIsSubmitting(true);
        await register(form.name, form.email, form.password);
        toast.success('Mã OTP xác thực tài khoản đã được gửi tới email của bạn.');
        setEmailForOtp(form.email);
        setOtpDigits(['', '', '', '', '', '']);
        setStep('verify-email');
        setResendCooldown(60);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Registration failed');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Submit OTP Verification
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      toast.error('Vui lòng nhập đầy đủ mã xác nhận 6 chữ số.');
      return;
    }

    try {
      setIsSubmitting(true);
      await verifyEmail(emailForOtp, otp);
      toast.success('Xác thực email thành công! Bây giờ bạn có thể đăng nhập.');
      setForm((prev) => ({ ...prev, email: emailForOtp, password: '' }));
      setStep('login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Xác thực OTP thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend verification OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      setIsSubmitting(true);
      await resendVerification(emailForOtp);
      toast.success('Mã OTP mới đã được gửi vào email của bạn.');
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi lại mã');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForOtp) {
      toast.error('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }

    try {
      setIsSubmitting(true);
      await forgotPassword(emailForOtp);
      toast.success('Nếu email tồn tại, hệ thống đã gửi mã đặt lại mật khẩu.');
      setOtpDigits(['', '', '', '', '', '']);
      setStep('reset-password');
      setResendCooldown(60);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Yêu cầu thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Reset Password Request
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      toast.error('Vui lòng nhập đầy đủ mã xác nhận 6 chữ số.');
      return;
    }
    if (!newPassword || !confirmNewPassword) {
      toast.error('Vui lòng điền đầy đủ mật khẩu mới.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Mật khẩu nhập lại không trùng khớp.');
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(emailForOtp, otp, newPassword);
      toast.success('Đặt lại mật khẩu thành công! Hãy đăng nhập với mật khẩu mới.');
      setForm((prev) => ({ ...prev, email: emailForOtp, password: '' }));
      setStep('login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Đặt lại mật khẩu thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md mx-4"
      >
        {/* Brand Icon & Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="inline-block"
          >
            <Scissors className="h-10 w-10 text-primary mx-auto mb-3" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {step === 'login' && t('auth.welcomeBack')}
            {step === 'register' && t('auth.createAccount')}
            {step === 'verify-email' && 'Xác Thực Email'}
            {step === 'forgot-password' && 'Quên Mật Khẩu'}
            {step === 'reset-password' && 'Đặt Lại Mật Khẩu'}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {step === 'login' && t('auth.signInSubtitle')}
            {step === 'register' && t('auth.signUpSubtitle')}
            {step === 'verify-email' && `Chúng tôi đã gửi mã xác nhận 6 số tới ${emailForOtp}`}
            {step === 'forgot-password' && 'Nhập email để nhận mã khôi phục tài khoản'}
            {step === 'reset-password' && 'Nhập mã OTP từ email và mật khẩu mới'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP: LOGIN OR REGISTER */}
          {(step === 'login' || step === 'register') && (
            <motion.div
              key="auth-forms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleMainSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md">
                {step === 'register' && (
                  <div className="relative">
                    <Input 
                      placeholder={t('auth.fullName')} 
                      value={form.name} 
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))} 
                      className="bg-secondary/40 border-border pl-10 h-11 focus:ring-primary focus:border-primary" 
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>
                )}
                
                <div className="relative">
                  <Input 
                    type="email" 
                    placeholder={t('auth.email')} 
                    value={form.email} 
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} 
                    className="bg-secondary/40 border-border pl-10 h-11" 
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="h-5 w-5" />
                  </div>
                </div>

                <div className="relative">
                  <Input 
                    type="password" 
                    placeholder={t('auth.password')} 
                    value={form.password} 
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))} 
                    className="bg-secondary/40 border-border pl-10 h-11" 
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </div>
                </div>

                {step === 'register' && (
                  <div className="relative">
                    <Input 
                      type="password" 
                      placeholder={t('auth.confirmPassword')} 
                      value={form.confirmPassword} 
                      onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} 
                      className="bg-secondary/40 border-border pl-10 h-11" 
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                      <Lock className="h-5 w-5" />
                    </div>
                  </div>
                )}

                {step === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEmailForOtp(form.email);
                        setStep('forgot-password');
                      }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-semibold text-base transition-all rounded-xl shadow-md shadow-primary/20"
                >
                  {isSubmitting ? 'Vui lòng đợi...' : step === 'login' ? t('auth.signIn') : t('auth.signUp')}
                </Button>

                <SocialLoginButtons disabled={isSubmitting} />

                <p className="text-center text-sm text-muted-foreground pt-2">
                  {step === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                  <button 
                    type="button" 
                    disabled={isSubmitting} 
                    onClick={() => setStep(step === 'login' ? 'register' : 'login')} 
                    className="text-primary hover:underline font-semibold disabled:opacity-50"
                  >
                    {step === 'login' ? t('auth.signUp') : t('auth.signIn')}
                  </button>
                </p>
              </form>
            </motion.div>
          )}

          {/* STEP: VERIFY EMAIL OTP */}
          {step === 'verify-email' && (
            <motion.div
              key="verify-email"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleVerifyEmail} className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-6 backdrop-blur-md">
                
                {/* Custom 6-digit OTP Inputs */}
                <div className="flex justify-center gap-2 py-2">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 text-center text-2xl font-bold bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                    />
                  ))}
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-semibold rounded-xl"
                >
                  {isSubmitting ? 'Đang xác thực...' : 'Xác Nhận Kích Hoạt'}
                </Button>

                {/* Resend Cooldown UI */}
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('register');
                      setForm((prev) => ({ ...prev, email: emailForOtp }));
                    }}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium"
                  >
                    <ArrowLeft className="h-4 w-4" /> Quay lại
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isSubmitting}
                    onClick={handleResendOtp}
                    className="flex items-center gap-1 text-primary hover:underline font-semibold disabled:opacity-50 disabled:no-underline"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSubmitting && 'animate-spin'}`} />
                    {resendCooldown > 0 ? `Gửi lại mã (${resendCooldown}s)` : 'Gửi lại mã'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP: FORGOT PASSWORD */}
          {step === 'forgot-password' && (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleForgotPassword} className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md">
                
                <div className="relative">
                  <Input 
                    type="email" 
                    placeholder="Nhập địa chỉ email của bạn" 
                    value={emailForOtp} 
                    onChange={e => setEmailForOtp(e.target.value)} 
                    className="bg-secondary/40 border-border pl-10 h-11" 
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="h-5 w-5" />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-semibold rounded-xl"
                >
                  {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi Mã Xác Nhận'}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-medium pt-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Quay về Đăng nhập
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP: RESET PASSWORD */}
          {step === 'reset-password' && (
            <motion.div
              key="reset-password"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleResetPassword} className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md">
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Mã OTP (6 chữ số):</label>
                  <div className="flex justify-center gap-2 py-1">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={handleOtpPaste}
                        className="w-12 h-13 text-center text-xl font-bold bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:outline-none transition-all"
                      />
                    ))}
                  </div>
                </div>

                <div className="relative space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Mật khẩu mới:</label>
                  <div className="relative">
                    <Input 
                      type="password" 
                      placeholder="Mật khẩu mới ít nhất 6 ký tự" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      className="bg-secondary/40 border-border pl-10 h-11" 
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                      <Lock className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="relative space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Xác nhận mật khẩu mới:</label>
                  <div className="relative">
                    <Input 
                      type="password" 
                      placeholder="Nhập lại mật khẩu mới" 
                      value={confirmNewPassword} 
                      onChange={e => setConfirmNewPassword(e.target.value)} 
                      className="bg-secondary/40 border-border pl-10 h-11" 
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                      <Lock className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-semibold rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
                </Button>

                <div className="flex items-center justify-between text-sm pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('forgot-password')}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium"
                  >
                    <ArrowLeft className="h-4 w-4" /> Quay lại
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isSubmitting}
                    onClick={async () => {
                      if (resendCooldown > 0) return;
                      try {
                        setIsSubmitting(true);
                        await forgotPassword(emailForOtp);
                        toast.success('Mã OTP khôi phục mới đã được gửi.');
                        setResendCooldown(60);
                        setOtpDigits(['', '', '', '', '', '']);
                        otpRefs.current[0]?.focus();
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : 'Yêu cầu thất bại');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="text-primary hover:underline font-semibold disabled:opacity-50 disabled:no-underline"
                  >
                    {resendCooldown > 0 ? `Gửi lại mã (${resendCooldown}s)` : 'Gửi lại mã'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AuthPage;

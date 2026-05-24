import { useState, useEffect, useRef, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Minus,
  Plus,
  Trash2,
  CheckCircle,
  Loader2,
  QrCode,
  Banknote,
  Clock,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, ApiError, type PaymentInfo, type Order } from '@/lib/api';
import { formatVND } from '@/lib/format';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = 'QR' | 'COD';

type CheckoutStep =
  | 'idle'
  | 'creating_order'
  | 'creating_payment'
  | 'waiting_payment'
  | 'payment_success'
  | 'payment_failed'
  | 'payment_expired'
  | 'order_success'; // COD success

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 10 * 60 * 1_000; // 10 minutes

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format seconds into mm:ss */
const formatCountdown = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};



// ─── Component ────────────────────────────────────────────────────────────────

const CheckoutPage = () => {
  const { items, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QR');
  const [step, setStep] = useState<CheckoutStep>('idle');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [countdown, setCountdown] = useState<number>(300); // 5 min in seconds

  const { t } = useTranslation();
  const navigate = useNavigate();

  // Polling refs — kept in refs so the interval closure always sees fresh values
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSubmitting = step === 'creating_order' || step === 'creating_payment';

  // ── Stop polling ───────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Expiry countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'waiting_payment' || !payment?.expiredAt) return;

    // Backend sends LocalDateTime without timezone (no 'Z' suffix).
    // Docker/server runs UTC. Browser in Vietnam is UTC+7.
    // Without 'Z', new Date() parses as local time → 7h behind actual UTC time → immediate expiry.
    // Fix: always treat the timestamp as UTC by appending 'Z' if missing.
    const rawExpiredAt = payment.expiredAt;
    const utcString = rawExpiredAt.endsWith('Z') || rawExpiredAt.includes('+') || rawExpiredAt.includes('-', 10)
      ? rawExpiredAt
      : rawExpiredAt + 'Z';
    const expiry = new Date(utcString).getTime();

    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setCountdown(remaining);
      // Only trigger expiry if truly 0 (not NaN from a bad date parse)
      if (remaining === 0 && !isNaN(expiry)) {
        stopPolling();
        setStep('payment_expired');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [step, payment?.expiredAt, stopPolling]);

  // ── Start polling ─────────────────────────────────────────────────────────
  const startPolling = useCallback(
    (paymentCode: string) => {
      stopPolling();

      pollRef.current = setInterval(async () => {
        try {
          const latest = await api.payments.getByCode(paymentCode);
          setPayment(latest);

          if (latest.status === 'COMPLETED') {
            stopPolling();
            setStep('payment_success');
            toast.success(t('checkout.paymentSuccess'));
          } else if (latest.status === 'EXPIRED') {
            stopPolling();
            setStep('payment_expired');
          }
        } catch {
          // Non-fatal — keep polling
        }
      }, POLL_INTERVAL_MS);

      timeoutRef.current = setTimeout(() => {
        stopPolling();
        // Only expire if still waiting
        setStep((prev) => (prev === 'waiting_payment' ? 'payment_expired' : prev));
      }, POLL_TIMEOUT_MS);
    },
    [stopPolling, t],
  );

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error(t('checkout.cartEmpty'));
      return;
    }
    if (!form.address.trim()) {
      toast.error(t('checkout.fillAll'));
      return;
    }

    // ── Step 1: Create order ──────────────────────────────────────────────
    setStep('creating_order');
    let order: Order;
    try {
      order = await api.orders.create({
        address: form.address.trim(),
        items: items.map((item) => ({
          productId: Number(item.product.id),
          quantity: item.quantity,
        })),
      });
    } catch (error) {
      setStep('idle');
      if (error instanceof ApiError) {
        if (error.status === 401) {
          toast.error(t('checkout.errorUnauthenticated'));
          navigate('/auth');
          return;
        }
        if (error.status === 409) {
          toast.error(t('checkout.errorStock'));
          return;
        }
        if (error.status === 400) {
          toast.error(
            t('checkout.errorValidation', { defaultValue: error.message || 'Invalid order details.' }),
          );
          return;
        }
      }
      toast.error(
        error instanceof Error
          ? error.message
          : t('checkout.errorServer', { defaultValue: 'Order failed. Please try again.' }),
      );
      return;
    }

    // Order created — safe to clear cart now
    setCreatedOrder(order);
    clearCart();

    // ── Step 2: COD path ──────────────────────────────────────────────────
    if (paymentMethod === 'COD') {
      setStep('order_success');
      return;
    }

    // ── Step 3: QR payment path ───────────────────────────────────────────
    setStep('creating_payment');
    try {
      const paymentInfo = await api.payments.create(order.numericId);
      setPayment(paymentInfo);
      setStep('waiting_payment');
      startPolling(paymentInfo.paymentCode);
    } catch (error) {
      // Order was created but payment failed — inform user, don't reset order
      setStep('payment_failed');
      toast.error(
        error instanceof Error
          ? error.message
          : t('checkout.errorPayment', {
              defaultValue:
                'Payment initialization failed. Your order was created. Please try again from My Orders.',
            }),
      );
    }
  };

  // ─── COD / simple success screen ─────────────────────────────────────────
  if (step === 'order_success') {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <CheckCircle className="h-20 w-20 text-primary mx-auto mb-6" />
          <h2 className="font-display text-3xl font-bold mb-3">{t('checkout.orderPlaced')}</h2>
          <p className="text-muted-foreground mb-6">{t('checkout.thankYou')}</p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
              <Link to="/shop">{t('checkout.continueShopping')}</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/my-orders">{t('checkout.viewMyOrders')}</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── QR Payment Panel (waiting / success / expired / failed) ─────────────
  if (
    step === 'waiting_payment' ||
    step === 'payment_success' ||
    step === 'payment_expired' ||
    step === 'payment_failed'
  ) {
    const isSuccess = step === 'payment_success';
    const isExpired = step === 'payment_expired';
    const isFailed = step === 'payment_failed';
    const isWaiting = step === 'waiting_payment';

    return (
      <div className="pt-24 pb-20 min-h-screen">
        <div className="container mx-auto px-4 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            {isSuccess && <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />}
            {isExpired && <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />}
            {(isFailed || (isWaiting && !payment)) && (
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            )}
            {isWaiting && payment && (
              <div className="relative mx-auto w-16 h-16 mb-4">
                <QrCode className="h-16 w-16 text-primary" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-primary" />
                </span>
              </div>
            )}

            <h2 className="font-display text-2xl font-bold mb-1">
              {isSuccess && t('checkout.paymentSuccess')}
              {isExpired && t('checkout.paymentExpired')}
              {isFailed && t('checkout.paymentFailed')}
              {isWaiting && t('checkout.waitingPayment')}
            </h2>

            {isSuccess && <p className="text-muted-foreground">{t('checkout.paymentSuccessMsg')}</p>}
            {isExpired && <p className="text-muted-foreground">{t('checkout.paymentExpiredMsg')}</p>}
            {isFailed && <p className="text-muted-foreground text-sm">{t('checkout.errorPayment')}</p>}
          </motion.div>

          {/* QR Code Panel */}
          {payment && (isWaiting || isSuccess) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg"
            >
              {/* Status bar */}
              <div
                className={`px-6 py-3 flex items-center justify-between text-sm font-medium ${
                  isSuccess
                    ? 'bg-green-500/10 text-green-600 border-b border-green-500/20'
                    : 'bg-primary/10 text-primary border-b border-primary/20'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isWaiting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {isSuccess && <CheckCircle className="h-3.5 w-3.5" />}
                  <Badge
                    variant={isSuccess ? 'default' : 'secondary'}
                    className={isSuccess ? 'bg-green-500 hover:bg-green-500' : ''}
                  >
                    {payment.status}
                  </Badge>
                </span>
                {isWaiting && payment.expiredAt && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {t('checkout.expiresIn')} {formatCountdown(countdown)}
                  </span>
                )}
              </div>

              {/* QR Image — qrDataUrl is the actual data:image/png;base64 URL from VietQR.
                   qrCodeUrl is the raw EMVCo text string (not usable as img src).
                   Fallback: if VietQR is down and somehow null slips through, show manual
                   bank-transfer instructions so the user is never left with nothing. */}
              {payment.qrDataUrl ? (
                <div className="flex justify-center p-6 bg-white">
                  <img
                    src={payment.qrDataUrl}
                    alt={t('checkout.scanQR')}
                    className="w-56 h-56 object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 p-6 text-center border-b border-yellow-500/20 bg-yellow-500/5">
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-yellow-600">
                      {t('checkout.qrUnavailable', { defaultValue: 'QR code is not available' })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('checkout.manualTransferHint', {
                        defaultValue: 'Please use the bank details below to transfer manually.',
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Info rows */}
              <div className="px-6 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('checkout.orderId')}</span>
                  <span className="font-medium text-sm">#{createdOrder?.id ?? payment.orderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('checkout.paymentCode')}</span>
                  <span className="font-mono text-xs bg-secondary px-2 py-1 rounded select-all">
                    {payment.paymentCode}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">{t('checkout.paymentAmount')}</span>
                  <span className="font-bold text-primary text-lg">{formatVND(payment.amount)}</span>
                </div>

                {(payment.bankName || payment.bankAccount) && (
                  <div className="bg-secondary/50 rounded-lg p-3 space-y-1.5 text-sm">
                    {payment.bankName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('checkout.bankInfo')}</span>
                        <span className="font-medium">{payment.bankName}</span>
                      </div>
                    )}
                    {payment.bankAccount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('checkout.bankAccount')}</span>
                        <span className="font-mono font-medium select-all">{payment.bankAccount}</span>
                      </div>
                    )}
                  </div>
                )}

                {isWaiting && (
                  <p className="text-xs text-muted-foreground text-center pt-1 pb-2 leading-relaxed">
                    {t('checkout.qrInstruction')}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex flex-col gap-3">
            {isSuccess && (
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/my-orders">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {t('checkout.viewMyOrders')}
                </Link>
              </Button>
            )}
            {(isExpired || isFailed) && (
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/my-orders">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {t('checkout.viewMyOrders')}
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
              <Link to="/shop">{t('checkout.continueShopping')}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main checkout form ───────────────────────────────────────────────────
  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl font-bold mb-8 text-center"
        >
          <span className="text-gradient-gold">{t('checkout.title')}</span>
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── Cart items ── */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="font-display text-xl font-semibold mb-4">{t('checkout.yourCart')}</h2>
            {items.length === 0 ? (
              <p className="text-muted-foreground">
                {t('checkout.emptyCart')}{' '}
                <Link to="/shop" className="text-primary hover:underline">
                  {t('checkout.shopNow')}
                </Link>
              </p>
            ) : (
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-4 bg-card border border-border rounded-lg p-4"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-primary font-bold">{formatVND(item.product.price)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 bg-secondary rounded hover:bg-secondary/80 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 bg-secondary rounded hover:bg-secondary/80 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="font-bold text-primary self-center">
                      {formatVND(item.product.price * item.quantity)}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* ── Order summary + form ── */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
              <h2 className="font-display text-xl font-semibold mb-4">{t('checkout.orderSummary')}</h2>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-muted-foreground">{t('checkout.subtotal')}</span>
                <span>{formatVND(totalPrice)}</span>
              </div>
              <div className="flex justify-between mb-4 text-sm">
                <span className="text-muted-foreground">{t('checkout.shipping')}</span>
                <span>{t('checkout.free')}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-border pt-4 mb-6">
                <span>{t('checkout.total')}</span>
                <span className="text-primary">{formatVND(totalPrice)}</span>
              </div>

              <form onSubmit={handleOrder} className="space-y-3">
                <Input
                  placeholder={t('checkout.fullName')}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="bg-secondary border-border"
                />
                <Input
                  placeholder={t('checkout.phone')}
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="bg-secondary border-border"
                />
                <Textarea
                  placeholder={t('checkout.address')}
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  className="bg-secondary border-border"
                />

                {/* ── Payment method selector ── */}
                <div className="space-y-2 pt-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('checkout.paymentMethod')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="payment-method-qr"
                      onClick={() => setPaymentMethod('QR')}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-all ${
                        paymentMethod === 'QR'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                      }`}
                    >
                      <QrCode className="h-5 w-5" />
                      {t('checkout.payQR')}
                    </button>
                    <button
                      type="button"
                      id="payment-method-cod"
                      onClick={() => setPaymentMethod('COD')}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-all ${
                        paymentMethod === 'COD'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                      }`}
                    >
                      <Banknote className="h-5 w-5" />
                      {t('checkout.payCOD')}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  id="place-order-button"
                  disabled={isSubmitting || items.length === 0}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {step === 'creating_order' && (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.saving')}
                    </>
                  )}
                  {step === 'creating_payment' && (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('checkout.waitingPayment')}…
                    </>
                  )}
                  {step === 'idle' && t('checkout.placeOrder')}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

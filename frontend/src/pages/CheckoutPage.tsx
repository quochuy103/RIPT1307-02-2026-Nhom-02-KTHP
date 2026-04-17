import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, Trash2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';

const CheckoutPage = () => {
  const { items, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [ordered, setOrdered] = useState(false);
  const { t } = useTranslation();

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) { toast.error(t('checkout.fillAll')); return; }
    if (items.length === 0) { toast.error(t('checkout.cartEmpty')); return; }
    try {
      await api.createOrder({
        address: form.address,
        items: items.map((item) => ({
          productId: Number(item.product.id),
          quantity: item.quantity,
        })),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Order failed');
      return;
    }
    setOrdered(true);
    clearCart();
  };

  if (ordered) {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <CheckCircle className="h-20 w-20 text-primary mx-auto mb-6" />
          <h2 className="font-display text-3xl font-bold mb-3">{t('checkout.orderPlaced')}</h2>
          <p className="text-muted-foreground mb-6">{t('checkout.thankYou', { name: form.name })}</p>
          <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
            <Link to="/shop">{t('checkout.continueShopping')}</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl font-bold mb-8 text-center">
          <span className="text-gradient-gold">{t('checkout.title')}</span>
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <h2 className="font-display text-xl font-semibold mb-4">{t('checkout.yourCart')}</h2>
            {items.length === 0 ? (
              <p className="text-muted-foreground">{t('checkout.emptyCart')} <Link to="/shop" className="text-primary hover:underline">{t('checkout.shopNow')}</Link></p>
            ) : (
              items.map(item => (
                <div key={item.product.id} className="flex gap-4 bg-card border border-border rounded-lg p-4">
                  <img src={item.product.image} alt={item.product.name} className="w-20 h-20 object-cover rounded-md" />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-primary font-bold">${item.product.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 bg-secondary rounded"><Minus className="h-3 w-3" /></button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 bg-secondary rounded"><Plus className="h-3 w-3" /></button>
                      <button onClick={() => removeFromCart(item.product.id)} className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <p className="font-bold text-primary self-center">${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
              <h2 className="font-display text-xl font-semibold mb-4">{t('checkout.orderSummary')}</h2>
              <div className="flex justify-between mb-2 text-sm"><span className="text-muted-foreground">{t('checkout.subtotal')}</span><span>${totalPrice.toFixed(2)}</span></div>
              <div className="flex justify-between mb-4 text-sm"><span className="text-muted-foreground">{t('checkout.shipping')}</span><span>{t('checkout.free')}</span></div>
              <div className="flex justify-between font-bold text-lg border-t border-border pt-4 mb-6"><span>{t('checkout.total')}</span><span className="text-primary">${totalPrice.toFixed(2)}</span></div>

              <form onSubmit={handleOrder} className="space-y-3">
                <Input placeholder={t('checkout.fullName')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-border" />
                <Input placeholder={t('checkout.phone')} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="bg-secondary border-border" />
                <Textarea placeholder={t('checkout.address')} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="bg-secondary border-border" />
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">{t('checkout.placeOrder')}</Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

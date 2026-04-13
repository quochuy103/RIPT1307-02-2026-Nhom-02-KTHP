import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const CartSidebar = () => {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
            onClick={() => setIsCartOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" /> {t('cart.title')} ({totalItems})
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mb-4 opacity-30" />
                  <p>{t('cart.empty')}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {items.map(item => (
                    <div key={item.product.id} className="flex gap-3 bg-secondary/50 rounded-lg p-3">
                      <img src={item.product.image} alt={item.product.name} className="w-16 h-16 object-cover rounded-md" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{item.product.name}</h4>
                        <p className="text-primary font-bold text-sm">${item.product.price}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 bg-muted rounded hover:bg-primary/20 transition-colors">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 bg-muted rounded hover:bg-primary/20 transition-colors">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors self-start">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border p-4">
                <div className="flex justify-between mb-4">
                  <span className="font-medium">{t('cart.total')}</span>
                  <span className="text-primary font-bold text-lg">${totalPrice.toFixed(2)}</span>
                </div>
                <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsCartOpen(false)}>
                  <Link to="/checkout">{t('cart.checkout')}</Link>
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;

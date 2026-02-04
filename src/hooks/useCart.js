import { useState, useCallback } from 'react';

/**
 * Custom hook for cart management
 */
export function useCart() {
  const [cart, setCart] = useState([]);

  // Add single item to cart (increment qty if exists)
  const addToCart = useCallback((material) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === material.id);
      if (existing) {
        return prev.map(i => i.id === material.id ? {...i, qty: i.qty + 1} : i);
      }
      return [...prev, { ...material, qty: 1 }];
    });
  }, []);

  // Update quantity by delta
  const updateQty = useCallback((id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.qty + delta);
        return newQty === 0 ? null : {...i, qty: newQty};
      }
      return i;
    }).filter(Boolean));
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  // Add multiple items (used by AI suggestions)
  const addItemsToCart = useCallback((items) => {
    setCart(prev => {
      const updated = [...prev];
      items.forEach(item => {
        const existing = updated.find(i => i.id === item.id);
        if (existing) {
          existing.qty += item.qty;
        } else {
          updated.push(item);
        }
      });
      return updated;
    });
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  return {
    cart,
    setCart,
    addToCart,
    updateQty,
    removeFromCart,
    addItemsToCart,
    clearCart
  };
}

export default useCart;

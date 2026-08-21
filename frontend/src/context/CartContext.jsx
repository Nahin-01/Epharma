import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi } from '../api/cart.api';
import { useAuth } from './AuthContext';

const emptySummary = {
  cartId: null,
  items: [],
  itemCount: 0,
  subtotal: 0,
  couponCode: null,
  couponDiscount: 0,
  couponError: null,
  deliveryCharge: 0,
  total: 0,
  requiresPrescription: false,
  hasUnavailableItem: false,
  notes: '',
};

const CartContext = createContext(null);

// Cart data always comes live from the backend (GET /cart) — nothing about
// products, prices or totals is hardcoded on the frontend. This context just
// caches the last-fetched summary so the header badge / cart page stay in
// sync without every component re-fetching independently.
export function CartProvider({ children }) {
  // `authLoading` is true until AuthContext has finished checking whether a
  // stored token corresponds to a real, still-valid session (its own async
  // GET /users/me). Until that resolves we don't yet know the real value of
  // `isAuthenticated`, so we must not fetch (or decide) the cart yet either —
  // otherwise a fresh page load sees isAuthenticated=false (its initial
  // value), the cart is wrongly treated as "initialized and empty", and any
  // page gating on cart.items (e.g. Checkout) redirects away before the real
  // session/cart has had a chance to load.
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(emptySummary);
  const [loading, setLoading] = useState(false);
  // Distinct from `loading`: false until the very first fetch (or
  // authenticated-check) has resolved. Pages that redirect away when the
  // cart looks empty (e.g. Checkout) must wait for this before deciding —
  // otherwise a fresh page load races the initial GET /cart and sees the
  // empty default state before real data arrives.
  const [initialized, setInitialized] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(emptySummary);
      setInitialized(true);
      return emptySummary;
    }
    setLoading(true);
    try {
      const summary = await cartApi.get();
      setCart(summary);
      return summary;
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return; // wait for AuthContext's session restore to resolve first
    refresh().catch(() => setCart(emptySummary));
  }, [authLoading, refresh]);

  const addItem = useCallback(async (productId, quantity = 1) => {
    const summary = await cartApi.addItem(productId, quantity);
    setCart(summary);
    return summary;
  }, []);

  const updateItem = useCallback(async (productId, quantity) => {
    const summary = await cartApi.updateItem(productId, quantity);
    setCart(summary);
    return summary;
  }, []);

  const removeItem = useCallback(async (productId) => {
    const summary = await cartApi.removeItem(productId);
    setCart(summary);
    return summary;
  }, []);

  const clear = useCallback(async () => {
    const summary = await cartApi.clear();
    setCart(summary);
    return summary;
  }, []);

  const applyCoupon = useCallback(async (code) => {
    const summary = await cartApi.applyCoupon(code);
    setCart(summary);
    return summary;
  }, []);

  const value = useMemo(
    () => ({ cart, loading, initialized, refresh, addItem, updateItem, removeItem, clear, applyCoupon }),
    [cart, loading, initialized, refresh, addItem, updateItem, removeItem, clear, applyCoupon]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}

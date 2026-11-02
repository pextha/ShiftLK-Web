'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { LocalizedProduct } from '@/lib/db/schema.types';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  partNumber: string;
  brand: string;
  condition: string;
  sellingPrice: number;
  stockQty: number;
  weightKg: number;
  categorySlug?: string;
  image?: string;
  qty: number;
}

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (product: LocalizedProduct, qty?: number, openDrawer?: boolean) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  totalWeightKg: number;
  isAllStickers: boolean;
}

const CART_STORAGE_KEY = 'shiftlk_cart_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to load cart from localStorage:', err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to persist cart to localStorage:', err);
    }
  }, [items, isHydrated]);

  const addItem = (product: LocalizedProduct, qty: number = 1, openDrawer: boolean = true) => {
    if (product.stock_qty <= 0) return;

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const current = updated[existingIndex];
        const nextQty = Math.min(current.stockQty, current.qty + qty);
        updated[existingIndex] = {
          ...current,
          qty: nextQty,
        };
        return updated;
      }

      const initialQty = Math.min(product.stock_qty, Math.max(1, qty));
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          partNumber: product.part_number,
          brand: product.brand,
          condition: product.condition,
          sellingPrice: product.selling_price,
          stockQty: product.stock_qty,
          weightKg: product.weight_kg || 1.0,
          categorySlug: product.category_slug,
          image: product.images?.[0],
          qty: initialQty,
        },
      ];
    });

    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, qty: Math.min(item.stockQty, Math.max(1, qty)) }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItemsCount = useMemo(
    () => items.reduce((sum, item) => sum + item.qty, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.sellingPrice * item.qty, 0),
    [items]
  );

  const totalWeightKg = useMemo(
    () => items.reduce((sum, item) => sum + (item.weightKg || 1.0) * item.qty, 0),
    [items]
  );

  const isAllStickers = useMemo(
    () => items.length > 0 && items.every((item) => item.categorySlug === 'body-stickers'),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        setIsCartOpen,
        addItem,
        updateQty,
        removeItem,
        clearCart,
        totalItemsCount,
        subtotal,
        totalWeightKg,
        isAllStickers,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

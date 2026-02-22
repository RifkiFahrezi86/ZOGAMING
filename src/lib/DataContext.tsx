'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product, Category, SiteSettings, Badge } from './types';

interface DataContextType {
    products: Product[];
    categories: Category[];
    settings: SiteSettings;
    badges: Badge[];
    cart: CartItem[];
    addProduct: (product: Omit<Product, 'id'>) => void;
    updateProduct: (id: string, product: Partial<Product>) => void;
    deleteProduct: (id: string) => void;
    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (id: string, category: Partial<Category>) => void;
    deleteCategory: (id: string) => void;
    updateSettings: (settings: Partial<SiteSettings>) => void;
    addBadge: (badge: Omit<Badge, 'id'>) => void;
    updateBadge: (id: string, badge: Partial<Badge>) => void;
    deleteBadge: (id: string) => void;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getBadgeById: (id: string | null) => Badge | undefined;
    refreshData: () => Promise<void>;
}

interface CartItem {
    product: Product;
    quantity: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultSettings: SiteSettings = {
    siteName: 'ZOGAMING',
    logo: '/images/logo.svg',
    address: 'Sunny Isles Beach, FL 33160, United States',
    phone: '+123 456 7890',
    email: 'lugx@contact.com',
    heroTitle: 'BEST GAMING SITE EVER!',
    heroSubtitle: 'Welcome to ZOGAMING',
    heroDescription: 'ZOGAMING is your ultimate destination for the best video games. Browse our collection of action, adventure, strategy, and racing games.',
    bannerImages: [
        { id: 'bi1', title: 'TOP SELLER', imageUrl: '/images/Resident-Evil-Requiem.jpg', badge: 'best-seller', badgeColor: '#ef4444', badgeTextColor: '#ffffff', active: true },
        { id: 'bi2', title: 'BEST SELLER', imageUrl: '/images/trending-02.jpg', badge: 'best-seller', badgeColor: '#3b82f6', badgeTextColor: '#ffffff', active: true },
        { id: 'bi3', title: 'NEW RELEASE', imageUrl: '/images/trending-03.jpg', badge: 'new-release', badgeColor: '#10b981', badgeTextColor: '#ffffff', active: true },
        { id: 'bi4', title: 'PRE-ORDER NOW', imageUrl: '/images/trending-04.jpg', badge: 'pre-order', badgeColor: '#f59e0b', badgeTextColor: '#000000', active: true },
    ],
    socialLinks: {
        facebook: '#',
        twitter: '#',
        instagram: '#',
    },
    promoProductId: '',
    promoTitle: 'DEAL OF THE DAY',
    promoActive: true,
};

export function DataProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load data from API (database)
    const refreshData = useCallback(async () => {
        try {
            const [productsRes, categoriesRes, badgesRes, settingsRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/categories'),
                fetch('/api/badges'),
                fetch('/api/settings'),
            ]);
            const [productsData, categoriesData, badgesData, settingsData] = await Promise.all([
                productsRes.json(),
                categoriesRes.json(),
                badgesRes.json(),
                settingsRes.json(),
            ]);
            if (Array.isArray(productsData)) setProducts(productsData);
            if (Array.isArray(categoriesData)) setCategories(categoriesData);
            if (Array.isArray(badgesData)) setBadges(badgesData);
            if (settingsData && settingsData.siteName) setSettings(settingsData);
        } catch (err) {
            console.error('Failed to load data from API:', err);
        }
    }, []);

    useEffect(() => {
        refreshData();
        // Load cart from localStorage (cart is browser-specific)
        try {
          const storedCart = localStorage.getItem('lugx_cart');
          if (storedCart) {
            const parsed = JSON.parse(storedCart);
            // Validate cart data structure
            if (Array.isArray(parsed) && parsed.every((item: unknown) => 
              typeof item === 'object' && item !== null && 
              'id' in item && 'name' in item && 'price' in item && 'quantity' in item &&
              typeof (item as Record<string, unknown>).price === 'number' &&
              typeof (item as Record<string, unknown>).quantity === 'number'
            )) {
              setCart(parsed);
            } else {
              localStorage.removeItem('lugx_cart');
            }
          }
        } catch {
          localStorage.removeItem('lugx_cart');
        }
    }, [refreshData]);

    // Save cart to localStorage
    useEffect(() => {
        localStorage.setItem('lugx_cart', JSON.stringify(cart));
    }, [cart]);

    const addProduct = async (product: Omit<Product, 'id'>) => {
        const newProduct = { ...product, id: Date.now().toString() };
        try {
            await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct),
            });
            setProducts((prev) => [...prev, newProduct as Product]);
        } catch { /* ignore */ }
    };

    const updateProduct = async (id: string, product: Partial<Product>) => {
        const current = products.find(p => p.id === id);
        if (!current) return;
        const updated = { ...current, ...product };
        try {
            await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            });
            setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...product } : p)));
        } catch { /* ignore */ }
    };

    const deleteProduct = async (id: string) => {
        try {
            await fetch(`/api/products/${id}`, { method: 'DELETE' });
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch { /* ignore */ }
    };

    const addCategory = async (category: Omit<Category, 'id'>) => {
        const newCategory = { ...category, id: Date.now().toString() };
        try {
            await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCategory),
            });
            setCategories((prev) => [...prev, newCategory as Category]);
        } catch { /* ignore */ }
    };

    const updateCategory = async (id: string, category: Partial<Category>) => {
        const current = categories.find(c => c.id === id);
        if (!current) return;
        const updated = { ...current, ...category };
        try {
            await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            });
            setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...category } : c)));
        } catch { /* ignore */ }
    };

    const deleteCategory = async (id: string) => {
        try {
            await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            setCategories((prev) => prev.filter((c) => c.id !== id));
        } catch { /* ignore */ }
    };

    const updateSettings = async (newSettings: Partial<SiteSettings>) => {
        const merged = { ...settings, ...newSettings };
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(merged),
            });
            setSettings(merged);
        } catch { /* ignore */ }
    };

    const addBadge = async (badge: Omit<Badge, 'id'>) => {
        const newBadge = { ...badge, id: badge.label.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() };
        try {
            await fetch('/api/badges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBadge),
            });
            setBadges((prev) => [...prev, newBadge as Badge]);
        } catch { /* ignore */ }
    };

    const updateBadge = async (id: string, badge: Partial<Badge>) => {
        const current = badges.find(b => b.id === id);
        if (!current) return;
        const updated = { ...current, ...badge };
        try {
            await fetch(`/api/badges/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            });
            setBadges((prev) => prev.map((b) => (b.id === id ? { ...b, ...badge } : b)));
        } catch { /* ignore */ }
    };

    const deleteBadge = async (id: string) => {
        try {
            await fetch(`/api/badges/${id}`, { method: 'DELETE' });
            setBadges((prev) => prev.filter((b) => b.id !== id));
            setProducts((prev) => prev.map((p) => (p.badge === id ? { ...p, badge: null } : p)));
        } catch { /* ignore */ }
    };

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const updateCartQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart((prev) =>
            prev.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const getBadgeById = (id: string | null) => {
        if (!id) return undefined;
        return badges.find((b) => b.id === id);
    };

    return (
        <DataContext.Provider
            value={{
                products,
                categories,
                settings,
                badges,
                cart,
                addProduct,
                updateProduct,
                deleteProduct,
                addCategory,
                updateCategory,
                deleteCategory,
                updateSettings,
                addBadge,
                updateBadge,
                deleteBadge,
                addToCart,
                removeFromCart,
                updateCartQuantity,
                clearCart,
                getBadgeById,
                refreshData,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

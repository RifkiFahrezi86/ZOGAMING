'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category, Order, SiteSettings, Badge, BannerImage } from './types';
import productsData from '@/data/products.json';
import categoriesData from '@/data/categories.json';
import ordersData from '@/data/orders.json';
import badgesData from '@/data/badges.json';

interface DataContextType {
    products: Product[];
    categories: Category[];
    orders: Order[];
    settings: SiteSettings;
    badges: Badge[];
    cart: CartItem[];
    addProduct: (product: Omit<Product, 'id'>) => void;
    updateProduct: (id: string, product: Partial<Product>) => void;
    deleteProduct: (id: string) => void;
    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (id: string, category: Partial<Category>) => void;
    deleteCategory: (id: string) => void;
    updateOrderStatus: (id: string, status: Order['status']) => void;
    updateSettings: (settings: Partial<SiteSettings>) => void;
    addBadge: (badge: Omit<Badge, 'id'>) => void;
    updateBadge: (id: string, badge: Partial<Badge>) => void;
    deleteBadge: (id: string) => void;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getBadgeById: (id: string | null) => Badge | undefined;
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
};

export function DataProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load data from localStorage or use default
    useEffect(() => {
        const storedProducts = localStorage.getItem('lugx_products');
        const storedCategories = localStorage.getItem('lugx_categories');
        const storedOrders = localStorage.getItem('lugx_orders');
        const storedSettings = localStorage.getItem('lugx_settings');
        const storedBadges = localStorage.getItem('lugx_badges');
        const storedCart = localStorage.getItem('lugx_cart');

        setProducts(storedProducts ? JSON.parse(storedProducts) : productsData as Product[]);
        setCategories(storedCategories ? JSON.parse(storedCategories) : categoriesData as Category[]);
        setOrders(storedOrders ? JSON.parse(storedOrders) : ordersData as Order[]);
        setSettings(storedSettings ? JSON.parse(storedSettings) : defaultSettings);
        setBadges(storedBadges ? JSON.parse(storedBadges) : badgesData as Badge[]);
        setCart(storedCart ? JSON.parse(storedCart) : []);
        setIsLoaded(true);
    }, []);

    // Save to localStorage when data changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lugx_products', JSON.stringify(products));
        }
    }, [products, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lugx_categories', JSON.stringify(categories));
        }
    }, [categories, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lugx_orders', JSON.stringify(orders));
        }
    }, [orders, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lugx_settings', JSON.stringify(settings));
        }
    }, [settings, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lugx_badges', JSON.stringify(badges));
        }
    }, [badges, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('lugx_cart', JSON.stringify(cart));
        }
    }, [cart, isLoaded]);

    const addProduct = (product: Omit<Product, 'id'>) => {
        const newProduct = { ...product, id: Date.now().toString() };
        setProducts((prev) => [...prev, newProduct as Product]);
    };

    const updateProduct = (id: string, product: Partial<Product>) => {
        setProducts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, ...product } : p))
        );
    };

    const deleteProduct = (id: string) => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
    };

    const addCategory = (category: Omit<Category, 'id'>) => {
        const newCategory = { ...category, id: Date.now().toString() };
        setCategories((prev) => [...prev, newCategory as Category]);
    };

    const updateCategory = (id: string, category: Partial<Category>) => {
        setCategories((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...category } : c))
        );
    };

    const deleteCategory = (id: string) => {
        setCategories((prev) => prev.filter((c) => c.id !== id));
    };

    const updateOrderStatus = (id: string, status: Order['status']) => {
        setOrders((prev) =>
            prev.map((o) => (o.id === id ? { ...o, status } : o))
        );
    };

    const updateSettings = (newSettings: Partial<SiteSettings>) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
    };

    const addBadge = (badge: Omit<Badge, 'id'>) => {
        const newBadge = { ...badge, id: badge.label.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() };
        setBadges((prev) => [...prev, newBadge as Badge]);
    };

    const updateBadge = (id: string, badge: Partial<Badge>) => {
        setBadges((prev) =>
            prev.map((b) => (b.id === id ? { ...b, ...badge } : b))
        );
    };

    const deleteBadge = (id: string) => {
        setBadges((prev) => prev.filter((b) => b.id !== id));
        // Remove badge from products that have it
        setProducts((prev) =>
            prev.map((p) => (p.badge === id ? { ...p, badge: null } : p))
        );
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
                orders,
                settings,
                badges,
                cart,
                addProduct,
                updateProduct,
                deleteProduct,
                addCategory,
                updateCategory,
                deleteCategory,
                updateOrderStatus,
                updateSettings,
                addBadge,
                updateBadge,
                deleteBadge,
                addToCart,
                removeFromCart,
                updateCartQuantity,
                clearCart,
                getBadgeById,
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

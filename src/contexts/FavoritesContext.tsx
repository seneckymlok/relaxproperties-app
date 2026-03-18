"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type FavoriteId = string | number;

interface FavoritesContextType {
    favorites: FavoriteId[];
    addFavorite: (id: FavoriteId) => void;
    removeFavorite: (id: FavoriteId) => void;
    toggleFavorite: (id: FavoriteId) => void;
    isFavorite: (id: FavoriteId) => boolean;
    favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = "relaxproperties_favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<FavoriteId[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setFavorites(JSON.parse(stored));
            } catch {
                setFavorites([]);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage when favorites change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        }
    }, [favorites, isLoaded]);

    const addFavorite = (id: FavoriteId) => {
        setFavorites((prev) => {
            if (prev.some(fav => String(fav) === String(id))) return prev;
            return [...prev, id];
        });
    };

    const removeFavorite = (id: FavoriteId) => {
        setFavorites((prev) => prev.filter((fav) => String(fav) !== String(id)));
    };

    const toggleFavorite = (id: FavoriteId) => {
        if (favorites.some(fav => String(fav) === String(id))) {
            removeFavorite(id);
        } else {
            addFavorite(id);
        }
    };

    const isFavorite = (id: FavoriteId) => favorites.some(fav => String(fav) === String(id));

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                addFavorite,
                removeFavorite,
                toggleFavorite,
                isFavorite,
                favoritesCount: favorites.length,
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error("useFavorites must be used within a FavoritesProvider");
    }
    return context;
}

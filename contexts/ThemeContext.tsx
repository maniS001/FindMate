import React, { createContext, useContext, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    colors: {
        background: string;
        surface: string;
        primary: string;
        secondary: string;
        text: string;
        textSecondary: string;
        border: string;
        card: string;
        error: string;
        success: string;
        warning: string;
        headerBackground: string;
        headerText: string;
    };
}

const lightColors = {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    primary: '#3B82F6',
    secondary: '#10B981',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    card: '#FFFFFF',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    headerBackground: '#3B82F6',
    headerText: '#FFFFFF',
};

const darkColors = {
    background: '#0F172A',
    surface: '#1E293B',
    primary: '#60A5FA',
    secondary: '#34D399',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    border: '#334155',
    card: '#1E293B',
    error: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    headerBackground: '#1E293B',
    headerText: '#F1F5F9',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const defaultTheme = Platform.OS === 'web' ? 'dark' : (systemColorScheme === 'dark' ? 'dark' : 'light');
    const [theme, setTheme] = useState<Theme>(defaultTheme);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const colors = theme === 'light' ? lightColors : darkColors;

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}

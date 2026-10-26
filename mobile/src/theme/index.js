/**
 * JobGraph - Theme Configuration
 * Design system with colors, typography, and spacing
 */

export const colors = {
    // Primary palette
    primary: '#6C63FF',
    primaryDark: '#5A52D9',
    primaryLight: '#8B84FF',

    // Secondary palette
    secondary: '#00D9FF',
    secondaryDark: '#00B8D9',

    // Background colors
    background: '#0F0F1A',
    backgroundLight: '#1A1A2E',
    backgroundCard: '#16213E',

    // Surface colors
    surface: '#1F1F3A',
    surfaceLight: '#2A2A4A',

    // Text colors
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8D1',
    textMuted: '#6B6B8D',

    // Status colors
    success: '#00E676',
    successLight: '#69F0AE',
    warning: '#FFB800',
    warningLight: '#FFD54F',
    error: '#FF5252',
    errorLight: '#FF8A80',
    info: '#40C4FF',

    // Skill badge colors
    skillBg: 'rgba(108, 99, 255, 0.15)',
    skillText: '#8B84FF',

    // Score colors
    scoreHigh: '#00E676',
    scoreMedium: '#FFB800',
    scoreLow: '#FF5252',

    // Border and divider
    border: 'rgba(255, 255, 255, 0.1)',
    divider: 'rgba(255, 255, 255, 0.05)',

    // Gradients
    gradientStart: '#6C63FF',
    gradientEnd: '#00D9FF',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const typography = {
    h1: {
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
    },
    h2: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 32,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
    },
    body: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
    },
    bodySmall: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
    },
    caption: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
    },
    button: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
    },
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
};

export default { colors, spacing, borderRadius, typography, shadows };

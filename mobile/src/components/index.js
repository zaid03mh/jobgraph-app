/**
 * JobGraph - Reusable UI Components
 */
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';

// Button Component
export const Button = ({ title, onPress, loading, disabled, variant = 'primary', icon, style }) => {
    const isPrimary = variant === 'primary';
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading || disabled}
            style={[
                styles.button,
                isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
                (loading || disabled) && styles.buttonDisabled,
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator color={isPrimary ? '#fff' : colors.primary} />
            ) : (
                <View style={styles.buttonContent}>
                    {icon && <Ionicons name={icon} size={20} color={isPrimary ? '#fff' : colors.primary} style={{ marginRight: 8 }} />}
                    <Text style={[styles.buttonText, !isPrimary && styles.buttonTextSecondary]}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

// Input Component
export const Input = ({ label, error, icon, secureTextEntry, ...props }) => {
    const [secure, setSecure] = React.useState(secureTextEntry);
    return (
        <View style={styles.inputContainer}>
            {label && <Text style={styles.inputLabel}>{label}</Text>}
            <View style={[styles.inputWrapper, error && styles.inputError]}>
                {icon && <Ionicons name={icon} size={20} color={colors.textMuted} style={styles.inputIcon} />}
                <TextInput
                    {...props}
                    secureTextEntry={secure}
                    style={styles.input}
                    placeholderTextColor={colors.textMuted}
                />
                {secureTextEntry && (
                    <TouchableOpacity onPress={() => setSecure(!secure)}>
                        <Ionicons name={secure ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

// Card Component
export const Card = ({ children, style, onPress }) => {
    const Container = onPress ? TouchableOpacity : View;
    return <Container onPress={onPress} style={[styles.card, style]}>{children}</Container>;
};

// Skill Badge Component
export const SkillBadge = ({ name, onRemove, matched }) => (
    <View style={[styles.skillBadge, matched && styles.skillBadgeMatched]}>
        <Text style={[styles.skillBadgeText, matched && styles.skillBadgeTextMatched]}>{name}</Text>
        {onRemove && (
            <TouchableOpacity onPress={onRemove} style={styles.skillRemove}>
                <Ionicons name="close" size={14} color={colors.skillText} />
            </TouchableOpacity>
        )}
    </View>
);

// Score Badge Component
export const ScoreBadge = ({ score, size = 'md' }) => {
    const percentage = Math.round(score * 100);
    const color = percentage >= 70 ? colors.scoreHigh : percentage >= 40 ? colors.scoreMedium : colors.scoreLow;
    const isLarge = size === 'lg';

    return (
        <View style={[styles.scoreBadge, { backgroundColor: `${color}20`, width: isLarge ? 70 : 50, height: isLarge ? 70 : 50 }]}>
            <Text style={[styles.scoreText, { color, fontSize: isLarge ? 22 : 16 }]}>{percentage}%</Text>
            {isLarge && <Text style={[styles.scoreLabel, { color }]}>match</Text>}
        </View>
    );
};

// Loading Screen
export const LoadingScreen = ({ message = 'Loading...' }) => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{message}</Text>
    </View>
);

// Empty State
export const EmptyState = ({ icon, title, message, action, actionTitle }) => (
    <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
            <Ionicons name={icon} size={64} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyMessage}>{message}</Text>
        {action && <Button title={actionTitle} onPress={action} style={{ marginTop: 16 }} />}
    </View>
);

// Header Component
export const Header = ({ title, subtitle, rightAction }) => (
    <View style={styles.header}>
        <View>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>
        {rightAction}
    </View>
);

// Status Badge Component for application status
export const StatusBadge = ({ status }) => {
    const statusConfig = {
        pending: { icon: 'time-outline', color: colors.warning, label: 'Pending', bg: `${colors.warning}20` },
        reviewed: { icon: 'eye-outline', color: colors.info, label: 'Reviewed', bg: `${colors.info}20` },
        accepted: { icon: 'checkmark-circle', color: colors.success, label: 'Accepted', bg: `${colors.success}20` },
        rejected: { icon: 'close-circle', color: colors.error, label: 'Rejected', bg: `${colors.error}20` },
    };
    const config = statusConfig[status] || statusConfig.pending;

    return (
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={14} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
    );
};

// Progress Bar Component
export const ProgressBar = ({ progress, color = colors.primary }) => (
    <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: color }]} />
    </View>
);

const styles = StyleSheet.create({
    button: { height: 52, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
    buttonPrimary: { backgroundColor: colors.primary },
    buttonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
    buttonDisabled: { opacity: 0.6 },
    buttonContent: { flexDirection: 'row', alignItems: 'center' },
    buttonText: { color: '#fff', ...typography.button },
    buttonTextSecondary: { color: colors.primary },

    inputContainer: { marginBottom: spacing.md },
    inputLabel: { color: colors.textSecondary, ...typography.bodySmall, marginBottom: spacing.xs },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
    inputError: { borderColor: colors.error },
    inputIcon: { marginRight: spacing.sm },
    input: { flex: 1, height: 52, color: colors.textPrimary, ...typography.body },
    errorText: { color: colors.error, ...typography.caption, marginTop: spacing.xs },

    card: { backgroundColor: colors.backgroundCard, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },

    skillBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.skillBg, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginRight: spacing.xs, marginBottom: spacing.xs },
    skillBadgeMatched: { backgroundColor: `${colors.success}20` },
    skillBadgeText: { color: colors.skillText, ...typography.caption },
    skillBadgeTextMatched: { color: colors.success },
    skillRemove: { marginLeft: spacing.xs },

    scoreBadge: { borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center' },
    scoreText: { fontWeight: '700' },
    scoreLabel: { ...typography.caption, marginTop: -2 },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    loadingText: { color: colors.textSecondary, ...typography.body, marginTop: spacing.md },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { color: colors.textPrimary, ...typography.h3, marginTop: spacing.lg, textAlign: 'center' },
    emptyMessage: { color: colors.textMuted, ...typography.body, marginTop: spacing.sm, textAlign: 'center', maxWidth: 280 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
    headerTitle: { color: colors.textPrimary, ...typography.h2 },
    headerSubtitle: { color: colors.textSecondary, ...typography.bodySmall, marginTop: 2 },

    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
    statusText: { ...typography.caption, fontWeight: '600', marginLeft: 4 },

    progressContainer: { height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 3 },
});

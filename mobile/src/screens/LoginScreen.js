/**
 * JobGraph - Login Screen
 * Premium dark theme with demo account quick-fill
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components';
import { colors, spacing, typography, borderRadius } from '../theme';

const LoginScreen = ({ navigation }) => {
    const { login, loading, error, setError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
        if (!password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        setError(null);
        try {
            await login(email, password);
        } catch (err) {
            // Error handled by context
        }
    };

    // Quick-fill demo credentials
    const fillDemoAccount = (type) => {
        setError(null);
        setErrors({});
        if (type === 'candidate') {
            setEmail('candidate@jobgraph.com');
            setPassword('password123');
        } else if (type === 'recruiter') {
            setEmail('recruiter@jobgraph.com');
            setPassword('password123');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <View style={styles.logoGradient}>
                                <Ionicons name="briefcase" size={48} color="#fff" />
                            </View>
                        </View>
                        <Text style={styles.title}>JobGraph</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        {error && (
                            <View style={styles.errorBanner}>
                                <Ionicons name="alert-circle" size={20} color={colors.error} />
                                <Text style={styles.errorBannerText}>{error}</Text>
                            </View>
                        )}

                        <Input
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            error={errors.email}
                            icon="mail-outline"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Input
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            error={errors.password}
                            icon="lock-closed-outline"
                            secureTextEntry
                        />

                        <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.button} />

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or continue with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Demo Account Quick-Fill */}
                        <View style={styles.demoButtons}>
                            <TouchableOpacity
                                style={styles.demoButton}
                                onPress={() => fillDemoAccount('candidate')}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="person-outline" size={20} color={colors.primary} />
                                <Text style={styles.demoButtonText}>Candidate Demo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.demoButton}
                                onPress={() => fillDemoAccount('recruiter')}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="business-outline" size={20} color={colors.secondary} />
                                <Text style={[styles.demoButtonText, { color: colors.secondary }]}>Recruiter Demo</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.linkContainer} onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.linkText}>Don't have an account? </Text>
                            <Text style={styles.linkTextBold}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Info Footer */}
                    <View style={styles.footerInfo}>
                        <Ionicons name="shield-checkmark-outline" size={16} color={colors.textMuted} />
                        <Text style={styles.footerText}>Your data is secured with encryption</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
    logoSection: { alignItems: 'center', marginBottom: spacing.xxl },
    logoContainer: { marginBottom: spacing.md },
    logoGradient: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.sm },
    subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
    formSection: { marginBottom: spacing.xl },
    errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.error}20`, padding: spacing.md, borderRadius: borderRadius.sm, marginBottom: spacing.md },
    errorBannerText: { color: colors.error, marginLeft: spacing.sm, flex: 1, ...typography.bodySmall },
    button: { marginTop: spacing.md },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { color: colors.textMuted, marginHorizontal: spacing.md, ...typography.caption },
    demoButtons: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    demoButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.md,
        borderWidth: 1, borderColor: colors.border,
    },
    demoButtonText: { color: colors.primary, ...typography.button, marginLeft: spacing.xs },
    linkContainer: { flexDirection: 'row', justifyContent: 'center' },
    linkText: { color: colors.textSecondary, ...typography.body },
    linkTextBold: { color: colors.primary, fontWeight: '600', ...typography.body },
    footerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
    footerText: { color: colors.textMuted, ...typography.caption, marginLeft: spacing.xs },
});

export default LoginScreen;


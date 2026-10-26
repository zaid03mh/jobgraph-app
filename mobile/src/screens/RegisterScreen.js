/**
 * JobGraph - Register Screen
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components';
import { colors, spacing, typography, borderRadius } from '../theme';

const ROLES = [
    { value: 'candidat', label: 'Candidate', icon: 'person', description: 'Looking for job opportunities' },
    { value: 'recruteur', label: 'Recruiter', icon: 'business', description: 'Hiring talent for your company' },
];

const RegisterScreen = ({ navigation }) => {
    const { register, loading, error, setError } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'candidat', title: '' });
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!form.name) newErrors.name = 'Name is required';
        if (!form.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email format';
        if (!form.password) newErrors.password = 'Password is required';
        else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;
        setError(null);
        try {
            await register({ name: form.name, email: form.email, password: form.password, role: form.role, title: form.title });
        } catch (err) { }
    };

    const updateForm = (key, value) => setForm({ ...form, [key]: value });

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>

                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join JobGraph and find your perfect match</Text>

                {error && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={20} color={colors.error} />
                        <Text style={styles.errorBannerText}>{error}</Text>
                    </View>
                )}

                {/* Role Selection */}
                <Text style={styles.sectionLabel}>I am a:</Text>
                <View style={styles.roleContainer}>
                    {ROLES.map((role) => (
                        <TouchableOpacity
                            key={role.value}
                            style={[styles.roleCard, form.role === role.value && styles.roleCardActive]}
                            onPress={() => updateForm('role', role.value)}
                        >
                            <Ionicons name={role.icon} size={28} color={form.role === role.value ? colors.primary : colors.textMuted} />
                            <Text style={[styles.roleLabel, form.role === role.value && styles.roleLabelActive]}>{role.label}</Text>
                            <Text style={styles.roleDesc}>{role.description}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Input label="Full Name" placeholder="Enter your name" value={form.name} onChangeText={(v) => updateForm('name', v)} error={errors.name} icon="person-outline" />
                <Input label="Email" placeholder="Enter your email" value={form.email} onChangeText={(v) => updateForm('email', v)} error={errors.email} icon="mail-outline" keyboardType="email-address" autoCapitalize="none" />
                <Input label="Professional Title" placeholder="e.g. Software Developer" value={form.title} onChangeText={(v) => updateForm('title', v)} icon="briefcase-outline" />
                <Input label="Password" placeholder="Min 6 characters" value={form.password} onChangeText={(v) => updateForm('password', v)} error={errors.password} icon="lock-closed-outline" secureTextEntry />
                <Input label="Confirm Password" placeholder="Re-enter password" value={form.confirmPassword} onChangeText={(v) => updateForm('confirmPassword', v)} error={errors.confirmPassword} icon="lock-closed-outline" secureTextEntry />

                <Button title="Create Account" onPress={handleRegister} loading={loading} style={styles.button} />

                <TouchableOpacity style={styles.linkContainer} onPress={() => navigation.goBack()}>
                    <Text style={styles.linkText}>Already have an account? </Text>
                    <Text style={styles.linkTextBold}>Sign In</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, padding: spacing.lg },
    backButton: { marginBottom: spacing.md },
    title: { ...typography.h1, color: colors.textPrimary },
    subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
    errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.error}20`, padding: spacing.md, borderRadius: 8, marginBottom: spacing.md },
    errorBannerText: { color: colors.error, marginLeft: spacing.sm, flex: 1 },
    sectionLabel: { color: colors.textSecondary, ...typography.bodySmall, marginBottom: spacing.sm },
    roleContainer: { flexDirection: 'row', marginBottom: spacing.lg },
    roleCard: { flex: 1, padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, marginRight: spacing.sm, borderWidth: 2, borderColor: 'transparent', alignItems: 'center' },
    roleCardActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
    roleLabel: { color: colors.textSecondary, ...typography.button, marginTop: spacing.xs },
    roleLabelActive: { color: colors.primary },
    roleDesc: { color: colors.textMuted, ...typography.caption, textAlign: 'center', marginTop: 4 },
    button: { marginTop: spacing.md, marginBottom: spacing.lg },
    linkContainer: { flexDirection: 'row', justifyContent: 'center' },
    linkText: { color: colors.textSecondary },
    linkTextBold: { color: colors.primary, fontWeight: '600' },
});

export default RegisterScreen;

/**
 * JobGraph - Profile Screen
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../config/api';
import { Button, Card, SkillBadge, LoadingScreen } from '../components';
import { colors, spacing, typography, borderRadius } from '../theme';

const ProfileScreen = () => {
    const { user, logout, updateUser, refreshUser } = useAuth();
    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState('');
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', title: '' });

    useEffect(() => { fetchSkills(); }, []);
    useEffect(() => { if (user) setForm({ name: user.name, title: user.title || '' }); }, [user]);

    const fetchSkills = async () => {
        try {
            const res = await userAPI.getSkills();
            setSkills(res.data.skills || []);
        } catch (err) { console.log(err); }
        finally { setLoading(false); }
    };

    const handleAddSkill = async () => {
        if (!newSkill.trim()) return;
        try {
            const res = await userAPI.addSkills([newSkill.trim()]);
            setSkills(res.data.skills);
            setNewSkill('');
            await refreshUser();
        } catch (err) { Alert.alert('Error', err.message); }
    };

    const handleRemoveSkill = async (skillName) => {
        try {
            const res = await userAPI.removeSkill(skillName);
            setSkills(res.data.skills);
            await refreshUser();
        } catch (err) { Alert.alert('Error', err.message); }
    };

    const handleUpdateProfile = async () => {
        try {
            await updateUser(form);
            setEditing(false);
            Alert.alert('Success', 'Profile updated');
        } catch (err) { Alert.alert('Error', err.message); }
    };

    const handleLogout = () => {
        // Use window.confirm for web, Alert for mobile
        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to sign out?')) {
                logout();
            }
        } else {
            Alert.alert(
                'Sign Out',
                'Are you sure you want to sign out?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Sign Out',
                        style: 'destructive',
                        onPress: () => logout()
                    }
                ]
            );
        }
    };

    const getRoleBadge = (role) => {
        const badges = { admin: { color: colors.error, label: 'Admin' }, recruteur: { color: colors.warning, label: 'Recruiter' }, candidat: { color: colors.primary, label: 'Candidate' } };
        return badges[role] || badges.candidat;
    };

    if (loading) return <LoadingScreen message="Loading profile..." />;

    const roleBadge = getRoleBadge(user?.role);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Profile Header */}
            <Card style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text></View>
                    <View style={[styles.roleBadge, { backgroundColor: `${roleBadge.color}20` }]}><Text style={[styles.roleText, { color: roleBadge.color }]}>{roleBadge.label}</Text></View>
                </View>

                {editing ? (
                    <View style={styles.editForm}>
                        <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Name" placeholderTextColor={colors.textMuted} />
                        <TextInput style={styles.input} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholder="Title" placeholderTextColor={colors.textMuted} />
                        <View style={styles.editActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                            <Button title="Save" onPress={handleUpdateProfile} style={{ flex: 1 }} />
                        </View>
                    </View>
                ) : (
                    <View style={styles.profileInfo}>
                        <Text style={styles.name}>{user?.name}</Text>
                        <Text style={styles.title}>{user?.title || 'No title set'}</Text>
                        <Text style={styles.email}>{user?.email}</Text>
                        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                            <Ionicons name="pencil" size={16} color={colors.primary} /><Text style={styles.editText}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Card>

            {/* Skills Section (Candidates only) */}
            {user?.role === 'candidat' && (
                <Card>
                    <Text style={styles.sectionTitle}>My Skills</Text>
                    <Text style={styles.sectionSubtitle}>Add skills to get better job recommendations</Text>

                    <View style={styles.addSkillRow}>
                        <TextInput style={styles.skillInput} value={newSkill} onChangeText={setNewSkill} placeholder="Add a skill..." placeholderTextColor={colors.textMuted} onSubmitEditing={handleAddSkill} />
                        <TouchableOpacity style={styles.addBtn} onPress={handleAddSkill}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
                    </View>

                    <View style={styles.skillsContainer}>
                        {skills.length > 0 ? skills.map((skill, i) => <SkillBadge key={i} name={skill} onRemove={() => handleRemoveSkill(skill)} />) : <Text style={styles.noSkills}>No skills added yet</Text>}
                    </View>
                </Card>
            )}

            {/* Stats Card */}
            <Card style={styles.statsCard}>
                <View style={styles.statItem}><Text style={styles.statValue}>{skills.length}</Text><Text style={styles.statLabel}>Skills</Text></View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}><Text style={styles.statValue}>{user?.role === 'candidat' ? 'Active' : 'Hiring'}</Text><Text style={styles.statLabel}>Status</Text></View>
            </Card>

            {/* Logout Button */}
            <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.7}
            >
                <Ionicons name="log-out-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    profileCard: { alignItems: 'center', paddingVertical: spacing.xl },
    avatarContainer: { alignItems: 'center', marginBottom: spacing.md },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
    roleBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginTop: spacing.sm },
    roleText: { ...typography.caption, fontWeight: '600' },
    profileInfo: { alignItems: 'center' },
    name: { color: colors.textPrimary, ...typography.h2 },
    title: { color: colors.textSecondary, ...typography.body, marginTop: 4 },
    email: { color: colors.textMuted, ...typography.bodySmall, marginTop: 4 },
    editBtn: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
    editText: { color: colors.primary, ...typography.button, marginLeft: 4 },
    editForm: { width: '100%', paddingHorizontal: spacing.md },
    input: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.md, color: colors.textPrimary, marginBottom: spacing.sm },
    editActions: { flexDirection: 'row', marginTop: spacing.sm },
    cancelBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
    cancelText: { color: colors.textMuted },
    sectionTitle: { color: colors.textPrimary, ...typography.h3, marginBottom: spacing.xs },
    sectionSubtitle: { color: colors.textMuted, ...typography.bodySmall, marginBottom: spacing.md },
    addSkillRow: { flexDirection: 'row', marginBottom: spacing.md },
    skillInput: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.sm, color: colors.textPrimary, marginRight: spacing.sm },
    addBtn: { width: 44, height: 44, backgroundColor: colors.primary, borderRadius: borderRadius.sm, justifyContent: 'center', alignItems: 'center' },
    skillsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    noSkills: { color: colors.textMuted, ...typography.body },
    statsCard: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.lg },
    statItem: { alignItems: 'center' },
    statValue: { color: colors.textPrimary, ...typography.h2 },
    statLabel: { color: colors.textMuted, ...typography.caption, marginTop: 4 },
    statDivider: { width: 1, backgroundColor: colors.border },
    logoutBtn: { marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.error}15`, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.error },
    logoutText: { color: colors.error, ...typography.button },
});

export default ProfileScreen;

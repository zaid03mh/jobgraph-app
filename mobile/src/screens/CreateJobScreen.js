/**
 * JobGraph - Create Job Screen
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jobAPI } from '../config/api';
import { Button, Card, SkillBadge } from '../components';
import { colors, spacing, typography, borderRadius } from '../theme';

const CreateJobScreen = ({ navigation }) => {
    const [form, setForm] = useState({ title: '', description: '', salary: '', location: '' });
    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!form.title.trim()) newErrors.title = 'Title is required';
        if (!form.description.trim()) newErrors.description = 'Description is required';
        if (!form.salary || isNaN(form.salary)) newErrors.salary = 'Valid salary is required';
        if (skills.length === 0) newErrors.skills = 'At least one skill is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddSkill = () => {
        if (!newSkill.trim()) return;
        if (skills.includes(newSkill.trim())) return;
        setSkills([...skills, newSkill.trim()]);
        setNewSkill('');
    };

    const handleRemoveSkill = (skill) => { setSkills(skills.filter((s) => s !== skill)); };

    const handleCreate = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await jobAPI.create({ title: form.title.trim(), description: form.description.trim(), salary: parseFloat(form.salary), location: form.location.trim(), skills });
            Alert.alert('Success', 'Job offer created successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (err) { Alert.alert('Error', err.message); }
        finally { setLoading(false); }
    };

    const updateForm = (key, value) => setForm({ ...form, [key]: value });

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Card>
                    <Text style={styles.label}>Job Title *</Text>
                    <TextInput style={[styles.input, errors.title && styles.inputError]} value={form.title} onChangeText={(v) => updateForm('title', v)} placeholder="e.g. Full Stack Developer" placeholderTextColor={colors.textMuted} />
                    {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

                    <Text style={styles.label}>Description *</Text>
                    <TextInput style={[styles.input, styles.textArea, errors.description && styles.inputError]} value={form.description} onChangeText={(v) => updateForm('description', v)} placeholder="Describe the role..." placeholderTextColor={colors.textMuted} multiline numberOfLines={4} textAlignVertical="top" />
                    {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Salary (€/year) *</Text>
                            <TextInput style={[styles.input, errors.salary && styles.inputError]} value={form.salary} onChangeText={(v) => updateForm('salary', v)} placeholder="50000" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
                            {errors.salary && <Text style={styles.errorText}>{errors.salary}</Text>}
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Location</Text>
                            <TextInput style={styles.input} value={form.location} onChangeText={(v) => updateForm('location', v)} placeholder="e.g. Paris" placeholderTextColor={colors.textMuted} />
                        </View>
                    </View>
                </Card>

                <Card>
                    <Text style={styles.label}>Required Skills *</Text>
                    <View style={styles.addSkillRow}>
                        <TextInput style={styles.skillInput} value={newSkill} onChangeText={setNewSkill} placeholder="Add a skill..." placeholderTextColor={colors.textMuted} onSubmitEditing={handleAddSkill} />
                        <TouchableOpacity style={styles.addBtn} onPress={handleAddSkill}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
                    </View>
                    {errors.skills && <Text style={styles.errorText}>{errors.skills}</Text>}

                    <View style={styles.skillsContainer}>
                        {skills.map((skill, i) => <SkillBadge key={i} name={skill} onRemove={() => handleRemoveSkill(skill)} />)}
                        {skills.length === 0 && <Text style={styles.noSkills}>Add required skills for this position</Text>}
                    </View>
                </Card>

                <Button title="Create Job Offer" onPress={handleCreate} loading={loading} icon="briefcase" />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    label: { color: colors.textSecondary, ...typography.bodySmall, marginBottom: spacing.xs, marginTop: spacing.md },
    input: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.md, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
    inputError: { borderColor: colors.error },
    textArea: { height: 100 },
    errorText: { color: colors.error, ...typography.caption, marginTop: 4 },
    row: { flexDirection: 'row' },
    halfInput: { flex: 1, marginRight: spacing.sm },
    addSkillRow: { flexDirection: 'row', marginTop: spacing.sm },
    skillInput: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.sm, color: colors.textPrimary, marginRight: spacing.sm },
    addBtn: { width: 44, height: 44, backgroundColor: colors.primary, borderRadius: borderRadius.sm, justifyContent: 'center', alignItems: 'center' },
    skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
    noSkills: { color: colors.textMuted, ...typography.bodySmall },
});

export default CreateJobScreen;

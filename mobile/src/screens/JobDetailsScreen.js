/**
 * JobGraph - Job Details Screen
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jobAPI, applicationAPI, recommendationAPI } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Button, Card, SkillBadge, ScoreBadge, LoadingScreen } from '../components';
import { colors, spacing, typography, borderRadius } from '../theme';

const JobDetailsScreen = ({ route, navigation }) => {
    const { jobId } = route.params;
    const { user } = useAuth();
    const [job, setJob] = useState(null);
    const [recommendation, setRecommendation] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [hasApplied, setHasApplied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);

    useEffect(() => { fetchJobDetails(); }, [jobId]);

    const fetchJobDetails = async () => {
        try {
            const jobRes = await jobAPI.getById(jobId);
            setJob(jobRes.data.job);

            if (user?.role === 'candidat') {
                const appRes = await applicationAPI.checkStatus(jobId);
                setHasApplied(appRes.data.hasApplied);

                const recRes = await recommendationAPI.getJobRecommendation(jobId);
                setRecommendation(recRes.data.recommendation);
            }

            if (user?.role === 'recruteur') {
                try {
                    const applicantsRes = await applicationAPI.getApplicants(jobId);
                    setApplicants(applicantsRes.data?.applicants || applicantsRes.applicants || []);
                } catch (err) {
                    console.log('Error fetching applicants:', err);
                }
            }
        } catch (error) {
            console.log('Error:', error);
            Alert.alert('Error', 'Failed to load job details');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        try {
            setApplying(true);
            await applicationAPI.apply(jobId, {});
            setHasApplied(true);
            Alert.alert('Success', 'Your application has been submitted!');
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to apply');
        } finally {
            setApplying(false);
        }
    };

    const handleUpdateStatus = async (applicationId, newStatus) => {
        try {
            await applicationAPI.updateStatus(applicationId, newStatus);
            setApplicants(prev => prev.map(app =>
                app.id === applicationId ? { ...app, status: newStatus } : app
            ));
            Alert.alert('Success', `Application ${newStatus}`);
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to update status');
        }
    };

    const formatSalary = (salary) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(salary);
    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const getStatusColor = (status) => {
        const colors_map = { pending: colors.warning, reviewed: colors.info, accepted: colors.success, rejected: colors.error };
        return colors_map[status] || colors.textMuted;
    };

    if (loading) return <LoadingScreen message="Loading job details..." />;
    if (!job) return null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header Card */}
            <Card style={styles.headerCard}>
                <Text style={styles.title}>{job.title}</Text>
                {job.recruiter && <Text style={styles.company}>{job.recruiter.name}</Text>}

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="cash-outline" size={18} color={colors.success} />
                        <Text style={styles.salary}>{formatSalary(job.salary)}/year</Text>
                    </View>
                    {job.location && (
                        <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={18} color={colors.textMuted} />
                            <Text style={styles.metaText}>{job.location}</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.dateText}>Posted on {formatDate(job.date_creation)}</Text>
            </Card>

            {/* Applicants Section (Recruiters only) */}
            {user?.role === 'recruteur' && (
                <Card style={styles.applicantsCard}>
                    <View style={styles.applicantsHeader}>
                        <Text style={styles.sectionTitle}>Applicants</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{applicants.length}</Text>
                        </View>
                    </View>

                    {applicants.length === 0 ? (
                        <Text style={styles.noApplicants}>No applications yet</Text>
                    ) : (
                        applicants.map((app, index) => (
                            <View key={app.application?.id || `applicant-${index}`} style={styles.applicantItem}>
                                <View style={styles.applicantInfo}>
                                    <View style={styles.applicantAvatar}>
                                        <Text style={styles.avatarText}>{app.candidate?.name?.charAt(0) || 'C'}</Text>
                                    </View>
                                    <View style={styles.applicantDetails}>
                                        <Text style={styles.applicantName}>{app.candidate?.name || 'Candidate'}</Text>
                                        <Text style={styles.applicantDate}>Applied {formatDate(app.application?.appliedAt)}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(app.application?.status)}20` }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(app.application?.status) }]}>
                                            {app.application?.status?.charAt(0).toUpperCase() + app.application?.status?.slice(1) || 'Pending'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Show buttons if not yet accepted/rejected */}
                                {(app.application?.status === 'pending' || !app.application?.status) && (
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.acceptBtn]}
                                            onPress={() => handleUpdateStatus(app.application?.id, 'accepted')}
                                        >
                                            <Ionicons name="checkmark" size={18} color="#fff" />
                                            <Text style={styles.actionBtnText}>Accept</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.rejectBtn]}
                                            onPress={() => handleUpdateStatus(app.application?.id, 'rejected')}
                                        >
                                            <Ionicons name="close" size={18} color="#fff" />
                                            <Text style={styles.actionBtnText}>Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </Card>
            )}

            {/* Match Score (Candidates only) */}
            {user?.role === 'candidat' && recommendation && (
                <Card style={styles.matchCard}>
                    <View style={styles.matchHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Your Match Score</Text>
                            <Text style={styles.matchExplanation}>{recommendation.explanation}</Text>
                        </View>
                        <ScoreBadge score={recommendation.score} size="lg" />
                    </View>

                    {recommendation.matchedSkills?.length > 0 && (
                        <View style={styles.matchedSkills}>
                            <Text style={styles.matchLabel}>Matched Skills:</Text>
                            <View style={styles.skillsRow}>
                                {recommendation.matchedSkills.map((skill, i) => <SkillBadge key={i} name={skill} matched />)}
                            </View>
                        </View>
                    )}

                    {recommendation.missingSkills?.length > 0 && (
                        <View style={styles.missingSkills}>
                            <Text style={styles.missingLabel}>Skills to develop:</Text>
                            <View style={styles.skillsRow}>
                                {recommendation.missingSkills.map((skill, i) => <SkillBadge key={i} name={skill} />)}
                            </View>
                        </View>
                    )}
                </Card>
            )}

            {/* Description */}
            <Card>
                <Text style={styles.sectionTitle}>Job Description</Text>
                <Text style={styles.description}>{job.description}</Text>
            </Card>

            {/* Required Skills */}
            <Card>
                <Text style={styles.sectionTitle}>Required Skills</Text>
                <View style={styles.skillsRow}>
                    {job.skills?.map((skill, i) => (
                        <SkillBadge key={i} name={skill} matched={recommendation?.matchedSkills?.includes(skill)} />
                    ))}
                </View>
            </Card>

            {/* Apply Button (Candidates only) */}
            {user?.role === 'candidat' && (
                <View style={styles.applySection}>
                    {hasApplied ? (
                        <View style={styles.appliedBadge}>
                            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                            <Text style={styles.appliedText}>You have applied to this job</Text>
                        </View>
                    ) : (
                        <Button title="Apply Now" onPress={handleApply} loading={applying} icon="paper-plane" />
                    )}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    headerCard: { marginBottom: spacing.md },
    title: { color: colors.textPrimary, ...typography.h2, marginBottom: spacing.xs },
    company: { color: colors.primary, ...typography.body, marginBottom: spacing.md },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.lg },
    salary: { color: colors.success, ...typography.button, marginLeft: spacing.xs },
    metaText: { color: colors.textMuted, ...typography.body, marginLeft: spacing.xs },
    dateText: { color: colors.textMuted, ...typography.caption },
    matchCard: { marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primary },
    matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { color: colors.textPrimary, ...typography.h3, marginBottom: spacing.sm },
    matchExplanation: { color: colors.textSecondary, ...typography.bodySmall, maxWidth: '70%' },
    matchedSkills: { marginTop: spacing.md },
    matchLabel: { color: colors.success, ...typography.caption, marginBottom: spacing.xs },
    missingSkills: { marginTop: spacing.sm },
    missingLabel: { color: colors.warning, ...typography.caption, marginBottom: spacing.xs },
    skillsRow: { flexDirection: 'row', flexWrap: 'wrap' },
    description: { color: colors.textSecondary, ...typography.body, lineHeight: 24 },
    applySection: { marginTop: spacing.md },
    appliedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.success}20`, padding: spacing.md, borderRadius: borderRadius.md },
    appliedText: { color: colors.success, ...typography.button, marginLeft: spacing.sm },
    // Applicants styles
    applicantsCard: { marginBottom: spacing.md },
    applicantsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    countBadge: { backgroundColor: colors.primary, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: spacing.sm },
    countText: { color: '#fff', ...typography.caption, fontWeight: '600' },
    noApplicants: { color: colors.textMuted, ...typography.body, textAlign: 'center', padding: spacing.lg },
    applicantItem: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
    applicantInfo: { flexDirection: 'row', alignItems: 'center' },
    applicantAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', ...typography.button },
    applicantDetails: { flex: 1, marginLeft: spacing.sm },
    applicantName: { color: colors.textPrimary, ...typography.button },
    applicantDate: { color: colors.textMuted, ...typography.caption },
    statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
    statusText: { ...typography.caption, fontWeight: '600' },
    actionButtons: { flexDirection: 'row', marginTop: spacing.sm, gap: spacing.sm },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.sm, borderRadius: borderRadius.sm },
    acceptBtn: { backgroundColor: colors.success },
    rejectBtn: { backgroundColor: colors.error },
    actionBtnText: { color: '#fff', ...typography.button, marginLeft: 4 },
});

export default JobDetailsScreen;

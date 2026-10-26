/**
 * JobGraph - Recruiter Jobs Screen
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { jobAPI } from '../config/api';
import { Card, SkillBadge, LoadingScreen, EmptyState, Button } from '../components';
import { colors, spacing, typography, borderRadius } from '../theme';

const RecruiterJobsScreen = ({ navigation }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMyJobs = useCallback(async () => {
        try {
            const response = await jobAPI.getMyJobs();
            setJobs(response.data.jobs);
        } catch (error) { console.log('Error:', error); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    // Refetch jobs whenever screen comes into focus (e.g., after creating a job)
    useFocusEffect(
        useCallback(() => {
            fetchMyJobs();
        }, [fetchMyJobs])
    );

    const onRefresh = () => { setRefreshing(true); fetchMyJobs(); };

    const formatSalary = (salary) => `${(salary / 1000).toFixed(0)}k €`;
    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const renderJob = ({ item }) => (
        <Card onPress={() => navigation.navigate('JobDetails', { jobId: item.id })} style={styles.jobCard}>
            <View style={styles.jobHeader}>
                <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle}>{item.title}</Text>
                    <Text style={styles.salary}>{formatSalary(item.salary)}</Text>
                </View>
                <View style={styles.applicantsBadge}>
                    <Ionicons name="people" size={16} color={colors.primary} />
                    <Text style={styles.applicantsCount}>{item.applicantCount || 0}</Text>
                </View>
            </View>

            <View style={styles.metaRow}>
                {item.location && (
                    <View style={styles.metaItem}><Ionicons name="location-outline" size={14} color={colors.textMuted} /><Text style={styles.metaText}>{item.location}</Text></View>
                )}
                <View style={styles.metaItem}><Ionicons name="calendar-outline" size={14} color={colors.textMuted} /><Text style={styles.metaText}>{formatDate(item.date_creation)}</Text></View>
            </View>

            <View style={styles.skillsContainer}>
                {item.skills?.slice(0, 4).map((skill, i) => <SkillBadge key={i} name={skill} />)}
                {item.skills?.length > 4 && <Text style={styles.moreSkills}>+{item.skills.length - 4}</Text>}
            </View>

            <TouchableOpacity style={styles.viewApplicantsBtn} onPress={() => navigation.navigate('JobDetails', { jobId: item.id })}>
                <Text style={styles.viewApplicantsText}>View Applicants →</Text>
            </TouchableOpacity>
        </Card>
    );

    if (loading && !refreshing) return <LoadingScreen message="Loading your jobs..." />;

    return (
        <View style={styles.container}>
            <FlatList
                data={jobs}
                renderItem={renderJob}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>My Job Offers</Text>
                            <Text style={styles.headerSubtitle}>{jobs.length} active posting{jobs.length !== 1 ? 's' : ''}</Text>
                        </View>
                        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateJob')}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                }
                ListEmptyComponent={<EmptyState icon="briefcase-outline" title="No Jobs Posted" message="Create your first job offer to start receiving applications." action={() => navigation.navigate('CreateJob')} actionTitle="Create Job" />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.md },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    headerTitle: { color: colors.textPrimary, ...typography.h1 },
    headerSubtitle: { color: colors.textSecondary, ...typography.body, marginTop: spacing.xs },
    addBtn: { width: 48, height: 48, backgroundColor: colors.primary, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    jobCard: { marginBottom: spacing.md },
    jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
    jobInfo: { flex: 1 },
    jobTitle: { color: colors.textPrimary, ...typography.h3 },
    salary: { color: colors.success, ...typography.button, marginTop: 4 },
    applicantsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.primary}20`, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
    applicantsCount: { color: colors.primary, ...typography.button, marginLeft: 4 },
    metaRow: { flexDirection: 'row', marginBottom: spacing.sm },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.md },
    metaText: { color: colors.textMuted, ...typography.caption, marginLeft: 4 },
    skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
    moreSkills: { color: colors.textMuted, ...typography.caption },
    viewApplicantsBtn: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
    viewApplicantsText: { color: colors.primary, ...typography.button, textAlign: 'center' },
});

export default RecruiterJobsScreen;

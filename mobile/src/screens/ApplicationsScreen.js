/**
 * JobGraph - Applications History Screen
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { applicationAPI } from '../config/api';
import { Card, SkillBadge, LoadingScreen, EmptyState } from '../components';
import { colors, spacing, typography, borderRadius } from '../theme';

const STATUS_CONFIG = {
    pending: { color: colors.warning, icon: 'time', label: 'Pending Review' },
    reviewed: { color: colors.info, icon: 'eye', label: 'Reviewed' },
    accepted: { color: colors.success, icon: 'checkmark-circle', label: 'Accepted' },
    rejected: { color: colors.error, icon: 'close-circle', label: 'Rejected' },
};

const ApplicationsScreen = ({ navigation }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchApplications = useCallback(async () => {
        try {
            const response = await applicationAPI.getHistory();
            setApplications(response.data.applications);
        } catch (error) { console.log('Error:', error); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchApplications(); }, [fetchApplications]);

    const onRefresh = () => { setRefreshing(true); fetchApplications(); };

    const handleWithdraw = async (applicationId) => {
        Alert.alert('Withdraw Application', 'Are you sure you want to withdraw this application?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Withdraw', style: 'destructive', onPress: async () => {
                    try {
                        await applicationAPI.withdraw(applicationId);
                        fetchApplications();
                    } catch (err) { Alert.alert('Error', err.message); }
                }
            }
        ]);
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formatSalary = (salary) => `${(salary / 1000).toFixed(0)}k €`;

    const renderApplication = ({ item }) => {
        const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

        return (
            <Card style={styles.appCard}>
                <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                        <Ionicons name={status.icon} size={14} color={status.color} />
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.appliedAt)}</Text>
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('Jobs', { screen: 'JobDetails', params: { jobId: item.job.id } })}>
                    <Text style={styles.jobTitle}>{item.job.title}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.salary}>{formatSalary(item.job.salary)}</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.skillsContainer}>
                    {item.job.skills?.slice(0, 4).map((skill, i) => <SkillBadge key={i} name={skill} />)}
                </View>

                {item.status === 'pending' && (
                    <TouchableOpacity style={styles.withdrawBtn} onPress={() => handleWithdraw(item.id)}>
                        <Text style={styles.withdrawText}>Withdraw Application</Text>
                    </TouchableOpacity>
                )}
            </Card>
        );
    };

    if (loading && !refreshing) return <LoadingScreen message="Loading applications..." />;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Applications</Text>
                <Text style={styles.headerSubtitle}>{applications.length} application{applications.length !== 1 ? 's' : ''}</Text>
            </View>

            <FlatList
                data={applications}
                renderItem={renderApplication}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListEmptyComponent={<EmptyState icon="document-text-outline" title="No Applications Yet" message="Apply to jobs to track your applications here." action={() => navigation.navigate('Jobs')} actionTitle="Browse Jobs" />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: spacing.md, paddingBottom: 0 },
    headerTitle: { color: colors.textPrimary, ...typography.h1 },
    headerSubtitle: { color: colors.textSecondary, ...typography.body, marginTop: spacing.xs },
    list: { padding: spacing.md },
    appCard: { marginBottom: spacing.md },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
    statusText: { ...typography.caption, fontWeight: '600', marginLeft: 4 },
    dateText: { color: colors.textMuted, ...typography.caption },
    jobTitle: { color: colors.textPrimary, ...typography.h3, marginBottom: spacing.xs },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    salary: { color: colors.success, ...typography.button },
    skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
    withdrawBtn: { marginTop: spacing.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.error, borderRadius: borderRadius.sm, alignItems: 'center' },
    withdrawText: { color: colors.error, ...typography.button },
});

export default ApplicationsScreen;

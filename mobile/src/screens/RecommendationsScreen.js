/**
 * JobGraph - Recommendations Screen
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { recommendationAPI } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Card, SkillBadge, ScoreBadge, LoadingScreen, EmptyState } from '../components';
import { colors, spacing, typography, borderRadius } from '../theme';

const RecommendationsScreen = ({ navigation }) => {
    const { user, refreshUser } = useAuth();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRecommendations = useCallback(async () => {
        try {
            const response = await recommendationAPI.getRecommendations();
            setRecommendations(response.data.recommendations);
        } catch (error) {
            console.log('Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchRecommendations(); }, [fetchRecommendations]);

    const onRefresh = () => { setRefreshing(true); refreshUser(); fetchRecommendations(); };

    const formatSalary = (salary) => `${(salary / 1000).toFixed(0)}k €`;

    const renderRecommendation = ({ item, index }) => (
        <TouchableOpacity onPress={() => navigation.navigate('Jobs', { screen: 'JobDetails', params: { jobId: item.job.id } })}>
            <Card style={[styles.recCard, index === 0 && styles.topCard]}>
                {index === 0 && (
                    <View style={styles.topBadge}>
                        <Ionicons name="star" size={14} color={colors.warning} />
                        <Text style={styles.topBadgeText}>Best Match</Text>
                    </View>
                )}

                <View style={styles.cardHeader}>
                    <View style={styles.jobInfo}>
                        <Text style={styles.jobTitle}>{item.job.title}</Text>
                        <Text style={styles.company}>{item.job.recruiterName || 'Company'}</Text>
                        <View style={styles.metaRow}>
                            <Text style={styles.salary}>{formatSalary(item.job.salary)}</Text>
                            {item.job.location && <Text style={styles.location}>• {item.job.location}</Text>}
                        </View>
                    </View>
                    <ScoreBadge score={item.recommendation.score} size="lg" />
                </View>

                <View style={styles.explanationBox}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.explanationText}>{item.recommendation.explanation}</Text>
                </View>

                <View style={styles.skillsContainer}>
                    {item.recommendation.matchedSkills?.slice(0, 5).map((skill, i) => <SkillBadge key={i} name={skill} matched />)}
                </View>

                {item.hasApplied && (
                    <View style={styles.appliedTag}>
                        <Ionicons name="checkmark" size={14} color={colors.info} />
                        <Text style={styles.appliedText}>Applied</Text>
                    </View>
                )}
            </Card>
        </TouchableOpacity>
    );

    const ListHeader = () => (
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Jobs For You</Text>
            <Text style={styles.headerSubtitle}>Based on your skills: {user?.skills?.length || 0} matched</Text>
        </View>
    );

    if (loading && !refreshing) return <LoadingScreen message="Finding your best matches..." />;

    return (
        <View style={styles.container}>
            <FlatList
                data={recommendations}
                renderItem={renderRecommendation}
                keyExtractor={(item) => item.job.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={
                    <EmptyState
                        icon="star-outline"
                        title="No Recommendations Yet"
                        message="Add skills to your profile to get personalized job recommendations."
                        action={() => navigation.navigate('Profile')}
                        actionTitle="Add Skills"
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.md },
    header: { marginBottom: spacing.lg },
    headerTitle: { color: colors.textPrimary, ...typography.h1 },
    headerSubtitle: { color: colors.textSecondary, ...typography.body, marginTop: spacing.xs },
    recCard: { marginBottom: spacing.md },
    topCard: { borderWidth: 1, borderColor: colors.warning },
    topBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.warning}20`, alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full, marginBottom: spacing.sm },
    topBadgeText: { color: colors.warning, ...typography.caption, fontWeight: '600', marginLeft: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    jobInfo: { flex: 1, marginRight: spacing.md },
    jobTitle: { color: colors.textPrimary, ...typography.h3 },
    company: { color: colors.textSecondary, ...typography.bodySmall, marginTop: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
    salary: { color: colors.success, ...typography.button },
    location: { color: colors.textMuted, ...typography.bodySmall, marginLeft: spacing.xs },
    explanationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.success}15`, padding: spacing.sm, borderRadius: borderRadius.sm, marginTop: spacing.md },
    explanationText: { color: colors.success, ...typography.bodySmall, marginLeft: spacing.xs, flex: 1 },
    skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
    appliedTag: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
    appliedText: { color: colors.info, ...typography.caption, marginLeft: 4 },
});

export default RecommendationsScreen;

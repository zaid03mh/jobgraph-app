/**
 * JobGraph - Jobs List Screen
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jobAPI } from '../config/api';
import { Card, SkillBadge, LoadingScreen, EmptyState } from '../components';
import { colors, spacing, typography, borderRadius } from '../theme';

const JobsScreen = ({ navigation }) => {
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ minSalary: '', maxSalary: '' });
    const [showFilters, setShowFilters] = useState(false);

    const fetchJobs = useCallback(async () => {
        try {
            const params = {};
            if (filters.minSalary) params.minSalary = filters.minSalary;
            if (filters.maxSalary) params.maxSalary = filters.maxSalary;
            const response = await jobAPI.getAll(params);
            setJobs(response.data.jobs);
            setFilteredJobs(response.data.jobs);
        } catch (error) {
            console.log('Error fetching jobs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filters]);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    // Filter jobs based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredJobs(jobs);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = jobs.filter(job =>
                job.title.toLowerCase().includes(query) ||
                job.description.toLowerCase().includes(query) ||
                job.skills?.some(skill => skill.toLowerCase().includes(query)) ||
                job.location?.toLowerCase().includes(query)
            );
            setFilteredJobs(filtered);
        }
    }, [searchQuery, jobs]);

    const onRefresh = () => { setRefreshing(true); fetchJobs(); };

    const applyFilters = () => { setLoading(true); setShowFilters(false); fetchJobs(); };

    const clearSearch = () => { setSearchQuery(''); };

    const formatSalary = (salary) => `${(salary / 1000).toFixed(0)}k €`;

    const renderJob = ({ item }) => (
        <Card onPress={() => navigation.navigate('JobDetails', { jobId: item.id })} style={styles.jobCard}>
            <View style={styles.jobHeader}>
                <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle}>{item.title}</Text>
                    <Text style={styles.jobCompany}>{item.recruiterName || 'Company'}</Text>
                </View>
                <View style={styles.salaryBadge}>
                    <Text style={styles.salaryText}>{formatSalary(item.salary)}</Text>
                </View>
            </View>
            <Text style={styles.jobDescription} numberOfLines={2}>{item.description}</Text>
            <View style={styles.jobMeta}>
                {item.location && (
                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.metaText}>{item.location}</Text>
                    </View>
                )}
            </View>
            <View style={styles.skillsContainer}>
                {item.skills?.slice(0, 4).map((skill, index) => <SkillBadge key={index} name={skill} />)}
                {item.skills?.length > 4 && <Text style={styles.moreSkills}>+{item.skills.length - 4}</Text>}
            </View>
        </Card>
    );

    const ListHeader = () => (
        <View style={styles.listHeader}>
            <Text style={styles.resultCount}>
                {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
            </Text>
        </View>
    );

    if (loading && !refreshing) return <LoadingScreen message="Loading jobs..." />;

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search jobs, skills, location..."
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <Ionicons name="options-outline" size={22} color={showFilters ? '#fff' : colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Filter Panel */}
            {showFilters && (
                <View style={styles.filterPanel}>
                    <View style={styles.filterRow}>
                        <View style={styles.filterInput}>
                            <Text style={styles.filterLabel}>Min Salary (€)</Text>
                            <TextInput style={styles.input} value={filters.minSalary} onChangeText={(v) => setFilters({ ...filters, minSalary: v })} placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
                        </View>
                        <View style={styles.filterInput}>
                            <Text style={styles.filterLabel}>Max Salary (€)</Text>
                            <TextInput style={styles.input} value={filters.maxSalary} onChangeText={(v) => setFilters({ ...filters, maxSalary: v })} placeholder="100000" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
                        </View>
                    </View>
                    <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                        <Text style={styles.applyButtonText}>Apply Filters</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={filteredJobs}
                renderItem={renderJob}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={<EmptyState icon="briefcase-outline" title="No Jobs Found" message={searchQuery ? "No jobs match your search. Try different keywords." : "No job offers available. Check back later!"} />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchContainer: { flexDirection: 'row', padding: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, height: 48, borderWidth: 1, borderColor: colors.border },
    searchInput: { flex: 1, color: colors.textPrimary, marginLeft: spacing.sm, ...typography.body },
    filterBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.primary },
    filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterPanel: { backgroundColor: colors.surface, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    filterRow: { flexDirection: 'row' },
    filterInput: { flex: 1, marginRight: spacing.sm },
    filterLabel: { color: colors.textSecondary, ...typography.caption, marginBottom: spacing.xs },
    input: { backgroundColor: colors.backgroundLight, borderRadius: borderRadius.sm, padding: spacing.sm, color: colors.textPrimary },
    applyButton: { backgroundColor: colors.primary, borderRadius: borderRadius.sm, padding: spacing.sm, alignItems: 'center', marginTop: spacing.sm },
    applyButtonText: { color: '#fff', ...typography.button },
    listHeader: { marginBottom: spacing.sm },
    resultCount: { color: colors.textMuted, ...typography.bodySmall },
    list: { padding: spacing.md, paddingTop: 0 },
    jobCard: { marginBottom: spacing.md },
    jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
    jobInfo: { flex: 1, marginRight: spacing.sm },
    jobTitle: { color: colors.textPrimary, ...typography.h3 },
    jobCompany: { color: colors.textSecondary, ...typography.bodySmall, marginTop: 2 },
    salaryBadge: { backgroundColor: `${colors.success}20`, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
    salaryText: { color: colors.success, ...typography.button },
    jobDescription: { color: colors.textMuted, ...typography.bodySmall, marginBottom: spacing.sm },
    jobMeta: { flexDirection: 'row', marginBottom: spacing.sm },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.md },
    metaText: { color: colors.textMuted, ...typography.caption, marginLeft: 4 },
    skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
    moreSkills: { color: colors.textMuted, ...typography.caption },
});

export default JobsScreen;


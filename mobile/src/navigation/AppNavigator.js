/**
 * JobGraph - Navigation Configuration
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import JobsScreen from '../screens/JobsScreen';
import JobDetailsScreen from '../screens/JobDetailsScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ApplicationsScreen from '../screens/ApplicationsScreen';
import RecruiterJobsScreen from '../screens/RecruiterJobsScreen';
import CreateJobScreen from '../screens/CreateJobScreen';
import { LoadingScreen } from '../components';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Screen options
const screenOptions = {
    headerStyle: { backgroundColor: colors.backgroundLight },
    headerTintColor: colors.textPrimary,
    headerTitleStyle: { fontWeight: '600' },
    contentStyle: { backgroundColor: colors.background },
};

// Tab bar options
const tabBarOptions = {
    tabBarStyle: { backgroundColor: colors.backgroundLight, borderTopColor: colors.border, height: 60, paddingBottom: 8 },
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textMuted,
    headerShown: false,
};

// Auth Stack (Login/Register)
const AuthStack = () => (
    <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
);

// Candidate Tabs
const CandidateTabs = () => (
    <Tab.Navigator screenOptions={tabBarOptions}>
        <Tab.Screen name="Jobs" component={JobsStack} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} /> }} />
        <Tab.Screen name="Recommendations" component={RecommendationsScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color} />, tabBarLabel: 'For You' }} />
        <Tab.Screen name="Applications" component={ApplicationsScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} /> }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tab.Navigator>
);

// Recruiter Tabs
const RecruiterTabs = () => (
    <Tab.Navigator screenOptions={tabBarOptions}>
        <Tab.Screen name="MyJobs" component={RecruiterStack} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />, tabBarLabel: 'My Jobs' }} />
        <Tab.Screen name="AllJobs" component={JobsStack} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />, tabBarLabel: 'Browse' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tab.Navigator>
);

// Admin Tabs
const AdminTabs = () => (
    <Tab.Navigator screenOptions={tabBarOptions}>
        <Tab.Screen name="Jobs" component={JobsStack} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} /> }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tab.Navigator>
);

// Jobs Stack (shared)
const JobsStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="JobsList" component={JobsScreen} options={{ title: 'Job Offers' }} />
        <Stack.Screen name="JobDetails" component={JobDetailsScreen} options={{ title: 'Job Details' }} />
    </Stack.Navigator>
);

// Recruiter Stack
const RecruiterStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="RecruiterJobs" component={RecruiterJobsScreen} options={{ title: 'My Job Offers' }} />
        <Stack.Screen name="CreateJob" component={CreateJobScreen} options={{ title: 'Create Job' }} />
        <Stack.Screen name="JobDetails" component={JobDetailsScreen} options={{ title: 'Job Details' }} />
    </Stack.Navigator>
);

// Main Navigator
const AppNavigator = () => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) return <LoadingScreen message="Loading JobGraph..." />;

    return (
        <NavigationContainer>
            {!isAuthenticated ? (
                <AuthStack />
            ) : user?.role === 'recruteur' ? (
                <RecruiterTabs />
            ) : user?.role === 'admin' ? (
                <AdminTabs />
            ) : (
                <CandidateTabs />
            )}
        </NavigationContainer>
    );
};

export default AppNavigator;

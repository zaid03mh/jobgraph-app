/**
 * JobGraph - Main App Entry Point
 * Mobile Job Recommendation System
 * EMSI NoSQL & Big Data Project 2024-2025
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <StatusBar style="light" />
                <AppNavigator />
            </AuthProvider>
        </SafeAreaProvider>
    );
}


import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Error Boundary caught an error:', error, errorInfo);
        // In production, log to error tracking service
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={styles.container}>
                    <View style={styles.content}>
                        <Ionicons name="warning-outline" size={64} color="#DC2626" />
                        <Text style={styles.title}>Something went wrong</Text>
                        <Text style={styles.message}>
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </Text>
                        <Text style={styles.description}>
                            Don't worry, your data is safe. Please try again or restart the app.
                        </Text>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={this.handleReset}
                            >
                                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                                <Text style={styles.buttonText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

// Loading component for async operations
export const LoadingScreen = ({ message = 'Loading...' }: { message?: string }) => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c3b3b" />
        <Text style={styles.loadingText}>{message}</Text>
    </View>
);

// Error screen for specific errors
export const ErrorScreen = ({
    error,
    onRetry,
    onBack
}: {
    error: string;
    onRetry?: () => void;
    onBack?: () => void;
}) => (
    <View style={styles.container}>
        <View style={styles.content}>
            <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>{error}</Text>

            <View style={styles.actions}>
                {onBack && (
                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={onBack}
                    >
                        <Ionicons name="arrow-back" size={18} color="#6c3b3b" />
                        <Text style={styles.buttonTextSecondary}>Go Back</Text>
                    </TouchableOpacity>
                )}
                {onRetry && (
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={onRetry}
                    >
                        <Ionicons name="refresh" size={18} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    </View>
);

// Empty state component
export const EmptyState = ({
    icon,
    title,
    message,
    action,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    message: string;
    action?: { label: string; onPress: () => void };
}) => (
    <View style={styles.emptyContainer}>
        <Ionicons name={icon} size={48} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyMessage}>{message}</Text>
        {action && (
            <TouchableOpacity style={styles.actionButton} onPress={action.onPress}>
                <Text style={styles.actionButtonText}>{action.label}</Text>
            </TouchableOpacity>
        )}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        maxWidth: 320,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    description: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 16,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        minWidth: 120,
        justifyContent: 'center',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#6c3b3b',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 140,
        justifyContent: 'center',
    },
    secondaryButton: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    buttonTextSecondary: {
        color: '#6c3b3b',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#FAFAFA',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyMessage: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20,
    },
    actionButton: {
        backgroundColor: '#6c3b3b',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
});
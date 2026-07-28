import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { formatCount } from '../../../utils/formatters';

export default function PostDetailScreen() {
    const router = useRouter();
    const { reviewId, activityType = "rated" } = useLocalSearchParams<{ reviewId: string; activityType?: string }>();

    const currentUser = useQuery(api.users.viewer);
    const userReviews = useQuery(api.items.getUserReviews) || [];
    
    // Safely locate the exact post matching BOTH the review ID and the activityType
    const post = userReviews.find((r: any) => r._id === reviewId && r.activityType === activityType) || userReviews.find((r: any) => r._id === reviewId);

    const toggleLike = useMutation(api.items.toggleLikeReview);
    const addComment = useMutation(api.items.addCommentToReview);
    const deleteComment = useMutation(api.items.deleteCommentFromReview);

    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!post) {
        return (
            <View style={styles.root}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>Post not found.</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const isLikedByMe = post.likes?.includes(currentUser?._id);
    const likesTotal = post.likes?.length || 0;
    const comments = post.comments || [];

    const handleSendComment = async () => {
        if (!commentText.trim()) return;
        setIsSubmitting(true);
        try {
            await addComment({
                reviewId: reviewId as string,
                text: commentText.trim(),
                activityType: post.activityType,
            });
            setCommentText('');
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to post comment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = (commentId: string) => {
        Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteComment({
                            reviewId: reviewId as string,
                            commentId,
                            activityType: post.activityType,
                        });
                    } catch (err: any) {
                        Alert.alert("Error", err.message || "Could not delete comment.");
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={22} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post Details</Text>
                <View style={{ width: 22 }} />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.postCard}>
                        <View style={styles.postHeader}>
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitial}>
                                    {(currentUser?.name || currentUser?.username || "U").charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.postFullName}>{currentUser?.name || "User"}</Text>
                                <Text style={styles.postUsername}>@{currentUser?.username || "user"}</Text>
                            </View>
                        </View>

                        <Text style={styles.postMainText}>
                            {post.activityType === 'updated' ? (
                                <>
                                    Updated review for <Text style={styles.boldText}>{post.itemName}</Text> at <Text style={styles.boldText}>{post.restaurantName}</Text>
                                </>
                            ) : (
                                <>
                                    Rated <Text style={styles.boldText}>{post.itemName}</Text> from <Text style={styles.boldText}>{post.restaurantName}</Text>
                                </>
                            )}
                        </Text>

                        {post.notes ? (
                            <View style={styles.notesBox}>
                                <Text style={styles.notesText}>"{post.notes}"</Text>
                            </View>
                        ) : null}

                        <View style={styles.metricsRow}>
                            <TouchableOpacity 
                                style={styles.likeInteraction}
                                onPress={() => toggleLike({ 
                                    reviewId: reviewId as string, 
                                    activityType: post.activityType 
                                })}
                            >
                                <Ionicons 
                                    name={isLikedByMe ? "heart" : "heart-outline"} 
                                    size={18} 
                                    color={isLikedByMe ? "#DC2626" : "#6B7280"} 
                                />
                                <Text style={styles.interactionCount}>{formatCount(likesTotal)}</Text>
                            </TouchableOpacity>

                            <View style={styles.starRow}>
                                <Ionicons name="star" size={16} color="#FBBF24" />
                                <Text style={styles.ratingScoreText}>{post.overallRating.toFixed(1)} / 5.0</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.commentsSection}>
                        <Text style={styles.commentsHeading}>Comments ({formatCount(comments.length)})</Text>
                        {comments.length === 0 ? (
                            <Text style={styles.noCommentsText}>No comments yet. Start the conversation!</Text>
                        ) : (
                            comments.map((comment: any) => {
                                const isMyComment = comment.userId === currentUser?._id;
                                return (
                                    <View key={comment.commentId} style={styles.commentItem}>
                                        <View style={styles.commentAvatar}>
                                            <Text style={styles.commentAvatarInitial}>{comment.userName.charAt(0)}</Text>
                                        </View>
                                        <View style={styles.commentBody}>
                                            <View style={styles.commentHeaderRow}>
                                                <Text style={styles.commentUserHandle}>{comment.userHandle}</Text>
                                                {isMyComment && (
                                                    <TouchableOpacity onPress={() => handleDeleteComment(comment.commentId)}>
                                                        <Ionicons name="trash-outline" size={14} color="#DC2626" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                            <Text style={styles.commentText}>{comment.text}</Text>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </ScrollView>

                <View style={styles.footerInputContainer}>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Post a comment..."
                        placeholderTextColor="#9CA3AF"
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        maxLength={200}
                    />
                    <TouchableOpacity 
                        style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]} 
                        disabled={!commentText.trim() || isSubmitting}
                        onPress={handleSendComment}
                    >
                        <Ionicons name="send" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 10,
    },
    backButton: {
        backgroundColor: '#6c3b3b',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 16,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    iconButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1F2937',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 120,
    },
    postCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 20,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    avatarPlaceholder: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6c3b3b',
    },
    postFullName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    postUsername: {
        fontSize: 12,
        color: '#6B7280',
    },
    postMainText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        marginBottom: 12,
    },
    boldText: {
        fontWeight: '800',
        color: '#1F2937',
    },
    notesBox: {
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 12,
    },
    notesText: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#4B5563',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    starRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingScoreText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#D97706',
    },
    likeInteraction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    interactionCount: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    commentsSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    commentsHeading: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 12,
    },
    noCommentsText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    commentItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    commentAvatarInitial: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
    },
    commentBody: {
        flex: 1,
    },
    commentHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    commentUserHandle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
    },
    commentText: {
        fontSize: 12,
        color: '#374151',
        lineHeight: 16,
    },
    footerInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 28,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 10,
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        fontSize: 12,
        color: '#374151',
        maxHeight: 80,
    },
    sendButton: {
        backgroundColor: '#6c3b3b',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
});
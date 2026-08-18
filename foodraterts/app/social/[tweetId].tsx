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
import { api } from '../../convex/_generated/api';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { formatCount } from '../../utils/formatters';
import { BookmarkButton } from '../../components/BookmarkButton';
import { CommentList } from '../../components/CommentList';
import { ReportButton } from '../../components/ReportButton';
import type { ThreadedComment } from '../../components/CommentList';

export default function TweetDetailScreen() {
    const router = useRouter();
    const { tweetId } = useLocalSearchParams<{ tweetId: string }>();

    const currentUser = useQuery(api.users.viewer);
    const tweet = useQuery(api.tweets.getTweetById, { tweetId: tweetId as any });

    const toggleLikeTweet = useMutation(api.tweets.toggleLikeTweet);
    const addCommentToTweet = useMutation(api.tweets.addCommentToTweet);
    const deleteCommentFromTweet = useMutation(api.tweets.deleteCommentFromTweet);

    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyTarget, setReplyTarget] = useState<ThreadedComment | null>(null);

    if (!tweet) {
        return (
            <View style={styles.root}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>Tweet not found.</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const isLikedByMe = currentUser?._id ? tweet.likes?.includes(String(currentUser._id)) : false;
    const likesTotal = tweet.likes?.length || 0;
    const comments = tweet.comments || [];

    // Normalize comments for CommentList
    const normalizedComments: ThreadedComment[] = comments.map((comment: any) => ({
        id: comment._id || comment.commentId,
        userId: comment.userId,
        authorName: comment.userName || 'User',
        authorHandle: comment.userHandle || '@user',
        text: comment.body,
        createdAt: comment.createdAt,
        replyToCommentId: comment.replyToCommentId,
        replyToUserName: comment.replyToUserName,
    }));

    const handleSendComment = async () => {
        if (!commentText.trim()) return;
        setIsSubmitting(true);
        try {
            await addCommentToTweet({
                tweetId: tweetId as any,
                body: commentText.trim(),
                replyToCommentId: replyTarget?.id,
            });
            setCommentText('');
            setReplyTarget(null);
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to post comment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = (comment: ThreadedComment) => {
        Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteCommentFromTweet({
                            tweetId: tweetId as any,
                            commentId: comment.id,
                        });
                    } catch (err: any) {
                        Alert.alert("Error", err.message || "Could not delete comment.");
                    }
                },
            },
        ]);
    };

    const handleReply = (comment: ThreadedComment) => {
        setReplyTarget(comment);
    };

    const handleReport = (comment: ThreadedComment) => {
        // Will be implemented in Phase 3
        console.log('Report comment:', comment.id);
    };

    const handleSendComment = async () => {
        if (!commentText.trim()) return;
        setIsSubmitting(true);
        try {
            await addCommentToTweet({
                tweetId: tweetId as any,
                body: commentText.trim(),
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
                        await deleteCommentFromTweet({
                            tweetId: tweetId as any,
                            commentId,
                        });
                    } catch (err: any) {
                        Alert.alert("Error", err.message || "Could not delete comment.");
                    }
                },
            },
        ]);
    };

    const userHandle = currentUser?.username ? `@${currentUser.username}` : "@user";
    const userFullName = currentUser?.name ? currentUser.name : "User";

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={22} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tweet Details</Text>
                <View style={styles.headerRightControls}>
                    <BookmarkButton targetType="tweet" targetId={tweetId as string} />
                    <ReportButton contentType="tweet" contentId={tweetId as string} />
                </View>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.postCard}>
                        <View style={styles.postHeader}>
                            <ProfileAvatar
                                storageId={tweet.authorProfilePicture}
                                size={42}
                                variant="light"
                                fallbackText={tweet.authorName}
                                style={styles.tweetAvatar}
                            />
                            <View>
                                <Text style={styles.postFullName}>{tweet.authorName}</Text>
                                <Text style={styles.postUsername}>{tweet.authorHandle}</Text>
                            </View>
                        </View>

                        <Text style={styles.postMainText}>{tweet.body}</Text>

                        <View style={styles.metricsRow}>
                            <TouchableOpacity
                                style={styles.likeInteraction}
                                onPress={() => toggleLikeTweet({ tweetId: tweet._id })}
                            >
                                <Ionicons
                                    name={isLikedByMe ? "heart" : "heart-outline"}
                                    size={18}
                                    color={isLikedByMe ? "#DC2626" : "#6B7280"}
                                />
                                <Text style={styles.interactionCount}>{formatCount(likesTotal)}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.commentsSection}>
                        <Text style={styles.commentsHeading}>Comments ({formatCount(comments.length)})</Text>
                        {normalizedComments.length === 0 ? (
                            <Text style={styles.noCommentsText}>No comments yet. Start the conversation!</Text>
                        ) : (
                            <CommentList
                                comments={normalizedComments}
                                currentUserId={currentUser?._id}
                                onReply={handleReply}
                                onRequestDelete={handleDeleteComment}
                                onReport={handleReport}
                            />
                        )}
                    </View>
                </ScrollView>

                {replyTarget && (
                    <View style={styles.replyBanner}>
                        <Text style={styles.replyBannerText}>
                            Replying to {replyTarget.authorHandle}
                        </Text>
                        <TouchableOpacity onPress={() => setReplyTarget(null)}>
                            <Ionicons name="close-circle" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.footerInputContainer}>
                    <TextInput
                        style={styles.commentInput}
                        placeholder={replyTarget ? `Reply to ${replyTarget.authorHandle}...` : "Post a comment..."}
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
    headerRightControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    replyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F3F4F6',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    replyBannerText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
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
    tweetAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    blankAvatarTweet: {
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
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
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
    replyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F3F4F6',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    replyBannerText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
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
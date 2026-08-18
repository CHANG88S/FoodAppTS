import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReportButton } from './ReportButton';

export type ThreadedComment = {
  id: string;
  userId: string;
  authorName: string;
  authorHandle: string;
  text: string;
  createdAt: number;
  replyToCommentId?: string;
  replyToUserName?: string;
};

type Props = {
  comments: ThreadedComment[];
  currentUserId?: string;
  onReply: (comment: ThreadedComment) => void;
  onRequestDelete: (comment: ThreadedComment) => void;
  onReport?: (comment: ThreadedComment) => void;
  parentType?: 'tweet' | 'review';
  parentId?: string;
};

export function CommentList({
  comments,
  currentUserId,
  onReply,
  onRequestDelete,
  onReport,
  parentType,
  parentId,
}: Props) {
  // Split into top-level and group replies by parent
  const topLevel = comments.filter((c) => !c.replyToCommentId);
  const repliesByParent = new Map<string, ThreadedComment[]>();

  comments.forEach((comment) => {
    if (comment.replyToCommentId) {
      if (!repliesByParent.has(comment.replyToCommentId)) {
        repliesByParent.set(comment.replyToCommentId, []);
      }
      repliesByParent.get(comment.replyToCommentId)!.push(comment);
    }
  });

  const renderComment = (comment: ThreadedComment, isReply = false) => {
    const isMyComment = comment.userId === currentUserId;
    const replies = repliesByParent.get(comment.id) || [];

    return (
      <View key={comment.id} style={isReply ? styles.replyCommentItem : styles.commentItem}>
        <View style={isReply ? styles.replyCommentAvatar : styles.commentAvatar}>
          <Text style={styles.commentAvatarInitial}>
            {comment.authorName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.commentBody}>
          <View style={styles.commentHeaderRow}>
            <Text style={styles.commentUserHandle}>{comment.authorHandle}</Text>
            <View style={styles.commentActions}>
              <TouchableOpacity
                onPress={() => onReply(comment)}
                style={styles.replyButton}
              >
                <Text style={styles.replyButtonText}>Reply</Text>
              </TouchableOpacity>
              {isMyComment && (
                <TouchableOpacity onPress={() => onRequestDelete(comment)}>
                  <Ionicons name="trash-outline" size={14} color="#DC2626" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={(e) => e.stopPropagation()}>
                <ReportButton
                  contentType="comment"
                  contentId={parentType === 'tweet'
                    ? `${parentId}:${comment.id}`
                    : `${parentId}:comment:${comment.id}`}
                  ownerId={comment.userId}
                  size={14}
                />
              </TouchableOpacity>
            </View>
          </View>

          {comment.replyToUserName && (
            <Text style={styles.replyingToText}>
              Replying to {comment.replyToUserName}
            </Text>
          )}

          <Text style={styles.commentText}>{comment.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.commentsContainer}>
      {topLevel.map((comment) => {
        const replies = repliesByParent.get(comment.id) || [];
        return (
          <View key={comment.id}>
            {renderComment(comment)}
            {replies.length > 0 && (
              <View style={styles.repliesContainer}>
                {replies.map((reply) => renderComment(reply, true))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  commentsContainer: {
    gap: 8,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  replyCommentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginLeft: 20,
    marginTop: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyCommentAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    marginBottom: 4,
  },
  commentUserHandle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  replyButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6c3b3b',
  },
  replyingToText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },
  repliesContainer: {
    marginLeft: 10,
    marginTop: 4,
    gap: 4,
  },
});
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type ModerationTab = 'places' | 'menuItems' | 'reports' | 'userReports';
type SuggestionType = 'places' | 'menuItems';

export default function ModerationScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ModerationTab>('places');
  const [rejectNote, setRejectNote] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Chain modal state
  const [chainModalVisible, setChainModalVisible] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [potentialChains, setPotentialChains] = useState<any[]>([]);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [copyMenuItems, setCopyMenuItems] = useState(true);

  const isStaff = useQuery(api.authz.isStaff) ?? false;
  const placeSuggestions = useQuery(api.suggestions.listPlaceSuggestions, { status: 'pending' }) ?? [];
  const menuItemSuggestions = useQuery(api.suggestions.listMenuItemSuggestions, { status: 'pending' }) ?? [];
  const pendingFlags = useQuery(api.moderation.getPendingFlags) ?? [];
  const pendingUserReports = useQuery(api.moderation.getPendingUserReports) ?? [];

  const approvePlace = useMutation(api.suggestions.approvePlaceSuggestion);
  const approvePlaceWithChain = useMutation(api.suggestions.approvePlaceSuggestionWithChain);
  const rejectPlace = useMutation(api.suggestions.rejectPlaceSuggestion);
  const approveMenuItem = useMutation(api.suggestions.approveMenuItemSuggestion);
  const rejectMenuItem = useMutation(api.suggestions.rejectMenuItemSuggestion);
  const reviewFlag = useMutation(api.moderation.reviewFlag);
  const reviewUserReport = useMutation(api.moderation.reviewUserReport);

  // Gate access
  if (!isStaff) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Moderation</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
          <Text style={styles.accessDeniedText}>
            You don't have permission to access this page.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleApprove = async (type: SuggestionType, suggestion: any) => {
    try {
      if (type === 'places') {
        const result = await approvePlaceWithChain({
          suggestionId: suggestion._id as any,
          chainRestaurantId: undefined,
          copyMenuItems: false,
        });

        if (result && result.chainsFound && result.chainsFound.length > 0) {
          setSelectedSuggestion(suggestion);
          setPotentialChains(result.chainsFound);
          setSelectedChainId(null);
          setCopyMenuItems(true);
          setChainModalVisible(true);
          return;
        }

        Alert.alert('✅ Approved', 'Place suggestion has been approved and added to the database.');
      } else {
        await approveMenuItem({ suggestionId: suggestion._id as any });
        Alert.alert('✅ Approved', 'Menu item suggestion has been approved and added.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve suggestion');
    }
  };

  const handleReject = async (type: SuggestionType, id: string) => {
    if (!rejectNote.trim()) {
      Alert.alert('Note Required', 'Please provide a reason for rejection (optional but helpful).');
      setRejectingId(id);
      return;
    }

    try {
      if (type === 'places') {
        await rejectPlace({ suggestionId: id as any, note: rejectNote.trim() });
      } else {
        await rejectMenuItem({ suggestionId: id as any, note: rejectNote.trim() });
      }
      Alert.alert('Rejected', 'Suggestion has been rejected.');
      setRejectNote('');
      setRejectingId(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject suggestion');
    }
  };

  const handleRejectPress = (id: string) => {
    setRejectingId(id);
    setRejectNote('');
  };

  const handleCancelReject = () => {
    setRejectingId(null);
    setRejectNote('');
  };

  const handleChainApprove = async () => {
    try {
      if (!selectedSuggestion) return;

      const result = await approvePlaceWithChain({
        suggestionId: selectedSuggestion._id as any,
        chainRestaurantId: selectedChainId as any,
        copyMenuItems: copyMenuItems,
      });

      setChainModalVisible(false);
      setSelectedSuggestion(null);
      setSelectedChainId(null);
      setPotentialChains([]);

      Alert.alert(
        '✅ Approved',
        `Place suggestion has been approved as a chain location${(result.copiedItemsCount || 0) > 0 ? ` with ${result.copiedItemsCount} menu items${result.logoCopied ? ' and logo' : ''} copied!` : result.logoCopied ? ' with logo copied!' : '.'}`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve suggestion');
    }
  };

  const handleApproveWithoutChain = async () => {
    try {
      if (!selectedSuggestion) return;

      await approvePlace({ suggestionId: selectedSuggestion._id as any });
      setChainModalVisible(false);
      setSelectedSuggestion(null);
      setSelectedChainId(null);
      setPotentialChains([]);

      Alert.alert('✅ Approved', 'Place suggestion has been approved and added to the database.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve suggestion');
    }
  };

  const handleReviewFlag = async (flag: any, action: 'remove_content' | 'dismiss' | 'resolve') => {
    try {
      await reviewFlag({
        flagId: flag._id,
        action,
        notes: action === 'dismiss' ? 'Dismissed by moderator' : undefined,
      });
      Alert.alert('Success', `Content ${action === 'remove_content' ? 'removed' : action === 'resolve' ? 'resolved' : 'dismissed'} successfully.`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to review flag');
    }
  };

  const handleReviewUserReport = async (report: any, action: 'warned' | 'suspended' | 'banned' | 'dismissed') => {
    try {
      await reviewUserReport({
        reportId: report._id,
        action,
        notes: action === 'dismissed' ? 'Dismissed by moderator' : undefined,
      });
      Alert.alert('Success', `User report ${action === 'dismissed' ? 'dismissed' : 'action'} successfully.`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to review user report');
    }
  };

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'places': return placeSuggestions;
      case 'menuItems': return menuItemSuggestions;
      case 'reports': return pendingFlags;
      case 'userReports': return pendingUserReports;
      default: return [];
    }
  };

  const suggestions = getCurrentItems();
  const isLoading = !placeSuggestions || !menuItemSuggestions || !pendingFlags || !pendingUserReports;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moderation Queue</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'places' && styles.activeTab]}
          onPress={() => setActiveTab('places')}
        >
          <Text style={[styles.tabText, activeTab === 'places' && styles.activeTabText]}>
            Places ({placeSuggestions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'menuItems' && styles.activeTab]}
          onPress={() => setActiveTab('menuItems')}
        >
          <Text style={[styles.tabText, activeTab === 'menuItems' && styles.activeTabText]}>
            Items ({menuItemSuggestions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
            Reports ({pendingFlags.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'userReports' && styles.activeTab]}
          onPress={() => setActiveTab('userReports')}
        >
          <Text style={[styles.tabText, activeTab === 'userReports' && styles.activeTabText]}>
            Users ({pendingUserReports.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#6c3b3b" />
        </View>
      ) : suggestions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={64} color="#059669" />
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'reports' ? 'No pending reports' :
             activeTab === 'userReports' ? 'No pending user reports' :
             `No pending ${activeTab === 'places' ? 'place' : 'menu item'} suggestions`}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeTab === 'places' && suggestions.map((suggestion: any) => (
            <View key={suggestion._id} style={styles.card}>
              <PlaceSuggestionCard suggestion={suggestion} />

              {rejectingId === suggestion._id ? (
                <View style={styles.rejectForm}>
                  <TextInput
                    style={styles.rejectInput}
                    placeholder="Rejection reason (optional)"
                    value={rejectNote}
                    onChangeText={setRejectNote}
                    multiline
                  />
                  <View style={styles.rejectActions}>
                    <TouchableOpacity
                      style={[styles.rejectActionButton, styles.cancelButton]}
                      onPress={handleCancelReject}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectActionButton, styles.confirmButton]}
                      onPress={() => handleReject(activeTab as 'places' | 'menuItems', suggestion._id)}
                    >
                      <Text style={styles.confirmButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApprove(activeTab as 'places' | 'menuItems', suggestion)}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFF" />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRejectPress(suggestion._id)}
                  >
                    <Ionicons name="close" size={18} color="#FFF" />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {activeTab === 'menuItems' && suggestions.map((suggestion: any) => (
            <View key={suggestion._id} style={styles.card}>
              <MenuItemSuggestionCard suggestion={suggestion} />

              {rejectingId === suggestion._id ? (
                <View style={styles.rejectForm}>
                  <TextInput
                    style={styles.rejectInput}
                    placeholder="Rejection reason (optional)"
                    value={rejectNote}
                    onChangeText={setRejectNote}
                    multiline
                  />
                  <View style={styles.rejectActions}>
                    <TouchableOpacity
                      style={[styles.rejectActionButton, styles.cancelButton]}
                      onPress={handleCancelReject}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectActionButton, styles.confirmButton]}
                      onPress={() => handleReject(activeTab as 'places' | 'menuItems', suggestion._id)}
                    >
                      <Text style={styles.confirmButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApprove(activeTab as 'places' | 'menuItems', suggestion)}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFF" />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRejectPress(suggestion._id)}
                  >
                    <Ionicons name="close" size={18} color="#FFF" />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {activeTab === 'reports' && (suggestions as any[]).map((flag: any) => (
            <View key={flag._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.reasonChip}>
                  <Text style={styles.reasonChipText}>{flag.reason}</Text>
                </View>
                <Text style={styles.timestamp}>
                  {new Date(flag.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <Text style={styles.reporterText}>
                Reported by: {flag.reporterUsername}
              </Text>

              {flag.preview ? (
                <View style={styles.contentPreview}>
                  {flag.preview.kind === 'tweet' ? (
                    <>
                      <Text style={styles.previewKind}>Tweet</Text>
                      <Text style={styles.previewBody}>By @{flag.preview.authorUsername}</Text>
                      <Text style={styles.previewText} numberOfLines={3}>{flag.preview.body}</Text>
                    </>
                  ) : flag.preview.kind === 'review' ? (
                    <>
                      <Text style={styles.previewKind}>Review</Text>
                      <Text style={styles.previewBody}>By @{flag.preview.authorUsername}</Text>
                      <Text style={styles.previewText}>
                        {flag.preview.overallRating} ⭐ • {flag.preview.itemName} from {flag.preview.restaurantName}
                      </Text>
                      {flag.preview.notes && (
                        <Text style={styles.previewNotes}>"{flag.preview.notes}"</Text>
                      )}
                    </>
                  ) : flag.preview.kind === 'comment' ? (
                    <>
                      <Text style={styles.previewKind}>Comment</Text>
                      <Text style={styles.previewBody}>By @{flag.preview.authorUsername}</Text>
                      <Text style={styles.previewText} numberOfLines={2}>{flag.preview.text}</Text>
                      <Text style={styles.previewNotes}>On: {flag.preview.parentSummary}</Text>
                    </>
                  ) : (
                    <Text style={styles.previewUnavailable}>Content unavailable</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.previewUnavailable}>Content unavailable</Text>
              )}

              {flag.description && (
                <Text style={styles.descriptionText}>Description: "{flag.description}"</Text>
              )}

              <View style={styles.moderationActions}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    Alert.alert(
                      'Remove Content',
                      'This will permanently delete the content and notify its owner.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => handleReviewFlag(flag, 'remove_content')
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash" size={16} color="#FFF" />
                  <Text style={styles.removeButtonText}>Remove Content</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => handleReviewFlag(flag, 'dismiss')}
                >
                  <Ionicons name="close-circle" size={16} color="#6B7280" />
                  <Text style={styles.dismissButtonText}>Dismiss</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resolveButton}
                  onPress={() => handleReviewFlag(flag, 'resolve')}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.resolveButtonText}>Resolve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {activeTab === 'userReports' && (suggestions as any[]).map((report: any) => (
            <View key={report._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.reasonChip}>
                  <Text style={styles.reasonChipText}>{report.reason}</Text>
                </View>
                <Text style={styles.timestamp}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <Text style={styles.reporterText}>
                Reported by: {report.reporterUsername}
              </Text>

              <View style={styles.userPreview}>
                <Ionicons name="person" size={20} color="#6c3b3b" />
                <Text style={styles.userPreviewName}>{report.reportedUsername}</Text>
                {report.reportedName && (
                  <Text style={styles.userPreviewHandle}>({report.reportedName})</Text>
                )}
                <Text style={styles.userPreviewStats}>{report.reportedUserReviewCount} reviews</Text>
              </View>

              {report.description && (
                <Text style={styles.descriptionText}>Description: "{report.description}"</Text>
              )}

              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.userActionWarn}
                  onPress={() => {
                    Alert.alert(
                      'Warn User',
                      'Send a warning to this user?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Warn',
                          onPress: () => handleReviewUserReport(report, 'warned')
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="warning" size={16} color="#FFF" />
                  <Text style={styles.userActionText}>Warn</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.userActionSuspend}
                  onPress={() => {
                    Alert.alert(
                      'Suspend User',
                      'Suspend this user account?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Suspend',
                          onPress: () => handleReviewUserReport(report, 'suspended')
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="remove-circle" size={16} color="#FFF" />
                  <Text style={styles.userActionText}>Suspend</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.userActionBan}
                  onPress={() => {
                    Alert.alert(
                      'Ban User',
                      'Ban this user account?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Ban',
                          style: 'destructive',
                          onPress: () => handleReviewUserReport(report, 'banned')
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="person-remove" size={16} color="#FFF" />
                  <Text style={styles.userActionText}>Ban</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => handleReviewUserReport(report, 'dismissed')}
                >
                  <Ionicons name="close-circle" size={16} color="#6B7280" />
                  <Text style={styles.dismissButtonText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Chain Detection Modal */}
      {chainModalVisible && selectedSuggestion && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="link" size={24} color="#6c3b3b" />
              <Text style={styles.modalTitle}>Potential Chain Detected</Text>
            </View>

            <Text style={styles.modalDescription}>
              Found {potentialChains.length} existing location(s) with the same name "{selectedSuggestion.restaurantName}". Is this a chain location?
            </Text>

            {potentialChains.map((chain: any) => (
              <TouchableOpacity
                key={chain._id}
                style={[styles.chainOption, selectedChainId === chain._id && styles.selectedChainOption]}
                onPress={() => setSelectedChainId(chain._id)}
              >
                <View style={styles.chainOptionHeader}>
                  <Text style={styles.chainOptionName}>{chain.restaurantName}</Text>
                  {selectedChainId === chain._id && (
                    <Ionicons name="checkmark-circle" size={20} color="#6c3b3b" />
                  )}
                </View>
                <Text style={styles.chainOptionAddress}>
                  📍 {chain.address}, {chain.city}, {chain.state}
                </Text>
                <Text style={styles.chainOptionMenuCount}>
                  🍽️ {chain.menuItemCount} menu items available to copy
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.copyOptionRow}>
              <TouchableOpacity
                style={styles.copyOptionButton}
                onPress={() => setCopyMenuItems(!copyMenuItems)}
              >
                <View style={styles.checkbox}>
                  {copyMenuItems && <Ionicons name="checkmark" size={16} color="#6c3b3b" />}
                </View>
                <Text style={styles.copyOptionText}>Copy menu items from selected location</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={handleApproveWithoutChain}
              >
                <Text style={styles.secondaryButtonText}>Approve as New Location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={handleChainApprove}
                disabled={!selectedChainId}
              >
                <Text style={styles.primaryButtonText}>
                  {`Approve as Chain ${copyMenuItems && selectedChainId ? '+ Copy Items' : ''}`}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => {
                setChainModalVisible(false);
                setSelectedSuggestion(null);
                setSelectedChainId(null);
                setPotentialChains([]);
              }}
            >
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function PlaceSuggestionCard({ suggestion }: { suggestion: any }) {
  return (
    <View style={styles.cardContent}>
      <View style={styles.suggester}>
        <Ionicons name="person-circle" size={16} color="#6B7280" />
        <Text style={styles.suggesterText}>
          @{suggestion.suggesterUsername}
          {suggestion.suggesterName && ` (${suggestion.suggesterName})`}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(suggestion.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{suggestion.restaurantName}</Text>
      <View style={styles.details}>
        <Text style={styles.detail}>📍 {suggestion.address}</Text>
        <Text style={styles.detail}>
          {suggestion.city}, {suggestion.state}
        </Text>
        {suggestion.phone && <Text style={styles.detail}>📞 {suggestion.phone}</Text>}
        {suggestion.category && <Text style={styles.detail}>🏷️ {suggestion.category}</Text>}
        {suggestion.website && <Text style={styles.detail}>🌐 {suggestion.website}</Text>}
      </View>
    </View>
  );
}

function MenuItemSuggestionCard({ suggestion }: { suggestion: any }) {
  return (
    <View style={styles.cardContent}>
      <View style={styles.suggester}>
        <Ionicons name="person-circle" size={16} color="#6B7280" />
        <Text style={styles.suggesterText}>
          @{suggestion.suggesterUsername}
          {suggestion.suggesterName && ` (${suggestion.suggesterName})`}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(suggestion.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{suggestion.itemName}</Text>
      <View style={styles.details}>
        <Text style={styles.detail}>🍽️ {suggestion.restaurantName}</Text>
        {suggestion.category && (
          <Text style={styles.detail}>
            🏷️ {Array.isArray(suggestion.category) ? suggestion.category.join(', ') : suggestion.category}
          </Text>
        )}
        {suggestion.price && <Text style={styles.detail}>💰 ${suggestion.price.toFixed(2)}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6c3b3b',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#6c3b3b',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  suggester: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  suggesterText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  details: {
    gap: 4,
  },
  detail: {
    fontSize: 13,
    color: '#374151',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectForm: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
    gap: 12,
  },
  rejectInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rejectActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  chainOption: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  selectedChainOption: {
    borderColor: '#6c3b3b',
    backgroundColor: '#F9FAFB',
  },
  chainOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chainOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  chainOptionAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  chainOptionMenuCount: {
    fontSize: 12,
    color: '#6c3b3b',
    fontWeight: '500',
  },
  copyOptionRow: {
    marginVertical: 16,
  },
  copyOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6c3b3b',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelModalButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelModalText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  // New moderation styles
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reasonChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reasonChipText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reporterText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  contentPreview: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  previewKind: {
    fontSize: 11,
    color: '#6c3b3b',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  previewBody: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 2,
  },
  previewText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
  previewNotes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  previewUnavailable: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  descriptionText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  moderationActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  removeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  dismissButtonText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  resolveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  resolveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  userPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  userPreviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  userPreviewHandle: {
    fontSize: 12,
    color: '#6B7280',
  },
  userPreviewStats: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  userActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  userActionWarn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  userActionSuspend: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  userActionBan: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  userActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
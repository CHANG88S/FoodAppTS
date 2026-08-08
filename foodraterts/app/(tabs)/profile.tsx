import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Modal,
    ScrollView,
    Alert,
    Platform,
    StatusBar,
    LayoutAnimation,
    UIManager,
    TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useNavigation, useFocusEffect } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DrawerActions } from '@react-navigation/native';

import { formatCount } from '../../utils/formatters';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Profile() {
    const router = useRouter();
    const navigation = useNavigation<any>();

    const currentUser = useQuery(api.users.viewer);
    const userReviews = useQuery(api.items.getUserReviews) || [];
    const deleteReviewMutation = useMutation(api.items.deleteItemReview);
    const toggleLike = useMutation(api.items.toggleLikeReview);

    // Fetch followers and following counts
    const followers = useQuery(
        api.users.getFollowers,
        currentUser?._id ? { userId: currentUser._id } : "skip"
    );
    const following = useQuery(
        api.users.getFollowing,
        currentUser?._id ? { userId: currentUser._id } : "skip"
    );

    // Queries & mutations for tweets feature
    const userTweets = useQuery(api.tweets?.getUserTweets) || [];
    const createTweetMutation = useMutation(api.tweets?.createTweet);
    const generateUploadUrlMutation = useMutation(api.tweets?.generateUploadUrl);
    const deleteTweetMutation = useMutation(api.tweets?.deleteTweet);
    const toggleLikeTweet = useMutation(api.tweets?.toggleLikeTweet);

    const [isProfileModal, setProfileModalVisible] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('ACTIVITY');
    const [expandedRestaurant, setExpandedRestaurant] = useState<string | null>(null);
    const [isAuthModalVisible, setAuthModalVisible] = useState(false);

    // Unified Location Filter States
    const [selectedStateFilter, setSelectedStateFilter] = useState<string>('ALL');
    const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [expandedStateInMenu, setExpandedStateInMenu] = useState<string | null>(null);

    // Tweet creation state
    const [tweetBody, setTweetBody] = useState('');
    const [tweetImageUri, setTweetImageUri] = useState<string | null>(null);
    const [tweetImageAsset, setTweetImageAsset] = useState<any>(null);
    const [isPostingTweet, setIsPostingTweet] = useState(false);

    const toggleRestaurantDropdown = (restaurantName: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedRestaurant(prev => (prev === restaurantName ? null : restaurantName));
    };

    // Check if user is authenticated, show modal if not
    useFocusEffect(
        useCallback(() => {
            if (currentUser === null) {
                setAuthModalVisible(true);
            }
        }, [currentUser])
    );

    const getSweetnessLabel = (val: number) => {
        if (val === 0) return 'No Sweetness';
        if (val === 25) return 'Light';
        if (val === 50) return 'Half';
        if (val === 75) return 'Less';
        if (val === 100) return 'Regular';
        if (val === 125) return 'Extra';
        return 'Half'; // default
    };

    const getIceLabel = (val: number) => {
        if (val === 0) return 'No Ice';
        if (val === 25) return 'Light';
        if (val === 50) return 'Half';
        if (val === 75) return 'Less';
        if (val === 100) return 'Regular';
        if (val === 125) return 'Extra';
        return 'Half'; // default
    };

    const formatTimestamp = (timestamp: number | undefined) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need media library access to change your profile picture!');
            setProfileModalVisible(false);
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setProfileModalVisible(false);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera permissions to take a profile picture!');
            setProfileModalVisible(false);
            return;
        }
        let result = await ImagePicker.launchCameraAsync({
            cameraType: ImagePicker.CameraType.front,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setProfileModalVisible(false);
        }
    };

    const pickTweetImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need media library access to attach images!');
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0].uri) {
            setTweetImageUri(result.assets[0].uri);
            setTweetImageAsset(result.assets[0]);
        }
    };

    const handleCreateTweet = async () => {
        if (!tweetBody.trim() && !tweetImageUri) {
            Alert.alert('Error', 'Please enter some text or add an image to tweet.');
            return;
        }

        try {
            setIsPostingTweet(true);
            let storageId = undefined;

            if (tweetImageUri && tweetImageAsset) {
                const uploadUrl = await generateUploadUrlMutation();
                const response = await fetch(tweetImageUri);
                const blob = await response.blob();

                const uploadResult = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': tweetImageAsset.mimeType || 'image/jpeg' },
                    body: blob,
                });
                const json = await uploadResult.json();
                storageId = json.storageId;
            }

            await createTweetMutation({
                body: tweetBody,
                imageStorageId: storageId,
            });

            setTweetBody('');
            setTweetImageUri(null);
            setTweetImageAsset(null);
            Alert.alert('Success', 'Tweet posted successfully!');
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.message || 'Failed to post tweet.');
        } finally {
            setIsPostingTweet(false);
        }
    };

    const handleDeleteTweet = (tweetId: string) => {
        Alert.alert(
            "Delete Tweet",
            "Are you sure you want to delete this tweet?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await deleteTweetMutation({ tweetId: tweetId as any });
                        } catch (err: any) {
                            Alert.alert("Error", err.message || "Failed to delete tweet.");
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteReview = (reviewId: string, itemName: string) => {
        Alert.alert(
            "Delete Review",
            `Are you sure you want to delete your review for "${itemName}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await deleteReviewMutation({ reviewId: reviewId as any });
                        } catch (err: any) {
                            Alert.alert("Error", err.message || "Failed to delete review.");
                        }
                    }
                }
            ]
        );
    };

    const profileImageUri = image || currentUser?.profilePicture;
    const userHandle = currentUser?.username ? `@${currentUser.username}` : "@user";
    const userFullName = currentUser?.name ? currentUser.name : null;

    // Dynamic theme color from boba preferences
    const themeColor = currentUser?.preferences?.favoriteColor || '#6c3b3b';

    const badgesDirectory: Record<string, string> = {
        'First Review': '🌟',
    };
    const equippedBadgeIcon = currentUser?.displayedBadge ? badgesDirectory[currentUser.displayedBadge] || '🏆' : null;

    const formatRating = (rating: number | undefined) => {
        if (rating === undefined || rating === null) return "0.0";
        return Number.isInteger(rating) ? `${rating}.0` : rating.toString();
    };

    const uniqueReviewsMap = new Map();
    userReviews.forEach((item: any) => {
        if (!uniqueReviewsMap.has(item._id)) {
            uniqueReviewsMap.set(item._id, item);
        }
    });
    const uniqueReviews = Array.from(uniqueReviewsMap.values());

    // Build structured state-to-city mapping dynamically from user's reviews
    const stateCityMap: Record<string, string[]> = {};
    uniqueReviews.forEach((r: any) => {
        if (r.state) {
            if (!stateCityMap[r.state]) {
                stateCityMap[r.state] = [];
            }
            if (r.city && !stateCityMap[r.state].includes(r.city)) {
                stateCityMap[r.state].push(r.city);
            }
        }
    });

    // Filter reviews based on selected state & nested city
    const filteredReviews = uniqueReviews.filter((review: any) => {
        const matchesState = selectedStateFilter === 'ALL' || review.state === selectedStateFilter;
        const matchesCity = selectedCityFilter === 'ALL' || review.city === selectedCityFilter;
        return matchesState && matchesCity;
    });

    const groupedReviews = filteredReviews.reduce((acc: Record<string, any[]>, review: any) => {
        const place = review.restaurantName || "Other Locations";
        if (!acc[place]) {
            acc[place] = [];
        }
        acc[place].push(review);
        return acc;
    }, {});

    // Compute display text for location dropdown button
    const getLocationButtonLabel = () => {
        if (selectedStateFilter === 'ALL') return 'Location: All Locations';
        if (selectedCityFilter === 'ALL') return `State: ${selectedStateFilter}`;
        return `${selectedCityFilter}, ${selectedStateFilter}`;
    };

    // Full 9-tier ranking color & icon system (without text labels)
    const getVisitBadgeStyle = (count: number) => {
        if (count >= 500) {
            return { bg: '#FDF4FF', border: '#F5D0FE', text: '#86198F', }; // chosen one for 1 visit
        } else if (count >= 250) {
            return { bg: '#FFF1F2', border: '#FECDD3', text: '#9F1239', }; // grandmaster for 1 visit
        } else if (count >= 100) {
            return { bg: '#FAF5FF', border: '#E9D5FF', text: '#6B21A8', }; // master for 1 visit
        } else if (count >= 50) {
            return { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', }; // diamond for 1 visit
        } else if (count >= 20) {
            return { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', }; // plat for 1 visit
        } else if (count >= 10) {
            return { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309', }; // gold for 1 visit
        } else if (count >= 5) {
            return { bg: '#F3F4F6', border: '#E5E7EB', text: '#374151', }; // silver for 1 visit
        } else if (count >= 2) {
            return { bg: '#FFF7ED', border: '#FFEDD5', text: '#C2410C' }; // bronze for 1 visit
        } else {
            return { bg: '#666768', border: '#E2E8F0', text: '#eeeef0' }; // iron for 1 visit
        }
    };

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.topHeaderBar}>
                <View style={{ width: 24 }} />
                <View style={styles.headerRightContainer}>
                    <TouchableOpacity 
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())} 
                        style={styles.headerIconButton}
                    >
                        <Ionicons name="menu-outline" size={24} color="#1F2937" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.profileSectionUnderHeader}>
                    <View style={styles.profileTopRow}>
                        <TouchableOpacity onPress={() => setProfileModalVisible(true)} style={styles.imageContainer}>
                            {profileImageUri ? (
                                <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
                            ) : (
                                <View style={[styles.profileImage, styles.blankAvatar]}>
                                    <Text style={styles.avatarInitial}>
                                        {(currentUser?.name || currentUser?.username || "U").charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <Ionicons name="add-circle" size={26} color="#6c3b3b" style={styles.cameraIconBadge} />
                        </TouchableOpacity>

                        <View style={styles.middleSection}>
                            <View style={styles.userInfoContainer}>
                                {userFullName ? (
                                    <View style={styles.nameRow}>
                                        <Text style={styles.displayName} numberOfLines={1}>{userFullName}</Text>
                                        {equippedBadgeIcon && (
                                            <Text style={{ fontSize: 15 }}>{equippedBadgeIcon}</Text>
                                        )}
                                        <Text style={styles.subHandleName} numberOfLines={1}>{userHandle}</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.subHandleName} numberOfLines={1}>{userHandle}</Text>
                                )}
                            </View>

                            <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>{uniqueReviews.length}</Text>
                                    <Text style={styles.statLabel}>Ratings</Text>
                                </View>
                                <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                                    <Text style={styles.statNumber}>{followers?.length || 0}</Text>
                                    <Text style={styles.statLabel}>Followers</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                                    <Text style={styles.statNumber}>{following?.length || 0}</Text>
                                    <Text style={styles.statLabel}>Following</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.tabRow}>
                    {['ACTIVITY', 'TWEETS', 'REVIEWS', 'PREFERENCES'].map((tab) => (
                        <TouchableOpacity 
                            key={tab}
                            style={[styles.tabPill, activeTab === tab && styles.activeTabPill]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {activeTab === 'ACTIVITY' && (
                    <View style={styles.preferenceCard}>
                        <Text style={styles.cardTitle}>Activity Feed</Text>
                        <Text style={styles.cardSubtitle}>Recent rating logs published to your network.</Text>
                        {userReviews.length === 0 ? (
                            <View style={styles.emptyTabContent}>
                                <Ionicons name="pulse-outline" size={32} color="#9CA3AF" />
                                <Text style={styles.emptyTabText}>No recent activity.</Text>
                            </View>
                        ) : (
                            <View style={styles.activityList}>
                                {userReviews.map((activity: any) => {
                                    const isLikedByMe = activity.likes?.includes(currentUser?._id);
                                    const likesTotal = activity.likes?.length || 0;
                                    const commentsTotal = activity.comments?.length || 0;

                                    return (
                                        <TouchableOpacity 
                                            key={activity.uniqueKey} 
                                            style={styles.tweetCardItem}
                                            activeOpacity={0.8}
                                            onPress={() => router.push({
                                                pathname: '/restaurant/post/[reviewId]',
                                                params: { 
                                                    reviewId: activity._id, 
                                                    activityType: activity.activityType 
                                                }
                                            })}
                                        >
                                            {profileImageUri ? (
                                                <Image source={{ uri: profileImageUri }} style={styles.tweetAvatar} />
                                            ) : (
                                                <View style={[styles.tweetAvatar, styles.blankAvatarTweet]}>
                                                    <Text style={styles.avatarInitialTweet}>
                                                        {(currentUser?.name || currentUser?.username || "U").charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}
                                            <View style={styles.tweetContentColumn}>
                                                <View style={styles.tweetHeaderRow}>
                                                    <View style={styles.tweetNameContainer}>
                                                        {userFullName ? (
                                                            <>
                                                                <Text style={styles.tweetFullName} numberOfLines={1}>{userFullName}</Text>
                                                                <Text style={styles.tweetUsername} numberOfLines={1}>{userHandle}</Text>
                                                            </>
                                                        ) : (
                                                            <Text style={styles.tweetUsername} numberOfLines={1}>{userHandle}</Text>
                                                        )}
                                                    </View>
                                                    <Text style={styles.timestampText}>{formatTimestamp(activity.createdAt || activity._creationTime)}</Text>
                                                </View>

                                                <Text style={styles.tweetBodyText}>
                                                    {activity.activityType === 'updated' ? (
                                                        <>
                                                            Updated review for <Text style={styles.boldText}>{activity.itemName}</Text> at <Text style={styles.boldText}>{activity.restaurantName}</Text>
                                                        </>
                                                    ) : (
                                                        <>
                                                            Rated <Text style={styles.boldText}>{activity.itemName}</Text> from <Text style={styles.boldText}>{activity.restaurantName}</Text>
                                                        </>
                                                    )}
                                                </Text>

                                                <View style={styles.tweetActionBar}>
                                                    <TouchableOpacity 
                                                        style={styles.actionButton} 
                                                        onPress={(e) => {
                                                            e.stopPropagation();
                                                            toggleLike({ 
                                                                reviewId: activity._id, 
                                                                activityType: activity.activityType 
                                                            });
                                                        }}
                                                    >
                                                        <Ionicons 
                                                            name={isLikedByMe ? "heart" : "heart-outline"} 
                                                            size={16} 
                                                            color={isLikedByMe ? "#DC2626" : "#6B7280"} 
                                                        />
                                                        <Text style={styles.actionCountText}>{formatCount(likesTotal)}</Text>
                                                    </TouchableOpacity>

                                                    <View style={styles.actionButton}>
                                                        <Ionicons name="chatbubble-outline" size={15} color="#6B7280" />
                                                        <Text style={styles.actionCountText}>{formatCount(commentsTotal)}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'TWEETS' && (
                    <View style={styles.preferenceCard}>
                        <Text style={styles.cardTitle}>Create Tweet</Text>
                        <Text style={styles.cardSubtitle}>Broadcast a quick status or share a photo with your network.</Text>

                        <View style={styles.tweetComposerContainer}>
                            <TextInput
                                style={styles.tweetInput}
                                placeholder="What's happening?"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                value={tweetBody}
                                onChangeText={setTweetBody}
                            />

                            {tweetImageUri && (
                                <View style={styles.previewImageContainer}>
                                    <Image source={{ uri: tweetImageUri }} style={styles.previewImage} />
                                    <TouchableOpacity 
                                        style={styles.removeImageButton} 
                                        onPress={() => { setTweetImageUri(null); setTweetImageAsset(null); }}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#DC2626" />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.tweetComposerActions}>
                                <TouchableOpacity style={styles.imagePickButton} onPress={pickTweetImage}>
                                    <Ionicons name="image-outline" size={20} color="#6c3b3b" />
                                    <Text style={styles.imagePickText}>Attach Photo</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.postButton, isPostingTweet && styles.buttonDisabled]} 
                                    onPress={handleCreateTweet}
                                    disabled={isPostingTweet}
                                >
                                    <Text style={styles.postButtonText}>{isPostingTweet ? 'Posting...' : 'Tweet'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={[styles.cardTitle, { marginTop: 24, marginBottom: 12 }]}>Your Tweets</Text>
                        {userTweets.length === 0 ? (
                            <View style={styles.emptyTabContent}>
                                <Ionicons name="chatbubbles-outline" size={32} color="#9CA3AF" />
                                <Text style={styles.emptyTabText}>No tweets posted yet.</Text>
                            </View>
                        ) : (
                            <View style={styles.activityList}>
                                {userTweets.map((tweet: any) => {
                                    const isLikedByMe = currentUser?._id ? tweet.likes?.includes(String(currentUser._id)) : false;
                                    const likesTotal = tweet.likes?.length || 0;
                                    const commentsTotal = tweet.comments?.length || 0;

                                    return (
                                        <TouchableOpacity 
                                            key={tweet._id} 
                                            style={styles.tweetCardItem}
                                            activeOpacity={0.8}
                                            onPress={() => router.push({
                                                pathname: '/social/[tweetId]',
                                                params: { tweetId: tweet._id }
                                            })}
                                        >
                                            {profileImageUri ? (
                                                <Image source={{ uri: profileImageUri }} style={styles.tweetAvatar} />
                                            ) : (
                                                <View style={[styles.tweetAvatar, styles.blankAvatarTweet]}>
                                                    <Text style={styles.avatarInitialTweet}>
                                                        {(currentUser?.name || currentUser?.username || "U").charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}
                                            <View style={styles.tweetContentColumn}>
                                                <View style={styles.tweetHeaderRow}>
                                                    <View style={styles.tweetNameContainer}>
                                                        {userFullName ? (
                                                            <>
                                                                <Text style={styles.tweetFullName} numberOfLines={1}>{userFullName}</Text>
                                                                <Text style={styles.tweetUsername} numberOfLines={1}>{userHandle}</Text>
                                                            </>
                                                        ) : (
                                                            <Text style={styles.tweetUsername} numberOfLines={1}>{userHandle}</Text>
                                                        )}
                                                    </View>
                                                    <View style={styles.headerRightInfo}>
                                                        <Text style={styles.timestampText}>{formatTimestamp(tweet.createdAt || tweet._creationTime)}</Text>
                                                        <TouchableOpacity 
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteTweet(tweet._id);
                                                            }}
                                                            style={styles.deleteTweetButton}
                                                        >
                                                            <Ionicons name="trash-outline" size={14} color="#DC2626" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                                <Text style={[styles.tweetBodyText, { color: '#1F2937' }]}>{tweet.body}</Text>

                                                <View style={styles.tweetActionBar}>
                                                    <TouchableOpacity 
                                                        style={styles.actionButton} 
                                                        onPress={(e) => {
                                                            e.stopPropagation();
                                                            toggleLikeTweet({ tweetId: tweet._id });
                                                        }}
                                                    >
                                                        <Ionicons 
                                                            name={isLikedByMe ? "heart" : "heart-outline"} 
                                                            size={16} 
                                                            color={isLikedByMe ? "#DC2626" : "#6B7280"} 
                                                        />
                                                        <Text style={styles.actionCountText}>{formatCount(likesTotal)}</Text>
                                                    </TouchableOpacity>

                                                    <View style={styles.actionButton}>
                                                        <Ionicons name="chatbubble-outline" size={15} color="#6B7280" />
                                                        <Text style={styles.actionCountText}>{formatCount(commentsTotal)}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'REVIEWS' && (
                    <View style={styles.preferenceCard}>
                        <Text style={styles.cardTitle}>My Reviews</Text>
                        <Text style={styles.cardSubtitle}>Your submitted item evaluations grouped by establishment.</Text>

                        {/* Unified Location Filter Dropdown */}
                        {uniqueReviews.length > 0 && (
                            <View style={styles.filterDropdownWrapperSingle}>
                                <TouchableOpacity 
                                    style={styles.filterButton} 
                                    onPress={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                                >
                                    <Text style={styles.filterButtonText}>
                                        {getLocationButtonLabel()}
                                    </Text>
                                    <Ionicons name={isLocationDropdownOpen ? "chevron-up" : "chevron-down"} size={14} color="#4B5563" />
                                </TouchableOpacity>

                                {isLocationDropdownOpen && (
                                    <View style={styles.dropdownMenuListSingle}>
                                        {/* All Locations Option */}
                                        <TouchableOpacity 
                                            style={styles.dropdownMenuItem}
                                            onPress={() => {
                                                setSelectedStateFilter('ALL');
                                                setSelectedCityFilter('ALL');
                                                setIsLocationDropdownOpen(false);
                                                setExpandedStateInMenu(null);
                                            }}
                                        >
                                            <Text style={[styles.dropdownMenuText, selectedStateFilter === 'ALL' && styles.selectedMenuText]}>
                                                All Locations
                                            </Text>
                                        </TouchableOpacity>

                                        {/* State list with nested cities */}
                                        {Object.entries(stateCityMap).map(([stateName, cities]) => {
                                            const isStateExpanded = expandedStateInMenu === stateName;
                                            const isStateSelected = selectedStateFilter === stateName && selectedCityFilter === 'ALL';

                                            return (
                                                <View key={stateName}>
                                                    {/* State Row */}
                                                    <TouchableOpacity 
                                                        style={[styles.dropdownMenuItem, styles.stateRowItem]}
                                                        onPress={() => {
                                                            setExpandedStateInMenu(isStateExpanded ? null : stateName);
                                                        }}
                                                    >
                                                        <TouchableOpacity 
                                                            style={{ flex: 1 }}
                                                            onPress={() => {
                                                                setSelectedStateFilter(stateName);
                                                                setSelectedCityFilter('ALL');
                                                                setIsLocationDropdownOpen(false);
                                                                setExpandedStateInMenu(null);
                                                            }}
                                                        >
                                                            <Text style={[styles.dropdownMenuText, isStateSelected && styles.selectedMenuText]}>
                                                                📍 {stateName}
                                                            </Text>
                                                        </TouchableOpacity>
                                                        <Ionicons 
                                                            name={isStateExpanded ? "chevron-down" : "chevron-forward"} 
                                                            size={13} 
                                                            color="#6B7280" 
                                                            onPress={() => setExpandedStateInMenu(isStateExpanded ? null : stateName)}
                                                        />
                                                    </TouchableOpacity>

                                                    {/* Nested City Sub-list */}
                                                    {isStateExpanded && (
                                                        <View style={styles.nestedCityList}>
                                                            <TouchableOpacity 
                                                                style={styles.dropdownMenuItem}
                                                                onPress={() => {
                                                                    setSelectedStateFilter(stateName);
                                                                    setSelectedCityFilter('ALL');
                                                                    setIsLocationDropdownOpen(false);
                                                                    setExpandedStateInMenu(null);
                                                                }}
                                                            >
                                                                <Text style={[styles.dropdownMenuText, selectedStateFilter === stateName && selectedCityFilter === 'ALL' && styles.selectedMenuText]}>
                                                                    ↳ All Cities in {stateName}
                                                                </Text>
                                                            </TouchableOpacity>

                                                            {cities.map((cityName: string) => {
                                                                const isCitySelected = selectedStateFilter === stateName && selectedCityFilter === cityName;
                                                                return (
                                                                    <TouchableOpacity 
                                                                        key={cityName} 
                                                                        style={styles.dropdownMenuItem}
                                                                        onPress={() => {
                                                                            setSelectedStateFilter(stateName);
                                                                            setSelectedCityFilter(cityName);
                                                                            setIsLocationDropdownOpen(false);
                                                                            setExpandedStateInMenu(null);
                                                                        }}
                                                                    >
                                                                        <Text style={[styles.dropdownMenuText, isCitySelected && styles.selectedMenuText]}>
                                                                            ↳ {cityName}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                );
                                                            })}
                                                        </View>
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        )}

                        {filteredReviews.length === 0 ? (
                            <View style={styles.emptyTabContent}>
                                <Ionicons name="star-outline" size={32} color="#9CA3AF" />
                                <Text style={styles.emptyTabText}>No reviews match your location filter.</Text>
                            </View>
                        ) : (
                            <View style={[styles.dropdownContainer, { marginTop: 12 }]}>
                                {Object.entries(groupedReviews).map(([restaurantName, items]: [string, any[]]) => {
                                    const isExpanded = expandedRestaurant === restaurantName;
                                    const streetAddress = items[0]?.address || "";
                                    const cityName = items[0]?.city || "";
                                    const stateName = items[0]?.state || "";
                                    const cityAndState = [cityName, stateName].filter(Boolean).join(", ");
                                    const visitCount = items[0]?.visitCount || 1;
                                    const rankBadge = getVisitBadgeStyle(visitCount);

                                    return (
                                        <View key={restaurantName} style={styles.restaurantAccordionWrapper}>
                                            <TouchableOpacity 
                                                style={styles.restaurantHeaderRow}
                                                onPress={() => toggleRestaurantDropdown(restaurantName)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.restaurantMainRow}>
                                                    <Ionicons name="storefront-outline" size={24} color="#6c3b3b" style={styles.restaurantIcon} />
                                                    <View style={styles.restaurantTextColumn}>
                                                        {/* Restaurant Name and Tiered Ranking Badge (Icon + Count Only) */}
                                                        <View style={styles.topInfoRow}>
                                                            <Text style={styles.restaurantNameText} numberOfLines={1}>{restaurantName}</Text>
                                                            <View style={[styles.visitBadgeInline, { backgroundColor: rankBadge.bg, borderColor: rankBadge.border }]}>
                                                                <Text style={[styles.visitBadgeInlineText, { color: rankBadge.text }]}>
                                                                    {visitCount} visits
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        {streetAddress ? (
                                                            <Text style={styles.restaurantAddressText} numberOfLines={1}>{streetAddress}</Text>
                                                        ) : null}
                                                        {cityAndState ? (
                                                            <Text style={styles.restaurantCityText} numberOfLines={1}>{cityAndState}</Text>
                                                        ) : null}
                                                    </View>
                                                </View>
                                                <View style={styles.restaurantRightAction}>
                                                    <View style={styles.countBadge}>
                                                        <Text style={styles.countBadgeText}>{items.length}</Text>
                                                    </View>
                                                    <Ionicons 
                                                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                                                        size={16} 
                                                        color="#4B5563" 
                                                    />
                                                </View>
                                            </TouchableOpacity>

                                            {isExpanded && (
                                                <View style={styles.dropdownItemsList}>
                                                    {items.map((review: any) => (
                                                        <TouchableOpacity 
                                                            key={review._id} 
                                                            style={styles.reviewSubItem}
                                                            onPress={() => router.push({
                                                                pathname: '/restaurant/rate/[itemId]',
                                                                params: { itemId: review.itemId, editReviewId: review._id }
                                                            })}
                                                            activeOpacity={0.7}
                                                        >
                                                            <View style={styles.reviewSubHeader}>
                                                                <Text style={styles.reviewItemName} numberOfLines={1}>{review.itemName}</Text>
                                                                <View style={styles.reviewSubActions}>
                                                                    <View style={styles.starRow}>
                                                                        <Ionicons name="star" size={13} color="#FBBF24" />
                                                                        <Text style={styles.reviewRatingText}>{formatRating(review.overallRating)}</Text>
                                                                    </View>
                                                                    <TouchableOpacity 
                                                                        onPress={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteReview(review._id, review.itemName);
                                                                        }}
                                                                        style={styles.deleteIconButton}
                                                                    >
                                                                        <Ionicons name="trash-outline" size={14} color="#DC2626" />
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                            {review.notes ? (
                                                                <Text style={styles.reviewNotesText} numberOfLines={2}>&ldquo;{review.notes}&rdquo;</Text>
                                                            ) : null}
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'PREFERENCES' && (
                    <View style={[styles.preferenceBobaCard, { backgroundColor: themeColor + '80', shadowOpacity: 0, elevation: 0 }]}>
                        <View style={styles.cardHeaderRow}>
                            <View style={styles.cardHeaderLeft}>
                                <Text style={styles.cardTitle}>My Boba Taste Fingerprint</Text>
                                <Text style={styles.cardSubtitle}>Followers use this baseline to match your taste profile reviews.</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                            >
                                <Ionicons name="pencil-outline" size={16} color="#6c3b3b" />
                                <Text style={styles.editButtonText}>Edit</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.prefDisplayRow}>
                            <View style={styles.prefDisplayItem}>
                                <Text style={styles.prefDisplayIcon}>🍯</Text>
                                <View style={styles.prefDisplayContent}>
                                    <Text style={styles.prefDisplayLabel}>Sweetness</Text>
                                    <Text style={styles.prefDisplayValue}>{getSweetnessLabel(currentUser?.preferences?.sweetness ?? 50)}</Text>
                                </View>
                            </View>

                            <View style={styles.prefDisplayItem}>
                                <Text style={styles.prefDisplayIcon}>❄️</Text>
                                <View style={styles.prefDisplayContent}>
                                    <Text style={styles.prefDisplayLabel}>Ice Level</Text>
                                    <Text style={styles.prefDisplayValue}>{getIceLabel(currentUser?.preferences?.iceLevel ?? 50)}</Text>
                                </View>
                            </View>

                            <View style={styles.prefDisplayItem}>
                                <Text style={styles.prefDisplayIcon}>🥛</Text>
                                <View style={styles.prefDisplayContent}>
                                    <Text style={styles.prefDisplayLabel}>Milk Base</Text>
                                    <Text style={styles.prefDisplayValue}>{currentUser?.preferences?.milkBase || 'Oat Milk'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Theme Color as Drink Visual */}
                        {currentUser?.preferences?.favoriteColor && (
                            <View style={styles.drinkColorContainer}>
                                <Text style={styles.drinkColorLabel}>My Theme Drink</Text>
                                <View style={styles.drinkVisualRow}>
                                    <View style={styles.drinkCup}>
                                        <View style={[styles.drinkLiquid, { backgroundColor: currentUser.preferences.favoriteColor }]} />
                                        <View style={styles.drinkLid} />
                                    </View>
                                    <View style={[styles.drinkInfoBox, { borderColor: currentUser.preferences.favoriteColor + '40', backgroundColor: currentUser.preferences.favoriteColor + '15' }]}>
                                        <Ionicons name="color-palette" size={16} color={currentUser.preferences.favoriteColor} />
                                        <Text style={[styles.drinkColorName, { color: currentUser.preferences.favoriteColor }]}>
                                            {currentUser.preferences.favoriteColor}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            <Modal visible={isProfileModal} animationType="slide" transparent={true} onRequestClose={() => setProfileModalVisible(false)}>
                <View style={styles.modalProfileView}>
                    <View style={styles.profileModalView}>
                        <Text style={styles.profileModalTitle}>Change Profile Picture</Text>
                        <View style={styles.profileButtonContainer}>
                            <TouchableOpacity style={[styles.profileButton, styles.buttonNeutral]} onPress={pickImage}>
                                <Text style={styles.buttonTextDark}>Pick from Gallery</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.profileButton, styles.buttonNeutral]} onPress={takePhoto}>
                                <Text style={styles.buttonTextDark}>Take a Photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.profileButton, { backgroundColor: '#DC2626' }]} onPress={() => setProfileModalVisible(false)}>
                                <Text style={styles.textStyle}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Auth Required Modal */}
            <Modal
                visible={isAuthModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => {}}
            >
                <View style={styles.authModalOverlay}>
                    <View style={styles.authModalContent}>
                        <View style={styles.authModalHeader}>
                            <Ionicons name="lock-closed" size={32} color="#6c3b3b" />
                            <Text style={styles.authModalTitle}>Authentication Required</Text>
                        </View>

                        <Text style={styles.authModalMessage}>
                            You need to be logged in to view your profile. Sign up or login to access all features.
                        </Text>

                        <View style={styles.authModalActions}>
                            <TouchableOpacity
                                style={styles.authModalButton}
                                onPress={() => {
                                    setAuthModalVisible(false);
                                    router.back();
                                }}
                            >
                                <Text style={styles.authModalButtonText}>Go Back</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.authModalButton, styles.authModalPrimaryButton]}
                                onPress={() => {
                                    setAuthModalVisible(false);
                                    router.replace('/');
                                }}
                            >
                                <Text style={styles.authModalPrimaryButtonText}>Sign Up / Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    topHeaderBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 4 : 12,
        paddingBottom: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginLeft: 'auto',
    },
    headerIconButton: {
        padding: 4,
    },
    profileSectionUnderHeader: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 12,
    },
    profileTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    imageContainer: {
        position: 'relative',
        width: 76,
        height: 76,
    },
    profileImage: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    blankAvatar: {
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 28,
        fontWeight: '700',
        color: '#6c3b3b',
    },
    cameraIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
    },
    middleSection: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
        gap: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 28,
    },
    statItem: {
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    statNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'left',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
        textAlign: 'left',
    },
    userInfoContainer: {
        marginTop: 2,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: 6,
    },
    displayName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: 0.3,
    },
    subHandleName: {
        fontSize: 12,
        fontWeight: '400',
        color: '#6B7280',
    },
    scrollContainer: {
        paddingTop: 12,
        paddingBottom: 100,
    },
    tabRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 12,
        paddingHorizontal: 12,
    },
    tabPill: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
    },
    activeTabPill: {
        backgroundColor: '#6c3b3b',
    },
    tabText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4B5563',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    preferenceCard: {
        backgroundColor: 'red',
        borderRadius: 16,
        padding: 20,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    preferenceBobaCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
        marginBottom: 16,
        lineHeight: 16,
    },
    filterDropdownWrapperSingle: {
        position: 'relative',
        marginBottom: 8,
        zIndex: 10,
    },
    filterButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    dropdownMenuListSingle: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 20,
        maxHeight: 250,
    },
    dropdownMenuItem: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    stateRowItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    nestedCityList: {
        backgroundColor: '#F9FAFB',
        paddingLeft: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    dropdownMenuText: {
        fontSize: 12,
        color: '#4B5563',
    },
    selectedMenuText: {
        fontWeight: '700',
        color: '#6c3b3b',
    },
    dropdownContainer: {
        gap: 6,
    },
    restaurantAccordionWrapper: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        overflow: 'hidden',
    },
    restaurantHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#FFFFFF',
    },
    restaurantMainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        flex: 1,
    },
    restaurantIcon: {
        marginTop: 2,
    },
    restaurantTextColumn: {
        flex: 1,
    },
    topInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    restaurantNameText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1F2937',
    },
    visitBadgeInline: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    visitBadgeInlineText: {
        fontSize: 10,
        fontWeight: '700',
    },
    restaurantAddressText: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 0.5,
    },
    restaurantCityText: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 0.5,
    },
    restaurantRightAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    countBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    countBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4B5563',
    },
    dropdownItemsList: {
        padding: 8,
        gap: 6,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    reviewSubItem: {
        backgroundColor: '#FFFFFF',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 2,
    },
    reviewSubHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reviewSubActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    deleteIconButton: {
        padding: 2,
    },
    reviewItemName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
        flex: 1,
    },
    starRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    reviewRatingText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#D97706',
        marginLeft: 2,
    },
    reviewNotesText: {
        fontSize: 11,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    prefRow: {
        marginBottom: 20,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    cardHeaderLeft: {
        flex: 1,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    editButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6c3b3b',
    },
    prefDisplayRow: {
        gap: 12,
    },
    prefDisplayItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    prefDisplayIcon: {
        fontSize: 24,
    },
    prefDisplayContent: {
        flex: 1,
    },
    prefDisplayLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    prefDisplayValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    colorDisplayRow: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    colorDisplayLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    colorDisplaySwatchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    colorDisplaySwatch: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    colorDisplayValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    emptyTabContent: {
        paddingVertical: 40,
        alignItems: 'center',
        gap: 8,
    },
    emptyTabText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    activityList: {
        gap: 10,
        marginTop: 4,
    },
    tweetCardItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: '#FAFAFA',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tweetAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    blankAvatarTweet: {
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitialTweet: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6c3b3b',
    },
    tweetContentColumn: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    tweetHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    tweetNameContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: 6,
        flex: 1,
    },
    tweetFullName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: 0.3,
    },
    tweetUsername: {
        fontSize: 11,
        fontWeight: '400',
        color: '#6B7280',
    },
    headerRightInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timestampText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    deleteTweetButton: {
        padding: 2,
    },
    tweetBodyText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '400',
    },
    boldText: {
        fontWeight: '700',
        color: '#1F2937',
    },
    tweetActionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    actionCountText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    tweetComposerContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 12,
        gap: 10,
    },
    tweetInput: {
        fontSize: 13,
        color: '#1F2937',
        minHeight: 60,
        textAlignVertical: 'top',
    },
    previewImageContainer: {
        position: 'relative',
        width: '100%',
        height: 150,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
    },
    tweetComposerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 8,
    },
    imagePickButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
    },
    imagePickText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6c3b3b',
    },
    postButton: {
        backgroundColor: '#6c3b3b',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    postButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonNeutral: {
        backgroundColor: '#F3F4F6',
    },
    buttonTextDark: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    textStyle: {
        color: 'white',
        fontWeight: '600',
        textAlign: 'center',
    },
    modalProfileView: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    profileModalView: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 34,
    },
    profileModalTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
    },
    profileButtonContainer: {
        gap: 10,
    },
    profileButton: {
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
    },
    authModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    authModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
    },
    authModalHeader: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    authModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
    },
    authModalMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    authModalActions: {
        gap: 12,
    },
    authModalButton: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    authModalButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    authModalPrimaryButton: {
        backgroundColor: '#6c3b3b',
    },
    authModalPrimaryButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    drinkColorContainer: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    drinkColorLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    drinkVisualRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    drinkCup: {
        width: 50,
        height: 60,
        position: 'relative',
    },
    drinkLiquid: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 50,
        borderRadius: 8,
        opacity: 0.8,
    },
    drinkLid: {
        position: 'absolute',
        top: 0,
        left: -4,
        right: -4,
        height: 10,
        backgroundColor: '#E5E7EB',
        borderRadius: 10,
    },
    drinkInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    drinkColorName: {
        fontSize: 13,
        fontWeight: '700',
    },
});
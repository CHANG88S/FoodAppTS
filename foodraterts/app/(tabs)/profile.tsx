import React, { useState } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import Slider from '@react-native-community/slider';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { formatCount } from '../../utils/formatters';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Profile() {
    const router = useRouter();
    const navigation = useNavigation<any>();
    const { signOut } = useAuthActions();

    const currentUser = useQuery(api.users.viewer);
    const userReviews = useQuery(api.items.getUserReviews) || [];
    const deleteReviewMutation = useMutation(api.items.deleteItemReview);
    const toggleLike = useMutation(api.items.toggleLikeReview);

    const [isSignOutModalVisible, setSignOutModalVisible] = useState(false);
    const [isProfileModal, setProfileModalVisible] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('ACTIVITY');
    const [expandedRestaurant, setExpandedRestaurant] = useState<string | null>(null);

    const toggleRestaurantDropdown = (restaurantName: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedRestaurant(prev => (prev === restaurantName ? null : restaurantName));
    };

    const [sweetnessPref, setSweetnessPref] = useState<number>(0.5); 
    const [icePref, setIcePref] = useState<number>(0.5);            
    const [milkPref, setMilkPref] = useState<string>('Oat Milk');

    const getSweetnessLabel = (val: number) => {
        if (val === 0)   return  '0% (No Sugar)';
        if (val <= 0.35) return '25% (Light Sugar)';
        if (val <= 0.50) return '50% (Half Sugar)';
        if (val <= 0.75) return '75% (Less Sugar)';
        return '100% (Regular Sugar)';
    };

    const getIceLabel = (val: number) => {
        if (val === 0) return 'No Ice';
        if (val <= 0.25) return 'Light Ice';
        if (val <= 0.5) return 'Half Ice';
        if (val <= 0.75) return 'Less Ice';
        return 'Regular Ice';
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

    const handleLeave = async () => {
        try {
            setSignOutModalVisible(false);
            await signOut();
            router.replace('/');
        } catch (error: any) {
            console.error(error);
            Alert.alert('Sign Out Failed', error.message || 'Could not log out.');
        }
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

    const badgesDirectory: Record<string, string> = {
        'First Review': '🌟',
    };
    const equippedBadgeIcon = currentUser?.displayedBadge ? badgesDirectory[currentUser.displayedBadge] || '🏆' : null;
    const hasUnlockedFirstReview = userReviews.length > 0;

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

    const groupedReviews = uniqueReviews.reduce((acc: Record<string, any[]>, review: any) => {
        const place = review.restaurantName || "Other Locations";
        if (!acc[place]) {
            acc[place] = [];
        }
        acc[place].push(review);
        return acc;
    }, {});

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
                    <TouchableOpacity onPress={() => setSignOutModalVisible(true)} style={styles.headerIconButton}>
                        <Ionicons name="log-out-outline" size={22} color="#b01212" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.profileSectionUnderHeader}>
                    <View style={styles.profileLeftColumn}>
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

                        {/* 🌟 Discord-style badge row positioned right under the profile picture */}
                        <View style={styles.profileBadgesRow}>
                            {hasUnlockedFirstReview && (
                                <Text style={{ fontSize: 18 }}>🌟</Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.userInfoContainer}>
                        {userFullName && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.displayName} numberOfLines={1}>{userFullName}</Text>
                                {equippedBadgeIcon && (
                                    <Text style={{ fontSize: 16 }}>{equippedBadgeIcon}</Text>
                                )}
                            </View>
                        )}
                        <Text style={styles.subHandleName} numberOfLines={1}>{userHandle}</Text>
                    </View>
                </View>

                <View style={styles.tabRow}>
                    {['ACTIVITY', 'REVIEWS', 'PREFERENCES', 'SAVED'].map((tab) => (
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
                                                    {userFullName ? (
                                                        <>
                                                            <Text style={styles.tweetFullName} numberOfLines={1}>{userFullName}</Text>
                                                            <Text style={styles.tweetUsername} numberOfLines={1}>{userHandle}</Text>
                                                        </>
                                                    ) : (
                                                        <Text style={styles.tweetUsername} numberOfLines={1}>{userHandle}</Text>
                                                    )}
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

                {activeTab === 'REVIEWS' && (
                    <View style={styles.preferenceCard}>
                        <Text style={styles.cardTitle}>My Reviews</Text>
                        <Text style={styles.cardSubtitle}>Your submitted item evaluations grouped by establishment.</Text>
                        {uniqueReviews.length === 0 ? (
                            <View style={styles.emptyTabContent}>
                                <Ionicons name="star-outline" size={32} color="#9CA3AF" />
                                <Text style={styles.emptyTabText}>No reviews published yet.</Text>
                            </View>
                        ) : (
                            <View style={styles.dropdownContainer}>
                                {Object.entries(groupedReviews).map(([restaurantName, items]: [string, any[]]) => {
                                    const isExpanded = expandedRestaurant === restaurantName;
                                    const streetAddress = items[0]?.address || "";
                                    const cityName = items[0]?.city || "";
                                    const stateName = items[0]?.state || "";
                                    const cityAndState = [cityName, stateName].filter(Boolean).join(", ");

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
                                                        <View style={styles.topInfoRow}>
                                                            <Text style={styles.restaurantNameText} numberOfLines={1}>{restaurantName}</Text>
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
                                                                <Text style={styles.reviewNotesText} numberOfLines={2}>"{review.notes}"</Text>
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
                    <View style={styles.preferenceCard}>
                        <Text style={styles.cardTitle}>My Boba Taste Fingerprint</Text>
                        <Text style={styles.cardSubtitle}>Followers use this baseline to match your taste profile reviews.</Text>

                        <View style={styles.prefRow}>
                            <View style={styles.prefLabelContainer}>
                                <Text style={styles.prefLabel}>🍯 Sweetness</Text>
                                <Text style={styles.prefValueText}>{getSweetnessLabel(sweetnessPref)}</Text>
                            </View>
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={1}
                                step={0.1}
                                value={sweetnessPref}
                                onValueChange={setSweetnessPref}
                                minimumTrackTintColor="#6c3b3b"
                                maximumTrackTintColor="#E5E7EB"
                            />
                        </View>

                        <View style={styles.prefRow}>
                            <View style={styles.prefLabelContainer}>
                                <Text style={styles.prefLabel}>❄️ Ice Level</Text>
                                <Text style={styles.prefValueText}>{getIceLabel(icePref)}</Text>
                            </View>
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={1}
                                step={0.1}
                                value={icePref}
                                onValueChange={setIcePref}
                                minimumTrackTintColor="#6c3b3b"
                                maximumTrackTintColor="#E5E7EB"
                            />
                        </View>

                        <View style={styles.prefRow}>
                            <Text style={styles.prefLabel}>🥛 Preferred Milk Base</Text>
                            <View style={styles.milkToggleRow}>
                                {['Whole Milk', 'Oat Milk', 'Almond Milk'].map((milk) => (
                                    <TouchableOpacity
                                        key={milk}
                                        style={[styles.milkOptionButton, milkPref === milk ? styles.milkSelected : styles.milkUnselected]}
                                        onPress={() => setMilkPref(milk)}
                                    >
                                        <Text style={[styles.milkOptionText, milkPref === milk ? styles.textWhite : styles.textDark]}>
                                            {milk.split(' ')[0]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {activeTab === 'SAVED' && (
                    <View style={styles.preferenceCard}>
                        <Text style={styles.cardTitle}>Saved Items & Spots</Text>
                        <Text style={styles.cardSubtitle}>Quick access to your bookmarks.</Text>
                        <View style={styles.emptyTabContent}>
                            <Ionicons name="bookmark-outline" size={32} color="#9CA3AF" />
                            <Text style={styles.emptyTabText}>No saved items yet.</Text>
                        </View>
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

            <Modal visible={isSignOutModalVisible} transparent={true} animationType="fade" onRequestClose={() => setSignOutModalVisible(false)}>
                <View style={styles.modalCenteredView}>
                    <View style={styles.logModalView}>
                        <Text style={styles.logModalTitle}>Sign Out?</Text>
                        <Text style={styles.modalText}>Are you sure you want to log out of your system workspace profile?</Text>
                        <View style={styles.logButtonContainer}>
                            <TouchableOpacity style={[styles.logButton, styles.buttonLeave]} onPress={handleLeave}>
                                <Text style={styles.dialogActionText}>Sign Out</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.logButton, styles.buttonContinue]} onPress={() => setSignOutModalVisible(false)}>
                                <Text style={styles.dialogActionText}>Stay</Text>
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
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    profileLeftColumn: {
        alignItems: 'center',
    },
    imageContainer: {
        position: 'relative',
        width: 68,
        height: 68,
    },
    profileImage: {
        width: 68,
        height: 68,
        borderRadius: 34,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    blankAvatar: {
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 26,
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
    userInfoContainer: {
        justifyContent: 'center',
        marginTop: 2,
    },
    displayName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: 0.5,
    },
    subHandleName: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
        marginTop: 2,
    },
    profileBadgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 8,
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
        marginTop: 8,
        paddingHorizontal: 16,
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
        paddingVertical: 4,
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
    },
    restaurantNameText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
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
        gap: 8,
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
    prefLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    prefLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    prefValueText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6c3b3b',
    },
    slider: {
        width: '100%',
        height: 30,
    },
    milkToggleRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    milkOptionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
    },
    milkSelected: {
        backgroundColor: '#6c3b3b',
        borderColor: '#6c3b3b',
    },
    milkUnselected: {
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB',
    },
    milkOptionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    textWhite: {
        color: 'white',
    },
    textDark: {
        color: '#4B5563',
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
        gap: 6,
        marginBottom: 2,
    },
    tweetFullName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: 0.5,
    },
    tweetUsername: {
        fontSize: 11,
        fontWeight: '400',
        color: '#6B7280',
        letterSpacing: 0.25,
    },
    tweetBodyText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '400',
        lineHeight: 15,
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
    modalCenteredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    logModalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    logModalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    modalText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
    },
    logButtonContainer: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    logButton: {
        borderRadius: 12,
        padding: 12,
        flex: 1,
        alignItems: 'center',
    },
    buttonLeave: {
        backgroundColor: '#b01212',
    },
    buttonContinue: {
        backgroundColor: '#4371bd',
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
    dialogActionText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
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
});
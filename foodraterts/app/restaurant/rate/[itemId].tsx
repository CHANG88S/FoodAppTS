import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    SafeAreaView,
    Image,
    StyleSheet,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import * as ImagePicker from 'expo-image-picker';
import RatingMenu from '../../../components/RatingMenu';

interface Criterion {
    id: string;
    name: string;
    value: number | string;
}

const PREDEFINED_CRITERIA = [
    'Consistency',
    'Portion Size',
    'Presentation',
    'Value for Money'
];

export default function Upload() {
    const router = useRouter();
    
    const { id, itemId, itemName, editReviewId } = useLocalSearchParams<{ 
        id?: string; 
        itemId?: string; 
        itemName?: string; 
        editReviewId?: string; 
    }>();
    
    const userReviews = useQuery(api.items.getUserReviews) || [];

    // Get actual review data directly from database for accurate image handling
    const actualReviewData = useQuery(
        api.items.getReviewById,
        editReviewId ? { reviewId: editReviewId } : "skip"
    );

    // Fall back to activity feed data if direct query fails
    const existingReview = actualReviewData || userReviews.find((r: any) =>
        (editReviewId && r._id === editReviewId) || (!editReviewId && itemId && r.itemId === itemId)
    );

    const restaurantDetails = useQuery(api.restaurants.getRestaurantDetails, { 
        restaurantId: id as Id<"restaurants"> 
    });

    const createReview = useMutation(api.items.createItemReview);
    const generateUploadUrlMutation = useMutation(api.images.generateUploadUrl);

    const existingImageUrl = useQuery(
        api.images.getPublicUrl,
        existingReview?.imageStorageId ? { storageId: existingReview.imageStorageId } : "skip"
    );

    // Track which type of review we're editing
    const isEditingUpdatedReview = existingReview?.activityType === 'updated';

    const [isDiscardModalVisible, setDiscardModalVisible] = useState(false);
    const [isProfileModal, setProfileModalVisible] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const [image, setImage] = useState<string | null>(null);
    const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [imageRemoved, setImageRemoved] = useState(false);
    const [orderNotes, setOrderNotes] = useState('');
    const [adjustmentText, setAdjustmentText] = useState('');
    const [criteriaList, setCriteriaList] = useState<Criterion[]>([]);
    const [manualOverallScore, setManualOverallScore] = useState<number>(5.0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pre-populate fields including order adjustments when editing
    useEffect(() => {
        if (existingReview) {
            setManualOverallScore(existingReview.overallRating ?? 5.0);
            setAdjustmentText(existingReview.notes ?? '');
            setOrderNotes(existingReview.orderNotes ?? '');
            if (existingReview.granularAttributes) {
                setCriteriaList(existingReview.granularAttributes.map((attr: any, idx: number) => ({
                    id: attr.id || `${Date.now()}-${idx}`,
                    name: attr.name,
                    value: attr.value
                })));
            }
            // Reset image state when loading an existing review
            setImage(null);
            setImageAsset(null);
            setImageRemoved(false);
        }
    }, [existingReview]);

    const resolvedItemFromDb = restaurantDetails?.menuItems?.find((item: any) => item._id === (itemId || existingReview?.itemId));
    const activeItemName = (typeof itemName === 'string' && itemName.trim().length > 0)
        ? itemName 
        : (resolvedItemFromDb?.itemName || existingReview?.itemName || 'Menu Item');
        
    const itemPrice = resolvedItemFromDb?.price !== undefined 
        ? `$${resolvedItemFromDb.price.toFixed(2)}` 
        : '';

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need media library permissions to upload item photos!');
            setProfileModalVisible(false);
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setImageAsset(result.assets[0]);
            setImageRemoved(false);
            setProfileModalVisible(false);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera access to take fresh item snapshots!');
            setProfileModalVisible(false);
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setImageAsset(result.assets[0]);
            setImageRemoved(false);
            setProfileModalVisible(false);
        }
    };

    const handleLeave = () => {
        setDiscardModalVisible(false);
        router.back();
    };

    const handleFormSubmit = async () => {
        const targetItemId = itemId || existingReview?.itemId;
        if (!targetItemId) {
            Alert.alert("Error", "Missing menu item identifier context.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Upload image if selected
            let imageStorageId: Id<"_storage"> | null | undefined = undefined;
            if (imageAsset) {
                const uploadUrl = await generateUploadUrlMutation();
                const response = await fetch(imageAsset.uri);
                const blob = await response.blob();

                const uploadResult = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': imageAsset.mimeType || 'image/jpeg' },
                    body: blob,
                });
                const json = await uploadResult.json();
                imageStorageId = json.storageId;
            } else if (imageRemoved) {
                // Explicitly remove image by setting to null
                imageStorageId = null;
            }

            // Determine which review ID to edit - prioritize actual review ID over activity ID
            const reviewToEdit = actualReviewData?._id || existingReview?._id;

            console.log('Submitting review with:', {
                targetItemId,
                imageStorageId,
                imageRemoved,
                editReviewId: editReviewId,
                reviewToEdit,
                existingReviewId: existingReview?._id
            });

            await createReview({
                itemId: targetItemId as Id<"menuItems">,
                overallRating: manualOverallScore,
                notes: adjustmentText.trim(),
                criteriaList: criteriaList,
                orderNotes: orderNotes.trim(),
                imageStorageId,
                editReviewId: reviewToEdit ? reviewToEdit : undefined,
            });

            Alert.alert('Success 🎉', existingReview ? 'Your review was updated successfully!' : 'Your rating data was saved successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Submission Error', 'Failed to save your review configurations.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCriterion = (name: string) => {
        if (!name.trim()) return;
        if (criteriaList.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
            Alert.alert('Duplicate Metric', 'This field has already been added.');
            return;
        }
        const criteriaId = `${Date.now()}-${name.trim()}`;
        setCriteriaList(prev => [...prev, { id: criteriaId, name: name.trim(), value: 0 }]);
        setShowAddModal(false);
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.root}>
                
                <Stack.Screen options={{ headerShown: false }} />

                <View style={styles.customHeaderBar}>
                    <TouchableOpacity onPress={() => setDiscardModalVisible(true)} style={styles.closeButtonContainer} activeOpacity={0.7}>
                        <Ionicons name="close" size={22} color="#1F2937" />
                    </TouchableOpacity>
                </View>

                <View style={styles.mainLayoutContainer}>
                    <View style={styles.amazonHeaderRow}>
                        <TouchableOpacity onPress={() => setProfileModalVisible(true)} activeOpacity={0.85} style={styles.imageContainer}>
                            {image || (existingImageUrl && !imageRemoved) ? (
                                <>
                                    <Image
                                        source={
                                            image
                                                ? { uri: image }
                                                : { uri: existingImageUrl }
                                        }
                                        style={styles.profileImage}
                                    />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => {
                                            Alert.alert(
                                                "Remove Photo",
                                                "Are you sure you want to delete this photo from your review?",
                                                [
                                                    { text: "Cancel", style: "cancel" },
                                                    {
                                                        text: "Remove",
                                                        style: "destructive",
                                                        onPress: () => {
                                                            setImage(null);
                                                            setImageAsset(null);
                                                            setImageRemoved(true);
                                                        }
                                                    }
                                                ]
                                            );
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#DC2626" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <View style={[styles.profileImage, styles.placeholderImage]}>
                                    <Ionicons name="camera" size={28} color="#6c3b3b" />
                                </View>
                            )}
                            <View style={styles.cameraIconBadge}>
                                <Ionicons name="camera" size={11} color="white" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.headerTextDetailsContainer}>
                            <Text style={styles.itemHeadingTitle} numberOfLines={1}>
                                {activeItemName}
                            </Text>
                            {itemPrice ? (
                                <Text style={styles.itemPriceText}>{itemPrice}</Text>
                            ) : null}
                            <TextInput
                                placeholder='Any adjustments to your order?'
                                placeholderTextColor="#9CA3AF"
                                style={styles.inlineHeaderTextInput}
                                multiline
                                maxLength={100}
                                value={orderNotes}
                                onChangeText={setOrderNotes}
                            />
                        </View>
                    </View>

                    <View style={styles.starCardContainer}>
                        <Text style={styles.sectionTitle}>Overall Item Rating</Text>
                        
                        <View style={styles.starInteractiveRow}>
                            {[1, 2, 3, 4, 5].map((starIndex) => {
                                let iconName: "star" | "star-half" | "star-outline" = "star-outline";
                                
                                if (manualOverallScore >= starIndex) {
                                    iconName = "star";
                                } else if (manualOverallScore >= starIndex - 0.5) {
                                    iconName = "star-half";
                                }

                                return (
                                    <View key={starIndex} style={styles.starToggleGroup}>
                                        <TouchableOpacity 
                                            activeOpacity={0.7}
                                            onPress={() => setManualOverallScore(starIndex - 0.5)}
                                            style={styles.halfStarHitbox}
                                        />
                                        <Ionicons 
                                            name={iconName} 
                                            size={32} 
                                            color="#FBBF24" 
                                            style={styles.starIconVisual} 
                                        />
                                        <TouchableOpacity 
                                            activeOpacity={0.7}
                                            onPress={() => setManualOverallScore(starIndex)}
                                            style={styles.halfStarHitbox}
                                        />
                                    </View>
                                );
                            })}
                        </View>

                        <View style={styles.scoreBadgeContainer}>
                            <Text style={styles.scoreTextSubtitle}>
                                ★ {manualOverallScore.toFixed(1)} / 5.0
                            </Text>
                        </View>
                    </View>

                    <View style={styles.reviewCardContainer}>
                        <Text style={styles.sectionTitle}>Rate your item!</Text>
                        <TextInput
                            placeholder='E.g., This item was great! Highly recommend!. . .'
                            placeholderTextColor="#9CA3AF"
                            style={styles.textInput}
                            multiline
                            maxLength={250}
                            value={adjustmentText}
                            onChangeText={setAdjustmentText}
                        />
                        <Text style={styles.charCounter}>{adjustmentText.length} / 250</Text>
                    </View>

                    <View style={styles.staticCriteriaCardContainer}>
                        <View style={styles.criteriaHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>Detailed Criteria</Text>
                                <Text style={styles.sectionSubTitle}>Rate specific qualities of this item</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton} activeOpacity={0.7}>
                                <Ionicons name="add-circle" size={26} color="#6c3b3b" />
                            </TouchableOpacity>
                        </View>

                        {criteriaList.length === 0 ? (
                            <TouchableOpacity style={styles.emptyCriteriaPlaceholder} onPress={() => setShowAddModal(true)}>
                                <Ionicons name="options-outline" size={18} color="#9CA3AF" />
                                <Text style={styles.emptyCriteriaText}>+ Add criteria (Texture, Portion, Sweetness...)</Text>
                            </TouchableOpacity>
                        ) : (
                            <ScrollView style={styles.criteriaScrollView} showsVerticalScrollIndicator={true}>
                                <View style={styles.criteriaListContainer}>
                                    {criteriaList.map((c) => (
                                        <View key={c.id} style={styles.criterionRow}>
                                            <View style={{ flex: 1 }}>
                                                <RatingMenu
                                                    buttonTitle={`${c.name}: ${c.value || 'Not Rated'}`}
                                                    onSelect={(opt) => {
                                                        setCriteriaList(prev =>
                                                            prev.map(item =>
                                                                item.id === c.id ? { ...item, value: opt.value ?? opt.id } : item
                                                            )
                                                        );
                                                    }}
                                                />
                                            </View>
                                            <TouchableOpacity onPress={() => setCriteriaList(prev => prev.filter(item => item.id !== c.id))} style={styles.removeButton}>
                                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>

                <View style={styles.fixedFooterButtonContainer}>
                    <TouchableOpacity style={styles.primarySubmitButton} activeOpacity={0.85} onPress={handleFormSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.primarySubmitButtonText}>{existingReview ? 'Save Changes' : 'Submit Review'}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Modal visible={isProfileModal} animationType="slide" transparent={true} onRequestClose={() => setProfileModalVisible(false)}>
                    <TouchableOpacity style={styles.modalProfileView} activeOpacity={1} onPress={() => setProfileModalVisible(false)}>
                        <View style={styles.profileModalView}>
                            <View style={styles.sheetHandleBar} />
                            <Text style={styles.profileModalTitle}>Upload Item Photo</Text>
                            <View style={styles.profileButtonContainer}>
                                <TouchableOpacity style={styles.profileButton} onPress={pickImage}>
                                    <Ionicons name="images-outline" size={20} color="#6c3b3b" />
                                    <Text style={styles.buttonTextDark}>Pick from Photo Library</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.profileButton} onPress={takePhoto}>
                                    <Ionicons name="camera-outline" size={20} color="#6c3b3b" />
                                    <Text style={styles.buttonTextDark}>Use Live Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelProfileButton} onPress={() => setProfileModalVisible(false)}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>

                <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
                    <View style={styles.addModalCenteredView}>
                        <View style={styles.addModalView}>
                            <Text style={styles.modalTitle}>Add Rating Criteria</Text>
                            <Text style={styles.modalSubtitle}>Select a preset metric:</Text>
                            
                            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                                {PREDEFINED_CRITERIA.map((name) => (
                                    <TouchableOpacity key={name} style={styles.addOption} onPress={() => handleAddCriterion(name)}>
                                        <Text style={styles.addOptionText}>{name}</Text>
                                        <Ionicons name="add" size={16} color="#6c3b3b" />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.modalActionRow}>
                                <TouchableOpacity style={[styles.dialogBtn, styles.btnCancel]} onPress={() => setShowAddModal(false)}>
                                    <Text style={styles.btnCancelText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <Modal visible={isDiscardModalVisible} transparent={true} animationType="fade" onRequestClose={() => setDiscardModalVisible(false)}>
                    <View style={styles.modalCenteredView}>
                        <View style={styles.modalView}>
                            <Ionicons name="warning-outline" size={28} color="#DC2626" style={{ marginBottom: 6 }} />
                            <Text style={styles.modalTitle}>Discard changes?</Text>
                            <Text style={styles.modalText}>Are you sure you want to exit? Your review details will not be saved.</Text>
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={[styles.button, styles.buttonLeave]} onPress={handleLeave}>
                                    <Text style={styles.textStyle}>Discard</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.buttonContinue]} onPress={() => setDiscardModalVisible(false)}>
                                    <Text style={styles.textStyle}>Keep Editing</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: { 
        flex: 1, 
        backgroundColor: '#FAFAFA' 
    },
    customHeaderBar: {
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 8,
        alignItems: 'flex-start',
    },
    closeButtonContainer: {
        padding: 4,
    },
    mainLayoutContainer: { 
        flex: 1,
        marginTop: 10,
        paddingBottom: 76,
    },
    amazonHeaderRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 4,
        marginBottom: 10,
        alignItems: 'flex-start',
        gap: 12,
    },
    imageContainer: { 
        position: 'relative', 
        width: 86, 
        height: 86,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    profileImage: {
        width: 86,
        height: 86,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    cameraIconBadge: {
        position: 'absolute',
        bottom: 3,
        right: 3,
        backgroundColor: '#6c3b3b',
        borderRadius: 10,
        padding: 4,
        zIndex: 3,
        borderWidth: 1.5,
        borderColor: '#FAFAFA',
    },
    removeImageButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 2,
        zIndex: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    headerTextDetailsContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        paddingTop: 2,
    },
    itemHeadingTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
        lineHeight: 19,
        marginLeft: 2,
    },
    itemPriceText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6c3b3b',
        marginBottom: 4,
    },
    inlineHeaderTextInput: {
        height: 63,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FAFAFA',
        padding: 6,
        borderRadius: 8,
        textAlignVertical: 'top',
        fontSize: 11,
        color: '#374151',
    },
    starCardContainer: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 16, 
        padding: 12, 
        marginHorizontal: 16, 
        marginBottom: 10, 
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 1,
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.03, 
        shadowRadius: 2, 
    },
    reviewCardContainer: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 16, 
        height: 200,
        padding: 12, 
        marginHorizontal: 16, 
        marginBottom: 10, 
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 1,
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.03, 
        shadowRadius: 2, 
    },
    staticCriteriaCardContainer: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 16, 
        padding: 12, 
        marginHorizontal: 16, 
        marginBottom: 10, 
        height: 255, 
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 1,
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.03, 
        shadowRadius: 2, 
    },
    criteriaScrollView: {
        flex: 1,
        marginTop: 4,
    },
    sectionTitle: { 
        fontSize: 13, 
        fontWeight: '800', 
        color: '#1F2937', 
        marginBottom: 1,
    },
    sectionSubTitle: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    starInteractiveRow: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 6, 
        gap: 4 
    },
    starToggleGroup: { 
        flexDirection: 'row', 
        position: 'relative', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: 36, 
        height: 36 
    },
    starIconVisual: { 
        position: 'absolute', 
        zIndex: 1, 
        pointerEvents: 'none' 
    },
    halfStarHitbox: { 
        width: 18, 
        height: '100%', 
        zIndex: 2 
    },
    scoreBadgeContainer: {
        alignSelf: 'center',
        backgroundColor: 'rgba(108, 59, 59, 0.08)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        marginTop: 6,
    },
    scoreTextSubtitle: { 
        textAlign: 'center', 
        fontSize: 12, 
        color: '#6c3b3b', 
        fontWeight: '800' 
    },
    textInput: { 
        height: 140, 
        borderWidth: 1, 
        borderColor: '#E5E7EB', 
        backgroundColor: '#FAFAFA', 
        padding: 10, 
        borderRadius: 12, 
        textAlignVertical: 'top', 
        fontSize: 12, 
        color: '#374151',
        marginTop: 6,
    },
    charCounter: { 
        textAlign: 'right', 
        fontSize: 10, 
        color: '#9CA3AF', 
        marginTop: 3 
    },
    criteriaHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 6 
    },
    addButton: { 
        padding: 2 
    },
    emptyCriteriaPlaceholder: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FAFAFA',
        marginTop: 6,
    },
    emptyCriteriaText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    criteriaListContainer: {
        gap: 4,
    },
    criterionRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#FAFAFA', 
        borderRadius: 12, 
        paddingLeft: 4, 
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    removeButton: { 
        padding: 10, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    fixedFooterButtonContainer: { 
        position: 'absolute', 
        bottom: 12, 
        left: 0, 
        right: 0, 
        backgroundColor: '#FFFFFF', 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderTopWidth: 1, 
        borderTopColor: '#F3F4F6', 
        zIndex: 10 
    },
    primarySubmitButton: { 
        backgroundColor: '#6c3b3b', 
        height: 44, 
        borderRadius: 14, 
        justifyContent: 'center', 
        alignItems: 'center', 
        elevation: 2, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 3 
    },
    primarySubmitButtonText: { 
        color: '#FFFFFF', 
        fontSize: 14, 
        fontWeight: '800' 
    },
    modalProfileView: { 
        flex: 1, 
        justifyContent: 'flex-end', 
        backgroundColor: 'rgba(0,0,0,0.4)' 
    },
    profileModalView: { 
        backgroundColor: 'white', 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24, 
        paddingHorizontal: 18, 
        paddingTop: 10, 
        paddingBottom: 30 
    },
    sheetHandleBar: {
        width: 32,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 14,
    },
    profileModalTitle: { 
        fontSize: 15, 
        fontWeight: '800', 
        color: '#1F2937', 
        marginBottom: 14, 
        textAlign: 'center' 
    },
    profileButtonContainer: { 
        gap: 8 
    },
    profileButton: { 
        borderRadius: 12, 
        padding: 12, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F3F4F6' 
    },
    buttonTextDark: { 
        fontSize: 13, 
        fontWeight: '700', 
        color: '#374151' 
    },
    cancelProfileButton: {
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        marginTop: 2,
    },
    cancelButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    addModalCenteredView: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.4)' 
    },
    addModalView: { 
        width: '80%', 
        backgroundColor: 'white', 
        borderRadius: 20, 
        padding: 18, 
        elevation: 5 
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
    },
    modalSubtitle: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
        marginBottom: 10,
    },
    addOption: { 
        paddingVertical: 10, 
        borderBottomWidth: 1, 
        borderColor: '#F3F4F6',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addOptionText: { 
        fontSize: 13, 
        fontWeight: '600',
        color: '#374151' 
    },
    modalActionRow: { 
        flexDirection: 'row', 
        marginTop: 14, 
        justifyContent: 'center' 
    },
    dialogBtn: { 
        padding: 10, 
        borderRadius: 10, 
        alignItems: 'center',
        minWidth: 90
    },
    btnCancel: { 
        backgroundColor: '#F3F4F6' 
    },
    btnCancelText: {
        color: '#4B5563',
        fontWeight: '700',
        fontSize: 12,
    },
    modalCenteredView: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.5)' 
    },
    modalView: { 
        width: '78%', 
        backgroundColor: 'white', 
        borderRadius: 20, 
        padding: 20, 
        alignItems: 'center' 
    },
    modalText: { 
        fontSize: 12, 
        color: '#6B7280', 
        textAlign: 'center', 
        marginBottom: 16, 
        lineHeight: 16 
    },
    buttonContainer: { 
        flexDirection: 'row', 
        gap: 8 
    },
    button: { 
        borderRadius: 10, 
        padding: 10, 
        flex: 1, 
        alignItems: 'center' 
    },
    buttonLeave: { 
        backgroundColor: '#EF4444' 
    },
    buttonContinue: { 
        backgroundColor: '#4B5563' 
    },
    textStyle: { 
        color: 'white', 
        fontWeight: '700', 
        fontSize: 12 
    }
});
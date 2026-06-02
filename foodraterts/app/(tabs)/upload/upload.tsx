import React, { useState, useLayoutEffect } from 'react';
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
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import RatingMenu from '../../../components/RatingMenu';

interface Criterion {
    id: string;
    name: string;
    value: number | string;
}

const PREDEFINED_CRITERIA = [
    'Accuracy',
    'Freshness',
    'Portion Size',
    'Presentation',
    'Sweetness',
    'Texture',
    'Value for Money'
];

// Get screen height to optimize layout spacing boundaries
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function Upload() {
    const navigation = useNavigation();
    const router = useRouter();
    
    // UI Modals
    const [isDiscardModalVisible, setDiscardModalVisible] = useState(false);
    const [isProfileModal, setProfileModalVisible] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form Data States
    const [image, setImage] = useState<string | null>(null);
    const [adjustmentText, setAdjustmentText] = useState('');
    const [newCriterionName, setNewCriterionName] = useState('');
    const [criteriaList, setCriteriaList] = useState<Criterion[]>([]);
    
    // Manual Overall Score Tracking (Supports half-stars)
    const [manualOverallScore, setManualOverallScore] = useState<number>(5.0);

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
            setProfileModalVisible(false);
        }
    };

    const handleLeave = () => {
        setDiscardModalVisible(false);
        router.replace('/home');
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => setDiscardModalVisible(true)} style={{ marginLeft: 16 }}>
                    <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const handleAddCriterion = (name: string) => {
        if (!name.trim()) return;
        if (criteriaList.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
            Alert.alert('Duplicate Metric', 'This field has already been added.');
            return;
        }
        const id = `${Date.now()}-${name.trim()}`;
        setCriteriaList(prev => [...prev, { id, name: name.trim(), value: 0 }]);
        setNewCriterionName('');
        setShowAddModal(false);
    };

    // Determine padding scaling dynamically based on count to crunch size downwards
    const getDynamicRowStyles = () => {
        const totalItems = criteriaList.length;
        if (totalItems <= 3) return { paddingVertical: 10, marginVertical: 6 };
        if (totalItems <= 5) return { paddingVertical: 6, marginVertical: 4 };
        return { paddingVertical: 3, marginVertical: 2 }; // Extreme shrink to enforce one-screen constraints
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.root}>
                {/* Fixed container structure instead of loose scroll blocks ensures single screen locks */}
                <View style={styles.mainLayoutContent}>
                    
                    {/* Item Image Upload Frame */}
                    <View style={styles.centerImageWrapper}>
                        <TouchableOpacity onPress={() => setProfileModalVisible(true)} style={styles.imageContainer}>
                            <Image
                                source={image ? { uri: image } : { uri: 'https://thumbs.dreamstime.com/b/culinary-symphony-blue-smoke-exquisite-food-photography-black-background-showcasing-gourmet-delights-captivating-363004972.jpg' }}
                                style={styles.profileImage}
                            />
                            <Ionicons
                                name="camera"
                                size={22}
                                color="white"
                                style={styles.cameraIconBadge}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Interactive Overall Rating Panel */}
                    <View style={styles.cardContainer}>
                        <Text style={styles.sectionTitle}>Overall Item Rating</Text>
                        
                        {/* Interactive Half-Star Touch Row */}
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
                                            size={36} 
                                            color="#FFD700" 
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
                        <Text style={styles.scoreTextSubtitle}>
                            Score: {manualOverallScore.toFixed(1)} / 5.0
                        </Text>
                    </View>

                    {/* Order Customization Notes Input Section */}
                    <View style={styles.cardContainer}>
                        <Text style={styles.sectionTitle}>Any adjustments to your order?</Text>
                        <TextInput
                            placeholder='E.g., Ordered with 50% sweetness, less ice...'
                            style={styles.textInput}
                            multiline
                            maxLength={250}
                            keyboardAppearance='dark'
                            value={adjustmentText}
                            onChangeText={setAdjustmentText}
                        />
                        <Text style={styles.charCounter}>{adjustmentText.length} / 250</Text>
                    </View>

                    {/* Granular Attribute Configuration Panel (Flexible Height Engine) */}
                    <View style={[styles.cardContainer, styles.flexibleCriteriaBox]}>
                        <View style={styles.criteriaHeader}>
                            <Text style={styles.sectionTitle}>Granular Attributes</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
                                <Ionicons name="add-circle" size={28} color="#6c3b3b" />
                            </TouchableOpacity>
                        </View>

                        {/* Flat list mapping with internal shrinking constraints */}
                        <ScrollView 
                            contentContainerStyle={{ flexGrow: 1 }} 
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {criteriaList.map((c) => (
                                <View 
                                    key={c.id} 
                                    style={[styles.criterionRow, getDynamicRowStyles()]}
                                >
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
                                    <TouchableOpacity 
                                        onPress={() => setCriteriaList(prev => prev.filter(item => item.id !== c.id))} 
                                        style={styles.removeButton}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#b01212" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                {/* --- OVERLAY MODALS --- */}

                {/* Media Picker Sheet Overlay */}
                <Modal visible={isProfileModal} animationType="slide" transparent={true} onRequestClose={() => setProfileModalVisible(false)}>
                    <View style={styles.modalProfileView}>
                        <View style={styles.profileModalView}>
                            <Text style={styles.profileModalTitle}>Upload Item Photo</Text>
                            <View style={styles.profileButtonContainer}>
                                <TouchableOpacity style={[styles.profileButton, styles.buttonNeutral]} onPress={pickImage}>
                                    <Text style={styles.buttonTextDark}>Pick from Photo Library</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.profileButton, styles.buttonNeutral]} onPress={takePhoto}>
                                    <Text style={styles.buttonTextDark}>Use Live Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.profileButton, { backgroundColor: '#ccc' }]} onPress={() => setProfileModalVisible(false)}>
                                    <Text style={styles.buttonTextDark}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Criterion Metric Construction Sheet */}
                <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
                    <View style={styles.addModalCenteredView}>
                        <View style={styles.addModalView}>
                            <Text style={styles.modalTitle}>Add Rating Criteria</Text>
                            <ScrollView style={{ maxHeight: 200 }}>
                                {PREDEFINED_CRITERIA.map((name) => (
                                    <TouchableOpacity
                                        key={name}
                                        style={styles.addOption}
                                        onPress={() => handleAddCriterion(name)}
                                    >
                                        <Text style={styles.addOptionText}>{name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.customLabel}>Or build a custom metric:</Text>
                            <TextInput
                                placeholder="E.g., Spice Level, Chewiness"
                                value={newCriterionName}
                                onChangeText={setNewCriterionName}
                                style={styles.addInput}
                            />
                            <View style={styles.modalActionRow}>
                                <TouchableOpacity style={[styles.dialogBtn, styles.btnConfirm]} onPress={() => handleAddCriterion(newCriterionName)}>
                                    <Text style={styles.textStyle}>Add Metric</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.dialogBtn, styles.btnCancel]} onPress={() => { setShowAddModal(false); setNewCriterionName(''); }}>
                                    <Text style={styles.textStyle}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Discard Workspace Escape Confirmation Dialog */}
                <Modal visible={isDiscardModalVisible} transparent={true} animationType="fade" onRequestClose={() => setDiscardModalVisible(false)}>
                    <View style={styles.modalCenteredView}>
                        <View style={styles.modalView}>
                            <Text style={styles.modalTitle}>Discard changes?</Text>
                            <Text style={styles.modalText}>Are you sure you want to exit? Your item configurations will not be recorded.</Text>
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
        backgroundColor: '#F9FAFB',
    },
    mainLayoutContent: {
        flex: 1,
        paddingBottom: 16,
    },
    centerImageWrapper: {
        alignItems: 'center',
        marginVertical: SCREEN_HEIGHT < 700 ? 10 : 16, // Adjust padding on shorter screen scales
    },
    imageContainer: {
        position: 'relative',
        width: 100,
        height: 100,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderColor: '#E5E7EB',
        borderWidth: 3,
        borderRadius: 50,
        backgroundColor: '#E5E7EB'
    },
    cameraIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#6c3b3b',
        borderRadius: 20,
        padding: 5,
        overflow: 'hidden',
    },
    cardContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 14,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 2,
    },
    flexibleCriteriaBox: {
        flex: 1, // Tells the attributes box to swallow up all remaining layout room dynamically
        minHeight: 150,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 6,
    },
    starInteractiveRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
        gap: 6,
    },
    starToggleGroup: {
        flexDirection: 'row',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
    },
    starIconVisual: {
        position: 'absolute',
        zIndex: 1,
        pointerEvents: 'none',
    },
    halfStarHitbox: {
        width: 20,
        height: '100%',
        zIndex: 2,
    },
    scoreTextSubtitle: {
        textAlign: 'center',
        fontSize: 14,
        color: '#6c3b3b',
        marginTop: 6,
        fontWeight: '700',
    },
    textInput: {
        height: SCREEN_HEIGHT < 700 ? 60 : 75, // Contracts textbox height cleanly on smaller devices
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FBFBFB',
        padding: 10,
        borderRadius: 12,
        textAlignVertical: 'top',
        fontSize: 13,
        color: '#374151',
    },
    charCounter: {
        textAlign: 'right',
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    criteriaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    addButton: {
        padding: 2,
    },
    criterionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingLeft: 4,
    },
    removeButton: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
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
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    profileButtonContainer: {
        gap: 12,
    },
    profileButton: {
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
    },
    buttonNeutral: {
        backgroundColor: '#F3F4F6',
    },
    buttonTextDark: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    addModalCenteredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    addModalView: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    addOption: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
    },
    addOptionText: {
        fontSize: 15,
        color: '#4B5563',
    },
    customLabel: {
        marginTop: 16,
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    addInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        padding: 10,
        borderRadius: 10,
        marginTop: 6,
        fontSize: 14,
    },
    modalActionRow: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 10,
    },
    dialogBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnConfirm: {
        backgroundColor: '#6c3b3b',
    },
    btnCancel: {
        backgroundColor: '#9CA3AF',
    },
    modalCenteredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    modalTitle: {
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
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        borderRadius: 12,
        padding: 12,
        flex: 1,
        alignItems: 'center',
    },
    buttonLeave: {
        backgroundColor: '#DC2626',
    },
    buttonContinue: {
        backgroundColor: '#4B5563',
    },
    textStyle: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
});
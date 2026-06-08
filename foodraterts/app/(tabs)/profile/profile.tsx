







































import React, { useLayoutEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Modal,
    SafeAreaView,
    ScrollView,
    Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import Slider from '@react-native-community/slider';

export default function Profile() {
    const navigation = useNavigation<any>();
    const router = useRouter();

    // UI State
    const [isSignOutModalVisible, setSignOutModalVisible] = useState(false);
    const [isProfileModal, setProfileModalVisible] = useState(false);
    const [image, setImage] = useState<string | null>(null);

    // User Taste Preferences States (Boba-focused)
    const [sweetnessPref, setSweetnessPref] = useState<number>(0.5); // 0.0 to 1.0 (e.g., 50% sweetness)
    const [icePref, setIcePref] = useState<number>(0.5);             // 0.0 to 1.0 (e.g., Less/Regular ice)
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

    const handleLeave = () => {
        setSignOutModalVisible(false);
        router.replace('/');
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerRightContainer}>
                    <TouchableOpacity onPress={() => navigation.openDrawer()}>
                        <Ionicons name="menu-outline" size={24} color="black" style={styles.headerIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSignOutModalVisible(true)}>
                        <Ionicons name="log-out-outline" size={24} color="black" style={styles.headerIcon} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation]);

    return (
        <SafeAreaView style={styles.root}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                
                {/* Profile Header Block */}
                <View style={styles.profileHeaderCard}>
                    <TouchableOpacity onPress={() => setProfileModalVisible(true)} style={styles.imageContainer}>
                        <Image
                            source={image ? { uri: image } : { uri: 'https://thumbs.dreamstime.com/b/culinary-symphony-blue-smoke-exquisite-food-photography-black-background-showcasing-gourmet-delights-captivating-363004972.jpg' }}
                            style={styles.profileImage}
                        />
                        <Ionicons name="add-circle" size={28} color="#6c3b3b" style={styles.cameraIconBadge} />
                    </TouchableOpacity>
                    <Text style={styles.displayName}>CHANG88S</Text>
                    <Text style={styles.locationTag}>Riverside, CA</Text>
                </View>

                {/* Shared Taste Profile Preferences Card */}
                <View style={styles.preferenceCard}>
                    <Text style={styles.cardTitle}>My Boba Taste Fingerprint</Text>
                    <Text style={styles.cardSubtitle}>Followers use this baseline to match your taste profile reviews.</Text>

                    {/* Sweetness Slider Preference */}
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

                    {/* Ice Slider Preference */}
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

                    {/* Base Milk Selection Matrix Toggle */}
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

            </ScrollView>

            {/* --- MODAL INTERFACES --- */}

            {/* Profile Avatar Selection Overlay */}
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

            {/* Account Sign Out Diagnostic Dialogue Window */}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContainer: {
        paddingBottom: 30,
    },
    headerRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        marginRight: 16,
    },
    profileHeaderCard: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
    },
    imageContainer: {
        position: 'relative',
        width: 110,
        height: 110,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderColor: '#E5E7EB',
        borderWidth: 3,
        borderRadius: 50,
    },
    cameraIconBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'white',
        borderRadius: 14,
        overflow: 'hidden',
    },
    displayName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
        marginTop: 12,
        letterSpacing: 0.5,
    },
    locationTag: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
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
        marginBottom: 20,
        lineHeight: 16,
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
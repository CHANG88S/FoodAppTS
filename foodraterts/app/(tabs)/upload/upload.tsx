import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useState, useLayoutEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import CircularProgress from 'react-native-circular-progress-indicator';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';

export default function Upload() {
    const navigation = useNavigation();
    const router = useRouter();
    const [isModalVisible, setModalVisible] = useState(false);
    const [isProfileModal, setProfileModalVisible] = useState(false);
    const [image, setImage] = useState<string | null>(null);


    const pickImage = async () => {
            const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();     // Request media library permissions
                if (libraryStatus !== 'granted') {
                    alert('Sorry, we need media library permissions to make this work!');                  // Alert if permissions aren't granted
                    setProfileModalVisible(false);                                                         // Close modal if permissions are not granted
                    return;
            }
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],                                                                // Allow only images
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });
                if (!result.canceled) {
                    setImage(result.assets[0].uri);
                }
        };
    
        const takePhoto = async () => {
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();            // Request camera permissions
                if (cameraStatus !== 'granted') {
                alert('Sorry, we need camera permissions to make this work!');
                setProfileModalVisible(false);
                return;
            }
            let result = await ImagePicker.launchCameraAsync({
                cameraType: ImagePicker.CameraType.front,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });
                if (!result.canceled) {
                    setImage(result.assets[0].uri);
                }
        };

    const handleLeave = () => {
        setModalVisible(false);
        router.replace('/home'); // Replaces the current screen with the home screen
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Ionicons name="close" size={24} color="black" />       
                </TouchableOpacity> 
            ),
        });
    }, [navigation]);

    return (
        <SafeAreaView style={styles.root}>
            <TouchableOpacity onPress={setProfileModalVisible.bind(null, true)}>
                <Modal                                      // Modal to change profile picture
                    visible={isProfileModal}
                    onRequestClose={() => setProfileModalVisible(false)}
                    animationType="fade"
                    transparent={true}
                    >
                        <View style={styles.modalCenteredView}>
                        <View style={styles.modalView}>
                            <Text style={styles.modalTitle}>Upload an Image?</Text>
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity //
                                    style={[styles.button, styles.buttonLeave]}
                                    onPress={() => setProfileModalVisible(false)}
                                    >
                                    <Text style={styles.textStyle}>Closes Modal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonNeutral]}
                                    onPress={pickImage}
                                    >
                                    <Text style={styles.textStyle}>Pick from Gallery</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonNeutral]}
                                    onPress={takePhoto}
                                    >
                                    <Text style={styles.textStyle}>Take a Photo</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        </View>
                                
                </Modal>
                    <View style={styles.imageContainer}>
                        <Image                                                // Default Profile Image
                            source={image ? { uri: '' } : { uri: '' }}
                            style={styles.profileImage}
                            />
                            <Ionicons
                                name="add-circle-outline" // Correct prop name
                                size={30}
                                color="black"
                                style={[
                                styles.cameraIcon,
                                { position: 'absolute', bottom: 8, right: 8 }]}
                            />
                    </View>
                                    
            </TouchableOpacity>


                <View style = {styles.CircularProgressContainer}>
                <CircularProgress
                    radius = {50}
                    value = {0}
                    valueSuffix='⭐'
                    inActiveStrokeOpacity='.75'
                    padding = {8}
                />
                
                <CircularProgress
                    radius = {50}
                    value = {0}
                    valueSuffix='⭐'
                    inActiveStrokeOpacity='.75'
                    padding = {8}
                />
                <CircularProgress
                    radius = {50}
                    value = {10}
                    valueSuffix='⭐'
                    inActiveStrokeOpacity='.75'
                    padding = {8}
                />
                <CircularProgress
                    radius = {50}
                    value = {10}
                    valueSuffix='⭐'
                    inActiveStrokeOpacity='.75'
                    padding = {8}
                />
                
            </View> 
            <View style={styles.content}>
                

                <Text>This is the editing screen.</Text>
            </View>
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Modal
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
                animationType="fade"
                transparent={true}
            >
                {/* Back Button */}
                <View style={styles.modalCenteredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>
                            Discard changes?
                        </Text>
                        <Text style={styles.modalText}>
                            Are you sure you want to leave? Your edits will not be saved.
                        </Text>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonLeave]}
                                onPress={handleLeave}
                            >
                                <Text style={styles.textStyle}>Leave</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonContinue]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.textStyle}>Continue Editing</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
                
                </GestureHandlerRootView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },

    CircularProgressContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: 8,
        // alignContent: 'space-evenly',
        justifyContent: 'flex-start',
        gap: 8,
        // paddingHorizontal: 20
    },

    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalCenteredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },

    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },

    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },

    button: {
        borderRadius: 20,
        padding: 8,
        elevation: 2,
        flex: 1,
        marginHorizontal: 5,
    },

    buttonLeave: {
        backgroundColor: 'red',
    },

    buttonContinue: {
        backgroundColor: 'blue',
    },

    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
        imageContainer:{
        position: 'relative',
        width: 105,                             // Place in relation to image border
        height: 110,                            // Match image height
        marginTop: 20,
        marginLeft: 20,
        
    },

    cameraIcon: {
        backgroundColor: 'white',
        borderRadius: 50,                       // Make it circular
    },

    profileImage: {
        width: 100,
        height: 100,
        borderColor: 'gray',
        borderWidth: 2,
        borderRadius: 50,                       // Half of width/height for a perfect circle
    },

    center: {
         flex: 4, 
         alignItems: 'center', 
         justifyContent: 'center' 
    },

    displayName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 8,
        color: 'black',
        marginLeft: 20, // Align text with the image
    },

    

    buttonNeutral:{
        backgroundColor: 'lightgray',
    },

});
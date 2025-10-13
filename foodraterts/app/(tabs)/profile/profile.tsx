import { View, Text, StyleSheet, Image, Touchable, TouchableOpacity, Modal, SafeAreaView, Platform, Button } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useLayoutEffect, useState } from 'react';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation, Stack, } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer'




export default function Profile() {

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
        router.replace('/');                    // Replaces the current screen with the login screen '/'goes back to the root
    };
    
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.openDrawer()}>
                        <Ionicons
                            name="menu-outline"
                            size={24}
                            color="black"
                            style={{ marginRight: 16 }}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Ionicons
                            name="log-out-outline"
                            size={24}
                            color="black"
                            style={{ marginRight: 16 }}
                        />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation]);





    return (
        <SafeAreaView style={styles.root}>
            <Modal                                          // Modal to confirm sign out
                visible={isModalVisible}
                    onRequestClose={() => setModalVisible(false)}
                    animationType="fade"
                    transparent={true}
            >                                    
                <View style={styles.modalCenteredView}>
                    <View style={styles.logModalView}>
                        <Text style={styles.logModalTitle}>
                            Sign Out?
                        </Text>
                        <Text style={styles.modalText}>
                            Are you sure you want to log out?
                        </Text>
                        <View style={styles.logButtonContainer}>
                            <TouchableOpacity
                                style={[styles.logButton, styles.buttonLeave]}
                                onPress={handleLeave}
                                >
                                <Text style={styles.textStyle}>Sign Out</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.logButton, styles.buttonContinue]}
                                onPress={() => setModalVisible(false)}
                                >
                                <Text style={styles.textStyle}>Stay Signed In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
                <Text style={styles.displayName}>
                    CHANG88S 
                </Text>
                    <TouchableOpacity onPress={setProfileModalVisible.bind(null, true)} style={styles.centeredContent}>
                        <Modal                                      // Modal to change profile picture
                            visible={isProfileModal}
                            onRequestClose={() => setProfileModalVisible(false)}
                            animationType="fade"
                            transparent={true}
                        >
                        <View style={styles.modalProfileView}>
                            <View style={styles.profileModalView}>
                                <Text style={styles.profileModalTitle}>Change Profile Picture</Text>
                                <View style={styles.profileButtonContainer}>
                                    <TouchableOpacity
                                        style={[styles.profileButton, styles.buttonNeutral]}
                                        onPress={pickImage}
                                    >
                                        <Text style={styles.closeTextStyle}>Pick from Gallery</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.profileButton, styles.buttonNeutral]}
                                        onPress={takePhoto}
                                    >
                                        <Text style={styles.closeTextStyle}>Take a Photo</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity //
                                        style={[styles.profileButton, styles.buttonNeutral]}
                                        onPress={() => setProfileModalVisible(false)}
                                    >
                                        <Text style={styles.closeTextStyle}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        </Modal>
                            <View style={styles.imageContainer}>
                            <Image                                                // Default Profile Image
                                source={image ? { uri: image } : { uri: 'https://thumbs.dreamstime.com/b/culinary-symphony-blue-smoke-exquisite-food-photography-black-background-showcasing-gourmet-delights-captivating-363004972.jpg' }}
                                style={styles.profileImage}
                            />
                            <Ionicons
                                name="add-circle-outline" // Correct prop name
                                size={30}
                                color="black"
                                style={[
                                styles.cameraIcon,
                                { position: 'absolute', bottom: 8, right: 8 }
                            ]}
                            />
                            </View>
                        
                    </TouchableOpacity>
                    
                    {/* <Button title="Pick an image from camera roll" onPress={pickImage} /> */}
                    
                    <View 
                        style = {styles.center}>
                    <Text>Profile Screen</Text> 
                    
                    </View>
                    
                    
        </SafeAreaView>
    );
}

// 

// const saveImage = async (image: any) => { 
//     try {
//         setImage(image);
//         setModalVisible(false);
//     }   catch (error) {
//         throw error;
//     }
// 


  // const setupProfile = async () => {
    //     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    //     const [image, setImage] = useState(null);
    //     useEffect(() => {
    //         (async () => {
    //             if (Platform.OS !== 'web') {
    //                 const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    //                 if (status !== 'granted') {
    //                     alert('Sorry, we need camera roll permissions to make this work!');
    //                 }
    //             }
    //         })();
    //     }, []);






const styles = StyleSheet.create({
    root: {  
        flex: 1,
        position: 'relative',
    },
    
    container: {
        alignContent: 'flex-start',
        justifyContent: 'center',
        width: 320,
        height: 320,
    },

    centeredContent: {
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },

    imageContainer:{
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        width: 105,                             // Place in relation to image border
        height: 110,                            // Match image height
        // marginTop: 20,
        margin: 16,
        
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
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 16,
        color: 'black',
        marginLeft: 20, // Align text with the image
        textAlign: 'left',
    },

    modalCenteredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },

    

    logModalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
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

    

    logModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },

    logButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },

    logButton: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
        flex: 1,
        marginHorizontal: 5,
    },

    buttonLeave: {
        backgroundColor: '#b01212',
    },

    buttonContinue: {
        backgroundColor: '#4371bd',
        opacity: 1,
    },

    buttonNeutral:{
        backgroundColor: 'lightgray',
    },

    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 20,
    },

    // Gallery and Camera Menu at the bottom

    modalProfileView: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: '100%',
    },

    profileModalView: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%', // Use full width of parent container
        paddingHorizontal: 20, // Add horizontal padding
        paddingVertical: 30, // Add vertical padding
        justifyContent: 'flex-end',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },

    closeTextStyle: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        // backgroundColor: 'gray',
        justifyContent: 'space-evenly',
        width: 'auto'
    },

    profileModalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center'
    },

    profileButtonContainer: {
        flexDirection: 'column',
        width: '100%', // Ensure the buttons fill the container
    },

    profileButton: {
        borderRadius: 20,
        padding: 15,
        elevation: 4,
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

});



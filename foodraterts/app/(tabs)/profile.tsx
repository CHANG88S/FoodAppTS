import { View, Text, StyleSheet, Image, Touchable, TouchableOpacity, Modal, SafeAreaView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useLayoutEffect, useState } from 'react';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';



export default function Profile() {

    const navigation = useNavigation();
    const router = useRouter();
    const [isModalVisible, setModalVisible] = useState(false);
    

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


    const handleLeave = () => {
        setModalVisible(false);
        router.replace('/'); // Replaces the current screen with the login screen
    };
    
    
    useLayoutEffect(() => {
            navigation.setOptions({
                headerRight: () => (
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Ionicons 
                        name="log-out-outline" 
                        size={24} 
                        color="black"
                        marginRight= "15" />       
                    </TouchableOpacity> 
                ),
            });
        }, [navigation]);


    return (
        <SafeAreaView style={styles.root}>
                    
                        <TouchableOpacity onPress={uploadImage}>
                            <Image
                                source={{ uri: 'https://cdn.discordapp.com/attachments/1014354049333743626/1400724695866802246/Untitled.png?ex=688dae07&is=688c5c87&hm=e789a6023b4595f35753c5f68dd4b17b56c7a252c5c988f94b019273d1e9b0d5&' }} 
                            style = {styles.image}>
                            </Image>
                            <MaterialCommunityIcons 
                                Name="cameraOutline"
                                size={30}
                                color="black"
                                style={{ position: 'absolute', bottom: 10, right: 10 }}
                            />
                        </TouchableOpacity>
                            
                    <Text style={styles.displayName}>
                        CHANG88S 
                    </Text>
                        <Modal
                                    visible={isModalVisible}
                                    onRequestClose={() => setModalVisible(false)}
                                    animationType="fade"
                                    transparent={false}
                                >
                                    {/* Back Button */}
                                    <View style={styles.modalCenteredView}>
                                        <View style={styles.modalView}>
                                            <Text style={styles.modalTitle}>
                                                Sign Out?
                                            </Text>
                                            <Text style={styles.modalText}>
                                                Are you sure you want to log out?
                                            </Text>
                                            <View style={styles.buttonContainer}>
                                                <TouchableOpacity
                                                    style={[styles.button, styles.buttonLeave]}
                                                    onPress={handleLeave}
                                                >
                                                    <Text style={styles.textStyle}>Sign Out</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.button, styles.buttonContinue]}
                                                    onPress={() => setModalVisible(false)}
                                                >
                                                    <Text style={styles.textStyle}>Stay Signed In</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </Modal>
                    <View 
                        style = {styles.center}>
                    <Text>Profile Screen</Text> 
                    
                    </View>
                    
                    
        </SafeAreaView>
    );
}

const uploadImage = async () => {
    try {
        await ImagePicker.
        requestMediaLibraryPermissionsAsync(), 
        ImagePicker.requestCameraPermissionsAsync;
        let result = await ImagePicker.
        launchCameraAsync({
            cameraType: ImagePicker.CameraType.front,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
    } catch (error) {
        console.error("Error requesting permissions:", error);
    }
}

// const saveImage = async (image: any) => { 
//     try {
//         setImage(image);
//         setModalVisible(false);
//     }   catch (error) {
//         throw error;
//     }
// 









const styles = StyleSheet.create({
    root:{  
        flex: 1,
        position: 'relative',
    },
    container: {
        alignContent: 'flex-start',
        justifyContent: 'center',
        width: 320,
        height: 320,
    },
    image: {
        width: 100,
        height: 100,
        marginTop: 30,      // Margins only for image
        marginLeft: 20,     // Same Comment
        borderColor: 'gray',
        borderWidth: 2,
        borderRadius: 50,   // Half of width/height for a perfect circle
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
        padding: 10,
        elevation: 2,
        flex: 1,
        marginHorizontal: 5,
    },

    buttonLeave: {
        backgroundColor: 'red',
    },

    buttonContinue: {
        backgroundColor: 'blue',
        opacity: 0.,
    },

    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

// }

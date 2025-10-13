import { View, Text, Modal, TouchableOpacity, SafeAreaView, Image, StyleSheet, TextInput, } from 'react-native';
import { useState, useLayoutEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import CircularProgress from 'react-native-circular-progress-indicator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import Slider from '@react-native-community/slider';

export default function Upload() {
    const navigation = useNavigation();
    const router = useRouter();
    const [isModalVisible, setModalVisible] = useState(false);
    const [isProfileModal, setProfileModalVisible] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [text, setText] = useState('');
    const [charCount, setCharCount] = React.useState(0);
    const [input, setInput] = React.useState("");
    const [sliderState, setSliderState] = React.useState<number>(0);

    console.log(input);


    {/* Gallery Permissions */}
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
    
    {/* Camera Permissions */}
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

    {/* Exit to Home */}
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
                            source={image ? { uri: '' } : { uri: '' }}
                            style={styles.profileImage}
                            />
                            <Ionicons
                                name="add-circle-outline" // Correct prop name
                                size={32}
                                color="black"
                                style={[
                                styles.cameraIcon,
                                { position: 'absolute', bottom: 0, right: 8 }]}
                            />
                    </View>
                                    
            </TouchableOpacity>
            <View style = {styles.container}>                        
            <Text style={styles.title}>
                How Would You Rate This Item? 
            </Text>
                
                <View style={styles.circleContainer}>
                    <CircularProgress
                        radius={50}
                        value={5}
                        maxValue={10}
                        valueSuffix='⭐'
                    />
                    <Text style={styles.valueText}></Text>
                </View>
            </View>

            <View style={styles.descriptionContainer}>
                {/* <Text style = {{
                    padding: 4,
                    fontSize: 12,
                    fontWeight: 'bold'
                    }}> */}
                <Text style = {styles.title}>
                Any adjustments to your order?
                </Text>
                    <TextInput 
                        placeholder='"E.g: I ordered my drink with 50% sweetness, 50% ice."'
                        style = {styles.textInput}
                        multiline = {true}
                        maxLength={250}
                        keyboardAppearance='dark'
                        onChangeText={(newText) => {
                            setText(newText);
                            setCharCount(newText.length);
                        }}
                        onSubmitEditing={() =>{
                            alert('Your message is: ${input}')
                            setInput("");
                        }}
                        // value={input} // will edit later
                        > 
                    </TextInput>
                    <Text style = {{textAlign: 'right'}}></Text> {/* will eventually be a character count*/}
            </View>
            <View style = {styles.sliderContainer}>
                <Text style = {styles.title}>
                Rate this!
                </Text>
                <Slider 
                    style={{width: '100%', height: 20}}
                    minimumValue = {0}
                    maximumValue = {5}
                    step = {.25}
                    minimumTrackTintColor = "#6c3b3bff"
                    maximumTrackTintColor = "#999999"
                    value = {sliderState}
                    onValueChange={(value) => setSliderState (value)}
                ></Slider>
                <Text style = {{ fontSize: 12, fontWeight: 'bold' }}> {sliderState} </Text>


                
            </View>
            {/* <View style = {styles.CircularProgressContainer}>
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
                
            </View>  */}
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

const styles = StyleSheet.create ({
    root: {
        flex: 1,
        // backgroundColor: theme.colors.background, // Use theme color for background
    },

    // Styles for the circular progress container
    CircularProgressContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: 8,
        justifyContent: 'flex-start',
        gap: 8,
        
    },

    circleContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    
    valueText: {
        position: 'absolute',
        fontSize: 24,
        fontWeight: 'bold',
        
    },

    imageContainer: {
        position: 'relative',
        width: 100,                             // Place in relation to image border
        height: 100,                            // Match image height
        margin: 16,
        // borderWidth: 1,
        // borderColor: 'black',
    },

    container: {
        flex: .5,
        fontSize: 8,
        justifyContent: 'flex-start',
        margin: 16,
        borderWidth: 1,
        borderColor: 'black',
    },

    descriptionContainer: {
        flex: .5,
        fontSize: 8,
        justifyContent: 'flex-start',
        padding: 8,
        borderWidth: 1,
        borderColor: 'black',
    },

    sliderContainer: {
        width: '90%',
        // height: '10%',
        // flex: .5,
        alignSelf: 'center',
        fontSize: 8,
        justifyContent: 'flex-start',
        margin: 12,
        borderWidth: 1,
        borderColor: 'black',
    },


    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    title: {
        fontSize: 16,
        fontWeight: 'bold',
        margin: 8,
        color: 'black',
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
        marginBottom: 8,
    },

    modalText: {
        marginBottom: 16,
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
        marginHorizontal: 4,
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

    buttonNeutral:{
        backgroundColor: 'lightgray',
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

    textInput: {
        height: 100,
        margin: 0,
        borderWidth: 1,
        borderColor: 'black',
        paddingTop: 12,
        borderRadius: 10,
        textAlignVertical: 'top',
        
    },


});
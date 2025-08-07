import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView } from 'react-native';
import { useState, useLayoutEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import CircularProgress from 'react-native-circular-progress-indicator';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

export default function Upload() {
    const navigation = useNavigation();
    const router = useRouter();
    const [isModalVisible, setModalVisible] = useState(false);

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
            
            <View style = {styles.CircularProgressContainer}>
                <CircularProgress
                    radius = {50}
                    value = {0}
                    valueSuffix='⭐'
                    inActiveStrokeOpacity='.75'
                    padding = {10}
                />
                
                <CircularProgress
                    radius = {50}
                    value = {0}
                    valueSuffix='⭐'
                    inActiveStrokeOpacity='.75'
                    padding = {10}
                />
                <CircularProgress
                    radius = {50}
                    value = {10}
                    valueSuffix='⭐'
                    inActiveStrokeOpacity='.75'
                    padding = {10}
                />
                <CircularProgress
                    radius = {50}
                    value = {10}
                    valueSuffix='⭐'
                    inActiveStrokeOpacity='.75'
                    padding = {10}
                />
                
            </View>
            <View style={styles.content}>
                

                <Text>This is the editing screen.</Text>
            </View>

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
        margin: 11,
        // alignContent: 'space-evenly',
        justifyContent: 'flex-start',
        gap: 5,
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
    },

    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
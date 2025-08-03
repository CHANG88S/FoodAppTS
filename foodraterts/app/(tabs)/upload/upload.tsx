import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Upload() {
    const router = useRouter();
    const [isModalVisible, setModalVisible] = useState(false);

    const handleLeave = () => {
        setModalVisible(false); // First, close the modal
        router.back();          // Then, navigate back to the previous screen
    };

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text>This is the editing screen.</Text>
                {/* Your editing content would go here */}
            </View>

            <Modal
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
                animationType="fade"
                transparent={true}
            >
                <View style={styles.modalCenteredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Discard changes?</Text>
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
                                <Text style={styles.textStyle}>Continue editing</Text>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        padding: 15,
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
        backgroundColor: '#2196F3',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
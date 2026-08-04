import React, { useState } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

interface ImageUploaderProps {
    restaurantId: Id<"restaurants">;
}

export default function ImageUploader({ restaurantId }: ImageUploaderProps) {
    const generateUploadUrl = useMutation(api.images.generateUploadUrl);
    const savePhoto = useMutation(api.images.saveRestaurantPhoto);
    const [uploading, setUploading] = useState(false);

    const handlePickAndUpload = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (result.canceled || !result.assets[0].uri) return;

        const asset = result.assets[0];

        try {
            setUploading(true);

            // Step A: Get upload URL from Convex
            const uploadUrl = await generateUploadUrl();

            // Step B: Fetch local file uri as blob for React Native upload
            const response = await fetch(asset.uri);
            const blob = await response.blob();

            // Step C: Post binary file to Convex File Storage
            const uploadResult = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": asset.mimeType || "image/jpeg" },
                body: blob,
            });

            const { storageId } = await uploadResult.json();

            // Step D: Save storage ID reference to database using "imageStorageId" to match schema argument
            await savePhoto({ restaurantId, imageStorageId: storageId });

            Alert.alert('Success', 'Photo uploaded successfully!');
        } catch (error: any) {
            console.error(error);
            Alert.alert('Upload Failed', error.message || 'Something went wrong.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <TouchableOpacity 
            style={[styles.button, uploading && styles.buttonDisabled]} 
            onPress={handlePickAndUpload}
            disabled={uploading}
        >
            <Text style={styles.buttonText}>
                {uploading ? 'Uploading...' : 'Upload Restaurant Photo'}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#6c3b3b',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
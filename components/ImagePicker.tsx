import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { pickImageFromGallery, takePhotoWithCamera } from '../services/ImagePickerService';

interface ImagePickerProps {
    label: string;
    onImageSelected: (uri: string) => void;
    initialImage?: string;
}

export default function CustomImagePicker({ label, onImageSelected, initialImage }: ImagePickerProps) {
    const [image, setImage] = useState<string | null>(initialImage || null);

    const handleImageSelection = async (method: 'camera' | 'gallery') => {
        const uri = method === 'camera'
            ? await takePhotoWithCamera()
            : await pickImageFromGallery();

        if (uri) {
            setImage(uri);
            onImageSelected(uri);
        }
    };

    const pickImage = () => {
        Alert.alert(
            'Select Image',
            'Choose an image source',
            [
                {
                    text: 'Camera',
                    onPress: () => handleImageSelection('camera'),
                },
                {
                    text: 'Gallery',
                    onPress: () => handleImageSelection('gallery'),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity onPress={pickImage} style={styles.picker} activeOpacity={0.8}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.image} />
                ) : (
                    <View style={styles.placeholder}>
                        <ImageIcon size={32} color="#94A3B8" />
                        <Text style={styles.placeholderText}>Tap to upload photo</Text>
                    </View>
                )}
                {image && (
                    <View style={styles.editOverlay}>
                        <Camera size={20} color="#FFF" />
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#475569',
        marginBottom: 8,
    },
    picker: {
        width: '100%',
        height: 200,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    placeholderText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '500',
    },
    editOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        borderRadius: 20,
    },
});

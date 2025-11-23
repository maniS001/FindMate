import { Image as ImageIcon, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { pickImageFromGallery, takePhotoWithCamera } from '../services/ImagePickerService';

interface ImagePickerProps {
    label: string;
    onImagesSelected: (uris: string[]) => void;
    initialImages?: string[];
}

export default function CustomImagePicker({ label, onImagesSelected, initialImages = [] }: ImagePickerProps) {
    const [images, setImages] = useState<string[]>(initialImages);

    const handleImageSelection = async (method: 'camera' | 'gallery', multiple: boolean = false) => {
        if (method === 'camera') {
            const uri = await takePhotoWithCamera();
            if (uri) {
                const newImages = [...images, uri];
                setImages(newImages);
                onImagesSelected(newImages);
            }
        } else {
            const uris = await pickImageFromGallery(multiple);
            if (uris.length > 0) {
                const newImages = [...images, ...uris];
                setImages(newImages);
                onImagesSelected(newImages);
            }
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        onImagesSelected(newImages);
    };

    const pickImage = () => {
        // On web, skip the alert and go directly to gallery
        if (Platform.OS === 'web') {
            handleImageSelection('gallery', true);
            return;
        }

        Alert.alert(
            'Select Image',
            'Choose an image source',
            [
                {
                    text: 'Camera',
                    onPress: () => handleImageSelection('camera'),
                },
                {
                    text: 'Select One (Crop)',
                    onPress: () => handleImageSelection('gallery', false),
                },
                {
                    text: 'Select Multiple',
                    onPress: () => handleImageSelection('gallery', true),
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

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {images.map((uri, index) => (
                    <View key={index} style={styles.imageContainer}>
                        <Image source={{ uri }} style={styles.image} />
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeImage(index)}
                            activeOpacity={0.8}
                        >
                            <X size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                ))}

                <TouchableOpacity onPress={pickImage} style={styles.addButton} activeOpacity={0.8}>
                    <ImageIcon size={32} color="#94A3B8" />
                    <Text style={styles.addButtonText}>{images.length > 0 ? 'Add More' : 'Upload Photos'}</Text>
                </TouchableOpacity>
            </ScrollView>
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
    scrollContent: {
        gap: 12,
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4,
        borderRadius: 12,
    },
    addButton: {
        width: 120,
        height: 120,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        gap: 8,
    },
    addButtonText: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '500',
    },
});

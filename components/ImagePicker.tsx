import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { pickImageFromGallery, takePhotoWithCamera } from '../services/ImagePickerService';

interface ImagePickerProps {
    label: string;
    onImagesSelected: (uris: string[]) => void;
    initialImages?: string[];
}

export default function CustomImagePicker({ label, onImagesSelected, initialImages = [] }: ImagePickerProps) {
    const { colors } = useTheme();
    const [images, setImages] = useState<string[]>(initialImages);
    const [modalVisible, setModalVisible] = useState(false);

    const handleImageSelection = async (method: 'camera' | 'gallery', multiple: boolean = false) => {
        if (images.length >= 3) {
            Alert.alert('Limit Reached', 'You can only upload up to 3 images.');
            return;
        }

        setModalVisible(false);
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
                // Calculate how many more images we can add
                const remainingSlots = 3 - images.length;
                const imagesToAdd = uris.slice(0, remainingSlots);

                if (uris.length > remainingSlots) {
                    Alert.alert('Limit Reached', `Only ${remainingSlots} more image(s) allowed. First ${remainingSlots} selected images were added.`);
                }

                const newImages = [...images, ...imagesToAdd];
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
        // On web, skip the modal and go directly to gallery
        if (Platform.OS === 'web') {
            handleImageSelection('gallery', true);
            return;
        }
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>

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

                {images.length < 3 && (
                    <TouchableOpacity
                        onPress={pickImage}
                        style={[styles.addButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        activeOpacity={0.8}
                    >
                        <ImageIcon size={32} color={colors.textSecondary} />
                        <Text style={[styles.addButtonText, { color: colors.textSecondary }]}>
                            {images.length > 0 ? 'Add More' : 'Upload Photos'}
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.textSecondary }}>(Max 3)</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Select Image Source</Text>

                        <TouchableOpacity
                            style={[styles.modalOption, { borderBottomColor: colors.border }]}
                            onPress={() => handleImageSelection('camera')}
                        >
                            <Camera size={24} color={colors.text} />
                            <Text style={[styles.modalOptionText, { color: colors.text }]}>Take Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalOption, { borderBottomColor: colors.border }]}
                            onPress={() => handleImageSelection('gallery', false)}
                        >
                            <ImageIcon size={24} color={colors.text} />
                            <Text style={[styles.modalOptionText, { color: colors.text }]}>Select One (Crop)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalOption, { borderBottomColor: colors.border }]}
                            onPress={() => handleImageSelection('gallery', true)}
                        >
                            <ImageIcon size={24} color={colors.text} />
                            <Text style={[styles.modalOptionText, { color: colors.text }]}>Select Multiple</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalCancel, { backgroundColor: colors.background }]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={[styles.modalCancelText, { color: colors.error || '#EF4444' }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
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
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        gap: 8,
    },
    addButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 24,
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        gap: 16,
    },
    modalOptionText: {
        fontSize: 16,
        fontWeight: '500',
    },
    modalCancel: {
        marginTop: 24,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '700',
    },
});

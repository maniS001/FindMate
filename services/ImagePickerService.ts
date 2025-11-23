import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export const pickImageFromGallery = async (allowsMultipleSelection: boolean = false): Promise<string[]> => {
    try {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
                return [];
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: Platform.OS === 'web' ? false : !allowsMultipleSelection, // Cropping is not supported when multiple selection is enabled, and not supported well on web
            aspect: [4, 3],
            quality: 1,
            allowsMultipleSelection,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            return result.assets.map(asset => asset.uri);
        }
    } catch (error) {
        console.error('Error picking image:', error);
        Alert.alert('Error', 'An error occurred while picking the image.');
    }
    return [];
};

export const takePhotoWithCamera = async (): Promise<string | null> => {
    try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
            return null;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            return result.assets[0].uri;
        }
    } catch (error) {
        console.error('Error taking photo:', error);
        Alert.alert('Error', 'An error occurred while taking the photo.');
    }
    return null;
};

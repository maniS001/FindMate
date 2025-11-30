import * as FileSystem from 'expo-file-system/legacy';
import * as Manipulator from 'expo-image-manipulator';

/**
 * Converts an image URI to a compressed base64 string
 * @param uri - The local file URI of the image
 * @returns Base64 encoded string with data URI prefix
 */
export const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
        // Compress and resize image to reduce payload size
        // Reverted to 400px/0.2 to avoid 413 Payload Too Large errors
        const manipulatedResult = await Manipulator.manipulateAsync(
            uri,
            [{ resize: { width: 400 } }], // Resize to max width 400px
            {
                compress: 0.2, // Compress to 20% quality
                format: Manipulator.SaveFormat.JPEG,
                base64: true
            }
        );

        if (manipulatedResult.base64) {
            return `data:image/jpeg;base64,${manipulatedResult.base64}`;
        }

        // Fallback if base64 is missing (shouldn't happen with base64: true)
        const base64 = await FileSystem.readAsStringAsync(manipulatedResult.uri, {
            encoding: 'base64',
        });
        return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
        console.error('Error converting image to base64:', error);
        throw error;
    }
};

/**
 * Converts multiple image URIs to base64 strings
 * @param uris - Array of local file URIs
 * @returns Array of base64 encoded strings
 */
export const convertImagesToBase64 = async (uris: string[]): Promise<string[]> => {
    try {
        const promises = uris.map(uri => convertImageToBase64(uri));
        return await Promise.all(promises);
    } catch (error) {
        console.error('Error converting images to base64:', error);
        throw error;
    }
};

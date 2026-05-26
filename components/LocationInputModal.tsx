import * as Location from 'expo-location';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface LocationInputModalProps {
    visible: boolean;
    onSave: (location: string | null) => void;
    onClose: () => void;
    onLocationDetected?: (locationData: { location: string; latitude: number; longitude: number }) => void;
}

export const LocationInputModal: React.FC<LocationInputModalProps> = ({
    visible,
    onSave,
    onClose,
    onLocationDetected,
}) => {
    const [location, setLocation] = useState('');
    const [isDetecting, setIsDetecting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSave = () => {
        onSave(location.trim() || null);
        setLocation(''); // Reset for next time
        setErrorMessage('');
    };

    const handleSkip = () => {
        onSave(null);
        setLocation('');
        setErrorMessage('');
    };

    const handleTurnOnLocation = async () => {
        setIsDetecting(true);
        setErrorMessage('');

        try {
            // Request permission again
            let { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setErrorMessage('Permission denied. Please use manual input or skip.');
                setIsDetecting(false);
                return;
            }

            // Get current position
            let position = await Location.getCurrentPositionAsync({});
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            // Try to get formatted address
            try {
                let reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude,
                    longitude
                });

                if (reverseGeocode.length > 0) {
                    const address = reverseGeocode[0];
                    const locationString = `${address.city || address.region || ''}, ${address.district || address.name || ''}`;

                    // Call the callback to update user info with coordinates
                    if (onLocationDetected) {
                        onLocationDetected({ location: locationString, latitude, longitude });
                    } else {
                        // Fallback to just saving the location string
                        onSave(locationString);
                        setLocation('');
                        setErrorMessage('');
                    }
                    setIsDetecting(false);
                    return;
                }
            } catch (geocodeError) {
                console.log('Reverse geocoding failed, using coordinates');
            }

            // Fallback: use coordinates as location string
            const locationString = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
            if (onLocationDetected) {
                onLocationDetected({ location: locationString, latitude, longitude });
            } else {
                onSave(locationString);
                setLocation('');
                setErrorMessage('');
            }
        } catch (error) {
            console.error('Error detecting location:', error);
            setErrorMessage('Failed to detect location. Please try again or use manual input.');
        }

        setIsDetecting(false);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleSkip}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.overlay}>
                    <View style={styles.container}>
                    <Text style={styles.title}>Location Required</Text>
                    <Text style={styles.subtitle}>
                        We couldn't detect your location automatically.
                        Please turn on location or enter your area manually.
                    </Text>

                    {errorMessage ? (
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    ) : null}

                    {/* Turn on Location Button */}
                    <TouchableOpacity
                        style={[styles.primaryButton, isDetecting && styles.disabledButton]}
                        onPress={handleTurnOnLocation}
                        disabled={isDetecting}
                    >
                        {isDetecting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.primaryButtonText}>📍 Turn on Location</Text>
                        )}
                    </TouchableOpacity>

                    {/* OR Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Manual Input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your City/Area manually"
                        value={location}
                        onChangeText={setLocation}
                        editable={!isDetecting}
                    />

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={handleSkip}
                            disabled={isDetecting}
                        >
                            <Text style={styles.skipButtonText}>Skip</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveButton, isDetecting && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={isDetecting}
                        >
                            <Text style={styles.saveButtonText}>Save Location</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1f2937',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    errorText: {
        fontSize: 13,
        color: '#dc2626',
        marginBottom: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    primaryButton: {
        width: '100%',
        padding: 14,
        borderRadius: 8,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        marginBottom: 16,
    },
    primaryButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.6,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        marginHorizontal: 12,
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#f9fafb',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    skipButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#4b5563',
        fontWeight: '600',
        fontSize: 16,
    },
    saveButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#2563eb',
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
});

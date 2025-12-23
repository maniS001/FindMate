import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface LocationInputModalProps {
    visible: boolean;
    onSave: (location: string | null) => void;
    onClose: () => void;
}

export const LocationInputModal: React.FC<LocationInputModalProps> = ({
    visible,
    onSave,
    onClose,
}) => {
    const [location, setLocation] = useState('');

    const handleSave = () => {
        onSave(location.trim() || null);
        setLocation(''); // Reset for next time
    };

    const handleSkip = () => {
        onSave(null);
        setLocation('');
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleSkip}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Enter Your Location</Text>
                    <Text style={styles.subtitle}>
                        We couldn't detect your location automatically.
                        Please enter your City or Area to receive local alerts.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Chennai, Anna Nagar"
                        value={location}
                        onChangeText={setLocation}
                        autoFocus
                    />

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                            <Text style={styles.skipButtonText}>Skip</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save Location</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
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

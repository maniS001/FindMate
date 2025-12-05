import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { useTheme } from '../contexts/ThemeContext';
import { updateItemStatus } from '../store';

export default function Success() {
    const router = useRouter();
    const { colors } = useTheme();
    const params = useLocalSearchParams<{
        type: string;
        message: string;
        contactInfo?: string;
        itemId?: string; // Added itemId to params
    }>();
    const [updating, setUpdating] = useState(false);

    const getTitle = () => {
        switch (params.type) {
            case 'complaint':
                return 'Complaint Filed Successfully!';
            case 'report':
                return 'Item Reported Successfully!';
            case 'payment':
                return 'Payment Successful!';
            case 'verification':
                return 'Identity Verified!';
            default:
                return 'Success!';
        }
    };

    const getMessage = () => {
        if (params.message) return params.message;

        switch (params.type) {
            case 'complaint':
                return 'Your complaint has been registered. We will notify you if someone reports finding a matching item.';
            case 'report':
                return 'Your found item has been posted. Victims can now search and claim it.';
            case 'payment':
                return 'You can now contact the founder to collect your item.';
            case 'verification':
                return 'Contact the founder to collect your item.';
            default:
                return 'Your request has been completed successfully.';
        }
    };

    const handleConfirmRecovery = async () => {
        if (!params.itemId) return;

        setUpdating(true);
        try {
            // Mark item as CLAIMED (or RESOLVED depending on logic, but CLAIMED fits 'got it')
            await updateItemStatus(params.itemId, 'CLAIMED');
            Alert.alert('Great!', 'We are happy you found your item. The item status has been updated.', [
                { text: 'OK', onPress: () => router.push('/') }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to update item status.');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <CheckCircle size={80} color={colors.success} strokeWidth={2} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
                <Text style={[styles.message, { color: colors.textSecondary }]}>{getMessage()}</Text>

                {params.contactInfo && (
                    <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Founder Contact:</Text>
                        <Text style={[styles.contactInfo, { color: colors.primary }]}>📞 {params.contactInfo}</Text>
                        <Button
                            title="Call Owner"
                            onPress={() => {
                                const phone = params.contactInfo?.replace(/[^0-9+]/g, '') || '';
                                Linking.openURL(`tel:${phone}`);
                            }}
                            style={{ marginTop: 16 }}
                        />
                    </View>
                )}

                {/* Recovery Confirmation Section */}
                {params.contactInfo && params.itemId && (
                    <View style={[styles.recoverySection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.recoveryTitle, { color: colors.text }]}>Did you recover your item?</Text>
                        <Text style={[styles.recoveryText, { color: colors.textSecondary }]}>
                            If you have successfully collected your item from the founder, please let us know.
                        </Text>
                        <Button
                            title="Yes, I got it!"
                            onPress={handleConfirmRecovery}
                            loading={updating}
                            style={{ marginTop: 12, backgroundColor: '#10B981' }}
                        />
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    <Button
                        title="Go to Home"
                        onPress={() => router.push('/')}
                        style={{ marginBottom: 12 }}
                        variant="outline"
                    />
                    <Button
                        title="Go Back"
                        onPress={() => router.back()}
                        variant="secondary"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        maxWidth: 400,
    },
    contactCard: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
        width: '100%',
        maxWidth: 400,
    },
    contactLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    contactInfo: {
        fontSize: 20,
        fontWeight: '600',
    },
    recoverySection: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    recoveryTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    recoveryText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 400,
    },
});

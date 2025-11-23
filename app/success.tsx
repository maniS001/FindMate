import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';

export default function Success() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        type: string;
        message: string;
        contactInfo?: string;
    }>();

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

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <CheckCircle size={80} color="#10B981" strokeWidth={2} />
                </View>

                <Text style={styles.title}>{getTitle()}</Text>
                <Text style={styles.message}>{getMessage()}</Text>

                {params.contactInfo && (
                    <View style={styles.contactCard}>
                        <Text style={styles.contactLabel}>Founder Contact:</Text>
                        <Text style={styles.contactInfo}>📞 {params.contactInfo}</Text>
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    <Button
                        title="Go to Home"
                        onPress={() => router.push('/')}
                        style={{ marginBottom: 12 }}
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
        backgroundColor: '#F8FAFC',
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
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 16,
    },
    message: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        maxWidth: 400,
    },
    contactCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 32,
        width: '100%',
        maxWidth: 400,
    },
    contactLabel: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 8,
    },
    contactInfo: {
        fontSize: 20,
        fontWeight: '600',
        color: '#3B82F6',
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 400,
    },
});

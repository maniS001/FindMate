import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, Calendar, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Button';
import CustomImagePicker from '../../../components/ImagePicker';
import Input from '../../../components/Input';
import { getItemById } from '../../../store';

export default function ClaimItem() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const item = getItemById(id);

    const [answer, setAnswer] = useState('');
    const [proofImage, setProofImage] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(false);

    if (!item) {
        return (
            <View style={styles.center}>
                <Text>Item not found</Text>
            </View>
        );
    }

    const handleVerify = () => {
        if (answer.toLowerCase().trim() === item.secretAnswer.toLowerCase().trim()) {
            setIsVerified(true);
            Alert.alert('Success', 'Identity Verified! You can now contact the founder.');
        } else {
            Alert.alert('Incorrect Answer', 'That is not the correct answer. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.itemName}>{item.name}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.row}>
                            <MapPin size={16} color="#64748B" />
                            <Text style={styles.metaText}>{item.location}</Text>
                        </View>
                        <View style={styles.row}>
                            <Calendar size={16} color="#64748B" />
                            <Text style={styles.metaText}>{item.date}</Text>
                        </View>
                    </View>

                    <Text style={styles.description}>{item.description}</Text>
                </View>

                {!isVerified ? (
                    <View style={styles.verificationSection}>
                        <View style={styles.warningBox}>
                            <AlertCircle size={24} color="#B45309" />
                            <Text style={styles.warningText}>
                                To prevent fraud, you must answer the security question set by the founder to reveal their contact info.
                            </Text>
                        </View>

                        <CustomImagePicker
                            label="Upload Proof (Optional)"
                            onImageSelected={setProofImage}
                        />

                        <Text style={styles.questionLabel}>Security Question:</Text>
                        <Text style={styles.question}>{item.secretQuestion}</Text>

                        <Input
                            label="Your Answer"
                            placeholder="Type your answer here..."
                            value={answer}
                            onChangeText={setAnswer}
                            style={{ marginTop: 16 }}
                        />

                        <Button
                            title="Verify & Claim"
                            onPress={handleVerify}
                            style={{ marginTop: 24 }}
                        />
                    </View>
                ) : (
                    <View style={styles.successSection}>
                        <View style={styles.successBox}>
                            <Text style={styles.successTitle}>Contact Information</Text>
                            <Text style={styles.contactInfo}>{item.contactInfo}</Text>
                            <Text style={styles.successDesc}>
                                Please contact the founder to arrange a meetup.
                            </Text>
                        </View>

                        <Button
                            title="Back to Home"
                            variant="secondary"
                            onPress={() => router.dismissAll()}
                            style={{ marginTop: 24 }}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 24,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    itemName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        color: '#64748B',
        fontSize: 14,
    },
    description: {
        fontSize: 16,
        color: '#475569',
        lineHeight: 24,
    },
    verificationSection: {
        gap: 8,
    },
    warningBox: {
        backgroundColor: '#FFFBEB',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    warningText: {
        flex: 1,
        color: '#92400E',
        fontSize: 14,
        lineHeight: 20,
    },
    questionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    question: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    successSection: {
        gap: 16,
    },
    successBox: {
        backgroundColor: '#ECFDF5',
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    successTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#047857',
        marginBottom: 8,
    },
    contactInfo: {
        fontSize: 24,
        fontWeight: '700',
        color: '#065F46',
        marginBottom: 8,
    },
    successDesc: {
        fontSize: 14,
        color: '#064E3B',
        textAlign: 'center',
    },
});

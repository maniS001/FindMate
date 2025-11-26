import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, Calendar, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Button';
import Captcha from '../../../components/Captcha';
import CustomImagePicker from '../../../components/ImagePicker';
import Input from '../../../components/Input';
import OtpModal from '../../../components/OtpModal';
import PaymentModal from '../../../components/PaymentModal';
import { CONFIG } from '../../../constants/config';
import { useTheme } from '../../../contexts/ThemeContext';
import { getItemById, Item } from '../../../store';

export default function ClaimItem() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors } = useTheme();
    const router = useRouter();
    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItem = async () => {
            if (id) {
                const fetchedItem = await getItemById(id);
                setItem(fetchedItem);
            }
            setLoading(false);
        };
        fetchItem();
    }, [id]);

    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [proofImages, setProofImages] = useState<string[]>([]);
    const [isVerified, setIsVerified] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isPaid, setIsPaid] = useState(false);

    const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Loading...</Text>
            </View>
        );
    }

    if (!item) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Item not found</Text>
            </View>
        );
    }

    const handleCaptchaVerify = (isValid: boolean) => {
        setIsCaptchaVerified(isValid);
        if (isValid && !isOtpVerified) {
            setTimeout(() => setShowOtpModal(true), 500);
        }
    };

    const handleOtpVerified = () => {
        setIsOtpVerified(true);
        setShowOtpModal(false);
    };

    const handleVerify = () => {
        const allCorrect = item.questions.every((q, index) => {
            const userAnswer = answers[index] || '';
            return userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
        });

        if (allCorrect) {
            setIsVerified(true);
            if (CONFIG.ENABLE_PAYMENT) {
                setShowPaymentModal(true);
            } else {
                setIsPaid(true);
                router.push({
                    pathname: '/success',
                    params: {
                        type: 'verification',
                        contactInfo: item.contactInfo
                    }
                });
            }
        } else {
            Alert.alert('❌ Incorrect Answer', 'One or more answers are incorrect. Please try again.');
        }
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setIsPaid(true);
        router.push({
            pathname: '/success',
            params: {
                type: 'payment',
                contactInfo: item.contactInfo
            }
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <PaymentModal
                visible={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
            />

            <OtpModal
                visible={showOtpModal}
                onClose={() => setShowOtpModal(false)}
                onVerified={handleOtpVerified}
            />

            <KeyboardAvoidingView
                behavior="padding"
                style={{ flex: 1 }}
                keyboardVerticalOffset={!isOtpVerified ? 100 : 0}
                enabled
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>

                        <View style={styles.metaRow}>
                            <View style={styles.row}>
                                <MapPin size={16} color={colors.textSecondary} />
                                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.location}</Text>
                            </View>
                            <View style={styles.row}>
                                <Calendar size={16} color={colors.textSecondary} />
                                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.date}</Text>
                            </View>
                        </View>

                        <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
                    </View>

                    {!isOtpVerified ? (
                        <View style={styles.verificationSection}>
                            <View style={styles.warningBox}>
                                <AlertCircle size={24} color="#B45309" />
                                <Text style={styles.warningText}>
                                    Complete the security check to proceed with claiming this item.
                                </Text>
                            </View>
                            <Captcha onVerify={handleCaptchaVerify} />
                        </View>
                    ) : !isPaid ? (
                        <View style={styles.verificationSection}>
                            <View style={styles.warningBox}>
                                <AlertCircle size={24} color="#B45309" />
                                <Text style={styles.warningText}>
                                    To prevent fraud, you must answer the security questions set by the founder to reveal their contact info.
                                </Text>
                            </View>

                            <CustomImagePicker
                                label="Upload Proof (Optional)"
                                onImagesSelected={setProofImages}
                                initialImages={proofImages}
                            />

                            {item.questions.map((q, index) => (
                                <View key={index} style={{ marginTop: 16 }}>
                                    <Text style={[styles.questionLabel, { color: colors.textSecondary }]}>Question {index + 1}:</Text>
                                    <Text style={[styles.question, { color: colors.text }]}>{q.question}</Text>

                                    <Input
                                        label="Your Answer"
                                        placeholder="Type your answer here..."
                                        value={answers[index] || ''}
                                        onChangeText={(text) => setAnswers({ ...answers, [index]: text })}
                                    />
                                </View>
                            ))}

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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    card: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
    },
    itemName: {
        fontSize: 24,
        fontWeight: '700',
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
        fontSize: 14,
    },
    description: {
        fontSize: 16,
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
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    question: {
        fontSize: 20,
        fontWeight: '700',
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

import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Captcha from '../../components/Captcha';
import Input from '../../components/Input';
import OtpModal from '../../components/OtpModal';
import PaymentModal from '../../components/PaymentModal';
import { CONFIG } from '../../constants/config';
import { useTheme } from '../../contexts/ThemeContext';
import { updateComplaintStatus } from '../../store';

export default function VerifyNotificationScreen() {
    const { payload, notificationId } = useLocalSearchParams<{ payload: string; notificationId: string }>();
    const router = useRouter();
    const { colors } = useTheme();

    // State for Verification Flow
    const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isPaid, setIsPaid] = useState(false);

    // State for Security Questions
    const [loading, setLoading] = useState(false);
    const [answers, setAnswers] = useState<string[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);

    let data: any = {};
    try {
        data = payload ? JSON.parse(payload) : {};
    } catch (e) {
        console.error('Error parsing payload', e);
    }

    const { questions = [], founderPhone, complaintId, description } = data;

    // --- Step 1: Captcha ---
    const handleCaptchaVerify = (isValid: boolean) => {
        setIsCaptchaVerified(isValid);
        if (isValid && !isOtpVerified) {
            setTimeout(() => setShowOtpModal(true), 500);
        }
    };

    // --- Step 2: OTP ---
    const handleOtpVerified = () => {
        setIsOtpVerified(true);
        setShowOtpModal(false);
        // Step 3: Trigger Payment if enabled, else go to Questions
        if (CONFIG.ENABLE_PAYMENT) {
            setShowPaymentModal(true);
        } else {
            setIsPaid(true);
        }
    };

    // --- Step 3: Payment ---
    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setIsPaid(true);
    };

    // --- Step 4: Security Questions ---
    const handleAnswerChange = (text: string, index: number) => {
        const newAnswers = [...answers];
        newAnswers[index] = text;
        setAnswers(newAnswers);
    };

    const handleVerifyAnswers = async () => {
        setLoading(true);
        // Simulate network delay
        setTimeout(async () => {
            const isCorrect = questions.every((q: any, index: number) => {
                const userAnswer = answers[index] || '';
                return userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
            });

            if (isCorrect) {
                // Auto-close the complaint if it's correct
                if (complaintId) {
                    try {
                        await updateComplaintStatus(complaintId, 'CLOSED', 'Founder contacted via Notification');
                    } catch (error) {
                        console.error('Failed to auto-close complaint', error);
                    }
                }
                setShowSuccess(true);
            } else {
                Alert.alert('Verification Failed', 'One or more answers are incorrect. Please try again.');
            }
            setLoading(false);
        }, 1000);
    };

    // Render Success Screen
    if (showSuccess) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.center}>
                    <View style={[styles.successCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.successTitle, { color: colors.primary }]}>Matched!</Text>
                        <Text style={[styles.successDesc, { color: colors.textSecondary }]}>
                            Your answers matched the security questions set by the founder.
                        </Text>

                        <View style={styles.contactBox}>
                            <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Founder's Contact:</Text>
                            <Text style={[styles.contactValue, { color: colors.text }]}>{founderPhone}</Text>
                        </View>

                        <Text style={[styles.note, { color: colors.textSecondary }]}>
                            Please contact the founder to arrange the return.
                            Your complaint has been marked as resolved.
                        </Text>

                        <Button
                            title="Go to Home"
                            onPress={() => router.replace('/')}
                            style={{ width: '100%', marginTop: 24 }}
                        />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={[styles.title, { color: colors.text }]}>Security Check</Text>

                    {!isOtpVerified || !isPaid ? (
                        <View style={styles.section}>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                Complete the steps below to verify your identity before answering the founder's questions.
                            </Text>

                            <View style={styles.warningBox}>
                                <AlertCircle size={24} color="#B45309" />
                                <Text style={styles.warningText}>
                                    Verification required to prevent fraud and ensure you are a genuine claimant.
                                </Text>
                            </View>

                            <Captcha onVerify={handleCaptchaVerify} />
                        </View>
                    ) : (
                        <View style={styles.section}>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                The founder has set security questions. Answer them to reveal the contact info.
                            </Text>

                            {description && (
                                <View style={[styles.messageBox, { backgroundColor: colors.surface }]}>
                                    <Text style={[styles.messageLabel, { color: colors.text }]}>Message from Founder:</Text>
                                    <Text style={[styles.messageText, { color: colors.textSecondary }]}>{description}</Text>
                                </View>
                            )}

                            <View style={styles.form}>
                                {questions.map((q: any, index: number) => (
                                    <View key={index} style={styles.questionContainer}>
                                        <Text style={[styles.questionText, { color: colors.text }]}>
                                            {index + 1}. {q.question}
                                        </Text>
                                        <Input
                                            label={`Answer ${index + 1}`}
                                            placeholder="Your Answer"
                                            value={answers[index] || ''}
                                            onChangeText={(text) => handleAnswerChange(text, index)}
                                        />
                                    </View>
                                ))}
                            </View>

                            <Button
                                title="Verify & Reveal Contact"
                                onPress={handleVerifyAnswers}
                                loading={loading}
                                disabled={loading || questions.length === 0}
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
    content: {
        padding: 24,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 24,
    },
    section: {
        gap: 16,
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
    messageBox: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    messageLabel: {
        fontWeight: '600',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    form: {
        gap: 24,
        marginBottom: 32,
    },
    questionContainer: {
        gap: 12,
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
    },
    successCard: {
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        width: '100%',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    successTitle: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 16,
    },
    successDesc: {
        textAlign: 'center',
        marginBottom: 24,
        fontSize: 16,
    },
    contactBox: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
    },
    contactLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    contactValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    note: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
    },
});

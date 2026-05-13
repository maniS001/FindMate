import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, Calendar, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Button';
import Captcha from '../../../components/Captcha';
import Card from '../../../components/Card';
import CustomImagePicker from '../../../components/ImagePicker';
import Input from '../../../components/Input';
import OtpModal from '../../../components/OtpModal';
import PaymentModal from '../../../components/PaymentModal';
import { CONFIG } from '../../../constants/config';
import { useTheme } from '../../../contexts/ThemeContext';
import { getItemById, Item } from '../../../store';
import { showAlert } from '../../../utils/alert';

export default function ClaimItem() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors } = useTheme();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const IMAGE_WIDTH = Math.min(width - 80, 800);
    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);

    // Flow State
    const [isClaiming, setIsClaiming] = useState(false);

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
    const [verifiedPhone, setVerifiedPhone] = useState('');
    const [showOtpModal, setShowOtpModal] = useState(false);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.center}>
                    <Text style={{ color: colors.text }}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!item) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.center}>
                    <Text style={{ color: colors.text }}>Item not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleCaptchaVerify = (isValid: boolean) => {
        setIsCaptchaVerified(isValid);
        if (isValid && !isOtpVerified) {
            setTimeout(() => setShowOtpModal(true), 500);
        }
    };

    const handleOtpVerified = (phone: string) => {
        setIsOtpVerified(true);
        setVerifiedPhone(phone);
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
                handlePaymentSuccess();
            }
        } else {
            showAlert('❌ Incorrect Answer', 'One or more answers are incorrect. Please try again.');
        }
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setIsPaid(true);

        // Navigate to success page with contact info
        router.push({
            pathname: '/success',
            params: {
                type: 'payment',
                contactInfo: item?.contactInfo,
                itemId: item?.id // Pass item ID for status update
            }
        });
    };

    // Parse images safely
    let images: string[] = [];
    if (item.imageUris && Array.isArray(item.imageUris)) {
        images = item.imageUris;
    } else if (typeof item.imageUris === 'string') {
        try {
            // @ts-ignore
            if (item.imageUris.startsWith('[')) {
                // @ts-ignore
                const parsed = JSON.parse(item.imageUris);
                if (Array.isArray(parsed)) images = parsed;
            } else {
                // @ts-ignore
                images = [item.imageUris];
            }
        } catch (e) {
            // @ts-ignore
            images = [item.imageUris];
        }
    }

    if (images.length === 0 && item.imageUri) {
        images = [item.imageUri];
    }

    // View 1: Item Details (Before Claiming)
    if (!isClaiming) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Card>
                        {images.length > 0 && (
                            <View style={styles.imageContainer}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.imageScrollContent}
                                    snapToInterval={IMAGE_WIDTH}
                                    decelerationRate="fast"
                                    pagingEnabled={false}
                                >
                                    {images.map((uri: string, index: number) => (
                                        <Image
                                            key={index}
                                            source={{ uri }}
                                            style={[styles.scrollImage, { width: IMAGE_WIDTH }]}
                                            resizeMode="contain"
                                        />
                                    ))}
                                </ScrollView>
                                {images.length > 1 && (
                                    <View style={styles.pagination}>
                                        <Text style={styles.paginationText}>
                                            Swipe to see more photos ({images.length})
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.header}>
                            <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Found Item</Text>
                            </View>
                        </View>

                        {item.category && (
                            <View style={styles.categoryContainer}>
                                <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>Category:</Text>
                                <Text style={[styles.categoryValue, { color: colors.text }]}>{item.category}</Text>
                            </View>
                        )}

                        <View style={styles.section}>
                            <View style={styles.infoRow}>
                                <MapPin size={20} color={colors.primary} />
                                <View style={styles.infoContent}>
                                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Location</Text>
                                    <Text style={[styles.infoValue, { color: colors.text }]}>{item.location}</Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <Calendar size={20} color={colors.primary} />
                                <View style={styles.infoContent}>
                                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Date Found</Text>
                                    <Text style={[styles.infoValue, { color: colors.text }]}>{item.date}</Text>
                                </View>
                            </View>
                        </View>

                        {item.description && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                                <Text style={[styles.description, { color: colors.textSecondary }]}>
                                    {item.description}
                                </Text>
                            </View>
                        )}
                    </Card>

                    <Button
                        title="CLAIM THIS ITEM"
                        onPress={() => setIsClaiming(true)}
                        style={{ marginTop: 24 }}
                    />
                </ScrollView>
            </SafeAreaView>
        );
    }

    // View 2: Claim Verification Flow
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
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={!isOtpVerified ? 100 : 0}
                enabled
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.headerRow, { marginBottom: 24 }]}>
                        <Text style={[styles.pageTitle, { color: colors.text }]}>Claim Verification</Text>
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
                    ) : (
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
    imageContainer: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        alignItems: 'center', // Centers the 800px container if the card is wider
    },
    imageScrollContent: {
        gap: 0,
    },
    scrollImage: {
        aspectRatio: 4 / 3,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    pagination: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    paginationText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    itemName: {
        fontSize: 28,
        fontWeight: '700',
        flex: 1,
    },
    badge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    categoryContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    categoryValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
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
});

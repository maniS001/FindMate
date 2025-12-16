import { Check, CreditCard, Smartphone, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CONFIG } from '../constants/config';
import { useTheme } from '../contexts/ThemeContext';
import { showAlert } from '../utils/alert';
import Button from './Button';

interface PaymentModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type PaymentMethod = 'PHONEPE' | 'GPAY' | 'PAYTM';

export default function PaymentModal({ visible, onClose, onSuccess }: PaymentModalProps) {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [showSandbox, setShowSandbox] = useState(false);

    const handlePayment = async () => {
        if (!selectedMethod) {
            showAlert('Select Payment Method', 'Please select a UPI app to proceed.');
            return;
        }

        setLoading(true);

        if (CONFIG.PAYMENT_MODE === 'SANDBOX') {
            // Simulate delay then show sandbox options
            setTimeout(() => {
                setLoading(false);
                setShowSandbox(true);
            }, 1000);
        } else {
            // Real UPI Intent Flow
            try {
                const upiUrl = `upi://pay?pa=${CONFIG.MERCHANT_VPA}&pn=${encodeURIComponent(CONFIG.MERCHANT_NAME)}&am=${CONFIG.PROCESSING_FEE}&cu=INR`;

                const supported = await Linking.canOpenURL(upiUrl);
                if (supported) {
                    await Linking.openURL(upiUrl);
                    // In a real app, you'd need to verify the transaction status from backend
                    // after returning from the UPI app.
                    // For now, we'll just simulate success after a delay if they return
                    setTimeout(() => {
                        setLoading(false);
                        showAlert('Payment Status', 'Did you complete the payment?', [
                            { text: 'No', style: 'cancel' },
                            { text: 'Yes', onPress: onSuccess }
                        ]);
                    }, 2000);
                } else {
                    showAlert('Error', 'UPI app not found');
                    setLoading(false);
                }
            } catch (error) {
                showAlert('Error', 'Failed to open payment app');
                setLoading(false);
            }
        }
    };

    const handleSandboxResult = (success: boolean) => {
        setShowSandbox(false);
        if (success) {
            showAlert('Sandbox Success', 'Payment simulated successfully!', [
                { text: 'OK', onPress: onSuccess }
            ]);
        } else {
            showAlert('Sandbox Failed', 'Payment simulation failed.');
        }
    };

    const renderPaymentOption = (id: PaymentMethod, name: string, icon: any) => (
        <TouchableOpacity
            style={[
                styles.option,
                {
                    borderColor: selectedMethod === id ? colors.primary : colors.border,
                    backgroundColor: selectedMethod === id ? colors.primary + '10' : colors.surface
                }
            ]}
            onPress={() => setSelectedMethod(id)}
            activeOpacity={0.7}
        >
            <View style={styles.optionContent}>
                <View style={[styles.optionIcon, { backgroundColor: colors.background }]}>
                    {icon}
                </View>
                <Text style={[styles.optionText, { color: colors.text }]}>{name}</Text>
            </View>
            {selectedMethod === id && (
                <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
                    <Check size={12} color="#FFF" />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: colors.surface }]}>
                    {!showSandbox ? (
                        <>
                            <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
                                <CreditCard size={32} color={colors.primary} />
                            </View>
                            <Text style={[styles.title, { color: colors.text }]}>Processing Fee</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                Pay ₹{CONFIG.PROCESSING_FEE} to reveal contact info
                            </Text>

                            <View style={styles.optionsContainer}>
                                {renderPaymentOption('PHONEPE', 'PhonePe', <Smartphone size={20} color="#5f259f" />)}
                                {renderPaymentOption('GPAY', 'Google Pay', <Wallet size={20} color="#4285F4" />)}
                                {renderPaymentOption('PAYTM', 'Paytm', <Text style={{ color: '#00b9f1', fontWeight: 'bold' }}>Pay</Text>)}
                            </View>

                            <View style={styles.actions}>
                                <Button
                                    title="Cancel"
                                    variant="secondary"
                                    onPress={onClose}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    title={`Pay ₹${CONFIG.PROCESSING_FEE}`}
                                    onPress={handlePayment}
                                    loading={loading}
                                    disabled={!selectedMethod}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </>
                    ) : (
                        // Sandbox Simulator UI
                        <View style={styles.sandboxContainer}>
                            <Text style={[styles.sandboxTitle, { color: colors.text }]}>Sandbox Simulator</Text>
                            <Text style={[styles.sandboxText, { color: colors.textSecondary }]}>
                                You are in development mode. Choose a result to simulate:
                            </Text>

                            <Button
                                title="Simulate Success"
                                onPress={() => handleSandboxResult(true)}
                                style={{ width: '100%', marginBottom: 12, backgroundColor: '#10B981' }}
                            />
                            <Button
                                title="Simulate Failure"
                                onPress={() => handleSandboxResult(false)}
                                style={{ width: '100%', backgroundColor: '#EF4444' }}
                            />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modal: {
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    headerIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 24,
        textAlign: 'center',
    },
    optionsContainer: {
        width: '100%',
        gap: 12,
        marginBottom: 24,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
    },
    checkIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    sandboxContainer: {
        width: '100%',
        alignItems: 'center',
    },
    sandboxTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
    },
    sandboxText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
});

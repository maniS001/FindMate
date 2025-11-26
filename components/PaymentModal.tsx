import { CreditCard } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';
import { CONFIG } from '../constants/config';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';

interface PaymentModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PaymentModal({ visible, onClose, onSuccess }: PaymentModalProps) {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(false);

    const handlePayment = () => {
        setLoading(true);
        // Simulate payment processing
        setTimeout(() => {
            setLoading(false);
            Alert.alert('Success', 'Payment processed successfully!', [
                { text: 'OK', onPress: onSuccess }
            ]);
        }, 2000);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: colors.surface }]}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                        <CreditCard size={48} color={colors.text} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Processing Fee Required</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        To reveal the contact information, a small processing fee is required.
                    </Text>

                    <View style={[styles.amountBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Total Amount</Text>
                        <Text style={[styles.amount, { color: colors.text }]}>₹{CONFIG.PROCESSING_FEE}</Text>
                    </View>

                    <View style={styles.actions}>
                        <Button
                            title="Cancel"
                            variant="secondary"
                            onPress={onClose}
                            style={{ flex: 1 }}
                        />
                        <Button
                            title="Pay Now"
                            onPress={handlePayment}
                            loading={loading}
                            style={{ flex: 1 }}
                        />
                    </View>
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
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    amountBox: {
        width: '100%',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
    },
    amountLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    amount: {
        fontSize: 24,
        fontWeight: '700',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
});

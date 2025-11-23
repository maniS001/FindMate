import { CreditCard } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';
import { CONFIG } from '../constants/config';
import Button from './Button';

interface PaymentModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PaymentModal({ visible, onClose, onSuccess }: PaymentModalProps) {
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
                <View style={styles.modal}>
                    <View style={styles.iconContainer}>
                        <CreditCard size={48} color="#0F172A" />
                    </View>
                    <Text style={styles.title}>Processing Fee Required</Text>
                    <Text style={styles.subtitle}>
                        To reveal the contact information, a small processing fee is required.
                    </Text>

                    <View style={styles.amountBox}>
                        <Text style={styles.amountLabel}>Total Amount</Text>
                        <Text style={styles.amount}>₹{CONFIG.PROCESSING_FEE}</Text>
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
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    amountBox: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    amountLabel: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    amount: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
});

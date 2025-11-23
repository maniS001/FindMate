import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import Input from './Input';

interface OtpModalProps {
    visible: boolean;
    onClose: () => void;
    onVerified: () => void;
}

export default function OtpModal({ visible, onClose, onVerified }: OtpModalProps) {
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = () => {
        if (phone.length < 10) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep('otp');
            Alert.alert('OTP Sent', 'Use 123456 as OTP');
        }, 1500);
    };

    const handleVerifyOtp = () => {
        if (otp !== '123456') {
            Alert.alert('Error', 'Invalid OTP');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            onVerified();
            setStep('phone');
            setPhone('');
            setOtp('');
        }, 1000);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>
                        {step === 'phone' ? 'Phone Verification' : 'Enter OTP'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 'phone'
                            ? 'We need to verify your phone number before you can report an item.'
                            : `Enter the code sent to ${phone}`}
                    </Text>

                    {step === 'phone' ? (
                        <Input
                            label="Phone Number"
                            placeholder="e.g. 9876543210"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />
                    ) : (
                        <Input
                            label="OTP Code"
                            placeholder="123456"
                            keyboardType="number-pad"
                            value={otp}
                            onChangeText={setOtp}
                        />
                    )}

                    <View style={styles.actions}>
                        <Button
                            title="Cancel"
                            variant="secondary"
                            onPress={onClose}
                            style={{ flex: 1 }}
                        />
                        <Button
                            title={step === 'phone' ? 'Send OTP' : 'Verify'}
                            onPress={step === 'phone' ? handleSendOtp : handleVerifyOtp}
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
        gap: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 8,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
});

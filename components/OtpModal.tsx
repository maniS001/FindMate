import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';
import Input from './Input';

import { API_URL } from '../constants/api';

interface OtpModalProps {
    visible: boolean;
    onClose: () => void;
    onVerified: () => void;
}

export default function OtpModal({ visible, onClose, onVerified }: OtpModalProps) {
    const { colors } = useTheme();
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendOtp = async () => {
        if (phone.length < 10) {
            setMessage('Please enter a valid phone number');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to send OTP');

            setStep('otp');
            setTimer(60);

            // Show OTP message
            setTimeout(() => {
                if (data.debugCode) {
                    setMessage(`OTP Sent! Code: ${data.debugCode}`);
                } else {
                    setMessage('OTP sent to your phone.');
                }
            }, 100);
        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to resend OTP');

            setTimer(60);

            if (data.debugCode) {
                setMessage(`OTP Resent! Code: ${data.debugCode}`);
            } else {
                setMessage('New OTP sent to your phone.');
            }
        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            setMessage('Please enter a valid 6-digit OTP');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code: otp }),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Invalid OTP');

            onVerified();
            handleClose();
        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep('phone');
        setPhone('');
        setOtp('');
        setTimer(0);
        setMessage(null);
        onClose();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {step === 'phone' ? 'Phone Verification' : 'Enter OTP'}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {step === 'phone'
                            ? 'We need to verify your phone number before you can report an item.'
                            : `Enter the code sent to ${phone}`}
                    </Text>

                    {message && (
                        <View style={{ padding: 8, backgroundColor: colors.primary + '10', borderRadius: 8, marginBottom: 8 }}>
                            <Text style={{ color: colors.primary, textAlign: 'center' }}>{message}</Text>
                        </View>
                    )}

                    {step === 'phone' ? (
                        <Input
                            label="Phone Number"
                            placeholder="e.g. 9876543210"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />
                    ) : (
                        <View>
                            <Input
                                label="OTP Code"
                                placeholder="Enter 6-digit code"
                                keyboardType="number-pad"
                                value={otp}
                                onChangeText={setOtp}
                                maxLength={6}
                            />
                            <View style={styles.resendContainer}>
                                {timer > 0 ? (
                                    <Text style={[styles.timerText, { color: colors.textSecondary }]}>
                                        Resend code in {formatTime(timer)}
                                    </Text>
                                ) : (
                                    <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                                        <Text style={[styles.resendText, { color: colors.primary }]}>
                                            Resend OTP
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                    <View style={styles.actions}>
                        <Button
                            title="Cancel"
                            variant="secondary"
                            onPress={handleClose}
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
        borderRadius: 24,
        padding: 24,
        gap: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    resendContainer: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 8,
    },
    timerText: {
        fontSize: 14,
    },
    resendText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

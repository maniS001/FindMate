import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../constants/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';
import Input from './Input';

interface OtpModalProps {
    visible: boolean;
    onClose: () => void;
    onVerified: (phone: string) => void; // Now returns the verified phone number
}

export default function OtpModal({ visible, onClose, onVerified }: OtpModalProps) {
    const { colors } = useTheme();
    const { token } = useAuth();
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);
    // Firebase confirmation result (used to verify OTP)
    const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const showMessage = (msg: string, error = false) => {
        setMessage(msg);
        setIsError(error);
    };

    // Step 1: Send OTP via Firebase
    const handleSendOtp = async () => {
        const trimmedPhone = phone.trim();
        // Basic validation - must start with + for international format
        if (!trimmedPhone.startsWith('+') || trimmedPhone.length < 10) {
            showMessage('Enter number with country code. Example: +91 9876543210', true);
            return;
        }
        setLoading(true);
        try {
            const confirmationResult = await auth().signInWithPhoneNumber(trimmedPhone);
            setConfirmation(confirmationResult);
            setStep('otp');
            setTimer(60);
            showMessage('OTP sent to your phone!', false);
        } catch (error: any) {
            console.error('Firebase OTP send error:', error);
            showMessage(error.message || 'Failed to send OTP. Check the phone number.', true);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP with Firebase
    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            showMessage('Please enter the 6-digit OTP', true);
            return;
        }
        if (!confirmation) {
            showMessage('Session expired. Please resend OTP.', true);
            return;
        }
        setLoading(true);
        try {
            // Confirm OTP with Firebase
            await confirmation.confirm(otp);

            // OTP verified! Now save the phone number to our backend for security records.
            const trimmedPhone = phone.trim();
            if (token) {
                try {
                    await fetch(`${API_URL}/auth/save-phone`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ phone: trimmedPhone }),
                    });
                } catch (saveErr) {
                    // Non-critical: log but don't block the user
                    console.warn('Could not save phone to backend:', saveErr);
                }
            }

            showMessage('✅ Phone verified successfully!', false);
            setTimeout(() => {
                onVerified(trimmedPhone);
                handleClose();
            }, 800);
        } catch (error: any) {
            console.error('Firebase OTP verify error:', error);
            showMessage('Invalid OTP. Please try again.', true);
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResend = async () => {
        setOtp('');
        setConfirmation(null);
        showMessage('', false);
        await handleSendOtp();
    };

    const handleClose = () => {
        setStep('phone');
        setPhone('');
        setOtp('');
        setTimer(0);
        setMessage(null);
        setIsError(false);
        setConfirmation(null);
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
                        {step === 'phone' ? '📱 Phone Verification' : '🔑 Enter OTP'}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {step === 'phone'
                            ? 'For security, we need to verify your phone number before you can claim an item. Your number will be saved securely.'
                            : `Enter the 6-digit code sent to ${phone}`}
                    </Text>

                    {message ? (
                        <View style={[
                            styles.messageBanner,
                            { backgroundColor: isError ? '#FEE2E2' : '#D1FAE5' }
                        ]}>
                            <Text style={{ color: isError ? '#DC2626' : '#065F46', textAlign: 'center', fontSize: 14 }}>
                                {message}
                            </Text>
                        </View>
                    ) : null}

                    {step === 'phone' ? (
                        <View>
                            <Input
                                label="Phone Number"
                                placeholder="+91 9876543210"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                            <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                ℹ️ Include your country code (e.g. +91 for India)
                            </Text>
                        </View>
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
                                    <TouchableOpacity onPress={handleResend} disabled={loading}>
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
        lineHeight: 20,
        marginBottom: 4,
    },
    messageBanner: {
        padding: 12,
        borderRadius: 10,
    },
    hint: {
        fontSize: 12,
        marginTop: 6,
        marginLeft: 2,
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

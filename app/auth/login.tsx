import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, Modal, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { API_URL } from '../../constants/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';

export default function Login() {
    const { colors } = useTheme();
    const { login } = useAuth();
    const router = useRouter();
    const isKeyboardVisible = useKeyboardVisible();

    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [countryCode, setCountryCode] = useState('+91');
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [phone, setPhone] = useState('');
    const [isPhoneFocused, setIsPhoneFocused] = useState(false);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [timer, setTimer] = useState(0);
    const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Force disable app verification in development to allow Test Phone Numbers to work perfectly
    useEffect(() => {
        if (__DEV__ && Platform.OS !== 'web') {
            auth().settings.appVerificationDisabledForTesting = true;
            console.log('Development mode: appVerificationDisabledForTesting is TRUE');
        }
    }, []);

    const handleSendOtp = async () => {
        setError('');
        setMessage('');
        // Format to strict Firebase E.164 format by stripping all spaces
        const formattedPhone = (countryCode + phone).replace(/\s+/g, '');
        
        if (phone.trim().length < 5) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            if (Platform.OS === 'web') {
                console.log('Web platform detected. Bypassing native OTP.');
                setConfirmation({ confirm: async (code: string) => {
                    if (code === '123456') {
                        // Mock user credential for web
                        return { user: { getIdToken: async () => 'mock-web-token-123' } };
                    }
                    throw new Error('Invalid web OTP');
                }} as any);
                setStep('otp');
                setTimer(60);
                setMessage('Web Showcase Mode: Use OTP 123456');
            } else {
                const confirmationResult = await auth().signInWithPhoneNumber(formattedPhone);
                setConfirmation(confirmationResult);
                setStep('otp');
                setTimer(60);
                setMessage('OTP sent successfully!');
            }
        } catch (e: any) {
            console.error('OTP Send Error:', e);
            
            // Deeply analyzed Firebase Error Handling
            if (e.code === 'auth/missing-client-identifier' || e.message.includes('missing-client-identifier')) {
                setError('Google Play Integrity Blocked this request (Common in Dev Builds).\n\nFIX 1: Use a Test Phone Number (added in Firebase Auth -> Phone, with NO SPACES).\n\nFIX 2: Use the Production APK (which is currently building).');
            } else if (e.code === 'auth/too-many-requests') {
                setError('Too many requests. Firebase has temporarily blocked this device. Please use a Test Phone Number.');
            } else {
                setError(e.message || 'Failed to send OTP.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setError('');
        if (otp.length !== 6) {
            setError('Please enter the 6-digit OTP');
            return;
        }
        if (!confirmation) {
            setError('Session expired. Please resend OTP.');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await confirmation.confirm(otp);
            const firebaseIdToken = await (userCredential as any).user.getIdToken();
            const pushToken = await AsyncStorage.getItem('expoPushToken');

            // Send to backend
            const response = await fetch(`${API_URL}/auth/phone-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firebaseIdToken, pushToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error && data.error.includes('Name is required to register')) {
                    // New user! Navigate to onboarding
                    router.replace({
                        pathname: '/onboarding',
                        params: { firebaseIdToken, phone: phone.trim() }
                    });
                    return;
                }
                throw new Error(data.error || 'Login failed');
            }

            // Existing user, log them in
            await login(data.token, data.user);
        } catch (e: any) {
            console.error('OTP Verify Error:', e);
            setError(e.message || 'Invalid OTP or Login Failed.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {!isKeyboardVisible && (
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: colors.primary }]}>FindMate</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                {step === 'phone' ? 'Login with your phone number' : 'Verify your phone'}
                            </Text>
                        </View>
                    )}

                    <View style={[styles.form, !isKeyboardVisible && { marginTop: 0 }]}>
                        {!!error && (
                            <View style={[styles.errorBox, { backgroundColor: '#ff4d4f20', borderColor: '#ff4d4f' }]}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}
                        {!!message && (
                            <View style={[styles.messageBox, { backgroundColor: '#4caf5020', borderColor: '#4caf50' }]}>
                                <Text style={styles.messageText}>{message}</Text>
                            </View>
                        )}

                        {step === 'phone' ? (
                            <>
                                <View style={styles.phoneInputContainer}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number</Text>
                                    <View style={[
                                        styles.phoneRow,
                                        { 
                                            backgroundColor: colors.surface,
                                            borderColor: error ? colors.error : (isPhoneFocused ? colors.primary : colors.border)
                                        }
                                    ]}>
                                        <TouchableOpacity 
                                            style={styles.countryPickerButton}
                                            onPress={() => setShowCountryPicker(true)}
                                        >
                                            <Text style={[styles.countryCodeText, { color: colors.text }]}>{countryCode}</Text>
                                            <ChevronDown size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                                        </TouchableOpacity>
                                        
                                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                        
                                        <TextInput
                                            style={[styles.phoneInput, { color: colors.text }]}
                                            value={phone}
                                            onChangeText={(v) => { setPhone(v); setError(''); }}
                                            placeholder="98765 43210"
                                            placeholderTextColor={colors.textSecondary}
                                            keyboardType="phone-pad"
                                            onFocus={() => setIsPhoneFocused(true)}
                                            onBlur={() => setIsPhoneFocused(false)}
                                        />
                                    </View>
                                </View>
                                <Button
                                    title="Send OTP"
                                    onPress={handleSendOtp}
                                    loading={loading}
                                    style={styles.button}
                                />
                            </>
                        ) : (
                            <>
                                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                    Enter the 6-digit code sent to {phone}
                                </Text>
                                <Input
                                    label="OTP"
                                    value={otp}
                                    onChangeText={(v) => { setOtp(v.replace(/[^0-9]/g, '')); setError(''); }}
                                    placeholder="Enter 6-digit OTP"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                                <Button
                                    title="Verify & Login"
                                    onPress={handleVerifyOtp}
                                    loading={loading}
                                    style={styles.button}
                                />
                                <View style={styles.resendContainer}>
                                    <Text style={{ color: colors.textSecondary }}>
                                        Didn't receive code?{' '}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.resendText,
                                            { color: timer > 0 ? colors.textSecondary : colors.primary },
                                        ]}
                                        onPress={timer === 0 && !loading ? handleSendOtp : undefined}
                                    >
                                        {timer > 0 ? `Resend in ${formatTime(timer)}` : 'Resend OTP'}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={showCountryPicker} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Select Country Code</Text>
                        <FlatList
                            data={[
                                { code: '+91', country: 'India' },
                                { code: '+1', country: 'USA/Canada' },
                                { code: '+44', country: 'UK' },
                                { code: '+61', country: 'Australia' },
                                { code: '+971', country: 'UAE' },
                                { code: '+65', country: 'Singapore' },
                            ]}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.countryItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setCountryCode(item.code);
                                        setShowCountryPicker(false);
                                    }}
                                >
                                    <Text style={[styles.countryItemCode, { color: colors.primary }]}>{item.code}</Text>
                                    <Text style={[styles.countryItemName, { color: colors.text }]}>{item.country}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity 
                            style={[styles.closeModalButton, { backgroundColor: colors.surface }]}
                            onPress={() => setShowCountryPicker(false)}
                        >
                            <Text style={{ color: colors.text }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    form: {
        gap: 16,
        width: '100%',
        maxWidth: 480,
        alignSelf: 'center',
    },
    errorBox: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
    },
    errorText: {
        color: '#ff4d4f',
        fontSize: 13,
        textAlign: 'center',
    },
    messageBox: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
    },
    messageText: {
        color: '#4caf50',
        fontSize: 13,
        textAlign: 'center',
    },
    button: { marginTop: 8 },
    infoText: {
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'center',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    resendText: {
        fontWeight: 'bold',
    },
});

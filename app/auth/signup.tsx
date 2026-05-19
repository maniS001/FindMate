import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import CaptchaWidget, { CaptchaRef } from '../../components/CaptchaWidget';
import Input from '../../components/Input';
import { API_URL } from '../../constants/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';

export default function Signup() {
    const { colors } = useTheme();
    const { signup } = useAuth();
    const isKeyboardVisible = useKeyboardVisible();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const captchaRef = useRef<CaptchaRef>(null);

    const handleSignup = async () => {
        setError('');

        if (!name || !email || !password) {
            setError('Please fill in all fields.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (!captchaRef.current?.isFilled()) {
            setError('Please solve the CAPTCHA before signing up.');
            return;
        }

        setLoading(true);
        try {
            // --- Step 1: Verify CAPTCHA ---
            const { captchaId, answer } = captchaRef.current.getValues();
            const captchaRes = await fetch(`${API_URL}/captcha/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ captchaId, answer }),
            });
            const captchaData = await captchaRes.json();

            if (!captchaData.valid) {
                setError(captchaData.error || 'Incorrect CAPTCHA answer. Please try again.');
                captchaRef.current.refresh(); // Load a fresh captcha
                return;
            }

            // --- Step 2: Create Account ---
            await signup(name, email, password);

        } catch (e: any) {
            setError(e.message || 'Signup failed. Please try again.');
            captchaRef.current?.refresh();
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 30}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hide header when keyboard is open to prevent clipping */}
                    {!isKeyboardVisible && (
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: colors.primary }]}>Create Account</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                Join FindMate today
                            </Text>
                        </View>
                    )}

                    <View style={styles.form}>
                        <Input
                            label="Full Name"
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            autoCapitalize="words"
                        />
                        <Input
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Input
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Create a password (min. 6 chars)"
                            secureTextEntry
                        />

                        {/* ─── CAPTCHA ─── */}
                        <CaptchaWidget ref={captchaRef} />

                        {/* ─── Error message ─── */}
                        {!!error && (
                            <View style={[styles.errorBox, { backgroundColor: '#ff4d4f20', borderColor: '#ff4d4f' }]}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <Button
                            title="Sign Up"
                            onPress={handleSignup}
                            loading={loading}
                            style={styles.button}
                        />

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                                Already have an account?
                            </Text>
                            <Link href="/auth/login" asChild>
                                <Text style={StyleSheet.flatten([styles.link, { color: colors.primary }])}>
                                    Login
                                </Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    form: {
        gap: 16,
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
    button: {
        marginTop: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
    },
    footerText: { fontSize: 14 },
    link: { fontSize: 14, fontWeight: 'bold' },
});

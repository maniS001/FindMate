import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import { GoogleSignInBtn } from '../../components/GoogleSignInButton';
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

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setError('');
        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            const pushToken = await AsyncStorage.getItem('expoPushToken');
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, pushToken }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');

            await login(data.token, data.user);
        } catch (e: any) {
            setError(e.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async (userInfo: any) => {
        setLoading(true);
        try {
            const { idToken, location, latitude, longitude } = userInfo.data;
            if (!idToken) throw new Error('No ID token found');

            const pushToken = await AsyncStorage.getItem('expoPushToken');
            const response = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken, location, latitude, longitude, pushToken }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.details ? `${data.error}: ${data.details}` : (data.error || 'Google login failed'));
            }

            await login(data.token, data.user);
        } catch (e: any) {
            setError(e.message || 'Google Sign-In failed.');
        } finally {
            setLoading(false);
        }
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
                    {/* Hide header when keyboard is open to prevent clipping */}
                    {!isKeyboardVisible && (
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: colors.primary }]}>FindMate</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                Welcome back!
                            </Text>
                        </View>
                    )}

                    <View style={[styles.form, !isKeyboardVisible && { marginTop: 0 }]}>
                        {/* Inline error banner */}
                        {!!error && (
                            <View style={[styles.errorBox, { backgroundColor: '#ff4d4f20', borderColor: '#ff4d4f' }]}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <Input
                            label="Email"
                            value={email}
                            onChangeText={(v) => { setEmail(v); setError(''); }}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Input
                            label="Password"
                            value={password}
                            onChangeText={(v) => { setPassword(v); setError(''); }}
                            placeholder="Enter your password"
                            secureTextEntry
                        />

                        <Button
                            title="Login"
                            onPress={handleLogin}
                            loading={loading}
                            style={styles.button}
                        />

                        <View style={styles.divider}>
                            <View style={[styles.line, { backgroundColor: colors.border }]} />
                            <Text style={[styles.orText, { color: colors.textSecondary }]}>OR</Text>
                            <View style={[styles.line, { backgroundColor: colors.border }]} />
                        </View>

                        <GoogleSignInBtn
                            onSignInSuccess={handleGoogleLogin}
                            onSignInFailure={(e) => setError(e.message || 'Google Sign-In failed')}
                            disabled={loading}
                        />

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                                Don't have an account?
                            </Text>
                            <Link href="/auth/signup" asChild>
                                <Text style={StyleSheet.flatten([styles.link, { color: colors.primary }])}>
                                    Sign Up
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
    button: { marginTop: 8 },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    line: { flex: 1, height: 1 },
    orText: { marginHorizontal: 16, fontSize: 14 },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
    },
    footerText: { fontSize: 14 },
    link: { fontSize: 14, fontWeight: 'bold' },
});

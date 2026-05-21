import { RefreshCw } from 'lucide-react-native';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_URL } from '../constants/api';
import { useTheme } from '../contexts/ThemeContext';

export interface CaptchaRef {
    /** Returns captchaId + typed answer. Call before submitting the form. */
    getValues: () => { captchaId: string; answer: string };
    /** Returns true if the user has typed an answer. */
    isFilled: () => boolean;
    /** Load a fresh captcha (e.g. after a failed attempt). */
    refresh: () => void;
}

const CaptchaWidget = forwardRef<CaptchaRef>((_, ref) => {
    const { colors } = useTheme();
    const [question, setQuestion] = useState<string | null>(null);
    const [captchaId, setCaptchaId] = useState<string>('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');

    const fetchCaptcha = useCallback(async () => {
        setLoading(true);
        setFetchError('');
        setAnswer('');
        try {
            const res = await fetch(`${API_URL}/captcha/generate`);
            const data = await res.json();
            setCaptchaId(data.captchaId);
            setQuestion(data.question); // e.g. "4 + 7 = ?"
        } catch {
            setFetchError('Failed to load. Tap refresh.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCaptcha();
    }, [fetchCaptcha]);

    useImperativeHandle(ref, () => ({
        getValues: () => ({ captchaId, answer }),
        isFilled: () => answer.trim().length > 0,
        refresh: fetchCaptcha,
    }));

    return (
        <View style={styles.wrapper}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
                Solve the math to verify you're human
            </Text>

            {/* Question Display Box */}
            <View style={[styles.questionBox, { backgroundColor: '#1a1a2e', borderColor: colors.primary }]}>
                <View style={styles.questionInner}>
                    {loading ? (
                        <ActivityIndicator color={colors.primary} size="small" />
                    ) : fetchError ? (
                        <Text style={styles.errorLabel}>{fetchError}</Text>
                    ) : (
                        <Text style={styles.questionText}>{question}</Text>
                    )}
                </View>

                {/* Refresh Button */}
                <TouchableOpacity
                    onPress={fetchCaptcha}
                    style={[styles.refreshBtn, { borderColor: colors.primary + '55' }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={loading}
                >
                    <RefreshCw size={18} color={loading ? colors.textSecondary : colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Answer Input */}
            <TextInput
                style={[styles.input, {
                    color: colors.text,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                }]}
                placeholder="Type the answer"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={answer}
                onChangeText={setAnswer}
                maxLength={3}
                textAlign="center"
            />
        </View>
    );
});

CaptchaWidget.displayName = 'CaptchaWidget';
export default CaptchaWidget;

const styles = StyleSheet.create({
    wrapper: {
        gap: 10,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
    },
    questionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 14,
        overflow: 'hidden',
        height: 72,
    },
    questionInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    questionText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 4,
        fontFamily: 'monospace',
    },
    errorLabel: {
        color: '#ff4d4f',
        fontSize: 13,
    },
    refreshBtn: {
        width: 54,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 1,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 6,
    },
});

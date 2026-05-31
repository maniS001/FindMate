import { RefreshCw } from 'lucide-react-native';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
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
    getValues: () => { captchaId: string; answer: string };
    isFilled: () => boolean;
    refresh: () => void;
}

const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 2000; // wait 2s between retries (backend may be waking up)

const CaptchaWidget = forwardRef<CaptchaRef>((_, ref) => {
    const { colors } = useTheme();
    const [question, setQuestion] = useState<string | null>(null);
    const [captchaId, setCaptchaId] = useState<string>('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const retryCount = useRef(0);

    const fetchCaptcha = useCallback(async (isRetry = false) => {
        if (!isRetry) {
            retryCount.current = 0;
            setFetchError('');
            setAnswer('');
        }
        setLoading(true);

        const attempt = async (): Promise<void> => {
            try {
                const res = await fetch(`${API_URL}/captcha/generate`, {
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!res.ok) throw new Error(`Server error: ${res.status}`);

                const data = await res.json();

                // Validate response has expected fields
                if (!data.question || !data.captchaId) {
                    throw new Error('Invalid response from server');
                }

                setCaptchaId(data.captchaId);
                setQuestion(data.question); // e.g. "4 + 7 = ?"
                setFetchError('');
                setLoading(false);
            } catch (e: any) {
                retryCount.current += 1;
                if (retryCount.current < MAX_RETRIES) {
                    // Retry after delay (backend may still be waking up)
                    setTimeout(() => attempt(), RETRY_DELAY_MS);
                } else {
                    setFetchError('Tap ↻ to reload');
                    setLoading(false);
                }
            }
        };

        await attempt();
    }, []);

    useEffect(() => {
        fetchCaptcha();
    }, [fetchCaptcha]);

    useImperativeHandle(ref, () => ({
        getValues: () => ({ captchaId, answer }),
        isFilled: () => answer.trim().length > 0,
        refresh: () => fetchCaptcha(false),
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
                        <View style={styles.loadingRow}>
                            <ActivityIndicator color={colors.primary} size="small" />
                            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                {retryCount.current > 0
                                    ? `Retrying... (${retryCount.current}/${MAX_RETRIES})`
                                    : 'Loading...'}
                            </Text>
                        </View>
                    ) : fetchError ? (
                        <Text style={styles.errorLabel}>{fetchError}</Text>
                    ) : question ? (
                        <Text style={styles.questionText}>{question}</Text>
                    ) : (
                        <ActivityIndicator color={colors.primary} size="small" />
                    )}
                </View>

                {/* Refresh Button */}
                <TouchableOpacity
                    onPress={() => fetchCaptcha(false)}
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
                editable={!!question && !loading}
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
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: 12,
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

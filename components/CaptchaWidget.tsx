import { RefreshCw } from 'lucide-react-native';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_URL } from '../constants/api';
import { useTheme } from '../contexts/ThemeContext';

export interface CaptchaRef {
    /** Returns captchaId + typed answer. Call before submitting form. */
    getValues: () => { captchaId: string; answer: string };
    /** Returns true if the captcha has been solved (answer typed). */
    isFilled: () => boolean;
    /** Force reload a fresh captcha (e.g. after a failed attempt). */
    refresh: () => void;
}

interface Props {
    onValidated?: (valid: boolean) => void;
}

const CaptchaWidget = forwardRef<CaptchaRef, Props>(({ onValidated }, ref) => {
    const { colors } = useTheme();
    const [svgBase64, setSvgBase64] = useState<string | null>(null);
    const [captchaId, setCaptchaId] = useState<string>('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchCaptcha = useCallback(async () => {
        setLoading(true);
        setError('');
        setAnswer('');
        try {
            const res = await fetch(`${API_URL}/captcha/generate`);
            const data = await res.json();
            setCaptchaId(data.captchaId);
            setSvgBase64(data.svgBase64);
        } catch (e) {
            setError('Failed to load CAPTCHA. Check connection.');
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
                Verify you're human
            </Text>

            <View style={[styles.captchaRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* CAPTCHA Image */}
                <View style={styles.imageBox}>
                    {loading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : svgBase64 ? (
                        <Image
                            source={{ uri: `data:image/svg+xml;base64,${svgBase64}` }}
                            style={styles.captchaImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>–</Text>
                    )}
                </View>

                {/* Refresh Button */}
                <TouchableOpacity
                    onPress={fetchCaptcha}
                    style={[styles.refreshBtn, { borderColor: colors.border }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <RefreshCw size={18} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Answer Input */}
            <TextInput
                style={[styles.input, {
                    color: colors.text,
                    backgroundColor: colors.surface,
                    borderColor: error ? '#ff4d4f' : colors.border,
                }]}
                placeholder="Enter the answer above"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={answer}
                onChangeText={(v) => { setAnswer(v); setError(''); }}
                maxLength={4}
            />

            {!!error && (
                <Text style={styles.errorText}>{error}</Text>
            )}
        </View>
    );
});

CaptchaWidget.displayName = 'CaptchaWidget';
export default CaptchaWidget;

const styles = StyleSheet.create({
    wrapper: {
        gap: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 2,
    },
    captchaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
        height: 64,
    },
    imageBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    captchaImage: {
        width: '100%',
        height: 54,
    },
    refreshBtn: {
        width: 48,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 1,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        letterSpacing: 4,
    },
    errorText: {
        color: '#ff4d4f',
        fontSize: 12,
        marginTop: 2,
    },
});

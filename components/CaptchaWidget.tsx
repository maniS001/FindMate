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
import { SvgXml } from 'react-native-svg';
import { API_URL } from '../constants/api';
import { useTheme } from '../contexts/ThemeContext';

export interface CaptchaRef {
    /** Returns captchaId + typed answer. Call before submitting form. */
    getValues: () => { captchaId: string; answer: string };
    /** Returns true if the user has typed an answer. */
    isFilled: () => boolean;
    /** Load a fresh captcha (e.g. after a failed attempt). */
    refresh: () => void;
}

interface Props {
    onValidated?: (valid: boolean) => void;
}

const CaptchaWidget = forwardRef<CaptchaRef, Props>(({ onValidated }, ref) => {
    const { colors } = useTheme();
    const [svgXml, setSvgXml] = useState<string | null>(null);
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
            setSvgXml(data.svgXml); // raw SVG string from backend
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
                Verify you're human — solve the math question
            </Text>

            {/* CAPTCHA Image Box */}
            <View style={[styles.captchaBox, { backgroundColor: '#1a1a2e', borderColor: colors.border }]}>
                {loading ? (
                    <ActivityIndicator color={colors.primary} />
                ) : svgXml ? (
                    <SvgXml
                        xml={svgXml}
                        width="100%"
                        height="60"
                    />
                ) : (
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {error || 'Loading...'}
                    </Text>
                )}

                {/* Refresh Button */}
                <TouchableOpacity
                    onPress={fetchCaptcha}
                    style={[styles.refreshBtn, { borderColor: colors.border }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                placeholder="Type your answer here"
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
        gap: 10,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 2,
    },
    captchaBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
        height: 68,
        paddingHorizontal: 12,
    },
    refreshBtn: {
        marginLeft: 'auto',
        paddingLeft: 12,
        paddingVertical: 8,
        borderLeftWidth: 1,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 20,
        letterSpacing: 8,
        textAlign: 'center',
    },
    errorText: {
        color: '#ff4d4f',
        fontSize: 12,
        marginTop: 2,
        textAlign: 'center',
    },
});

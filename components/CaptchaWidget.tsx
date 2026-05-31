import { RefreshCw } from 'lucide-react-native';
import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface CaptchaRef {
    /** Returns typed answer and the correct answer for local validation. */
    getValues: () => { captchaId: string; answer: string };
    /** Returns true if the user has typed an answer. */
    isFilled: () => boolean;
    /** Validate the entered answer locally. Returns true if correct. */
    validate: () => boolean;
    /** Load a fresh captcha (e.g. after a failed attempt). */
    refresh: () => void;
}

interface MathQuestion {
    question: string;
    answer: string;
}

function generateQuestion(): MathQuestion {
    const ops = ['+', '-', '*'] as const;
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a: number, b: number, answer: number;

    if (op === '+') {
        a = Math.floor(Math.random() * 9) + 1;
        b = Math.floor(Math.random() * 9) + 1;
        answer = a + b;
    } else if (op === '-') {
        a = Math.floor(Math.random() * 8) + 2;
        b = Math.floor(Math.random() * (a - 1)) + 1; // ensure positive result
        answer = a - b;
    } else {
        a = Math.floor(Math.random() * 5) + 2;
        b = Math.floor(Math.random() * 4) + 2;
        answer = a * b;
    }

    const opSymbol = op === '*' ? '×' : op;
    return { question: `${a} ${opSymbol} ${b} = ?`, answer: String(answer) };
}

const CaptchaWidget = forwardRef<CaptchaRef>((_, ref) => {
    const { colors } = useTheme();
    const [math, setMath] = useState<MathQuestion>(generateQuestion);
    const [answer, setAnswer] = useState('');
    const [shakeError, setShakeError] = useState(false);

    const refresh = useCallback(() => {
        setMath(generateQuestion());
        setAnswer('');
        setShakeError(false);
    }, []);

    const validate = useCallback((): boolean => {
        return answer.trim() === math.answer;
    }, [answer, math.answer]);

    useImperativeHandle(ref, () => ({
        // captchaId is unused for local validation but kept for API compatibility
        getValues: () => ({ captchaId: 'local', answer }),
        isFilled: () => answer.trim().length > 0,
        validate,
        refresh,
    }));

    return (
        <View style={styles.wrapper}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
                Solve the math to verify you're human
            </Text>

            {/* Question Display Box */}
            <View style={[styles.questionBox, { backgroundColor: '#1a1a2e', borderColor: colors.primary }]}>
                <View style={styles.questionInner}>
                    <Text style={styles.questionText}>{math.question}</Text>
                </View>

                {/* Refresh Button */}
                <TouchableOpacity
                    onPress={refresh}
                    style={[styles.refreshBtn, { borderColor: colors.primary + '55' }]}
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
                    borderColor: shakeError ? '#ff4d4f' : colors.border,
                }]}
                placeholder="Type the answer"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={answer}
                onChangeText={(t) => { setAnswer(t); setShakeError(false); }}
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

import { RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface CaptchaProps {
    onVerify: (isValid: boolean) => void;
}

export default function Captcha({ onVerify }: CaptchaProps) {
    const { colors } = useTheme();
    const [captchaCode, setCaptchaCode] = useState('');
    const [input, setInput] = useState('');

    const generateCaptcha = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptchaCode(result);
        setInput('');
        onVerify(false);
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    const handleInputChange = (text: string) => {
        setInput(text);
        if (text.toUpperCase() === captchaCode) {
            onVerify(true);
        } else {
            onVerify(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.captchaBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.captchaText, { color: colors.text }]}>{captchaCode.split('').join(' ')}</Text>
                <TouchableOpacity onPress={generateCaptcha} style={styles.refreshButton}>
                    <RefreshCw size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>
            <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter Captcha"
                placeholderTextColor={colors.textSecondary}
                value={input}
                onChangeText={handleInputChange}
                autoCapitalize="characters"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    captchaBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    captchaText: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 4,
        fontFamily: 'monospace',
        textDecorationLine: 'line-through',
        textDecorationStyle: 'double',
    },
    refreshButton: {
        padding: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
});

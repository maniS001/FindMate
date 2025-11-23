import { RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface CaptchaProps {
    onVerify: (isValid: boolean) => void;
}

export default function Captcha({ onVerify }: CaptchaProps) {
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
            <View style={styles.captchaBox}>
                <Text style={styles.captchaText}>{captchaCode.split('').join(' ')}</Text>
                <TouchableOpacity onPress={generateCaptcha} style={styles.refreshButton}>
                    <RefreshCw size={20} color="#64748B" />
                </TouchableOpacity>
            </View>
            <TextInput
                style={styles.input}
                placeholder="Enter Captcha"
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
        backgroundColor: '#E2E8F0',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    captchaText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#334155',
        letterSpacing: 4,
        fontFamily: 'monospace',
        textDecorationLine: 'line-through',
        textDecorationStyle: 'double',
    },
    refreshButton: {
        padding: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1E293B',
    },
});

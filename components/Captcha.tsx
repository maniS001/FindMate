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
    const [charStyles, setCharStyles] = useState<any[]>([]);

    const generateCaptcha = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        const styles = [];

        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
            styles.push({
                transform: [{ rotate: `${Math.random() * 40 - 20}deg` }],
                fontSize: 20 + Math.random() * 8,
                marginTop: Math.random() * 10 - 5,
            });
        }

        setCaptchaCode(result);
        setCharStyles(styles);
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
                {/* Random Noise Lines */}
                <View style={[styles.noiseLine, { top: '30%', left: '10%', width: '80%', transform: [{ rotate: '5deg' }] }]} />
                <View style={[styles.noiseLine, { top: '60%', left: '5%', width: '90%', transform: [{ rotate: '-3deg' }] }]} />

                {/* Random Dots */}
                {[...Array(10)].map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.noiseDot,
                            {
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                backgroundColor: colors.textSecondary
                            }
                        ]}
                    />
                ))}

                <View style={styles.charContainer}>
                    {captchaCode.split('').map((char, index) => (
                        <Text
                            key={index}
                            style={[
                                styles.char,
                                { color: colors.text },
                                charStyles[index]
                            ]}
                        >
                            {char}
                        </Text>
                    ))}
                </View>

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
        overflow: 'hidden',
        height: 80,
    },
    charContainer: {
        flexDirection: 'row',
        gap: 8,
        zIndex: 2,
    },
    char: {
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    refreshButton: {
        padding: 8,
        zIndex: 3,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    noiseLine: {
        position: 'absolute',
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        zIndex: 1,
    },
    noiseDot: {
        position: 'absolute',
        width: 2,
        height: 2,
        borderRadius: 1,
        opacity: 0.3,
        zIndex: 1,
    }
});

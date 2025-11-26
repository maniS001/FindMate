import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface InputProps extends TextInputProps {
    label: string;
    error?: string;
}

export default function Input({ label, error, style, ...props }: InputProps) {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.surface,
                        borderColor: error ? colors.error : colors.border,
                        color: colors.text
                    },
                    error ? styles.inputError : null,
                    style
                ]}
                placeholderTextColor={colors.textSecondary}
                {...props}
            />
            {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    inputError: {
        borderWidth: 2,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    },
});

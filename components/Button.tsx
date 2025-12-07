import { ActivityIndicator, StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
}

export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style }: ButtonProps) {
    const getBackgroundColor = () => {
        if (disabled) return '#CBD5E1';
        switch (variant) {
            case 'primary': return '#3B82F6';
            case 'secondary': return '#10B981';
            case 'danger': return '#EF4444';
            case 'outline': return 'transparent';
            default: return '#3B82F6';
        }
    };

    const getTextColor = () => {
        if (disabled) return '#94A3B8';
        switch (variant) {
            case 'outline': return '#3B82F6';
            case 'danger': return '#FFFFFF';
            default: return '#FFFFFF';
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: getBackgroundColor() },
                variant === 'outline' && styles.outlineButton,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        width: '100%',
    },
    outlineButton: {
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
});

import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface DatePickerProps {
    label: string;
    value: Date;
    onChange: (date: Date) => void;
    style?: ViewStyle;
}

export default function DatePicker({ label, value, onChange, style }: DatePickerProps) {
    const { colors } = useTheme();
    const [show, setShow] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (_event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShow(false);
        }
        if (selectedDate) {
            onChange(selectedDate);
        }
        setIsFocused(false);
    };

    const showDatePicker = () => {
        setShow(true);
        setIsFocused(true);
    };

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return (
        <View style={[styles.container, style]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            <TouchableOpacity
                onPress={showDatePicker}
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.surface,
                        borderColor: isFocused ? colors.primary : colors.border,
                        borderWidth: isFocused ? 2 : 1,
                    }
                ]}
                activeOpacity={0.7}
            >
                <Text style={[styles.inputText, { color: colors.text }]}>
                    {formatDate(value)}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {show && (
                <DateTimePicker
                    value={value}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleChange}
                    maximumDate={new Date()}
                />
            )}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    inputText: {
        fontSize: 16,
    },
});

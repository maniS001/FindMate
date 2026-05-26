import { X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';
import Input from './Input';

interface ReasonModalProps {
    visible: boolean;
    type: 'CLOSE' | 'REOPEN';
    onClose: () => void;
    onSubmit: (reason: string) => void;
    loading?: boolean;
}

const CLOSE_REASONS = [
    'I found the item myself',
    'Someone gave it to me (outside app)',
    'I bought a replacement',
    'No longer looking for it',
    'Other'
];

const REOPEN_REASONS = [
    'Item was not actually found',
    'Contact number was wrong/unreachable',
    'The found item was not mine',
    'Accidentally closed',
    'Other'
];

export default function ReasonModal({ visible, type, onClose, onSubmit, loading }: ReasonModalProps) {
    const { colors } = useTheme();
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [customReason, setCustomReason] = useState('');

    const reasons = type === 'CLOSE' ? CLOSE_REASONS : REOPEN_REASONS;
    const title = type === 'CLOSE' ? 'Close Complaint' : 'Raise Again';
    const subtitle = type === 'CLOSE'
        ? 'Please tell us why you want to close this complaint.'
        : 'Please tell us why you want to reopen this complaint.';

    const handleSubmit = () => {
        if (selectedReason === 'Other') {
            if (customReason.trim()) onSubmit(customReason);
        } else if (selectedReason) {
            onSubmit(selectedReason);
        }
    };

    const handleClose = () => {
        setSelectedReason(null);
        setCustomReason('');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: colors.surface }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>

                    <ScrollView style={styles.reasonsList}>
                        {reasons.map((reason) => (
                            <TouchableOpacity
                                key={reason}
                                style={[
                                    styles.reasonItem,
                                    {
                                        borderColor: selectedReason === reason ? colors.primary : colors.border,
                                        backgroundColor: selectedReason === reason ? colors.primary + '10' : 'transparent'
                                    }
                                ]}
                                onPress={() => setSelectedReason(reason)}
                            >
                                <View style={[
                                    styles.radio,
                                    {
                                        borderColor: selectedReason === reason ? colors.primary : colors.textSecondary,
                                        backgroundColor: selectedReason === reason ? colors.primary : 'transparent'
                                    }
                                ]}>
                                    {selectedReason === reason && <View style={styles.radioInner} />}
                                </View>
                                <Text style={[
                                    styles.reasonText,
                                    { color: selectedReason === reason ? colors.primary : colors.text }
                                ]}>
                                    {reason}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {selectedReason === 'Other' && (
                            <View style={styles.customInput}>
                                <Input
                                    label="Please specify"
                                    value={customReason}
                                    onChangeText={setCustomReason}
                                    placeholder="Type your reason here..."
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        )}
                    </ScrollView>

                    <Button
                        title="Submit"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim())}
                        style={{ marginTop: 16 }}
                    />
                </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    reasonsList: {
        marginBottom: 16,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        gap: 12,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFF',
    },
    reasonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    customInput: {
        marginTop: 4,
        marginBottom: 12,
    },
});

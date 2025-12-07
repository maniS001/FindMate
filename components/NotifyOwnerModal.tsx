import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';

interface NotifyOwnerModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: {
        securityAnswer: string;
        description: string;
        phone: string;
    }) => void;
    loading?: boolean;
}

export default function NotifyOwnerModal({ visible, onClose, onSubmit, loading }: NotifyOwnerModalProps) {
    const { colors } = useTheme();
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [description, setDescription] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = () => {
        if (!securityAnswer.trim() || !description.trim() || !phone.trim()) {
            return; // Validate in UI if needed (show error)
        }
        onSubmit({
            securityAnswer,
            description,
            phone,
        });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.title, { color: colors.text }]}>Notify Owner</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Help the owner verify it's you. Providing this info helps them trust you.
                        They will receive a secure notification.
                    </Text>

                    <ScrollView style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Security Answer / Verification Detail</Text>
                            <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                Answer to the security question or a unique detail about the item.
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="e.g., 'Blue cover', 'Pattern code 1234'"
                                placeholderTextColor={colors.textSecondary}
                                value={securityAnswer}
                                onChangeText={setSecurityAnswer}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Message to Owner</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="Hi, I think I found your item..."
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                numberOfLines={3}
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Your Contact Number</Text>
                            <Text style={[styles.hint, { color: colors.textSecondary }]}>
                                This will be shared securely only after they verify.
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="+1 234 567 8900"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.actions}>
                        <Button
                            title="Cancel"
                            variant="outline"
                            onPress={onClose}
                            style={{ flex: 1 }}
                        />
                        <Button
                            title="Notify"
                            onPress={handleSubmit}
                            loading={loading}
                            disabled={!securityAnswer || !description || !phone}
                            style={{ flex: 1 }}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    container: {
        borderRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    form: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    hint: {
        fontSize: 12,
        marginBottom: 8,
        fontStyle: 'italic',
    },
    input: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
});

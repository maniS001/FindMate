import { Star } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';

interface FeedbackModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
    loading?: boolean;
}

export default function FeedbackModal({ visible, onClose, onSubmit, loading }: FeedbackModalProps) {
    const { colors } = useTheme();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        if (rating > 0) {
            onSubmit(rating, comment);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.title, { color: colors.text }]}>Item Recovered!</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Please rate your experience with the founder.
                    </Text>

                    <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                                activeOpacity={0.7}
                            >
                                <Star
                                    size={32}
                                    color={star <= rating ? '#F59E0B' : colors.border}
                                    fill={star <= rating ? '#F59E0B' : 'transparent'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text
                            }
                        ]}
                        placeholder="Leave a comment (optional)..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={3}
                        value={comment}
                        onChangeText={setComment}
                    />

                    <View style={styles.actions}>
                        <Button
                            title="Cancel"
                            variant="outline"
                            onPress={onClose}
                            style={{ flex: 1 }}
                        />
                        <Button
                            title="Submit"
                            onPress={handleSubmit}
                            loading={loading}
                            disabled={rating === 0}
                            style={{ flex: 1 }}
                        />
                    </View>
                </View>
            </View>
            </KeyboardAvoidingView>
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
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    stars: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    input: {
        width: '100%',
        height: 100,
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        textAlignVertical: 'top',
        marginBottom: 24,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
});

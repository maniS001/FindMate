import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';

interface NotifyOwnerModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: {
        questions: { question: string; answer: string }[];
        description: string;
        phone: string;
    }) => void;
    loading?: boolean;
}

export default function NotifyOwnerModal({ visible, onClose, onSubmit, loading }: NotifyOwnerModalProps) {
    const { colors } = useTheme();
    const [questions, setQuestions] = useState([{ question: '', answer: '' }]);
    const [description, setDescription] = useState('');
    const [phone, setPhone] = useState('');

    const handleAddQuestion = () => {
        setQuestions([...questions, { question: '', answer: '' }]);
    };

    const handleRemoveQuestion = (index: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const handleQuestionChange = (text: string, index: number, field: 'question' | 'answer') => {
        const newQuestions = [...questions];
        newQuestions[index][field] = text;
        setQuestions(newQuestions);
    };

    const handleSubmit = () => {
        const areQuestionsValid = questions.every(q => q.question.trim() && q.answer.trim());
        if (!areQuestionsValid || !description.trim() || !phone.trim()) {
            return;
        }
        onSubmit({
            questions,
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
                        Help the owner verify it's you. Set security questions they must answer.
                    </Text>

                    <ScrollView style={styles.form}>
                        {questions.map((q, index) => (
                            <View key={index} style={[styles.questionContainer, { borderColor: colors.border }]}>
                                <View style={styles.questionHeader}>
                                    <Text style={[styles.label, { color: colors.text }]}>Security Question {index + 1}</Text>
                                    {questions.length > 1 && (
                                        <TouchableOpacity onPress={() => handleRemoveQuestion(index)}>
                                            <Trash2 size={20} color={colors.error} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={styles.inputGroup}>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        placeholder="E.g. What is the wallpaper?"
                                        placeholderTextColor={colors.textSecondary}
                                        value={q.question}
                                        onChangeText={(text) => handleQuestionChange(text, index, 'question')}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        placeholder="The correct answer"
                                        placeholderTextColor={colors.textSecondary}
                                        value={q.answer}
                                        onChangeText={(text) => handleQuestionChange(text, index, 'answer')}
                                    />
                                </View>
                            </View>
                        ))}

                        <Button
                            title="+ Add Another Question"
                            variant="secondary"
                            onPress={handleAddQuestion}
                            style={{ marginBottom: 24 }}
                        />

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
                            disabled={!questions.every(q => q.question.trim() && q.answer.trim()) || !description || !phone}
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
    questionContainer: {
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    inputGroup: {
        marginBottom: 12,
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

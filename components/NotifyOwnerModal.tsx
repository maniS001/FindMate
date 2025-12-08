import { Package, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Item } from '../store';
import Button from './Button';

interface NotifyOwnerModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: {
        questions: { question: string; answer: string }[];
        description: string;
        phone: string;
        itemId?: string;
    }) => void;
    loading?: boolean;
    userItems?: Item[];
}

export default function NotifyOwnerModal({ visible, onClose, onSubmit, loading, userItems = [] }: NotifyOwnerModalProps) {
    const { colors } = useTheme();
    const [questions, setQuestions] = useState([{ question: '', answer: '' }]);
    const [description, setDescription] = useState('');
    const [phone, setPhone] = useState('');

    // Item Selection
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // Filter only OPEN items
    const openItems = userItems.filter(i => !i.status || i.status === 'OPEN');

    const handleSelectFoundItem = (item: Item) => {
        if (selectedItemId === item.id) {
            // Deselect
            setSelectedItemId(null);
            setQuestions([{ question: '', answer: '' }]);
            setDescription('');
            setPhone('');
            return;
        }

        setSelectedItemId(item.id);

        // Pre-fill data from item
        if (item.questions && item.questions.length > 0) {
            setQuestions(item.questions.map(q => ({ question: q.question, answer: q.answer })));
        }
        if (item.description) setDescription(item.description);
        if (item.contactInfo) setPhone(item.contactInfo);
    };

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
            itemId: selectedItemId || undefined,
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
                        Link a reported item or manually enter verification details.
                    </Text>

                    <ScrollView style={styles.form}>
                        {openItems.length > 0 && (
                            <View style={styles.itemSelection}>
                                <Text style={[styles.label, { color: colors.text }]}>Link Found Item (Optional)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                    {openItems.map(item => (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={[
                                                styles.itemCard,
                                                selectedItemId === item.id ? { borderColor: colors.primary, backgroundColor: colors.primary + '10' } : { borderColor: colors.border }
                                            ]}
                                            onPress={() => handleSelectFoundItem(item)}
                                        >
                                            <Package size={16} color={selectedItemId === item.id ? colors.primary : colors.textSecondary} />
                                            <Text style={[
                                                styles.itemCardText,
                                                { color: selectedItemId === item.id ? colors.primary : colors.text }
                                            ]}>
                                                {item.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

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
                            title={selectedItemId ? "Notify & Link Item" : "Notify"}
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
        maxHeight: '90%',
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
    itemSelection: {
        marginBottom: 24,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginRight: 8,
    },
    itemCardText: {
        fontSize: 14,
        fontWeight: '600',
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

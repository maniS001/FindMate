import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import CategoryPicker from '../../components/CategoryPicker';
import DatePicker from '../../components/DatePicker';
import CustomImagePicker from '../../components/ImagePicker';
import Input from '../../components/Input';
import { API_URL } from '../../constants/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { addItem } from '../../store';
import { showAlert } from '../../utils/alert';

export default function ReportFoundItem() {
    const router = useRouter();
    const { colors } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [descError, setDescError] = useState('');

    const [form, setForm] = useState({
        name: '',
        category: '',
        location: '',
        description: '',
        questions: [{ question: '', answer: '' }],
        contactInfo: '',
        imageUris: [] as string[],
    });
    const [date, setDate] = useState(new Date());

    const handleAddQuestion = () => {
        setForm({
            ...form,
            questions: [...form.questions, { question: '', answer: '' }]
        });
    };

    const handleRemoveQuestion = (index: number) => {
        const newQuestions = [...form.questions];
        newQuestions.splice(index, 1);
        setForm({ ...form, questions: newQuestions });
    };

    const handleQuestionChange = (text: string, index: number, field: 'question' | 'answer') => {
        const newQuestions = [...form.questions];
        newQuestions[index][field] = text;
        setForm({ ...form, questions: newQuestions });
    };

    // AI validate description when user finishes typing
    const handleDescriptionBlur = async () => {
        if (!form.description.trim() || form.description.trim().length < 10) return;
        try {
            const res = await fetch(`${API_URL}/ai/validate-description`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: form.description }),
            });
            const data = await res.json();
            if (!data.valid) {
                setDescError(`⚠️ ${data.reason} Please remove any contact info from the description.`);
            } else {
                setDescError('');
            }
        } catch {
            // AI unavailable — allow
        }
    };

    const handleSubmit = async () => {
        const areQuestionsValid = form.questions.every(q => q.question.trim() && q.answer.trim());

        if (!form.name || !form.location || !areQuestionsValid || !form.contactInfo) {
            showAlert('Missing Information', 'Please fill in all required fields, including all security questions and answers.');
            return;
        }

        // Block if description has contact info detected
        if (descError) {
            showAlert('Invalid Description', 'Please remove phone numbers or contact info from the description before submitting.');
            return;
        }

        // Re-validate description on submit for safety
        if (form.description.trim().length > 0) {
            setAiLoading(true);
            try {
                const res = await fetch(`${API_URL}/ai/validate-description`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description: form.description }),
                });
                const data = await res.json();
                if (!data.valid) {
                    setDescError(`⚠️ ${data.reason} Please remove any contact info from the description.`);
                    setAiLoading(false);
                    return;
                }
            } catch {
                // AI unavailable — allow
            }
            setAiLoading(false);
        }

        setLoading(true);
        try {
            const { convertImagesToBase64 } = await import('../../utils/imageUtils');
            const base64Images = form.imageUris.length > 0
                ? await convertImagesToBase64(form.imageUris)
                : [];

            await addItem({
                name: form.name,
                category: form.category,
                location: form.location,
                date: date.toISOString().split('T')[0],
                description: form.description,
                contactInfo: form.contactInfo,
                imageUris: base64Images,
                questions: form.questions,
                userId: user?.id,
            });
            router.push({
                pathname: '/success',
                params: { type: 'report' }
            });
        } catch (error) {
            console.error('Submit error:', error);
            showAlert('Error', 'Failed to report item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={[styles.heading, { color: colors.text }]}>Report Found Item</Text>
                    <Text style={[styles.subHeader, { color: colors.textSecondary }]}>Help the owner find their lost belonging.</Text>

                    <View style={styles.form}>
                        <CustomImagePicker
                            label="Item Photos"
                            onImagesSelected={(uris) => setForm({ ...form, imageUris: uris })}
                            initialImages={form.imageUris}
                        />

                        <Input
                            label="Item Name"
                            placeholder="e.g. Blue Car Keys"
                            value={form.name}
                            onChangeText={(text) => setForm({ ...form, name: text })}
                        />

                        <CategoryPicker
                            label="Category"
                            value={form.category}
                            onChange={(category) => setForm({ ...form, category })}
                        />

                        <Input
                            label="Location Found"
                            placeholder="e.g. Central Park, near bench"
                            value={form.location}
                            onChangeText={(text) => setForm({ ...form, location: text })}
                        />

                        <DatePicker
                            label="Date Found"
                            value={date}
                            onChange={setDate}
                        />

                        {/* Description with AI phone-number detection */}
                        <Input
                            label="Description (Visible to public)"
                            placeholder="Brief description of the item (no phone numbers)..."
                            multiline
                            numberOfLines={3}
                            style={{ height: 80, textAlignVertical: 'top' }}
                            value={form.description}
                            onChangeText={(text) => {
                                setForm({ ...form, description: text });
                                if (descError) setDescError('');
                            }}
                            onBlur={handleDescriptionBlur}
                        />
                        {!!descError && (
                            <View style={styles.descErrorBox}>
                                <Text style={styles.descErrorText}>{descError}</Text>
                            </View>
                        )}

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Verification Details</Text>
                        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                            Add one or more security questions. The owner must answer ALL of them correctly to claim the item.
                        </Text>

                        {form.questions.map((q, index) => (
                            <View key={index} style={styles.questionContainer}>
                                <View style={styles.questionHeader}>
                                    <Text style={[styles.questionLabel, { color: colors.textSecondary }]}>
                                        Question {index + 1}
                                    </Text>
                                    {form.questions.length > 1 && (
                                        <TouchableOpacity onPress={() => handleRemoveQuestion(index)}>
                                            <Text style={{ color: colors.error, fontWeight: '600' }}>Remove</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <Input
                                    label="Secret Question"
                                    placeholder="e.g. What is the keychain character?"
                                    value={q.question}
                                    onChangeText={(text) => handleQuestionChange(text, index, 'question')}
                                />

                                <Input
                                    label="Secret Answer"
                                    placeholder="The correct answer"
                                    secureTextEntry
                                    value={q.answer}
                                    onChangeText={(text) => handleQuestionChange(text, index, 'answer')}
                                />
                            </View>
                        ))}

                        <Button
                            title="+ Add Another Question"
                            onPress={handleAddQuestion}
                            variant="secondary"
                            style={{ marginBottom: 24 }}
                        />

                        <Input
                            label="Your Contact Info (Hidden)"
                            placeholder="Phone Number (shared only after verification)"
                            value={form.contactInfo}
                            onChangeText={(text) => setForm({ ...form, contactInfo: text })}
                            keyboardType="phone-pad"
                        />

                        <Button
                            title={aiLoading ? 'AI Checking...' : 'Report Item'}
                            onPress={handleSubmit}
                            loading={loading || aiLoading}
                            style={{ marginTop: 8 }}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingBottom: 100,
    },
    heading: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subHeader: {
        fontSize: 16,
        marginBottom: 12,
    },
    form: {
        gap: 8,
    },
    divider: {
        height: 1,
        marginVertical: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    sectionDesc: {
        fontSize: 14,
        marginBottom: 24,
    },
    questionContainer: {
        marginBottom: 16,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    questionLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    descErrorBox: {
        backgroundColor: '#FEE2E2',
        borderColor: '#FCA5A5',
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginTop: 4,
    },
    descErrorText: {
        color: '#B91C1C',
        fontSize: 13,
        lineHeight: 20,
    },
});

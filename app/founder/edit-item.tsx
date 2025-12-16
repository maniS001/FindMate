import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import CategoryPicker from '../../components/CategoryPicker';
import DatePicker from '../../components/DatePicker';
import CustomImagePicker from '../../components/ImagePicker';
import Input from '../../components/Input';
import { useTheme } from '../../contexts/ThemeContext';
import { getItemById, updateItem } from '../../store';
import { showAlert } from '../../utils/alert';

export default function EditFoundItem() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [form, setForm] = useState({
        name: '',
        category: '',
        location: '',
        description: '',
        questions: [] as { question: string; answer: string; }[],
        contactInfo: '',
        imageUris: [] as string[],
    });
    const [date, setDate] = useState(new Date());
    const [itemStatus, setItemStatus] = useState<string>('OPEN');

    useEffect(() => {
        const fetchItem = async () => {
            if (id) {
                const item = await getItemById(id);
                if (item) {
                    setForm({
                        name: item.name,
                        category: item.category,
                        location: item.location,
                        description: item.description,
                        questions: (item.questions && Array.isArray(item.questions) && item.questions.length > 0)
                            ? item.questions.map((q: any) => ({ question: q.question || '', answer: q.answer || '' }))
                            : [{ question: '', answer: '' }],
                        contactInfo: item.contactInfo,
                        imageUris: item.imageUris || (item.imageUri ? [item.imageUri] : []),
                    });
                    setDate(new Date(item.date));
                    setItemStatus(item.status || 'OPEN');
                } else {
                    showAlert('Error', 'Item not found');
                    router.back();
                }
            }
            setFetching(false);
        };
        fetchItem();
    }, [id]);

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

    const handleSubmit = async () => {
        const areQuestionsValid = form.questions.every(q => q.question.trim() && q.answer.trim());

        if (!form.name || !form.location || !areQuestionsValid || !form.contactInfo) {
            showAlert('Missing Information', 'Please fill in all required fields, including all security questions and answers.');
            return;
        }

        setLoading(true);
        try {
            // Check if we need to convert new images (local URIs)
            // Existing remote images start with http
            const newImages: string[] = [];
            let needsConversion = false;

            // Simple check: if URI doesn't start with http, it's likely local and needs conversion
            // This is a simplification. The backend typically handles base64 in a specific way.
            // If images are mixed (some remote, some local), we should re-upload everything or handle carefully.
            // For now, assuming standard ImagePicker flow:
            // "CustomImagePicker" returns URIs. We probably need to convert ONLY local ones?
            // Or just pass URIs and let backend/model handle if they are strings vs base64?
            // The `addItem` logic imported `convertImagesToBase64`. We should do the same.

            const { convertImagesToBase64 } = await import('../../utils/imageUtils');

            // We need to distinguish between already uploaded URLs and new local URIs.
            // Base64 helper reads file from URI. It might fail on remote URL.
            // We should filter.

            const remoteImages = form.imageUris.filter(uri => uri.startsWith('http'));
            const localImages = form.imageUris.filter(uri => !uri.startsWith('http'));

            const base64LocalImages = localImages.length > 0
                ? await convertImagesToBase64(localImages)
                : [];

            // Combine: keep remote URLs as is, add base64 for new ones?
            // Backend `updateItem` expects `imageUris` as string[] (JSON stringified usually, or handled by body parser).
            // Actually `updateItem` takes Partial<Item>. Item `imageUris` is string[].
            // If we send http URLs, backend should just save them. If we send base64, backend usually uploads them (if configured) or saves as base64 string (bad practice but maybe what's happening).
            // Looking at `addItem` in `report.tsx`:
            // const base64Images = await convertImagesToBase64(form.imageUris);
            // So it sends ALL as base64?
            // If I edit, I download remote URL. I can't convert remote URL to base64 easily without fetching it blob.
            // If I just send `http` URL back, does backend handle it?
            // The backend `addItem` takes `imageUris` and saves it. If it's a string array, Prisma saves it.
            // If we send mixed, it's fine as long as frontend renders them.
            // BUT, if I send base64, does backend upload to cloud? The current backend `index.ts` just saves the string array to DB. 
            // So saving base64 to DB is the current implementation? (Yikes, but okay for prototype).
            // Wait, `app.post('/api/items')`: `imageUris: images`. `images` is the array.
            // Prisma `Item` model has `imageUris String[]`.
            // So yes, it just stores the strings.
            // So if I pass remote URLs, they are stored. If I pass Base64, they are stored.

            const finalImages = [...remoteImages, ...base64LocalImages];

            if (id) {
                await updateItem(id, {
                    name: form.name,
                    category: form.category,
                    location: form.location,
                    date: date.toISOString().split('T')[0],
                    description: form.description,
                    contactInfo: form.contactInfo,
                    imageUris: finalImages,
                    questions: form.questions,
                });
                showAlert('Success', 'Item updated successfully');
                router.back();
            }
        } catch (error) {
            console.error('Update error:', error);
            showAlert('Error', 'Failed to update item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.center}>
                    <Text style={{ color: colors.text }}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

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
                    <Text style={[styles.heading, { color: colors.text }]}>
                        {itemStatus === 'NOTIFIED' ? 'Edit Notification Details' : 'Edit Reported Item'}
                    </Text>
                    <Text style={[styles.subHeader, { color: colors.textSecondary }]}>
                        {itemStatus === 'NOTIFIED'
                            ? 'Update security questions, description, or contact info.'
                            : 'Update details, questions, or status.'}
                    </Text>

                    <View style={styles.form}>
                        {/* Only show these fields for OPEN items */}
                        {itemStatus !== 'NOTIFIED' && (
                            <>
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
                            </>
                        )}

                        <Input
                            label="Description"
                            placeholder="Brief description..."
                            multiline
                            numberOfLines={3}
                            style={{ height: 80, textAlignVertical: 'top' }}
                            value={form.description}
                            onChangeText={(text) => setForm({ ...form, description: text })}
                        />

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Verification Questions</Text>
                        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                            Update or add security questions.
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
                                    value={q.question}
                                    onChangeText={(text) => handleQuestionChange(text, index, 'question')}
                                />

                                <Input
                                    label="Secret Answer"
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
                            label="Contact Info"
                            value={form.contactInfo}
                            onChangeText={(text) => setForm({ ...form, contactInfo: text })}
                            keyboardType="phone-pad"
                        />

                        <View style={styles.actions}>
                            <Button
                                title="Cancel"
                                variant="outline"
                                onPress={() => router.back()}
                                style={{ flex: 1 }}
                            />
                            <Button
                                title="Update Item"
                                onPress={handleSubmit}
                                loading={loading}
                                style={{ flex: 1 }}
                            />
                        </View>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    heading: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    subHeader: {
        fontSize: 16,
        marginBottom: 24,
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
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
});

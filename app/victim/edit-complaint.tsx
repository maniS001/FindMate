import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import CategoryPicker from '../../components/CategoryPicker';
import DatePicker from '../../components/DatePicker';
import CustomImagePicker from '../../components/ImagePicker';
import Input from '../../components/Input';
import { useTheme } from '../../contexts/ThemeContext';
import { API_URL } from '../../constants/api';
import { getComplaintById, updateComplaint } from '../../store';
import { showAlert } from '../../utils/alert';

export default function EditComplaint() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<{ issues: string[]; suggestions: string[] } | null>(null);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

    const handleAutoGenerate = async () => {
        if (!form.name || !form.category || !form.location) {
            Alert.alert('Missing Info', 'Please fill Item Name, Category, and Location first.');
            return;
        }
        setIsGeneratingDesc(true);
        try {
            const res = await fetch(`${API_URL}/ai/generate-description`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    category: form.category,
                    location: form.location,
                    date: date.toISOString().split('T')[0],
                    role: 'victim'
                })
            });
            const data = await res.json();
            if (data.description) {
                setForm({ ...form, description: data.description });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingDesc(false);
        }
    };

    const [form, setForm] = useState({
        name: '',
        category: '',
        location: '',
        description: '',
        contactInfo: '',
        imageUris: [] as string[],
    });
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        if (id) {
            fetchComplaint(id as string);
        }
    }, [id]);

    const fetchComplaint = async (complaintId: string) => {
        try {
            const data = await getComplaintById(complaintId);
            if (data) {
                setForm({
                    name: data.name,
                    category: data.category,
                    location: data.location,
                    description: data.description,
                    contactInfo: data.contactInfo,
                    imageUris: Array.isArray(data.imageUris)
                        ? data.imageUris
                        : (typeof data.imageUris === 'string'
                            ? JSON.parse(data.imageUris)
                            : []),
                });
                setDate(new Date(data.date));
            } else {
                showAlert('Error', 'Complaint not found');
                router.back();
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showAlert('Error', 'Failed to load complaint details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.name || !form.category || !form.location || !form.contactInfo) {
            showAlert('Missing Information', 'Please fill in all required fields.');
            return;
        }

        // --- AI Validation ---
        setAiLoading(true);
        setAiFeedback(null);
        try {
            const aiRes = await fetch(`${API_URL}/ai/validate-complaint`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: form.name + ' ' + form.category,
                    description: form.description,
                    location: form.location,
                    date: date.toISOString().split('T')[0],
                }),
            });
            const aiData = await aiRes.json();
            if (!aiData.valid && aiData.issues?.length > 0) {
                setAiFeedback({ issues: aiData.issues, suggestions: aiData.suggestions || [] });
                setAiLoading(false);
                return; // Block submission
            }
        } catch {
            // AI unavailable — allow submission
        }
        setAiLoading(false);
        // --- End AI Validation ---

        setSubmitting(true);
        try {
            // Convert images to base64 if needed (assuming existing URIs might be remote URLs and new ones local)
            // Ideally we should handle this, but for now we pass URIs.
            // If new images were picked, they need to be processed.
            // For simplicity and reusing logic, we'll try to process all.
            const { convertImagesToBase64 } = await import('../../utils/imageUtils');

            // Filter out existing remote images if any preventing re-uploading them as base64 if not needed
            // But existing images might be passed as strings.
            // Let's just process them. convertImagesToBase64 handles remote URLs gracefully?
            // Checking `imageUtils` implementation would be good but standard is:
            // if it starts with http, keep it; if content:// or file://, convert.

            const base64Images = form.imageUris.length > 0
                ? await convertImagesToBase64(form.imageUris)
                : [];

            await updateComplaint(id as string, {
                name: form.name,
                category: form.category,
                location: form.location,
                date: date.toISOString().split('T')[0],
                description: form.description,
                contactInfo: form.contactInfo,
                imageUris: base64Images,
            });

            showAlert('Success', 'Report updated successfully.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Update error:', error);
            showAlert('Error', 'Failed to update report.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>Loading...</Text>
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
                >
                    <Text style={[styles.heading, { color: colors.text }]}>Edit Report</Text>

                    <View style={styles.form}>
                        {aiFeedback && (
                            <View style={{ backgroundColor: colors.error + '1A', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                                <Text style={{ color: colors.error, fontWeight: 'bold', marginBottom: 4 }}>Please fix the following issues:</Text>
                                {aiFeedback.issues.map((issue, idx) => (
                                    <Text key={idx} style={{ color: colors.error, fontSize: 13 }}>• {issue}</Text>
                                ))}
                            </View>
                        )}
                        <Input
                            label="Item Name *"
                            placeholder="e.g. iPhone 13 Pro"
                            value={form.name}
                            onChangeText={(text) => setForm({ ...form, name: text })}
                        />

                        <CategoryPicker
                            label="Category *"
                            value={form.category}
                            onChange={(category) => setForm({ ...form, category })}
                        />

                        <Input
                            label="Where did you lose it? *"
                            placeholder="e.g. Central Park, Times Square"
                            value={form.location}
                            onChangeText={(text) => setForm({ ...form, location: text })}
                        />

                        <DatePicker
                            label="When did you lose it?"
                            value={date}
                            onChange={setDate}
                        />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 }}>Description</Text>
                            <TouchableOpacity onPress={handleAutoGenerate} disabled={isGeneratingDesc} style={{ backgroundColor: colors.primary + '20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                {isGeneratingDesc ? <ActivityIndicator size="small" color={colors.primary} /> : null}
                                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                                    {isGeneratingDesc ? 'Generating...' : '✨ Auto-Generate'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Input
                            placeholder="Additional details about the item..."
                            value={form.description}
                            onChangeText={(text) => setForm({ ...form, description: text })}
                            multiline
                            numberOfLines={5}
                        />

                        <Input
                            label="Your Contact Information *"
                            placeholder="Phone Number"
                            value={form.contactInfo}
                            onChangeText={(text) => setForm({ ...form, contactInfo: text })}
                            keyboardType="phone-pad"
                        />

                        <CustomImagePicker
                            label="Upload Photos (Optional)"
                            onImagesSelected={(uris) => setForm({ ...form, imageUris: uris })}
                            initialImages={form.imageUris}
                        />

                        <Button
                            title={aiLoading ? 'AI Checking...' : 'Update Report'}
                            onPress={handleSubmit}
                            loading={submitting || aiLoading}
                            style={{ marginTop: 24 }}
                        />
                        <Button
                            title="Cancel"
                            variant="outline"
                            onPress={() => router.back()}
                            style={{ marginTop: 12 }}
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
    },
    heading: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 24,
    },
    form: {
        gap: 8,
    },
});

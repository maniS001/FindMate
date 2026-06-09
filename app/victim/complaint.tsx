import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import CategoryPicker from '../../components/CategoryPicker';
import DatePicker from '../../components/DatePicker';
import CustomImagePicker from '../../components/ImagePicker';
import Input from '../../components/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { API_URL } from '../../constants/api';
import { addComplaint } from '../../store';
import { showAlert } from '../../utils/alert';

export default function FileComplaint() {
    const router = useRouter();
    const { colors } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<{ issues: string[]; suggestions: string[] } | null>(null);

    const [form, setForm] = useState({
        name: '',
        category: '',
        location: '',
        description: '',
        contactInfo: '',
        imageUris: [] as string[],
    });
    const [date, setDate] = useState(new Date());

    const handleAutoGenerate = async () => {
        if (!form.name || !form.category || !form.location) {
            showAlert('Missing Information', 'Please fill Item Name, Category, and Location first.');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/ai/generate-description`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: form.name, category: form.category, 
                    location: form.location, date: date.toISOString().split('T')[0] 
                }),
            });
            const data = await res.json();
            if (data.description) {
                setForm(prev => ({ ...prev, description: data.description }));
            }
        } catch {
            showAlert('Error', 'Failed to auto-generate description.');
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

        setLoading(true);
        try {
            const { convertImagesToBase64 } = await import('../../utils/imageUtils');
            const base64Images = form.imageUris.length > 0
                ? await convertImagesToBase64(form.imageUris)
                : [];

            await addComplaint({
                name: form.name,
                category: form.category,
                location: form.location,
                date: date.toISOString().split('T')[0],
                description: form.description,
                contactInfo: form.contactInfo,
                imageUris: base64Images,
                userId: user?.id,
            });
            router.push({
                pathname: '/success',
                params: { type: 'complaint' }
            });
        } catch (error) {
            console.error('Submit error:', error);
            showAlert('Error', 'Failed to file complaint. Please try again.');
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
                >
                    <Text style={[styles.heading, { color: colors.text }]}>File a Complaint</Text>
                    <Text style={[styles.subHeader, { color: colors.textSecondary }]}>
                        Didn't find your item? File a complaint and we'll notify you if someone reports finding it.
                    </Text>

                    <View style={styles.form}>
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
                            <TouchableOpacity onPress={handleAutoGenerate} style={{ backgroundColor: colors.primary + '20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>✨ Auto-Generate</Text>
                            </TouchableOpacity>
                        </View>
                        <Input
                            placeholder="Additional details about the item..."
                            value={form.description}
                            onChangeText={(text) => setForm({ ...form, description: text })}
                            multiline
                            numberOfLines={4}
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

                        {/* AI Feedback Banner */}
                        {aiFeedback && (
                            <View style={styles.aiBanner}>
                                <Text style={styles.aiBannerTitle}>⚠️ AI Review: Please fix the following</Text>
                                {aiFeedback.issues.map((issue, i) => (
                                    <Text key={i} style={styles.aiIssue}>• {issue}</Text>
                                ))}
                                {aiFeedback.suggestions.length > 0 && (
                                    <>
                                        <Text style={styles.aiSuggestTitle}>💡 Suggestions:</Text>
                                        {aiFeedback.suggestions.map((s, i) => (
                                            <Text key={i} style={styles.aiSuggest}>• {s}</Text>
                                        ))}
                                    </>
                                )}
                            </View>
                        )}

                        <Button
                            title={aiLoading ? 'AI Checking...' : 'Submit Complaint'}
                            onPress={handleSubmit}
                            loading={loading || aiLoading}
                            style={{ marginTop: 24 }}
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
        marginBottom: 8,
    },
    subHeader: {
        fontSize: 16,
        marginBottom: 32,
        lineHeight: 24,
    },
    form: {
        gap: 8,
    },
    aiBanner: {
        backgroundColor: '#FFF3CD',
        borderColor: '#F59E0B',
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        gap: 6,
    },
    aiBannerTitle: {
        fontWeight: '700',
        color: '#92400E',
        fontSize: 14,
        marginBottom: 4,
    },
    aiIssue: {
        color: '#B45309',
        fontSize: 13,
        lineHeight: 20,
    },
    aiSuggestTitle: {
        fontWeight: '600',
        color: '#065F46',
        fontSize: 13,
        marginTop: 8,
    },
    aiSuggest: {
        color: '#047857',
        fontSize: 13,
        lineHeight: 20,
    },
});

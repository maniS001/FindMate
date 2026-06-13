import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import CategoryPicker from '../../components/CategoryPicker';
import DatePicker from '../../components/DatePicker';
import CustomImagePicker from '../../components/ImagePicker';
import Input from '../../components/Input';
import { useTheme } from '../../contexts/ThemeContext';
import { API_URL } from '../../constants/api';

export default function SearchLostItem() {
    const router = useRouter();
    const { colors } = useTheme();
    const [form, setForm] = useState({
        name: '',
        category: '',
        location: '',
        description: '',
        contactInfo: '',
        imageUris: [] as string[],
    });
    const [errors, setErrors] = useState({
        name: '',
        location: '',
        contactInfo: '',
    });
    const [date, setDate] = useState(new Date());
    const [aiLoading, setAiLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<{ issues: string[]; suggestions: string[] } | null>(null);

    const handleSearch = async () => {
        const newErrors = {
            name: !form.name ? 'Item name is required' : '',
            location: !form.location ? 'Location is required' : '',
            contactInfo: !form.contactInfo ? 'Contact info is required' : '',
        };

        setErrors(newErrors);

        if (newErrors.name || newErrors.location || newErrors.contactInfo) {
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
            if (!aiData.valid) {
                setAiFeedback({ 
                    issues: aiData.issues?.length ? aiData.issues : [aiData.reason || 'Invalid data according to AI.'], 
                    suggestions: aiData.suggestions || [] 
                });
                setAiLoading(false);
                return; // Block search
            }
        } catch {
            // AI unavailable — allow search
        }
        setAiLoading(false);
        // --- End AI Validation ---

        router.push({
            pathname: '/victim/results',
            params: {
                ...form,
                date: date.toISOString().split('T')[0],
                imageUris: JSON.stringify(form.imageUris),
            }
        });
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
                    <Text style={[styles.heading, { color: colors.text }]}>Find Lost Item</Text>
                    <Text style={[styles.subHeader, { color: colors.textSecondary }]}>Search for items that have been reported found.</Text>

                    <View style={styles.form}>
                        <Input
                            label="What did you lose? *"
                            placeholder="e.g. Keys, Wallet, Phone"
                            value={form.name}
                            onChangeText={(text) => {
                                setForm({ ...form, name: text });
                                if (errors.name) setErrors({ ...errors, name: '' });
                            }}
                            error={errors.name}
                        />

                        <CategoryPicker
                            label="Category"
                            value={form.category}
                            onChange={(category) => setForm({ ...form, category })}
                        />

                        <Input
                            label="Where did you lose it? *"
                            placeholder="e.g. Central Park"
                            value={form.location}
                            onChangeText={(text) => {
                                setForm({ ...form, location: text });
                                if (errors.location) setErrors({ ...errors, location: '' });
                            }}
                            error={errors.location}
                        />

                        <DatePicker
                            label="When did you lose it?"
                            value={date}
                            onChange={setDate}
                        />

                        <Input
                            label="Description"
                            placeholder="Additional details..."
                            value={form.description}
                            onChangeText={(text) => setForm({ ...form, description: text })}
                            multiline
                            numberOfLines={3}
                        />

                        <Input
                            label="Your Contact Info *"
                            placeholder="Phone Number"
                            value={form.contactInfo}
                            onChangeText={(text) => {
                                setForm({ ...form, contactInfo: text });
                                if (errors.contactInfo) setErrors({ ...errors, contactInfo: '' });
                            }}
                            keyboardType="phone-pad"
                            error={errors.contactInfo}
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
                            title={aiLoading ? 'AI Checking...' : 'Search Items'}
                            onPress={handleSearch}
                            loading={aiLoading}
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
        paddingBottom: 100,
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

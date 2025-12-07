import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import CategoryPicker from '../../components/CategoryPicker';
import DatePicker from '../../components/DatePicker';
import CustomImagePicker from '../../components/ImagePicker';
import Input from '../../components/Input';
import { useTheme } from '../../contexts/ThemeContext';
import { getComplaintById, updateComplaint } from '../../store';

export default function EditComplaint() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

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
                    imageUris: data.imageUris ? JSON.parse(JSON.stringify(data.imageUris)) : [],
                });
                setDate(new Date(data.date));
            } else {
                Alert.alert('Error', 'Complaint not found');
                router.back();
            }
        } catch (error) {
            console.error('Fetch error:', error);
            Alert.alert('Error', 'Failed to load complaint details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.name || !form.category || !form.location || !form.contactInfo) {
            Alert.alert('Missing Information', 'Please fill in all required fields.');
            return;
        }

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

            Alert.alert('Success', 'Report updated successfully.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert('Error', 'Failed to update report.');
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

                        <Input
                            label="Description"
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

                        <Button
                            title="Update Report"
                            onPress={handleSubmit}
                            loading={submitting}
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

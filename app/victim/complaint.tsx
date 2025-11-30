import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import CategoryPicker from '../../components/CategoryPicker';
import DatePicker from '../../components/DatePicker';
import CustomImagePicker from '../../components/ImagePicker';
import Input from '../../components/Input';
import { useTheme } from '../../contexts/ThemeContext';
import { addComplaint } from '../../store';

export default function FileComplaint() {
    const router = useRouter();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: '',
        category: '',
        location: '',
        description: '',
        contactInfo: '',
        imageUris: [] as string[],
    });
    const [date, setDate] = useState(new Date());

    const handleSubmit = async () => {
        if (!form.name || !form.category || !form.location || !form.contactInfo) {
            Alert.alert('Missing Information', 'Please fill in all required fields.');
            return;
        }

        setLoading(true);
        try {
            // Convert images to base64
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
            });
            Alert.alert('Success', 'Your complaint has been filed successfully! You will be notified if a match is found.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Submit error:', error);
            Alert.alert('Error', 'Failed to file complaint. Please try again.');
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
                            placeholder="Phone or Email"
                            value={form.contactInfo}
                            onChangeText={(text) => setForm({ ...form, contactInfo: text })}
                        />

                        <CustomImagePicker
                            label="Upload Photos (Optional)"
                            onImagesSelected={(uris) => setForm({ ...form, imageUris: uris })}
                            initialImages={form.imageUris}
                        />

                        <Button
                            title="Submit Complaint"
                            onPress={handleSubmit}
                            loading={loading}
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
});

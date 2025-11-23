import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import CustomImagePicker from '../../components/ImagePicker';
import Input from '../../components/Input';
import { addComplaint } from '../../store';

export default function FileComplaint() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: '',
        category: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        contactInfo: '',
        imageUris: [] as string[],
    });

    const handleSubmit = async () => {
        if (!form.name || !form.category || !form.location || !form.contactInfo) {
            Alert.alert('Missing Information', 'Please fill in all required fields.');
            return;
        }

        setLoading(true);
        try {
            await addComplaint({
                ...form,
                imageUris: JSON.stringify(form.imageUris),
            });
            Alert.alert('Success', 'Your complaint has been filed successfully! You will be notified if a match is found.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to file complaint. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.header}>File a Complaint</Text>
                <Text style={styles.subHeader}>
                    Didn't find your item? File a complaint and we'll notify you if someone reports finding it.
                </Text>

                <View style={styles.form}>
                    <Input
                        label="Item Name *"
                        placeholder="e.g. iPhone 13 Pro"
                        value={form.name}
                        onChangeText={(text) => setForm({ ...form, name: text })}
                    />

                    <Input
                        label="Category *"
                        placeholder="e.g. Electronics, Keys, Wallet"
                        value={form.category}
                        onChangeText={(text) => setForm({ ...form, category: text })}
                    />

                    <Input
                        label="Where did you lose it? *"
                        placeholder="e.g. Central Park, Times Square"
                        value={form.location}
                        onChangeText={(text) => setForm({ ...form, location: text })}
                    />

                    <Input
                        label="When did you lose it?"
                        placeholder="YYYY-MM-DD"
                        value={form.date}
                        onChangeText={(text) => setForm({ ...form, date: text })}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    content: {
        padding: 24,
    },
    header: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    subHeader: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 32,
        lineHeight: 24,
    },
    form: {
        gap: 8,
    },
});

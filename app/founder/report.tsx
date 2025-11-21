import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import CustomImagePicker from '../../components/ImagePicker';
import Input from '../../components/Input';
import { addItem } from '../../store';

export default function ReportFoundItem() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        category: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        secretQuestion: '',
        secretAnswer: '',
        contactInfo: '',
        imageUri: '',
    });

    const handleSubmit = async () => {
        if (!form.name || !form.location || !form.secretQuestion || !form.secretAnswer || !form.contactInfo) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            addItem({
                id: Math.random().toString(36).substr(2, 9),
                ...form,
            });
            setLoading(false);
            Alert.alert('Success', 'Item reported successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }, 1000);
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.header}>Report Found Item</Text>
                <Text style={styles.subHeader}>Help the owner find their lost belonging.</Text>

                <View style={styles.form}>
                    <CustomImagePicker
                        label="Item Photo"
                        onImageSelected={(uri) => setForm({ ...form, imageUri: uri })}
                    />

                    <Input
                        label="Item Name"
                        placeholder="e.g. Blue Car Keys"
                        value={form.name}
                        onChangeText={(text) => setForm({ ...form, name: text })}
                    />

                    <Input
                        label="Category"
                        placeholder="e.g. Electronics, Keys, Wallet"
                        value={form.category}
                        onChangeText={(text) => setForm({ ...form, category: text })}
                    />

                    <Input
                        label="Location Found"
                        placeholder="e.g. Central Park, near bench"
                        value={form.location}
                        onChangeText={(text) => setForm({ ...form, location: text })}
                    />

                    <Input
                        label="Date Found"
                        placeholder="YYYY-MM-DD"
                        value={form.date}
                        onChangeText={(text) => setForm({ ...form, date: text })}
                    />

                    <Input
                        label="Description (Visible to public)"
                        placeholder="Brief description..."
                        multiline
                        numberOfLines={3}
                        style={{ height: 80, textAlignVertical: 'top' }}
                        value={form.description}
                        onChangeText={(text) => setForm({ ...form, description: text })}
                    />

                    <View style={styles.divider} />
                    <Text style={styles.sectionTitle}>Verification Details</Text>
                    <Text style={styles.sectionDesc}>
                        These details are hidden and used to verify the owner.
                    </Text>

                    <Input
                        label="Secret Question"
                        placeholder="e.g. What is the keychain character?"
                        value={form.secretQuestion}
                        onChangeText={(text) => setForm({ ...form, secretQuestion: text })}
                    />

                    <Input
                        label="Secret Answer"
                        placeholder="The correct answer to the question"
                        secureTextEntry
                        value={form.secretAnswer}
                        onChangeText={(text) => setForm({ ...form, secretAnswer: text })}
                    />

                    <Input
                        label="Your Contact Info (Hidden)"
                        placeholder="Phone or Email (shared only after verification)"
                        value={form.contactInfo}
                        onChangeText={(text) => setForm({ ...form, contactInfo: text })}
                    />

                    <Button
                        title="Report Item"
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
    },
    form: {
        gap: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    sectionDesc: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 24,
    },
});

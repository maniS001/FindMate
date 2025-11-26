import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import CustomImagePicker from '../../components/ImagePicker';
import Input from '../../components/Input';
import { useTheme } from '../../contexts/ThemeContext';

export default function SearchLostItem() {
    const router = useRouter();
    const { colors } = useTheme();
    const [form, setForm] = useState({
        name: '',
        category: '',
        location: '',
        date: '',
        description: '',
        contactInfo: '',
        imageUris: [] as string[],
    });

    const handleSearch = () => {
        router.push({
            pathname: '/victim/results',
            params: {
                ...form,
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
                            onChangeText={(text) => setForm({ ...form, name: text })}
                        />

                        <Input
                            label="Category"
                            placeholder="e.g. Electronics, Keys, Wallet"
                            value={form.category}
                            onChangeText={(text) => setForm({ ...form, category: text })}
                        />

                        <Input
                            label="Where did you lose it? *"
                            placeholder="e.g. Central Park"
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
                            placeholder="Additional details..."
                            value={form.description}
                            onChangeText={(text) => setForm({ ...form, description: text })}
                            multiline
                            numberOfLines={3}
                        />

                        <Input
                            label="Your Contact Info *"
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
                            title="Search Items"
                            onPress={handleSearch}
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
});

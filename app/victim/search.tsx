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

    const handleSearch = () => {
        const newErrors = {
            name: !form.name ? 'Item name is required' : '',
            location: !form.location ? 'Location is required' : '',
            contactInfo: !form.contactInfo ? 'Contact info is required' : '',
        };

        setErrors(newErrors);

        if (newErrors.name || newErrors.location || newErrors.contactInfo) {
            return;
        }

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

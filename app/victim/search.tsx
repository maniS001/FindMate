import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function SearchLostItem() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');

    const handleSearch = () => {
        router.push({
            pathname: '/victim/results',
            params: { query, location, date }
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.header}>Find Lost Item</Text>
                <Text style={styles.subHeader}>Search for items that have been reported found.</Text>

                <View style={styles.form}>
                    <Input
                        label="What did you lose?"
                        placeholder="e.g. Keys, Wallet, Phone"
                        value={query}
                        onChangeText={setQuery}
                    />

                    <Input
                        label="Where did you lose it?"
                        placeholder="e.g. Central Park"
                        value={location}
                        onChangeText={setLocation}
                    />

                    <Input
                        label="When did you lose it?"
                        placeholder="YYYY-MM-DD"
                        value={date}
                        onChangeText={setDate}
                    />

                    <Button
                        title="Search Items"
                        onPress={handleSearch}
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
});

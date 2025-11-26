import { useRouter } from 'expo-router';
import { Calendar, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { useTheme } from '../../contexts/ThemeContext';
import { Complaint, getComplaints, searchComplaints } from '../../store';

export default function ViewComplaints() {
    const router = useRouter();
    const { colors } = useTheme();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadComplaints();
    }, []);

    const loadComplaints = async () => {
        const allComplaints = await getComplaints();
        setComplaints(allComplaints);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadComplaints();
            return;
        }

        setLoading(true);
        const results = await searchComplaints(searchQuery);
        setComplaints(results);
        setLoading(false);
    };

    const renderItem = ({ item }: { item: Complaint }) => {
        const images = item.imageUris ? JSON.parse(item.imageUris) : [];

        return (
            <Card style={styles.card}>
                {images.length > 0 && (
                    <Image
                        source={{ uri: images[0] }}
                        style={styles.itemImage}
                        resizeMode="cover"
                    />
                )}

                <View style={styles.itemHeader}>
                    <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Lost</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <MapPin size={16} color={colors.textSecondary} />
                    <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>{item.location}</Text>
                </View>

                <View style={styles.row}>
                    <Calendar size={16} color={colors.textSecondary} />
                    <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>{item.date}</Text>
                </View>

                <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    <Text style={[styles.contact, { color: colors.text }]}>{item.contactInfo}</Text>
                </View>
            </Card>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>Lost Item Complaints</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Search complaints to check if someone is looking for the item you found
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={0}
            >
                <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                    <Input
                        label="Search"
                        placeholder="Search by name, location, or category..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <Button title="Search" onPress={handleSearch} loading={loading} />
                </View>

                <FlatList
                    data={complaints}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {searchQuery ? 'No matching complaints found' : 'No complaints yet'}
                            </Text>
                        </View>
                    }
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
    },
    searchBar: {
        padding: 16,
        borderBottomWidth: 1,
        gap: 12,
    },
    list: {
        padding: 16,
        gap: 16,
    },
    card: {
        overflow: 'hidden',
    },
    itemImage: {
        width: '100%',
        height: 200,
        marginBottom: 16,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    badge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#92400E',
        fontSize: 12,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    itemMeta: {
        fontSize: 14,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 8,
    },
    footer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    contact: {
        fontSize: 14,
        fontWeight: '500',
    },
    empty: {
        padding: 48,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
});

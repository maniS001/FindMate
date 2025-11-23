import { useRouter } from 'expo-router';
import { Calendar, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { Complaint, getComplaints, searchComplaints } from '../../store';

export default function ViewComplaints() {
    const router = useRouter();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadComplaints();
    }, []);

    const loadComplaints = async () => {
        setLoading(true);
        const data = await getComplaints();
        setComplaints(data);
        setLoading(false);
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
        let imageUris: string[] = [];
        try {
            imageUris = item.imageUris ? JSON.parse(item.imageUris) : [];
        } catch (e) {
            imageUris = [];
        }

        return (
            <Card style={styles.itemCard}>
                {imageUris.length > 0 && (
                    <Image
                        source={{ uri: imageUris[0] }}
                        style={styles.itemImage}
                        resizeMode="cover"
                    />
                )}

                <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Lost</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <MapPin size={16} color="#64748B" />
                    <Text style={styles.itemMeta}>{item.location}</Text>
                </View>

                <View style={styles.row}>
                    <Calendar size={16} color="#64748B" />
                    <Text style={styles.itemMeta}>{item.date}</Text>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={styles.footer}>
                    <Text style={styles.contactText}>Contact: {item.contactInfo}</Text>
                </View>
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <View style={styles.header}>
                <Text style={styles.title}>Lost Item Complaints</Text>
                <Text style={styles.subtitle}>
                    Search complaints to check if someone is looking for the item you found
                </Text>
            </View>

            <View style={styles.searchBar}>
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
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'No complaints found matching your search.' : 'No open complaints at the moment.'}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
        lineHeight: 20,
    },
    searchBar: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        gap: 8,
    },
    list: {
        padding: 24,
        gap: 16,
    },
    itemImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: '#F1F5F9',
    },
    itemCard: {
        gap: 8,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        flex: 1,
    },
    badge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400E',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    itemMeta: {
        fontSize: 14,
        color: '#64748B',
    },
    description: {
        fontSize: 14,
        color: '#475569',
        marginTop: 4,
        lineHeight: 20,
    },
    footer: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    contactText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
    },
});

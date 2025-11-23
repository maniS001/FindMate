import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, ChevronRight, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { addComplaint, Item, searchItems } from '../../store';

export default function SearchResults() {
    const params = useLocalSearchParams<{
        name: string;
        category: string;
        location: string;
        date: string;
        description: string;
        contactInfo: string;
        imageUris: string;
    }>();
    const router = useRouter();
    const [results, setResults] = useState<Item[]>([]);
    const [filing, setFiling] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (params.name) {
                const items = await searchItems(params.name);
                setResults(items);
            }
        };
        fetchResults();
    }, [params.name]);

    const handleFileComplaint = async () => {
        if (!params.name || !params.location || !params.contactInfo) {
            Alert.alert('Missing Information', 'Please go back and fill in required fields (item name, location, contact info).');
            return;
        }

        setFiling(true);
        try {
            await addComplaint({
                name: params.name,
                category: params.category || '',
                location: params.location,
                date: params.date || new Date().toISOString().split('T')[0],
                description: params.description || '',
                contactInfo: params.contactInfo,
                imageUris: params.imageUris || '[]',
            });
            router.push({
                pathname: '/success',
                params: { type: 'complaint' }
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to file complaint. Please try again.');
        } finally {
            setFiling(false);
        }
    };

    const renderItem = ({ item }: { item: Item }) => {
        const imageUris = item.imageUris || (item.imageUri ? [item.imageUri] : []);

        return (
            <TouchableOpacity
                onPress={() => router.push(`/victim/claim/${item.id}`)}
                activeOpacity={0.9}
            >
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
                            <Text style={styles.badgeText}>Found</Text>
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
                        <Text style={styles.claimText}>Tap to Claim</Text>
                        <ChevronRight size={20} color="#3B82F6" />
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <View style={styles.header}>
                <Text style={styles.title}>Results for "{params.name}"</Text>
                <Text style={styles.subtitle}>{results.length} items found</Text>
            </View>

            <FlatList
                data={results}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No items found matching your search.</Text>
                    </View>
                }
            />

            <View style={styles.complainButtonContainer}>
                <Text style={styles.complainHint}>
                    {results.length > 0
                        ? "Didn't find your item in the list above?"
                        : "No matches found?"}
                </Text>
                <Button
                    title="File a Complaint"
                    onPress={handleFileComplaint}
                    loading={filing}
                    variant="secondary"
                />
                <Text style={styles.complainSubtext}>
                    We'll notify you if someone reports finding a matching item
                </Text>
            </View>
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
    },
    badge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#166534',
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    claimText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
        marginRight: 4,
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
    complainButtonContainer: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    complainHint: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 12,
    },
    complainSubtext: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
    },
});

import { useRouter } from 'expo-router';
import { Calendar, MapPin, Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../components/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { Complaint, getComplaints, searchComplaints } from '../../store';

export default function ViewComplaints() {
    const router = useRouter();
    const { colors } = useTheme();
    const { width } = useWindowDimensions();
    const numColumns = width >= 600 ? 2 : 1;
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadComplaints();
    }, []);

    const loadComplaints = async () => {
        setLoading(true);
        try {
            const allComplaints = await getComplaints();
            setComplaints(allComplaints);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadComplaints();
            return;
        }

        setLoading(true);
        try {
            const results = await searchComplaints(searchQuery);
            setComplaints(results);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Complaint }) => {
        let images: string[] = [];
        try {
            if (Array.isArray(item.imageUris)) {
                images = item.imageUris;
            } else {
                const parsed = item.imageUris ? JSON.parse(item.imageUris) : [];
                if (Array.isArray(parsed)) {
                    images = parsed;
                } else if (typeof parsed === 'string') {
                    images = [parsed];
                }
            }
        } catch (e) {
            console.log('Error parsing images:', e);
        }

        return (
            <TouchableOpacity
                onPress={() => router.push({
                    pathname: '/founder/complaint-detail',
                    params: { id: item.id }
                })}
                activeOpacity={0.9}
                style={styles.cardWrapper}
            >
                <Card style={styles.card}>
                    {images.length > 0 ? (
                        <Image
                            source={{ uri: images[0] }}
                            style={styles.itemImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={[styles.itemImage, styles.noImagePlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.noImageText, { color: colors.textSecondary }]}>No Image</Text>
                        </View>
                    )}

                    <View style={styles.itemHeader}>
                        <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                        <View style={[
                            styles.badge,
                            item.status === 'NOTIFIED' && { backgroundColor: colors.primary + '20' }
                        ]}>
                            <Text style={[
                                styles.badgeText,
                                item.status === 'NOTIFIED' && { color: colors.primary }
                            ]}>
                                {item.status === 'NOTIFIED' ? 'Notified' : 'Lost'}
                            </Text>
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

                    {item.cashPrize && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, backgroundColor: colors.success + '15', padding: 6, borderRadius: 8, alignSelf: 'flex-start' }}>
                            <Text style={{ fontSize: 16 }}>💰</Text>
                            <Text style={{ color: colors.success, fontWeight: '700', fontSize: 12 }}>Reward: {item.cashPrize}</Text>
                        </View>
                    )}

                    <Text style={[styles.description, { color: colors.textSecondary, marginTop: 8 }]} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <Text style={[styles.contact, { color: colors.text }]}>{item.contactInfo}</Text>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={0}
            >
                <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                    <View style={styles.searchRow}>
                        <TextInput
                            style={[
                                styles.searchInput,
                                {
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                    color: colors.text
                                }
                            ]}
                            placeholder="Search by name, location, or category..."
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                        />
                        <TouchableOpacity
                            onPress={handleSearch}
                            style={[styles.searchButton, { backgroundColor: colors.primary }]}
                            activeOpacity={0.7}
                        >
                            <Search size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.searchHint, { color: colors.textSecondary }]}>
                        Find complaints matching the item you found
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading complaints...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={complaints}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        key={numColumns}
                        numColumns={numColumns}
                        contentContainerStyle={styles.list}
                        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    {searchQuery ? 'No matching complaints found' : 'No complaints yet'}
                                </Text>
                                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                    If you found an item that isn't listed here, please report it.
                                </Text>
                            </View>
                        }
                    />
                )}

                <View style={[styles.bottomAction, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                    <Text style={[styles.actionText, { color: colors.text }]}>
                        Didn't find a matching complaint?
                    </Text>
                    <TouchableOpacity
                        style={[styles.reportButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/founder/report')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.reportButtonText}>Report New Item</Text>
                    </TouchableOpacity>
                </View>
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
        marginBottom: 0,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
    },
    searchContainer: {
        padding: 16,
        borderBottomWidth: 1,
        gap: 8,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    searchButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchHint: {
        fontSize: 13,
        lineHeight: 18,
    },
    list: {
        padding: 16,
        gap: 16,
    },
    cardWrapper: {
        flex: 1,
    },
    card: {
        overflow: 'hidden',
        flex: 1,
    },
    columnWrapper: {
        gap: 16,
    },
    itemImage: {
        width: '100%',
        aspectRatio: 4 / 3,
        marginBottom: 16,
        backgroundColor: '#F1F5F9',
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
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    bottomAction: {
        padding: 24,
        borderTopWidth: 1,
        alignItems: 'center',
        gap: 16,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '500',
    },
    reportButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reportButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    noImagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    noImageText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

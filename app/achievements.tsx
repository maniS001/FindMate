import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Award, Calendar, MapPin } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import { useTheme } from '../contexts/ThemeContext';
import { Complaint, getClosedComplaints, getRecoveredItems, Item } from '../store';

export default function AchievementsScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const [items, setItems] = useState<(Complaint | Item)[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchAchievements();
        }, [])
    );

    const fetchAchievements = async () => {
        try {
            const [complaintsData, recoveredItems] = await Promise.all([
                getClosedComplaints(),
                getRecoveredItems()
            ]);

            // Normalize and merge (simplistic approach, just concat)
            const combined = [...complaintsData, ...recoveredItems].sort((a, b) => {
                const dateA = new Date((a as any).resolvedAt || (a as any).recoveredAt || a.date).getTime();
                const dateB = new Date((b as any).resolvedAt || (b as any).recoveredAt || b.date).getTime();
                return dateB - dateA;
            });

            setItems(combined);
        } catch (error) {
            console.error('Failed to fetch achievements', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Complaint | Item }) => {
        let imageUri = null;
        if (item.imageUris) {
            try {
                const parsed = typeof item.imageUris === 'string' ? JSON.parse(item.imageUris) : item.imageUris;
                if (Array.isArray(parsed) && parsed.length > 0) imageUri = parsed[0];
                else if (typeof parsed === 'string') imageUri = parsed;
            } catch (e) {
                if (typeof item.imageUris === 'string') imageUri = item.imageUris;
            }
        }

        return (
            <Card style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}>
                        <Award size={24} color="#166534" />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={[styles.resolvedText, { color: '#166534' }]}>
                            Recovered Successfully
                        </Text>
                    </View>
                </View>

                {imageUri && (
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.itemImage}
                        resizeMode="cover"
                    />
                )}

                <View style={styles.details}>
                    <View style={styles.row}>
                        <MapPin size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.location}</Text>
                    </View>
                    <View style={styles.row}>
                        <Calendar size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                            {item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString() : item.date}
                        </Text>
                    </View>
                </View>

                )}

                {/* Show Feedback if available (for recovered items) */}
                {'feedbackComment' in item && item.feedbackComment && (
                    <View style={[styles.reasonContainer, { backgroundColor: colors.background, marginTop: 8 }]}>
                        <Text style={[styles.reasonLabel, { color: colors.textSecondary }]}>Victim Feedback:</Text>
                        <Text style={[styles.reasonText, { color: colors.text }]} numberOfLines={2}>
                            "{item.feedbackComment}"
                        </Text>
                    </View>
                )}
            </Card>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Success Stories</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <Text style={[styles.statsText, { color: colors.textSecondary }]}>
                                {items.length} items recovered and returned to their owners!
                            </Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No success stories yet. Be the first one!
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    list: {
        padding: 16,
        gap: 16,
    },
    listHeader: {
        marginBottom: 8,
        alignItems: 'center',
    },
    statsText: {
        fontSize: 14,
        fontWeight: '600',
    },
    card: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '700',
    },
    resolvedText: {
        fontSize: 12,
        fontWeight: '600',
    },
    itemImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 12,
    },
    details: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 12,
    },
    reasonContainer: {
        padding: 12,
        borderRadius: 8,
    },
    reasonLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    reasonText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
    },
});

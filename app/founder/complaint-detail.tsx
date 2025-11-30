import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, MapPin, Phone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { Complaint, getComplaintById } from '../../store';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width - 48; // 24px padding on each side

export default function ComplaintDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors } = useTheme();
    const router = useRouter();
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComplaint = async () => {
            if (id) {
                const fetchedComplaint = await getComplaintById(id);
                setComplaint(fetchedComplaint);
            }
            setLoading(false);
        };
        fetchComplaint();
    }, [id]);

    const handleCall = () => {
        if (!complaint?.contactInfo) return;

        const phone = complaint.contactInfo.replace(/[^0-9+]/g, '');
        Linking.openURL(`tel:${phone}`).catch(() => {
            Alert.alert('Error', 'Unable to make a call');
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.center}>
                    <Text style={{ color: colors.text }}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!complaint) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.center}>
                    <Text style={{ color: colors.text }}>Complaint not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    let images: string[] = [];
    if (complaint.imageUris && Array.isArray(complaint.imageUris)) {
        images = complaint.imageUris;
    } else if (typeof complaint.imageUris === 'string') {
        try {
            const parsed = JSON.parse(complaint.imageUris);
            if (Array.isArray(parsed)) images = parsed;
            else images = [complaint.imageUris];
        } catch (e) {
            images = [complaint.imageUris];
        }
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Card>
                    {images.length > 0 && (
                        <View style={styles.imageContainer}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.imageScrollContent}
                                snapToInterval={IMAGE_WIDTH}
                                decelerationRate="fast"
                                pagingEnabled={false}
                            >
                                {images.map((uri: string, index: number) => (
                                    <Image
                                        key={index}
                                        source={{ uri }}
                                        style={styles.scrollImage}
                                        resizeMode="cover"
                                    />
                                ))}
                            </ScrollView>
                            {images.length > 1 && (
                                <View style={styles.pagination}>
                                    <Text style={styles.paginationText}>
                                        Swipe to see more photos ({images.length})
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.header}>
                        <Text style={[styles.itemName, { color: colors.text }]}>{complaint.name}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Lost Item</Text>
                        </View>
                    </View>

                    {complaint.category && (
                        <View style={styles.categoryContainer}>
                            <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>Category:</Text>
                            <Text style={[styles.categoryValue, { color: colors.text }]}>{complaint.category}</Text>
                        </View>
                    )}

                    <View style={styles.section}>
                        <View style={styles.infoRow}>
                            <MapPin size={20} color={colors.primary} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Location</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>{complaint.location}</Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Calendar size={20} color={colors.primary} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Date Lost</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>{complaint.date}</Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Phone size={20} color={colors.primary} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Contact</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>{complaint.contactInfo}</Text>
                            </View>
                        </View>
                    </View>

                    {complaint.description && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                            <Text style={[styles.description, { color: colors.textSecondary }]}>
                                {complaint.description}
                            </Text>
                        </View>
                    )}
                </Card>

                <Button
                    title="Call Owner"
                    onPress={handleCall}
                    style={{ marginTop: 16 }}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    imageContainer: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    imageScrollContent: {
        gap: 0,
    },
    scrollImage: {
        width: IMAGE_WIDTH,
        height: 300,
    },
    pagination: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    paginationText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    itemName: {
        fontSize: 28,
        fontWeight: '700',
        flex: 1,
    },
    badge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    categoryContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    categoryValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
});

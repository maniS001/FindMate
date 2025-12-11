import { useRouter } from 'expo-router';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../constants/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface Notification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    type?: string;
    payload?: string;
}

export default function NotificationsScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Notification }) => {
        let payload: any = {};
        try {
            payload = item.payload ? JSON.parse(item.payload) : {};
        } catch (e) {
            console.error('Error parsing notification payload', e);
        }

        const isClaimRequest = item.type === 'CLAIM_REQUEST';

        // Check if the related complaint is already resolved/closed
        const complaintStatus = payload.complaintStatus;
        const isResolved = complaintStatus === 'RESOLVED' || complaintStatus === 'CLOSED';

        const handleClaim = () => {
            router.push({
                pathname: '/victim/verify-notification',
                params: {
                    payload: item.payload,
                    notificationId: item.id
                }
            });
        };

        return (
            <View style={[styles.notificationItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: isResolved ? '#10B981' + '20' : colors.primary + '20' }]}>
                    <Bell size={20} color={isResolved ? '#10B981' : colors.primary} />
                </View>
                <View style={styles.contentContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.message, { color: colors.textSecondary }]}>{item.message}</Text>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                    {isClaimRequest && (
                        isResolved ? (
                            <View style={[styles.recoveredBadge, { backgroundColor: '#10B981' + '20' }]}>
                                <Text style={[styles.recoveredText, { color: '#10B981' }]}>✓ Recovered</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.claimButton, { backgroundColor: colors.primary }]}
                                onPress={handleClaim}
                            >
                                <Text style={styles.claimButtonText}>Verify & Claim</Text>
                            </TouchableOpacity>
                        )
                    )}
                </View>
                {!item.read && (
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.center}>
                    <Bell size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        No notifications yet
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
    },
    list: {
        padding: 16,
        gap: 12,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 16,
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
        gap: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
    },
    date: {
        fontSize: 12,
        marginTop: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 6,
    },
    claimButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 8,
    },
    claimButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    recoveredBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 8,
    },
    recoveredText: {
        fontWeight: '600',
        fontSize: 14,
    },
});

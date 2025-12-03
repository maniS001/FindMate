import { useRouter } from 'expo-router';
import { ArrowLeft, FileText, LogOut, Package } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../constants/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function AccountScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { user, logout, token } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setProfile(data);
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>My Account</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <LogOut size={24} color={colors.error} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Card */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarText}>
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <View>
                            <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
                            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Package size={24} color={colors.primary} />
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {profile?.items?.length || 0}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Items Reported</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <FileText size={24} color={colors.primary} />
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {profile?.complaints?.length || 0}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Complaints Filed</Text>
                    </View>
                </View>

                {/* History Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>

                {profile?.items?.length === 0 && profile?.complaints?.length === 0 ? (
                    <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No activity yet. Start by reporting an item or filing a complaint.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.historyList}>
                        {profile?.items?.map((item: any) => (
                            <View key={item.id} style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={styles.historyIcon}>
                                    <Package size={20} color={colors.primary} />
                                </View>
                                <View style={styles.historyContent}>
                                    <Text style={[styles.historyTitle, { color: colors.text }]}>Reported: {item.name}</Text>
                                    <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{item.date}</Text>
                                </View>
                                <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                                    <Text style={[styles.badgeText, { color: colors.primary }]}>Item</Text>
                                </View>
                            </View>
                        ))}

                        {profile?.complaints?.map((complaint: any) => (
                            <View key={complaint.id} style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={styles.historyIcon}>
                                    <FileText size={20} color={colors.error} />
                                </View>
                                <View style={styles.historyContent}>
                                    <Text style={[styles.historyTitle, { color: colors.text }]}>Filed: {complaint.name}</Text>
                                    <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{complaint.date}</Text>
                                </View>
                                <View style={[styles.badge, { backgroundColor: colors.error + '20' }]}>
                                    <Text style={[styles.badgeText, { color: colors.error }]}>Complaint</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
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
    logoutButton: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        padding: 24,
        gap: 24,
    },
    card: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
    },
    avatarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    userEmail: {
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        gap: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: -8,
    },
    emptyState: {
        padding: 32,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
    },
    historyList: {
        gap: 12,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyContent: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    historyDate: {
        fontSize: 12,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});

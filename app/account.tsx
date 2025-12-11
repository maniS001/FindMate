import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Bell, CheckCircle, Edit2, FileText, LogOut, Package, RefreshCw, Star, XCircle } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmModal from '../components/ConfirmModal';
import FeedbackModal from '../components/FeedbackModal';
import ReasonModal from '../components/ReasonModal';
import { API_URL } from '../constants/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getClaimedItems, getNotifications, Notification, recoverItem, updateComplaintStatus } from '../store';

export default function AccountScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { user, logout, token } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'CLOSED' | 'CLAIMED'>('ACTIVE');
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'CLOSE' | 'REOPEN'>('CLOSE');
    const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Claimed Items
    const [claimedItems, setClaimedItems] = useState<any[]>([]);

    // Notifications
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [selectedComplaintIdForResolve, setSelectedComplaintIdForResolve] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const fetchProfile = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_URL}/auth/me?_t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setProfile(data);

            // Fetch claimed items
            if (user?.id) {
                const items = await getClaimedItems(user.id);
                setClaimedItems(items);
            }

            // Fetch notifications
            const notifs = await getNotifications(token);
            setNotifications(notifs);
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setLogoutModalVisible(true);
    };

    const confirmLogout = async () => {
        await logout();
        setLogoutModalVisible(false);
    };

    const handleAction = (id: string, type: 'CLOSE' | 'REOPEN') => {
        setSelectedComplaintId(id);
        setModalType(type);
        setModalVisible(true);
    };

    const handleSubmitReason = async (reason: string) => {
        if (!selectedComplaintId) return;

        setActionLoading(true);
        try {
            const newStatus = modalType === 'CLOSE' ? 'CLOSED' : 'OPEN';
            await updateComplaintStatus(selectedComplaintId, newStatus, reason);
            await fetchProfile();
            setModalVisible(false);
            Alert.alert('Success', `Complaint ${modalType === 'CLOSE' ? 'closed' : 'reopened'} successfully.`);
        } catch (error) {
            Alert.alert('Error', 'Failed to update complaint status.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkRecovered = (itemId: string) => {
        setSelectedItemId(itemId);
        setSelectedComplaintIdForResolve(null);
        setShowFeedbackModal(true);
    };

    const handleMarkComplaintResolved = (complaintId: string) => {
        setSelectedComplaintIdForResolve(complaintId);
        setSelectedItemId(null);
        setShowFeedbackModal(true);
    };

    const handleSubmitFeedback = async (rating: number, comment: string) => {
        setActionLoading(true);
        try {
            if (selectedItemId) {
                // Item recovery flow (claimed item)
                await recoverItem(selectedItemId, { rating, comment });
            } else if (selectedComplaintIdForResolve) {
                // Complaint resolution flow
                // Update complaint to RESOLVED with feedback
                const response = await fetch(`${API_URL}/complaints/${selectedComplaintIdForResolve}/resolve`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ rating, comment }),
                });
                if (!response.ok) throw new Error('Failed to resolve complaint');
            }
            await fetchProfile();
            setShowFeedbackModal(false);
            Alert.alert('Success', 'Marked as resolved! Thank you for your feedback.');
        } catch (error) {
            Alert.alert('Error', 'Failed to mark as resolved.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerifyAndClaim = (complaintId: string) => {
        const relatedNotification = notifications.find(n => {
            try {
                const payload = n.payload ? JSON.parse(n.payload) : {};
                return payload.complaintId === complaintId;
            } catch (e) {
                return false;
            }
        });

        if (relatedNotification && relatedNotification.payload) {
            const payload = JSON.parse(relatedNotification.payload);
            router.push({
                pathname: '/victim/verify-notification',
                params: {
                    payload: relatedNotification.payload,
                    notificationId: relatedNotification.id
                }
            });
        } else {
            Alert.alert('Error', 'Could not find notification details for this verification.');
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const activeComplaints = profile?.complaints?.filter((c: any) => c.status !== 'CLOSED' && c.status !== 'RESOLVED') || [];
    const closedComplaints = profile?.complaints?.filter((c: any) => c.status === 'CLOSED' || c.status === 'RESOLVED') || [];

    const renderComplaintItem = (complaint: any, isClosed: boolean) => {
        const isNotified = complaint.status === 'NOTIFIED';

        return (
            <View key={complaint.id} style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.historyIcon}>
                    {isNotified ? (
                        <Bell size={20} color={colors.primary} />
                    ) : (
                        <FileText size={20} color={isClosed ? colors.success : colors.error} />
                    )}
                </View>
                <View style={styles.historyContent}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.historyTitle, { color: colors.text }]}>{complaint.name}</Text>
                        {isNotified && (
                            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={[styles.badgeText, { color: colors.primary }]}>NOTIFIED</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{complaint.date}</Text>
                    {isClosed && complaint.closureReason && (
                        <Text style={[styles.reasonText, { color: colors.textSecondary }]}>Reason: {complaint.closureReason}</Text>
                    )}
                </View>

                {/* Actions for Active (Open/Notified) Complaints */}
                {!isClosed && (
                    <View style={{ gap: 8 }}>
                        {isNotified ? (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.success + '10' }]}
                                onPress={() => handleVerifyAndClaim(complaint.id)}
                            >
                                <CheckCircle size={16} color={colors.success} />
                                <Text style={[styles.actionText, { color: colors.success }]}>Verify & Claim</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.primary + '10' }]}
                                onPress={() => router.push({ pathname: '/victim/edit-complaint', params: { id: complaint.id } })}
                            >
                                <Edit2 size={16} color={colors.primary} />
                                <Text style={[styles.actionText, { color: colors.primary }]}>Edit Report</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.error + '10' }]}
                            onPress={() => handleAction(complaint.id, 'CLOSE')}
                        >
                            <XCircle size={16} color={colors.error} />
                            <Text style={[styles.actionText, { color: colors.error }]}>Close</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Action for Closed Complaints */}
                {isClosed && (
                    complaint.status === 'RESOLVED' ? (
                        <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
                            <Text style={[styles.badgeText, { color: colors.success }]}>✓ RESOLVED</Text>
                        </View>
                    ) : (
                        <View style={{ gap: 8 }}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.success + '10' }]}
                                onPress={() => handleMarkComplaintResolved(complaint.id)}
                            >
                                <CheckCircle size={16} color={colors.success} />
                                <Text style={[styles.actionText, { color: colors.success }]}>Mark as Resolved</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.primary + '10' }]}
                                onPress={() => handleAction(complaint.id, 'REOPEN')}
                            >
                                <RefreshCw size={16} color={colors.primary} />
                                <Text style={[styles.actionText, { color: colors.primary }]}>Raise Again</Text>
                            </TouchableOpacity>
                        </View>
                    )
                )}
            </View>
        );
    };

    const renderClaimedItem = (item: any) => (
        <View key={item.id} style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.historyIcon}>
                <Package size={20} color={colors.primary} />
            </View>
            <View style={styles.historyContent}>
                <Text style={[styles.historyTitle, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{item.date}</Text>
                {item.status === 'RECOVERED' && (
                    <Text style={[styles.reasonText, { color: colors.success }]}>Recovered</Text>
                )}
            </View>

            {item.status === 'CLAIMED' ? (
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleMarkRecovered(item.id)}
                >
                    <Text style={[styles.actionText, { color: 'white' }]}>Mark Recovered</Text>
                </TouchableOpacity>
            ) : (
                <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
                    <Text style={[styles.badgeText, { color: colors.success }]}>RECOVERED</Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ReasonModal
                visible={modalVisible}
                type={modalType}
                onClose={() => setModalVisible(false)}
                onSubmit={handleSubmitReason}
                loading={actionLoading}
            />
            <FeedbackModal
                visible={showFeedbackModal}
                onClose={() => setShowFeedbackModal(false)}
                onSubmit={handleSubmitFeedback}
                loading={actionLoading}
            />

            <ConfirmModal
                visible={logoutModalVisible}
                title="Logout"
                message="Are you sure you want to logout?"
                onConfirm={confirmLogout}
                onCancel={() => setLogoutModalVisible(false)}
                confirmText="Logout"
                type="danger"
            />

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

                {/* Reported Items (Lost) Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>My Complaints</Text>

                <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'ACTIVE' && { borderBottomColor: colors.primary }]}
                        onPress={() => setActiveTab('ACTIVE')}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'ACTIVE' ? colors.primary : colors.textSecondary }
                        ]}>Active ({activeComplaints.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'CLOSED' && { borderBottomColor: colors.primary }]}
                        onPress={() => setActiveTab('CLOSED')}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'CLOSED' ? colors.primary : colors.textSecondary }
                        ]}>Closed ({closedComplaints.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'CLAIMED' && { borderBottomColor: colors.primary }]}
                        onPress={() => setActiveTab('CLAIMED')}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'CLAIMED' ? colors.primary : colors.textSecondary }
                        ]}>Claimed ({claimedItems.length})</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.historyList}>
                    {activeTab === 'ACTIVE' ? (
                        activeComplaints.length > 0 ? (
                            activeComplaints.map((c: any) => renderComplaintItem(c, false))
                        ) : (
                            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No active complaints.
                                </Text>
                            </View>
                        )
                    ) : activeTab === 'CLOSED' ? (
                        closedComplaints.length > 0 ? (
                            closedComplaints.map((c: any) => renderComplaintItem(c, true))
                        ) : (
                            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No closed complaints.
                                </Text>
                            </View>
                        )
                    ) : (
                        claimedItems.length > 0 ? (
                            claimedItems.map((item: any) => renderClaimedItem(item))
                        ) : (
                            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No claimed items.
                                </Text>
                            </View>
                        )
                    )}
                </View>

                {/* Reported Items (Found) Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Reported Items</Text>

                {(!profile?.items || profile?.items?.length === 0) ? (
                    <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No items reported yet.
                        </Text>
                    </View>
                ) : (
                    <View style={{ gap: 24 }}>
                        {/* Open Reports Sub-section */}
                        {profile?.items?.filter((i: any) => i.status === 'OPEN').length > 0 && (
                            <View style={{ gap: 12 }}>
                                <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>My Found Items (Open)</Text>
                                {profile?.items?.filter((i: any) => i.status === 'OPEN').map((item: any) => (
                                    <View key={item.id} style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        <View style={styles.historyIcon}>
                                            <Package size={20} color={colors.primary} />
                                        </View>
                                        <View style={styles.historyContent}>
                                            <Text style={[styles.historyTitle, { color: colors.text }]}>{item.name}</Text>
                                            <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{item.date}</Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: colors.primary + '10' }]}
                                            onPress={() => router.push({ pathname: '/founder/edit-item', params: { id: item.id } })}
                                        >
                                            <Edit2 size={16} color={colors.primary} />
                                            <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Notified Matches Sub-section */}
                        {profile?.items?.filter((i: any) => i.status === 'NOTIFIED').length > 0 && (
                            <View style={{ gap: 12 }}>
                                <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>Notified Matches</Text>
                                {profile?.items?.filter((i: any) => i.status === 'NOTIFIED').map((item: any) => (
                                    <View key={item.id} style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        <View style={styles.historyIcon}>
                                            <Bell size={20} color={colors.primary} />
                                        </View>
                                        <View style={styles.historyContent}>
                                            <View style={styles.titleRow}>
                                                <Text style={[styles.historyTitle, { color: colors.text }]}>{item.name}</Text>
                                                <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                                                    <Text style={[styles.badgeText, { color: colors.primary }]}>NOTIFIED</Text>
                                                </View>
                                            </View>
                                            <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{item.date}</Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: colors.primary + '10' }]}
                                            onPress={() => router.push({ pathname: '/founder/edit-item', params: { id: item.id } })}
                                        >
                                            <Edit2 size={16} color={colors.primary} />
                                            <Text style={[styles.actionText, { color: colors.primary }]}>Edit Details</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Recovered/Claimed Items Sub-section */}
                        {profile?.items?.filter((i: any) => i.status === 'CLAIMED' || i.status === 'RECOVERED').length > 0 && (
                            <View style={{ gap: 12 }}>
                                <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>Resolved Items</Text>
                                {profile?.items?.filter((i: any) => i.status === 'CLAIMED' || i.status === 'RECOVERED').map((item: any) => (
                                    <View key={item.id} style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        <View style={styles.historyIcon}>
                                            <CheckCircle size={20} color={colors.success} />
                                        </View>
                                        <View style={styles.historyContent}>
                                            <Text style={[styles.historyTitle, { color: colors.text }]}>{item.name}</Text>
                                            <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{item.date}</Text>
                                            {item.status === 'RECOVERED' && item.feedbackRating && (
                                                <View style={{ marginTop: 4 }}>
                                                    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                                                        {[...Array(item.feedbackRating)].map((_, i) => (
                                                            <Star key={i} size={12} color="#F59E0B" fill="#F59E0B" />
                                                        ))}
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                        <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
                                            <Text style={[styles.badgeText, { color: colors.success }]}>{item.status}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
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
    subSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        marginTop: 8,
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
        justifyContent: 'space-between',
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
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
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
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-end',
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    reasonText: {
        fontSize: 11,
        fontStyle: 'italic',
        marginTop: 2,
    },
});

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { ArrowLeft, Crown, UserMinus, LogOut, Users, Globe, Lock, Shield } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { API_URL } from '../../../constants/api';
import { showAlert } from '../../../utils/alert';

export default function CommunityDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { colors } = useTheme();
    const { token, user } = useAuth();

    const [community, setCommunity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const fetchCommunity = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/communities/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to load community');
            }
            const data = await res.json();
            setCommunity(data);
        } catch (e: any) {
            showAlert('Error', e.message);
            router.back();
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id, token]);

    useEffect(() => { fetchCommunity(); }, [fetchCommunity]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCommunity();
    };

    const isAdmin = community?.members?.some(
        (m: any) => m.userId === user?.id && m.role === 'ADMIN'
    );
    const myUserId = user?.id;

    const handleRemoveMember = (memberId: string, memberName: string) => {
        const isSelf = memberId === myUserId;
        const title = isSelf ? 'Leave Community?' : `Remove ${memberName}?`;
        const message = isSelf
            ? 'Are you sure you want to leave this community? If you are the admin, the next member will become admin.'
            : `Remove ${memberName} from this community?`;

        Alert.alert(title, message, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: isSelf ? 'Leave' : 'Remove',
                style: 'destructive',
                onPress: async () => {
                    setActionLoadingId(memberId);
                    try {
                        const res = await fetch(`${API_URL}/communities/${id}/members/${memberId}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Failed');
                        if (isSelf) {
                            showAlert('Done', 'You have left the community.');
                            router.back();
                        } else {
                            showAlert('Done', `${memberName} has been removed.`);
                            fetchCommunity();
                        }
                    } catch (e: any) {
                        showAlert('Error', e.message);
                    } finally {
                        setActionLoadingId(null);
                    }
                }
            }
        ]);
    };

    const renderMember = ({ item }: { item: any }) => {
        const isSelf = item.userId === myUserId;
        const isThisAdmin = item.role === 'ADMIN';
        const isLoading = actionLoadingId === item.userId;
        const canRemove = isAdmin || isSelf; // admin can remove anyone, member can only exit

        return (
            <View style={[styles.memberRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: isThisAdmin ? colors.primary + '20' : colors.background }]}>
                    {isThisAdmin
                        ? <Crown size={18} color={colors.primary} />
                        : <Text style={{ fontSize: 18 }}>👤</Text>
                    }
                </View>

                {/* Name & role */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.memberName, { color: colors.text }]}>
                            {item.user?.name || item.user?.email}
                        </Text>
                        {isSelf && (
                            <View style={[styles.badge, { backgroundColor: colors.primary + '18' }]}>
                                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>You</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.memberRole, {
                        color: isThisAdmin ? colors.primary : colors.textSecondary
                    }]}>
                        {isThisAdmin ? '👑 Admin' : 'Member'}
                    </Text>
                </View>

                {/* Action button */}
                {canRemove && (
                    isLoading ? (
                        <ActivityIndicator size="small" color={colors.error} />
                    ) : isSelf ? (
                        // "Leave" button for self
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.error + '15', borderColor: colors.error }]}
                            onPress={() => handleRemoveMember(item.userId, item.user?.name || 'yourself')}
                        >
                            <LogOut size={14} color={colors.error} />
                            <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Leave</Text>
                        </TouchableOpacity>
                    ) : isAdmin && !isThisAdmin ? (
                        // "Remove" button for admin (only on non-admin members)
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.error + '15', borderColor: colors.error }]}
                            onPress={() => handleRemoveMember(item.userId, item.user?.name || item.user?.email)}
                        >
                            <UserMinus size={14} color={colors.error} />
                            <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Remove</Text>
                        </TouchableOpacity>
                    ) : null
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator style={{ marginTop: 80 }} size="large" color={colors.primary} />
            </View>
        );
    }

    const memberCount = community?.members?.length || 0;
    const isPrivate = community?.scope === 'PRIVATE';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{community?.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        {isPrivate
                            ? <><Lock size={11} color={colors.warning} /><Text style={{ color: colors.warning, fontSize: 11, fontWeight: '600' }}>Private</Text></>
                            : <><Globe size={11} color={colors.primary} /><Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>Public</Text></>
                        }
                        {community?.organization && (
                            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>• 📁 {community.organization.name}</Text>
                        )}
                    </View>
                </View>
                {isAdmin && (
                    <View style={[styles.adminBadge, { backgroundColor: colors.primary + '18' }]}>
                        <Shield size={13} color={colors.primary} />
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', marginLeft: 4 }}>Admin</Text>
                    </View>
                )}
            </View>

            {/* Description */}
            {community?.description && (
                <View style={[styles.descCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.desc, { color: colors.textSecondary }]}>{community.description}</Text>
                </View>
            )}

            {/* Member count label */}
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <Users size={16} color={colors.textSecondary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Members ({memberCount})</Text>
            </View>

            {/* Member list */}
            <FlatList
                data={community?.members || []}
                renderItem={renderMember}
                keyExtractor={item => item.userId}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Users size={40} color={colors.textSecondary} />
                        <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>No members yet</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        gap: 12,
    },
    title: { fontSize: 20, fontWeight: '700' },
    adminBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    descCard: {
        margin: 16,
        marginBottom: 0,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    desc: { fontSize: 14, lineHeight: 20 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        marginTop: 12,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700' },
    list: { padding: 16, paddingBottom: 40 },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 10,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberName: { fontSize: 15, fontWeight: '600' },
    memberRole: { fontSize: 12, marginTop: 2 },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    empty: { alignItems: 'center', paddingTop: 50 },
});

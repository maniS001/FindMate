import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Users, UserPlus, X, Search, CheckCircle, XCircle, Lock, Globe } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../constants/api';
import { showAlert } from '../../utils/alert';

type TabType = 'MY' | 'JOIN' | 'REQUESTS';

export default function CommunitiesScreen() {
    const { colors } = useTheme();
    const { token } = useAuth();

    const [activeTab, setActiveTab] = useState<TabType>('MY');
    const [myComms, setMyComms] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Create Community Modal
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newCommName, setNewCommName] = useState('');
    const [newCommDesc, setNewCommDesc] = useState('');
    const [newCommScope, setNewCommScope] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

    // Add Member Modal
    const [memberModalVisible, setMemberModalVisible] = useState(false);
    const [selectedCommId, setSelectedCommId] = useState<string | null>(null);
    const [memberIdentifier, setMemberIdentifier] = useState('');
    const [addingMember, setAddingMember] = useState(false);

    // Join request loading state per community
    const [joiningId, setJoiningId] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            fetchMyComms();
            fetchPendingRequests();
        }, [])
    );

    const fetchMyComms = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/me/communities`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const text = await res.text();
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const data = JSON.parse(text);
            setMyComms(Array.isArray(data) ? data : []);
        } catch (e: any) {
            console.log('Fetch comms error:', e.message);
            setMyComms([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const res = await fetch(`${API_URL}/users/me/pending-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            setPendingRequests(Array.isArray(data) ? data : []);
        } catch (e) {
            console.log('Pending requests error:', e);
        }
    };

    const handleSearchCommunities = async () => {
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        try {
            const res = await fetch(`${API_URL}/communities/search?q=${encodeURIComponent(searchQuery)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const text = await res.text();
            if (!res.ok) throw new Error('Search failed');
            const data = JSON.parse(text);
            setSearchResults(Array.isArray(data) ? data : []);
        } catch (e: any) {
            showAlert('Error', e.message || 'Search failed');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleJoinRequest = async (commId: string) => {
        setJoiningId(commId);
        try {
            const res = await fetch(`${API_URL}/communities/${commId}/join-request`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send request');
            showAlert('Request Sent', 'Your join request has been sent to the community admin.');
            handleSearchCommunities();
        } catch (e: any) {
            showAlert('Error', e.message);
        } finally {
            setJoiningId(null);
        }
    };

    const handleRespondToRequest = async (commId: string, userId: string, action: 'ACCEPT' | 'REJECT') => {
        try {
            const res = await fetch(`${API_URL}/communities/${commId}/members/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            showAlert('Done', action === 'ACCEPT' ? 'Member accepted!' : 'Request rejected.');
            fetchPendingRequests();
            fetchMyComms();
        } catch (e: any) {
            showAlert('Error', e.message);
        }
    };

    const handleCreate = async () => {
        if (!newCommName.trim()) {
            showAlert('Required', 'Please enter a community name.');
            return;
        }
        setCreating(true);
        try {
            const res = await fetch(`${API_URL}/communities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newCommName.trim(), description: newCommDesc.trim(), scope: newCommScope })
            });
            const text = await res.text();
            if (!res.ok) {
                let msg = 'Failed to create community';
                try { msg = JSON.parse(text).error || msg; } catch {}
                throw new Error(msg);
            }
            setNewCommName(''); setNewCommDesc(''); setNewCommScope('PUBLIC');
            setCreateModalVisible(false);
            fetchMyComms();
            showAlert('Success', 'Community created successfully!');
        } catch (e: any) {
            showAlert('Error', e.message);
        } finally {
            setCreating(false);
        }
    };

    const handleAddMember = async () => {
        if (!selectedCommId || !memberIdentifier.trim()) return;
        setAddingMember(true);
        try {
            const res = await fetch(`${API_URL}/communities/${selectedCommId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ identifier: memberIdentifier.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add member');
            setMemberIdentifier('');
            setMemberModalVisible(false);
            fetchMyComms();
            showAlert('Success', 'Member added!');
        } catch (e: any) {
            showAlert('Error', e.message);
        } finally {
            setAddingMember(false);
        }
    };

    const renderMyCommunity = ({ item }: { item: any }) => {
        const memberCount = item.members?.filter((m: any) => m.role !== 'PENDING').length || 0;
        const pendingCount = item.members?.filter((m: any) => m.role === 'PENDING').length || 0;
        const isAdmin = item.members?.some((m: any) => m.userId && m.role === 'ADMIN');
        const isPrivate = item.scope === 'PRIVATE';

        return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.commName, { color: colors.text }]}>{item.name}</Text>
                            {isPrivate ? (
                                <View style={[styles.scopeBadge, { backgroundColor: colors.warning + '20' }]}>
                                    <Lock size={10} color={colors.warning} />
                                    <Text style={{ color: colors.warning, fontSize: 10, fontWeight: '700', marginLeft: 3 }}>Private</Text>
                                </View>
                            ) : (
                                <View style={[styles.scopeBadge, { backgroundColor: colors.primary + '15' }]}>
                                    <Globe size={10} color={colors.primary} />
                                    <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', marginLeft: 3 }}>Public</Text>
                                </View>
                            )}
                        </View>
                        {item.organization && (
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                📁 {item.organization.name}
                            </Text>
                        )}
                        {item.description ? (
                            <Text style={[styles.desc, { color: colors.textSecondary }]}>{item.description}</Text>
                        ) : null}
                    </View>
                    {isAdmin && (
                        <TouchableOpacity
                            style={[styles.iconBtn, { backgroundColor: colors.primary + '20' }]}
                            onPress={() => { setSelectedCommId(item.id); setMemberIdentifier(''); setMemberModalVisible(true); }}
                        >
                            <UserPlus size={16} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.statsRow}>
                    <View style={[styles.statBadge, { backgroundColor: colors.background }]}>
                        <Users size={12} color={colors.textSecondary} />
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>{memberCount} members</Text>
                    </View>
                    {pendingCount > 0 && isAdmin && (
                        <TouchableOpacity
                            style={[styles.statBadge, { backgroundColor: colors.warning + '20' }]}
                            onPress={() => setActiveTab('REQUESTS')}
                        >
                            <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '600' }}>⏳ {pendingCount} pending</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const renderSearchResult = ({ item }: { item: any }) => {
        // Backend now only returns the CURRENT user's membership record in members[]
        const myMembership = item.members?.[0]; // will be undefined if not a member
        const isMember = myMembership?.role === 'MEMBER' || myMembership?.role === 'ADMIN';
        const isPending = myMembership?.role === 'PENDING';
        const memberCount = item._count?.members ?? (item.members?.filter((m: any) => m.role !== 'PENDING').length || 0);
        const isJoining = joiningId === item.id;

        return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.commName, { color: colors.text }]}>{item.name}</Text>
                {item.organization && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>📁 {item.organization.name}</Text>}
                {item.description ? <Text style={[styles.desc, { color: colors.textSecondary }]}>{item.description}</Text> : null}

                <View style={[styles.statsRow, { marginTop: 10 }]}>
                    {/* Member count */}
                    <View style={[styles.statBadge, { backgroundColor: colors.background }]}>
                        <Users size={12} color={colors.textSecondary} />
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>{memberCount} members</Text>
                    </View>

                    {/* Status / Action */}
                    {isMember ? (
                        <View style={[styles.statBadge, { backgroundColor: colors.success + '20' }]}>
                            <CheckCircle size={12} color={colors.success} />
                            <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>Member</Text>
                        </View>
                    ) : isPending ? (
                        <View style={[styles.statBadge, { backgroundColor: colors.warning + '20' }]}>
                            <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '600' }}>⏳ Request Sent</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.joinBtn, { backgroundColor: isJoining ? colors.primary + '80' : colors.primary }]}
                            onPress={() => handleJoinRequest(item.id)}
                            disabled={isJoining}
                        >
                            <UserPlus size={13} color="white" />
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: '700', marginLeft: 5 }}>
                                {isJoining ? 'Sending...' : 'Request to Join'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const renderPendingRequest = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.commName, { color: colors.text }]}>{item.user?.name || item.user?.email}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>wants to join {item.community?.name}</Text>
            <View style={[styles.statsRow, { marginTop: 12 }]}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.success }]}
                    onPress={() => handleRespondToRequest(item.communityId, item.userId, 'ACCEPT')}
                >
                    <CheckCircle size={14} color="white" />
                    <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6 }}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.error }]}
                    onPress={() => handleRespondToRequest(item.communityId, item.userId, 'REJECT')}
                >
                    <XCircle size={14} color="white" />
                    <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6 }}>Reject</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

            {/* Tabs */}
            <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
                {(['MY', 'JOIN', 'REQUESTS'] as TabType[]).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary }]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
                            {tab === 'MY' ? 'My Communities' : tab === 'JOIN' ? 'Find & Join' : `Requests${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ''}`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Create Community Modal */}
            <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Create Community</Text>
                                <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                                    <X size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                                Create a group to share lost & found alerts with specific people.
                            </Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                placeholder="Community Name *"
                                placeholderTextColor={colors.textSecondary}
                                value={newCommName}
                                onChangeText={setNewCommName}
                                autoFocus
                                returnKeyType="next"
                            />
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                placeholder="Description (Optional)"
                                placeholderTextColor={colors.textSecondary}
                                value={newCommDesc}
                                onChangeText={setNewCommDesc}
                                returnKeyType="done"
                            />

                            {/* Scope selector */}
                            <Text style={[styles.scopeLabel, { color: colors.text }]}>Community Visibility</Text>
                            <View style={styles.scopeRow}>
                                <TouchableOpacity
                                    style={[styles.scopeOption, {
                                        borderColor: newCommScope === 'PUBLIC' ? colors.primary : colors.border,
                                        backgroundColor: newCommScope === 'PUBLIC' ? colors.primary + '12' : colors.background
                                    }]}
                                    onPress={() => setNewCommScope('PUBLIC')}
                                >
                                    <Globe size={18} color={newCommScope === 'PUBLIC' ? colors.primary : colors.textSecondary} />
                                    <View style={{ marginLeft: 8, flex: 1 }}>
                                        <Text style={{ color: newCommScope === 'PUBLIC' ? colors.primary : colors.text, fontWeight: '700', fontSize: 13 }}>Public</Text>
                                        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>Anyone can search & request to join</Text>
                                    </View>
                                    {newCommScope === 'PUBLIC' && <CheckCircle size={16} color={colors.primary} />}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.scopeOption, {
                                        borderColor: newCommScope === 'PRIVATE' ? colors.warning : colors.border,
                                        backgroundColor: newCommScope === 'PRIVATE' ? colors.warning + '12' : colors.background
                                    }]}
                                    onPress={() => setNewCommScope('PRIVATE')}
                                >
                                    <Lock size={18} color={newCommScope === 'PRIVATE' ? colors.warning : colors.textSecondary} />
                                    <View style={{ marginLeft: 8, flex: 1 }}>
                                        <Text style={{ color: newCommScope === 'PRIVATE' ? colors.warning : colors.text, fontWeight: '700', fontSize: 13 }}>Private</Text>
                                        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>Invite-only, not visible in search</Text>
                                    </View>
                                    {newCommScope === 'PRIVATE' && <CheckCircle size={16} color={colors.warning} />}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.btnRow}>
                                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border, flex: 1 }]} onPress={() => { setCreateModalVisible(false); setNewCommName(''); setNewCommDesc(''); setNewCommScope('PUBLIC'); }}>
                                    <Text style={{ color: colors.text, textAlign: 'center' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary, flex: 1 }]} onPress={handleCreate} disabled={creating}>
                                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>{creating ? 'Creating...' : 'Create'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Add Member Modal */}
            <Modal visible={memberModalVisible} transparent animationType="slide" onRequestClose={() => setMemberModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Member</Text>
                                <TouchableOpacity onPress={() => setMemberModalVisible(false)}>
                                    <X size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                                Enter the registered email or username to add them directly.
                            </Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                placeholder="Email or Username"
                                placeholderTextColor={colors.textSecondary}
                                value={memberIdentifier}
                                onChangeText={setMemberIdentifier}
                                autoCapitalize="none"
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={handleAddMember}
                            />
                            <View style={styles.btnRow}>
                                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border, flex: 1 }]} onPress={() => setMemberModalVisible(false)}>
                                    <Text style={{ color: colors.text, textAlign: 'center' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary, flex: 1 }]} onPress={handleAddMember} disabled={addingMember}>
                                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>{addingMember ? 'Adding...' : 'Add Member'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* MY COMMUNITIES TAB */}
            {activeTab === 'MY' && (
                loading ? (
                    <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
                ) : (
                    <>
                        <FlatList
                            data={myComms}
                            renderItem={renderMyCommunity}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.list}
                            keyboardShouldPersistTaps="handled"
                            ListEmptyComponent={
                                <View style={styles.empty}>
                                    <Users size={52} color={colors.textSecondary} />
                                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Communities Yet</Text>
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Create a community or find and request to join one.</Text>
                                </View>
                            }
                        />
                        <View style={styles.fab}>
                            <TouchableOpacity style={[styles.fabBtn, { backgroundColor: colors.primary }]} onPress={() => setCreateModalVisible(true)}>
                                <Plus size={20} color="white" />
                                <Text style={{ color: 'white', fontWeight: '700', marginLeft: 8, fontSize: 15 }}>Create Community</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )
            )}

            {/* FIND & JOIN TAB */}
            {activeTab === 'JOIN' && (
                <View style={{ flex: 1 }}>
                    <View style={[styles.searchBox, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                        <TextInput
                            style={[styles.searchInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                            placeholder="Search public communities by name..."
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            returnKeyType="search"
                            onSubmitEditing={handleSearchCommunities}
                        />
                        <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.primary }]} onPress={handleSearchCommunities}>
                            <Search size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                    {searchLoading ? (
                        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
                    ) : (
                        <FlatList
                            data={searchResults}
                            renderItem={renderSearchResult}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.list}
                            keyboardShouldPersistTaps="handled"
                            ListEmptyComponent={
                                <View style={styles.empty}>
                                    <Search size={48} color={colors.textSecondary} />
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Search for a public community by name above</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            )}

            {/* JOIN REQUESTS TAB */}
            {activeTab === 'REQUESTS' && (
                <FlatList
                    data={pendingRequests}
                    renderItem={renderPendingRequest}
                    keyExtractor={item => `${item.communityId}-${item.userId}`}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <CheckCircle size={48} color={colors.textSecondary} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Pending Requests</Text>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Join requests from others will appear here.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        paddingTop: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: { fontSize: 13, fontWeight: '600' },
    list: { padding: 16, paddingBottom: 100 },
    card: {
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 12,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    commName: { fontSize: 17, fontWeight: '700' },
    subtitle: { fontSize: 12, marginTop: 3 },
    desc: { fontSize: 13, marginTop: 6, lineHeight: 18 },
    statsRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    joinBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
    },
    scopeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    iconBtn: { padding: 8, borderRadius: 10, marginLeft: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    fab: { position: 'absolute', bottom: 24, left: 16, right: 16 },
    fabBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14 },
    searchBox: { flexDirection: 'row', padding: 12, gap: 10, borderBottomWidth: 1 },
    searchInput: { flex: 1, height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, fontSize: 14 },
    searchBtn: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    input: { height: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, marginBottom: 12, fontSize: 15 },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    btn: { paddingVertical: 12, borderRadius: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalContent: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalSub: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
    scopeLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
    scopeRow: { gap: 10, marginBottom: 16 },
    scopeOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1.5 },
    empty: { alignItems: 'center', paddingTop: 70, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700' },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});

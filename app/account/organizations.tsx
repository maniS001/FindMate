import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, FileText, X, Users } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../constants/api';
import { showAlert } from '../../utils/alert';

export default function OrganizationsScreen() {
    const { colors } = useTheme();
    const { token } = useAuth();

    const [orgs, setOrgs] = useState<any[]>([]);
    const [myComms, setMyComms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Org Modal
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');

    // Add Community to Org Modal
    const [addCommModalVisible, setAddCommModalVisible] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [addingComm, setAddingComm] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchOrgs();
            fetchMyComms();
        }, [])
    );

    const fetchOrgs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/me/orgs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Server ${res.status}`);
            const data = await res.json();
            setOrgs(Array.isArray(data) ? data : []);
        } catch (e: any) {
            console.log('Fetch orgs error:', e.message);
            setOrgs([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyComms = async () => {
        try {
            const res = await fetch(`${API_URL}/users/me/communities`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            setMyComms(Array.isArray(data) ? data : []);
        } catch (e) {}
    };

    const handleCreate = async () => {
        if (!newOrgName.trim()) { showAlert('Required', 'Enter a name.'); return; }
        setCreating(true);
        try {
            const res = await fetch(`${API_URL}/orgs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newOrgName.trim() })
            });
            const text = await res.text();
            if (!res.ok) {
                let msg = 'Failed'; try { msg = JSON.parse(text).error; } catch {}
                throw new Error(msg);
            }
            setNewOrgName(''); setCreateModalVisible(false);
            fetchOrgs();
            showAlert('Success', 'Organization created!');
        } catch (e: any) {
            showAlert('Error', e.message);
        } finally {
            setCreating(false);
        }
    };

    const handleAddCommunity = async (commId: string) => {
        if (!selectedOrgId) return;
        setAddingComm(true);
        try {
            const res = await fetch(`${API_URL}/orgs/${selectedOrgId}/communities/${commId}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            setAddCommModalVisible(false);
            fetchOrgs();
            fetchMyComms();
            showAlert('Success', 'Community added to organization!');
        } catch (e: any) {
            showAlert('Error', e.message);
        } finally {
            setAddingComm(false);
        }
    };

    // Communities not yet in any org (or in this specific org)
    const eligibleComms = myComms.filter(c => !c.organizationId);

    const renderOrg = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <FileText size={22} color={colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[styles.orgName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {item.communities?.length || 0} communities
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: colors.primary + '15' }]}
                    onPress={() => { setSelectedOrgId(item.id); setAddCommModalVisible(true); }}
                >
                    <Plus size={16} color={colors.primary} />
                </TouchableOpacity>
            </View>
            {item.communities?.length > 0 && (
                <View style={{ marginTop: 10, gap: 6 }}>
                    {item.communities.map((c: any) => (
                        <View key={c.id} style={[styles.commChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Users size={12} color={colors.textSecondary} />
                            <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 6 }}>{c.name}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

            {/* Create Org Modal */}
            <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Create Organization</Text>
                                <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                                    <X size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                                Organizations group multiple communities. You can add your communities to it.
                            </Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                placeholder="Organization Name *"
                                placeholderTextColor={colors.textSecondary}
                                value={newOrgName}
                                onChangeText={setNewOrgName}
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={handleCreate}
                            />
                            <View style={styles.btnRow}>
                                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border, flex: 1 }]} onPress={() => { setCreateModalVisible(false); setNewOrgName(''); }}>
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

            {/* Add Community to Org Modal */}
            <Modal visible={addCommModalVisible} transparent animationType="slide" onRequestClose={() => setAddCommModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Community</Text>
                            <TouchableOpacity onPress={() => setAddCommModalVisible(false)}>
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                            Select one of your communities to add to this organization.
                        </Text>
                        {eligibleComms.length === 0 ? (
                            <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>
                                No available communities. All your communities are already in an organization, or you haven't created any yet.
                            </Text>
                        ) : (
                            eligibleComms.map(c => (
                                <TouchableOpacity
                                    key={c.id}
                                    style={[styles.commOption, { borderColor: colors.border, backgroundColor: colors.background }]}
                                    onPress={() => handleAddCommunity(c.id)}
                                    disabled={addingComm}
                                >
                                    <Users size={16} color={colors.primary} />
                                    <Text style={[styles.commOptionText, { color: colors.text }]}>{c.name}</Text>
                                    {addingComm && <ActivityIndicator size="small" color={colors.primary} />}
                                </TouchableOpacity>
                            ))
                        )}
                        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border, marginTop: 12 }]} onPress={() => setAddCommModalVisible(false)}>
                            <Text style={{ color: colors.text, textAlign: 'center' }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
            ) : (
                <>
                    <FlatList
                        data={orgs}
                        renderItem={renderOrg}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <FileText size={52} color={colors.textSecondary} />
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Organizations</Text>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Create an organization to group your communities together.</Text>
                            </View>
                        }
                    />
                    <View style={styles.fab}>
                        <TouchableOpacity style={[styles.fabBtn, { backgroundColor: colors.primary }]} onPress={() => setCreateModalVisible(true)}>
                            <Plus size={20} color="white" />
                            <Text style={{ color: 'white', fontWeight: '700', marginLeft: 8, fontSize: 15 }}>Create Organization</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: 16, paddingBottom: 100 },
    card: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    orgName: { fontSize: 17, fontWeight: '700' },
    subtitle: { fontSize: 12, marginTop: 3 },
    iconBtn: { padding: 8, borderRadius: 10 },
    commChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
    },
    commOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 8,
        gap: 10,
    },
    commOptionText: { fontSize: 15, flex: 1, fontWeight: '500' },
    fab: { position: 'absolute', bottom: 24, left: 16, right: 16 },
    fabBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14 },
    input: { height: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, marginBottom: 12, fontSize: 15 },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    btn: { paddingVertical: 12, borderRadius: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalContent: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalSub: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
    empty: { alignItems: 'center', paddingTop: 70, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700' },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});

import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Users, UserPlus, X } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../constants/api';
import { showAlert } from '../../utils/alert';

export default function CommunitiesScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { token } = useAuth();

    const [comms, setComms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Community Modal State
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newCommName, setNewCommName] = useState('');
    const [newCommDesc, setNewCommDesc] = useState('');

    // Add Member Modal State
    const [memberModalVisible, setMemberModalVisible] = useState(false);
    const [selectedCommId, setSelectedCommId] = useState<string | null>(null);
    const [memberIdentifier, setMemberIdentifier] = useState('');
    const [addingMember, setAddingMember] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchComms();
        }, [])
    );

    const fetchComms = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/me/communities`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const text = await res.text();
                console.log('Fetch comms error response:', text);
                throw new Error(`Server returned ${res.status}`);
            }
            const data = await res.json();
            setComms(Array.isArray(data) ? data : []);
        } catch (e: any) {
            console.error('Fetch comms error:', e.message);
            setComms([]);
        } finally {
            setLoading(false);
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
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: newCommName.trim(), description: newCommDesc.trim() })
            });
            const text = await res.text();
            if (!res.ok) {
                let errMsg = 'Failed to create community';
                try {
                    const parsed = JSON.parse(text);
                    errMsg = parsed.error || errMsg;
                } catch {
                    errMsg = `Server error (${res.status})`;
                }
                throw new Error(errMsg);
            }
            setNewCommName('');
            setNewCommDesc('');
            setCreateModalVisible(false);
            fetchComms();
            showAlert('Success', 'Community created successfully!');
        } catch (e: any) {
            showAlert('Error', e.message || 'Failed to create community');
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
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ identifier: memberIdentifier.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add member');

            setMemberIdentifier('');
            setMemberModalVisible(false);
            fetchComms();
            showAlert('Success', 'Member added successfully!');
        } catch (e: any) {
            showAlert('Error', e.message || 'Failed to add member');
        } finally {
            setAddingMember(false);
        }
    };

    const openAddMember = (commId: string) => {
        setSelectedCommId(commId);
        setMemberIdentifier('');
        setMemberModalVisible(true);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.orgName, { color: colors.text }]}>{item.name}</Text>
                    {item.organization && (
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Org: {item.organization.name}
                        </Text>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.addMemberBtn, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => openAddMember(item.id)}
                >
                    <UserPlus size={16} color={colors.primary} />
                </TouchableOpacity>
            </View>
            <View style={[styles.memberCount, { backgroundColor: colors.background }]}>
                <Users size={14} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 6 }}>
                    {item.members?.length || 0} Members
                </Text>
            </View>
            {item.description ? (
                <Text style={[styles.desc, { color: colors.textSecondary }]}>{item.description}</Text>
            ) : null}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Communities</Text>
            </View>

            {/* Create Community Modal */}
            <Modal
                visible={createModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Create Community</Text>
                                <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                                    <X size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
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
                                onSubmitEditing={handleCreate}
                            />
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: colors.border, flex: 1 }]}
                                    onPress={() => {
                                        setCreateModalVisible(false);
                                        setNewCommName('');
                                        setNewCommDesc('');
                                    }}
                                >
                                    <Text style={{ color: colors.text, textAlign: 'center' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: colors.primary, flex: 1 }]}
                                    onPress={handleCreate}
                                    disabled={creating}
                                >
                                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                                        {creating ? 'Creating...' : 'Create'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Add Member Modal */}
            <Modal
                visible={memberModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setMemberModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Member</Text>
                                <TouchableOpacity onPress={() => setMemberModalVisible(false)}>
                                    <X size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                                Enter the registered email or username of the person you want to add.
                            </Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, marginTop: 12 }]}
                                placeholder="Email or Username"
                                placeholderTextColor={colors.textSecondary}
                                value={memberIdentifier}
                                onChangeText={setMemberIdentifier}
                                autoCapitalize="none"
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={handleAddMember}
                            />
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: colors.border, flex: 1 }]}
                                    onPress={() => setMemberModalVisible(false)}
                                >
                                    <Text style={{ color: colors.text, textAlign: 'center' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: colors.primary, flex: 1 }]}
                                    onPress={handleAddMember}
                                    disabled={addingMember}
                                >
                                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                                        {addingMember ? 'Adding...' : 'Add Member'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Main Content */}
            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
            ) : (
                <>
                    <FlatList
                        data={comms}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Users size={48} color={colors.textSecondary} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No communities yet.{'\n'}Create one to get started!
                                </Text>
                            </View>
                        }
                    />
                    <View style={[styles.fab, { bottom: 24 }]}>
                        <TouchableOpacity
                            style={[styles.createBtn, { backgroundColor: colors.primary }]}
                            onPress={() => setCreateModalVisible(true)}
                        >
                            <Plus size={20} color="white" />
                            <Text style={{ color: 'white', fontWeight: '700', marginLeft: 8, fontSize: 16 }}>
                                Create Community
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    backButton: { marginRight: 16 },
    title: { fontSize: 20, fontWeight: 'bold' },
    list: { padding: 20, paddingBottom: 100 },
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    orgName: { fontSize: 18, fontWeight: '600' },
    subtitle: { fontSize: 12, marginTop: 4 },
    desc: { fontSize: 14, marginTop: 12 },
    memberCount: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    addMemberBtn: {
        padding: 8,
        borderRadius: 8,
    },
    fab: {
        position: 'absolute',
        left: 20,
        right: 20,
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 14,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        marginBottom: 12,
        fontSize: 15,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        padding: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderBottomWidth: 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalSubtitle: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
});

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../constants/api';
import { showAlert } from '../../utils/alert';

export default function OrganizationsScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { token } = useAuth();
    
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [showCreate, setShowCreate] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchOrgs();
        }, [])
    );

    const fetchOrgs = async () => {
        try {
            const res = await fetch(`${API_URL}/users/me/orgs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch orgs');
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                setOrgs(data);
            } catch (e) {
                throw new Error('Invalid JSON');
            }
        } catch (e) {
            console.error('Fetch orgs error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newOrgName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch(`${API_URL}/orgs`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ name: newOrgName })
            });
            if (!res.ok) throw new Error('Failed to create');
            setNewOrgName('');
            setShowCreate(false);
            fetchOrgs();
            showAlert('Success', 'Organization created successfully');
        } catch (e) {
            showAlert('Error', 'Failed to create organization');
        } finally {
            setCreating(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.orgName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {item.communities?.length || 0} Communities
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Organizations</Text>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
            ) : (
                <FlatList
                    data={orgs}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={() => (
                        <View>
                            {showCreate ? (
                                <View style={[styles.createContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                        placeholder="Organization Name"
                                        placeholderTextColor={colors.textSecondary}
                                        value={newOrgName}
                                        onChangeText={setNewOrgName}
                                    />
                                    <View style={styles.actionRow}>
                                        <TouchableOpacity 
                                            style={[styles.button, { backgroundColor: colors.border }]}
                                            onPress={() => setShowCreate(false)}
                                        >
                                            <Text style={{ color: colors.text }}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.button, { backgroundColor: colors.primary }]}
                                            onPress={handleCreate}
                                            disabled={creating}
                                        >
                                            <Text style={{ color: 'white' }}>{creating ? 'Creating...' : 'Create'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity 
                                    style={[styles.createBtn, { borderColor: colors.primary }]}
                                    onPress={() => setShowCreate(true)}
                                >
                                    <Plus size={20} color={colors.primary} />
                                    <Text style={{ color: colors.primary, fontWeight: 'bold', marginLeft: 8 }}>
                                        Create Organization
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                />
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
    list: { padding: 20, gap: 16 },
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    orgName: { fontSize: 18, fontWeight: '600' },
    subtitle: { fontSize: 14, marginTop: 4 },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        marginBottom: 20,
    },
    createContainer: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    }
});

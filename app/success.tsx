import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Complaint, getComplaints, updateComplaintStatus, updateItemStatus } from '../store';

export default function Success() {
    const router = useRouter();
    const { colors } = useTheme();
    const { user } = useAuth();
    const params = useLocalSearchParams<{
        type: string;
        message: string;
        contactInfo?: string;
        itemId?: string;
    }>();
    const [updating, setUpdating] = useState(false);

    // Complaint Closure State
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [userComplaints, setUserComplaints] = useState<Complaint[]>([]);
    const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

    useEffect(() => {
        if (params.itemId && user) {
            fetchUserComplaints();
        }
    }, [params.itemId, user]);

    const fetchUserComplaints = async () => {
        try {
            // In a real app, we should have an endpoint to get complaints by userId
            // For now, we fetch all and filter (not efficient but works for prototype)
            // Or use the profile endpoint data if available in context
            const allComplaints = await getComplaints();
            const myOpenComplaints = allComplaints.filter(c =>
                c.userId === user?.id &&
                (c.status === 'OPEN' || !c.status) // Handle undefined status as open
            );
            setUserComplaints(myOpenComplaints);
        } catch (error) {
            console.error('Failed to fetch complaints', error);
        }
    };

    const getTitle = () => {
        switch (params.type) {
            case 'complaint':
                return 'Complaint Filed Successfully!';
            case 'report':
                return 'Item Reported Successfully!';
            case 'payment':
                return 'Payment Successful!';
            case 'verification':
                return 'Identity Verified!';
            default:
                return 'Success!';
        }
    };

    const getMessage = () => {
        if (params.message) return params.message;

        switch (params.type) {
            case 'complaint':
                return 'Your complaint has been registered. We will notify you if someone reports finding a matching item.';
            case 'report':
                return 'Your found item has been posted. Victims can now search and claim it.';
            case 'payment':
                return 'You can now contact the founder to collect your item.';
            case 'verification':
                return 'Contact the founder to collect your item.';
            default:
                return 'Your request has been completed successfully.';
        }
    };

    const handleConfirmRecovery = async () => {
        if (!params.itemId) return;

        setUpdating(true);
        try {
            // 1. Update Item Status
            await updateItemStatus(params.itemId, 'CLAIMED');

            // 2. Check if there are open complaints to close
            if (userComplaints.length > 0) {
                setShowComplaintModal(true);
            } else {
                Alert.alert('Great!', 'We are happy you found your item. The item status has been updated.', [
                    { text: 'OK', onPress: () => router.push('/') }
                ]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update item status. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleCloseComplaint = async () => {
        if (!selectedComplaintId) {
            // User chose not to close any complaint or "Skip"
            router.push('/');
            return;
        }

        try {
            await updateComplaintStatus(selectedComplaintId, 'RESOLVED', 'Item recovered via FindMate');
            Alert.alert('Success', 'Item marked as recovered and complaint closed!', [
                { text: 'OK', onPress: () => router.push('/') }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to close complaint.');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            {/* Complaint Closure Modal */}
            <Modal visible={showComplaintModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Close Related Complaint?</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                            You have open complaints. Does this item resolve one of them?
                        </Text>

                        <ScrollView style={{ maxHeight: 200, marginVertical: 16 }}>
                            {userComplaints.map(complaint => (
                                <TouchableOpacity
                                    key={complaint.id}
                                    style={[
                                        styles.complaintItem,
                                        {
                                            borderColor: selectedComplaintId === complaint.id ? colors.primary : colors.border,
                                            backgroundColor: selectedComplaintId === complaint.id ? colors.primary + '10' : 'transparent'
                                        }
                                    ]}
                                    onPress={() => setSelectedComplaintId(complaint.id)}
                                >
                                    <View style={styles.complaintInfo}>
                                        <Text style={[styles.complaintName, { color: colors.text }]}>{complaint.name}</Text>
                                        <Text style={[styles.complaintDate, { color: colors.textSecondary }]}>{complaint.date}</Text>
                                    </View>
                                    {selectedComplaintId === complaint.id && (
                                        <CheckCircle size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <Button
                                title="Skip"
                                variant="outline"
                                onPress={() => router.push('/')}
                                style={{ flex: 1 }}
                            />
                            <Button
                                title="Close Complaint"
                                onPress={handleCloseComplaint}
                                disabled={!selectedComplaintId}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <CheckCircle size={80} color={colors.success} strokeWidth={2} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
                <Text style={[styles.message, { color: colors.textSecondary }]}>{getMessage()}</Text>

                {params.contactInfo && (
                    <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Founder Contact:</Text>
                        <Text style={[styles.contactInfo, { color: colors.primary }]}>📞 {params.contactInfo}</Text>
                        <Button
                            title="Call Owner"
                            onPress={() => {
                                const phone = params.contactInfo?.replace(/[^0-9+]/g, '') || '';
                                Linking.openURL(`tel:${phone}`);
                            }}
                            style={{ marginTop: 16 }}
                        />
                    </View>
                )}

                {/* Recovery Confirmation Section */}
                {params.contactInfo && params.itemId && (
                    <View style={[styles.recoverySection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.recoveryTitle, { color: colors.text }]}>Did you recover your item?</Text>
                        <Text style={[styles.recoveryText, { color: colors.textSecondary }]}>
                            If you have successfully collected your item from the founder, please let us know.
                        </Text>
                        <Button
                            title="Yes, I got it!"
                            onPress={handleConfirmRecovery}
                            loading={updating}
                            style={{ marginTop: 12, backgroundColor: '#10B981' }}
                        />
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    <Button
                        title="Go to Home"
                        onPress={() => router.push('/')}
                        style={{ marginBottom: 12 }}
                        variant="outline"
                    />
                    <Button
                        title="Go Back"
                        onPress={() => router.back()}
                        variant="secondary"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        maxWidth: 400,
    },
    contactCard: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
        width: '100%',
        maxWidth: 400,
    },
    contactLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    contactInfo: {
        fontSize: 20,
        fontWeight: '600',
    },
    recoverySection: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    recoveryTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    recoveryText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 400,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        borderRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    complaintItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    complaintInfo: {
        flex: 1,
    },
    complaintName: {
        fontSize: 16,
        fontWeight: '600',
    },
    complaintDate: {
        fontSize: 12,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
});

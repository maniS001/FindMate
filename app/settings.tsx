import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, FileText, HelpCircle, Moon, Shield, Sun, Trash2 } from 'lucide-react-native';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsScreen() {
    const router = useRouter();
    const { theme, toggleTheme, colors } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Appearance Section */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                        Appearance
                    </Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            {theme === 'light' ? (
                                <Moon size={22} color={colors.text} />
                            ) : (
                                <Sun size={22} color={colors.text} />
                            )}
                            <View style={styles.settingTextContainer}>
                                <Text style={[styles.settingLabel, { color: colors.text }]}>
                                    Dark Mode
                                </Text>
                                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                                    {theme === 'dark' ? 'Currently using dark theme' : 'Switch to dark theme'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={theme === 'dark' ? '#FFF' : '#F4F3F4'}
                        />
                    </View>
                </View>

                {/* Account Settings */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                        About & Legal
                    </Text>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <Shield size={20} color={colors.textSecondary} />
                            <Text style={[styles.menuLabel, { color: colors.text }]}>Privacy Policy</Text>
                        </View>
                        <ChevronRight size={20} color={colors.border} />
                    </TouchableOpacity>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <FileText size={20} color={colors.textSecondary} />
                            <Text style={[styles.menuLabel, { color: colors.text }]}>Terms of Service</Text>
                        </View>
                        <ChevronRight size={20} color={colors.border} />
                    </TouchableOpacity>
                </View>

                {/* Support & Danger Zone */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                        Support & Security
                    </Text>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <HelpCircle size={20} color={colors.textSecondary} />
                            <Text style={[styles.menuLabel, { color: colors.text }]}>Help & Support</Text>
                        </View>
                        <ChevronRight size={20} color={colors.border} />
                    </TouchableOpacity>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <Trash2 size={20} color="#EF4444" />
                            <Text style={[styles.menuLabel, { color: "#EF4444" }]}>Delete Account</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        padding: 24,
        gap: 20,
    },
    card: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    settingTextContainer: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingDescription: {
        fontSize: 14,
        marginTop: 4,
    },
    placeholderText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuLabel: {
        fontSize: 16,
    },
    divider: {
        height: 1,
        marginVertical: 4,
    },
});

import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface CategoryPickerProps {
    label: string;
    value: string;
    onChange: (category: string) => void;
    style?: ViewStyle;
}

const CATEGORIES = [
    'Electronics',
    'Clothing & Accessories',
    'Wallets & Purses',
    'Keys',
    'Documents & IDs',
    'Bags & Luggage',
    'Jewelry',
    'Books & Stationery',
    'Sports Equipment',
    'Other',
];

export default function CategoryPicker({ label, value, onChange, style }: CategoryPickerProps) {
    const { colors } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [customCategory, setCustomCategory] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleSelectCategory = (category: string) => {
        if (category === 'Other') {
            setShowCustomInput(true);
            setCustomCategory('');
        } else {
            onChange(category);
            setModalVisible(false);
            setShowCustomInput(false);
            setIsFocused(false);
        }
    };

    const handleCustomCategorySubmit = () => {
        if (customCategory.trim()) {
            onChange(customCategory.trim());
            setModalVisible(false);
            setShowCustomInput(false);
            setCustomCategory('');
            setIsFocused(false);
        }
    };

    const openModal = () => {
        setModalVisible(true);
        setIsFocused(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setShowCustomInput(false);
        setCustomCategory('');
        setIsFocused(false);
    };

    return (
        <View style={[styles.container, style]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            <TouchableOpacity
                onPress={openModal}
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.surface,
                        borderColor: isFocused ? colors.primary : colors.border,
                        borderWidth: isFocused ? 2 : 1,
                    }
                ]}
                activeOpacity={0.7}
            >
                <Text style={[styles.inputText, { color: value ? colors.text : colors.textSecondary }]}>
                    {value || 'Select a category'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeModal}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={closeModal}
                >
                    <View
                        style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onStartShouldSetResponder={() => true}
                    >
                        {!showCustomInput ? (
                            <>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
                                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                                    {CATEGORIES.map((category, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.categoryOption,
                                                { borderBottomColor: colors.border },
                                                index === CATEGORIES.length - 1 && styles.lastOption
                                            ]}
                                            onPress={() => handleSelectCategory(category)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.categoryText, { color: colors.text }]}>
                                                {category}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Enter Custom Category</Text>
                                <TextInput
                                    style={[
                                        styles.customInput,
                                        {
                                            backgroundColor: colors.background,
                                            borderColor: colors.border,
                                            color: colors.text
                                        }
                                    ]}
                                    placeholder="Type your category here..."
                                    placeholderTextColor={colors.textSecondary}
                                    value={customCategory}
                                    onChangeText={setCustomCategory}
                                    autoFocus
                                />
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.buttonSecondary, { borderColor: colors.border }]}
                                        onPress={() => setShowCustomInput(false)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.buttonText, { color: colors.text }]}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.button, styles.buttonPrimary, { backgroundColor: colors.primary }]}
                                        onPress={handleCustomCategorySubmit}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Submit</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    inputText: {
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 16,
        borderWidth: 1,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        overflow: 'hidden',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        padding: 20,
        paddingBottom: 16,
    },
    scrollView: {
        maxHeight: 400,
    },
    categoryOption: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    lastOption: {
        borderBottomWidth: 0,
    },
    categoryText: {
        fontSize: 16,
    },
    customInput: {
        marginHorizontal: 20,
        marginBottom: 16,
        height: 52,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        paddingTop: 0,
    },
    button: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonPrimary: {
        // backgroundColor set dynamically
    },
    buttonSecondary: {
        borderWidth: 1,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

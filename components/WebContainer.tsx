import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

interface WebContainerProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

/**
 * A wrapper component that constrains content width on web/desktop.
 * On mobile, it renders children directly (full width).
 * On web, it applies a max-width and centers the content.
 */
export default function WebContainer({ children, style }: WebContainerProps) {
    if (Platform.OS === 'web') {
        return (
            <View style={[styles.container, style]}>
                <View style={styles.content}>
                    {children}
                </View>
            </View>
        );
    }

    return <View style={[{ flex: 1 }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        width: '100%',
    },
    content: {
        width: '100%',
        maxWidth: 800, // Max width for web content
        flex: 1,
    },
});

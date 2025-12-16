
import { Alert, AlertButton, Platform } from 'react-native';

export const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
    if (Platform.OS === 'web') {
        if (!buttons || buttons.length === 0) {
            window.alert([title, message].filter(Boolean).join('\n'));
        } else {
            // Check if it's a confirmation (more than 1 button or specifically Cancel)
            const isConfirm = buttons.length > 1;

            if (isConfirm) {
                // Try to find "OK" / "Yes" / Positive button and "Cancel" button
                const confirmResult = window.confirm([title, message].filter(Boolean).join('\n'));
                if (confirmResult) {
                    // Find positive action (usually the last one or style='default'?)
                    // Heuristic: Execute the one that isn't cancel?
                    // Or just execute the last button's onPress?
                    const positive = buttons.find(b => b.style !== 'cancel') || buttons[buttons.length - 1];
                    positive.onPress?.();
                } else {
                    const negative = buttons.find(b => b.style === 'cancel');
                    negative?.onPress?.();
                }
            } else {
                // Single button info
                window.alert([title, message].filter(Boolean).join('\n'));
                buttons[0].onPress?.();
            }
        }
    } else {
        Alert.alert(title, message, buttons);
    }
};

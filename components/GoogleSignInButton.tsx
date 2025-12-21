
import {
    GoogleSignin,
    statusCodes
} from '@react-native-google-signin/google-signin';
import React, { useEffect, useRef } from 'react';
import { Alert, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Hardcoded Web Client ID
const WEB_CLIENT_ID = "563053075136-a3q0elaisf04r5voakv5260gvo08qkv4.apps.googleusercontent.com";

// Only configure if NOT on web, or catch potential errors if library tries to run on web
if (Platform.OS !== 'web') {
    GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        offlineAccess: true,
    });
}

interface GoogleSignInButtonProps {
    onSignInSuccess: (userInfo: any) => void;
    onSignInFailure?: (error: any) => void;
}

export const GoogleSignInBtn: React.FC<GoogleSignInButtonProps> = ({
    onSignInSuccess,
    onSignInFailure,
}) => {
    // Ref for the Google Button wrapper on Web
    const googleButtonRef = useRef<HTMLDivElement>(null);

    // ==========================================
    // WEB IMPLEMENTATION
    // ==========================================
    useEffect(() => {
        if (Platform.OS === 'web') {
            const loadGoogleScript = () => {
                // Check if Google script is loaded
                if ((window as any).google && (window as any).google.accounts) {
                    initializeGoogleSignIn();
                } else {
                    // Retry after short delay if script hasn't loaded (though +html.tsx should handle it)
                    setTimeout(loadGoogleScript, 500);
                }
            };

            loadGoogleScript();
        }
    }, [Platform.OS]);

    const initializeGoogleSignIn = () => {
        try {
            (window as any).google.accounts.id.initialize({
                client_id: WEB_CLIENT_ID,
                callback: handleWebCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            // Render the button into the div
            if (googleButtonRef.current) {
                (window as any).google.accounts.id.renderButton(
                    googleButtonRef.current,
                    { theme: 'outline', size: 'large', width: '100%' } // Customization attributes
                );
            }
        } catch (error) {
            console.error('Error initializing Google Sign-In on Web:', error);
        }
    };

    const handleWebCredentialResponse = (response: any) => {
        // Map the Web response to the Native response shape expected by the app
        // Native: { data: { idToken: ... }, ... }
        // Web: { credential: ... } (which is the idToken)

        const userInfo = {
            data: {
                idToken: response.credential,
                user: {
                    // We can decode the JWT here if we needed user details immediately,
                    // but the backend will verify the token and return the user anyway.
                    email: 'google-user@example.com', // Placeholder
                    name: 'Google User', // Placeholder
                }
            }
        };
        onSignInSuccess(userInfo);
    };

    // ==========================================
    // ANDROID / IOS IMPLEMENTATION
    // ==========================================
    const requestNativePermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.CALL_PHONE,
                ]);
            } catch (err) {
                console.warn(err);
            }
        }
    };

    const signInNative = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            await requestNativePermissions();
            onSignInSuccess(userInfo);
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log('User cancelled login');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                console.log('Sign in in progress');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Error', 'Google Play Services not available');
            } else {
                console.error(error);
                if (onSignInFailure) onSignInFailure(error);
                else Alert.alert('Error', 'Google Sign-In failed');
            }
        }
    };

    if (Platform.OS === 'web') {
        // Render a div that the Google Script will inject the button into
        return (
            <View style={styles.webContainer}>
                {/* @ts-ignore - using HTML element in React Native Web */}
                <div ref={googleButtonRef} style={{ width: '100%' }}></div>
            </View>
        );
    }

    return (
        <TouchableOpacity
            style={styles.customGoogleButton}
            onPress={signInNative}
        >
            <View style={styles.iconContainer}>
                <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    webContainer: {
        width: '100%',
        marginTop: 10,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customGoogleButton: {
        width: '100%',
        height: 48,
        marginTop: 10,
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#dadce0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    iconContainer: {
        marginRight: 10,
    },
    googleIconText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4285F4', // Google Blue
    },
    googleButtonText: {
        color: '#3c4043',
        fontSize: 14,
        fontWeight: '500',
    },
});

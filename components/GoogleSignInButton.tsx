
import {
    GoogleSignin
} from '@react-native-google-signin/google-signin';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    // State for web script loading
    const [scriptLoaded, setScriptLoaded] = React.useState(false);
    // Ref for the Google Button wrapper on Web
    const googleButtonRef = React.useRef<HTMLDivElement>(null);

    // ==========================================
    // WEB IMPLEMENTATION
    // ==========================================
    useEffect(() => {
        if (Platform.OS === 'web') {
            const loadGoogleScript = () => {
                // Check if Google script is loaded
                if ((window as any).google && (window as any).google.accounts) {
                    initializeGoogleSignIn();
                    setScriptLoaded(true);
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
            // Google supports max width 400px.
            // We are scaling by 1.4x via CSS transform.
            // So we need to request a smaller width from Google, so that:
            // RequestedWidth * 1.4 = AvailableWidth
            // => RequestedWidth = AvailableWidth / 1.4

            // Render the button into the div
            if (googleButtonRef.current) {
                (window as any).google.accounts.id.renderButton(
                    googleButtonRef.current,
                    {
                        theme: 'outline',
                        size: 'large',
                        // We do NOT set a fixed width here. 
                        // google-signin button will size itself (approx 200px-240px wide).
                        // If we want it wider, we can set 'width: 250' or similar, but 
                        // "original size but centered" is the request.
                        shape: 'pill'
                    }
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

        // Fetch location (Web)
        getLocation().then(location => {
            const userInfo = {
                data: {
                    idToken: response.credential,
                    location, // Add location to data
                    user: {
                        // We can decode the JWT here if we needed user details immediately,
                        // but the backend will verify the token and return the user anyway.
                        email: 'google-user@example.com', // Placeholder
                        name: 'Google User', // Placeholder
                    }
                }
            };
            onSignInSuccess(userInfo);
        });
    };

    const getLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return null;
            }

            let location = await Location.getCurrentPositionAsync({});
            let reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (reverseGeocode.length > 0) {
                const address = reverseGeocode[0];
                // improved location string: City, Area or just City
                return `${address.city || address.region || ''}, ${address.district || address.name || ''}`;
            }
        } catch (error) {
            console.log('Error getting location:', error);
        }
        return null;
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
            const location = await getLocation(); // Fetch location
            // Attach location to userInfo object (as a custom property)
            (userInfo as any).data = { ...(userInfo as any).data, location };

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


    // ==========================================
    // RENDER
    // ==========================================

    if (Platform.OS === 'web') {
        return (
            <View style={styles.webContainer}>
                {/* @ts-ignore - native web div */}
                <div
                    ref={googleButtonRef}
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                    }}
                ></div>
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
        height: 56, // Fixed height to match Login button
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Clip any potential pixel rounding errors
    },
    customGoogleButton: {
        width: '100%',
        height: 56,
        marginTop: 10,
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
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
        color: '#4285F4',
    },
    googleButtonText: {
        color: '#3c4043',
        fontSize: 16,
        fontWeight: '600',
    },
});


import {
    GoogleSignin,
    statusCodes
} from '@react-native-google-signin/google-signin';
import * as Location from 'expo-location';
import React, { useEffect } from 'react';
import { Alert, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LocationInputModal } from './LocationInputModal';

// Hardcoded Web Client ID
const WEB_CLIENT_ID = "1018607704367-f06382f0qcukig28se4gk803ndn3a3i6.apps.googleusercontent.com";

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

    // State for manual location modal
    const [showLocationModal, setShowLocationModal] = React.useState(false);
    const [pendingUserInfo, setPendingUserInfo] = React.useState<any>(null);

    const handleManualLocation = (location: string | null) => {
        setShowLocationModal(false);
        if (pendingUserInfo) {
            const finalUserInfo = { ...pendingUserInfo };
            if (!finalUserInfo.data) finalUserInfo.data = {};
            finalUserInfo.data.location = location;
            // Note: Manual entry doesn't have coordinates, only string location

            // For native, we still want to ask other permissions if we haven't yet
            if (Platform.OS !== 'web') requestNativePermissions();

            onSignInSuccess(finalUserInfo);
            setPendingUserInfo(null);
        }
    };

    const handleLocationDetected = (locationData: { location: string; latitude: number; longitude: number }) => {
        setShowLocationModal(false);
        if (pendingUserInfo) {
            const finalUserInfo = { ...pendingUserInfo };
            if (!finalUserInfo.data) finalUserInfo.data = {};
            finalUserInfo.data.location = locationData.location;
            finalUserInfo.data.latitude = locationData.latitude;
            finalUserInfo.data.longitude = locationData.longitude;

            // For native, we still want to ask other permissions if we haven't yet
            if (Platform.OS !== 'web') requestNativePermissions();

            onSignInSuccess(finalUserInfo);
            setPendingUserInfo(null);
        }
    };

    // ==========================================
    // WEB IMPLEMENTATION
    // ==========================================
    useEffect(() => {
        if (Platform.OS === 'web') {
            let attempts = 0;
            const maxAttempts = 20; // 10 seconds total

            const checkAndInit = () => {
                // 1. Check if script is loaded
                if ((window as any).google && (window as any).google.accounts) {
                    // 2. Check if ref is ready
                    if (googleButtonRef.current) {
                        console.log('Google Script loaded and Ref ready. Initializing...');
                        initializeGoogleSignIn();
                        setScriptLoaded(true);
                    } else {
                        console.log('Google Script loaded but Ref not ready. Retrying...');
                        if (attempts < maxAttempts) {
                            attempts++;
                            setTimeout(checkAndInit, 500);
                        }
                    }
                } else {
                    console.log('Google Script not loaded. Retrying...');
                    if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(checkAndInit, 500);
                    } else {
                        // Fallback: Try to inject script if missing after timeout
                        console.warn('Google Script missing. Injecting manually...');
                        const script = document.createElement('script');
                        script.src = 'https://accounts.google.com/gsi/client';
                        script.async = true;
                        script.defer = true;
                        script.onload = () => checkAndInit(); // Retry once loaded
                        document.body.appendChild(script);
                    }
                }
            };

            checkAndInit();
        }
    }, [Platform.OS]);

    const initializeGoogleSignIn = () => {
        try {
            if (!(window as any).google) return;

            (window as any).google.accounts.id.initialize({
                client_id: WEB_CLIENT_ID,
                callback: handleWebCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            // Render the button into the div
            if (googleButtonRef.current) {
                // Clear previous content if any (prevents duplicate buttons on re-renders)
                googleButtonRef.current.innerHTML = '';

                (window as any).google.accounts.id.renderButton(
                    googleButtonRef.current,
                    {
                        theme: 'outline',
                        size: 'large',
                        shape: 'pill',
                        width: 250, // Explicit width for better visibility
                    }
                );
            }
        } catch (error) {
            console.error('Error initializing Google Sign-In on Web:', error);
        }
    };

    const handleWebCredentialResponse = (response: any) => {
        // Map the Web response
        const userInfo = {
            data: {
                idToken: response.credential,
                location: null as string | null,
                latitude: undefined as number | undefined,
                longitude: undefined as number | undefined,
                user: {
                    email: 'google-user@example.com',
                    name: 'Google User',
                }
            }
        };

        // Try auto location first
        getLocation().then(locationData => {
            if (locationData) {
                userInfo.data.location = locationData.location;
                userInfo.data.latitude = locationData.latitude;
                userInfo.data.longitude = locationData.longitude;
                onSignInSuccess(userInfo);
            } else {
                // Trigger manual entry
                setPendingUserInfo(userInfo);
                setShowLocationModal(true);
            }
        });
    };

    const getLocation = async (): Promise<{ location: string; latitude: number; longitude: number } | null> => {
        try {
            // Web: Check if geolocation is available first to avoid errors
            if (Platform.OS === 'web' && !navigator.geolocation) {
                console.log('Geolocation not supported on this browser');
                return null;
            }

            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return null;
            }

            let position = await Location.getCurrentPositionAsync({});
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            // On Web, reverseGeocodeAsync might be deprecated/flaky. 
            // We'll wrap it in a separate try-catch to not fail the whole location fetch.
            if (Platform.OS !== 'web') {
                let reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude,
                    longitude
                });

                if (reverseGeocode.length > 0) {
                    const address = reverseGeocode[0];
                    const locationString = `${address.city || address.region || ''}, ${address.district || address.name || ''}`;
                    return { location: locationString, latitude, longitude };
                }
            } else {
                // Web-specific or skip reverse geocoding to avoid warning
                const locationString = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
                return { location: locationString, latitude, longitude };
            }

            // Fallback if reverse geocoding fails but we have coordinates
            return { location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, latitude, longitude };

        } catch (error) {
            console.log('Error getting location (ignoring to allow login):', error);
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
            const locationData = await getLocation();

            if (locationData) {
                (userInfo as any).data = {
                    ...(userInfo as any).data,
                    location: locationData.location,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude
                };
                await requestNativePermissions();
                onSignInSuccess(userInfo);
            } else {
                // Trigger manual entry
                setPendingUserInfo(userInfo);
                setShowLocationModal(true);
            }
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
            <>
                <View style={styles.webContainer}>
                    {/* @ts-ignore - native web div */}
                    <div
                        ref={googleButtonRef}
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            minHeight: 50,
                        }}
                    ></div>
                </View>
                <LocationInputModal
                    visible={showLocationModal}
                    onSave={handleManualLocation}
                    onClose={() => setShowLocationModal(false)}
                    onLocationDetected={handleLocationDetected}
                />
            </>
        );
    }

    return (
        <>
            <TouchableOpacity
                style={styles.customGoogleButton}
                onPress={signInNative}
            >
                <View style={styles.iconContainer}>
                    <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
            <LocationInputModal
                visible={showLocationModal}
                onSave={handleManualLocation}
                onClose={() => setShowLocationModal(false)}
                onLocationDetected={handleLocationDetected}
            />
        </>
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

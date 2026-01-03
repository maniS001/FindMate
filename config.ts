/**
 * Central Application Configuration
 * 
 * This file contains all feature flags and configuration settings.
 * Modify these values to enable/disable features without changing code.
 */

export const APP_CONFIG = {
    // Feature Flags
    FEATURES: {
        /**
         * Payment Gateway
         * Set to false to disable all payment-related UI and logic
         * Set to true to enable payment processing
         */
        PAYMENT_GATEWAY_ENABLED: false,

        /**
         * Push Notifications
         * Set to false to disable push notification registration and delivery
         */
        PUSH_NOTIFICATIONS_ENABLED: true,

        /**
         * SMS OTP Verification
         * Set to false to skip OTP verification (use mock/bypass)
         */
        SMS_OTP_ENABLED: false, // Will enable after service setup
    },

    // API Configuration
    API: {
        BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    },

    // Notification Settings
    NOTIFICATIONS: {
        // Check for new notifications every X seconds (when app is active)
        POLL_INTERVAL_MS: 30000, // 30 seconds
    },
} as const;

/**
 * Type-safe access to config
 */
export type AppConfig = typeof APP_CONFIG;

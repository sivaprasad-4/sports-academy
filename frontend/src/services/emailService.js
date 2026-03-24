import emailjs from '@emailjs/browser';

// These should ideally be in .env, but are defined here for the scope of the project setup.
// Replace with actual keys when moving to production.
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_placeholder';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_placeholder';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key_placeholder';

export const emailService = {
    /**
     * Send a verification email using EmailJS
     * @param {string} email - User's email address
     * @param {string} token - The unique verification token
     * @param {string} name - User's first name (optional)
     */
    sendVerificationEmail: async (email, token, name = 'User') => {
        try {
            const verificationUrl = `${window.location.origin}/verify-email?token=${token}`;
            
            const templateParams = {
                to_email: email,
                to_name: name,
                verification_link: verificationUrl,
            };

            const response = await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams,
                EMAILJS_PUBLIC_KEY
            );
            
            console.log('SUCCESS! Verification email sent.', response.status, response.text);
            return response;
        } catch (error) {
            console.error('FAILED to send verification email.', error);
            throw error;
        }
    },

    /**
     * Send a password reset email using EmailJS
     * @param {string} email - User's email address
     * @param {string} token - The unique reset token
     */
    sendResetEmail: async (email, token, username = 'User') => {
        try {
            const resetUrl = `${window.location.origin}/reset-password?token=${token}`;
            
            // We pass resetUrl to both variable styles to ensure compatibility 
            // incase the user uses the verification template or made a dedicated reset one.
            const templateParams = {
                to_email: email,
                to_name: username,
                verification_link: resetUrl,
                reset_link: resetUrl,
            };

            const response = await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams,
                EMAILJS_PUBLIC_KEY
            );
            
            console.log('SUCCESS! Password reset email sent.', response.status, response.text);
            return response;
        } catch (error) {
            console.error('FAILED to send password reset email.', error);
            throw error;
        }
    }
};

import emailjs from '@emailjs/nodejs';

const serviceID = 'service_3gtb6k6';
const templateID = 'template_q2ghybi';
const publicKey = 'xgmGUFOFwEkvrJWgI';

const templateParams = {
    to_email: 'test@example.com', // Dummy email to see if EmailJS accepts the request
    to_name: 'Test User',
    verification_link: 'http://localhost:5173/verify-email?token=123',
};

async function testEmail() {
    console.log("Testing EmailJS API...");
    try {
        const response = await emailjs.send(serviceID, templateID, templateParams, {
            publicKey: publicKey,
        });
        console.log('SUCCESS!', response.status, response.text);
    } catch (err) {
        console.log('FAILED...', err);
        // Print detailed error if available
        if (err.response) {
            console.log("Details:", err.response.data);
        }
    }
}

testEmail();

import twilio from 'twilio'

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

// Local numbers are stored as 10-digit Sri Lankan mobile numbers (e.g. 0712345678)
const toE164 = (phoneNumber) => phoneNumber.startsWith('+') ? phoneNumber : `+94${phoneNumber.replace(/^0/, '')}`

export const sendSMS = async (phoneNumber, message) => {
    await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: toE164(phoneNumber)
    })
}

export default client

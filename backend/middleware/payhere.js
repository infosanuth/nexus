// Uses the App ID/Secret from Settings > API Keys, not PAYHERE_MERCHANT_ID/SECRET.
const PAYHERE_BASE_URL = 'https://sandbox.payhere.lk'

const getPayHereAccessToken = async () => {
    const appId = process.env.PAYHERE_APP_ID
    const appSecret = process.env.PAYHERE_APP_SECRET

    if (!appId || !appSecret) {
        throw new Error('Missing PAYHERE_APP_ID or PAYHERE_APP_SECRET in backend environment')
    }

    const basicAuth = Buffer.from(`${appId}:${appSecret}`).toString('base64')

    const response = await fetch(`${PAYHERE_BASE_URL}/merchant/v1/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`
        },
        body: 'grant_type=client_credentials'
    })

    const data = await response.json()
    if (!response.ok || !data.access_token) {
        throw new Error(data.error_description || 'Failed to get PayHere access token')
    }

    return data.access_token
}

// Fallback for when the notify webhook never fired (e.g. localhost notify_url).
const getPayHerePaymentIdByOrderId = async (orderId) => {
    const accessToken = await getPayHereAccessToken()

    const response = await fetch(`${PAYHERE_BASE_URL}/merchant/v1/payment/search?order_id=${encodeURIComponent(orderId)}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })

    const data = await response.json()
    if (!response.ok || data.status !== 1 || !data.data || !data.data.length) {
        throw new Error(data.msg || 'No PayHere payment found for this order')
    }

    return data.data[0].payment_id
}


// paymentId must be PayHere's own payment_id, not our appointment/order id.
const refundPayHerePayment = async (paymentId, description) => {
    const accessToken = await getPayHereAccessToken()

    const response = await fetch(`${PAYHERE_BASE_URL}/merchant/v1/payment/refund`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ payment_id: paymentId, description })
    })

    const data = await response.json()
    if (!response.ok || data.status !== 1) {
        throw new Error(data.msg || 'PayHere refund request failed')
    }

    return data
}

export { refundPayHerePayment, getPayHerePaymentIdByOrderId }

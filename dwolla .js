import axios from 'axios';

const DWOLLA_API_BASE = 'https://api-sandbox.dwolla.com'; // Use sandbox for testing

// Your Dwolla credentials
const CLIENT_ID = '7VpLdBxuYCzk6tsv4ct2lO1AdggI7RfpcknghhMeQNk00K5wih';
const CLIENT_SECRET = 'D5aQi9efaZpePfSr5AE8BAuo8LjkYj8Rm8qvNy4xBWfvqCUlOp';
const FUNDING_SOURCE_ID = '9b276257-6e36-4588-bd31-30ac46f92489';

async function getAccessToken() {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('scope', 'transfers');

  const response = await axios.post(`${DWOLLA_API_BASE}/token`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  return response.data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { amount, transactionId } = req.body;

  if (!amount) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const token = await getAccessToken();

    // Create a transfer using the provided funding source ID
    const transferResponse = await axios.post(
      `${DWOLLA_API_BASE}/transfers`,
      {
        _links: {
          source: { href: `${DWOLLA_API_BASE}/funding-sources/${FUNDING_SOURCE_ID}` },
          destination: { href: `${DWOLLA_API_BASE}/funding-sources/${FUNDING_SOURCE_ID}` } // Adjust as needed
        },
        amount: {
          currency: 'USD',
          value: amount.toFixed(2)
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ success: true, transfer: transferResponse.data });
  } catch (error) {
    console.error('Dwolla payment error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Payment failed', error: error.response?.data || error.message });
  }
}

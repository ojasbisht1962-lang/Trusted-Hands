const config = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://trustedhands-backend.onrender.com',
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id',
  GEMINI_API_KEY: process.env.REACT_APP_GEMINI_API_KEY || 'your-gemini-api-key',
  APP_NAME: 'TrustedHands',
  APP_DESCRIPTION: 'Your trusted marketplace for freelance and gig services',
};

export default config;

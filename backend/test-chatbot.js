const fetch = require('node-fetch');

// Test the chatbot endpoint
async function testChatbot() {
    try {
        const response = await fetch('http://localhost:5000/api/chatbot/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Hello, tell me about the ERP system'
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testChatbot();
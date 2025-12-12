document.addEventListener('DOMContentLoaded', () => {
    const chatHistory = document.getElementById('chat-history');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const getContextBtn = document.getElementById('get-context-btn');

    // CONFIGURATION
    // Change this to your Cloud Run URL after deployment (e.g., "https://smart-web-atlas-xyz.run.app")
    // Keep it as localhost for local testing.
    const API_BASE_URL = "http://localhost:8000";
    // const API_BASE_URL = "https://<YOUR-CLOUD-RUN-URL>";

    let currentContext = null;

    // Function to append messages to chat
    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        msgDiv.textContent = text;
        chatHistory.appendChild(msgDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Function to get context from the active tab
    async function getTabContext() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: "getPageContext" });
            if (response) {
                currentContext = response;
                console.log("Context loaded:", currentContext);
                appendMessage("Context updated for: " + currentContext.title, "system");
            }
        } catch (error) {
            console.error("Error getting context:", error);
            appendMessage("Could not connect to page. Try refreshing the page.", "system");
        }
    }

    // Function to send query to backend
    async function sendQuery() {
        const query = userInput.value.trim();
        if (!query) return;

        if (!currentContext) {
            await getTabContext();
            if (!currentContext) {
                appendMessage("Please refresh context first.", "system");
                return;
            }
        }

        appendMessage(query, "user");
        userInput.value = '';

        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: currentContext.url,
                    title: currentContext.title,
                    content: currentContext.content,
                    query: query,
                    history: [] // TODO: Implement history
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            appendMessage(data.response, "assistant");

        } catch (error) {
            console.error("Error calling backend:", error);
            appendMessage("Error communicating with backend.", "system");
        }
    }

    // Event Listeners
    sendBtn.addEventListener('click', sendQuery);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendQuery();
        }
    });
    getContextBtn.addEventListener('click', getTabContext);

    // Initial context load
    getTabContext();
});

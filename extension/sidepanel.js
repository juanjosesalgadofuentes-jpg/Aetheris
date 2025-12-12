document.addEventListener('DOMContentLoaded', () => {
    const chatHistory = document.getElementById('chat-history');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const getContextBtn = document.getElementById('get-context-btn');

    // CONFIGURATION
    // Aetheris Production Backend
    const API_BASE_URL = "https://genai-app-imagecompositionwithmulti-1-17654946525-212653614700.us-central1.run.app";

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

        if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
            appendMessage("I cannot read browser settings pages. Please try me on a real website (like Wikipedia or Google News).", "system");
            return;
        }

        // Ensure content script is injected
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
        } catch (e) {
            // Script might already be there or cannot access this tab (e.g. chrome:// urls)
            console.log("Injection skipped or failed:", e);
        }

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
            appendMessage("Reading page...", "system");
            await getTabContext();
            if (!currentContext) {
                appendMessage("I still can't see the page. Please try refreshing the website tab.", "system");
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
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendQuery();
        }
    });
    getContextBtn.addEventListener('click', getTabContext);

    // Initial context load
    getTabContext();
});

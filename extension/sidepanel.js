document.addEventListener('DOMContentLoaded', () => {
    const chatHistory = document.getElementById('chat-history');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const getContextBtn = document.getElementById('get-context-btn');

    // CONFIGURATION
    // Aetheris Production Backend
    const API_BASE_URL = "https://smart-web-atlas-backend-212653614700.us-central1.run.app";

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
            console.log("Injection skipped or failed:", e);
            // Don't return, maybe it's already there
        }

        try {
            // Race sendMessage with a 2-second timeout so it doesn't hang forever
            const response = await Promise.race([
                chrome.tabs.sendMessage(tab.id, { action: "getPageContext" }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout getting page content")), 2000))
            ]);

            if (response) {
                currentContext = response;
                appendMessage("Context updated: " + currentContext.title.substring(0, 30) + "...", "system");
            }
        } catch (error) {
            console.error("Error getting context:", error);
            appendMessage("Could not read page: " + error.message, "system");
            appendMessage("Try reloading the page.", "system");
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

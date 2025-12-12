// Listen for messages from the side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPageContext") {
        const pageContext = {
            title: document.title,
            url: window.location.href,
            content: document.body.innerText.substring(0, 10000) // Limit content for now
        };
        sendResponse(pageContext);
    }
    return true; // Keep the message channel open for async response
});

document.getElementById('save-page').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "SAVE_CURRENT_TAB" }, (response) => {
        if (chrome.runtime.lastError) console.debug("Popup closed before response:", chrome.runtime.lastError.message);
        window.close();
    });
});

document.getElementById('capture-screenshot').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "SAVE_SCREENSHOT" }, (response) => {
        if (chrome.runtime.lastError) console.debug("Popup closed before response:", chrome.runtime.lastError.message);
        window.close();
    });
});

document.getElementById('open-dashboard').addEventListener('click', () => {
    // Use configured URL or fallback
    const dashboardUrl = (typeof CONFIG !== 'undefined' && CONFIG.WEB_URL) ? `${CONFIG.WEB_URL}/dashboard` : 'http://localhost:3000/dashboard';
    chrome.tabs.create({ url: dashboardUrl });
});

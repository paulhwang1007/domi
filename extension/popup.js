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
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
});

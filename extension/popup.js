document.getElementById('save-page').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "SAVE_CURRENT_TAB" });
    window.close();
});

document.getElementById('capture-screenshot').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "SAVE_SCREENSHOT" });
    window.close();
});

document.getElementById('open-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
});

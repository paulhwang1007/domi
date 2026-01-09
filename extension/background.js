// Domi Extension Background Script

importScripts('config.js');

const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_KEY = CONFIG.SUPABASE_KEY;
const WEB_URL = CONFIG.WEB_URL;
const PROJECT_REF = CONFIG.PROJECT_REF;

// --- Authentication Helper ---
async function getAccessToken() {
    try {
        // 1. Try Configured URL
        let cookies = await chrome.cookies.getAll({ url: WEB_URL }); 
        
        // 2. Fallback: Try common localhost ports if WEB_URL didn't yield results
        if (!cookies || cookies.length === 0) {
            const localhostCookies = await chrome.cookies.getAll({ url: "http://localhost:3000" });
            const loopbackCookies = await chrome.cookies.getAll({ url: "http://127.0.0.1:3000" });
            cookies = [...localhostCookies, ...loopbackCookies];
        }
        
        const tokenName = `sb-${PROJECT_REF}-auth-token`;
        // Look for exact match or the standard Supabase pattern
        let cookie = cookies.find(c => c.name === tokenName) || cookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

        if (cookie) {
            console.log("DEBUG: Found Auth Cookie", cookie.name);
            return parseToken(cookie.value);
        }
    } catch (e) {
        console.error("Cookie check failed:", e);
    }

    // 2. Fallback: Try reading LocalStorage from an open Dashboard tab
    console.log("DEBUG: Cookie failed. Trying LocalStorage from open tab...");
    try {
        // Match patterns do not support ports. Query known dashboard URLs.
        const dashboardPatterns = ["http://localhost/*", "http://127.0.0.1/*"];
        if (WEB_URL && !WEB_URL.includes("localhost") && !WEB_URL.includes("127.0.0.1")) {
            dashboardPatterns.push(`${WEB_URL}/*`);
        }
        
        const tabs = await chrome.tabs.query({ url: dashboardPatterns });
        if (tabs.length > 0) {
            // Prefer the configured WEB_URL if found, otherwise localhost
            let dashboardTab = tabs.find(t => t.url && t.url.startsWith(WEB_URL));
            if (!dashboardTab) dashboardTab = tabs.find(t => t.url && t.url.includes(":3000"));
            
            if (dashboardTab) {
                const tabId = dashboardTab.id;
                console.log("DEBUG: Found open Dashboard tab:", tabId);
            
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: (projectRef) => {
                    console.log("Domi Extension Probe: Checking Storage...");
                    const debugInfo = {
                        cookies: document.cookie,
                        localStorageKeys: [],
                        foundToken: null
                    };

                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        debugInfo.localStorageKeys.push({ key, valLength: localStorage.getItem(key).length });
                        
                        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                            console.log("Domi: Found token in LS:", key);
                            return localStorage.getItem(key);
                        }
                    }
                    
                    // Fallback: Check document.cookie manually just in case
                    // Fallback: Check document.cookie manually just in case
                    if (document.cookie) {
                         console.log("Domi: Checking document.cookie", document.cookie);
                         // Try strict match first
                         const match = document.cookie.split('; ').find(row => row.startsWith(`sb-${projectRef}-auth-token=`));
                         if (match) return match.split('=')[1];
                         
                         // Try looser match (any sb-*-auth-token)
                         const looseMatch = document.cookie.split('; ').find(row => row.startsWith('sb-') && row.endsWith('-auth-token='));
                         if (looseMatch) return looseMatch.split('=')[1];
                    }

                    console.log("Domi Probe Result:", debugInfo);
                    return null;
                },
                args: [PROJECT_REF]
            });

            if (results && results[0] && results[0].result) {
                console.log("DEBUG: Found token via script injection!");
                return parseToken(results[0].result);
            } else {
                console.log("DEBUG: Script injection finished but returned no token.");
            }
        }
        } else {
             console.log("DEBUG: No open Dashboard tab found.");
        }
    } catch (e) {
        console.error("LocalStorage check failed:", e);
    }

    return null;
}

function parseToken(rawValue) {
    try {
        let val = rawValue;
        if (val.startsWith("base64-")) val = atob(val.slice(7));
        const session = JSON.parse(val);
        if (session.access_token) return session.access_token;
        if (Array.isArray(session) && session[0]) return session[0];
    } catch (e) {
        return rawValue;
    }
    return rawValue;
}

// --- API Interaction ---
async function getUser(token) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) return null;
    return await response.json();
}

// --- Validation ---
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}

async function saveClip(type, data) {
    console.log("Save Clip Triggered:", type, data);
    
    // Security: Validate URL
    if ((type === 'url' || type === 'image' || type === 'pdf') && data.srcUrl) {
        if (!isValidUrl(data.srcUrl)) {
            console.error("Security Block: Invalid URL protocol", data.srcUrl);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Save Failed',
                message: 'Invalid URL. Only HTTP/HTTPS links are supported.'
            });
            return;
        }
    }

    const token = await getAccessToken();
    
    if (!token) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png', 
            title: 'Domi: Login Required',
            message: 'Could not find login session. Please log in to ' + WEB_URL
        });
        return;
    }

    try {
        // 1. Get User ID
        const user = await getUser(token);
        if (!user || !user.id) {
             throw new Error("Invalid User Token. Please log out and back in.");
        }

        // 2. Prepare Payload
        const payload = {
            type: type,
            title: data.title || "Untitled",
            src_url: data.srcUrl || "",
            content: data.content || "",
            description: "",
            tags: [],
            user_id: user.id
        };

        // 3. Save to Supabase
        const response = await fetch(`${SUPABASE_URL}/rest/v1/clips`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Supabase Save Error:", response.status, errText);
            throw new Error(`Save Failed (${response.status}): ${errText.substring(0, 100)}...`);
        }

        const savedData = await response.json();
        const clip = savedData[0];

        console.log("Saved Success:", clip);

        // 4. Trigger Toast in Active Tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
             function sendToast() {
                chrome.tabs.sendMessage(tab.id, {
                    action: "SHOW_TOAST",
                    clip: clip
                }).catch(err => {
                    console.warn("Toast send failed, falling back to notification:", err);
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon128.png',
                        title: 'Saved to Domi!',
                        message: `${clip.title}`
                    });
                });
             }

             // Try to inject content script if it wasn't there (e.g. on soft reload)
             // Check if we can talk to it first?
             // Actually, just try to inject it cleanly using scripting API to be safe
             try {
                 await chrome.scripting.executeScript({
                     target: { tabId: tab.id },
                     files: ['content.js']
                 });
                 // Give it a split second to initialize listeners
                 setTimeout(sendToast, 100);
             } catch (injectionErr) {
                 console.log("Content script injection failed (maybe already there or restricted):", injectionErr);
                 // Try sending anyway
                 sendToast();
             }
        }

    } catch (e) {
        console.error("Save Failed:", e);
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Save Failed',
            message: e.message
        });
    }
}

async function updateClip(clipId, updates) {
    const token = await getAccessToken();
    if (!token) return;

    try {
        await fetch(`${SUPABASE_URL}/rest/v1/clips?id=eq.${clipId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        console.log("Updated Clip:", clipId);
    } catch (e) {
        console.error("Update Failed:", e);
    }
}


// --- Listeners ---

// 1. Installation: Create Context Menus
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "domi-root",
        title: "Save to Domi",
        contexts: ["all"]
    });

    chrome.contextMenus.create({
        parentId: "domi-root",
        id: "save-page",
        title: "Save Page",
        contexts: ["page"]
    });

    chrome.contextMenus.create({
        parentId: "domi-root",
        id: "save-selection",
        title: "Save Highlight",
        contexts: ["selection"]
    });

    chrome.contextMenus.create({
        parentId: "domi-root",
        id: "save-image",
        title: "Save Image",
        contexts: ["image"]
    });

    chrome.contextMenus.create({
        parentId: "domi-root",
        id: "save-link",
        title: "Save Link",
        contexts: ["link"]
    });
});

// 2. Context Menu Action
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case "save-page":
            saveClip('url', { title: tab.title, srcUrl: tab.url });
            break;
        case "save-selection":
            saveClip('text', { title: tab.title, srcUrl: tab.url, content: info.selectionText });
            break;
        case "save-image":
            saveClip('image', { title: "Image from " + tab.title, srcUrl: info.srcUrl });
            break;
        case "save-link":
            let type = 'url';
            if (info.linkUrl.toLowerCase().endsWith('.pdf')) {
                type = 'pdf';
            }
            saveClip(type, { title: info.selectionText || "Saved Link", srcUrl: info.linkUrl });
            break;
    }
});

// 3. Keyboard Shortcut Action
chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "save_page") {
        saveClip('url', { title: tab.title, srcUrl: tab.url });
    }
});

// 4. Message Listener (from Content Script)
// 4. Message Listener (from Content Script)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "UPDATE_CLIP") {
        updateClip(request.clipId, request.updates);
    }
    else if (request.action === "SAVE_CURRENT_TAB") {
        // Acknowledge receipt immediately so popup can close safely
        sendResponse({ success: true });
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) saveClip('url', { title: tabs[0].title, srcUrl: tabs[0].url });
        });
    }
    else if (request.action === "SAVE_SCREENSHOT") {
         sendResponse({ success: true });
         
         // Trigger selection UI in content script, injecting if necessary
         chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
             const tab = tabs[0];
             if (!tab) return;
             
             try {
                // Try sending message first
                await chrome.tabs.sendMessage(tab.id, { action: "START_SELECTION" });
             } catch (err) {
                 console.log("Domi: Content script not found, injecting...", err);
                 // If failed, inject script and try again
                 try {
                     await chrome.scripting.executeScript({
                         target: { tabId: tab.id },
                         files: ['content.js']
                     });
                     // Give it a moment to initialize
                     setTimeout(() => {
                         chrome.tabs.sendMessage(tab.id, { action: "START_SELECTION" }).catch(e => console.error("Second attempt failed:", e));
                     }, 100);
                 } catch (injectionErr) {
                     console.error("Domi: Failed to inject content script:", injectionErr);
                     chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon128.png', 
                        title: 'Selection Failed',
                        message: 'Could not load selection tool on this page. Try refreshing the page.'
                    });
                 }
             }
         });
    }
    else if (request.action === "CAPTURE_VISIBLE_AREA") {
        const area = request.area;
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                console.error("Capture failed:", chrome.runtime.lastError.message);
                return;
            }
            // Send back to content script for cropping (since background can't use Canvas easily)
             chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                 if (tabs[0]) {
                     chrome.tabs.sendMessage(tabs[0].id, { 
                        action: "CROP_IMAGE",
                        dataUrl: dataUrl,
                        area: area
                     }).catch(err => {
                         console.error("Failed to send CROP_IMAGE:", err);
                         chrome.notifications.create({
                            type: 'basic',
                            iconUrl: 'icons/icon128.png', 
                            title: 'Capture Error',
                            message: 'Could not process screenshot. Please reload the page and try again.'
                        });
                     });
                 }
             });
        });
        sendResponse({ success: true }); // Ack (optional)
    }
    else if (request.action === "UPLOAD_CROPPED_IMAGE") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) saveScreenshot(request.dataUrl, tabs[0]);
        });
        sendResponse({ success: true });
    }
});

async function saveScreenshot(dataUrl, tab) {
    const token = await getAccessToken();
    if (!token) {
         chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon128.png', title: 'Login Required', message: 'Log in to Domi.' });
         return;
    }
    
    // Convert DataURL to Blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const user = await getUser(token); 
    
    if (!user) return;
    
    const fileName = `${user.id}/${Date.now()}.png`;
    
    try {
        const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/domi-uploads/${fileName}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'image/png'
            },
            body: blob
        });
        
        if (!uploadRes.ok) throw new Error('Upload failed');
        
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/domi-uploads/${fileName}`;
        
        saveClip('image', {
            title: "Screenshot of " + tab.title,
            srcUrl: publicUrl
        });
        
    } catch (e) {
        console.error("Screenshot failed:", e);
    }
}

// Background Script
const SUPABASE_URL = "https://ebynzdfllhomhlcraogx.supabase.co";
const SUPABASE_KEY = "sb_publishable_Asik6IXCqmlVeuCcdcMx6g_rlA-Uuvd";

// Helper to get session (Mock implementation or real cookie check)
async function getSession() {
  // In a real app, we check chrome.cookies or storage
  // const cookie = await chrome.cookies.get({ url: 'http://localhost:3000', name: 'sb-access-token' });
  // return cookie?.value;
  
  // For MVP/Testing without real auth, we might just return null or a mock if testing
  return null; 
}

async function startCapture(type, data) {
  console.log(`Starting capture: ${type}`, data);
  
  const token = await getSession();
  if (!token) {
    console.warn("User not logged in");
    // We could open login page here
    return;
  }

  const payload = {
    type,
    content: data.content,
    src_url: data.srcUrl,
    title: data.title || "Untitled",
    status: 'pending'
  };

  try {
     const response = await fetch(`${SUPABASE_URL}/rest/v1/clips`, {
         method: 'POST',
         headers: {
             'apikey': SUPABASE_KEY,
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json',
             'Prefer': 'return=minimal'
         },
         body: JSON.stringify(payload)
     });
     
     if (response.ok) {
         console.log("Saved successfully!");
         // Show notification?
     } else {
         console.error("Save failed", await response.text());
     }
  } catch (e) {
      console.error("Network error", e);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "domi-save-image",
    title: "Save Image to Domi",
    contexts: ["image"]
  });

  chrome.contextMenus.create({
    id: "domi-save-selection",
    title: "Save Selection to Domi",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "domi-save-page",
    title: "Save Page to Domi",
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "domi-save-image") {
    startCapture('image', { srcUrl: info.srcUrl, title: tab.title });
  } else if (info.menuItemId === "domi-save-selection") {
    startCapture('text', { content: info.selectionText, srcUrl: info.pageUrl, title: tab.title });
  } else if (info.menuItemId === "domi-save-page") {
    startCapture('url', { srcUrl: tab.url, title: tab.title });
  }
});


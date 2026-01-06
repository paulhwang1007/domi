// Domi Content Script
// Listens for 'SHOW_TOAST' from background and renders a notification overlay.
if (window.DOMI_CONTENT_INITIALIZED) {
    console.log("🚀 Domi: Content Script already loaded.");
    // If we want to support re-initialization logic, we could do it here
    // but for now we just exit to avoid errors.
} else {

window.DOMI_CONTENT_INITIALIZED = true;
console.log("🚀 Domi: Content Script Loaded on this page!");

const HOST_ID = 'domi-extension-host';

function createToast(clip) {
    const existing = document.getElementById(HOST_ID);
    if (existing) existing.remove();

    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.position = 'fixed';
    host.style.top = '20px';
    host.style.right = '20px';
    host.style.zIndex = '2147483647';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    // Styles
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            background: rgba(14, 12, 37, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 12px 16px;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            gap: 12px;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
            min-width: 200px;
        }
        .toast.visible {
            opacity: 1;
            transform: translateY(0);
        }
        .check {
            width: 20px;
            height: 20px;
            background: #22c55e;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: black;
            font-size: 12px;
            flex-shrink: 0;
        }
        .content {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .title {
            font-weight: 600;
            font-size: 13px;
            color: #fff;
        }
        .subtitle {
            font-size: 11px;
            color: #a1a1aa;
        }
    `;
    shadow.appendChild(style);

    // Elements
    const container = document.createElement('div');
    container.className = 'toast';
    
    // Truncate title for display
    let displayTitle = clip.title || "Unknown Page";
    if (displayTitle.length > 30) displayTitle = displayTitle.substring(0, 30) + "...";

    container.innerHTML = `
        <div class="check">✓</div>
        <div class="content">
            <div class="title">Saved to Domi</div>
            <div class="subtitle">${displayTitle}</div>
        </div>
    `;
    
    shadow.appendChild(container);

    requestAnimationFrame(() => {
        container.classList.add('visible');
    });

    // Auto-remove after 3 seconds
    setTimeout(() => {
        container.classList.remove('visible');
        setTimeout(() => host.remove(), 300);
    }, 3000);
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SHOW_TOAST") {
        createToast(request.clip);
    } 
    else if (request.action === "START_SELECTION") {
        initAreaSelection();
    }
    else if (request.action === "CROP_IMAGE") {
        cropAndUpload(request.dataUrl, request.area);
    }
});

function initAreaSelection() {
    // 1. Create Overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '2147483646'; // Just below toast
    overlay.style.cursor = 'crosshair';
    overlay.style.background = 'rgba(0,0,0,0.3)';
    
    document.body.appendChild(overlay);

    let startX, startY, isSelecting = false;
    const selectionBox = document.createElement('div');
    selectionBox.style.position = 'fixed';
    selectionBox.style.border = '2px solid #a855f7';
    selectionBox.style.background = 'rgba(168, 85, 247, 0.1)';
    selectionBox.style.zIndex = '2147483647';
    overlay.appendChild(selectionBox);

    const onMouseDown = (e) => {
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;
        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        e.preventDefault();
        e.stopPropagation();
    };

    const onMouseMove = (e) => {
        if (!isSelecting) return;
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);

        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
    };

    const onMouseUp = (e) => {
        if (!isSelecting) return;
        isSelecting = false;
        
        const rect = selectionBox.getBoundingClientRect();
        
        // Remove UI
        document.body.removeChild(overlay);
        
        if (rect.width > 10 && rect.height > 10) {
            // Send coordinates to background to capture screen
            // Account for device pixel ratio
            const scale = window.devicePixelRatio;
            const area = {
                x: rect.left * scale,
                y: rect.top * scale,
                width: rect.width * scale,
                height: rect.height * scale
            };
            
            chrome.runtime.sendMessage({ 
                action: "CAPTURE_VISIBLE_AREA", 
                area: area 
            });
        }
    };

    overlay.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}

function cropAndUpload(dataUrl, area) {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = area.width;
        canvas.height = area.height;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
        
        const croppedDataUrl = canvas.toDataURL('image/png');
        
        // Send back to background to upload
        chrome.runtime.sendMessage({
            action: "UPLOAD_CROPPED_IMAGE",
            dataUrl: croppedDataUrl
        });
    };
    img.src = dataUrl;
}
} // End of initialization guard

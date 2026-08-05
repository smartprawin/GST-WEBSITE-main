/**
 * Google AdSense Video Ad Popup
 * Shows a small video ad popup on page load
 */

function initVideoAd() {
    // Create popup container
    const popup = document.createElement('div');
    popup.id = 'video-ad-popup';
    popup.innerHTML = `
        <div class="video-ad-content">
            <button class="video-ad-close" onclick="closeVideoAd()">&times;</button>
            <div class="video-ad-header">Advertisement</div>
            <div class="video-ad-body">
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="ca-pub-5527929723291753"
                     data-ad-slot="3205459820"
                     data-ad-format="video"></ins>
                <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
            </div>
            <div class="video-ad-footer">
                <button class="video-ad-btn" onclick="closeVideoAd()">Skip Ad</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        #video-ad-popup {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            display: none;
        }
        .video-ad-content {
            position: relative;
            width: 300px;
            background: #1a1a2e;
            border-radius: 10px;
            box-shadow: 0 6px 24px rgba(0,0,0,0.4);
            z-index: 99999;
            overflow: hidden;
        }
        .video-ad-close {
            position: absolute;
            top: 8px;
            right: 12px;
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 10;
        }
        .video-ad-header {
            background: #0d2566;
            color: white;
            padding: 6px 10px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .video-ad-body {
            padding: 10px;
            min-height: 140px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .video-ad-footer {
            padding: 6px 10px;
            text-align: center;
            border-top: 1px solid #16213e;
        }
        .video-ad-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 5px 16px;
            border-radius: 16px;
            cursor: pointer;
            font-size: 12px;
        }
        .video-ad-btn:hover {
            background: #c82333;
        }
    `;
    document.head.appendChild(style);

    // Show popup after 3 seconds
    setTimeout(() => {
        popup.style.display = 'block';
    }, 3000);
}

function closeVideoAd() {
    const popup = document.getElementById('video-ad-popup');
    if (popup) {
        popup.style.display = 'none';
        popup.remove();
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVideoAd);
} else {
    initVideoAd();
}

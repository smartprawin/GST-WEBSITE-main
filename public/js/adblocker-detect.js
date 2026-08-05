/**
 * Ad Blocker Detection - Strict
 * Website blocked if AdSense is blocked
 */

let adBlockDetected = false;

function detectAdBlocker() {
    if (adBlockDetected) return;
    
    // Create a bait div with ad-related class
    const bait = document.createElement('div');
    bait.className = 'adsbox ad-placement banner-ad';
    bait.innerHTML = '&nbsp;';
    bait.style.cssText = 'position:absolute;left:-9999px;width:300px;height:250px;';
    document.body.appendChild(bait);
    
    // Wait a moment then check
    setTimeout(() => {
        const baitHidden = (
            bait.offsetHeight === 0 || 
            bait.clientHeight === 0 || 
            getComputedStyle(bait).display === 'none'
        );
        
        document.body.removeChild(bait);
        
        if (baitHidden) {
            adBlockDetected = true;
            showAdBlockerWarning();
        }
    }, 100);
}

function showAdBlockerWarning() {
    const existing = document.getElementById('adblocker-warning');
    if (existing) return;

    // Hide all page content
    document.body.style.overflow = 'hidden';

    const warning = document.createElement('div');
    warning.id = 'adblocker-warning';
    warning.innerHTML = `
        <div class="adblocker-overlay"></div>
        <div class="adblocker-modal">
            <div class="adblocker-icon">🚫</div>
            <h2>Ad Blocker Detected</h2>
            <p>This website cannot be accessed with an ad blocker enabled. Please disable your ad blocker to continue.</p>
            <div class="adblocker-options">
                <div class="adblocker-option">
                    <strong>How to disable:</strong>
                </div>
                <div class="adblocker-option">
                    1. Click the ad blocker icon in your browser toolbar
                </div>
                <div class="adblocker-option">
                    2. Select "Pause on this site" or "Disable"
                </div>
                <div class="adblocker-option">
                    3. Refresh this page
                </div>
            </div>
            <div class="adblocker-buttons">
                <button onclick="location.reload()" class="adblocker-btn-refresh">Refresh Page</button>
                <a href="https://www.google.com/chrome/" target="_blank" class="adblocker-btn-chrome">Get Chrome</a>
            </div>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        #adblocker-warning {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .adblocker-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
        }
        .adblocker-modal {
            position: relative;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border-radius: 16px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 1px solid #0d2566;
        }
        .adblocker-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        .adblocker-modal h2 {
            color: #e94560;
            font-size: 24px;
            margin-bottom: 15px;
        }
        .adblocker-modal p {
            color: #b0bec5;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .adblocker-options {
            text-align: left;
            margin: 20px 0;
        }
        .adblocker-option {
            background: rgba(255, 255, 255, 0.05);
            padding: 12px 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            color: #e0e0e0;
            font-size: 14px;
        }
        .adblocker-option strong {
            color: #4fc3f7;
        }
        .adblocker-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 25px;
        }
        .adblocker-btn-refresh {
            background: #e94560;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        .adblocker-btn-refresh:hover {
            background: #d63851;
        }
        .adblocker-btn-chrome {
            background: transparent;
            color: #90a4ae;
            border: 1px solid #455a64;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s;
        }
        .adblocker-btn-chrome:hover {
            background: #455a64;
            color: white;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(warning);
}

// Run detection on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectAdBlocker);
} else {
    detectAdBlocker();
}

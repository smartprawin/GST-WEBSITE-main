/**
 * Collapse Empty Ad Slots
 * Hides .ad-container divs when the AdSense ad inside them
 * did not render (e.g. ad blocked, no fill, ad not enabled).
 * When the ad renders, the space stays visible.
 */
(function () {
    function collapseEmptyAds() {
        var containers = document.querySelectorAll('.ad-container');
        containers.forEach(function (container) {
            var ins = container.querySelector('ins.adsbygoogle');
            if (!ins) return;

            var adStatus = ins.getAttribute('data-ad-status');
            var isEmpty = false;

            if (adStatus === 'unfilled') {
                isEmpty = true;
            } else if (adStatus !== 'filled') {
                var insHeight = ins.offsetHeight;
                var insWidth = ins.offsetWidth;
                var hasContent = ins.childNodes.length > 0;
                if (insHeight === 0 || insWidth === 0 || !hasContent) {
                    isEmpty = true;
                }
            }

            if (isEmpty) {
                container.style.display = 'none';
                container.setAttribute('data-ad-empty', 'true');
            } else {
                container.style.display = '';
                container.setAttribute('data-ad-empty', 'false');
            }
        });
    }

    function retry() {
        collapseEmptyAds();
        window.setTimeout(collapseEmptyAds, 1000);
        window.setTimeout(collapseEmptyAds, 3000);
        window.setTimeout(collapseEmptyAds, 5000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', retry);
    } else {
        retry();
    }

    window.addEventListener('load', collapseEmptyAds);

    if (window.MutationObserver) {
        var observer = new MutationObserver(collapseEmptyAds);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-ad-status'],
            childList: true,
            subtree: true
        });
    }
})();

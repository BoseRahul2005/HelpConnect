document.addEventListener('DOMContentLoaded', () => {
    const tabs = Array.from(document.querySelectorAll('[data-ngo-tab]'));
    const panels = Array.from(document.querySelectorAll('[data-ngo-panel]'));
    const shareButton = document.querySelector('[data-ngo-share-button]');
    const followButton = document.querySelector('[data-ngo-follow-button]');
    const shell = document.querySelector('[data-ngo-profile-shell]');
    const ngoDisplayName = shell?.dataset.ngoDisplayName || document.title.replace(/\s*\|.*$/, '').trim() || 'NGO';
    const followStorageKey = 'helpconnect.followedNgos';

    function normalizeNgoKey(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '');
    }

    function loadFollowedNgoKeys() {
        try {
            const parsedKeys = JSON.parse(window.localStorage.getItem(followStorageKey) || '[]');
            return Array.isArray(parsedKeys) ? parsedKeys : [];
        } catch {
            return [];
        }
    }

    function saveFollowedNgoKeys(keys) {
        window.localStorage.setItem(followStorageKey, JSON.stringify(keys));
    }

    function isNgoFollowed(name) {
        return loadFollowedNgoKeys().includes(normalizeNgoKey(name));
    }

    function setNgoFollowed(name, shouldFollow) {
        const normalizedName = normalizeNgoKey(name);
        const nextKeys = new Set(loadFollowedNgoKeys());

        if (shouldFollow) {
            nextKeys.add(normalizedName);
        } else {
            nextKeys.delete(normalizedName);
        }

        saveFollowedNgoKeys(Array.from(nextKeys));
        return nextKeys.has(normalizedName);
    }

    function syncFollowButtonState() {
        if (!followButton) {
            return;
        }

        const isFollowing = isNgoFollowed(ngoDisplayName);
        followButton.classList.toggle('is-following', isFollowing);
        followButton.setAttribute('aria-pressed', isFollowing ? 'true' : 'false');
        followButton.textContent = isFollowing ? 'Following' : 'Follow';
    }

    function showPanel(panelName) {
        tabs.forEach((tab) => {
            const isActive = tab.dataset.ngoTab === panelName;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        panels.forEach((panel) => {
            panel.classList.toggle('active', panel.dataset.ngoPanel === panelName);
        });
    }

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            showPanel(tab.dataset.ngoTab);
        });
    });

    if (followButton) {
        followButton.addEventListener('click', () => {
            const isFollowing = followButton.classList.contains('is-following');
            setNgoFollowed(ngoDisplayName, !isFollowing);
            syncFollowButtonState();
        });
    }

    syncFollowButtonState();

    if (shareButton) {
        shareButton.addEventListener('click', async () => {
            const shareData = {
                title: document.title,
                url: window.location.href,
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    return;
                } catch {
                    // Fall through to clipboard copy.
                }
            }

            try {
                await navigator.clipboard.writeText(window.location.href);
                const originalLabel = shareButton.textContent;
                shareButton.textContent = 'Copied';
                window.setTimeout(() => {
                    shareButton.textContent = originalLabel;
                }, 1400);
            } catch {
                shareButton.textContent = 'Share';
            }
        });
    }
});
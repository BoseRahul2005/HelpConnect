document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('[data-profile-tab]');
    const panels = document.querySelectorAll('[data-profile-panel]');

    function showPanel(panelName) {
        tabs.forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.profileTab === panelName);
        });

        panels.forEach((panel) => {
            panel.classList.toggle('active', panel.dataset.profilePanel === panelName);
        });
    }

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            showPanel(tab.dataset.profileTab);
        });
    });

    showPanel('overview');
});
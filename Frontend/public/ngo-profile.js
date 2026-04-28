(function() {
    'use strict';

    const shell = document.querySelector('.ngo-profile-shell');
    const isOwner = shell.dataset.ngoIsOwner === 'true';

    // Tab Switching Logic
    const tabs = document.querySelectorAll('[data-ngo-tab]');
    const panels = document.querySelectorAll('[data-ngo-panel]');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.ngoTab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            panels.forEach(p => {
                p.classList.toggle('active', p.dataset.ngoPanel === target);
            });
        });
    });

    if (isOwner) {
        initOwnerActions();
    }

    function initOwnerActions() {
        // Hamburger Menu
        const menuBtn = document.querySelector('[data-ngo-menu-button]');
        const menuCard = document.querySelector('[data-ngo-menu-card]');

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuCard.hidden = !menuCard.hidden;
        });

        document.addEventListener('click', () => {
            if (menuCard) menuCard.hidden = true;
        });

        // Logout
        document.querySelector('[data-ngo-logout-button]').addEventListener('click', () => {
            window.location.href = '/logout';
        });

        // Delete Account
        const deleteBtn = document.querySelector('[data-ngo-delete-button]');
        const confirmModal = document.querySelector('[data-ngo-confirm-modal]');
        const cancelModal = document.querySelector('[data-ngo-modal-cancel]');
        const confirmAction = document.querySelector('[data-ngo-modal-confirm]');

        deleteBtn.addEventListener('click', () => {
            confirmModal.hidden = false;
        });

        cancelModal.addEventListener('click', () => {
            confirmModal.hidden = true;
        });

        confirmAction.addEventListener('click', async () => {
            confirmAction.disabled = true;
            confirmAction.textContent = 'Deleting...';
            
            try {
                const res = await fetch('/ngo/delete', { method: 'POST' });
                if (res.ok) {
                    window.location.href = '/';
                } else {
                    alert('Failed to delete account. Please try again.');
                    confirmAction.disabled = false;
                    confirmAction.textContent = 'Delete Forever';
                }
            } catch (err) {
                alert('An error occurred.');
                confirmAction.disabled = false;
                confirmAction.textContent = 'Delete Forever';
            }
        });

        // Profile Picture Upload
        const avatarBtn = document.querySelector('[data-ngo-avatar-button]');
        const avatarInput = document.querySelector('[data-ngo-avatar-input]');
        const avatarImg = document.querySelector('[data-ngo-avatar-image]');

        avatarBtn.addEventListener('click', () => avatarInput.click());
        avatarInput.addEventListener('change', async () => {
            if (!avatarInput.files.length) return;
            
            const formData = new FormData();
            formData.append('profilePicture', avatarInput.files[0]);

            try {
                const res = await fetch('/ngo/profile/picture', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    avatarImg.src = data.pictureUrl;
                } else {
                    alert(data.error || 'Upload failed');
                }
            } catch (err) {
                alert('Upload error');
            }
        });

        // Cover Picture Upload
        const coverBtn = document.querySelector('[data-ngo-cover-button]');
        const coverInput = document.querySelector('[data-ngo-cover-input]');
        const coverImg = document.querySelector('[data-ngo-cover-image]');

        coverBtn.addEventListener('click', () => coverInput.click());
        coverInput.addEventListener('change', async () => {
            if (!coverInput.files.length) return;

            const formData = new FormData();
            formData.append('cover', coverInput.files[0]);

            try {
                const res = await fetch('/ngo/profile/cover', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    coverImg.src = data.coverUrl;
                } else {
                    alert(data.error || 'Upload failed');
                }
            } catch (err) {
                alert('Upload error');
            }
        });

        // Post Composer Logic
        const composerTrigger = document.querySelector('[data-ngo-add-post-trigger]');
        const composer = document.querySelector('[data-ngo-composer]');
        const composerClose = document.querySelector('[data-ngo-composer-close]');
        const composerForm = document.querySelector('[data-ngo-composer-form]');
        const fundraiserToggle = document.querySelector('[data-ngo-fundraiser-toggle]');
        const goalContainer = document.querySelector('[data-ngo-goal-container]');
        const imageTrigger = document.querySelector('[data-ngo-image-trigger]');
        const imageInput = document.querySelector('[data-ngo-image-input]');
        const imagePreview = document.querySelector('[data-ngo-image-preview]');
        const imagePreviewImg = imagePreview.querySelector('img');
        const imageRemove = document.querySelector('[data-ngo-image-remove]');
        const postList = document.querySelector('[data-ngo-post-list]');

        composerTrigger.addEventListener('click', () => {
            composer.hidden = false;
            composerTrigger.hidden = true;
        });

        composerClose.addEventListener('click', () => {
            composer.hidden = true;
            composerTrigger.hidden = false;
        });

        fundraiserToggle.addEventListener('change', () => {
            goalContainer.hidden = !fundraiserToggle.checked;
        });

        imageTrigger.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', () => {
            if (imageInput.files && imageInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreviewImg.src = e.target.result;
                    imagePreview.hidden = false;
                };
                reader.readAsDataURL(imageInput.files[0]);
            }
        });

        imageRemove.addEventListener('click', () => {
            imageInput.value = '';
            imagePreview.hidden = true;
        });

        composerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = composerForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Posting...';

            const formData = new FormData(composerForm);

            try {
                const res = await fetch('/ngo/profile/posts', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (res.ok) {
                    // Prepend new post to the list
                    const postHtml = createPostElement(data.post, 0); // Logic to handle index will be needed if we want dynamic delete
                    
                    // Simple refresh for now to ensure index alignment, or we can prepend and update all indexes
                    window.location.reload(); 
                } else {
                    alert(data.error || 'Failed to create post');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Post';
                }
            } catch (err) {
                alert('An error occurred');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Post';
            }
        });

        // Delete Post
        document.addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-ngo-post-delete-btn]');
            if (!btn) return;

            const index = btn.dataset.postIndex;
            if (!confirm('Are you sure you want to delete this post?')) return;

            try {
                const res = await fetch(`/ngo/profile/posts/${index}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    const card = btn.closest('.ngo-post-card');
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => window.location.reload(), 300); // Reload to fix index mapping
                } else {
                    alert('Delete failed');
                }
            } catch (err) {
                alert('Error deleting post');
            }
        });
    }

    function createPostElement(post, index) {
        // This is a helper if we wanted to avoid reload
        return ``;
    }

})();
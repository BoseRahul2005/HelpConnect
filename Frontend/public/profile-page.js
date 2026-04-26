document.addEventListener('DOMContentLoaded', () => {
	const shell = document.querySelector('.profile-page-shell');
	const profileDisplayName = shell?.dataset.profileDisplayName || 'You';
	const profileSubtitle = shell?.dataset.profileSubtitle || '';
	const profileAccountType = shell?.dataset.profileAccountType || 'user';
	const profileLogoutUrl = shell?.dataset.profileLogoutUrl || '/logout';
	const profileDeleteUrl = shell?.dataset.profileDeleteUrl || '';
	let profilePictureUrl = shell?.dataset.profilePictureUrl || '';
	const profileAvatarButton = document.querySelector('[data-profile-avatar-button]');
	const profileAvatarImage = document.querySelector('[data-profile-avatar-image]');
	const profileAvatarPlaceholder = document.querySelector('[data-profile-avatar-placeholder]');
	const profilePictureInput = document.querySelector('[data-profile-picture-input]');
	const profileMenuButton = document.querySelector('[data-profile-menu-button]');
	const profileMenuCard = document.querySelector('[data-profile-menu-card]');
	const profileMenuLogoutButton = document.querySelector('[data-profile-logout-button]');
	const profileMenuDeleteButton = document.querySelector('[data-profile-delete-button]');
	const tabs = Array.from(document.querySelectorAll('[data-profile-tab]'));
	const panels = Array.from(document.querySelectorAll('[data-profile-panel]'));
	const createPostButton = document.querySelector('[data-create-post-button]');
	const composer = document.querySelector('[data-profile-composer]');
	const composerForm = document.querySelector('[data-composer-form]');
	const composerCloseButton = document.querySelector('[data-composer-close]');
	const composerCancelButton = document.querySelector('[data-composer-cancel]');
	const composerImageInput = document.querySelector('[data-composer-image-input]');
	const composerImageButton = document.querySelector('[data-composer-image-button]');
	const composerFundraiseButton = document.querySelector('[data-composer-fundraise-button]');
	const composerLinkButton = document.querySelector('[data-composer-link-button]');
	const composerEmojiButton = document.querySelector('[data-composer-emoji-button]');
	const composerSupportButton = document.querySelector('[data-composer-support-button]');
	const composerImagePreview = document.querySelector('[data-composer-image-preview]');
	const composerImagePreviewImg = document.querySelector('[data-composer-image-preview-img]');
	const composerImageName = document.querySelector('[data-composer-image-name]');
	const composerImageRemoveButton = document.querySelector('[data-composer-image-remove]');
	const composerFundraisePanel = document.querySelector('[data-composer-fundraise-panel]');
	const composerEmojiPicker = document.querySelector('[data-composer-emoji-picker]');
	const composerTitleInput = document.querySelector('.composer-title');
	const composerBodyInput = document.querySelector('.composer-body');
	let emptyState = document.querySelector('[data-profile-empty-state]');
	const postsList = document.querySelector('[data-profile-posts-list]');
	let postsEmptyState = document.querySelector('[data-profile-posts-empty]');
	const composerEmojiChoices = ['😊', '😂', '❤️', '🙏', '🔥', '🌱', '✨', '🥰', '💪', '📣', '🎉', '📷', '🤝', '💚', '🙌', '🌟'];
	let selectedImageFile = null;
	let selectedImagePreviewUrl = null;
	let composerFundraiseOpen = false;
	let composerEmojiOpen = false;
	let profileMenuOpen = false;
	let profilePictureUploadInProgress = false;

	function syncProfileAvatarImage(nextProfilePictureUrl) {
		profilePictureUrl = nextProfilePictureUrl || '';

		if (profileAvatarImage) {
			if (profilePictureUrl) {
				profileAvatarImage.src = profilePictureUrl;
				profileAvatarImage.hidden = false;
			} else {
				profileAvatarImage.removeAttribute('src');
				profileAvatarImage.hidden = true;
			}
		}

		if (profileAvatarPlaceholder) {
			profileAvatarPlaceholder.hidden = Boolean(profilePictureUrl);
		}

		if (shell) {
			shell.dataset.profilePictureUrl = profilePictureUrl;
		}
	}

	function hasPosts() {
		return Boolean(postsList && postsList.querySelector('.profile-post-card'));
	}

	function showPanel(panelName) {
		tabs.forEach((tab) => {
			tab.classList.toggle('active', tab.dataset.profileTab === panelName);
			tab.setAttribute('aria-selected', tab.dataset.profileTab === panelName ? 'true' : 'false');
		});

		panels.forEach((panel) => {
			panel.classList.toggle('active', panel.dataset.profilePanel === panelName);
		});
	}

	function setComposerVisibility(isVisible) {
		if (!composer || !createPostButton) {
			return;
		}

		composer.hidden = !isVisible;
		createPostButton.setAttribute('aria-expanded', isVisible ? 'true' : 'false');

		if (emptyState) {
			if (isVisible) {
				emptyState.classList.add('is-hidden');
			} else if (!hasPosts()) {
				emptyState.classList.remove('is-hidden');
			}
		}

		if (isVisible) {
			window.requestAnimationFrame(() => {
				composerBodyInput?.focus();
			});
		}
	}

	function closeComposer() {
		if (!composerForm) {
			setComposerVisibility(false);
			return;
		}

		resetComposerState();
		setComposerVisibility(false);
	}

	function resetComposerState() {
		composerForm?.reset();
		composerImageInput?.value && (composerImageInput.value = '');
		clearSelectedImage();
		setFundraiseVisible(false);
		setEmojiPickerVisible(false);
		composerForm?.classList.remove('is-submitting');
	}

	function clearSelectedImage() {
		selectedImageFile = null;

		if (selectedImagePreviewUrl) {
			window.URL.revokeObjectURL(selectedImagePreviewUrl);
			selectedImagePreviewUrl = null;
		}

		if (composerImageInput) {
			composerImageInput.value = '';
		}

		if (composerImagePreview) {
			composerImagePreview.hidden = true;
		}

		if (composerImagePreviewImg) {
			composerImagePreviewImg.removeAttribute('src');
		}

		if (composerImageName) {
			composerImageName.textContent = '';
		}

		composerImageButton?.classList.remove('is-active');
	}

	function setSelectedImage(file) {
		if (!file || !composerImagePreview || !composerImagePreviewImg || !composerImageName) {
			clearSelectedImage();
			return;
		}

		clearSelectedImage();
		selectedImageFile = file;
		selectedImagePreviewUrl = window.URL.createObjectURL(file);
		composerImagePreviewImg.src = selectedImagePreviewUrl;
		composerImagePreviewImg.alt = file.name;
		composerImageName.textContent = file.name;
		composerImagePreview.hidden = false;
		composerImageButton?.classList.add('is-active');
	}

	function setFundraiseVisible(isVisible) {
		composerFundraiseOpen = isVisible;
		if (composerFundraisePanel) {
			composerFundraisePanel.hidden = !isVisible;
		}
		composerFundraiseButton?.classList.toggle('is-active', isVisible);
	}

	function setEmojiPickerVisible(isVisible) {
		composerEmojiOpen = isVisible;
		if (composerEmojiPicker) {
			composerEmojiPicker.hidden = !isVisible;
		}
		composerEmojiButton?.classList.toggle('is-active', isVisible);
	}

	function setProfileMenuVisible(isVisible, returnFocus = false) {
		if (!profileMenuButton || !profileMenuCard) {
			return;
		}

		profileMenuOpen = isVisible;
		profileMenuCard.hidden = !isVisible;
		profileMenuButton.classList.toggle('is-active', isVisible);
		profileMenuButton.setAttribute('aria-expanded', isVisible ? 'true' : 'false');

		if (isVisible) {
			window.requestAnimationFrame(() => {
				profileMenuLogoutButton?.focus();
			});
		} else if (returnFocus) {
			profileMenuButton.focus();
		}
	}

	function toggleProfileMenu() {
		setProfileMenuVisible(!profileMenuOpen);
	}

	function getProfileDeleteConfirmationMessage() {
		if (profileAccountType === 'ngo') {
			return 'Delete this NGO account? This cannot be undone.';
		}

		return 'Delete this profile and all of its posts? This cannot be undone.';
	}

	function handleProfileLogout() {
		setProfileMenuVisible(false);
		window.location.assign(profileLogoutUrl || '/');
	}

	async function handleProfileDelete() {
		if (!profileDeleteUrl) {
			window.alert('Account deletion is unavailable right now.');
			return;
		}

		const confirmed = window.confirm(getProfileDeleteConfirmationMessage());

		if (!confirmed || !profileMenuDeleteButton) {
			return;
		}

		profileMenuDeleteButton.disabled = true;

		try {
			const response = await fetch(profileDeleteUrl, {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
				},
			});

			const payload = await response.json().catch(() => ({}));

			if (!response.ok) {
				throw new Error(payload.error || 'Unable to delete your account right now.');
			}

			window.location.assign(payload.redirectUrl || '/');
		} catch (error) {
			window.alert(error.message);
			profileMenuDeleteButton.disabled = false;
		}
	}

	function toggleFundraisePanel() {
		setFundraiseVisible(!composerFundraiseOpen);
		if (composerFundraiseOpen) {
			document.getElementById('fundRaiseGoal')?.focus();
		}
	}

	function toggleEmojiPicker() {
		setEmojiPickerVisible(!composerEmojiOpen);
	}

	function insertTextAtCursor(textArea, textToInsert) {
		if (!textArea) {
			return;
		}

		const start = typeof textArea.selectionStart === 'number' ? textArea.selectionStart : textArea.value.length;
		const end = typeof textArea.selectionEnd === 'number' ? textArea.selectionEnd : textArea.value.length;
		const currentValue = textArea.value;
		textArea.value = `${currentValue.slice(0, start)}${textToInsert}${currentValue.slice(end)}`;
		const cursorPosition = start + textToInsert.length;
		textArea.focus();
		textArea.setSelectionRange(cursorPosition, cursorPosition);
	}

	function handleImageSelection(event) {
		const file = event.target.files && event.target.files[0];

		if (!file) {
			clearSelectedImage();
			return;
		}

		if (!file.type.startsWith('image/')) {
			window.alert('Please choose an image file.');
			clearSelectedImage();
			return;
		}

		setSelectedImage(file);
	}

	function openProfilePicturePicker() {
		if (!profilePictureInput || profilePictureUploadInProgress) {
			return;
		}

		profilePictureInput.click();
	}

	async function uploadProfilePicture(file) {
		const formData = new FormData();
		formData.append('profilePicture', file);

		const response = await fetch('/profile/picture', {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
			},
			body: formData,
		});

		const payload = await response.json().catch(() => ({}));

		if (!response.ok) {
			throw new Error(payload.error || 'Unable to update your profile picture right now.');
		}

		return payload;
	}

	async function handleProfilePictureSelection(event) {
		const file = event.target.files && event.target.files[0];

		if (!file) {
			return;
		}

		if (!file.type.startsWith('image/')) {
			window.alert('Please choose an image file.');
			event.target.value = '';
			return;
		}

		profilePictureUploadInProgress = true;
		profileAvatarButton?.setAttribute('aria-busy', 'true');
		if (profileAvatarButton) {
			profileAvatarButton.disabled = true;
		}

		try {
			const payload = await uploadProfilePicture(file);
			syncProfileAvatarImage(payload.profilePictureUrl || '');
		} catch (error) {
			window.alert(error.message);
		} finally {
			event.target.value = '';
			profileAvatarButton?.removeAttribute('aria-busy');
			if (profileAvatarButton) {
				profileAvatarButton.disabled = false;
			}
			profilePictureUploadInProgress = false;
		}
	}

	function removeSelectedImage() {
		clearSelectedImage();
	}

	function renderEmojiPicker() {
		if (!composerEmojiPicker) {
			return;
		}

		composerEmojiPicker.innerHTML = '';

		composerEmojiChoices.forEach((emoji) => {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'composer-emoji-button';
			button.textContent = emoji;
			button.setAttribute('aria-label', `Insert ${emoji}`);
			button.addEventListener('click', () => {
				insertTextAtCursor(composerBodyInput, emoji);
				setEmojiPickerVisible(false);
			});
			composerEmojiPicker.appendChild(button);
		});
	}

	function insertLinkIntoBody() {
		const url = window.prompt('Paste a link to insert into your post');

		if (!url) {
			return;
		}

		insertTextAtCursor(composerBodyInput, url.trim());
	}

	function insertSupportHeart() {
		insertTextAtCursor(composerBodyInput, '❤️');
	}

	function createPostsEmptyState() {
		const emptyCard = document.createElement('div');
		emptyCard.className = 'profile-card profile-placeholder-card profile-posts-empty';
		emptyCard.dataset.profilePostsEmpty = 'true';
		emptyCard.innerHTML = '<h2>Posts</h2><p>Nothing to show here yet.</p>';
		return emptyCard;
	}

	function showPostsEmptyState() {
		if (!postsList) {
			return;
		}

		if (postsEmptyState && postsEmptyState.isConnected) {
			postsEmptyState.classList.remove('is-hidden');
			return;
		}

		postsEmptyState = createPostsEmptyState();
		postsList.append(postsEmptyState);
	}

	function hidePostsEmptyState() {
		if (postsEmptyState && postsEmptyState.isConnected) {
			postsEmptyState.classList.add('is-hidden');
		}
	}

	function buildPostCard(post) {
		if (!postsList) {
			return null;
		}

		const authorInitials = profileDisplayName.slice(0, 2).toUpperCase();
		const postCard = document.createElement('article');
		postCard.className = 'profile-post-card';
		postCard.dataset.profilePostCard = 'true';
		postCard.dataset.postId = String(post.id);

		const header = document.createElement('div');
		header.className = 'profile-post-card-header';

		const author = document.createElement('div');
		author.className = 'profile-post-author';

		const avatar = document.createElement('div');
		avatar.className = 'profile-post-avatar';
		avatar.setAttribute('aria-hidden', 'true');
		avatar.textContent = authorInitials;

		const authorCopy = document.createElement('div');
		authorCopy.className = 'profile-post-author-copy';

		const authorName = document.createElement('span');
		authorName.className = 'profile-post-author-name';
		authorName.textContent = profileDisplayName;

		const authorSubtitle = document.createElement('span');
		authorSubtitle.className = 'profile-post-author-subtitle';
		authorSubtitle.textContent = profileSubtitle;

		authorCopy.append(authorName, authorSubtitle);
		author.append(avatar, authorCopy);

		const time = document.createElement('span');
		time.className = 'profile-post-time';
		time.textContent = post.submittedAtLabel || 'Recently';

		const meta = document.createElement('div');
		meta.className = 'profile-post-card-meta';

		const deleteButton = document.createElement('button');
		deleteButton.type = 'button';
		deleteButton.className = 'profile-post-delete';
		deleteButton.dataset.postDeleteButton = 'true';
		deleteButton.dataset.postId = String(post.id);
		deleteButton.setAttribute('aria-label', 'Delete post');
		deleteButton.innerHTML = `
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M3 6h18"></path>
				<path d="M8 6V4h8v2"></path>
				<path d="M7 6h10l-1 12H8L7 6Z"></path>
				<path d="M10 11v5"></path>
				<path d="M14 11v5"></path>
			</svg>
		`;

		meta.append(time, deleteButton);
		header.append(author, meta);

		const postTitle = document.createElement('h3');
		postTitle.className = 'profile-post-title';
		postTitle.textContent = post.title || 'New post';

		const postBody = document.createElement('p');
		postBody.className = 'profile-post-body';
		postBody.textContent = post.body;

		const content = document.createElement('div');
		content.className = 'profile-post-content';

		if (post.isFundraiser && post.fundRaiseGoalLabel) {
			const fundraiser = document.createElement('div');
			fundraiser.className = 'profile-post-fundraiser';

			const fundraiserBadge = document.createElement('span');
			fundraiserBadge.className = 'profile-post-badge profile-post-badge-fundraiser';
			fundraiserBadge.textContent = 'Fundraiser';

			const fundraiserGoal = document.createElement('span');
			fundraiserGoal.className = 'profile-post-goal';
			fundraiserGoal.textContent = `Goal: ${post.fundRaiseGoalLabel}`;

			fundraiser.append(fundraiserBadge, fundraiserGoal);
			content.append(fundraiser);
		}

		if (post.imageUrl) {
			const media = document.createElement('div');
			media.className = 'profile-post-media';

			const image = document.createElement('img');
			image.className = 'profile-post-image';
			image.src = post.imageUrl;
			image.alt = post.imageName || post.title || 'Post image';

			media.appendChild(image);
			content.appendChild(media);
		}

		postCard.append(header, postTitle, postBody);

		if (content.childElementCount) {
			postCard.appendChild(content);
		}
		return postCard;
	}

	function renderPostCard(post, options = {}) {
		const postCard = buildPostCard(post);

		if (!postCard) {
			return;
		}

		hidePostsEmptyState();

		if (options.prepend) {
			postsList.prepend(postCard);
			return;
		}

		postsList.append(postCard);
	}

	function openComposer() {
		if (!composer) {
			return;
		}

		composer.hidden = false;
		setComposerVisibility(true);
		composer.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	async function createPostOnServer(title, body) {
		const formData = new FormData();
		formData.append('title', title);
		formData.append('body', body);
		formData.append('isFundraiser', composerFundraiseOpen ? '1' : '0');

		if (composerFundraiseOpen) {
			formData.append('fundRaiseGoal', document.getElementById('fundRaiseGoal')?.value || '');
		}

		if (selectedImageFile) {
			formData.append('image', selectedImageFile);
		}

		const response = await fetch('/profile/posts', {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
			},
			body: formData,
		});

		const payload = await response.json().catch(() => ({}));

		if (!response.ok) {
			throw new Error(payload.error || 'Unable to create the post right now.');
		}

		return payload.post;
	}

	async function deletePostOnServer(postId) {
		const response = await fetch(`/profile/posts/${postId}`, {
			method: 'DELETE',
			headers: {
				'Accept': 'application/json',
			},
		});

		const payload = await response.json().catch(() => ({}));

		if (!response.ok) {
			throw new Error(payload.error || 'Unable to delete the post right now.');
		}

		return payload;
	}

	function handleComposerSubmit(event) {
		event.preventDefault();

		const title = composerTitleInput?.value.trim() || '';
		const body = composerBodyInput?.value.trim() || '';
		const fundRaiseGoalField = document.getElementById('fundRaiseGoal');

		if (!body) {
			composerBodyInput?.focus();
			return;
		}

		if (composerFundraiseOpen && !fundRaiseGoalField?.value.trim()) {
			window.alert('Please enter a fundraiser goal before posting.');
			fundRaiseGoalField?.focus();
			return;
		}

		composerForm?.classList.add('is-submitting');

		createPostOnServer(title, body)
			.then((post) => {
				renderPostCard(post, { prepend: true });
				closeComposer();
				showPanel('posts');
			})
			.catch((error) => {
				window.alert(error.message);
			})
			.finally(() => {
				composerForm?.classList.remove('is-submitting');
			});
	}

	tabs.forEach((tab) => {
		tab.addEventListener('click', () => showPanel(tab.dataset.profileTab));
	});

	createPostButton?.addEventListener('click', openComposer);
	profileMenuButton?.addEventListener('click', toggleProfileMenu);
	profileMenuLogoutButton?.addEventListener('click', handleProfileLogout);
	profileMenuDeleteButton?.addEventListener('click', handleProfileDelete);
	profileAvatarButton?.addEventListener('click', openProfilePicturePicker);
	profilePictureInput?.addEventListener('change', handleProfilePictureSelection);
	composerCloseButton?.addEventListener('click', closeComposer);
	composerCancelButton?.addEventListener('click', closeComposer);
	composerForm?.addEventListener('submit', handleComposerSubmit);
	composerImageInput?.addEventListener('change', handleImageSelection);
	composerImageButton?.addEventListener('click', () => composerImageInput?.click());
	composerImageRemoveButton?.addEventListener('click', removeSelectedImage);
	composerFundraiseButton?.addEventListener('click', toggleFundraisePanel);
	composerEmojiButton?.addEventListener('click', toggleEmojiPicker);
	composerLinkButton?.addEventListener('click', insertLinkIntoBody);
	composerSupportButton?.addEventListener('click', insertSupportHeart);
	composerBodyInput?.addEventListener('focus', () => {
		if (composerEmojiOpen) {
			setEmojiPickerVisible(false);
		}
	});
	document.addEventListener('click', (event) => {
		if (!profileMenuOpen || !profileMenuButton || !profileMenuCard) {
			return;
		}

		const clickedTarget = event.target;

		if (profileMenuButton.contains(clickedTarget) || profileMenuCard.contains(clickedTarget)) {
			return;
		}

		setProfileMenuVisible(false);
	});
	postsList?.addEventListener('click', async (event) => {
		const deleteButton = event.target.closest('[data-post-delete-button]');

		if (!deleteButton || !postsList.contains(deleteButton)) {
			return;
		}

		const postCard = deleteButton.closest('[data-profile-post-card]');
		const postId = deleteButton.dataset.postId;

		if (!postCard || !postId) {
			return;
		}

		const confirmed = window.confirm('Delete this post?');

		if (!confirmed) {
			return;
		}

		deleteButton.disabled = true;

		try {
			await deletePostOnServer(postId);
			postCard.remove();

			if (!hasPosts()) {
				showPostsEmptyState();
			}
		} catch (error) {
			window.alert(error.message);
			deleteButton.disabled = false;
		}
	});

	renderEmojiPicker();

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && profileMenuOpen) {
			setProfileMenuVisible(false, true);
		}

		if (event.key === 'Escape' && composer && !composer.hidden) {
			closeComposer();
		}

		if (event.key === 'Escape' && composerEmojiOpen) {
			setEmojiPickerVisible(false);
		}
	});

	showPanel('overview');
	setComposerVisibility(false);
});

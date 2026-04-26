document.addEventListener('DOMContentLoaded', () => {
	const toggleButtons = Array.from(document.querySelectorAll('.password-toggle'));

	if (!toggleButtons.length) {
		return;
	}

	toggleButtons.forEach((toggleButton) => {
		const wrapper = toggleButton.closest('.password-wrapper, .input-wrapper');
		const passwordInput = wrapper?.querySelector('input');

		if (!passwordInput) {
			return;
		}

		function syncToggleState() {
			const isVisible = passwordInput.type === 'text';
			toggleButton.classList.toggle('is-visible', isVisible);
			toggleButton.setAttribute('aria-pressed', isVisible ? 'true' : 'false');
			toggleButton.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
		}

		toggleButton.addEventListener('click', () => {
			passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
			syncToggleState();

			passwordInput.focus({ preventScroll: true });

			if (typeof passwordInput.setSelectionRange === 'function') {
				const endPosition = passwordInput.value.length;
				passwordInput.setSelectionRange(endPosition, endPosition);
			}
		});

		syncToggleState();
	});
});

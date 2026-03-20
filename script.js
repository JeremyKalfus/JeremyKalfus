document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.theme-toggle-checkbox');
    const label = document.querySelector('.theme-label');
    const root = document.documentElement;

    if (!toggle || !label) {
        return;
    }

    const applyTheme = (theme) => {
        const isDark = theme === 'dark';
        root.classList.toggle('dark-mode', isDark);
        root.dataset.theme = theme;
        localStorage.setItem('theme', theme);
        toggle.checked = isDark;
        label.textContent = isDark ? 'Dark' : 'Light';
    };

    const initialTheme = root.dataset.theme === 'dark' ? 'dark' : 'light';
    applyTheme(initialTheme);

    toggle.addEventListener('change', () => {
        applyTheme(toggle.checked ? 'dark' : 'light');
    });
});

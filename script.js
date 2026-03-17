document.addEventListener('DOMContentLoaded', () => {
    const toggles = document.querySelectorAll('.theme-toggle-checkbox');
    const labels = document.querySelectorAll('.theme-label');
    const root = document.documentElement;

    const applyTheme = (theme) => {
        const isDark = theme === 'dark';
        root.classList.toggle('dark-mode', isDark);
        root.dataset.theme = theme;
        localStorage.setItem('theme', theme);
        toggles.forEach(t => t.checked = isDark);
        labels.forEach(l => l.textContent = `${theme} mode`);
    };

    const initialTheme = root.dataset.theme === 'dark' ? 'dark' : 'light';
    applyTheme(initialTheme);

    toggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            applyTheme(toggle.checked ? 'dark' : 'light');
        });
    });
});

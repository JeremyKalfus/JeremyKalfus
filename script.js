document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const themeLabel = document.getElementById('theme-label');
    const root = document.documentElement;

    if (!themeToggle || !themeLabel) {
        console.error('Theme toggle elements not found');
        return;
    }

    const applyTheme = (theme) => {
        const isDark = theme === 'dark';
        root.classList.toggle('dark-mode', isDark);
        root.dataset.theme = theme;
        localStorage.setItem('theme', theme);
        themeToggle.checked = isDark;
        themeLabel.textContent = `${theme} mode`;
    };

    const initialTheme = root.dataset.theme === 'dark' ? 'dark' : 'light';
    applyTheme(initialTheme);

    themeToggle.addEventListener('change', () => {
        applyTheme(themeToggle.checked ? 'dark' : 'light');
    });
});

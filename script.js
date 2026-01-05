// Dark mode 

document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeLabel = document.getElementById('theme-label');
    const body = document.body;

    if (!themeToggle || !themeLabel) {
        console.error('Theme toggle elements not found');
        return;
    }

    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.checked = true;
        themeLabel.textContent = 'dark mode';
    } else {
        body.classList.remove('dark-mode');
        themeToggle.checked = false;
        themeLabel.textContent = 'light mode';
    }

    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
            themeLabel.textContent = 'dark mode';
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
            themeLabel.textContent = 'light mode';
        }
    });
});


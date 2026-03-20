document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.theme-toggle-checkbox');
    const label = document.querySelector('.theme-label');
    const viewTabs = Array.from(document.querySelectorAll('.view-tab'));
    const viewPanels = Array.from(document.querySelectorAll('[data-view-panel]'));
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

    const setActiveView = (viewName) => {
        viewTabs.forEach((tab) => {
            const isActive = tab.dataset.viewTarget === viewName;
            tab.setAttribute('aria-selected', String(isActive));
            tab.tabIndex = isActive ? 0 : -1;
        });

        viewPanels.forEach((panel) => {
            const isActive = panel.dataset.viewPanel === viewName;
            panel.hidden = !isActive;
            panel.classList.toggle('is-active', isActive);
            if (isActive && viewName === 'portfolio') {
                panel.classList.remove('is-entering');
                void panel.offsetWidth;
                panel.classList.add('is-entering');
            } else {
                panel.classList.remove('is-entering');
            }
        });
    };

    if (viewTabs.length && viewPanels.length) {
        setActiveView('about');

        viewTabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                setActiveView(tab.dataset.viewTarget);
            });

            tab.addEventListener('keydown', (event) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                    return;
                }

                event.preventDefault();

                let nextIndex = index;
                if (event.key === 'ArrowRight') {
                    nextIndex = (index + 1) % viewTabs.length;
                } else if (event.key === 'ArrowLeft') {
                    nextIndex = (index - 1 + viewTabs.length) % viewTabs.length;
                } else if (event.key === 'Home') {
                    nextIndex = 0;
                } else if (event.key === 'End') {
                    nextIndex = viewTabs.length - 1;
                }

                const nextTab = viewTabs[nextIndex];
                setActiveView(nextTab.dataset.viewTarget);
                nextTab.focus();
            });
        });
    }
});

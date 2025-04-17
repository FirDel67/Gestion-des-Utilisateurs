document.addEventListener('DOMContentLoaded', function () {
    // Initialize Alpine.js for sidebar state
    Alpine.data('sidebar', () => ({
        mobileMenuOpen: false,

        // Close mobile menu when clicking on a nav item
        closeMobileMenu() {
            this.mobileMenuOpen = false;
        },

        // Handle keyboard navigation
        handleKeydown(e) {
            if (e.key === 'Escape') {
                this.mobileMenuOpen = false;
            }
        }
    }));

    // Initialize dropdown menus
    document.querySelectorAll('[x-data]').forEach(el => {
        Alpine.initializeComponent(el);
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function (e) {
        const dropdowns = document.querySelectorAll('[x-data]');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                const data = Alpine.getRootComponent(dropdown);
                if (data && typeof data.open !== 'undefined') {
                    data.open = false;
                }
            }
        });
    });

    // Mark current page in sidebar
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('bg-gray-100', 'text-gray-900');
            link.querySelector('i').classList.add('text-gray-500');
        }
    });
});


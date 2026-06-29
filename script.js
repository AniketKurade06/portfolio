document.addEventListener('DOMContentLoaded', () => {
    // --- Preloader ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.remove();
            }, 500);
        }, 800); // Short delay for premium feel
    }

    // --- Theme Toggle ---
    const themeToggle = document.getElementById('theme-toggle');
    const root = document.documentElement;
    
    // Check local storage for theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        root.setAttribute('data-theme', 'light');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (root.getAttribute('data-theme') === 'light') {
                root.removeAttribute('data-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                root.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // --- Mobile Menu Toggle ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    
    if (mobileMenuBtn && mobileNavOverlay) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNavOverlay.classList.toggle('open');
        });

        // Close menu when clicking a link
        const mobileLinks = mobileNavOverlay.querySelectorAll('.nav-link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileNavOverlay.classList.remove('open');
            });
        });
    }

    // --- Resume Popup Logic ---
    const downloadResumeBtn = document.getElementById('download-resume-btn');
    const resumeModal = document.getElementById('resume-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    if (downloadResumeBtn && resumeModal) {
        downloadResumeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            resumeModal.classList.add('active');
        });
    }
    
    if (closeModalBtn && resumeModal) {
        closeModalBtn.addEventListener('click', () => {
            resumeModal.classList.remove('active');
        });
    }

    // --- Scroll Reveal Animations ---
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => {
            el.style.opacity = '0'; // Ensure they are hidden before reveal
            observer.observe(el);
        });
    }
});

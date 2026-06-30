document.addEventListener('DOMContentLoaded', () => {
    // --- Preloader ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
        const loadingPercentageText = document.getElementById('loading-percentage');
        const loadingBarFill = document.getElementById('loading-bar-fill');
        
        if (loadingPercentageText && loadingBarFill) {
            let progress = 0;
            const duration = 2000; // 2 seconds animation
            const intervalTime = 20; // Update every 20ms
            const step = (100 / (duration / intervalTime));

            const interval = setInterval(() => {
                progress += step;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    
                    // The Delay: 0.5-second delay
                    setTimeout(() => {
                        // The Exit
                        preloader.style.opacity = '0';
                        preloader.style.transform = 'translateY(-100%)'; // Slide up
                        setTimeout(() => {
                            preloader.remove();
                        }, 500);
                    }, 500);
                }
                
                loadingPercentageText.textContent = `${Math.floor(progress)}%`;
                loadingBarFill.style.width = `${progress}%`;
            }, intervalTime);
        } else {
            // Fallback for pages that might not have the new preloader elements
            setTimeout(() => {
                preloader.style.opacity = '0';
                setTimeout(() => {
                    preloader.remove();
                }, 500);
            }, 800);
        }
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

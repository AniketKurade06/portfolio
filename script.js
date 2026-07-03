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

        // Close menu via the × button
        const mobileNavCloseBtn = document.getElementById('mobile-nav-close');
        if (mobileNavCloseBtn) {
            mobileNavCloseBtn.addEventListener('click', () => {
                mobileNavOverlay.classList.remove('open');
            });
        }

        // Close menu when tapping the dark backdrop (outside links)
        mobileNavOverlay.addEventListener('click', (e) => {
            if (e.target === mobileNavOverlay) {
                mobileNavOverlay.classList.remove('open');
            }
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

    // --- Safe Preloader Detection ---
    if (preloader) {
        const observer = new MutationObserver(() => {
            if (!document.body.contains(preloader)) {
                document.body.classList.add('preloader-finished');
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true });
    } else {
        document.body.classList.add('preloader-finished');
    }

    // --- Premium Section Navigation Transitions ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetUrl = this.getAttribute('href');
            if (targetUrl && targetUrl.endsWith('.html')) {
                e.preventDefault();
                document.body.classList.add('page-transitioning');
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 400); // 0.4s fade out
            }
        });
    });

    // --- Reveal-on-Scroll Logic ---
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        });

        revealElements.forEach(el => {
            el.style.opacity = '';
            revealObserver.observe(el);
        });
    }

    // --- Supabase Contact Form Integration ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        // ⬇️ Replace the two placeholder strings below with your actual Supabase credentials.
        // The ANON key is safe to expose here — protect your data using Supabase Row Level Security.
        const SUPABASE_URL = 'https://eyhkgufikgzsckmlisrn.supabase.co';          // e.g. https://xxxx.supabase.co
        const SUPABASE_ANON_KEY = 'sb_publishable_rfATPOmH9mEB50NZz2177Q_lHPpgjJm'; // from Project Settings > API
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Sending...';
            submitBtn.disabled = true;

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;

            try {
                const { error } = await supabase
                    .from('contact_messages')
                    .insert([
                        { name, email, message }
                    ]);

                if (error) throw error;

                alert("Message sent successfully!");
                contactForm.reset();
            } catch (error) {
                console.error('Error inserting message:', error);
                alert("Failed to send message: " + error.message);
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});

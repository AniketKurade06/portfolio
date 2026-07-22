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

    // --- Juggler Loader Transition ---
    // TIMING CONSTANTS — must stay in sync with CSS values on .loader-wrapper:
    //   CSS: transition: opacity 0.5s ease, visibility 0.5s ease
    //   CSS: animation: ball1/2/3 6s infinite  (juggling phase = 0–50% = 3 s)
    //
    // OVERLAY_FADE_MS    = 500   → exact CSS transition duration; overlay is 100%
    //                              opaque before navigation and 0% after fade-out.
    // JUGGLER_DISPLAY_MS = 1500  → one full juggling rotation cycle (25% of 6 s).
    const OVERLAY_FADE_MS = 500;    // matches: transition: opacity 0.5s ease
    const JUGGLER_DISPLAY_MS = 1500; // one complete juggling rotation (25% × 6 s cycle)

    const loaderWrapper = document.querySelector('.loader-wrapper');
    const navLinks = document.querySelectorAll('.nav-link');

    // ── Phase 3 (Arrival) ─────────────────────────────────────────────────────
    // The departure page navigated with the overlay already 100% opaque, so the
    // new page must show the overlay INSTANTLY — no CSS fade-in.
    //
    // Strategy:
    //   a) Suppress the CSS transition with a one-frame inline override.
    //   b) Add `.fade-in` so the element is fully visible (opacity:1, visible).
    //   c) After 2 rAFs the browser has committed the opaque frame; restore the
    //      CSS transition.
    //   d) After JUGGLER_DISPLAY_MS, call classList.remove('fade-in') — this is
    //      the canonical trigger for the CSS transition engine, guaranteeing a
    //      smooth opacity 1→0 fade-out with no hard cut or flash.
    if (loaderWrapper && sessionStorage.getItem('juggler-transitioning') === '1') {
        sessionStorage.removeItem('juggler-transitioning');

        // a) Disable transition for one paint cycle so .fade-in appears instantly.
        loaderWrapper.style.transition = 'none';
        loaderWrapper.classList.add('fade-in');

        // b) Two rAF ticks: first tick queues the paint, second confirms it's done.
        //    Then restore the CSS transition so the scheduled fade-out will animate.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                loaderWrapper.style.transition = ''; // hand back to CSS

                // c) After the juggling display period, remove the class.
                //    classList.remove triggers the CSS transition engine reliably
                //    (opacity 1 → 0, visibility visible → hidden) for a smooth exit.
                setTimeout(() => {
                    loaderWrapper.classList.remove('fade-in');
                }, JUGGLER_DISPLAY_MS);
            });
        });
    }

    // ── Phase 1 & 2 (Departure) ───────────────────────────────────────────────
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetUrl = this.getAttribute('href');
            if (!targetUrl || !targetUrl.endsWith('.html')) return;

            // Skip if already on the same page
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            if (targetUrl === currentPage) return;

            e.preventDefault();

            if (!loaderWrapper) {
                // Fallback: navigate immediately if loader not present
                window.location.href = targetUrl;
                return;
            }

            // Phase 1 — Fade overlay in.  CSS: transition: opacity 0.5s ease.
            loaderWrapper.classList.add('fade-in');

            // Phase 2 — Navigate only after the CSS opacity transition has fully
            // completed (OVERLAY_FADE_MS = 500 ms = CSS transition duration).
            // This guarantees the overlay is 100% opaque before the browser
            // unloads the current page — no content flash beneath the overlay.
            setTimeout(() => {
                sessionStorage.setItem('juggler-transitioning', '1');
                window.location.href = targetUrl;
            }, OVERLAY_FADE_MS);
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


    // --- PillNav Logic ---
    const navLinksArray = document.querySelectorAll('.nav-links .nav-link');
    const pill = document.querySelector('.pill-indicator');

    if (navLinksArray.length > 0 && pill && typeof gsap !== 'undefined') {
        const activeLink = document.querySelector('.nav-links .nav-link.active') || navLinksArray[0];

        function movePill(target, animate = true) {
            if (!target) return;
            const rect = target.getBoundingClientRect();
            const parentRect = target.parentElement.getBoundingClientRect();

            const left = rect.left - parentRect.left;
            const width = rect.width;

            if (animate) {
                gsap.to(pill, {
                    x: left,
                    width: width,
                    opacity: 1,
                    duration: 0.4,
                    ease: "power3.easeOut"
                });
            } else {
                gsap.set(pill, { x: left, width: width, opacity: 1 });
            }

            navLinksArray.forEach(link => {
                if (link === target) {
                    gsap.to(link, { color: "#120F17", duration: 0.3 });
                } else {
                    gsap.to(link, { color: "#ffffff", duration: 0.3 });
                }
            });
        }

        // Initialize after a tiny delay to ensure fonts/icons are rendered
        setTimeout(() => {
            movePill(activeLink, true);
        }, 100);

        window.addEventListener('load', () => {
            movePill(activeLink, false);
        });

        navLinksArray.forEach(link => {
            link.addEventListener('mouseenter', () => movePill(link));
            link.addEventListener('mouseleave', () => movePill(activeLink));
        });

        window.addEventListener('resize', () => movePill(activeLink, false));
    }

    /* --- Orbiting Tech Stack JS --- */
    function positionOrbits() {
        const innerRadiusStr = getComputedStyle(document.documentElement).getPropertyValue('--inner-radius');
        const outerRadiusStr = getComputedStyle(document.documentElement).getPropertyValue('--outer-radius');
        if (!innerRadiusStr) return; // Skip if CSS variables aren't loaded

        const innerRadius = parseFloat(innerRadiusStr);
        const outerRadius = parseFloat(outerRadiusStr);

        const innerIcons = document.querySelectorAll(".inner-ring .orbit-icon-wrapper");
        innerIcons.forEach((icon, index) => {
            const angle = (index * (360 / innerIcons.length)) * (Math.PI / 180);
            icon.style.left = `calc(50% + ${Math.round(innerRadius * Math.cos(angle))}px - var(--icon-size)/2)`;
            icon.style.top = `calc(50% + ${Math.round(innerRadius * Math.sin(angle))}px - var(--icon-size)/2)`;
            icon.style.animation = `orbit-counter-clockwise 25s linear infinite`;
        });

        const outerIcons = document.querySelectorAll(".outer-ring .orbit-icon-wrapper");
        outerIcons.forEach((icon, index) => {
            const angle = (index * (360 / outerIcons.length)) * (Math.PI / 180);
            icon.style.left = `calc(50% + ${Math.round(outerRadius * Math.cos(angle))}px - var(--icon-size)/2)`;
            icon.style.top = `calc(50% + ${Math.round(outerRadius * Math.sin(angle))}px - var(--icon-size)/2)`;
            icon.style.animation = `orbit-clockwise 40s linear infinite`;
        });
    }

    const orbitContainer = document.querySelector(".orbit-container");
    if (orbitContainer) {
        positionOrbits();
        window.addEventListener('resize', positionOrbits);

        orbitContainer.addEventListener("mouseenter", () => {
            document.querySelectorAll(".orbit-icon-wrapper").forEach(el => el.style.animationPlayState = "paused");
        });
        orbitContainer.addEventListener("mouseleave", () => {
            document.querySelectorAll(".orbit-icon-wrapper").forEach(el => el.style.animationPlayState = "running");
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // Select all "Live Demo" buttons
    const liveDemoButtons = document.querySelectorAll('.project-btn.primary');

    liveDemoButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); // Stop default jump-to-top anchor behavior

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Deployment in Progress!',
                    text: 'This project is currently under active development and has not been deployed live yet.',
                    icon: 'info',
                    confirmButtonText: 'Got it',
                    confirmButtonColor: '#8B5CF6',
                    background: '#121218',
                    color: '#ffffff',
                    iconColor: '#38BDF8'
                });
            } else {
                console.error('SweetAlert2 script is missing or blocked.');
            }
        });
    });
});

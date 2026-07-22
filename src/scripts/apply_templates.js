const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

// 1. Process HTML files
htmlFiles.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace desktop nav-links
  // We'll replace the inner HTML of <div class="nav-links">
  const navLinksRegex = /(<div class="nav-links">)([\s\S]*?)(<\/div>)/;

  // Determine which link should be active
  const basename = path.basename(file);
  const getActiveClass = (href) => (basename === href || (basename === 'index.html' && href === 'index.html')) ? 'active' : '';

  const newNavLinks = `$1
      <a href="index.html" class="nav-link ${getActiveClass('index.html')}"><i data-lucide="home"></i></a>
      <a href="about.html" class="nav-link ${getActiveClass('about.html')}"><i data-lucide="user"></i></a>
      <a href="projects.html" class="nav-link ${getActiveClass('projects.html')}"><i data-lucide="briefcase"></i></a>
      <a href="skills.html" class="nav-link ${getActiveClass('skills.html')}"><i data-lucide="code"></i></a>
      <a href="resume.html" class="nav-link ${getActiveClass('resume.html')}"><i data-lucide="file-text"></i></a>
      <a href="certificates.html" class="nav-link ${getActiveClass('certificates.html')}"><i data-lucide="award"></i></a>
      <a href="contact.html" class="nav-link ${getActiveClass('contact.html')}"><i data-lucide="mail"></i></a>
      <div class="pill-indicator"></div>
    $3`;

  content = content.replace(navLinksRegex, newNavLinks);

  // Replace Gradient Text on headings. Target .page-title and add .gradient-text
  // The prompt says "Targeted Sections: About Me, Projects, Skills, Resume, Certificates, Contact"
  // These are all `<h1 class="page-title">` elements. We can simply add the "gradient-text" class to them.
  content = content.replace(/(<h1[^>]*class="[^"]*page-title[^"]*"[^>]*>)/g, (match) => {
    if (!match.includes('gradient-text')) {
      return match.replace('class="', 'class="gradient-text ');
    }
    return match;
  });

  // Inject GSAP and Lucide scripts before </body> if not present
  if (!content.includes('lucide@latest')) {
    const scripts = `
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script>lucide.createIcons();</script>
</body>`;
    content = content.replace(/<\/body>/i, scripts);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${file}`);
});

// 2. Process style.css
const cssPath = path.join(dir, 'style.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

if (!cssContent.includes('.pill-indicator')) {
  cssContent += `

/* --- PILLNAV OVERRIDES --- */
.nav-links {
  position: relative;
}
.pill-indicator {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.15); 
  border: 1px solid rgba(255, 255, 255, 0.25); 
  border-radius: 50px;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
}
.navbar .nav-link {
  position: relative;
  z-index: 1;
  border: none !important;
  background: transparent !important;
  color: #ffffff; /* baseColor */
}
.navbar .nav-link:hover {
  background: transparent !important;
  border-color: transparent !important;
}
.lucide {
  width: 18px;
  height: 18px;
  stroke-width: 2.5px;
}

/* --- GRADIENT TEXT PORTFOLIO HEADINGS --- */
.gradient-text {
  background-image: linear-gradient(to right, #40ffaa, #4079ff, #40ffaa, #4079ff, #40ffaa);
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: gradientFlow 4s linear infinite;
  display: inline-block;
}
.gradient-text * {
  color: inherit !important;
}
@keyframes gradientFlow {
  0% { background-position: 0% center; }
  100% { background-position: -200% center; }
}
`;
  fs.writeFileSync(cssPath, cssContent, 'utf8');
  console.log('Updated style.css');
}

// 3. Process script.js for GSAP logic
const jsPath = path.join(dir, 'script.js');
let jsContent = fs.readFileSync(jsPath, 'utf8');

if (!jsContent.includes('PillNav Logic')) {
  const pillNavLogic = `

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
        
        /* Update this specific if/else block inside your script's JS logic: */
navLinksArray.forEach(link => {
  if (link === target) {
    gsap.to(link, { color: "#ffffff", duration: 0.3 }); // Keep active icon white
  } else {
    gsap.to(link, { color: "rgba(255, 255, 255, 0.6)", duration: 0.3 }); // Keep unselected icons slightly dimmed
  }
});
      
      // Initialize after a tiny delay to ensure fonts/icons are rendered
      setTimeout(() => {
        movePill(activeLink, true);
      }, 100);
      
      navLinksArray.forEach(link => {
        link.addEventListener('mouseenter', () => movePill(link));
        link.addEventListener('mouseleave', () => movePill(activeLink));
      });
      
      window.addEventListener('resize', () => movePill(activeLink, false));
    }
`;

  // Insert before the closing }); of document.addEventListener('DOMContentLoaded', () => {
  jsContent = jsContent.replace(/}\);\s*$/, pillNavLogic + '\n});\n');
  fs.writeFileSync(jsPath, jsContent, 'utf8');
  console.log('Updated script.js');
}

console.log('All templates applied successfully.');

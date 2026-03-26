const fs = require('fs');
const indexHtml = fs.readFileSync('index.html', 'utf8');

function extractTemplate() {
    const headMatch = indexHtml.match(/([\s\S]*?)<main class="main-content">/)[1];
    const footerMatch = indexHtml.match(/<\/main>([\s\S]*)/)[1];
    return { headMatch, footerMatch };
}

function generatePage(filename, mainContent, title) {
    const { headMatch, footerMatch } = extractTemplate();
    const customHead = headMatch.replace('<title>Startup Journal | Latest Tech & Startup News</title>', `<title>${title} | Startup Journal</title>`);
    
    // Update active nav links
    let navReplaced = customHead;
    navReplaced = navReplaced.replace(/class="nav-link active"/g, 'class="nav-link"');
    
    if (filename === 'startup.html') {
        navReplaced = navReplaced.replace(/>Startup News<\/a>/g, ' class="active">Startup News</a>');
    } else if (filename === 'latest.html') {
        navReplaced = navReplaced.replace(/>Latest News<\/a>/g, ' class="active">Latest News</a>');
    } else if (filename === 'about.html') {
        navReplaced = navReplaced.replace(/>About Us<\/a>/g, ' class="active">About Us</a>');
    } else if (filename === 'contact.html') {
        navReplaced = navReplaced.replace(/>Contact<\/a>/g, ' class="active">Contact</a>');
    } else if (filename === 'article.html') {
        navReplaced = navReplaced.replace(/>Startup News<\/a>/g, ' class="active">Startup News</a>');
    }

    const fullHtml = `${navReplaced}<main class="main-content">\n${mainContent}\n</main>${footerMatch}`;
    fs.writeFileSync(filename, fullHtml);
}

// 1. latest.html
const latestHTML = `
    <!-- Hero Section -->
    <section class="hero-section wrapper" id="dynamicHeroSection">
        <div class="empty-state" style="border:none; background:transparent;">
            <div class="spinner" style="border-top-color: var(--accent-primary); margin: 0 auto 1rem;"></div>
        </div>
    </section>
`;
generatePage('latest.html', latestHTML, 'Latest News');

// 2. startup.html
const startupHTML = `
    <div class="content-layout wrapper" style="margin-top: 2rem;">
        <section class="latest-news">
            <div class="section-header">
                <h2>Startup News</h2>
            </div>
            <div class="news-grid" id="dynamicNewsGrid">
                <div class="empty-state">
                    <div class="spinner" style="border-top-color: var(--accent-primary); margin: 0 auto 1rem;"></div>
                    Fetching stories...
                </div>
            </div>
        </section>
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-widget newsletter-widget">
                <div class="newsletter-icon"><i data-lucide="mail"></i></div>
                <h3>Subscribe to Our Newsletter</h3>
                <p>Get the latest news directly to your inbox daily.</p>
                <form class="newsletter-form" onsubmit="event.preventDefault(); alert('Subscribed!')">
                    <input type="email" placeholder="Your email address" required>
                    <button type="submit" class="btn btn-primary">Subscribe</button>
                </form>
            </div>
        </aside>
    </div>
`;
generatePage('startup.html', startupHTML, 'Startup News');

// 3. about.html
const aboutHTML = `
    <div class="wrapper" style="max-width: 800px; padding: 4rem 1.5rem; text-align: center;">
        <h1 style="font-family: var(--font-serif); font-size: 3rem; color: var(--accent-primary); margin-bottom: 1.5rem;">About Startup Journal</h1>
        <p style="font-size: 1.25rem; color: var(--text-secondary); line-height: 1.8; margin-bottom: 3rem;">
            Startup Journal IN is a premium media platform delivering breaking news, deep insights, and critical analysis from the global startup ecosystem.
        </p>
        <div style="text-align: left; font-size: 1.1rem; line-height: 1.8; color: var(--text-primary);">
            <p style="margin-bottom: 1.5rem;">We believe that startups are the engine of global innovation. Our mission is to provide founders, investors, and tech enthusiasts with the most accurate, timely, and actionable information regarding the rapidly evolving tech landscape.</p>
            <p style="margin-bottom: 1.5rem;">Born from the need for a truly objective, high-quality lens into the venture capital and startup world, Startup Journal operates globally while understanding the nuances of local ecosystems.</p>
            <div style="margin-top: 3rem; padding: 2rem; background: var(--bg-surface-hover); border-radius: var(--radius-lg); text-align: center;">
                <h3>Join Our Community</h3>
                <p style="margin-top: 1rem; margin-bottom: 2rem;">Follow us on LinkedIn for daily updates and exclusive founder interviews.</p>
                <a href="https://www.linkedin.com/company/startup-journal-in/" target="_blank" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem;"><i data-lucide="linkedin"></i> Follow on LinkedIn</a>
            </div>
        </div>
    </div>
`;
generatePage('about.html', aboutHTML, 'About Us');

// 4. contact.html
const contactHTML = `
    <div class="wrapper contact-page-container" style="display: flex; gap: 4rem; padding: 4rem 0; align-items: center; min-height: 70vh;">
        
        <!-- Left 50% -->
        <div class="contact-left" style="flex: 1; padding-right: 2rem;">
            <div class="contact-animation" style="margin-bottom: 2rem;">
                <div style="font-size: 4rem; color: var(--accent-primary); animation: bounce 2s infinite;"><i data-lucide="send" style="width: 80px; height: 80px;"></i></div>
            </div>
            <h1 style="font-family: var(--font-serif); font-size: 3rem; color: var(--accent-primary); margin-bottom: 1rem; line-height: 1.1;">Let's talk about your startup.</h1>
            <p style="color: var(--text-secondary); font-size: 1.1rem; line-height: 1.6;">Whether you have a groundbreaking story pitch, feedback on our coverage, or simply want to say hello, our inbox is always open.</p>
        </div>
        
        <!-- Right 50% -->
        <div class="contact-right" style="flex: 1;">
            <form id="contactUsForm" style="background: var(--bg-surface); padding: 2.5rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); border: 1px solid var(--border-light);">
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Full Name</label>
                    <input type="text" name="name" class="form-control" placeholder="Jane Doe" required style="width: 100%; padding: 0.8rem; border: 1px solid var(--border-medium); border-radius: var(--radius-sm);">
                </div>
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email Address</label>
                    <input type="email" name="email" class="form-control" placeholder="jane@startup.com" required style="width: 100%; padding: 0.8rem; border: 1px solid var(--border-medium); border-radius: var(--radius-sm);">
                </div>
                <div class="form-group" style="margin-bottom: 2rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Message</label>
                    <textarea name="message" class="form-control" rows="5" placeholder="How can we help you?" required style="width: 100%; padding: 0.8rem; border: 1px solid var(--border-medium); border-radius: var(--radius-sm);"></textarea>
                </div>
                <button type="submit" class="btn btn-primary" id="contactSubmitBtn" style="width: 100%; padding: 1rem; font-size: 1.1rem; justify-content: center; align-items: center; display: flex;">
                    <span class="btn-text">Send Message</span>
                    <div class="spinner" style="display: none; border-top-color: white;"></div>
                </button>
            </form>
        </div>
    </div>

    <!-- Contact Success Modal -->
    <div class="modal-overlay" id="contactSuccessModal">
        <div class="modal-container" style="max-width: 400px; text-align: center;">
            <div style="font-size: 4rem; color: var(--success); margin-bottom: 1rem; display:flex; justify-content:center;">
                <i data-lucide="check-circle" style="width: 64px; height: 64px; margin: 0 auto;"></i>
            </div>
            <h2 class="modal-title" style="margin-bottom: 0.5rem; font-family: var(--font-serif); font-size: 1.75rem;">Successfully Submitted!</h2>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">Thank you for getting in touch. We will review your message and get back to you shortly.</p>
            <button class="btn btn-primary" id="closeContactSuccessBtn" style="width: 100%; justify-content: center;">Awesome</button>
        </div>
    </div>
    
    <style>
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-15px); }
    }
    @media (max-width: 768px) {
        .contact-page-container { flex-direction: column; text-align: center; gap: 2rem; }
        .contact-left { padding-right: 0; }
        .contact-animation { display: flex; justify-content: center; }
    }
    </style>
`;
generatePage('contact.html', contactHTML, 'Contact Us');

// 5. article.html
const articleHTML = `
    <!-- Dynamic Article Container -->
    <article class="single-article article-page wrapper" id="dynamicArticleContainer" style="max-width: 900px;">
        <!-- Loading State -->
        <div class="empty-state" style="border:none; padding:4rem 0;">
            <div class="spinner" style="border-top-color: var(--accent-primary); margin: 0 auto 1rem;"></div>
            <p>Loading article...</p>
        </div>
    </article>
`;
generatePage('article.html', articleHTML, 'Article');

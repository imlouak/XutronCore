document.addEventListener('DOMContentLoaded', () => {
    const progressContainer = document.getElementById('progress-container');
    const progressLabel = document.getElementById('progress-label');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const confettiCanvas = document.getElementById('confetti-canvas');
    const copyrightYear = document.getElementById('copyright-year');
    const iconSun = document.getElementById('theme-icon-sun');
    const iconMoon = document.getElementById('theme-icon-moon');
    const scrollToTopBtn = document.getElementById('scroll-to-top');

    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-modal');
    
    const btnLight = document.getElementById('theme-btn-light');
    const btnDark = document.getElementById('theme-btn-dark');

    if (settingsBtn && settingsModal && closeSettingsBtn) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
            document.body.classList.add('modal-open');
        });
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        });
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            }
        });
    }
    let currentLang = localStorage.getItem('lang') || navigator.language.split('-')[0];
    const supportedLanguages = ['en'];
    if (!supportedLanguages.includes(currentLang)) currentLang = 'en';
    let translations = {};

    let currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    if(copyrightYear) {
        copyrightYear.textContent = new Date().getFullYear();
    }
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (theme === 'light') {
            if(btnLight) btnLight.classList.add('active');
            if(btnDark) btnDark.classList.remove('active');
        } else {
            if(btnDark) btnDark.classList.add('active');
            if(btnLight) btnLight.classList.remove('active');
        }
    };
    applyTheme(currentTheme);

    if (btnLight) btnLight.addEventListener('click', () => applyTheme('light'));
    if (btnDark) btnDark.addEventListener('click', () => applyTheme('dark'));

    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const fetchLatestRelease = async () => {
        try {
            const response = await fetch('https://api.github.com/repos/imlouak/XutronCore/releases/latest');
            if (!response.ok) return;
            const data = await response.json();
            if (!data || !data.tag_name) return;
            const version = data.tag_name;
            const setupAsset = data.assets ? data.assets.find(a => a.name.toLowerCase().includes('setup.exe')) : null;
            const downloadUrl = setupAsset ? setupAsset.browser_download_url : (data.assets && data.assets[0] ? data.assets[0].browser_download_url : '');

            const versionLabel = document.getElementById('latest-version');
            const downloadBtn = document.getElementById('download-btn');

            if (versionLabel) versionLabel.textContent = `Latest: ${version}`;
            if (downloadBtn && downloadUrl) {
                downloadBtn.href = downloadUrl;
                downloadBtn.onclick = (e) => {
                    e.preventDefault();
                    startDownload(downloadUrl, version);
                };
            }
        } catch (error) {
            console.error('Failed to fetch latest release:', error);
        }
    };

    const startDownload = (url, version) => {
        const downloadSection = document.getElementById('download');
        const downloadGrid = document.querySelector('.download-grid');
        
        if (progressContainer) {
            progressContainer.classList.remove('hidden');
        }
        if (downloadGrid) {
            downloadGrid.classList.add('hidden');
        }

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                finishDownload();
            }
            if (progressBarFill) progressBarFill.style.width = `${progress}%`;
            if (progressLabel) progressLabel.textContent = `Downloading XutronCore ${version}... ${Math.round(progress)}%`;
        }, 200);

        window.location.href = url;
    };

    const finishDownload = () => {
        const downloadGrid = document.querySelector('.download-grid');
        if (progressLabel) progressLabel.textContent = 'Download Started! Check your browser downloads.';
        
        if (window.trackEvent) {
            window.trackEvent('Website', 'download_started');
        }

        if (confettiCanvas) {
            const myConfetti = confetti.create(confettiCanvas, { resize: true });
            myConfetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#007aff', '#5856d6', '#ff2d55']
            });
        }

        if (progressContainer) {
            setTimeout(() => {
                progressContainer.classList.add('hidden');
            }, 5000);
        }
        if (downloadGrid) {
            downloadGrid.classList.remove('hidden');
        }
    };

    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    const sectionsToAnimate = document.querySelectorAll('.fade-in-section');
    sectionsToAnimate.forEach(section => {
        observer.observe(section);
    });

    const API_PUBLIC_KEY = 'bb7cc56a-723a-4933-8557-4b77f9888921';

    const fetchLatestPatches = async () => {
        const patchesContainer = document.getElementById('patches-container');
        try {
            const response = await fetch('https://xutroncore-api.vercel.app/api/data-news', {
                headers: { 'x-api-key': API_PUBLIC_KEY }
            });
            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            const patches = data.news.slice(0, 2);

            renderPatches(patches);
        } catch (error) {
            if (patchesContainer) {
                patchesContainer.innerHTML = '<p class="status-message">Could not load latest updates.</p>';
            }
        }
    };

    const openPatchModal = async (patch) => {
        const modal = document.getElementById('patch-modal');
        const modalBody = document.getElementById('modal-body');

        document.body.classList.add('modal-open');
        modal.classList.remove('hidden');
        modalBody.innerHTML = `
            <div class="loading-patches">
                <div class="spinner"></div>
                <p>Fetching full documentation...</p>
            </div>
        `;

        if (window.trackEvent) {
            window.trackEvent('Website', 'view_patch_note', { title: patch.title });
        }

        try {
            const response = await fetch(`https://xutroncore-api.vercel.app/api/data-news/raw?path=${encodeURIComponent(patch.link)}`, {
                headers: { 'x-api-key': API_PUBLIC_KEY }
            });
            if (!response.ok) throw new Error('Failed to load content');
            const rawMarkdown = await response.text();

            const metadataMatch = rawMarkdown.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+/);
            let markdownBody = metadataMatch ? rawMarkdown.replace(metadataMatch[0], '') : rawMarkdown;

            const processedMarkdown = markdownBody.replace(
                /^ *(NEW FEATURES|BUGS FIX|REMOVED|GENERAL UPDATES|AGENT UPDATES|PERFORMANCE UPDATES|BUG FIXES|PC ONLY|ALL PLATFORMS|IN SHORT):? *$/gm, 
                '<span class="patch-category">$1</span>'
            );

            const html = marked.parse(processedMarkdown);
            const cleanHtml = DOMPurify.sanitize(html);

            modalBody.innerHTML = `
                <h1>${patch.title}</h1>
                <span class="patch-note-date">${new Date(patch.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <p style="font-size: 1.1rem; color: var(--subtitle-color); line-height: 1.6; margin-bottom: 2rem;">${patch.summary}</p>
                <hr>
                ${cleanHtml}
            `;
        } catch (error) {
            modalBody.innerHTML = '<p class="status-message">Could not load patch details. Please try again later.</p>';
        }
    };

    const closePatchModal = () => {
        document.getElementById('patch-modal').classList.add('hidden');
        document.body.classList.remove('modal-open');
    };

    document.getElementById('close-modal').addEventListener('click', closePatchModal);
    document.getElementById('patch-modal').addEventListener('click', (e) => {
        if (e.target.id === 'patch-modal') closePatchModal();
    });

    const renderPatches = (patches) => {
        const patchesContainer = document.getElementById('patches-container');
        if (!patchesContainer) return;

        patchesContainer.innerHTML = '';
        patches.forEach(patch => {
            const card = document.createElement('div');
            card.className = 'patch-card';
            card.innerHTML = `
                <span class="patch-card-date">${new Date(patch.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <h3 class="patch-card-title">${patch.title}</h3>
                <p class="patch-card-summary">${patch.summary || 'View full update details...'}</p>
            `;
            card.addEventListener('click', () => openPatchModal(patch));
            patchesContainer.appendChild(card);
        });
    };

    fetchLatestRelease();
    fetchLatestPatches();
});

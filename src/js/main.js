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
    
    if (btnLight) {
        btnLight.addEventListener('click', () => {
            currentTheme = 'light';
            applyTheme(currentTheme);
        });
    }
    
    if (btnDark) {
        btnDark.addEventListener('click', () => {
            currentTheme = 'dark';
            applyTheme(currentTheme);
        });
    }
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            scrollToTopBtn.classList.remove('hidden');
        } else {
            scrollToTopBtn.classList.add('hidden');
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    const applyTranslations = () => {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const keys = el.getAttribute('data-i18n').split('.');
            let value = translations;
            for (const key of keys) {
                value = value ? value[key] : null;
            }
            if (typeof value === 'string') {
                if (keys[0] === 'footer' && keys[1] === 'copyright') {
                    el.innerHTML = value.replace('{year}', `<span id="copyright-year">${new Date().getFullYear()}</span>`);
                } else {
                    el.innerHTML = value;
                }
            }
        });
    };

    const loadTranslations = async (lang) => {
        if (!supportedLanguages.includes(lang)) return loadTranslations('en');
        try {
            const resp = await fetch(`./src/languages/${lang}.json`);
            if (resp.ok) {
                translations = await resp.json();
                applyTranslations();
                localStorage.setItem('lang', lang);
                currentLang = lang;
            } else if (lang !== 'en') {
                loadTranslations('en');
            }
        } catch (error) {
            console.error('Translation load failed: ', error);
        }
    };

    const updateVersion = async () => {
        try {
            const resp = await fetch('./package.json');
            if (resp.ok) {
                const pkg = await resp.json();
                const versionEl = document.getElementById('settings-website-version');
                if (versionEl) versionEl.textContent = `v${pkg.version}`;
            }
        } catch (e) {}
    };

    loadTranslations(currentLang);
    updateVersion();

    const triggerConfetti = () => {
        if (!confettiCanvas || typeof confetti !== 'function') return;
        const myConfetti = confetti.create(confettiCanvas, {
            resize: true,
            useWorker: true
        });
        myConfetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 }
        });
    };

    const simulateDownload = (event) => {
        event.preventDefault();
        const downloadUrl = event.currentTarget.href;
        if (!downloadUrl || downloadUrl === '#') return;
        let progress = 0;

        progressContainer.classList.remove('hidden');
        progressBarFill.style.width = '0%';
        progressBarFill.classList.remove('complete');
        progressLabel.textContent = translations['progress.preparing'] || 'Preparing download...';

        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);

                progressLabel.textContent = translations['progress.complete'] || 'Download Complete!';
                progressBarFill.classList.add('complete');

                triggerConfetti();

                setTimeout(() => {
                    window.location.href = downloadUrl;
                }, 500);

                setTimeout(() => {
                    progressContainer.classList.add('hidden');
                }, 2500);
            }
            progressBarFill.style.width = progress + '%';

            let downloadText = translations['progress.downloading'] || 'Downloading... {progress}%';
            progressLabel.textContent = downloadText.replace('{progress}', Math.floor(progress));
        }, 200);

        if (window.trackEvent) {
            window.trackEvent('Website', 'download_launcher', { url: downloadUrl });
        }
    };

    const fetchLatestRelease = async () => {
        const owner = 'imlouak';
        const repo = 'XutronCore';
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
        const downloadGrid = document.getElementById('download-grid');
        const statusMessage = document.getElementById('download-status');

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`GitHub API responded with status: ${response.status}`);
            }
            const release = await response.json();
            const latestVersion = release.tag_name.replace('v', '');

            const assets = release.assets;
            const downloadUrls = {
                windows: assets.find(asset => asset.name.endsWith('.exe'))?.browser_download_url
            };

            updateDownloadLinks(latestVersion, downloadUrls);

        } catch (error) {
            if (statusMessage) {
                statusMessage.textContent = translations['download.status_error'] || 'Could not load download links. Please visit the GitHub releases page directly.';
                statusMessage.style.color = '#ef4444';
            }
            if (downloadGrid) {
                downloadGrid.classList.add('hidden');
            }
        }
    };

    const updateDownloadLinks = (version, urls) => {
        const latestVersionEl = document.getElementById('latest-version');
        const winLinkEl = document.getElementById('win-link');
        const downloadGrid = document.getElementById('download-grid');
        const statusMessage = document.getElementById('download-status');

        if (latestVersionEl) {
            latestVersionEl.innerText = version;
        }

        const setupButton = (element, url) => {
            if (element && url) {
                element.href = url;
                element.addEventListener('click', simulateDownload);
            } else if (element) {
                element.classList.add('hidden');
            }
        };

        setupButton(winLinkEl, urls.windows);

        if (statusMessage) {
            statusMessage.classList.add('hidden');
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
                headers: { 'x-api-key': 'bb7cc56a-723a-4933-8557-4b77f9888921' }
            });
            if (!response.ok) throw new Error('Failed to load content');
            const rawMarkdown = await response.text();

            const metadataMatch = rawMarkdown.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*/);
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

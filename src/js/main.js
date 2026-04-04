


document.addEventListener('DOMContentLoaded', () => {


    const progressContainer = document.getElementById('progress-container');
    const progressLabel = document.getElementById('progress-label');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const confettiCanvas = document.getElementById('confetti-canvas');


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
        progressLabel.textContent = 'Preparing download...';

        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);

                progressLabel.textContent = 'Download Complete!';
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
            progressLabel.textContent = `Downloading... ${Math.floor(progress)}%`;
        }, 200);
    };


    const fetchLatestRelease = async () => {
        const owner = 'iamplayerexe';
        const repo = 'xutroncore';
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
            console.error('Failed to fetch latest release:', error);
            if (statusMessage) {
                statusMessage.textContent = 'Could not load download links. Please visit the GitHub releases page directly.';
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


    const fetchLatestPatches = async () => {
        const patchesContainer = document.getElementById('patches-container');
        try {
            const response = await fetch('https://xutroncore-api.vercel.app/api/data-news');
            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            const patches = data.news.slice(0, 2); // Get top 2

            renderPatches(patches);
        } catch (error) {
            console.error('Failed to fetch patches:', error);
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

        try {
            const response = await fetch(`https://xutroncore-api.vercel.app/${encodeURI(patch.link)}`);
            if (!response.ok) throw new Error('Failed to load content');
            const rawMarkdown = await response.text();

            // Extract Body (Remove YAML Frontmatter)
            const metadataMatch = rawMarkdown.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+/);
            let markdownBody = metadataMatch ? rawMarkdown.replace(metadataMatch[0], '') : rawMarkdown;

            // Highlight Categories (Line-anchored Regex)
            const processedMarkdown = markdownBody.replace(
                /^ *(NEW FEATURES|BUGS FIX|REMOVED|GENERAL UPDATES|AGENT UPDATES|PERFORMANCE UPDATES|BUG FIXES|PC ONLY|ALL PLATFORMS|IN SHORT):? *$/gm, 
                '<span class="patch-category">$1</span>'
            );

            const html = marked.parse(processedMarkdown);
            const cleanHtml = DOMPurify.sanitize(html);

            modalBody.innerHTML = `
                <h1>${patch.title}</h1>
                <div class="patch-card-date">${new Date(patch.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <div class="patch-description-hero">${patch.summary}</div>
                <hr style="margin: 2rem 0; border: none; border-bottom: 1px solid var(--border-color);">
                ${cleanHtml}
            `;
        } catch (error) {
            console.error('Modal Error:', error);
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

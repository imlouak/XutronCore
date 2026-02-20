// <-- comment (.js file)(src/js/main.js)
// src/js/main.js

document.addEventListener('DOMContentLoaded', () => {

    // --- THEME TOGGLE LOGIC ---
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const applyTheme = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        };
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    // --- DOM elements for progress and confetti ---
    const progressContainer = document.getElementById('progress-container');
    const progressLabel = document.getElementById('progress-label');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const confettiCanvas = document.getElementById('confetti-canvas');

    // --- Confetti Function ---
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

    // --- Download Simulation Function ---
    const simulateDownload = (event) => {
        event.preventDefault();
        const downloadUrl = event.currentTarget.href;
        if (!downloadUrl || downloadUrl === '#') return; // Do nothing if the link isn't ready
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

    // --- Function to fetch release data from GitHub API ---
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

    // --- Function to update the DOM and attach event listeners ---
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

    // --- Copyright Year Logic ---
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- SCROLL FADE-IN/OUT ANIMATION ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // If the element is intersecting (on-screen), add the 'visible' class
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                // Otherwise, remove it to fade it out
                entry.target.classList.remove('visible');
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    const sectionsToAnimate = document.querySelectorAll('.fade-in-section');
    sectionsToAnimate.forEach(section => {
        observer.observe(section);
    });

    // --- INITIATE THE FETCH ---
    fetchLatestRelease();
});
// <-- end comment (.js file)(src/js/main.js)
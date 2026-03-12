// Use your actual GNews API key here (https://gnews.io/)
const API_KEY = '4ad670dd5acaa356d9edf86896543ce6'; 
const BASE_URL = 'https://gnews.io/api/v4/top-headlines';

// Default placeholder if image is missing from the API response
const DEFAULT_IMAGE = 'https://picsum.photos/id/20/600/300'; 

// Track the currently selected category (defaulting to the home view 'প্রচ্ছদ')
let currentCategory = 'প্রচ্ছদ';

// Map our Bengali UI categories to GNews API standard categories
const categoryMap = {
    'প্রচ্ছদ': 'general',
    'রাজ্য': 'nation',
    'দেশ': 'nation',
    'বিনোদন': 'entertainment',
    'খেলা': 'sports',
    'বাণিজ্য': 'business',
    'প্রযুক্তি': 'technology'
};

function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
}

// Calculate relative time like "2 hours ago"
function timeSince(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " বছর আগে";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " মাস আগে";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " দিন আগে";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ঘণ্টা আগে";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " মিনিট আগে";
    
    return "এইমাত্র";
}

// Constant for 1 hour in milliseconds
const CACHE_DURATION = 60 * 60 * 1000;

async function fetchBengaliNews(forceRefresh = false) {
    const newsContainer = document.getElementById('news-container');
    const lastUpdatedElement = document.getElementById('last-updated');
    const loaderElement = document.getElementById('loader');
    const errorElement = document.getElementById('error-message');
    
    // Determine API parameter mapped to our UI selectionFIRST
    const apiCategory = categoryMap[currentCategory] || 'general';
    
    // Determine the specific cache key for the backend category (Reduces duplicate calls)
    const cacheKey = `news_cache_${apiCategory}`;
    
    // Check LocalStorage first if this is not a forced manual refresh
    if (!forceRefresh) {
        const cachedDataStr = localStorage.getItem(cacheKey);
        if (cachedDataStr) {
            try {
                const cachedData = JSON.parse(cachedDataStr);
                const now = new Date().getTime();
                
                // If the cache is less than 1 hour old, use it!
                if (now - cachedData.timestamp < CACHE_DURATION) {
                    console.log(`Using cached data for ${currentCategory}`);
                    
                    // Update UI to reflect the time the cache was originally created
                    const cacheTime = new Date(cachedData.timestamp);
                    lastUpdatedElement.textContent = `আপডেট: ${formatTime(cacheTime)}`;
                    
                    updateUI(cachedData.articles);
                    return; // Exit early, no network request needed
                } else {
                    console.log(`Cache expired for ${currentCategory}. Fetching new data.`);
                }
            } catch (e) {
                console.error("Error parsing cached news data", e);
                // Continue to fetch new data if parsing fails
            }
        }
    } else {
        console.log(`Force refresh requested for ${currentCategory}. Bypassing cache.`);
    }

    // --- Proceed with Network Request ---
    
    // UI State: Loading
    newsContainer.innerHTML = '';
    errorElement.style.display = 'none';
    loaderElement.style.display = 'flex';
    
    // Ensure loader text is correct
    if(loaderElement.querySelector('p')) loaderElement.querySelector('p').textContent = 'খবর লোড হচ্ছে...';
    
    // Determine API parameter mapped to our UI selection (Already determined above)
    
    // Construct the API URL (lang=bn for Bengali, country=in for India)
    const url = `${BASE_URL}?category=${apiCategory}&lang=bn&country=in&max=10&apikey=${API_KEY}`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Hide loader
        loaderElement.style.display = 'none';
        
        // Update last updated text
        const fetchTime = new Date();
        lastUpdatedElement.textContent = `আপডেট: ${formatTime(fetchTime)}`;
        
        if (!data.articles || data.articles.length === 0) {
            showEmptyState();
        } else {
            // Save valid data to LocalStorage with current timestamp
            const cacheObject = {
                timestamp: fetchTime.getTime(),
                articles: data.articles
            };
            try {
                localStorage.setItem(cacheKey, JSON.stringify(cacheObject));
            } catch (e) {
                console.warn("Could not save to localStorage (quota full?).", e);
            }
            
            updateUI(data.articles);
        }
        
    } catch (error) {
        console.error("Failed to fetch news:", error);
        loaderElement.style.display = 'none';
        
        // --- FALLBACK CACHE LOGIC ---
        // If we hit an API error (like quota exceeded) but we have older expired cached data, just show it!
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
            try {
                const expiredData = JSON.parse(cachedStr);
                errorElement.style.display = 'block';
                errorElement.innerHTML = `
                    <div style="background-color: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; border: 1px solid #ffeeba; margin-bottom: 15px; text-align: center; font-size: 13px;">
                        ⚠️ API Limit Reached. Showing previously saved news.
                    </div>
                `;
                const cacheTime = new Date(expiredData.timestamp);
                lastUpdatedElement.textContent = `অফলাইন (আপডেট: ${formatTime(cacheTime)})`;
                updateUI(expiredData.articles);
                return; // Recover gracefully
            } catch(e) {}
        }
        
        // Show offline/error state only if we have absolute NO cached data.
        errorElement.style.display = 'block';
        if (!navigator.onLine) {
            errorElement.innerHTML = `
                <div class="error-icon">🌐</div>
                <h3 class="error-title">ইন্টারনেট সংযোগ নেই</h3>
                <p>দয়া করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।</p>
            `;
        } else if (API_KEY === 'YOUR_API_KEY_HERE') {
            errorElement.innerHTML = `
                <div class="error-icon">🔑</div>
                <h3 class="error-title">API Key Missing</h3>
                <p style="color: #D32F2F; font-size: 14px;">Please open <b>app.js</b> and replace <code>'YOUR_API_KEY_HERE'</code> with an active GNews.io API key.</p>
            `;
        } else {
            errorElement.innerHTML = `
                <div class="error-icon">⚠️</div>
                <h3 class="error-title">ত্রুটি ঘটেছে</h3>
                <p>খবর লোড করতে সমস্যা হয়েছে। (API Limit Reached or AdBlocker)</p>
            `;
        }
    }
}

function updateUI(articles) {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = ''; // Ensure it's clear

    // Update Breaking News Ticker with live data
    const tickerTextElement = document.getElementById('ticker-text');
    if (tickerTextElement && articles.length > 0) {
        // Combine the top 3 headlines for the scrolling ticker
        const topHeadlines = articles.slice(0, 3).map(a => a.title).join(' ••• ');
        tickerTextElement.textContent = `${topHeadlines} •••`;
    }

    articles.forEach(article => {
        // Map GNews API JSON properties
        const title = article.title || "শিরোনাম উপলব্ধ নেই";
        let description = article.description || "বিস্তারিত খবর পড়তে ক্লিক করুন।";
        
        const imageUrl = article.image || DEFAULT_IMAGE;
        
        // Calculate timestamp relative to now
        const publishedAt = article.publishedAt;
        const timeAgo = publishedAt ? timeSince(publishedAt) : "সম্প্রতি";
        
        // Extract Source Name
        const sourceName = (article.source && article.source.name) ? article.source.name : '';

        const articleEl = document.createElement('article');
        articleEl.className = 'news-card';
        // Open original article onClick
        if (article.url) {
            articleEl.style.cursor = 'pointer';
            articleEl.onclick = () => window.open(article.url, '_blank');
        }
        
        // Prepend source to time if available (e.g. 'Ei Samay • 2 hours ago')
        const metaText = sourceName ? `${sourceName} • ${timeAgo}` : timeAgo;
        
        articleEl.innerHTML = `
            <div class="img-wrapper">
                <img src="${imageUrl}" alt="News Image" class="card-img" onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'" loading="lazy">
            </div>
            <div class="card-content">
                <h2 class="card-title">${title}</h2>
                <p class="card-snippet">${description}</p>
                <div class="card-footer">
                    <span class="time-ago">${metaText}</span>
                </div>
            </div>
        `;
        
        newsContainer.appendChild(articleEl);
    });
}

function showEmptyState() {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = `
        <div style="text-align:center; padding: 40px 20px; color: #757575;">
            <h3>এই বিভাগে বর্তমানে কোনো খবর পাওয়া যাচ্ছে না।</h3>
            <p style="margin-top: 8px; font-size: 14px;">অনুগ্রহ করে পরে আবার চেক করুন।</p>
        </div>
    `;
}

function setupEventListeners() {
    // Nav Categories
    const categoryLinks = document.querySelectorAll('.category-list a');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.category-list li').forEach(li => li.classList.remove('active'));
            e.target.parentElement.classList.add('active');
            
            currentCategory = e.target.getAttribute('data-category');
            
            // Handle Contact Page (যোগাযোগ) entirely locally without API calls
            if (currentCategory === 'যোগাযোগ') {
                const newsContainer = document.getElementById('news-container');
                const lastUpdatedElement = document.getElementById('last-updated');
                lastUpdatedElement.textContent = "যোগাযোগ";
                newsContainer.innerHTML = `
                    <div style="text-align:center; padding: 60px 20px; color: #757575;">
                        <h3 style="color:var(--text-main); margin-bottom: 20px; font-size: 20px;">যোগাযোগের ঠিকানা</h3>
                        <p style="font-size: 16px; margin-bottom: 10px;"><strong>Developed by:</strong> Palash Kumar Dhara</p>
                        <p style="font-size: 16px; margin-bottom: 10px;"><strong>Email:</strong> <a href="mailto:pkd2k5@gmail.com" style="color: #D32F2F; text-decoration: none;">pkd2k5@gmail.com</a></p>
                        <p style="font-size: 16px;"><strong>Mob:</strong> <a href="tel:8420710800" style="color: #D32F2F; text-decoration: none;">8420710800</a></p>
                    </div>
                `;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            fetchBengaliNews();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Side Menu Logic
    const menuBtn = document.getElementById('menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const sideMenu = document.getElementById('side-menu');
    const sideMenuOverlay = document.getElementById('side-menu-overlay');

    function toggleMenu() {
        sideMenu.classList.toggle('active');
        sideMenuOverlay.classList.toggle('active');
    }

    if (menuBtn && closeMenuBtn && sideMenuOverlay) {
        menuBtn.addEventListener('click', toggleMenu);
        closeMenuBtn.addEventListener('click', toggleMenu);
        sideMenuOverlay.addEventListener('click', toggleMenu);
    }
    
    const sideMenuLinks = document.querySelectorAll('.side-menu-list a');
    sideMenuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu(); // Close menu after clicking a link
        });
    });

    // Bottom Navigation Logic
    const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');
    bottomNavItems.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Reset active states
            bottomNavItems.forEach(n => n.classList.remove('active'));
            const clickedBtn = e.currentTarget;
            clickedBtn.classList.add('active');

            const newsContainer = document.getElementById('news-container');
            const lastUpdatedElement = document.getElementById('last-updated');
            const btnText = clickedBtn.querySelector('span').textContent;

            if (btnText === 'ভিডিও') {
                lastUpdatedElement.textContent = "ভিডিও";
                newsContainer.innerHTML = `
                    <div style="text-align:center; padding: 60px 20px; color: #757575;">
                        <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" style="margin-bottom:16px; color:rgba(211,47,47,0.5)">
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                        </svg>
                        <h3 style="color:var(--text-main);">ভিডিও ফিচার শীঘ্রই আসছে</h3>
                        <p style="margin-top: 8px; font-size: 14px;">আমরা এই বিভাগে কাজ করছি। পরবর্তী আপডেটের জন্য অপেক্ষা করুন।</p>
                    </div>
                `;
            } else if (btnText === 'সংরক্ষিত') {
                lastUpdatedElement.textContent = "সংরক্ষিত খবর";
                newsContainer.innerHTML = `
                    <div style="text-align:center; padding: 60px 20px; color: #757575;">
                        <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" style="margin-bottom:16px; color:rgba(211,47,47,0.5)">
                            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                        </svg>
                        <h3 style="color:var(--text-main);">কোনো খবর সংরক্ষিত নেই</h3>
                        <p style="margin-top: 8px; font-size: 14px;">আপনার পছন্দের খবর সেভ করতে বুকমার্ক আইকনে ক্লিক করুন।</p>
                    </div>
                `;
            } else {
                // Home clicked, refetch or read from cache
                fetchBengaliNews();
            }
        });
    });
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    // Fetch once when the app is opened, ignoring local cache so they always get fresh news on startup
    fetchBengaliNews(true); 
});

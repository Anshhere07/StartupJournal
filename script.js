/**
 * Startup Journal - Frontend Logic
 */

// Replace this with your deployed Google Apps Script Web App URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwxPVZxZ9qpz87XlxlY76TecGgi1afEJLcX7LTsOP0e0VVYxUGkYElEflbFHnW1ma6l/exec';

let currentUser = JSON.parse(localStorage.getItem('sj_user')) || null;

function refreshIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
            <span class="toast-msg">${message}</span>
        </div>
    `;
    container.appendChild(toast);
    refreshIcons();

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function fetchAPI(action, payload = {}) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
        return handleMockSimulation(action, payload);
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action, ...payload }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: 'Network error or server unreachable' };
    }
}

// Helper to convert files to base64 for Drive Uploads
async function fileToBase64(file) {
    if (!file) return null;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ data: reader.result, name: file.name, type: file.type });
        reader.onerror = error => reject(error);
    });
}

// -----------------------------------------
// Mock Backend Simulation 
// -----------------------------------------
async function handleMockSimulation(action, payload) {
    return new Promise((resolve) => {
        setTimeout(() => {
            let posts = JSON.parse(localStorage.getItem('sj_mock_posts')) || [];
            
            // Hardcoded admin intercept for UI bypass
            if (action === 'login' && payload.email === 'admin@gmail.com' && payload.password === 'Admin@123') {
                resolve({ success: true, user: { id: 'admin_sys', email: payload.email, role: 'admin' }});
                return;
            }

            switch(action) {
                case 'login':
                case 'signup':
                    resolve({ success: true, user: { id: 'test_uuid', email: payload.email, role: 'user' } });
                    break;
                case 'submitPost':
                    posts.push({
                        id: Date.now().toString(), title: payload.title, description: payload.description,
                        imageUrl: payload.imageFile ? payload.imageFile.data : '', 
                        videoUrl: payload.videoFile ? payload.videoFile.data : '', 
                        caption: payload.caption,
                        status: 'Pending', createdAt: new Date().toISOString(), userEmail: payload.userEmail
                    });
                    localStorage.setItem('sj_mock_posts', JSON.stringify(posts));
                    resolve({ success: true, message: 'Uploads submitted for review.' });
                    break;
                case 'getPosts':
                    const approved = posts.filter(p => p.status === 'Approved').sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                    resolve({ success: true, posts: approved });
                    break;
                case 'getAllPendingPosts':
                    const pending = posts.filter(p => p.status === 'Pending').sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                    resolve({ success: true, posts: pending });
                    break;
                case 'approvePost':
                case 'rejectPost':
                    const idx = posts.findIndex(p => p.id === payload.postId);
                    if (idx > -1) {
                        posts[idx].status = action === 'approvePost' ? 'Approved' : 'Rejected';
                        localStorage.setItem('sj_mock_posts', JSON.stringify(posts));
                        resolve({ success: true, message: `Uploads ${action === 'approvePost' ? 'approved' : 'rejected'}.` });
                    } else {
                        resolve({ success: false, error: 'Upload not found' });
                    }
                    break;
                default:
                    resolve({ success: false, error: 'Unknown Action' });
            }
        }, 800);
    });
}

// -----------------------------------------
// DOM Event Listeners & UI State
// -----------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initModals();
    initForms();

    if (document.querySelector('.admin-page')) {
        initAdminDashboard();
    } else {
        fetchDynamicPosts(); 
    }
});

function initUI() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        });
    }

    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileDropdown = document.querySelector('.mobile-dropdown');
    if (mobileMenuBtn && mobileDropdown) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileDropdown.classList.toggle('is-open');
            const icon = mobileMenuBtn.querySelector('i');
            icon.setAttribute('data-lucide', mobileDropdown.classList.contains('is-open') ? 'x' : 'menu');
            refreshIcons();
        });
    }

    updateNavbarAuthUI();
}

function updateNavbarAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const mobileAuthBtn = document.getElementById('mobileAuthBtn');
    const userMenu = document.getElementById('userMenu');
    const navAdminBtn = document.getElementById('navAdminDashboardBtn');
    const userProfileEmail = document.getElementById('userProfileEmail');

    if (currentUser) {
        if (authBtn) authBtn.style.display = 'none';
        if (mobileAuthBtn) mobileAuthBtn.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        if (userProfileEmail) userProfileEmail.textContent = currentUser.email;

        if (navAdminBtn) {
            navAdminBtn.style.display = currentUser.role === 'admin' ? 'block' : 'none';
        }
    } else {
        if (authBtn) authBtn.style.display = 'block';
        if (mobileAuthBtn) mobileAuthBtn.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
    }

    const userAvatarBtn = document.getElementById('userAvatarBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    
    if (userAvatarBtn && userDropdownMenu) {
        const newAvatarBtn = userAvatarBtn.cloneNode(true);
        userAvatarBtn.parentNode.replaceChild(newAvatarBtn, userAvatarBtn);
        newAvatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdownMenu.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!userDropdownMenu.contains(e.target)) userDropdownMenu.classList.remove('show');
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            currentUser = null;
            localStorage.removeItem('sj_user');
            updateNavbarAuthUI();
            showToast('Logged out successfully', 'info');
            if(window.location.pathname.includes('admin.html')) window.location.href = 'index.html';
        });
    }
}

// -----------------------------------------
// Modals
// -----------------------------------------
function initModals() {
    const authModal = document.getElementById('authModal');
    const postModal = document.getElementById('postModal');

    const openAuthBtns = [document.getElementById('authBtn'), document.getElementById('mobileAuthBtn')];
    openAuthBtns.forEach(btn => {
        if(btn) btn.addEventListener('click', () => authModal.classList.add('show'));
    });
    
    const closeAuthBtn = document.getElementById('closeAuthBtn');
    if(closeAuthBtn) closeAuthBtn.addEventListener('click', () => authModal.classList.remove('show'));

    const navPostNewsBtn = document.getElementById('navPostNewsBtn');
    if(navPostNewsBtn) navPostNewsBtn.addEventListener('click', () => postModal.classList.add('show'));

    const closePostBtn = document.getElementById('closePostBtn');
    const cancelPostBtn = document.getElementById('cancelPostBtn');
    if(closePostBtn) closePostBtn.addEventListener('click', () => postModal.classList.remove('show'));
    if(cancelPostBtn) cancelPostBtn.addEventListener('click', () => postModal.classList.remove('show'));

    const navAdminBtn = document.getElementById('navAdminDashboardBtn');
    if (navAdminBtn) {
        navAdminBtn.addEventListener('click', () => window.location.href = 'admin.html');
    }
}

// -----------------------------------------
// Forms & Auth
// -----------------------------------------
function initForms() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
        });
    });

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());
            await handleAuthSubmit('login', data, 'loginSubmitBtn');
        });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(signupForm);
            const data = Object.fromEntries(formData.entries());
            await handleAuthSubmit('signup', data, 'signupSubmitBtn');
        });
    }

    const postNewsForm = document.getElementById('postNewsForm');
    if (postNewsForm) {
        postNewsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(postNewsForm);
            const data = Object.fromEntries(formData.entries());
            data.userEmail = currentUser ? currentUser.email : 'Unknown';

            // Handle Base64 file inputs
            const imageInput = document.getElementById('imageFileInput');
            const videoInput = document.getElementById('videoFileInput');
            
            toggleButtonLoading('postSubmitBtn', true);
            
            if (imageInput.files[0]) data.imageFile = await fileToBase64(imageInput.files[0]);
            if (videoInput.files[0]) data.videoFile = await fileToBase64(videoInput.files[0]);
            
            await handlePostSubmit(data, 'postSubmitBtn');
        });
    }
}

function toggleButtonLoading(btnId, isLoading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.spinner');
    
    btn.disabled = isLoading;
    if(isLoading) {
        text.style.display = 'none';
        spinner.style.display = 'block';
    } else {
        text.style.display = 'block';
        spinner.style.display = 'none';
    }
}

async function handleAuthSubmit(action, data, btnId) {
    toggleButtonLoading(btnId, true);
    const response = await fetchAPI(action, data);
    toggleButtonLoading(btnId, false);

    if (response.success) {
        currentUser = response.user;
        localStorage.setItem('sj_user', JSON.stringify(currentUser));
        document.getElementById('authModal').classList.remove('show');
        updateNavbarAuthUI();
        showToast(`Successfully ${action === 'login' ? 'logged in' : 'signed up'}!`);
    } else {
        showToast(response.error || 'Authentication failed', 'error');
    }
}

async function handlePostSubmit(data, btnId) {
    // Already loading due to base64 pre-processing, but keep consistent state
    toggleButtonLoading(btnId, true);
    const response = await fetchAPI('submitPost', data);
    toggleButtonLoading(btnId, false);

    if (response.success) {
        showToast('Media uploaded & submitted successfully! Awaiting approval.');
        document.getElementById('postModal').classList.remove('show');
        document.getElementById('postNewsForm').reset();
    } else {
        showToast('Failed to upload', 'error');
    }
}

// -----------------------------------------
// Main Page Rendering
// -----------------------------------------
async function fetchDynamicPosts() {
    const grid = document.getElementById('dynamicNewsGrid');
    if (!grid) return;

    try {
        const response = await fetchAPI('getPosts');
        if (response.success && response.posts && response.posts.length > 0) {
            grid.innerHTML = '';
            response.posts.forEach(post => grid.appendChild(createNewsCard(post)));
            refreshIcons();
        } else {
            grid.innerHTML = `<div class="empty-state">No approved uploads found right now.</div>`;
        }
    } catch (e) {
        grid.innerHTML = `<div class="empty-state" style="color:var(--error)">Error loading uploads.</div>`;
    }
}

function createNewsCard(post) {
    const article = document.createElement('article');
    article.className = 'news-card';
    const image = post.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800';
    const dateStr = new Date(post.createdAt).toLocaleDateString();

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = post.description;
    let plainText = tempDiv.textContent || tempDiv.innerText || "";
    if (plainText.length > 100) plainText = plainText.substring(0, 100) + '...';

    article.innerHTML = `
        <a href="#" class="card-image-link" onclick="event.preventDefault()">
            <img src="${image}" alt="Upload Media" class="card-image">
            <div class="category-badge small">News</div>
        </a>
        <div class="card-content">
            <div class="post-meta">
                <span class="date">${dateStr}</span> • <span>${post.userEmail}</span>
            </div>
            <h3 class="card-title"><a href="#" onclick="event.preventDefault()">${post.title}</a></h3>
            <p class="card-excerpt">${plainText}</p>
            <a href="#" class="read-more" onclick="event.preventDefault()">Read article</a>
        </div>
    `;
    return article;
}

// -----------------------------------------
// Admin Dashboard Logic
// -----------------------------------------
async function initAdminDashboard() {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Unauthorized access. Redirecting...', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }

    const refreshBtn = document.getElementById('refreshPendingBtn');
    const logoutBtn = document.getElementById('adminLogoutBtn');

    if (refreshBtn) refreshBtn.addEventListener('click', fetchPendingPosts);
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('sj_user');
        window.location.href = 'index.html';
    });

    const closePreviewModal = document.getElementById('closePreviewModal');
    if (closePreviewModal) closePreviewModal.addEventListener('click', () => {
        document.getElementById('previewModal').classList.remove('show');
    });

    const btnApprove = document.getElementById('previewApproveBtn');
    const btnReject = document.getElementById('previewRejectBtn');

    if (btnApprove) {
        btnApprove.addEventListener('click', async () => await handleModeration('approvePost', btnApprove.getAttribute('data-id')));
    }

    if (btnReject) {
        btnReject.addEventListener('click', async () => await handleModeration('rejectPost', btnReject.getAttribute('data-id')));
    }

    fetchPendingPosts();
}

let activePendingPosts = [];

async function fetchPendingPosts() {
    const tbody = document.getElementById('pendingPostsTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" class="text-center"><div class="spinner" style="border-top-color: var(--accent-primary); display:inline-block; margin-right:10px;"></div> Loading uploads...</td></tr>`;

    const response = await fetchAPI('getAllPendingPosts', { isAdmin: true });
    
    if (response.success) {
        activePendingPosts = response.posts || [];
        renderAdminTable(activePendingPosts);
    } else {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--error)">Error fetching uploads.</td></tr>`;
        showToast('Error fetching uploads', 'error');
    }
}

function renderAdminTable(posts) {
    const tbody = document.getElementById('pendingPostsTableBody');
    tbody.innerHTML = '';

    if (posts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">No pending uploads to moderate.</td></tr>`;
        return;
    }

    posts.forEach(post => {
        const tr = document.createElement('tr');
        const d = new Date(post.createdAt);
        
        tr.innerHTML = `
            <td>${d.toLocaleDateString()} ${d.toLocaleTimeString()}</td>
            <td>${post.userEmail}</td>
            <td style="font-weight: 500">${post.title.length > 40 ? post.title.substring(0,40)+'...' : post.title}</td>
            <td><button class="btn btn-outline preview-btn" style="padding: 0.25rem 0.5rem; font-size:0.8rem" data-id="${post.id}">View Uploads</button></td>
            <td class="td-actions">
                <button class="icon-btn approve-btn" data-id="${post.id}" style="color:var(--success)" title="Approve Uploads"><i data-lucide="check"></i></button>
                <button class="icon-btn reject-btn" data-id="${post.id}" style="color:var(--error)" title="Disapprove/Reject Uploads"><i data-lucide="x"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    refreshIcons();

    document.querySelectorAll('.preview-btn').forEach(btn => btn.addEventListener('click', (e) => openPreviewModal(e.target.closest('button').getAttribute('data-id'))));
    document.querySelectorAll('.approve-btn').forEach(btn => btn.addEventListener('click', (e) => handleModeration('approvePost', e.target.closest('button').getAttribute('data-id'))));
    document.querySelectorAll('.reject-btn').forEach(btn => btn.addEventListener('click', (e) => handleModeration('rejectPost', e.target.closest('button').getAttribute('data-id'))));
}

function openPreviewModal(id) {
    const post = activePendingPosts.find(p => p.id === id);
    if (!post) return;

    const previewContent = document.getElementById('previewContent');
    
    // Check if the uploaded file is a true base64 or empty/mock URL for local testing
    let imgBlock = '';
    if (post.imageUrl) {
        imgBlock = `<img src="${post.imageUrl}" style="width:100%; max-height:300px; object-fit:contain; margin-bottom:1rem; border-radius:var(--radius-sm)">`;
    }

    let vidBlock = '';
    if (post.videoUrl) {
         if (post.videoUrl.startsWith('data:video')) {
             vidBlock = `<video controls src="${post.videoUrl}" style="width:100%; max-height:300px; margin-bottom:1rem;"></video>`;
         } else {
             vidBlock = `<p style="margin-top:1rem; color:var(--accent-blue)">Attached Video Link: <a href="${post.videoUrl}" target="_blank">View Video</a></p>`;
         }
    }

    previewContent.innerHTML = `
        <h1 style="font-family: var(--font-serif); font-size:1.5rem; margin-bottom:1rem; color: var(--accent-primary);">${post.title}</h1>
        ${imgBlock}
        ${vidBlock}
        ${post.caption ? `<p style="text-align:center; font-size:0.8rem; color:var(--text-tertiary); margin-bottom:1rem">${post.caption}</p>` : ''}
        <div style="font-size: 1rem; line-height: 1.6; color: var(--text-primary);">
            ${post.description}
        </div>
    `;

    document.getElementById('previewApproveBtn').setAttribute('data-id', id);
    document.getElementById('previewRejectBtn').setAttribute('data-id', id);

    document.getElementById('previewModal').classList.add('show');
}

async function handleModeration(action, id) {
    if (!confirm(`Are you sure you want to ${action === 'approvePost' ? 'approve' : 'reject/delete'} this upload?`)) return;

    const response = await fetchAPI(action, { postId: id, isAdmin: true });
    
    if (response.success) {
        showToast(response.message, 'success');
        document.getElementById('previewModal').classList.remove('show');
        fetchPendingPosts();
    } else {
        showToast(response.error || 'Moderation action failed', 'error');
    }
}

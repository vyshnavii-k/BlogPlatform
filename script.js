//script.js
// Application Global Runtime Matrices
let authSessionToken = localStorage.getItem('blog_token') || '';
let currentAuthUser = localStorage.getItem('blog_user') || '';
let isRegistrationMode = false;

// DOM Engine Selectors
const authView = document.getElementById('auth-view');
const composeView = document.getElementById('compose-view');
const feedView = document.getElementById('feed-view');
const navActions = document.getElementById('nav-actions');
const userDisplayBadge = document.getElementById('user-display-badge');
const alertBanner = document.getElementById('alert-banner');

const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const btnAuthSubmit = document.getElementById('btn-auth-submit');
const authToggleLink = document.getElementById('auth-toggle-link');

const postForm = document.getElementById('post-form');
const blogFeedContainer = document.getElementById('blog-feed-container');

// Boot Sequence Mount
document.addEventListener('DOMContentLoaded', () => {
    if (authSessionToken) {
        establishSessionView();
    } else {
        showAuthGateway();
    }
});

// --- AUTH VIEW STATE ROUTER ---
function showAuthGateway() {
    authView.classList.remove('hidden');
    composeView.classList.add('hidden');
    feedView.classList.add('hidden');
    navActions.classList.add('hidden');
}

function establishSessionView() {
    authView.classList.add('hidden');
    userDisplayBadge.textContent = `@${currentAuthUser}`;
    navActions.classList.remove('hidden');
    showFeedView();
}

function toggleAuthMode() {
    isRegistrationMode = !isRegistrationMode;
    authForm.reset();
    if (isRegistrationMode) {
        authTitle.textContent = 'Create Chronicle Profile';
        btnAuthSubmit.textContent = 'Register Account';
        authToggleLink.textContent = 'Already have an account? Sign in';
    } else {
        authTitle.textContent = 'Welcome to Chronicle';
        btnAuthSubmit.textContent = 'Sign In';
        authToggleLink.textContent = "Don't have an account? Register here";
    }
}

// --- APP GATEWAY FETC INTERFACES ---
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const endpoint = isRegistrationMode ? '/api/auth/register' : '/api/auth/login';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Authentication aborted');

        if (isRegistrationMode) {
            triggerAlert('Account initialized! Please log in.');
            toggleAuthMode();
        } else {
            authSessionToken = data.token;
            currentAuthUser = data.username;
            localStorage.setItem('blog_token', authSessionToken);
            localStorage.setItem('blog_user', currentAuthUser);
            triggerAlert(`Logged in securely as @${currentAuthUser}`);
            establishSessionView();
        }
    } catch (err) {
        triggerAlert(err.message, true);
    }
});

// --- BLOG CONTEXT ROUTING VIEWS ---
function showFeedView() {
    composeView.classList.add('hidden');
    feedView.classList.remove('hidden');
    fetchPublicationsTimeline();
}

function showComposeView() {
    feedView.classList.add('hidden');
    composeView.classList.remove('hidden');
    document.getElementById('composer-title').textContent = 'Draft New Publication';
    document.getElementById('btn-post-submit').textContent = 'Publish Article';
    postForm.reset();
    document.getElementById('edit-post-id').value = '';
}

// --- PUBLICATIONS CRUDS DATA READ & RENDER ---
async function fetchPublicationsTimeline() {
    try {
        const response = await fetch('/api/posts');
        const articles = await response.json();

        blogFeedContainer.innerHTML = '';
        if (articles.length === 0) {
            blogFeedContainer.innerHTML = '<div class="blog-post-card" style="text-align:center; color:#6b7280;">No publications found on the network feed yet.</div>';
            return;
        }

        articles.forEach(post => {
            const isAuthor = post.author === currentAuthUser;
            const postCard = document.createElement('article');
            postCard.className = 'blog-post-card';

            postCard.innerHTML = `
                <div class="post-meta-row">
                    <span class="post-author">@${post.author}</span>
                    <span>•</span>
                    <span>${post.date}</span>
                </div>
                <h3 class="post-title">${post.title}</h3>
                <p class="post-body">${post.content}</p>

                ${isAuthor ? `
                    <div class="post-actions-toolbar">
                        <span class="action-link edit" onclick="openArticleEditor('${post.id}', '${escape(post.title)}', '${escape(post.content)}')">✏️ Edit</span>
                        <span class="action-link delete" onclick="deleteArticlePublication('${post.id}')">🗑️ Delete</span>
                    </div>
                ` : ''}

                <div class="comments-sub-section">
                    <h4 class="comments-title">Discussion (${post.comments.length})</h4>
                    <div class="comments-stream-container">
                        ${post.comments.map(c => `
                            <div class="comment-node">
                                <div class="comment-author">@${c.author}</div>
                                <div class="comment-text">${c.text}</div>
                            </div>
                        `).join('')}
                    </div>
                    <form class="comment-composer-form" onsubmit="submitInlineComment(event, '${post.id}')">
                        <input type="text" class="comment-composer-input" placeholder="Write an interactive response..." required>
                        <button type="submit" class="btn-primary" style="padding:8px 14px; font-size:0.85rem;">Reply</button>
                    </form>
                </div>
            `;
            blogFeedContainer.appendChild(postCard);
        });
    } catch (err) {
        triggerAlert('Error syncronizing community newsfeed.', true);
    }
}

// --- CREATE & UPDATE ACTIONS DISPATCH ---
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const postId = document.getElementById('edit-post-id').value;
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();

    const isEditing = postId !== '';
    const endpoint = isEditing ? `/api/posts/${postId}` : '/api/posts';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'user-token': currentAuthUser
            },
            body: JSON.stringify({ title, content })
        });

        if (!response.ok) throw new Error('Failed to persist content transaction');

        triggerAlert(isEditing ? 'Publication updated successfully' : 'Article broadcast live to the feed!');
        postForm.reset();
        showFeedView();
    } catch (err) {
        triggerAlert(err.message, true);
    }
});

function openArticleEditor(id, escapedTitle, escapedContent) {
    composeView.classList.remove('hidden');
    feedView.classList.add('hidden');

    document.getElementById('composer-title').textContent = 'Modify Publication';
    document.getElementById('btn-post-submit').textContent = 'Save Changes';

    document.getElementById('edit-post-id').value = id;
    document.getElementById('post-title').value = unescape(escapedTitle);
    document.getElementById('post-content').value = unescape(escapedContent);
}

async function deleteArticlePublication(id) {
    if (!confirm('Are you absolutely sure you want to remove this publication?')) return;
    try {
        const response = await fetch(`/api/posts/${id}`, {
            method: 'DELETE',
            headers: { 'user-token': currentAuthUser }
        });
        if (!response.ok) throw new Error('Unauthorized or network route failure');
        triggerAlert('Article completely removed from the stream.');
        fetchPublicationsTimeline();
    } catch (err) {
        triggerAlert(err.message, true);
    }
}

// --- NESTED COMMENT DISPATCH ---
async function submitInlineComment(e, postId) {
    e.preventDefault();
    const form = e.target;
    const input = form.querySelector('.comment-composer-input');
    const text = input.value.trim();

    try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-token': currentAuthUser
            },
            body: JSON.stringify({ text })
        });

        if (!response.ok) throw new Error('Failed to attach commentary reference');

        input.value = '';
        fetchPublicationsTimeline();
    } catch (err) {
        triggerAlert(err.message, true);
    }
}

// --- NOTIFICATION BANNER ENGINE ---
function triggerAlert(text, isError = false) {
    alertBanner.textContent = text;
    alertBanner.style.backgroundColor = isError ? '#dc2626' : '#2563eb';
    alertBanner.classList.remove('hidden');
    setTimeout(() => alertBanner.classList.add('hidden'), 3000);
}

function logout() {
    authSessionToken = '';
    currentAuthUser = '';
    localStorage.removeItem('blog_token');
    localStorage.removeItem('blog_user');
    triggerAlert('Session disconnected safely.');
    showAuthGateway();
}

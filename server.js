server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- MEMORY DATA SCHEMAS ---
let users = [
    { id: "1", username: "vyshnavi", password: "123" },
    { id: "2", username: "coder", password: "123" }
];

let posts = [
    {
        id: "1001",
        title: "Mastering Full-Stack Engineering from Mobile Terminal Layouts",
        content: "Building Node.js and Express servers straight from a smartphone terminal using Termux is a fantastic way to grasp core architectural runtime boundaries. It requires clean directory configuration management and rigid tracking of structural JSON payload interfaces.",
        author: "vyshnavi",
        date: "13 Jun 2026",
        comments: [
            { id: "c1", author: "coder", text: "This approach is incredibly efficient! Absolute genius workflow layout." }
        ]
    },
    {
        id: "1002",
        title: "The Architecture of Lightweight Modern RESTful State Machines",
        content: "RESTful designs require decoupling resource schemas directly from operational frontend views. By designing modular array systems, we can process highly performant nested states across a clean JSON layer without unnecessary database connection bloat.",
        author: "coder",
        date: "12 Jun 2026",
        comments: []
    }
];

// --- AUTHENTICATION API ROUTES ---
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'All fields are strictly required' });

    const userExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) return res.status(400).json({ error: 'Username is already taken' });

    const newUser = { id: Date.now().toString(), username, password };
    users.push(newUser);
    res.status(201).json({ message: 'Registration successful' });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid authentication credentials' });
    res.json({ username: user.username, token: 'session-' + user.id });
});

// --- BLOG POST CORE CRUD OPERATIONS ---
app.get('/api/posts', (req, res) => {
    res.json(posts);
});

app.post('/api/posts', (req, res) => {
    const author = req.headers['user-token'];
    if (!author) return res.status(401).json({ error: 'Unauthorized: Session missing' });

    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content matrices cannot be blank' });

    const newPost = {
        id: Date.now().toString(),
        title,
        content,
        author,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        comments: []
    };
    posts.unshift(newPost);
    res.status(201).json(newPost);
});

app.put('/api/posts/:id', (req, res) => {
    const author = req.headers['user-token'];
    const { id } = req.params;
    const { title, content } = req.body;

    const post = posts.find(p => p.id === id);
    if (!post) return res.status(404).json({ error: 'Article not found' });
    if (post.author !== author) return res.status(403).json({ error: 'Modification forbidden: Access Denied' });

    if (title) post.title = title;
    if (content) post.content = content;

    res.json(post);
});

app.delete('/api/posts/:id', (req, res) => {
    const author = req.headers['user-token'];
    const { id } = req.params;

    const index = posts.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Article not found' });
    if (posts[index].author !== author) return res.status(403).json({ error: 'Deletion forbidden: Access Denied' });

    posts.splice(index, 1);
    res.json({ message: 'Article permanently deleted' });
});

// --- NESTED COMMENT LAYER INTERFACES ---
app.post('/api/posts/:id/comments', (req, res) => {
    const author = req.headers['user-token'];
    if (!author) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Comment string cannot be empty' });

    const post = posts.find(p => p.id === id);
    if (!post) return res.status(404).json({ error: 'Article target not found' });

    const newComment = {
        id: 'c-' + Date.now(),
        author,
        text: text.trim()
    };
    post.comments.push(newComment);
    res.status(201).json(newComment);
});

app.listen(PORT, () => {
    console.log(`Blogging Platform Backend running at http://localhost:${PORT}`);
});

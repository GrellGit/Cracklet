const express = require('express');
const fetch = require('node-fetch'); // If using Node.js < 18. Use global fetch if Node 18+
const app = express();
app.use(express.json());

app.post('/api/roblox-login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  try {
    // Step 1: Preflight to get CSRF token
    const preflight = await fetch('https://auth.roblox.com/v2/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ctype: 'Username', cvalue: username, password }),
    });

    const csrfToken = preflight.headers.get('x-csrf-token');

    if (!csrfToken) {
      return res.status(500).json({ error: 'Failed to get CSRF token' });
    }

    // Step 2: Actual login request with CSRF token
    const loginResponse = await fetch('https://auth.roblox.com/v2/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify({ ctype: 'Username', cvalue: username, password }),
      redirect: 'manual',
    });

    if (loginResponse.status === 200) {
      const body = await loginResponse.json();

      if (!body.user) {
        return res.json({ success: false, error: 'No user object in response' });
      }

      return res.json({
        success: true,
        userId: body.user.id,
        username: body.user.name || body.user.username || username,
      });
    } else {
      return res.json({ success: false });
    }
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Static file serving (optional)
app.use(express.static('public')); // if your frontend is here

// Start server
app.listen(3000, () => console.log('Roblox login proxy running on port 3000'));

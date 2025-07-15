const express = require('express');
const fetch = require('node-fetch'); // or native fetch if node 18+
const app = express();
app.use(express.json());

app.post('/api/roblox-login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  try {
    // Roblox auth endpoint (unofficial API)
    const loginResponse = await fetch('https://auth.roblox.com/v2/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ctype: 'Username', cvalue: username, password }),
      redirect: 'manual',
    });

    // Roblox returns 200 + cookies on success, 400 on failure
    if (loginResponse.status === 200) {
      const body = await loginResponse.json();
      // Successful login returns user info including userId
      return res.json({ success: true, userId: body.user.id, username: body.user.username });
    } else {
      // Failed login
      return res.json({ success: false });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// For local testing
app.listen(3000, () => console.log('Roblox login proxy running on port 3000'));

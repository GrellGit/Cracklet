import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  // Roblox API to get user info by username:
  // https://users.roblox.com/v1/users/get-by-username?username=<username>
  // This tells if user exists. Password validation not possible publicly.

  try {
    const userResponse = await fetch(`https://users.roblox.com/v1/users/get-by-username?username=${encodeURIComponent(username)}`);
    if (!userResponse.ok) {
      // Roblox API error or user not found
      return res.json({ valid: false });
    }

    const userData = await userResponse.json();

    if (userData.id) {
      // User exists, but password validation is impossible with public API.
      // So we return valid: true, but warn frontend that password not verified.
      return res.json({
        valid: true,
        userId: userData.id,
        username: userData.name,
        message: "Username exists. Password not verified due to API limitations."
      });
    } else {
      // User does not exist
      return res.json({ valid: false });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

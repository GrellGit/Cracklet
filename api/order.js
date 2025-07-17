export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { licenseKey, discordLink } = req.body;

    if (!licenseKey || !discordLink) {
      return res.status(400).json({ error: 'Missing license key or Discord link' });
    }

    const sellAppApiKey = 'e1I3gxOHIdjObMWTjBED5KvCmQfVfOEutHjGqTkjed8bea5f';

    // Validate the license key
    const licenseRes = await fetch(`https://sell.app/api/v1/licenses/${licenseKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sellAppApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!licenseRes.ok) {
      console.error("License fetch failed:", licenseRes.status);
      return res.status(400).json({ error: 'License validation request failed' });
    }

    const license = await licenseRes.json();
    console.log("License Check Response:", license);

    if (!license || license.error || license.status !== 'ACTIVE' || !license.active || license.is_expired) {
      return res.status(400).json({ error: 'Invalid or expired license key' });
    }

    // TEST MODE ONLY: Don't activate or use SMM yet
    return res.status(200).json({
      success: true,
      license: license
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

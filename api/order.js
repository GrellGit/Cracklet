export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { link, quantity, service } = req.body;

  try {
    const panelRes = await fetch('https://morethanpanel.com/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: process.env.PANEL_API_KEY, // Use Vercel env vars
        action: 'add',
        service,
        link,
        quantity
      })
    });

    const result = await panelRes.json();

    if (result.order) {
      res.status(200).json({ order: result.order });
    } else {
      res.status(500).json({ error: 'Order failed', details: result });
    }

  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
}

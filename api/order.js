// /api/order.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { licenseKey } = req.body;

  if (!licenseKey) {
    return res.status(400).json({ error: 'License key missing' });
  }

  try {
    // Step 1: Validate license key with Sell.app
    const validateRes = await fetch(`https://developer.sell.app/api/licenses/${licenseKey}`, {
      headers: {
        Authorization: 'Bearer e1I3gxOHIdjObMWTjBED5KvCmQfVfOEutHjGqTkjed8bea5f',
        Accept: 'application/json'
      }
    });

    const license = await validateRes.json();

    if (!license?.data?.valid) {
      return res.status(400).json({ error: 'Invalid license key' });
    }

    const productId = license.data.product_id;
    const quantity = license.data.metadata?.quantity || 100;

    // Step 2: Delete license
    await fetch(`https://developer.sell.app/api/licenses/${licenseKey}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer e1I3gxOHIdjObMWTjBED5KvCmQfVfOEutHjGqTkjed8bea5f',
        Accept: 'application/json'
      }
    });

    // Step 3: Choose service based on product
    let serviceId = null;
    if (productId === 'online_members_product_id') {
      serviceId = 6002;
    } else if (productId === 'offline_members_product_id') {
      serviceId = 7344;
    } else {
      return res.status(400).json({ error: 'Unknown product ID' });
    }

    // Step 4: Place order on SMM panel
    const smmRes = await fetch('https://morethanpanel.com/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'a40f9983250c8666d304e0c0a90c6467',
        action: 'add',
        service: serviceId,
        link: 'https://discord.gg/YOUR_SERVER_LINK', // customize later
        quantity
      })
    });

    const smmResult = await smmRes.json();

    if (!smmResult?.order) {
      return res.status(500).json({ error: 'SMM panel error', details: smmResult });
    }

    return res.status(200).json({ success: true, order: smmResult.order });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}

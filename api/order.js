// /api/order.js (DEV MODE ENABLED)

const DEV_MODE = true;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { licenseKey, discordLink } = req.body;

  if (!licenseKey || !discordLink) {
    return res.status(400).json({ error: 'License key and Discord link are required' });
  }

  try {
    // Validate license key with Sell.app
    const validateRes = await fetch(`https://sell.app/api/v1/licenses/${licenseKey}`, {
      headers: {
        Authorization: 'Bearer e1I3gxOHIdjObMWTjBED5KvCmQfVfOEutHjGqTkjed8bea5f',
        'Content-Type': 'application/json'
      }
    });


    const license = await validateRes.json();
    const isValid = license?.data?.valid;

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid license key' });
    }

    const productId = license.data.product_id || 'TEST_ONLINE';
    const quantity = license.data.metadata?.quantity || 100;

    console.log('Product ID:', productId);
    console.log('License Check Response:', license);

    // Skip license deletion in dev mode
    if (!DEV_MODE) {
      await fetch(`https://developer.sell.app/api/licenses/${licenseKey}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer e1I3gxOHIdjObMWTjBED5KvCmQfVfOEutHjGqTkjed8bea5f',
          Accept: 'application/json'
        }
      });
    }

    // Determine service ID
    let serviceId = null;
    if (productId === 'online_members_product_id' || productId === 'TEST_ONLINE') {
      serviceId = 6002;
    } else if (productId === 'offline_members_product_id' || productId === 'TEST_OFFLINE') {
      serviceId = 7344;
    } else {
      return res.status(400).json({ error: 'Unknown product ID', productId });
    }

    // DEV MODE: Fake response
    if (DEV_MODE) {
      return res.status(200).json({
        success: true,
        dev: true,
        order: 'FAKE-ORDER-ID-123'
      });
    }

    // Live SMM API call
    const smmRes = await fetch('https://morethanpanel.com/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'a40f9983250c8666d304e0c0a90c6467',
        action: 'add',
        service: serviceId,
        link: discordLink,
        quantity
      })
    });

    const smmResult = await smmRes.json();

    if (!smmResult?.order) {
      return res.status(500).json({ error: 'SMM panel error', details: smmResult });
    }

    return res.status(200).json({ success: true, order: smmResult.order });

  } catch (err) {
    console.error('Error in /api/order:', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}

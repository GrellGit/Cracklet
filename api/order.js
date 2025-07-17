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
    // Step 1: Activate license (instance_name removed, just use licenseKey itself)
    const activateRes = await fetch('https://sell.app/api/v1/licenses/activate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer e1I3gxOHIdjObMWTjBED5KvCmQfVfOEutHjGqTkjed8bea5f',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        license_key: licenseKey,
        instance_name: licenseKey // just reuse it as placeholder
      })
    });

    const activationData = await activateRes.json();

    if (!activateRes.ok) {
      const message = activationData?.message || 'License activation failed.';
      return res.status(400).json({ error: message });
    }

    const productId = activationData?.license_key?.product_id || 'TEST_ONLINE';
    const quantity = activationData?.license_key?.metadata?.quantity || 100;

    let serviceId;
    if (productId === 'online_members_product_id' || productId === 'TEST_ONLINE') {
      serviceId = 6002;
    } else if (productId === 'offline_members_product_id' || productId === 'TEST_OFFLINE') {
      serviceId = 7344;
    } else {
      return res.status(400).json({ error: 'Unknown product ID', productId });
    }

    if (DEV_MODE) {
      return res.status(200).json({
        success: true,
        dev: true,
        order: 'FAKE_ORDER_12345'
      });
    }

    // Real order (live mode)
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
      return res.status(500).json({ error: 'SMM panel failed', details: smmResult });
    }

    return res.status(200).json({ success: true, order: smmResult.order });

  } catch (err) {
    console.error('Error in /api/order:', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}

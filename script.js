document.getElementById('submitBtn').addEventListener('click', async () => {
  const licenseKey = document.getElementById('licenseInput').value.trim();
  const discordLink = document.getElementById('discordLinkInput').value.trim();
  const instanceName = document.getElementById('instanceInput').value.trim();

  if (!licenseKey || !discordLink || !instanceName) {
    alert('Please fill in all fields.');
    return;
  }

  try {
    const response = await fetch('/api/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        licenseKey,
        discordLink,
        instanceName
      })
    });

    const data = await response.json();

    if (data.success) {
      alert(`Order placed successfully! Order ID: ${data.order}`);
      window.location.href = 'https://discord.gg/nfjeEsPgyx';
    } else {
      alert(`Error: ${data.error || 'Unknown error'}`);
    }

  } catch (err) {
    console.error(err);
    alert('Something went wrong.');
  }
});

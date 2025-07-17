document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submitBtn');

  if (!submitBtn) {
    console.error('Submit button not found');
    return;
  }

  submitBtn.addEventListener('click', async () => {
    const licenseKey = document.getElementById('licenseInput').value.trim();
    const discordLink = document.getElementById('discordLinkInput').value.trim();

    if (!licenseKey || !discordLink) {
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
          discordLink
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
});

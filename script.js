const form = document.getElementById('deliveryForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const licenseKey = document.getElementById('licenseKey').value.trim();
  const discordLink = document.getElementById('discordLink').value.trim();

  if (!licenseKey || !discordLink) {
    showMessage("Please fill in both fields.");
    return;
  }

  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey, discordLink })
    });

    const data = await res.json();

    if (data.success) {
      showMessage(`✅ Order started successfully. Order ID: ${data.order}`);
    } else {
      showMessage(`❌ Error: ${data.error || 'Something went wrong'}`);
    }
  } catch (err) {
    showMessage(`❌ Request failed: ${err.message}`);
  }
});

function showMessage(msg) {
  message.textContent = msg;
  message.classList.remove('hidden');
}

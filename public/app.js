// Screen management
const screens = {
    login: document.getElementById('loginScreen'),
    lobby: document.getElementById('lobbyScreen'),
    game: document.getElementById('gameScreen')
};

let pollInterval;
let currentUsername = '';

function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.add('hidden');
    });
    screens[screenName].classList.remove('hidden');
}

// Server communication with improved error handling
async function sendRequest(url, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (data) {
            options.body = JSON.stringify(data);
        }
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Request failed:', error.message);
        showError(`Request failed: ${error.message}`);
        return null;
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 3000);
    }
}

// Login handling
async function handleLogin() {
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();
    
    if (!username) {
        showError('Please enter a username');
        return;
    }

    const response = await sendRequest('/player/login', 'POST', { username });
    if (response?.success) {
        currentUsername = username;
        localStorage.setItem('username', username);
        showScreen('lobby');
        startPolling();
    }
}

// Game management
async function createGame() {
    const gameNameInput = document.getElementById('gameName');
    const gameName = gameNameInput.value.trim();
    
    if (!gameName) {
        showError('Please enter a game name');
        return;
    }

    const response = await sendRequest('/game', 'POST', {
        name: gameName,
        creator: currentUsername
    });

    if (response?.success) {
        gameNameInput.value = '';
        updateGamesList();
    }
}

async function deleteGame(gameId) {
    try {
        const response = await sendRequest(`/game/${gameId}`, 'DELETE', {
            username: currentUsername
        });
        
        if (response?.success) {
            updateGamesList();
        } else {
            showError(response?.message || 'Failed to delete game');
        }
    } catch (error) {
        showError('Error deleting game');
    }
}

// Polling with error handling
function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    updateGamesList(); // Initial update
    pollInterval = setInterval(updateGamesList, 2000);
}

async function updateGamesList() {
    try {
        const games = await sendRequest('/game');
        if (games && Array.isArray(games)) {
            const gamesList = document.getElementById('gamesList');
            if (gamesList) {
                gamesList.innerHTML = games.map(game => `
                    <div class="game-item">
                        <h3>${escapeHtml(game.name)}</h3>
                        <p>Created by: ${escapeHtml(game.creator)}</p>
                        <p>Players: ${game.players.length}</p>
                        ${game.creator === currentUsername ? 
                            `<button onclick="deleteGame('${game.id}')" class="delete-btn">Delete Game</button>` : 
                            ''
                        }
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Failed to update games list:', error);
    }
}

// Utility function to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function backToLobby() {
    showScreen('lobby');
}

// Auto-login if username exists in localStorage
window.addEventListener('load', () => {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
        document.getElementById('username').value = savedUsername;
        handleLogin();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', async () => {
    try {
        if (currentUsername) {
            await sendRequest('/player/logout', 'POST', { username: currentUsername });
        }
    } finally {
        if (pollInterval) clearInterval(pollInterval);
    }
});

// Make functions globally available
window.handleLogin = handleLogin;
window.createGame = createGame;
window.deleteGame = deleteGame;
window.backToLobby = backToLobby;
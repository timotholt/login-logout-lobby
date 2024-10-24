export function showScreen(screens, screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.add('hidden');
    });
    screens[screenName].classList.remove('hidden');
}

export function showError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }
}

export function updateGamesList(games, currentUsername, onDelete) {
    const gamesListDiv = document.getElementById('gamesList');
    if (!gamesListDiv) return;

    gamesListDiv.innerHTML = games.length ? '' : '<p>No games available</p>';
    
    games.forEach(game => {
        const gameElement = document.createElement('div');
        gameElement.className = 'game-item';
        
        const gameInfo = document.createElement('div');
        gameInfo.textContent = `${game.name} (Created by: ${game.creator})`;
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '🗑️ Delete';
        deleteButton.onclick = () => onDelete(game.id, currentUsername);

      window.alert(`Current username = ${currentUsername}`);
        
        // Only show delete button for games created by current user
        if (game.creator === currentUsername) {
            gameElement.appendChild(gameInfo);
            gameElement.appendChild(deleteButton);
        } else {
            gameElement.appendChild(gameInfo);
        }
        
        gamesListDiv.appendChild(gameElement);
    });
}
import { api } from './api.js';
import { showScreen, showError, updateGamesList } from './ui.js';

class GameApp {
    constructor() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeApp();
        });
    }

    initializeApp() {
        this.screens = {
            login: document.getElementById('loginScreen'),
            register: document.getElementById('registerScreen'),
            lobby: document.getElementById('lobbyScreen'),
            game: document.getElementById('gameScreen')
        };
        this.currentUsername = '';
        this.pollInterval = null;
        this.refreshTimer = null;
        this.pollDelay = 30000; // 2 seconds
        
        this.setupEventListeners();
        showScreen(this.screens, 'login');
    }

    setupEventListeners() {
        // Registration
        document.getElementById('showRegisterButton').addEventListener('click', () => {
            showScreen(this.screens, 'register');
        });

        document.getElementById('showLoginButton').addEventListener('click', () => {
            showScreen(this.screens, 'login');
        });

        document.getElementById('registerButton').addEventListener('click', () => this.handleRegister());
        document.getElementById('registerUsername').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRegister();
        });

        // Login
        document.getElementById('loginButton').addEventListener('click', () => this.handleLogin());
        document.getElementById('username').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Logout
        document.getElementById('logoutButton').addEventListener('click', () => this.handleLogout());

        // Game creation
        document.getElementById('createGameButton').addEventListener('click', () => this.createGame());
        document.getElementById('gameName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createGame();
        });

        // Back to lobby
        document.getElementById('backToLobbyButton').addEventListener('click', () => {
            showScreen(this.screens, 'lobby');
        });
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        try {
            const response = await api.register(username, password);
            if (response?.success) {
                showScreen(this.screens, 'login');
                document.getElementById('registerUsername').value = '';
                document.getElementById('registerPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            }
        } catch (error) {
            showError('Registration failed. Please try again.');
        }
    }
    
    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }

        try {
            const response = await api.login(username, password);
            if (response?.success) {
                this.currentUsername = username;
                showScreen(this.screens, 'lobby');
                this.startPolling();
            }
        } catch (error) {
            showError('Login failed. Please try again.');
        }
    }

    async handleLogout() {
        try {
            if (this.currentUsername) {
                const response = await api.logout(this.currentUsername);
                if (response?.success) {
                    this.currentUsername = '';
                    this.stopPolling();
                    showScreen(this.screens, 'login');
                }
            }
        } catch (error) {
            showError('Logout failed. Please try again.');
        }
    }
    
    async createGame() {
        const gameNameInput = document.getElementById('gameName');
        const gameName = gameNameInput.value.trim();
        
        if (!gameName) {
            showError('Please enter a game name');
            return;
        }

        try {
            const response = await api.createGame(gameName, this.currentUsername);
            if (response?.success) {
                gameNameInput.value = '';
                this.updateGamesList();
            }
        } catch (error) {
            showError('Failed to create game. Please try again.');
        }
    }
    
    async deleteGame(gameId, username) {
        try {
            const response = await api.deleteGame(gameId, username);
            if (response?.success) {
                this.updateGamesList();
            }
        } catch (error) {
            showError('Failed to delete game. Please try again.');
        }
    }
    
    startPolling() {
        this.stopPolling();
        this.updateGamesList();
        this.pollInterval = setInterval(() => this.updateGamesList(), this.pollDelay);
        this.startRefreshTimer();
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    startRefreshTimer() {
        const timerElement = document.getElementById('refreshTimer');
        let timeLeft = this.pollDelay / 1000;

        const updateTimer = () => {
            timerElement.textContent = `Next refresh in ${timeLeft} second${timeLeft !== 1 ? 's' : ''}`;
            timeLeft--;

            if (timeLeft < 0) {
                timeLeft = this.pollDelay / 1000;
            }
        };

        updateTimer();
        this.refreshTimer = setInterval(updateTimer, 1000);
    }
    
    async updateGamesList() {
        try {
            const games = await api.getGames();
            updateGamesList(games, this.currentUsername, (gameId, username) => this.deleteGame(gameId, username));
        } catch (error) {
            console.error('Failed to update games list:', error);
        }
    }
}

new GameApp();
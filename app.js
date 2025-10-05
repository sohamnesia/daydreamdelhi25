// Infinite Survival Game State Management
let gameState = 'title'; // 'title', 'playing', 'paused', 'shop', 'gameOver'
let canvas, ctx;
let score = 0;
let shipsSaved = 0;
let fuel = 100;
let maxFuel = 100;
let isLightOn = false;
let ships = [];
let particles = [];
let gameTime = 0;
let survivalStartTime = 0;
let survivalTime = 0;
let lastShipSpawn = 0;
let spawnRate = 3000;
let combo = 0;
let lastSaveTime = 0;
let comboTimer = 0;
let stormActive = false;
let stormTimer = 0;
let stormCooldown = 30000; // 30 seconds initial
let beaconTimer = 0;
let fuelWarningTimer = 0;
let shopVisitCount = 0;
let nextShopThreshold = 150;

// Audio system
let soundEnabled = true;
const audioContext = {};

// High score system - multiple stats tracking
let highScores = {
    bestScore: 0,
    longestSurvival: 0,
    mostShipsSaved: 0,
    highestCombo: 0,
    totalGamesPlayed: 0
};

// Input tracking
let keys = {};
let mouseDown = false;

// Infinite scaling configuration
const difficultyScaling = {
    getSpawnRate: (score) => Math.max(800, 3000 - (score * 4)),
    getSpeedMultiplier: (score) => 1 + (Math.floor(score / 50) * 0.1),
    getStormFrequency: (score) => Math.max(10, 30 - (Math.floor(score / 25) * 0.2)),
    getScoreMultiplier: (score) => 1 + Math.floor(score / 200) * 0.5,
    getDifficultyLevel: (score) => Math.floor(score / 100) + 1,
    getFuelConsumptionMultiplier: (score) => score > 500 ? 1 + (score - 500) * 0.0001 : 1
};

// Enhanced ship types with better balance
const shipTypes = [
    {
        type: 'fishing_boat',
        emoji: '⛵',
        color: '#4A90E2',
        points: 15,
        speed: 2.5,
        size: 'small',
        width: 25,
        height: 15,
        spawnWeight: 0.5
    },
    {
        type: 'cargo_ship',
        emoji: '🚢',
        color: '#7F8C8D',
        points: 25,
        speed: 2,
        size: 'medium',
        width: 35,
        height: 20,
        spawnWeight: 0.3
    },
    {
        type: 'cruise_ship',
        emoji: '🛳️',
        color: '#ECF0F1',
        points: 50,
        speed: 1.5,
        size: 'large',
        width: 50,
        height: 25,
        spawnWeight: 0.2
    }
];

// Shop items with scaling costs
const shopItems = [
    {
        id: 'fuelTank',
        name: 'Fuel Tank Upgrade',
        description: '+25 max fuel capacity',
        baseCost: 50,
        scaling: 1.2,
        maxPurchases: 5,
        owned: 0
    },
    {
        id: 'lightRange',
        name: 'Lighthouse Range',
        description: '+15% beam range',
        baseCost: 75,
        scaling: 1.2,
        maxPurchases: 4,
        owned: 0
    },
    {
        id: 'fuelEfficiency',
        name: 'Fuel Efficiency',
        description: '-20% fuel consumption',
        baseCost: 100,
        scaling: 1.2,
        maxPurchases: 3,
        owned: 0
    },
    {
        id: 'shipScanner',
        name: 'Ship Scanner',
        description: 'Shows ship point values',
        baseCost: 50,
        scaling: 1.0,
        maxPurchases: 1,
        owned: 0,
        oneTime: true
    },
    {
        id: 'emergencyFuel',
        name: 'Emergency Reserves',
        description: '+25 fuel instantly',
        baseCost: 25,
        scaling: 1.4,
        maxPurchases: 99,
        owned: 0
    },
    {
        id: 'autoBeacon',
        name: 'Auto Beacon',
        description: 'Periodic free light pulses',
        baseCost: 150,
        scaling: 1.2,
        maxPurchases: 1,
        owned: 0,
        oneTime: true
    }
];

// Milestone system
const milestones = [
    {score: 100, message: "Getting the hang of it!"},
    {score: 250, message: "Lighthouse master!"},
    {score: 500, message: "Storm survivor!"},
    {score: 1000, message: "Legendary keeper!"},
    {score: 2000, message: "Beacon of hope!"},
    {time: 120, message: "2 minutes survived!"},
    {time: 300, message: "5 minutes - incredible!"},
    {time: 600, message: "10 minutes - legendary!"},
    {ships: 25, message: "25 ships saved!"},
    {ships: 50, message: "50 ships saved!"},
    {ships: 100, message: "100 ships saved!"}
];

let achievedMilestones = new Set();

// Enhanced lighthouse properties
const lighthouse = {
    x: 400,
    y: 550,
    width: 24,
    height: 60,
    lightAngle: Math.PI / 3,
    lightDistance: 280,
    baseRange: 280,
    stripeCount: 4,
    rotationAngle: 0
};

// Upgrade effects
let upgrades = {
    fuelEfficiencyMultiplier: 1,
    rangeMultiplier: 1,
    hasScanner: false,
    emergencyFuelBonus: 0,
    hasAutoBeacon: false
};

// Game functions - Define as regular functions first, then assign to window
function startGame() {
    console.log('Start infinite survival game');
    
    try {
        gameState = 'playing';
        score = 0;
        shipsSaved = 0;
        fuel = maxFuel;
        ships = [];
        particles = [];
        gameTime = 0;
        survivalStartTime = Date.now();
        survivalTime = 0;
        lastShipSpawn = 0;
        spawnRate = 3000;
        combo = 0;
        stormActive = false;
        stormCooldown = 30000;
        shopVisitCount = 0;
        nextShopThreshold = 150;
        achievedMilestones.clear();
        
        // Increment games played
        highScores.totalGamesPlayed++;
        
        // Hide title screen and show game screen
        const titleScreen = document.getElementById('titleScreen');
        const gameScreen = document.getElementById('gameScreen');
        
        if (titleScreen) {
            titleScreen.classList.add('hidden');
            titleScreen.style.display = 'none';
        }
        
        if (gameScreen) {
            gameScreen.classList.remove('hidden');
            gameScreen.style.display = 'flex';
        }
        
        // Make sure storm overlay is hidden
        const stormOverlay = document.getElementById('stormOverlay');
        if (stormOverlay) {
            stormOverlay.classList.add('hidden');
            stormOverlay.style.display = 'none';
        }
        
        updateUI();
        console.log('Infinite survival started successfully');
        
    } catch (error) {
        console.error('Error starting game:', error);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const toggle = document.getElementById('soundToggle');
    if (toggle) {
        toggle.textContent = soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
    }
    console.log('Sound toggled:', soundEnabled);
}

function pauseGame() {
    if (gameState !== 'playing') return;
    
    gameState = 'paused';
    const pauseScreen = document.getElementById('pauseScreen');
    if (pauseScreen) {
        pauseScreen.classList.remove('hidden');
        pauseScreen.style.display = 'flex';
    }
    
    // Update pause screen stats
    updatePauseScreen();
}

function resumeGame() {
    if (gameState !== 'paused') return;
    
    gameState = 'playing';
    const pauseScreen = document.getElementById('pauseScreen');
    if (pauseScreen) {
        pauseScreen.classList.add('hidden');
        pauseScreen.style.display = 'none';
    }
}

function restartFromPause() {
    const pauseScreen = document.getElementById('pauseScreen');
    if (pauseScreen) {
        pauseScreen.classList.add('hidden');
        pauseScreen.style.display = 'none';
    }
    startGame();
}

function quitToTitle() {
    const pauseScreen = document.getElementById('pauseScreen');
    if (pauseScreen) {
        pauseScreen.classList.add('hidden');
        pauseScreen.style.display = 'none';
    }
    goToTitle();
}

function restartGame() {
    resetUpgrades();
    
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) {
        gameOverScreen.classList.add('hidden');
        gameOverScreen.style.display = 'none';
    }
    startGame();
}

function goToTitle() {
    console.log('Going to title screen');
    
    resetUpgrades();
    showTitleScreen();
    updateTitleScreen();
}

function continueFromShop() {
    gameState = 'playing';
    
    const shopScreen = document.getElementById('shopScreen');
    const gameScreen = document.getElementById('gameScreen');
    
    if (shopScreen) {
        shopScreen.classList.add('hidden');
        shopScreen.style.display = 'none';
    }
    if (gameScreen) {
        gameScreen.classList.remove('hidden');
        gameScreen.style.display = 'flex';
    }
    
    updateUI();
}

function skipShop() {
    continueFromShop();
}

function purchaseItem(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;
    
    const currentCost = getCurrentItemCost(item);
    
    if (score >= currentCost && item.owned < item.maxPurchases) {
        score -= currentCost;
        item.owned++;
        
        // Apply upgrade effects
        applyUpgrade(itemId);
        
        // Update shop display
        populateShop();
        updateShopPoints();
        
        playSound('shipSaved'); // Use as purchase sound
    }
}

// Initialize game
function init() {
    console.log('Initializing infinite survival game...');
    
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }
    ctx = canvas.getContext('2d');
    
    // Load high scores
    loadHighScores();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI
    updateTitleScreen();
    
    // Ensure all overlays are hidden initially
    hideAllOverlays();
    
    // Make sure we're in title state
    showTitleScreen();
    
    console.log('Game initialized successfully');
    
    // Assign functions to window object for global access
    window.startGame = startGame;
    window.toggleSound = toggleSound;
    window.pauseGame = pauseGame;
    window.resumeGame = resumeGame;
    window.restartFromPause = restartFromPause;
    window.quitToTitle = quitToTitle;
    window.restartGame = restartGame;
    window.goToTitle = goToTitle;
    window.continueFromShop = continueFromShop;
    window.skipShop = skipShop;
    window.purchaseItem = purchaseItem;
    
    // Start game loop
    gameLoop();
}

function hideAllOverlays() {
    const overlays = ['stormOverlay', 'pauseScreen', 'shopScreen', 'gameOverScreen', 'gameScreen', 'milestoneNotification'];
    overlays.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
            element.style.display = 'none';
        }
    });
}

function showTitleScreen() {
    console.log('Showing title screen');
    gameState = 'title';
    
    // Hide all other screens
    hideAllOverlays();
    
    // Show title screen
    const titleScreen = document.getElementById('titleScreen');
    if (titleScreen) {
        titleScreen.classList.remove('hidden');
        titleScreen.style.display = 'flex';
    }
}

function playSound(soundName) {
    if (!soundEnabled) return;
    
    // Simple sound simulation with Web Audio API
    try {
        if (!audioContext.ctx) {
            audioContext.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const oscillator = audioContext.ctx.createOscillator();
        const gainNode = audioContext.ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.ctx.destination);
        
        // Different frequencies for different sounds
        switch (soundName) {
            case 'lighthouseOn':
                oscillator.frequency.setValueAtTime(220, audioContext.ctx.currentTime);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, audioContext.ctx.currentTime);
                break;
            case 'shipSaved':
                oscillator.frequency.setValueAtTime(440, audioContext.ctx.currentTime);
                oscillator.type = 'triangle';
                gainNode.gain.setValueAtTime(0.2, audioContext.ctx.currentTime);
                break;
            case 'shipCrashed':
                oscillator.frequency.setValueAtTime(110, audioContext.ctx.currentTime);
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.1, audioContext.ctx.currentTime);
                break;
            case 'fuelWarning':
                oscillator.frequency.setValueAtTime(880, audioContext.ctx.currentTime);
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.05, audioContext.ctx.currentTime);
                break;
            case 'milestone':
                oscillator.frequency.setValueAtTime(660, audioContext.ctx.currentTime);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.15, audioContext.ctx.currentTime);
                break;
        }
        
        oscillator.start();
        oscillator.stop(audioContext.ctx.currentTime + 0.2);
        
    } catch (e) {
        console.log('Audio context not available');
    }
}

function setupEventListeners() {
    if (!canvas) return;
    
    // Mouse events
    canvas.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (gameState === 'playing') {
            mouseDown = true;
            activateLight();
        }
    });
    
    canvas.addEventListener('mouseup', (e) => {
        e.preventDefault();
        mouseDown = false;
        deactivateLight();
    });
    
    // Keyboard events
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        if (gameState === 'playing') {
            if (e.code === 'Space') {
                e.preventDefault();
                activateLight();
            } else if (e.code === 'Escape') {
                e.preventDefault();
                pauseGame();
            }
        } else if (gameState === 'paused' && e.code === 'Escape') {
            e.preventDefault();
            resumeGame();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
        if (e.code === 'Space') {
            deactivateLight();
        }
    });
    
    // Prevent context menu
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function activateLight() {
    if (fuel > 0 && !isLightOn) {
        isLightOn = true;
        playSound('lighthouseOn');
    }
}

function deactivateLight() {
    isLightOn = false;
}

// Enhanced Ship class with infinite scaling
class Ship {
    constructor(type) {
        const shipData = shipTypes.find(s => s.type === type);
        if (!shipData) return;
        
        Object.assign(this, shipData);
        
        this.x = canvas.width + this.width;
        this.y = Math.random() * (canvas.height - 220) + 100;
        this.saved = false;
        this.crashed = false;
        this.pointsDisplayed = false;
        this.wobble = Math.random() * Math.PI * 2;
        
        // Apply speed scaling based on score
        const speedMultiplier = difficultyScaling.getSpeedMultiplier(score);
        this.speed *= speedMultiplier;
        
        // Storm speed modifier
        if (stormActive) {
            this.speed *= 1.3;
            this.stormBonus = true;
        } else {
            this.stormBonus = false;
        }
    }
    
    update(deltaTime) {
        this.wobble += 0.05;
        this.x -= this.speed;
        this.y += Math.sin(this.wobble) * 0.5; // Ocean wave effect
        
        // Check if ship has left the screen
        if (this.x + this.width < 0 && !this.saved) {
            this.crashed = true;
            return false;
        }
        
        // Check collision with light beam
        if (isLightOn && this.isInLight() && !this.saved) {
            this.saved = true;
            let points = this.points;
            
            // Apply storm bonus
            if (this.stormBonus) {
                points *= 2;
            }
            
            // Apply score multiplier
            const scoreMultiplier = difficultyScaling.getScoreMultiplier(score);
            if (scoreMultiplier > 1) {
                points = Math.floor(points * scoreMultiplier);
            }
            
            // Apply combo bonus
            updateCombo();
            if (combo > 1) {
                points = Math.floor(points * (1 + combo * 0.1));
            }
            
            score += points;
            shipsSaved++;
            createSaveParticles(this.x + this.width/2, this.y + this.height/2);
            playSound('shipSaved');
            updateUI();
            
            // Check for milestones
            checkMilestones();
            
            // Check for shop availability
            checkShopAvailability();
            
            // Show combo if applicable
            if (combo > 1) {
                showComboEffect();
            }
        }
        
        return true;
    }
    
    isInLight() {
        if (!canvas) return false;
        
        const shipCenterX = this.x + this.width / 2;
        const shipCenterY = this.y + this.height / 2;
        
        const dx = shipCenterX - lighthouse.x;
        const dy = lighthouse.y - shipCenterY;
        
        if (dy < 0) return false;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        const effectiveRange = lighthouse.lightDistance * upgrades.rangeMultiplier;
        
        if (distance > effectiveRange) return false;
        
        const angle = Math.atan2(Math.abs(dx), dy);
        return angle < lighthouse.lightAngle / 2;
    }
    
    draw() {
        if (!ctx) return;
        
        ctx.save();
        
        // Ship body
        ctx.fillStyle = this.saved ? '#2ECC71' : this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Ship details based on type
        ctx.fillStyle = '#34495E';
        if (this.type === 'fishing_boat') {
            // Sail
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width - 5, this.y - 5);
            ctx.lineTo(this.x + this.width + 5, this.y + 5);
            ctx.lineTo(this.x + this.width - 5, this.y + this.height/2);
            ctx.fill();
        } else if (this.type === 'cargo_ship') {
            // Containers
            ctx.fillStyle = '#E74C3C';
            ctx.fillRect(this.x + 5, this.y + 2, 8, 6);
            ctx.fillStyle = '#3498DB';
            ctx.fillRect(this.x + 15, this.y + 2, 8, 6);
        } else if (this.type === 'cruise_ship') {
            // Multiple decks
            ctx.fillStyle = '#F39C12';
            ctx.fillRect(this.x + 5, this.y + 2, this.width - 10, 4);
            ctx.fillRect(this.x + 10, this.y + 8, this.width - 20, 4);
        }
        
        // Bridge/cabin
        ctx.fillStyle = '#34495E';
        ctx.fillRect(this.x + this.width - 8, this.y + 2, 6, this.height - 4);
        
        // Ship scanner points display
        if (upgrades.hasScanner && !this.pointsDisplayed) {
            ctx.fillStyle = '#F1C40F';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            let displayPoints = this.points;
            if (this.stormBonus) displayPoints *= 2;
            
            // Apply score multiplier to display
            const scoreMultiplier = difficultyScaling.getScoreMultiplier(score);
            if (scoreMultiplier > 1) {
                displayPoints = Math.floor(displayPoints * scoreMultiplier);
            }
            
            ctx.fillText(`${displayPoints}`, this.x + this.width/2, this.y - 8);
            this.pointsDisplayed = true;
        }
        
        ctx.restore();
    }
}

// Enhanced Particle class
class Particle {
    constructor(x, y, type = 'sparkle') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = -Math.random() * 4 - 2;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
        this.size = 2 + Math.random() * 3;
        
        if (type === 'explosion') {
            this.color = '#E74C3C';
            this.vx *= 1.5;
            this.vy *= 0.5;
        } else {
            this.color = '#F1C40F';
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // gravity
        this.life -= this.decay;
        return this.life > 0;
    }
    
    draw() {
        if (!ctx) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        
        if (this.type === 'sparkle') {
            // Star shape
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5;
                const x = this.x + Math.cos(angle) * this.size;
                const y = this.y + Math.sin(angle) * this.size;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.fill();
        } else {
            ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        }
        
        ctx.restore();
    }
}

function createSaveParticles(x, y) {
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(x, y, 'sparkle'));
    }
}

function createCrashParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push(new Particle(x, y, 'explosion'));
    }
}

// Combo system
function updateCombo() {
    const currentTime = Date.now();
    if (currentTime - lastSaveTime < 4000) {
        combo++;
    } else {
        combo = 1;
    }
    lastSaveTime = currentTime;
    comboTimer = 3000;
    
    // Update highest combo record
    if (combo > highScores.highestCombo) {
        highScores.highestCombo = combo;
    }
}

function showComboEffect() {
    const comboEl = document.createElement('div');
    comboEl.className = 'combo-display';
    comboEl.textContent = `${combo}x COMBO!`;
    document.body.appendChild(comboEl);
    
    setTimeout(() => {
        if (comboEl.parentNode) {
            document.body.removeChild(comboEl);
        }
    }, 1000);
}

function checkShopAvailability() {
    if (score >= nextShopThreshold) {
        // Pause game and show shop notification
        gameState = 'shop';
        shopVisitCount++;
        nextShopThreshold += 150; // Next shop at +150 points
        
        const gameScreen = document.getElementById('gameScreen');
        const shopScreen = document.getElementById('shopScreen');
        
        if (gameScreen) {
            gameScreen.classList.add('hidden');
            gameScreen.style.display = 'none';
        }
        if (shopScreen) {
            shopScreen.classList.remove('hidden');
            shopScreen.style.display = 'flex';
        }
        
        updateShopScreen();
        populateShop();
    }
}

function updateShopScreen() {
    const shopPoints = document.getElementById('shopPoints');
    const shopVisitNumber = document.getElementById('shopVisitNumber');
    
    if (shopPoints) shopPoints.textContent = score;
    if (shopVisitNumber) shopVisitNumber.textContent = shopVisitCount;
}

function updateShopPoints() {
    const shopPoints = document.getElementById('shopPoints');
    if (shopPoints) shopPoints.textContent = score;
}

function getCurrentItemCost(item) {
    const priceIncrease = Math.pow(1.15, shopVisitCount - 1); // 15% increase per shop visit
    const ownedIncrease = Math.pow(item.scaling, item.owned);
    return Math.floor(item.baseCost * priceIncrease * ownedIncrease);
}

function populateShop() {
    const shopGrid = document.getElementById('shopGrid');
    if (!shopGrid) return;
    
    shopGrid.innerHTML = '';
    
    shopItems.forEach(item => {
        // Skip one-time items that are already owned
        if (item.oneTime && item.owned > 0) return;
        
        const itemEl = document.createElement('div');
        itemEl.className = 'shop-item';
        
        const canPurchase = item.owned < item.maxPurchases;
        const currentCost = getCurrentItemCost(item);
        const canAfford = score >= currentCost;
        
        if (!canPurchase || !canAfford) {
            itemEl.classList.add('unavailable');
        }
        
        let description = item.description;
        if (item.id === 'emergencyFuel') {
            description = `+25 fuel instantly (${item.owned} used)`;
        }
        
        itemEl.innerHTML = `
            <h4>${item.name}</h4>
            <p class="shop-item-description">${description}</p>
            ${item.owned > 0 && !item.oneTime ? `<div class="shop-item-owned">Owned: ${item.owned}/${item.maxPurchases}</div>` : ''}
            <div class="shop-item-price">${currentCost} Points</div>
            <button class="btn btn--primary" 
                ${!canPurchase || !canAfford ? 'disabled' : ''} 
                onclick="purchaseItem('${item.id}')">
                ${!canPurchase ? 'Max Owned' : !canAfford ? 'Too Expensive' : 'Purchase'}
            </button>
        `;
        
        shopGrid.appendChild(itemEl);
    });
}

function applyUpgrade(itemId) {
    switch (itemId) {
        case 'fuelTank':
            maxFuel += 25;
            fuel += 25; // Also give immediate fuel boost
            break;
        case 'lightRange':
            upgrades.rangeMultiplier += 0.15;
            break;
        case 'fuelEfficiency':
            upgrades.fuelEfficiencyMultiplier *= 0.8;
            break;
        case 'shipScanner':
            upgrades.hasScanner = true;
            break;
        case 'emergencyFuel':
            fuel = Math.min(maxFuel, fuel + 25);
            break;
        case 'autoBeacon':
            upgrades.hasAutoBeacon = true;
            break;
    }
}

function checkMilestones() {
    milestones.forEach(milestone => {
        const milestoneKey = `${milestone.score || milestone.time || milestone.ships}_${milestone.message}`;
        
        if (achievedMilestones.has(milestoneKey)) return;
        
        let achieved = false;
        
        if (milestone.score && score >= milestone.score) {
            achieved = true;
        } else if (milestone.time && survivalTime >= milestone.time) {
            achieved = true;
        } else if (milestone.ships && shipsSaved >= milestone.ships) {
            achieved = true;
        }
        
        if (achieved) {
            achievedMilestones.add(milestoneKey);
            showMilestoneNotification(milestone.message);
            playSound('milestone');
        }
    });
}

function showMilestoneNotification(message) {
    const notification = document.getElementById('milestoneNotification');
    const messageEl = document.getElementById('milestoneMessage');
    
    if (notification && messageEl) {
        messageEl.textContent = message;
        notification.classList.remove('hidden');
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.classList.add('hidden');
            notification.style.display = 'none';
        }, 3000);
    }
}

function gameOver() {
    gameState = 'gameOver';
    
    // Update high scores
    const currentSurvivalTime = Math.floor(survivalTime);
    let newRecords = [];
    
    if (score > highScores.bestScore) {
        highScores.bestScore = score;
        newRecords.push("🏆 NEW HIGH SCORE!");
    }
    
    if (currentSurvivalTime > highScores.longestSurvival) {
        highScores.longestSurvival = currentSurvivalTime;
        newRecords.push("⏱️ LONGEST SURVIVAL!");
    }
    
    if (shipsSaved > highScores.mostShipsSaved) {
        highScores.mostShipsSaved = shipsSaved;
        newRecords.push("🚢 MOST SHIPS SAVED!");
    }
    
    saveHighScores();
    
    const screens = ['gameScreen', 'pauseScreen', 'shopScreen'];
    screens.forEach(screenId => {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('hidden');
            screen.style.display = 'none';
        }
    });
    
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) {
        gameOverScreen.classList.remove('hidden');
        gameOverScreen.style.display = 'flex';
    }
    
    // Update game over screen
    updateGameOverScreen(newRecords, currentSurvivalTime);
}

function updateGameOverScreen(newRecords, survivalTime) {
    const finalScore = document.getElementById('finalScore');
    const finalShipsSaved = document.getElementById('finalShipsSaved');
    const finalSurvivalTime = document.getElementById('finalSurvivalTime');
    const difficultyReached = document.getElementById('difficultyReached');
    const achievementNotices = document.getElementById('achievementNotices');
    
    if (finalScore) finalScore.textContent = score;
    if (finalShipsSaved) finalShipsSaved.textContent = shipsSaved;
    if (finalSurvivalTime) finalSurvivalTime.textContent = survivalTime;
    if (difficultyReached) difficultyReached.textContent = difficultyScaling.getDifficultyLevel(score);
    
    // Show achievement notices
    if (achievementNotices) {
        achievementNotices.innerHTML = '';
        newRecords.forEach(record => {
            const notice = document.createElement('div');
            notice.className = 'achievement-notice';
            notice.innerHTML = `<p>${record}</p>`;
            achievementNotices.appendChild(notice);
        });
    }
    
    // Set sacrifice message based on performance
    let message = '';
    if (survivalTime >= 600) {
        message = 'Legendary performance! You survived the endless storm and saved countless souls.';
    } else if (survivalTime >= 300) {
        message = 'Incredible endurance! Your beacon shone bright through the darkest hours.';
    } else if (survivalTime >= 120) {
        message = 'Admirable dedication! Many ships found safety thanks to your sacrifice.';
    } else if (shipsSaved >= 50) {
        message = 'Your quick thinking saved many lives in your short time as keeper.';
    } else if (shipsSaved >= 10) {
        message = 'Every ship saved matters. Your sacrifice was not in vain.';
    } else {
        message = 'The storm was fierce, but even the briefest light can guide lost souls to safety.';
    }
    
    const sacrificeMessage = document.getElementById('sacrificeMessage');
    if (sacrificeMessage) sacrificeMessage.textContent = message;
}

function resetUpgrades() {
    shopItems.forEach(item => item.owned = 0);
    maxFuel = 100;
    upgrades = {
        fuelEfficiencyMultiplier: 1,
        rangeMultiplier: 1,
        hasScanner: false,
        emergencyFuelBonus: 0,
        hasAutoBeacon: false
    };
}

function updateTitleScreen() {
    const bestScore = document.getElementById('bestScore');
    const longestSurvival = document.getElementById('longestSurvival');
    const mostShipsSaved = document.getElementById('mostShipsSaved');
    
    if (bestScore) bestScore.textContent = highScores.bestScore;
    if (longestSurvival) longestSurvival.textContent = highScores.longestSurvival;
    if (mostShipsSaved) mostShipsSaved.textContent = highScores.mostShipsSaved;
}

function updatePauseScreen() {
    const pauseScore = document.getElementById('pauseScore');
    const pauseShipsSaved = document.getElementById('pauseShipsSaved');
    const pauseSurvival = document.getElementById('pauseSurvival');
    const pauseDifficulty = document.getElementById('pauseDifficulty');
    
    if (pauseScore) pauseScore.textContent = score;
    if (pauseShipsSaved) pauseShipsSaved.textContent = shipsSaved;
    if (pauseSurvival) pauseSurvival.textContent = Math.floor(survivalTime);
    if (pauseDifficulty) pauseDifficulty.textContent = difficultyScaling.getDifficultyLevel(score);
}

function spawnShip() {
    if (!canvas) return;
    
    // Adjust spawn weights based on score (more valuable ships at higher scores)
    let weights = shipTypes.map(ship => {
        let weight = ship.spawnWeight;
        if (ship.type === 'cargo_ship' && score > 200) weight += 0.1;
        if (ship.type === 'cruise_ship' && score > 500) weight += 0.2;
        return weight;
    });
    
    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let rand = Math.random() * totalWeight;
    let selectedType = shipTypes[0];
    
    let cumulativeWeight = 0;
    for (let i = 0; i < shipTypes.length; i++) {
        cumulativeWeight += weights[i];
        if (rand <= cumulativeWeight) {
            selectedType = shipTypes[i];
            break;
        }
    }
    
    ships.push(new Ship(selectedType.type));
}

function updateUI() {
    const elements = {
        score: document.getElementById('score'),
        shipsSaved: document.getElementById('shipsSaved'),
        combo: document.getElementById('combo'),
        survivalTime: document.getElementById('survivalTime'),
        difficultyLevel: document.getElementById('difficultyLevel'),
        nextShopAt: document.getElementById('nextShopAt'),
        bestScoreGame: document.getElementById('bestScoreGame'),
        scoreMultiplier: document.getElementById('scoreMultiplier')
    };
    
    if (elements.score) elements.score.textContent = score;
    if (elements.shipsSaved) elements.shipsSaved.textContent = shipsSaved;
    if (elements.combo) elements.combo.textContent = combo;
    if (elements.survivalTime) elements.survivalTime.textContent = Math.floor(survivalTime);
    if (elements.difficultyLevel) elements.difficultyLevel.textContent = difficultyScaling.getDifficultyLevel(score);
    if (elements.nextShopAt) elements.nextShopAt.textContent = nextShopThreshold;
    if (elements.bestScoreGame) elements.bestScoreGame.textContent = highScores.bestScore;
    
    // Show score multiplier if > 1
    const scoreMultiplier = difficultyScaling.getScoreMultiplier(score);
    if (elements.scoreMultiplier) {
        if (scoreMultiplier > 1) {
            elements.scoreMultiplier.textContent = `×${scoreMultiplier.toFixed(1)}`;
            elements.scoreMultiplier.classList.remove('hidden');
        } else {
            elements.scoreMultiplier.classList.add('hidden');
        }
    }
    
    // Update fuel bar
    const fuelFill = document.getElementById('fuelFill');
    const fuelWarning = document.getElementById('fuelWarning');
    
    if (fuelFill && fuelWarning) {
        const fuelPercent = (fuel / maxFuel) * 100;
        fuelFill.style.width = fuelPercent + '%';
        
        // Fuel warning with increasing urgency
        if (fuelPercent <= 25) {
            fuelWarning.classList.add('critical');
            if (fuelPercent <= 10 && fuelWarningTimer <= 0) {
                playSound('fuelWarning');
                fuelWarningTimer = 2000; // More frequent warnings
            }
        } else {
            fuelWarning.classList.remove('critical');
        }
    }
}

function update(deltaTime) {
    if (gameState !== 'playing' || !canvas) return;
    
    gameTime += deltaTime;
    survivalTime = (Date.now() - survivalStartTime) / 1000;
    
    // Update timers
    if (comboTimer > 0) {
        comboTimer -= deltaTime;
        if (comboTimer <= 0) {
            combo = 0;
            updateUI();
        }
    }
    
    if (fuelWarningTimer > 0) {
        fuelWarningTimer -= deltaTime;
    }
    
    // Auto beacon effect
    if (upgrades.hasAutoBeacon) {
        beaconTimer += deltaTime;
        if (beaconTimer >= 10000) { // Every 10 seconds
            beaconTimer = 0;
            // Temporary free light pulse
            const savedLightState = isLightOn;
            isLightOn = true;
            setTimeout(() => {
                if (!mouseDown && !keys['Space']) {
                    isLightOn = savedLightState;
                }
            }, 800);
        }
    }
    
    // Dynamic storm events based on difficulty
    const stormFrequency = difficultyScaling.getStormFrequency(score) * 1000;
    if (!stormActive && stormCooldown <= 0) {
        if (Math.random() < 0.0001 * (1 + score / 1000)) { // Increasing storm chance
            stormActive = true;
            stormTimer = 12000 + Math.random() * 8000; // 12-20 second storms
            stormCooldown = stormFrequency;
            showStormOverlay();
        }
    }
    
    if (stormActive) {
        stormTimer -= deltaTime;
        if (stormTimer <= 0) {
            stormActive = false;
        }
    }
    
    if (stormCooldown > 0) {
        stormCooldown -= deltaTime;
    }
    
    // Update fuel consumption with scaling
    if (isLightOn && fuel > 0) {
        const baseFuelDrain = 0.25;
        const fuelDrain = baseFuelDrain * upgrades.fuelEfficiencyMultiplier * difficultyScaling.getFuelConsumptionMultiplier(score);
        fuel -= fuelDrain;
        if (fuel <= 0) {
            fuel = 0;
            isLightOn = false;
            gameOver();
            return;
        }
        updateUI();
    }
    
    // Dynamic spawn rate based on score
    spawnRate = difficultyScaling.getSpawnRate(score);
    
    // Spawn ships
    if (gameTime - lastShipSpawn > spawnRate) {
        spawnShip();
        lastShipSpawn = gameTime;
    }
    
    // Update ships
    ships = ships.filter(ship => {
        const keepShip = ship.update(deltaTime);
        if (!keepShip && ship.crashed && !ship.saved) {
            // Small penalty for missed ships
            score = Math.max(0, score - 2);
            createCrashParticles(ship.x + ship.width/2, ship.y + ship.height/2);
            playSound('shipCrashed');
            updateUI();
        }
        return keepShip;
    });
    
    // Update particles
    particles = particles.filter(particle => particle.update());
    
    // Apply visual intensity based on score
    applyVisualIntensity();
}

function applyVisualIntensity() {
    const intensity = Math.min(score / 1000, 1); // 0 to 1 based on score
    
    if (canvas) {
        if (intensity > 0.7) {
            canvas.classList.add('extreme-intensity');
            canvas.classList.remove('high-intensity');
        } else if (intensity > 0.4) {
            canvas.classList.add('high-intensity');
            canvas.classList.remove('extreme-intensity');
        } else {
            canvas.classList.remove('high-intensity', 'extreme-intensity');
        }
    }
}

function showStormOverlay() {
    const overlay = document.getElementById('stormOverlay');
    if (overlay && gameState === 'playing') {
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }, 4000);
    }
}

function draw() {
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dynamic background based on difficulty
    const intensity = Math.min(score / 1000, 1);
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    if (intensity > 0.7) {
        // Extreme difficulty - stormy purples/reds
        gradient.addColorStop(0, '#2d1b69');
        gradient.addColorStop(0.7, '#4a1a3a');
        gradient.addColorStop(1, '#3a1a1a');
    } else if (intensity > 0.4) {
        // High difficulty - darker blues
        gradient.addColorStop(0, '#0a0a3e');
        gradient.addColorStop(0.7, '#26234e');
        gradient.addColorStop(1, '#2a1a4a');
    } else {
        // Normal - calm blues
        gradient.addColorStop(0, '#0a0a2e');
        gradient.addColorStop(0.7, '#16213e');
        gradient.addColorStop(1, '#1a1a3a');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Enhanced stars with intensity
    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + intensity * 0.2})`;
    const starCount = Math.floor(50 + intensity * 30);
    for (let i = 0; i < starCount; i++) {
        const x = (i * 47) % canvas.width;
        const y = (i * 23) % (canvas.height * 0.6);
        const size = Math.sin(gameTime * 0.001 + i) * 0.5 + 1 + intensity;
        ctx.fillRect(x, y, size, size);
    }
    
    if (gameState !== 'playing') return;
    
    // Enhanced water texture with more intensity
    const waveIntensity = 1 + intensity * 2;
    ctx.fillStyle = `rgba(0, 50, 100, ${0.3 + intensity * 0.2})`;
    for (let x = 0; x < canvas.width; x += 20) {
        const waveHeight = Math.sin((x + gameTime * 0.002) * 0.02) * 3 * waveIntensity;
        ctx.fillRect(x, canvas.height - 30 + waveHeight, 20, 30);
    }
    
    // Draw lighthouse beam with enhanced intensity
    if (isLightOn) {
        lighthouse.rotationAngle += 0.02;
        
        ctx.save();
        ctx.globalAlpha = 0.4 + intensity * 0.3;
        
        // Enhanced beam gradient
        const beamGradient = ctx.createRadialGradient(
            lighthouse.x, lighthouse.y, 0,
            lighthouse.x, lighthouse.y, lighthouse.lightDistance * upgrades.rangeMultiplier
        );
        beamGradient.addColorStop(0, `rgba(241, 196, 15, ${0.8 + intensity * 0.2})`);
        beamGradient.addColorStop(1, 'rgba(241, 196, 15, 0)');
        
        ctx.fillStyle = beamGradient;
        ctx.beginPath();
        ctx.moveTo(lighthouse.x, lighthouse.y);
        
        const range = lighthouse.lightDistance * upgrades.rangeMultiplier;
        const angle = lighthouse.lightAngle / 2;
        
        ctx.lineTo(
            lighthouse.x - range * Math.sin(angle),
            lighthouse.y - range * Math.cos(angle)
        );
        ctx.lineTo(
            lighthouse.x + range * Math.sin(angle),
            lighthouse.y - range * Math.cos(angle)
        );
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    // Draw ships
    ships.forEach(ship => ship.draw());
    
    // Draw particles with intensity
    particles.forEach(particle => particle.draw());
    
    // Draw enhanced lighthouse
    drawLighthouse(intensity);
    
    // Storm visual effect with more intensity
    if (stormActive) {
        ctx.save();
        ctx.globalAlpha = 0.1 + intensity * 0.1;
        ctx.fillStyle = '#ffffff';
        if (Math.random() < 0.1 + intensity * 0.05) { // More frequent lightning at high intensity
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.restore();
    }
}

function drawLighthouse(intensity = 0) {
    if (!ctx) return;
    
    const { x, y, width, height } = lighthouse;
    
    // Lighthouse base (darker bottom)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - width/2, y - height + height * 0.3, width, height * 0.3);
    
    // Main lighthouse body with intensity
    const bodyColor = isLightOn ? `rgba(255, 234, 167, ${1 - intensity * 0.3})` : '#DDD';
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x - width/2, y - height, width, height * 0.7);
    
    // Red and white stripes
    ctx.fillStyle = '#E74C3C';
    for (let i = 0; i < lighthouse.stripeCount; i++) {
        const stripeY = y - height + (i * height * 0.7) / lighthouse.stripeCount;
        const stripeHeight = (height * 0.7) / lighthouse.stripeCount / 2;
        ctx.fillRect(x - width/2, stripeY, width, stripeHeight);
    }
    
    // Lighthouse top (lantern room)
    ctx.fillStyle = '#34495E';
    ctx.fillRect(x - width/2 - 2, y - height - 8, width + 4, 12);
    
    // Light beacon with enhanced intensity
    if (isLightOn) {
        // Bright beacon
        ctx.fillStyle = '#F1C40F';
        ctx.beginPath();
        ctx.arc(x, y - height - 2, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Enhanced glow effect
        ctx.save();
        ctx.globalAlpha = 0.6 + intensity * 0.3;
        ctx.shadowColor = '#F1C40F';
        ctx.shadowBlur = 25 + intensity * 15;
        ctx.beginPath();
        ctx.arc(x, y - height - 2, 10 + intensity * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Rotating beacon light with intensity
        ctx.save();
        ctx.translate(x, y - height - 2);
        ctx.rotate(lighthouse.rotationAngle);
        ctx.fillStyle = `rgba(241, 196, 15, ${0.3 + intensity * 0.2})`;
        const beamSize = 15 + intensity * 10;
        ctx.fillRect(-2, -beamSize, 4, beamSize * 2);
        ctx.fillRect(-beamSize, -2, beamSize * 2, 4);
        ctx.restore();
    } else {
        // Dark beacon
        ctx.fillStyle = '#7F8C8D';
        ctx.beginPath();
        ctx.arc(x, y - height - 2, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Lighthouse door
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 4, y - 12, 8, 12);
    
    // Door handle
    ctx.fillStyle = '#F1C40F';
    ctx.fillRect(x + 2, y - 8, 1, 2);
}

// High score management
function loadHighScores() {
    try {
        const saved = localStorage.getItem('lastLightInfiniteScores');
        if (saved) {
            const savedScores = JSON.parse(saved);
            highScores = { ...highScores, ...savedScores };
        }
    } catch (e) {
        console.log('Local storage not available');
    }
}

function saveHighScores() {
    try {
        localStorage.setItem('lastLightInfiniteScores', JSON.stringify(highScores));
    } catch (e) {
        console.log('Could not save high scores');
    }
}

// Game loop
function gameLoop() {
    const currentTime = Date.now();
    const deltaTime = currentTime - (gameLoop.lastTime || currentTime);
    gameLoop.lastTime = currentTime;
    
    update(deltaTime);
    draw();
    
    requestAnimationFrame(gameLoop);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);
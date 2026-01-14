// ============================================
// BRAIN RACERS - SHAPE COLLECTOR GAME
// ============================================

// Game State
const gameState = {
    isRunning: false,
    score: 0,
    combo: 0,
    timeLeft: 30,
    power: 0,
    maxPower: 100,
    targetShape: 'triangle', // Current shape/word/pattern to collect (depends on mode)
    shapes: [], // Generic array for collectible items (shapes, words, patterns)
    character: null,
    lastFrameTime: 0,
    animationId: null,
    feedbackParticles: [], // FIX: Add feedback particles for visual effects
    gameMode: 'math', // Current game mode: 'math', 'english', 'aptitude'
    gameSubject: 'math', // Selected subject
    gameTopic: 'shapes', // Selected topic
    currentModeConfig: null, // Current mode configuration from gameModeMapping
    targetCategory: null // Target category for English mode (e.g., 'nouns', 'verbs')
};

// Game Configuration
const config = {
    // Timer settings - modify these to change game duration
    initialTime: 30, // seconds
    
    // Scoring settings - modify these to adjust scoring
    correctShapePoints: 10,
    wrongShapePenalty: 5,
    comboMultiplier: 1.5, // Each combo multiplies points by this
    
    // Power settings - modify these to adjust power meter
    correctShapePower: 10,
    wrongShapePowerLoss: 15,
    
    // Character settings - modify these to change character behavior
    characterSpeed: 2, // pixels per frame
    characterSize: 60,
    characterStartX: 50,
    
    // Shape settings - modify these to change shape spawning
    shapeSpawnRate: 0.02, // probability per frame (0-1)
    shapeSpeed: 3, // pixels per frame
    shapeSize: 50,
    minShapeDistance: 100, // minimum pixels between shapes
    
    // Shape types - add or modify shapes here
    shapeTypes: ['circle', 'triangle', 'square', 'rectangle']
};

// ============================================
// SUBJECT-TOPIC-GAMEPLAY MAPPING
// ============================================
// FIX: Mapping system that determines gameplay based on subject and topic
const gameModeMapping = {
    math: {
        '3d shapes': { mode: 'math', taskType: 'shapes', targetItems: ['cube', 'sphere', 'cylinder', 'pyramid'], taskText: 'Collect {item}' },
        'shapes': { mode: 'math', taskType: 'shapes', targetItems: ['triangle', 'square', 'circle', 'rectangle'], taskText: 'Collect {item}s' },
        'shape collector': { mode: 'math', taskType: 'shapes', targetItems: ['triangle', 'square', 'circle', 'rectangle'], taskText: 'Collect {item}s' },
        'fractions': { mode: 'math', taskType: 'shapes', targetItems: ['circle', 'square', 'triangle'], taskText: 'Collect {item}s' },
        '3 digit division': { mode: 'math', taskType: 'shapes', targetItems: ['triangle', 'square', 'circle'], taskText: 'Collect {item}s' }
    },
    english: {
        'vocabulary': { mode: 'english', taskType: 'words', targetItems: ['nouns', 'verbs', 'adjectives'], wordLists: {
            'nouns': ['dog', 'book', 'apple', 'house', 'tree', 'car'],
            'verbs': ['run', 'jump', 'read', 'write', 'play', 'sing'],
            'adjectives': ['happy', 'big', 'small', 'fast', 'slow', 'bright']
        }, taskText: 'Collect {item}' },
        'spelling': { mode: 'english', taskType: 'words', targetItems: ['correct', 'correct', 'correct'], wordLists: {
            'correct': ['cat', 'dog', 'bird', 'fish', 'tree', 'book'],
            'wrong': ['kat', 'dogg', 'berd', 'fich', 'tre', 'bok']
        }, taskText: 'Collect Correct Spellings' }
    },
    aptitude: {
        'logic puzzles': { mode: 'aptitude', taskType: 'patterns', targetItems: ['pattern1', 'pattern2'], taskText: 'Collect the Correct Pattern' },
        'patterns': { mode: 'aptitude', taskType: 'patterns', targetItems: ['sequence'], taskText: 'Collect the Next in Sequence' }
    }
};

// Canvas and Context
let canvas, ctx;

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    initializeGame();
});

// ============================================
// UI INITIALIZATION
// ============================================

function initializeUI() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => handleFilterClick(btn, 'category'));
    });
    
    // Grade buttons
    const gradeButtons = document.querySelectorAll('.grade-btn');
    gradeButtons.forEach(btn => {
        btn.addEventListener('click', () => handleFilterClick(btn, 'grade'));
    });
    
    // Card click handlers
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', () => handleCardClick(card));
    });
    
    // START button
    const startButton = document.getElementById('startButton');
    startButton.addEventListener('click', startGame);
    
    // Close game button
    const closeGameBtn = document.getElementById('closeGameBtn');
    closeGameBtn.addEventListener('click', stopGame);
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        if (title.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function handleFilterClick(btn, type) {
    if (type === 'category') {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const category = btn.dataset.category;
        filterCards('category', category);
    } else if (type === 'grade') {
        document.querySelectorAll('.grade-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const grade = btn.dataset.grade;
        filterCards('grade', grade);
    }
}

function filterCards(type, value) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        if (value === 'all') {
            card.style.display = 'block';
        } else {
            const cardValue = card.dataset[type];
            if (cardValue === value) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

function handleCardClick(card) {
    // FIX: Detect subject and topic from card to determine gameplay mode
    const title = card.querySelector('.card-title').textContent;
    const subject = card.dataset.category; // 'math', 'english', 'aptitude'
    const topic = title.toLowerCase().trim();
    
    // Check if this subject/topic combination exists in mapping
    if (gameModeMapping[subject] && gameModeMapping[subject][topic]) {
        gameState.gameSubject = subject;
        gameState.gameTopic = topic;
        gameState.currentModeConfig = gameModeMapping[subject][topic];
        gameState.gameMode = gameState.currentModeConfig.mode;
        startGame();
    } else if (title === 'Shape Collector' || subject === 'math') {
        // Fallback for Math cards (default to shapes)
        gameState.gameSubject = 'math';
        gameState.gameTopic = 'shape collector';
        gameState.currentModeConfig = gameModeMapping.math['shape collector'];
        gameState.gameMode = 'math';
        startGame();
    }
}

// ============================================
// GAME INITIALIZATION
// ============================================

function initializeGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // FIX: Attach click event listener after canvas is initialized
    canvas.addEventListener('click', handleCanvasClick);
    
    // Character initialization
    gameState.character = {
        x: config.characterStartX,
        y: canvas.height / 2,
        size: config.characterSize
    };
}

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth - 40;
    canvas.height = container.clientHeight - 200; // Account for header and power meter
}

// ============================================
// GAME CONTROL
// ============================================

function startGame() {
    // Show game overlay
    const gameOverlay = document.getElementById('gameOverlay');
    gameOverlay.classList.add('active');
    
    // Reset game state
    gameState.isRunning = true;
    gameState.score = 0;
    gameState.combo = 0;
    gameState.timeLeft = config.initialTime;
    gameState.power = 0;
    gameState.shapes = [];
    gameState.feedbackParticles = []; // FIX: Reset feedback particles
    gameState.character.x = config.characterStartX;
    gameState.character.y = canvas.height / 2;
    
    // Set random target shape
    setRandomTargetShape();
    
    // Update UI
    updateUI();
    
    // Start game loop
    gameState.lastFrameTime = performance.now();
    gameLoop();
    
    // Start timer
    startTimer();
}

function stopGame() {
    gameState.isRunning = false;
    
    // FIX: Clear timer interval when stopping the game
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
    }
    
    // Hide game overlay
    const gameOverlay = document.getElementById('gameOverlay');
    gameOverlay.classList.remove('active');
}

// FIX: Set target based on current game mode (subject-specific)
function setRandomTargetShape() {
    if (!gameState.currentModeConfig) {
        // Fallback to default Math mode
        const randomIndex = Math.floor(Math.random() * config.shapeTypes.length);
        gameState.targetShape = config.shapeTypes[randomIndex];
        updateTaskBanner();
        return;
    }
    
    const modeConfig = gameState.currentModeConfig;
    
    if (modeConfig.taskType === 'shapes') {
        // Math mode: select random shape
        const randomIndex = Math.floor(Math.random() * modeConfig.targetItems.length);
        gameState.targetShape = modeConfig.targetItems[randomIndex];
    } else if (modeConfig.taskType === 'words') {
        // English mode: select random word category or word
        if (modeConfig.wordLists) {
            const categories = Object.keys(modeConfig.wordLists);
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const wordList = modeConfig.wordLists[randomCategory];
            const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
            gameState.targetShape = randomWord; // Store word in targetShape for consistency
            gameState.targetCategory = randomCategory; // Store category separately
        }
    } else if (modeConfig.taskType === 'patterns') {
        // Aptitude mode: select pattern
        gameState.targetShape = modeConfig.targetItems[0];
    }
    
    updateTaskBanner();
}

function updateTaskBanner() {
    // FIX: Update task banner based on current game mode
    const taskBanner = document.getElementById('taskBanner');
    
    if (!gameState.currentModeConfig) {
        const shapeName = gameState.targetShape.charAt(0).toUpperCase() + gameState.targetShape.slice(1);
        taskBanner.textContent = `Collect ${shapeName}s`;
        return;
    }
    
    const modeConfig = gameState.currentModeConfig;
    
    if (modeConfig.taskType === 'shapes') {
        const shapeName = gameState.targetShape.charAt(0).toUpperCase() + gameState.targetShape.slice(1);
        taskBanner.textContent = `Collect ${shapeName}s`;
    } else if (modeConfig.taskType === 'words') {
        if (gameState.gameTopic === 'vocabulary' && gameState.targetCategory) {
            const categoryName = gameState.targetCategory.charAt(0).toUpperCase() + gameState.targetCategory.slice(1);
            taskBanner.textContent = `Collect ${categoryName}`;
        } else {
            taskBanner.textContent = modeConfig.taskText || 'Collect Words';
        }
    } else if (modeConfig.taskType === 'patterns') {
        taskBanner.textContent = modeConfig.taskText || 'Collect the Correct Pattern';
    }
}

// ============================================
// GAME LOOP
// ============================================

function gameLoop(currentTime) {
    if (!gameState.isRunning) return;
    
    const deltaTime = currentTime - gameState.lastFrameTime;
    gameState.lastFrameTime = currentTime;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update character position
    updateCharacter();
    
    // Spawn shapes
    spawnShapes();
    
    // Update shapes
    updateShapes();
    
    // FIX: Update feedback particles
    updateFeedbackParticles(currentTime);
    
    // Draw everything
    drawBackground();
    drawCharacter();
    drawShapes();
    drawFeedbackParticles(currentTime);
    
    // Continue loop
    gameState.animationId = requestAnimationFrame(gameLoop);
}

// ============================================
// CHARACTER
// ============================================

function updateCharacter() {
    // Move character from left to right
    gameState.character.x += config.characterSpeed;
    
    // Reset position when off screen
    if (gameState.character.x > canvas.width + gameState.character.size) {
        gameState.character.x = -gameState.character.size;
    }
    
    // Keep character centered vertically
    gameState.character.y = canvas.height / 2;
}

function drawCharacter() {
    ctx.save();
    
    // Draw character (simple representation)
    const char = gameState.character;
    
    // Body (circle)
    ctx.fillStyle = '#40e0d0';
    ctx.beginPath();
    ctx.arc(char.x, char.y, char.size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(char.x - 10, char.y - 10, 5, 0, Math.PI * 2);
    ctx.arc(char.x + 10, char.y - 10, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#40e0d0';
    ctx.strokeStyle = '#40e0d0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(char.x, char.y, char.size / 2, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
}

// ============================================
// SHAPES
// ============================================

// FIX: Spawn items based on current game mode (subject-specific)
function spawnShapes() {
    // Random chance to spawn an item
    if (Math.random() < config.shapeSpawnRate) {
        // Check minimum distance from existing items
        let canSpawn = true;
        const newX = canvas.width + config.shapeSize;
        const newY = Math.random() * (canvas.height - config.shapeSize * 2) + config.shapeSize;
        
        for (const shape of gameState.shapes) {
            const distance = Math.sqrt(
                Math.pow(shape.x - newX, 2) + Math.pow(shape.y - newY, 2)
            );
            if (distance < config.minShapeDistance) {
                canSpawn = false;
                break;
            }
        }
        
        if (canSpawn && gameState.currentModeConfig) {
            const modeConfig = gameState.currentModeConfig;
            let itemType, itemData;
            
            if (modeConfig.taskType === 'shapes') {
                // Math mode: spawn shapes
                const randomIndex = Math.floor(Math.random() * modeConfig.targetItems.length);
                itemType = modeConfig.targetItems[randomIndex];
                itemData = { type: 'shape', shapeType: itemType };
            } else if (modeConfig.taskType === 'words') {
                // English mode: spawn words (NO shapes)
                if (modeConfig.wordLists) {
                    // Spawn a mix of correct and wrong words
                    const allWords = [];
                    Object.values(modeConfig.wordLists).forEach(list => {
                        allWords.push(...list);
                    });
                    const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
                    itemType = randomWord;
                    itemData = { type: 'word', word: randomWord, isCorrect: false };
                    
                    // Determine if word is correct based on target
                    if (gameState.gameTopic === 'vocabulary') {
                        // Check if word belongs to target category
                        Object.keys(modeConfig.wordLists).forEach(category => {
                            if (modeConfig.wordLists[category].includes(randomWord) && category === gameState.targetCategory) {
                                itemData.isCorrect = true;
                            }
                        });
                    } else if (gameState.gameTopic === 'spelling') {
                        // Check if word is correctly spelled
                        itemData.isCorrect = modeConfig.wordLists['correct'] && modeConfig.wordLists['correct'].includes(randomWord);
                    }
                }
            } else if (modeConfig.taskType === 'patterns') {
                // Aptitude mode: spawn patterns (use shapes as placeholders for now)
                const randomIndex = Math.floor(Math.random() * config.shapeTypes.length);
                itemType = config.shapeTypes[randomIndex];
                itemData = { type: 'pattern', patternType: itemType };
            }
            
            // FIX: Add spawn animation properties
            gameState.shapes.push({
                x: newX,
                y: newY,
                type: itemType,
                size: config.shapeSize,
                speed: config.shapeSpeed,
                alpha: 0, // Start invisible for fade-in
                scale: 0.5, // Start small for scale-in
                spawnTime: performance.now(), // Track spawn time for animation
                itemData: itemData // Store mode-specific data
            });
        } else if (canSpawn) {
            // Fallback: default Math mode
            const randomIndex = Math.floor(Math.random() * config.shapeTypes.length);
            const shapeType = config.shapeTypes[randomIndex];
            gameState.shapes.push({
                x: newX,
                y: newY,
                type: shapeType,
                size: config.shapeSize,
                speed: config.shapeSpeed,
                alpha: 0,
                scale: 0.5,
                spawnTime: performance.now(),
                itemData: { type: 'shape', shapeType: shapeType }
            });
        }
    }
}

function updateShapes() {
    const currentTime = performance.now();
    
    for (let i = gameState.shapes.length - 1; i >= 0; i--) {
        const shape = gameState.shapes[i];
        
        // FIX: Update spawn animation (fade-in and scale-in over 300ms)
        const spawnAge = currentTime - shape.spawnTime;
        const spawnDuration = 300; // milliseconds
        if (spawnAge < spawnDuration) {
            const progress = Math.min(spawnAge / spawnDuration, 1);
            shape.alpha = progress; // Fade in
            shape.scale = 0.5 + (progress * 0.5); // Scale from 0.5 to 1.0
        } else {
            shape.alpha = 1;
            shape.scale = 1;
        }
        
        // Move shape from right to left
        shape.x -= shape.speed;
        
        // Remove shapes that are off screen
        if (shape.x + shape.size < 0) {
            gameState.shapes.splice(i, 1);
            continue;
        }
    }
}

// FIX: Draw items based on current game mode (subject-specific)
function drawShapes() {
    gameState.shapes.forEach(shape => {
        ctx.save();
        ctx.globalAlpha = shape.alpha;
        
        // FIX: Apply scale transformation for spawn animation
        ctx.translate(shape.x, shape.y);
        ctx.scale(shape.scale || 1, shape.scale || 1);
        ctx.translate(-shape.x, -shape.y);
        
        if (!gameState.currentModeConfig || !shape.itemData) {
            // Fallback: draw as shape
            const isTarget = shape.type === gameState.targetShape;
            ctx.fillStyle = isTarget ? '#40e0d0' : '#ff6b6b';
            ctx.strokeStyle = isTarget ? '#00ced1' : '#ff4757';
            ctx.lineWidth = 3;
            if (isTarget) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#40e0d0';
            }
            drawShapeByType(shape.type, shape.x, shape.y, shape.size);
        } else if (gameState.currentModeConfig.taskType === 'words') {
            // FIX: English mode - draw words instead of shapes
            const itemData = shape.itemData;
            const isCorrect = itemData.isCorrect || false;
            
            // Draw word as text
            ctx.fillStyle = isCorrect ? '#40e0d0' : '#ff6b6b';
            ctx.strokeStyle = isCorrect ? '#00ced1' : '#ff4757';
            ctx.font = `bold ${Math.floor(shape.size * 0.6)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 2;
            
            if (isCorrect) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#40e0d0';
            }
            
            // Draw text with outline for visibility
            ctx.strokeText(shape.type, shape.x, shape.y);
            ctx.fillText(shape.type, shape.x, shape.y);
            
        } else if (gameState.currentModeConfig.taskType === 'patterns') {
            // Aptitude mode - draw patterns (use shapes for now)
            const isTarget = shape.type === gameState.targetShape;
            ctx.fillStyle = isTarget ? '#40e0d0' : '#ff6b6b';
            ctx.strokeStyle = isTarget ? '#00ced1' : '#ff4757';
            ctx.lineWidth = 3;
            if (isTarget) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#40e0d0';
            }
            drawShapeByType(shape.type, shape.x, shape.y, shape.size);
        } else {
            // Math mode - draw shapes
            const isTarget = shape.type === gameState.targetShape;
            ctx.fillStyle = isTarget ? '#40e0d0' : '#ff6b6b';
            ctx.strokeStyle = isTarget ? '#00ced1' : '#ff4757';
            ctx.lineWidth = 3;
            if (isTarget) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#40e0d0';
            }
            drawShapeByType(shape.type, shape.x, shape.y, shape.size);
        }
        
        ctx.restore();
    });
}

// Helper function to draw shapes by type
function drawShapeByType(type, x, y, size) {
    switch (type) {
        case 'circle':
        case 'sphere':
            drawCircle(x, y, size / 2);
            break;
        case 'triangle':
        case 'pyramid':
            drawTriangle(x, y, size);
            break;
        case 'square':
        case 'cube':
            drawSquare(x, y, size);
            break;
        case 'rectangle':
        case 'cylinder':
            drawRectangle(x, y, size);
            break;
        default:
            // Default to circle if type unknown
            drawCircle(x, y, size / 2);
            break;
    }
}

function drawCircle(x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

function drawTriangle(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size / 2);
    ctx.lineTo(x - size / 2, y + size / 2);
    ctx.lineTo(x + size / 2, y + size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawSquare(x, y, size) {
    const halfSize = size / 2;
    ctx.fillRect(x - halfSize, y - halfSize, size, size);
    ctx.strokeRect(x - halfSize, y - halfSize, size, size);
}

function drawRectangle(x, y, size) {
    const width = size * 1.5;
    const height = size;
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
    ctx.strokeRect(x - width / 2, y - height / 2, width, height);
}

// ============================================
// CLICK HANDLING
// ============================================
// NOTE: Event listener is attached in initializeGame() after canvas is ready

function handleCanvasClick(e) {
    if (!gameState.isRunning) return;
    
    // FIX: Properly scale click coordinates to match canvas internal dimensions
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    
    // Check if click hit any shape
    for (let i = gameState.shapes.length - 1; i >= 0; i--) {
        const shape = gameState.shapes[i];
        
        if (isPointInShape(clickX, clickY, shape)) {
            handleShapeClick(shape);
            gameState.shapes.splice(i, 1);
            break;
        }
    }
}

// FIX: Hit detection for different item types (shapes, words, patterns)
function isPointInShape(x, y, shape) {
    const dx = x - shape.x;
    const dy = y - shape.y;
    const halfSize = shape.size / 2;
    
    // FIX: English mode - words use simple bounding box (text area)
    if (shape.itemData && shape.itemData.type === 'word') {
        // Words are displayed as text, use a simple rectangular hit area
        const textWidth = shape.size * 2; // Approximate text width
        return Math.abs(dx) < textWidth / 2 && Math.abs(dy) < halfSize;
    }
    
    // Math/Aptitude modes - shapes use geometric hit tests
    switch (shape.type) {
        case 'circle':
        case 'sphere':
            return Math.sqrt(dx * dx + dy * dy) <= halfSize;
        case 'triangle':
        case 'pyramid':
            // FIX: Proper triangle hit test - check if point is inside triangle
            // Triangle points: top (0, -halfSize), bottom-left (-halfSize, halfSize), bottom-right (halfSize, halfSize)
            const topY = -halfSize;
            const bottomY = halfSize;
            // Check if point is within vertical bounds
            if (dy < topY || dy > bottomY) return false;
            // Check if point is within the triangle's horizontal bounds (using line equations)
            const leftBound = -halfSize + (halfSize * (dy - topY)) / (bottomY - topY);
            const rightBound = halfSize - (halfSize * (dy - topY)) / (bottomY - topY);
            return dx >= leftBound && dx <= rightBound;
        case 'square':
        case 'cube':
            return Math.abs(dx) < halfSize && Math.abs(dy) < halfSize;
        case 'rectangle':
        case 'cylinder':
            const width = shape.size * 1.5;
            return Math.abs(dx) < width / 2 && Math.abs(dy) < halfSize;
        default:
            // Default: use circle hit test for unknown types
            return Math.sqrt(dx * dx + dy * dy) <= halfSize;
    }
}

// FIX: Validate clicks based on current game mode (subject-specific)
function handleShapeClick(shape) {
    let isCorrect = false;
    
    if (!gameState.currentModeConfig || !shape.itemData) {
        // Fallback: default shape validation
        isCorrect = shape.type === gameState.targetShape;
    } else if (gameState.currentModeConfig.taskType === 'words') {
        // FIX: English mode - validate words (NO shapes)
        isCorrect = shape.itemData.isCorrect || false;
    } else if (gameState.currentModeConfig.taskType === 'patterns') {
        // Aptitude mode - validate patterns
        isCorrect = shape.type === gameState.targetShape;
    } else {
        // Math mode - validate shapes
        isCorrect = shape.type === gameState.targetShape;
    }
    
    if (isCorrect) {
        // Correct item clicked
        gameState.combo++;
        const points = Math.floor(config.correctShapePoints * Math.pow(config.comboMultiplier, gameState.combo - 1));
        gameState.score += points;
        
        // Increase power
        gameState.power = Math.min(gameState.power + config.correctShapePower, config.maxPower);
        
        // Visual feedback
        showFeedback('+ ' + points, '#40e0d0', shape.x, shape.y);
    } else {
        // Wrong item clicked
        gameState.combo = 0;
        gameState.score = Math.max(0, gameState.score - config.wrongShapePenalty);
        
        // Decrease power
        gameState.power = Math.max(0, gameState.power - config.wrongShapePowerLoss);
        
        // Visual feedback
        showFeedback('- ' + config.wrongShapePenalty, '#ff6b6b', shape.x, shape.y);
    }
    
    updateUI();
}

function showFeedback(text, color, x, y) {
    // FIX: Enhanced visual feedback with animated particles
    const currentTime = performance.now();
    
    // Create feedback particle for animation
    gameState.feedbackParticles.push({
        x: x,
        y: y,
        text: text,
        color: color,
        alpha: 1,
        scale: 0.5,
        velocityY: -2,
        startTime: currentTime,
        duration: 1000 // 1 second animation
    });
}

// FIX: Update feedback particles for animations
function updateFeedbackParticles(currentTime) {
    for (let i = gameState.feedbackParticles.length - 1; i >= 0; i--) {
        const particle = gameState.feedbackParticles[i];
        const age = currentTime - particle.startTime;
        const progress = age / particle.duration;
        
        if (progress >= 1) {
            // Particle expired, remove it
            gameState.feedbackParticles.splice(i, 1);
            continue;
        }
        
        // Update particle position (float upward)
        particle.y += particle.velocityY;
        
        // Update particle animation (fade out and scale up)
        particle.alpha = 1 - progress;
        particle.scale = 0.5 + (progress * 1.5); // Scale from 0.5 to 2.0
    }
}

// FIX: Draw feedback particles
function drawFeedbackParticles(currentTime) {
    gameState.feedbackParticles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.font = `bold ${24 * particle.scale}px Arial`;
        ctx.fillStyle = particle.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add glow effect
        ctx.shadowBlur = 10 * particle.scale;
        ctx.shadowColor = particle.color;
        
        ctx.fillText(particle.text, particle.x, particle.y - 30);
        ctx.restore();
    });
}

// ============================================
// TIMER
// ============================================

let timerInterval = null;

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (!gameState.isRunning) {
            clearInterval(timerInterval);
            return;
        }
        
        gameState.timeLeft--;
        updateUI();
        
        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameState.isRunning = false;
    if (timerInterval) clearInterval(timerInterval);
    
    // Show game over message
    setTimeout(() => {
        alert(`Game Over!\nFinal Score: ${gameState.score}\nFinal Combo: ${gameState.combo}x`);
        stopGame();
    }, 100);
}

// ============================================
// UI UPDATES
// ============================================

function updateUI() {
    // Update score
    document.getElementById('scoreDisplay').textContent = gameState.score;
    
    // Update timer
    document.getElementById('timerDisplay').textContent = gameState.timeLeft;
    
    // Update combo
    document.getElementById('comboDisplay').textContent = gameState.combo + 'x';
    
    // Update power meter
    const powerPercentage = (gameState.power / config.maxPower) * 100;
    document.getElementById('powerMeterFill').style.width = powerPercentage + '%';
}

// ============================================
// BACKGROUND DRAWING
// ============================================

function drawBackground() {
    // Draw subtle grid or pattern
    ctx.strokeStyle = 'rgba(64, 224, 208, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Vertical lines
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
}



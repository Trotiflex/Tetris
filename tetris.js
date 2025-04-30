// Récupérer les canvas et contextes
const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextPieceCanvas');
const nextCtx = nextCanvas.getContext('2d');
const blockSize = 20;
const boardWidth = canvas.width / blockSize; // 12
const boardHeight = canvas.height / blockSize; // 20

// Grille du jeu (null = vide, couleur = occupé)
let board = Array(boardHeight).fill().map(() => Array(boardWidth).fill(null));

// Définir les tétriminos (formes et couleurs)
const tetrominoes = [
    { shape: [[1, 1, 1, 1]], color: '#39aebe' }, // I
    { shape: [[1, 1], [1, 1]], color: '#bcbe39' }, // O
    { shape: [[0, 1, 0], [1, 1, 1]], color: '#ae39be' }, // T
    { shape: [[0, 1, 1], [1, 1, 0]], color: '#63be39' }, // S
    { shape: [[1, 1, 0], [0, 1, 1]], color: '#be3939' }, // Z
    { shape: [[1, 0, 0], [1, 1, 1]], color: '#395cbe' }, // J
    { shape: [[0, 0, 1], [1, 1, 1]], color: '#be6a39' } // L
];

// Pièce actuelle et prochaine
let currentPiece = null;
let nextPiece = null;
let pieceX = 0;
let pieceY = 0;
let score = 0;
let isGameRunning = false;
let animationId;

// Créer une nouvelle pièce
function spawnPiece() {
    if (!nextPiece) {
        const index = Math.floor(Math.random() * tetrominoes.length);
        nextPiece = tetrominoes[index];
    }
    currentPiece = nextPiece;
    pieceX = Math.floor(boardWidth / 2) - Math.floor(currentPiece.shape[0].length / 2);
    pieceY = 0;
    const index = Math.floor(Math.random() * tetrominoes.length);
    nextPiece = tetrominoes[index];
}

// Vérifier les collisions
function checkCollision(dx, dy, shape = currentPiece.shape) {
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newX = pieceX + x + dx;
                const newY = pieceY + y + dy;
                if (
                    newX < 0 || newX >= boardWidth ||
                    newY >= boardHeight ||
                    (newY >= 0 && board[newY][newX])
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Fusionner la pièce avec la grille
function mergePiece() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                board[pieceY + y][pieceX + x] = currentPiece.color;
            }
        }
    }
    // Vérifier si la première ligne est occupée
    if (board[0].some(cell => cell !== null)) {
        gameOver();
    }
}

// Supprimer les lignes complètes
function clearLines() {
    let linesCleared = 0;
    for (let y = boardHeight - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== null)) {
            board.splice(y, 1);
            board.unshift(Array(boardWidth).fill(null));
            linesCleared++;
            y++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100;
    }
}

// Rotater la pièce
function rotatePiece() {
    const newShape = Array(currentPiece.shape[0].length).fill().map(() => []);
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            newShape[x][currentPiece.shape.length - 1 - y] = currentPiece.shape[y][x];
        }
    }
    if (!checkCollision(0, 0, newShape)) {
        currentPiece.shape = newShape;
    }
}

// Dessiner la grille et la pièce
function draw() {
    // Effacer le canvas principal
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dessiner la grille
    for (let y = 0; y < boardHeight; y++) {
        for (let x = 0; x < boardWidth; x++) {
            if (board[y][x]) {
                ctx.fillStyle = board[y][x];
                ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1);
            }
        }
    }

    // Dessiner la pièce actuelle
    if (currentPiece && isGameRunning) {
        ctx.fillStyle = currentPiece.color;
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    ctx.fillRect((pieceX + x) * blockSize, (pieceY + y) * blockSize, blockSize - 1, blockSize - 1);
                }
            }
        }
    }

    // Dessiner le score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 20);

    // Dessiner la prochaine pièce
    nextCtx.fillStyle = 'black';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        nextCtx.fillStyle = nextPiece.color;
        const offsetX = (nextCanvas.width - nextPiece.shape[0].length * blockSize) / 2;
        const offsetY = (nextCanvas.height - nextPiece.shape.length * blockSize) / 2;
        for (let y = 0; y < nextPiece.shape.length; y++) {
            for (let x = 0; x < nextPiece.shape[y].length; x++) {
                if (nextPiece.shape[y][x]) {
                    nextCtx.fillRect(offsetX + x * blockSize, offsetY + y * blockSize, blockSize - 1, blockSize - 1);
                }
            }
        }
    }
}

// Mettre à jour le jeu
function update() {
    if (!isGameRunning) return;
    if (!currentPiece) {
        spawnPiece();
    }
    if (!checkCollision(0, 1)) {
        pieceY++;
    } else {
        mergePiece();
        clearLines();
        if (isGameRunning) {
            spawnPiece();
        }
    }
}

// Gérer les contrôles
document.addEventListener('keydown', (e) => {
    if (!currentPiece || !isGameRunning) return;
    if (e.key === 'ArrowLeft' && !checkCollision(-1, 0)) {
        pieceX--;
    } else if (e.key === 'ArrowRight' && !checkCollision(1, 0)) {
        pieceX++;
    } else if (e.key === 'ArrowDown' && !checkCollision(0, 1)) {
        pieceY++;
    } else if (e.key === 'ArrowUp') {
        rotatePiece();
    } else if (e.key === ' ') {
        while (!checkCollision(0, 1)) {
            pieceY++;
        }
        mergePiece();
        clearLines();
        if (isGameRunning) {
            spawnPiece();
        }
    }
});

// Gérer le bouton Commencer
document.getElementById('startButton').addEventListener('click', () => {
    if (!isGameRunning) {
        isGameRunning = true;
        board = Array(boardHeight).fill().map(() => Array(boardWidth).fill(null));
        score = 0;
        currentPiece = null;
        nextPiece = null;
        spawnPiece();
        document.getElementById('gameOverScreen').style.display = 'none';
        gameLoop();
    }
});

// Gérer le bouton Recommencer
document.getElementById('restartButton').addEventListener('click', () => {
    isGameRunning = true;
    board = Array(boardHeight).fill().map(() => Array(boardWidth).fill(null));
    score = 0;
    currentPiece = null;
    nextPiece = null;
    spawnPiece();
    document.getElementById('gameOverScreen').style.display = 'none';
    gameLoop();
});

// Fin du jeu
function gameOver() {
    isGameRunning = false;
    cancelAnimationFrame(animationId);
    const gameOverScreen = document.getElementById('gameOverScreen');
    document.getElementById('finalScore').textContent = `Score : ${score}`;
    gameOverScreen.style.display = 'block';
}

// Boucle principale
let lastTime = 0;
let dropCounter = 0;
const dropInterval = 1000; // 1 seconde

function gameLoop(time = 0) {
    if (!isGameRunning) return;
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        update();
        dropCounter = 0;
    }
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// Dessiner l'écran initial
draw();
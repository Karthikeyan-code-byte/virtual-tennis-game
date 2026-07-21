const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Variables
let gameRunning = false;
let playerScore = 0;
let opponentScore = 0;
let rallyStopped = true;
let lastHitter = 'none'; // Track who hit the ball last

// Player Paddle (Racket)
const paddle = {
    x: canvas.width / 2 - 60,
    y: canvas.height - 80,
    width: 120,
    height: 20,
    speed: 10,
    dx: 0
};

// Opponent Paddle (Racket)
const opponent = {
    x: canvas.width / 2 - 60,
    y: 60,
    width: 120,
    height: 20,
    speed: 6,
    dx: 0
};

// Ball with realistic physics
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    dx: 0,
    dy: 0,
    speed: 0,
    maxSpeed: 12,
    friction: 0.98,
    gravity: 0.3
};

// Keyboard controls
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && gameRunning) {
        e.preventDefault();
        hitBall();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Button controls
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('resetBtn').addEventListener('click', resetGame);

function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        rallyStopped = true;
        document.getElementById('gameStatus').textContent = 'Match Started! Opponent is serving...';
        document.getElementById('startBtn').disabled = true;
        serveBall();
        gameLoop();
    }
}

function resetGame() {
    gameRunning = false;
    rallyStopped = true;
    playerScore = 0;
    opponentScore = 0;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 0;
    ball.dy = 0;
    paddle.x = canvas.width / 2 - 60;
    opponent.x = canvas.width / 2 - 60;
    document.getElementById('playerScore').textContent = '0';
    document.getElementById('opponentScore').textContent = '0';
    document.getElementById('gameStatus').textContent = 'Ready to serve!';
    document.getElementById('startBtn').disabled = false;
    draw();
}

function serveBall() {
    // Opponent serves the ball
    ball.x = canvas.width / 2 + (Math.random() - 0.5) * 100;
    ball.y = 100;
    ball.dx = (Math.random() - 0.5) * 8;
    ball.dy = 8; // Coming towards player
    lastHitter = 'opponent';
    rallyStopped = false;
}

function hitBall() {
    // Check if ball is near player paddle and coming down
    if (Math.abs(ball.y - paddle.y) < 50 && 
        ball.x > paddle.x - 20 && 
        ball.x < paddle.x + paddle.width + 20 &&
        ball.dy > 0 &&
        lastHitter === 'opponent') {
        
        // Calculate hit position for spin
        const hitPos = (ball.x - paddle.x) / paddle.width;
        
        // Ball direction based on where it hits the paddle
        ball.dx = (hitPos - 0.5) * 14;
        ball.dy = -Math.abs(ball.dy) - 2; // Reverse and increase speed
        
        // Add velocity
        const hitSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        const maxHitSpeed = 11;
        if (hitSpeed > maxHitSpeed) {
            ball.dx = (ball.dx / hitSpeed) * maxHitSpeed;
            ball.dy = (ball.dy / hitSpeed) * maxHitSpeed;
        }
        
        playerScore += 10;
        lastHitter = 'player';
        document.getElementById('playerScore').textContent = playerScore;
        document.getElementById('gameStatus').textContent = `Great Shot! +10 points (Total: ${playerScore})`;
        
        checkWin();
    }
}

function updatePaddles() {
    // Player controls
    if (keys['ArrowLeft'] && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
    if (keys['ArrowRight'] && paddle.x + paddle.width < canvas.width) {
        paddle.x += paddle.speed;
    }

    // Opponent AI with improved tracking
    const opponentCenter = opponent.x + opponent.width / 2;
    
    if (ball.y > 50 && ball.y < canvas.height / 2 - 50 && !rallyStopped) {
        // Opponent tracks the ball intelligently
        const ballCenter = ball.x;
        const distance = ballCenter - opponentCenter;
        
        if (Math.abs(distance) > 30) {
            if (distance > 0 && opponent.x + opponent.width < canvas.width) {
                opponent.x += opponent.speed;
            } else if (distance < 0 && opponent.x > 0) {
                opponent.x -= opponent.speed;
            }
        }
        
        // Opponent tries to hit the ball
        if (Math.abs(ball.y - opponent.y) < 50 && 
            ball.x > opponent.x - 20 && 
            ball.x < opponent.x + opponent.width + 20 &&
            ball.dy < 0 &&
            lastHitter === 'player') {
            
            const hitPos = (ball.x - opponent.x) / opponent.width;
            ball.dx = (hitPos - 0.5) * 14;
            ball.dy = Math.abs(ball.dy) + 2;
            
            const hitSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            const maxHitSpeed = 11;
            if (hitSpeed > maxHitSpeed) {
                ball.dx = (ball.dx / hitSpeed) * maxHitSpeed;
                ball.dy = (ball.dy / hitSpeed) * maxHitSpeed;
            }
            
            opponentScore += 10;
            lastHitter = 'opponent';
            document.getElementById('opponentScore').textContent = opponentScore;
            document.getElementById('gameStatus').textContent = `Opponent Hit! +10 points (Total: ${opponentScore})`;
            checkWin();
        }
    }

    // Keep opponent in bounds
    if (opponent.x < 0) opponent.x = 0;
    if (opponent.x + opponent.width > canvas.width) {
        opponent.x = canvas.width - opponent.width;
    }
}

function updateBall() {
    // Apply gravity
    ball.dy += ball.gravity;
    
    // Apply friction
    ball.dx *= ball.friction;
    ball.dy *= ball.friction;

    // Update position
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with walls (left and right)
    if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.dx = -ball.dx * 0.8;
    } else if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.dx = -ball.dx * 0.8;
    }

    // Ball out of bounds (top) - player wins point
    if (ball.y - ball.radius < 0) {
        playerScore += 10;
        document.getElementById('playerScore').textContent = playerScore;
        document.getElementById('gameStatus').textContent = '🎾 Opponent missed! +10 points!';
        checkWin();
        rallyStopped = true;
        setTimeout(serveBall, 1500);
    }

    // Ball out of bounds (bottom) - opponent wins point
    if (ball.y + ball.radius > canvas.height) {
        opponentScore += 10;
        document.getElementById('opponentScore').textContent = opponentScore;
        document.getElementById('gameStatus').textContent = '😅 You missed! Opponent +10 points!';
        checkWin();
        rallyStopped = true;
        setTimeout(serveBall, 1500);
    }
}

function checkWin() {
    if (playerScore >= 100) {
        gameRunning = false;
        rallyStopped = true;
        document.getElementById('gameStatus').textContent = '🏆 🎉 YOU WON! CHAMPION! 🎉';
        document.getElementById('startBtn').disabled = false;
    } else if (opponentScore >= 100) {
        gameRunning = false;
        rallyStopped = true;
        document.getElementById('gameStatus').textContent = '😔 Opponent Won! Better luck next time!';
        document.getElementById('startBtn').disabled = false;
    }
}

function drawStadium() {
    // Sky gradient (background)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.3);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.3);

    // Stands background (top)
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, canvas.width, 50);
    
    // Draw spectators (simplified)
    ctx.fillStyle = '#FF6B6B';
    for (let i = 0; i < canvas.width; i += 30) {
        ctx.fillRect(i, 10, 20, 20);
    }

    // Stadium floor
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, canvas.height * 0.3, canvas.width, canvas.height * 0.7);

    // Court lines - outer boundary
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeRect(60, canvas.height * 0.3, canvas.width - 120, canvas.height * 0.7 - 40);

    // Service boxes (both sides)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    const boxWidth = (canvas.width - 120) / 3;
    const boxHeight = (canvas.height * 0.7 - 40) / 4;
    ctx.strokeRect(60 + boxWidth, canvas.height * 0.3, boxWidth, boxHeight * 2);
    ctx.strokeRect(60 + boxWidth, canvas.height * 0.3 + boxHeight * 2, boxWidth, boxHeight * 2);

    // Center court line (Net)
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Net mesh pattern
    ctx.strokeStyle = '#A0826D';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, canvas.height / 2 - 8);
        ctx.lineTo(i, canvas.height / 2 + 8);
        ctx.stroke();
    }

    // Stands background (bottom)
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    ctx.fillStyle = '#4ECDC4';
    for (let i = 0; i < canvas.width; i += 30) {
        ctx.fillRect(i, canvas.height - 40, 20, 20);
    }
}

function drawPaddles() {
    // Player paddle (racket)
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.strokeStyle = '#CC0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = '#FF8A8A';
    ctx.fillRect(paddle.x + 10, paddle.y + 3, paddle.width - 20, paddle.height - 6);

    // Opponent paddle (racket)
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(opponent.x, opponent.y, opponent.width, opponent.height);
    ctx.strokeStyle = '#1A9B8E';
    ctx.lineWidth = 3;
    ctx.strokeRect(opponent.x, opponent.y, opponent.width, opponent.height);
    ctx.fillStyle = '#7FE5DC';
    ctx.fillRect(opponent.x + 10, opponent.y + 3, opponent.width - 20, opponent.height - 6);
}

function drawBall() {
    // Ball glow effect
    const glowGradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius * 2.5);
    glowGradient.addColorStop(0, 'rgba(255, 255, 0, 0.4)');
    glowGradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.1)');
    glowGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Tennis ball (yellow/green)
    const ballGradient = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 0, ball.x, ball.y, ball.radius);
    ballGradient.addColorStop(0, '#FFFF99');
    ballGradient.addColorStop(1, '#CCFF00');
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Tennis ball pattern (curves)
    ctx.strokeStyle = '#AACCCC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius - 2, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius - 2, Math.PI, 0);
    ctx.stroke();
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw elements
    drawStadium();
    drawPaddles();
    drawBall();
}

function gameLoop() {
    if (gameRunning && !rallyStopped) {
        updatePaddles();
        updateBall();
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

// Initial draw
draw();

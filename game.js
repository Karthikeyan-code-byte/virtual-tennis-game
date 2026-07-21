const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Variables
let gameRunning = false;
let playerScore = 0;
let opponentScore = 0;

// Player Paddle
const paddle = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    width: 100,
    height: 15,
    speed: 8,
    dx: 0
};

// Opponent Paddle
const opponent = {
    x: canvas.width / 2 - 50,
    y: 20,
    width: 100,
    height: 15,
    speed: 5,
    dx: 0
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 8,
    dx: 5,
    dy: -5,
    speed: 5
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
        document.getElementById('gameStatus').textContent = 'Game Started! Hit the ball!';
        document.getElementById('startBtn').disabled = true;
        gameLoop();
    }
}

function resetGame() {
    gameRunning = false;
    playerScore = 0;
    opponentScore = 0;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 5;
    ball.dy = -5;
    paddle.x = canvas.width / 2 - 50;
    opponent.x = canvas.width / 2 - 50;
    document.getElementById('playerScore').textContent = '0';
    document.getElementById('opponentScore').textContent = '0';
    document.getElementById('gameStatus').textContent = 'Ready to serve!';
    document.getElementById('startBtn').disabled = false;
    draw();
}

function hitBall() {
    // Check if ball is near player paddle
    if (Math.abs(ball.y - paddle.y) < 30 && 
        ball.x > paddle.x && 
        ball.x < paddle.x + paddle.width &&
        ball.dy > 0) {
        
        ball.dy = -ball.dy;
        ball.dy -= 1; // Increase speed
        
        // Add spin based on paddle position
        const hitPos = (ball.x - paddle.x) / paddle.width;
        ball.dx = (hitPos - 0.5) * 10;
        
        playerScore += 10;
        document.getElementById('playerScore').textContent = playerScore;
        document.getElementById('gameStatus').textContent = `Player Hit! +10 points (Total: ${playerScore})`;
        
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

    // Opponent AI
    const opponentCenter = opponent.x + opponent.width / 2;
    if (ball.y < 200) { // Only move when ball is coming
        if (opponentCenter < ball.x - 35) {
            opponent.x += opponent.speed;
        } else if (opponentCenter > ball.x + 35) {
            opponent.x -= opponent.speed;
        }
    }

    // Keep opponent in bounds
    if (opponent.x < 0) opponent.x = 0;
    if (opponent.x + opponent.width > canvas.width) {
        opponent.x = canvas.width - opponent.width;
    }
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with walls (left and right)
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.dx = -ball.dx;
        ball.x = ball.x - ball.radius < 0 ? ball.radius : canvas.width - ball.radius;
    }

    // Ball collision with opponent paddle
    if (ball.dy < 0 &&
        ball.x > opponent.x &&
        ball.x < opponent.x + opponent.width &&
        ball.y - ball.radius < opponent.y + opponent.height) {
        
        ball.dy = -ball.dy;
        ball.y = opponent.y + opponent.height + ball.radius;
        opponentScore += 10;
        document.getElementById('opponentScore').textContent = opponentScore;
        document.getElementById('gameStatus').textContent = `Opponent Hit! +10 points (Total: ${opponentScore})`;
        checkWin();
    }

    // Ball collision with player paddle
    if (ball.dy > 0 &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width &&
        ball.y + ball.radius > paddle.y) {
        
        ball.dy = -ball.dy;
        ball.y = paddle.y - ball.radius;
    }

    // Ball out of bounds (top)
    if (ball.y - ball.radius < 0) {
        playerScore += 10;
        document.getElementById('playerScore').textContent = playerScore;
        resetBall();
        document.getElementById('gameStatus').textContent = 'Point! Ball out of bounds!';
        checkWin();
    }

    // Ball out of bounds (bottom)
    if (ball.y + ball.radius > canvas.height) {
        opponentScore += 10;
        document.getElementById('opponentScore').textContent = opponentScore;
        resetBall();
        document.getElementById('gameStatus').textContent = 'Opponent Point! Ball out of bounds!';
        checkWin();
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() - 0.5) * 6;
    ball.dy = -5;
}

function checkWin() {
    if (playerScore >= 100) {
        gameRunning = false;
        document.getElementById('gameStatus').textContent = '🏆 You Won! Congratulations!';
        document.getElementById('startBtn').disabled = false;
    } else if (opponentScore >= 100) {
        gameRunning = false;
        document.getElementById('gameStatus').textContent = '😔 Opponent Won! Try Again!';
        document.getElementById('startBtn').disabled = false;
    }
}

function drawCourt() {
    // Court background
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Court lines
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;

    // Center line
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Service boxes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 4);
    ctx.strokeRect(canvas.width / 4, canvas.height - canvas.height / 4 - canvas.height / 4, canvas.width / 2, canvas.height / 4);

    // Net
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Net mesh pattern
    ctx.strokeStyle = '#A0826D';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 15) {
        ctx.beginPath();
        ctx.moveTo(i, canvas.height / 2 - 5);
        ctx.lineTo(i, canvas.height / 2 + 5);
        ctx.stroke();
    }
}

function drawPaddles() {
    // Player paddle
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.strokeStyle = '#CC0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Opponent paddle
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(opponent.x, opponent.y, opponent.width, opponent.height);
    ctx.strokeStyle = '#1A9B8E';
    ctx.lineWidth = 2;
    ctx.strokeRect(opponent.x, opponent.y, opponent.width, opponent.height);
}

function drawBall() {
    // Ball glow
    const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius * 2);
    gradient.addColorStop(0, 'rgba(255, 200, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Ball
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ball curve pattern
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius - 2, 0, Math.PI);
    ctx.stroke();
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw elements
    drawCourt();
    drawPaddles();
    drawBall();
}

function gameLoop() {
    if (gameRunning) {
        updatePaddles();
        updateBall();
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

// Initial draw
draw();
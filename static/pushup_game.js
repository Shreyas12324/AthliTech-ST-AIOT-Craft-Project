let ballX, ballY;
let targetY;
let velocity = 0;
let velocityDamping = 0.69;  
let speedScaling = 0.05;
let gyroThreshold = 15;
let width = 1000, height = 800;
let ballRadius = 20;
let scrollSpeed = 1.4;
let amplitude = 200;
let frequency = 0.01;
let offset = 0;
let stars = [];
let positionBuffer = [];
const BUFFER_SIZE = 2;  // Buffer for smoothing
let startTime;

// Score tracking
let score = 0;
let hitBottom = false;

// MLC Prediction (Global Variable)
let mlcPrediction = 0x00; // Default to Bad Form

// Constraints for ball movement
const UPPER_BOUND = 180;
const LOWER_BOUND = height - ballRadius - 210;

function setup() {
    createCanvas(width, height);
    ballX = width / 2;
    ballY = LOWER_BOUND;
    targetY = ballY;
    startTime = millis();

    // Generate stars
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: random(width),
            y: random(height),
            size: random(1, 3),
            brightness: random(180, 255)
        });
    }

    setInterval(fetchSensorData, 100); // Fetch data every 100ms
}

function draw() {
    background(30);
    drawStars();
    drawSineWave(offset);
    
    drawScore();
    drawMLCPrediction();

    offset += scrollSpeed;

    // Apply velocity damping
    velocity *= velocityDamping;

    // Move ball towards target smoothly
    if (ballY < targetY) {
        ballY += velocity;
    } else if (ballY > targetY) {
        ballY -= velocity;
    }

    // Ball Constraint Logic (Tracks consecutive hits)
    if (ballY >= LOWER_BOUND) {
        hitBottom = true; 
    }

    if (ballY <= UPPER_BOUND && hitBottom) {
        score++;        
        hitBottom = false; 
    }

    // Keep ball within bounds
    ballY = constrain(ballY, UPPER_BOUND, LOWER_BOUND);

    // Draw the ball
    fill(255);
    noStroke();
    ellipse(ballX, ballY, ballRadius * 2);
}

function drawScore() {
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text(`Score: ${score}`, width / 2, 50);
}

function drawMLCPrediction() {
    fill(30,144,255);
    textSize(24);
    textAlign(CENTER, CENTER);

    // ✅ MLC Mapping for Push-Up
    let mlcMap = {
        0x00: "❌ Bad Form - Correct your position",
        0x04: "⏸️ Standby - Ready to start",
        0x08: "✅ Good Form - Keep going!"
    };

    // ✅ Ensure mlcPrediction is a valid number
    let mlcValue = Number(mlcPrediction);
    let displayPrediction = mlcMap[mlcValue] || "⏳ Waiting...";

    text(`MLC Prediction: ${displayPrediction}`, width / 2, 90);
}

function drawStars() {
    for (let star of stars) {
        fill(random(100, 255));
        noStroke();
        ellipse(star.x, star.y, star.size);
    }
}

function drawSineWave(offset) {
    let baseY = height / 2 - 200;

    for (let x = 0; x < width; x += 5) {
        let sineValue = sin(frequency * 0.5 * (x + offset));

        // Flatten negative sine values
        if (sineValue < 0) {
            sineValue = 0;
        } else {
            sineValue *= amplitude * 2;
        }

        let y = baseY + sineValue;

        fill(30,144,255);
        ellipse(x, y, 30);
    }
}

async function fetchSensorData() {
    try {
        let response = await fetch("http://127.0.0.1:9000/sensor-data");
        let data = await response.json();

        let accelY = data.accel.y;
        let accelZ = data.accel.z;
        let gyroX = data.gyro.x;
        let gyroY = data.gyro.y;
        let gyroZ = data.gyro.z;

        // ✅ Stop movement if accelZ > -150
        if (accelZ > -150) return;

        // ✅ Corrected MLC Prediction Key
        mlcPrediction = parseInt(data.mlc_prediction, 10);  

        let gyroMovement = abs(gyroX) + abs(gyroY) + abs(gyroZ);

        // ✅ Apply correct mapping for Push-Up (Z = -150 → -970, Y = -930 → 100)
        let mappedPos = constrain((accelZ + 150) / (970 - 150), 0, 1);
        let smoothedPos = height - (mappedPos * (height - ballRadius));

        // ✅ Smoothing Buffer
        positionBuffer.push(smoothedPos);
        if (positionBuffer.length > BUFFER_SIZE) {
            positionBuffer.shift();
        }
        targetY = positionBuffer.reduce((a, b) => a + b, 0) / positionBuffer.length;

        // ✅ Adjust velocity based on gyro
        if (gyroMovement > gyroThreshold) {
            velocity += speedScaling * gyroMovement;
        }
    } catch (error) {
        console.error("Error fetching sensor data:", error);
    }
}
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
const BUFFER_SIZE = 2; // For smoothing
let startTime;

// Score tracking
let score = 0;
let hitBottom = false; // Tracks if the ball has hit the bottom

// MLC Prediction (Global Variable)
let mlcPrediction = "⏳ Waiting...";
let rawMLC = 0x00; // Store raw MLC value

// Constraints for ball movement
const UPPER_BOUND = 180;
const LOWER_BOUND = height - ballRadius - 210;

// ✅ MLC Mapping (Each game.js can define its own)
const mlcMapping = {
    
    0x00: "⏳ Standby",
    0x04: "⚠️ Bad Form",
    0x08: "Ready!",
    0x0C: "✅ Good Form"
    
};

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
    
    drawScore(); // Display score
    drawMLCPrediction(); // Display MLC prediction

    offset += scrollSpeed;

    // Apply velocity damping
    velocity *= velocityDamping;

    // Move the ball towards the target smoothly
    if (ballY < targetY) {
        ballY += velocity;
    } else if (ballY > targetY) {
        ballY -= velocity;
    }

    // Ball Constraint Logic (Tracks consecutive hits)
    if (ballY >= LOWER_BOUND) {
        hitBottom = true; // Mark bottom as hit when ball reaches it
    }

    if (ballY <= UPPER_BOUND && hitBottom) {
        score++;         // Increase score only when hitting top AFTER bottom
        hitBottom = false; // Reset bottom hit flag for next cycle
    }

    // Keep the ball within bounds
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
    text(`Score: ${score}`, width / 2, 50); // Display score at the top
}

function drawMLCPrediction() {
    fill(30,144,255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text(`MLC Prediction: ${mlcMapping[rawMLC] || "⏳ Waiting..."}`, width / 2, 90); // Display MLC prediction below the score
}

function drawStars() {
    for (let star of stars) {
        fill(random(100, 255));
        noStroke();
        ellipse(star.x, star.y, star.size);
    }
}
function drawSineWave(offset) {
    let baseY = height / 2  -200; // Keep the original center position

    for (let x = 0; x < width; x += 5) {
        let sineValue = sin(frequency *0.5 * (x + offset));

        // If sineValue is in (π to 2π) range, flatten it at the base
        if (sineValue < 0) {
            sineValue = 0; // Flatten negative values
        } else {
            sineValue *= amplitude*2; // Scale positive values
        }

        let y = baseY + sineValue; // Keep original Y calculation

        fill(30,144,255);
        ellipse(x, y, 30); // Keep the wave in the same style
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

        // ✅ Store raw MLC code and map it dynamically
        rawMLC = data.mlc_prediction || 0x00; 
        mlcPrediction = mlcMapping[rawMLC] || "⏳ Waiting...";

        let gyroMovement = abs(gyroX) + abs(gyroY) + abs(gyroZ);

        // ✅ Mapping accelY (20 → 750) and accelZ (980 → 640) correctly
        let mappedPosY = map(accelY, 20, 750, LOWER_BOUND, UPPER_BOUND);
        let mappedPosZ = map(accelZ, 980, 640, LOWER_BOUND, UPPER_BOUND);
        
        // ✅ Averaging mapped Y and Z for stable motion
        let smoothedPos = (mappedPosY + mappedPosZ) / 2;

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
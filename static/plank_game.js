let width = 1000, height = 800;
let stars = [];
let mlcPrediction = 4; // Default: Bad Form
let plankHoldTime = 0;
let isTimerRunning = false; // Timer state
let startTime = 0;

function setup() {
    createCanvas(width, height);
    
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
    drawMLCPrediction();
    drawPlankTimer();
}

function drawMLCPrediction() {
    fill(30,144,255);
    textSize(43);
    textAlign(CENTER, CENTER);

    let mlcMap = {
        0: "✅ Good Form - Keep going!",
        4: "❌ Bad Form - Adjust your posture"
    };

    let displayPrediction = mlcMap[mlcPrediction] || "⏳ Waiting...";
    text(`MLC Prediction: ${displayPrediction}`, width / 2, 250);
}

function drawPlankTimer() {
    fill(255);
    textSize(62);
    textAlign(CENTER, CENTER);
    
    if (isTimerRunning) {
        plankHoldTime = (millis() - startTime) / 1000; // Time in seconds
    }
    
    text(`Hold Time: ${plankHoldTime.toFixed(2)}s`, width / 2, 400);
    textSize(32);
    text("Press SPACE to Start/Stop", width / 2, 500);
}

function drawStars() {
    for (let star of stars) {
        fill(random(100, 255));
        noStroke();
        ellipse(star.x, star.y, star.size);
    }
}

async function fetchSensorData() {
    try {
        let response = await fetch("http://127.0.0.1:9000/sensor-data");
        let data = await response.json();

        mlcPrediction = parseInt(data.mlc_prediction, 10);
    } catch (error) {
        console.error("Error fetching sensor data:", error);
    }
}

function keyPressed() {
    if (key === ' ') { // Spacebar to Start/Stop Timer
        if (!isTimerRunning) {
            startTime = millis();
            plankHoldTime = 0;
            isTimerRunning = true;
        } else {
            isTimerRunning = false;
        }
    }
}
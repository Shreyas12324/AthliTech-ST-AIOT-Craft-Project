import asyncio
import struct
import threading
import os
from flask import Flask, jsonify, send_from_directory
from bleak import BleakScanner, BleakClient
from flask_cors import CORS  # Enables cross-origin requests

# 🔹 Flask App Setup
app = Flask(__name__, static_folder="static")
CORS(app)  # Allows frontend apps to fetch data

# 🔹 SensorTile Box Pro BLE Configuration
SENSOR_NAME = "Daman24"

# 🔹 UUIDs
# MLC_UUID = "0000001b-0002-11e1-ac36-0002a5d5c51b"   
# FUSION_UUID = "0000000f-0002-11e1-ac36-0002a5d5c51b" 
FUSION_UUID="00c00000-0001-11e1-ac36-0002a5d5c51b"
MLC_UUID="0000000f-0002-11e1-ac36-0002a5d5c51b"

# 🔹 Global variable to store latest sensor & MLC data

# 🔹 Global variable to store latest sensor & MLC data
sensor_data = {
    "timestamp": None,
    "accel": {"x": 0, "y": 0, "z": 0},
    "gyro": {"x": 0, "y": 0, "z": 0},
    "mlc_prediction": "⏳ Waiting..."
}

def parse_sensor_fusion_data(uuid, data):
    """Updates global variable with raw sensor fusion data."""
    global sensor_data
    try:
        if len(data) >= 14:
            timestamp, ax, ay, az, gx, gy, gz = struct.unpack("<Hhhhhhh", data[:14])

            sensor_data["timestamp"] = timestamp
            sensor_data["accel"] = {"x": ax, "y": ay, "z": az}
            sensor_data["gyro"] = {"x": gx, "y": gy, "z": gz}

            print(f"\n📡 Sensor Data Updated (Timestamp: {timestamp}):")
            print(f"  🏋️ Accel → X: {ax}, Y: {ay}, Z: {az}")
            print(f"  🔄 Gyro → X: {gx}, Y: {gy}, Z: {gz}")
            print("-" * 40)
    except Exception as e:
        print(f"⚠️ Error parsing {uuid}: {e}")

async def notification_handler(sender, data):
    """Handles MLC classification results."""
    global sensor_data
    try:
        if len(data) == 7:  # MLC output is expected to be 7 bytes
            counter = struct.unpack("<H", data[0:2])[0]
            form_status = data[2]  # Store raw MLC classification

            sensor_data["mlc_prediction"] = form_status  # Store only raw code

            print(f"Counter: {counter}")
            print(f"MLC Prediction Code: {form_status}")  # Debugging
            print("-" * 40)
    except struct.error as e:
        print(f"⚠️ Error decoding MLC data: {e}")

async def find_sensor():
    """Scans for SensorTile Box Pro by BLE name."""
    print("🔍 Searching for SensorTile...")
    device = await BleakScanner.find_device_by_name(SENSOR_NAME)
    if device:
        print(f"✅ Found SensorTile: {device.name} ({device.address})")
        return device
    print("❌ SensorTile not found!")
    return None

async def ble_task():
    """Runs the BLE connection and listens for sensor & MLC data."""
    device = await find_sensor()
    if not device:
        return

    async with BleakClient(device) as client:
        print(f"🔗 Connected to {device.name}")

        # Subscribe to sensor fusion data
        await client.start_notify(FUSION_UUID, lambda s, d: parse_sensor_fusion_data(FUSION_UUID, d))
        print("📡 Listening for sensor fusion data...")

        # Subscribe to MLC classification output
        await client.start_notify(MLC_UUID, notification_handler)
        print("📡 Listening for MLC predictions...")

        try:
            while True:
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            print("\n🔌 Disconnecting...")
        finally:
            await client.stop_notify(FUSION_UUID)
            await client.stop_notify(MLC_UUID)
            print("✅ Disconnected.")

def run_ble():
    """Runs BLE asyncio loop in a separate thread."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(ble_task())

# 🔹 Flask Route to Fetch Sensor Data (Accel + Gyro + MLC)
@app.route("/sensor-data", methods=["GET"])
def get_sensor_data():
    return jsonify(sensor_data)



# 🔹 Serve `index.html` (Home Page)

@app.route("/")
def serve_home():
    return send_from_directory("static", "homepage.html")

 
@app.route("/exercises")
def serve_exercise():
    return send_from_directory("static", "index.html")

@app.route("/track-progress")
def serve_progress():
    return send_from_directory("static", "coming_soon.html")

@app.route("/nutrition")
def serve_nutri():
    return send_from_directory("static", "coming_soon.html")

 
@app.route("/community")
def serve_community():
    return send_from_directory("static", "coming_soon.html")

 
 

 

# 🔹 Serve `bicep_curls.html` (Bicep Curl Game Page)
@app.route("/bicep-curls")
def serve_bicep_curls():
    return send_from_directory("static", "bicep_curls.html")

# 🔹 Serve `bicep_game.js` (Bicep Curl Game Script)
@app.route("/bicep_game.js")
def serve_bicep_sensor_game():
    return send_from_directory("static", "bicep_game.js")

@app.route("/shoulder-press")
def serve_shoulder():
    return send_from_directory("static", "shoulder_press.html")

# 🔹 Serve `bicep_game.js` (Bicep Curl Game Script)
@app.route("/shoulder_game.js")
def serve_shoulder_sensor_game():
    return send_from_directory("static", "shoulder_game.js")

@app.route("/plank")
def serve_plank():
    return send_from_directory("static", "plank.html")

# 🔹 Serve `plank_game.js` (Plank Game Script)
@app.route("/plank_game.js")
def serve_plank_sensor_game():
    return send_from_directory("static", "plank_game.js")

@app.route("/hammer-curl")
def serve_hammer_curls():
    return send_from_directory("static", "hammer_curl.html")


# 🔹 Serve `hammer_game.js` (Hammer Curl Game Script)
@app.route("/hammer_game.js")
def serve_hammer_sensor_game():
    return send_from_directory("static", "hammer_game.js")

@app.route("/pushup")
def serve_pushup():
    return send_from_directory("static", "pushup.html")

# 🔹 Serve `pushup_game.js` (Pushup Game Script)
@app.route("/pushup_game.js")
def serve_pushup_sensor_game():
    return send_from_directory("static", "pushup_game.js")

@app.route("/tricep-overhead")
def serve_tricep_curls():
    return send_from_directory("static", "tricep_overhead.html")

# 🔹 Serve `tricep_overhead_game.js` (triceip overhead extension Game Script)
@app.route("/tricep_overhead_game.js")
def serve_tricep_sensor_game():
    return send_from_directory("static", "tricep_overhead_game.js")



@app.route("/squat-count")
def serve_squat():
    return send_from_directory("static", "squat.html")

# 🔹 Serve `tricep_overhead_game.js` (triceip overhead extension Game Script)
@app.route("/squat_game.js")
def serve_squat_sensor_game():
    return send_from_directory("static", "squat_game.js")



if __name__ == "__main__":
    # Start BLE listener in a separate thread
    threading.Thread(target=run_ble, daemon=True).start()
    
    # Run Flask app
    app.run(host="0.0.0.0", port=9000, debug=True)

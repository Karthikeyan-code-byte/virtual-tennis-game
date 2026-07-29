# virtual-tennis-game

Markdown# 🎾 ESP32 Motion-Controlled Virtual Tennis Game

An interactive 2D Virtual Tennis game powered by **HTML5 Canvas**, **WebSockets**, and an **ESP32** equipped with an **MPU6050 6-Axis Gyroscope/Accelerometer**. Control the paddle in real-time by tilting your physical motion controller!

---

## 📌 Features

* **Real-Time Motion Control:** Low-latency movement tracking using ESP32 & MPU6050 over WebSockets.
* **Indoor Arena Graphics:** Stylized indoor tennis court with arena lighting, crowd tiers, and neon visual effects.
* **Dynamic Software Calibration:** One-click center point calibration to play comfortably from any wrist resting position.
* **Self-Hosting Capable:** Automatically connects to the host IP when served directly from the ESP32 SPIFFS/LittleFS server.
* **Custom Control Tuning:** Built-in UI controls for sensitivity adjustment, axis swapping, and direction inversion.
* **Game Over & Scoring System:** Tracks score, multi-life system, and an overlay screen with a restart loop.

---

## 🧰 Hardware Requirements

* **ESP32** Dev Module
* **MPU6050** Accelerometer / Gyroscope Module
* **Breadboard & Jumper Wires**
* **Micro-USB / USB-C Cable** (for power & initial programming)
* **Smartphone / Router** (to act as the shared Wi-Fi Hotspot)

### MPU6050 to ESP32 Pin Mapping

| MPU6050 Pin | ESP32 Pin |
| :--- | :--- |
| **VCC** | 3.3V / 5V |
| **GND** | GND |
| **SCL** | GPIO 22 |
| **SDA** | GPIO 21 |

---

## 🚀 Step-by-Step Setup Guide

Follow these steps to connect your ESP32 motion paddle to your laptop and start playing.

### Step 1: Set Up Shared Wi-Fi Hotspot
1. Turn **ON** the Personal Hotspot on your smartphone (or connect both devices to the same 2.4 GHz home Wi-Fi network).
2. Ensure your hotspot is set to **2.4 GHz Band** (*ESP32 does not support 5 GHz networks*).
3. Connect your **Laptop** to this hotspot.

### Step 2: Flash the ESP32 Board
1. Open the ESP32 code in **Arduino IDE**.
2. Update the Wi-Fi credentials in your ESP32 code to match your hotspot:
   ```cpp
   const char* ssid = "YOUR_HOTSPOT_NAME";
   const char* password = "YOUR_HOTSPOT_PASSWORD";
Connect the ESP32 to your laptop via USB, select your board and port, and click Upload.Step 3: Find the ESP32 IP AddressOpen the Serial Monitor in Arduino IDE (Baud rate: 115200).Press the EN / RST button on your ESP32.Once connected to your hotspot, the Serial Monitor will output the board's IP address:PlaintextWiFi Connected!
ESP32 IP Address: 192.168.1.42
Step 4: Launch the Game & PlayOpen the index.html file in any modern web browser (Google Chrome, Edge, Firefox).Enter the ESP32 IP Address into the IP input box at the top of the screen.Click Connect. The status indicator will switch to green (Connected!).Hold your ESP32 controller in a comfortable resting position and click Set Center Point.Start playing! Tilt your hand left/right to move the paddle and angle your wrist to slice the ball.

<img width="907" height="607" alt="image" src="https://github.com/user-attachments/assets/b4147b71-733b-4e94-af0b-84515a9d8797" />

💻 Tech Stack
Frontend: HTML5, CSS3, JavaScript (Canvas API)

Backend / Hardware: C++ (Arduino Framework), ESP32 WebSockets library

Communication: WebSockets (ws://) running on port 81

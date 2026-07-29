#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <Wire.h>
#include <ArduinoJson.h>

// ================= USER CONFIGURATION =================
const char* ssid     = "Esp32test";
const char* password = "karthikeyan";
// ======================================================

WebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81);

uint8_t mpuAddr = 0x68; // Default MPU6050 I2C address

// Calibration Offsets (Hardware Level)
int16_t offsetX = 0;
int16_t offsetY = 0;
int16_t offsetZ = 0;

// Filtered Telemetry Data
float filteredRoll = 0.0;
float filteredPitch = 0.0;
const float ALPHA = 0.25; // Low-pass filter coefficient (0.1 = smooth, 0.9 = fast response)

unsigned long lastSendTime = 0;
const int SEND_INTERVAL = 16; // ~60 FPS update rate

// HTML page served directly by the ESP32
const char HTML_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ESP32 Tennis Game Paddle</title>
  <style>
    body { font-family: Arial; text-align: center; margin-top: 50px; background: #1a1a1a; color: white; }
    .card { background: #333; padding: 20px; display: inline-block; border-radius: 10px; border: 1px solid #00ffcc; }
    h2 { margin-bottom: 20px; color: #00ffcc; }
    span { color: #ffffff; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Paddle Telemetry</h2>
    <p>Roll: <span id="roll">0</span>°</p>
    <p>Pitch: <span id="pitch">0</span>°</p>
  </div>

  <script>
    const ws = new WebSocket(`ws://${location.hostname}:81`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      document.getElementById('roll').innerText = data.roll.toFixed(1);
      document.getElementById('pitch').innerText = data.pitch.toFixed(1);
    };
  </script>
</body>
</html>
)rawliteral";

void handleRoot() {
  server.send(200, "text/html", HTML_PAGE);
}

// Hardware Auto-Calibration Routine (Boot Phase)
void calibrateMPU() {
  Serial.println("\n--- Starting Hardware Calibration ---");
  Serial.println("Keep the paddle stationary and flat!");
  
  long sumX = 0, sumY = 0, sumZ = 0;
  int samples = 200;

  for (int i = 0; i < samples; i++) {
    Wire.beginTransmission(mpuAddr);
    Wire.write(0x3B);
    Wire.endTransmission(false);
    Wire.requestFrom(mpuAddr, (uint8_t)6, (uint8_t)true);

    if (Wire.available() >= 6) {
      sumX += Wire.read() << 8 | Wire.read();
      sumY += Wire.read() << 8 | Wire.read();
      sumZ += Wire.read() << 8 | Wire.read();
    }
    delay(4);
  }

  offsetX = sumX / samples;
  offsetY = sumY / samples;
  // Account for +1g gravity on the Z-axis (16384 LSB/g for default +/- 2g scale)
  offsetZ = (sumZ / samples) - 16384; 

  Serial.println("Calibration Completed Successfully!");
  Serial.printf("Offsets -> X: %d, Y: %d, Z: %d\n\n", offsetX, offsetY, offsetZ);
}

void setupMPU() {
  Wire.begin(21, 22);
  delay(100);

  // Wake up MPU6050 on address 0x68
  Wire.beginTransmission(0x68);
  Wire.write(0x6B);
  Wire.write(0);
  if (Wire.endTransmission() != 0) {
    // If not found, fall back to 0x69
    mpuAddr = 0x69;
    Wire.beginTransmission(0x69);
    Wire.write(0x6B);
    Wire.write(0);
    Wire.endTransmission();
  }

  Serial.printf("MPU6050 Initialized on I2C address 0x%02X\n", mpuAddr);
  calibrateMPU();
}

void setup() {
  Serial.begin(115200);
  setupMPU();
  // Add WiFi.mode and WiFi.disconnect to reset the Wi-Fi chip
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  // Setup HTTP Web Server
  server.on("/", handleRoot);
  server.begin();

  // Setup WebSocket Server
  webSocket.begin();
}

void loop() {
  server.handleClient();
  webSocket.loop();

  if (millis() - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = millis();

    Wire.beginTransmission(mpuAddr);
    Wire.write(0x3B);
    Wire.endTransmission(false);
    Wire.requestFrom(mpuAddr, (uint8_t)6, (uint8_t)true);

    if (Wire.available() >= 6) {
      // Read raw accelerometer data
      int16_t rawAccX = Wire.read() << 8 | Wire.read();
      int16_t rawAccY = Wire.read() << 8 | Wire.read();
      int16_t rawAccZ = Wire.read() << 8 | Wire.read();

      // Apply hardware calibration offsets
      float AccX = rawAccX - offsetX;
      float AccY = rawAccY - offsetY;
      float AccZ = rawAccZ - offsetZ;

      // Calculate relative Roll and Pitch angles in degrees
      float rawRoll  = atan2(AccY, AccZ) * 180.0 / PI;
      float rawPitch = atan2(-AccX, sqrt(AccY * AccY + AccZ * AccZ)) * 180.0 / PI;

      // Apply Exponential Moving Average (EMA) low-pass filter
      filteredRoll  = filteredRoll + ALPHA * (rawRoll - filteredRoll);
      filteredPitch = filteredPitch + ALPHA * (rawPitch - filteredPitch);

      // JSON Broadcast Payload
      StaticJsonDocument<128> doc;
      doc["roll"]  = filteredRoll;
      doc["pitch"] = filteredPitch;

      String output;
      serializeJson(doc, output);
      webSocket.broadcastTXT(output);
    }
  }
}
#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_Fingerprint.h>
#include <ArduinoJson.h>
#include <HardwareSerial.h>

// --- WiFi & Network Settings ---
const char* ssid = "SD1";
const char* password = "SD12345678";
String serverIP = "172.31.115.15:5000"; // Centralized IP

// --- Backend Endpoints ---
String getURL = "http://172.31.115.15:5000/api/attendance2"; 
String markURL = "http://" + serverIP + "/api/attendance2/mark"; 
String statusURL = "http://" + serverIP + "/api/attendance2/status";
String commandURL = "http://" + serverIP + "/api/attendance2/getCommand";
String setCommandURL = "http://" + serverIP + "/api/attendance2/setCommand";

HardwareSerial mySerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// --- State Variables ---
int mode = 0; // 0: Attendance, 1: Enroll
int enrollId = 0;
bool attendanceEnabled = false; // Sirf 'Check Attendance' pe true hoga
bool waitingMessageSent = false;

// --- Helper: Send Status to Website Socket ---
void sendStatusToWebsite(String msg) {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(statusURL);
    http.addHeader("Content-Type", "application/json");
    String json = "{\"message\": \"" + msg + "\"}";
    http.POST(json);
    http.end();
  }
}

void setup() {
  Serial.begin(9600);
  mySerial.begin(57600, SERIAL_8N1, 16, 17);
  
  Serial.println("\n--- SAMARTH ERP BIOMETRIC SYSTEM ---");
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n✅ WiFi Connected!");
  if (finger.verifyPassword()) {
    Serial.println("✅ Fingerprint Sensor Ready!");
    sendStatusToWebsite("Hardware Online ✅");
  } else {
    Serial.println("❌ Sensor Error!");
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.begin(ssid, password);
    delay(2000);
    return;
  }

  checkForCommands(); // Har second server se instruction mangega

  if (mode == 1) { 
    // ENROLLMENT MODE
    attendanceEnabled = false;
    runEnrollmentProcess(enrollId);
  } 
  else if (mode == 0 && attendanceEnabled) {
    // ACTIVE ATTENDANCE MODE (Sirf "Check Attendance" dabane par)
    int fingerID = getFingerprintID();
    if (fingerID != -1) {
      sendAttendanceToServer(fingerID);
      attendanceEnabled = false; // Ek baar mark hone ke baad disable
      delay(2000); 
    }
  }
  delay(1000); 
}

// --- Logic: Check for Website Commands ---
void checkForCommands() {
  HTTPClient http;
  http.begin(commandURL);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<300> doc;
    deserializeJson(doc, payload);

    const char* commandMode = doc["mode"]; 
    
    if (commandMode && String(commandMode) == "ENROLL") {
      mode = 1;
      enrollId = doc["enrollId"];
      Serial.println("🆕 Switching to ENROLL Mode");
    } 
    else if (commandMode && String(commandMode) == "ATTENDANCE") {
      if (!attendanceEnabled) {
        mode = 0;
        attendanceEnabled = true; // Sensor ko activate kiya
        waitingMessageSent = false;
        Serial.println("✅ Attendance Scan Activated");
      }
    }
  }
  http.end();
}

// --- Logic: Enrollment (Place/Remove Finger) ---
void runEnrollmentProcess(int id) {
  int p = -1;
  sendStatusToWebsite("Enrollment: Place Finger");
  while (p != FINGERPRINT_OK) { 
    p = finger.getImage();
    yield(); 
  }
  
  if (finger.image2Tz(1) != FINGERPRINT_OK) return;
  
  sendStatusToWebsite("Remove Finger");
  delay(2000);
  while (finger.getImage() != FINGERPRINT_NOFINGER);
  
  p = -1;
  sendStatusToWebsite("Place Same Finger Again");
  while (p != FINGERPRINT_OK) { 
    p = finger.getImage();
    yield();
  }
  
  if (finger.image2Tz(2) != FINGERPRINT_OK) return;
  
  if (finger.createModel() == FINGERPRINT_OK && finger.storeModel(id) == FINGERPRINT_OK) {
    sendStatusToWebsite("Success ✅ ID " + String(id) + " Enrolled");
    
    // Server ko wapas normal state mein bhejien
    HTTPClient http;
    http.begin(setCommandURL);
    http.addHeader("Content-Type", "application/json");
    http.POST("{\"mode\":\"WAITING\",\"enrollId\":null}"); 
    http.end();
    
    mode = 0;
    attendanceEnabled = false;
    Serial.println("✅ Enrollment Done.");
  }
}

// --- Logic: Attendance Scanning ---
int getFingerprintID() {
  uint8_t p = finger.getImage();
  
  if (p == FINGERPRINT_NOFINGER) {
    if (!waitingMessageSent) {
      sendStatusToWebsite("Place Finger for Attendance...");
      waitingMessageSent = true;
    }
    return -1;
  }
  
  waitingMessageSent = false;
  if (p != FINGERPRINT_OK) return -1;
  if (finger.image2Tz() != FINGERPRINT_OK) return -1;

  p = finger.fingerSearch();
  if (p != FINGERPRINT_OK) {
    sendStatusToWebsite("Error: Finger Not Found!");
    return -1;
  }

  sendStatusToWebsite("Found! ID: " + String(finger.fingerID));
  return finger.fingerID;
}

// --- Logic: Database Entry ---
void sendAttendanceToServer(int id) {
  HTTPClient http;
  http.begin(markURL); 
  http.addHeader("Content-Type", "application/json");
  
  // MongoDB compatible JSON
  String json = "{\"user\": \"" + String(id) + "\", \"deviceId\": \"SAMARTH_GATE_01\"}";
  
  int code = http.POST(json);
  if (code > 0) {
    Serial.println("✅ Attendance Saved in MongoDB");
  }
  http.end();
}
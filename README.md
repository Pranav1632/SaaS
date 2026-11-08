# SaansAI v2 — Hyperlocal Exposure Intelligence for Pune & PCCOE

> Turning raw air quality into personal alveolar dose, explainable source attribution ("Why is the air bad?"), and proactive departure guidance 20 minutes before you leave.

---

## 🛠️ System Requirements & Prerequisites

| Requirement | Recommended Version | Status on Your PC |
|---|---|---|
| **Python** | 3.10 to 3.13 | ✅ Installed (Python 3.13) |
| **Node.js** | 18+ to 22+ | ✅ Installed (v22.13) |
| **Ollama (Local LLM)** | Optional (for natural language routine chat) | ✅ Installed (`qwen2.5:3b`, `llama3.2:1b`) |
| **Browser / Phone** | Chrome, Edge, Safari, Firefox | Supported |

---

## 🚀 Step-by-Step Setup & Running Guide

### 1. Backend Setup & Run

Open PowerShell / Terminal in the project directory:

```powershell
# 1. Navigate to backend
cd backend

# 2. Activate existing virtual environment (or create: python -m venv venv)
.\venv\Scripts\activate

# 3. Install dependencies (if fresh clone)
pip install -r requirements.txt

# 4. Start the FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

* **API is Live at:** `http://localhost:8000`
* **Interactive Swagger UI Docs:** `http://localhost:8000/docs`
* **Real-time SSE Stream:** `http://localhost:8000/api/stream`

---

### 2. (Optional) Run Local LLM with Ollama

The backend connects to local Ollama on port `11434` for natural language routine parsing.

```powershell
# Ensure Ollama is running in background:
ollama serve

# Check that model is ready:
ollama run qwen2.5:3b
```
> *Note: If Ollama is offline, the backend automatically uses its calibrated regex/rule-based parser so the system never crashes during a demo.*

---

### 3. Receive Real Mobile Push Notifications (`ntfy.sh`)

Zero setup or tokens required:
1. Open this link on your smartphone or PC browser:  
   👉 **`https://ntfy.sh/saansai-pccoe-alerts`**
2. Click **"Subscribe"** (and allow browser notifications).
3. Whenever a T-20 departure alert or pollution spike triggers in the app, a real push notification banner lands on your phone!

---

### 4. Running Validation & Tests

To show judges the scientific validity of the model:

```powershell
cd backend

# 1. Run all 21 automated unit, physics, and integration tests
python -m pytest app/tests -v

# 2. Run the Scientific Leave-One-Station-Out Cross-Validation (LOSO-CV)
python -m app.validation.loso_cv
# Displays: +17.8% Accuracy Gain over standard IDW interpolation!

# 3. Run the 5-Cycle Stress Verification Harness
python -m app.tests.test_harness_5x
```

---

## 📡 Live Public APIs Used (Zero API Keys Required)
* **Open-Meteo Weather API**: Live wind speed, wind direction, boundary layer height ($BLH$), rain, temperature.
* **Open-Meteo CAMS Air Quality API**: Live baseline $\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{O}_3$, $\text{SO}_2$ for Pune coordinates (`18.6279, 73.7636`).
* **OSRM Public Routing API**: Real street polylines for road exposure sampling.
* **ntfy.sh Push Gateway**: Free open-source push notification delivery.

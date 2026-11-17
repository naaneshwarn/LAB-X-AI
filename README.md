# LabXAI – AI-Powered Interactive Virtual Science Laboratory

**Ask. Explore. Experiment. Understand.**

LabXAI is an AI-powered interactive science learning platform designed to make science education more engaging, accessible, and practical. It allows students to explore scientific concepts through virtual experiments, interactive simulations, AI-powered explanations, and quizzes.

The platform aims to support classroom learning by providing students with a safe virtual environment where they can experiment, observe results, ask questions, and understand scientific concepts.

## 🎯 Project Objectives

- Make science learning interactive and engaging.
- Help students understand scientific concepts through virtual experiments.
- Provide AI-powered explanations in simple language.
- Support English and Kannada learning.
- Encourage curiosity, experimentation, and practical understanding.
- Provide a safe virtual environment for exploring science.

## ✨ Key Features

- **Interactive Virtual Laboratory:** Perform science experiments in a virtual environment.
- **AI Science Assistant:** Ask questions and receive easy-to-understand explanations.
- **Visual Simulations:** Observe real-time changes when experiment components are modified.
- **Multilingual Learning:** Support English and Kannada explanations.
- **Interactive Quizzes:** Test understanding through topic-based questions.
- **Learning Progress:** Track completed experiments and quiz performance.

## ⚡ Initial Experiment: Basic Electric Circuit

The initial prototype focuses on an interactive basic electric circuit experiment.

Students will be able to:
- Explore a battery, bulb, switch, resistor, and connecting wires.
- Connect circuit components.
- Turn the switch ON and OFF.
- Observe whether the bulb lights up.
- Change voltage and resistance values.
- Understand the relationship between voltage, resistance, and current.
- Observe calculated results in real time.

### Scientific Calculation

The simulation uses Ohm's Law:

**V = I × R**

Where:
- V = Voltage (Volts)
- I = Current (Amperes)
- R = Resistance (Ohms)

Scientific calculations are performed using deterministic JavaScript logic rather than relying on the AI model.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| Vite | Development environment |
| Tailwind CSS | User interface styling |
| JavaScript | Interactive simulation and calculations |
| SVG | Circuit diagrams and components |
| CSS Animations | Visual effects and animations |
| Python | Backend development |
| FastAPI | Backend API services |
| SQLite | Initial database |
| Ollama | Local AI model runtime |

## 🏗️ Project Architecture

1. **Frontend:** Provides the landing page, student dashboard, experiment selection, and virtual laboratory.
2. **Simulation Engine:** Handles component interactions, circuit states, scientific calculations, and visual feedback.
3. **Backend:** Receives structured experiment data and provides API services.
4. **AI Assistant:** Uses experiment context to explain scientific observations and answer student questions.
5. **Database:** Stores relevant experiment and learning progress information.

## 👨‍💻 Frontend & Simulation Responsibilities

The frontend and interactive simulation development includes:

- Setting up React, Vite, and Tailwind CSS.
- Building the landing page and student dashboard.
- Developing the experiment selection interface.
- Creating the interactive virtual laboratory.
- Designing circuit components using JavaScript and SVG.
- Implementing component placement and switch controls.
- Calculating scientific values using JavaScript.
- Providing real-time visual feedback.
- Connecting the frontend with backend APIs.
- Sending structured experiment states and observations to the backend.

## 🚀 Getting Started

### Prerequisites

Install the following tools:

- Node.js (LTS version)
- npm
- Git
- Visual Studio Code

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/godjanith/LabXAI.git
```

**2. Navigate to the project folder**

```bash
cd LabXAI
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

Open the local URL displayed in your terminal to access the application.

## 📁 Planned Frontend Structure

```text
src/
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   └── ExperimentCard.jsx
│
├── pages/
│   ├── Home.jsx
│   ├── Dashboard.jsx
│   ├── Experiments.jsx
│   └── VirtualLab.jsx
│
├── simulations/
│   └── circuits/
│       ├── CircuitLab.jsx
│       ├── CircuitDiagram.jsx
│       ├── Battery.jsx
│       ├── Bulb.jsx
│       ├── Switch.jsx
│       ├── circuitLogic.js
│       └── circuit.css
│
├── services/
│   └── api.js
│
├── App.jsx
└── main.jsx
```

*This is the proposed structure and may evolve during development.*

## 🌱 Future Enhancements

- More interactive physics and chemistry experiments.
- Additional Indian language support.
- Voice-based AI assistance.
- Improved student progress tracking.
- More advanced virtual laboratory simulations.
- Teacher-oriented learning and monitoring features.

## 🎓 Vision

Our vision is to make science learning more accessible, engaging, and experiential by combining interactive simulations with AI-powered explanations.

**LabXAI – Learn Science by Exploring, Experimenting, and Understanding.**

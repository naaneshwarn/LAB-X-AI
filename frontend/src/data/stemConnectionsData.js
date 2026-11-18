/**
 * STEM Connections Knowledge Base for LabXAI Experiments.
 * Bridges Science, Technology, Engineering, and Mathematics for each experiment,
 * complete with real-world case studies, virtual sensor/microcontroller snippets,
 * and predict-before-run critical thinking prompts.
 */

export const STEM_CONNECTIONS = {
  // ==========================================
  // PHYSICS
  // ==========================================
  'ohms-law': {
    discipline: 'Physics',
    science: 'Ohmic conduction, electron drift velocity under electric fields, charge conservation, and Joule heating (P = I²R).',
    technology: 'Digital multimeters (ADC sampling), shunt resistors for current telemetry, Hall-effect current sensors, and power management ICs.',
    engineering: 'Current-limiting resistors for LEDs, high-voltage transmission grid impedance matching, automotive fuse sizing, and printed circuit board (PCB) trace thermal management.',
    mathematics: 'Linear algebraic relation V = I × R, inverse relation I = V / R, power quadratic scaling P = V² / R, and slope computation (R = ΔV / ΔI).',
    stemTags: ['Science', 'Technology', 'Engineering', 'Mathematics'],
    realWorldCaseStudy: {
      title: 'Electric Vehicle Battery Management System (BMS)',
      industry: 'Automotive & Clean Energy',
      description: 'Modern EV battery packs operate at 400V–800V. A BMS continuously monitors current through precision low-resistance shunts using Ohm’s Law. If resistance spikes due to terminal corrosion or temperature rise, current is throttled in milliseconds to prevent thermal runaway.',
      career: 'Electrical Power Engineer / Embedded Hardware Architect',
    },
    microcontrollerSnippet: {
      platform: 'Arduino / ESP32',
      title: 'Current Sensing via Shunt Resistor & Analog ADC',
      code: `// Measures voltage across a 0.1 ohm shunt to calculate current
const int shuntPin = A0;
const float R_shunt = 0.10; // Ohms
const float V_ref = 3.30;   // ADC Reference Voltage

void setup() {
  Serial.begin(115200);
}

void loop() {
  int rawADC = analogRead(shuntPin);
  float voltage = (rawADC / 4095.0) * V_ref;
  float current = voltage / R_shunt; // Ohm's Law: I = V / R
  float power = voltage * current;   // P = V * I

  Serial.print("Voltage: "); Serial.print(voltage, 3); Serial.print(" V | ");
  Serial.print("Current: "); Serial.print(current, 3); Serial.println(" A");
  delay(500);
}`,
    },
    predictPrompt: {
      question: 'If you double the resistance (R) while keeping the power supply voltage (V) constant, what will happen to the current (I)?',
      options: [
        { id: 'halve', text: 'Current will be halved (decrease by 50%)', correct: true },
        { id: 'double', text: 'Current will double (increase by 100%)', correct: false },
        { id: 'constant', text: 'Current will remain unchanged', correct: false },
        { id: 'quadruple', text: 'Current will decrease to one fourth', correct: false },
      ],
      explanation: 'According to Ohm\'s Law I = V / R, current is inversely proportional to resistance. At constant voltage, doubling R cuts I exactly in half.',
      whatIfFollowUp: 'What would happen to the heat power generated (P = I²R) under this condition?',
    },
  },

  'simple-pendulum': {
    discipline: 'Physics',
    science: 'Simple harmonic motion (SHM), gravitational restoring force, conservation of mechanical energy (potential vs kinetic), and period independence of mass.',
    technology: 'Laser photogates, MEMS accelerometers, optical rotary encoders, and microsecond digital time-interval counters.',
    engineering: 'Tuned mass dampers in skyscrapers (e.g., Taipei 101) to absorb earthquake and typhoon sway, grandfather clock escapements, and seismograph pendulums.',
    mathematics: 'Small-angle approximation sin(θ) ≈ θ, period formula T = 2π√(L/g), square-root proportionality (T ∝ √L), and frequency relation f = 1/T.',
    stemTags: ['Science', 'Technology', 'Engineering', 'Mathematics'],
    realWorldCaseStudy: {
      title: 'Taipei 101 Tuned Mass Damper',
      industry: 'Structural & Civil Engineering',
      description: 'Suspended between the 87th and 92nd floors of the Taipei 101 tower hangs a 660-tonne steel pendulum. When typhoons or earthquakes shake the building, the pendulum sways in counter-phase, dissipating up to 40% of the building’s destructive vibration energy.',
      career: 'Structural Dynamics Engineer / Earthquake Hazard Analyst',
    },
    microcontrollerSnippet: {
      platform: 'ESP32 / Photogate',
      title: 'Microsecond Period Measurement using Hardware Interrupts',
      code: `const int photogatePin = 18;
volatile unsigned long lastPassTime = 0;
volatile unsigned long periodMicro = 0;

void IRAM_ATTR onBeamBreak() {
  unsigned long now = micros();
  if (lastPassTime > 0) {
    periodMicro = (now - lastPassTime) * 2; // Full oscillation = 2 passes
  }
  lastPassTime = now;
}

void setup() {
  Serial.begin(115200);
  pinMode(photogatePin, INPUT_PULLUP);
  attachInterrupt(photogatePin, onBeamBreak, FALLING);
}

void loop() {
  if (periodMicro > 0) {
    float T = periodMicro / 1000000.0;
    float L = 9.80665 * (T * T) / (4 * 3.14159 * 3.14159);
    Serial.printf("Period T = %.3f s | Computed Length = %.3f m\\n", T, L);
  }
  delay(1000);
}`,
    },
    predictPrompt: {
      question: 'If you quadruple the length of the pendulum string (from 0.25 m to 1.0 m), how does the oscillation period T change?',
      options: [
        { id: 'double', text: 'The period will double (multiply by 2)', correct: true },
        { id: 'quadruple', text: 'The period will quadruple (multiply by 4)', correct: false },
        { id: 'halve', text: 'The period will be halved (divide by 2)', correct: false },
        { id: 'same', text: 'The period will remain exactly the same', correct: false },
      ],
      explanation: 'Since T = 2π√(L/g), period scales with the square root of length: √(4) = 2. Quadrupling length doubles the period.',
      whatIfFollowUp: 'If you took this pendulum to the Moon where g is 1/6th of Earth, would it swing faster or slower?',
    },
  },

  'projectile-motion': {
    discipline: 'Physics',
    science: '2D kinematics, independence of horizontal and vertical velocity components, gravitational acceleration vector, and parabolic trajectories.',
    technology: 'Doppler radar ball tracking, optical high-speed stereoscopic cameras, GPS/IMU inertial guidance modules, and LIDAR rangefinders.',
    engineering: 'Ballistics calculations, satellite orbital injection trajectories, water cannon nozzle design for firefighting, and sports biomechanics equipment.',
    mathematics: 'Parametric equations x(t) = v₀ cos(θ) t, y(t) = v₀ sin(θ) t - ½gt², range R = (v₀² sin(2θ)) / g, and apex height H = (v₀² sin²(θ)) / (2g).',
    stemTags: ['Science', 'Technology', 'Engineering', 'Mathematics'],
    realWorldCaseStudy: {
      title: 'Autonomous Agricultural Drone Spraying Optimization',
      industry: 'Agri-Tech & Aerospace',
      description: 'Precision crop-spraying drones adjust droplet nozzle velocity and angle based on altitude and wind velocity vectors to deposit pesticides accurately on crop canopy without toxic spray drift.',
      career: 'Avionics Flight Controls Engineer / Robotics Specialist',
    },
    microcontrollerSnippet: {
      platform: 'C++ / ESP32',
      title: 'Ballistic Range & Apex Trajectory Computer',
      code: `struct Trajectory {
  float maxRange;
  float maxHeight;
  float flightTime;
};

Trajectory computeTrajectory(float v0, float angleDeg, float g = 9.81) {
  float rad = angleDeg * (3.14159265 / 180.0);
  Trajectory t;
  t.flightTime = (2.0 * v0 * sin(rad)) / g;
  t.maxRange = (v0 * v0 * sin(2.0 * rad)) / g;
  t.maxHeight = (v0 * v0 * pow(sin(rad), 2)) / (2.0 * g);
  return t;
}`,
    },
    predictPrompt: {
      question: 'Neglecting air resistance, at which launch angle does a projectile achieve its maximum horizontal range?',
      options: [
        { id: '45deg', text: '45 degrees', correct: true },
        { id: '60deg', text: '60 degrees', correct: false },
        { id: '30deg', text: '30 degrees', correct: false },
        { id: '90deg', text: '90 degrees', correct: false },
      ],
      explanation: 'The range formula contains sin(2θ). The sine function achieves its maximum value of 1.0 when 2θ = 90°, which means θ = 45°.',
      whatIfFollowUp: 'Why do actual artillery shells or long golf drives launch at slightly lower angles (32°–38°) in real atmosphere?',
    },
  },

  'reflection-of-light': {
    discipline: 'Physics',
    science: 'Wave optics, law of reflection (angle of incidence = angle of reflection), specular vs diffuse reflection, and virtual image formation.',
    technology: 'LIDAR time-of-flight pulsed laser distance sensors, retroreflective traffic signs, laser interferometers, and barcode scanners.',
    engineering: 'Cassegrain astronomical reflector telescopes, fiber optic core total internal reflection, solar concentrator parabolic mirrors, and periscope optics.',
    mathematics: 'Ray vector geometry, angle equality θᵢ = θᵣ, focal length relation f = R / 2 for spherical mirrors, and Cartesian sign conventions.',
    stemTags: ['Science', 'Technology', 'Engineering', 'Mathematics'],
    realWorldCaseStudy: {
      title: 'Solar Thermal Molten Salt Power Plants (Ivanpah & Noor)',
      industry: 'Renewable Clean Energy',
      description: 'Thousands of computer-controlled dual-axis tracking mirrors (heliostats) precisely reflect incoming sunlight onto a central receiver tower, heating molten salt to 565°C to drive steam turbines generating grid electricity round the clock.',
      career: 'Optical Systems Engineer / Solar Heliostat Controls Specialist',
    },
    microcontrollerSnippet: {
      platform: 'Arduino / Servo',
      title: 'Dual-Axis Solar Heliostat Mirror Tracking',
      code: `// Reads light sensors to align reflection onto receiver
#include <Servo.h>
Servo heliostatServo;
const int ldrEast = A0;
const int ldrWest = A1;

void setup() {
  heliostatServo.attach(9);
}

void loop() {
  int valE = analogRead(ldrEast);
  int valW = analogRead(ldrWest);
  int diff = valE - valW;

  if (abs(diff) > 20) {
    int currentAngle = heliostatServo.read();
    if (diff > 0 && currentAngle < 175) heliostatServo.write(currentAngle + 1);
    else if (diff < 0 && currentAngle > 5) heliostatServo.write(currentAngle - 1);
  }
  delay(100);
}`,
    },
    predictPrompt: {
      question: 'If you rotate a flat mirror by an angle of 10 degrees, by how many degrees does the reflected ray rotate?',
      options: [
        { id: '20deg', text: '20 degrees (twice the mirror angle)', correct: true },
        { id: '10deg', text: '10 degrees (equal to the mirror angle)', correct: false },
        { id: '0deg', text: '0 degrees (remains fixed in space)', correct: false },
        { id: '5deg', text: '5 degrees (half the mirror angle)', correct: false },
      ],
      explanation: 'When a mirror turns by angle θ, both the incident angle and the reflected angle change with respect to the new normal, causing the reflected ray to deviate by 2θ.',
      whatIfFollowUp: 'How is this optical amplification utilized in galvanometers and laser scanning displays?',
    },
  },

  // ==========================================
  // CHEMISTRY
  // ==========================================
  'acids-bases-ph': {
    discipline: 'Chemistry',
    science: 'Arrhenius and Brønsted-Lowry acid-base equilibrium, hydronium ion concentration [H₃O⁺], autoionization of water, and neutralization reactions.',
    technology: 'Glass-electrode pH meters with high-impedance FET amplifiers, ISFET micro-sensors, digital colorimeters, and automated titrators.',
    engineering: 'Municipal wastewater neutralization plants, pharmaceutical buffer formulation, agricultural soil acidity conditioning, and swimming pool automated chlorine/pH dosers.',
    mathematics: 'Logarithmic scale formula pH = -log₁₀[H⁺], pOH relation pH + pOH = 14 (at 25°C), and dilution molarity ratios M₁V₁ = M₂V₂.',
    stemTags: ['Science', 'Technology', 'Engineering', 'Mathematics'],
    realWorldCaseStudy: {
      title: 'Automated Industrial Wastewater Effluent Treatment',
      industry: 'Environmental & Chemical Engineering',
      description: 'Textile and dyeing factories discharge caustic wastewater. Real-time pH sensors sample the effluent and run PID dosing pumps injecting sulfuric acid or sodium hydroxide to maintain pH between 6.5 and 8.5 before discharging into rivers.',
      career: 'Environmental Chemical Engineer / Water Quality Scientist',
    },
    microcontrollerSnippet: {
      platform: 'ESP32 / Analog pH Sensor',
      title: 'pH Probe Calibration & Millivolt-to-pH Conversion',
      code: `const int phPin = 34;
const float calibrationOffset = 0.00; // Calibrated with buffer solution

float readPH() {
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(phPin);
    delay(10);
  }
  float avgRaw = sum / 10.0;
  float voltage = (avgRaw / 4095.0) * 3.3;
  // Standard Nernstian slope: 59.16 mV per pH unit at 25°C
  float phValue = 7.0 + ((2.5 - voltage) / 0.18) + calibrationOffset;
  return phValue;
}`,
    },
    predictPrompt: {
      question: 'If you dilute an acidic solution of pH 3 by adding pure distilled water until its volume increases tenfold (10x), what will the new pH be?',
      options: [
        { id: 'ph4', text: 'pH 4 (increases by 1 unit toward neutral)', correct: true },
        { id: 'ph2', text: 'pH 2 (becomes more acidic)', correct: false },
        { id: 'ph7', text: 'pH 7 (immediately becomes neutral water)', correct: false },
        { id: 'ph13', text: 'pH 13 (turns into a strong base)', correct: false },
      ],
      explanation: 'Because the pH scale is logarithmic (base 10), a 10-fold reduction in [H⁺] concentration increases the pH value by exactly 1 unit (from 3 to 4).',
      whatIfFollowUp: 'Can you ever make an acidic solution alkaline (pH > 7) simply by diluting it with pure neutral water?',
    },
  },

  'atomic-structure': {
    discipline: 'Chemistry',
    science: 'Subatomic particle distribution (protons, neutrons, electrons), Bohr quantization, energy levels, electron configuration, and valence bonding.',
    technology: 'Mass spectrometry, X-ray photoelectron spectroscopy (XPS), synchrotron radiation sources, and transmission electron microscopes (TEM).',
    engineering: 'Semiconductor doping for microchips (silicon crystal lattice with phosphorus/boron), nuclear medical radiotracers, and LED quantum dot displays.',
    mathematics: 'Atomic number Z, mass number A = Z + N, Rydberg formula for spectral line transitions 1/λ = R_H (1/n₁² - 1/n₂²), and electron shell capacity 2n².',
    stemTags: ['Science', 'Technology', 'Engineering', 'Mathematics'],
    realWorldCaseStudy: {
      title: 'Silicon Semiconductor Doping for Computer Processors',
      industry: 'Nanotechnology & Microelectronics',
      description: 'Silicon atoms have 4 valence electrons. By substituting tiny quantities of Phosphorus (5 valence electrons) or Boron (3 valence electrons), engineers create n-type and p-type semiconductor junctions that power all modern microprocessors and solar cells.',
      career: 'Semiconductor Materials Scientist / Quantum Hardware Engineer',
    },
    microcontrollerSnippet: {
      platform: 'Python / Simulation',
      title: 'Electron Shell Capacity & Orbital Quantization',
      code: `def calculate_electron_configuration(atomic_number):
    # Shell capacity is 2 * n^2
    shells = {'K (n=1)': 2, 'L (n=2)': 8, 'M (n=3)': 18, 'N (n=4)': 32}
    distribution = {}
    remaining = atomic_number
    for shell, capacity in shells.items():
        count = min(remaining, capacity)
        distribution[shell] = count
        remaining -= count
        if remaining <= 0:
            break
    return distribution`,
    },
    predictPrompt: {
      question: 'According to the Bohr model (2n²), what is the maximum number of electrons that the third electron shell (M shell, n=3) can hold?',
      options: [
        { id: '18', text: '18 electrons', correct: true },
        { id: '8', text: '8 electrons', correct: false },
        { id: '32', text: '32 electrons', correct: false },
        { id: '2', text: '2 electrons', correct: false },
      ],
      explanation: 'For principal quantum number n = 3, shell capacity = 2 × (3)² = 2 × 9 = 18 electrons.',
      whatIfFollowUp: 'Why do elements in the third row (like Argon, atomic number 18) achieve stable noble gas octets with 8 valence electrons before the remaining 10 are filled in the transition metals?',
    },
  },

  // ==========================================
  // BIOLOGY
  // ==========================================
  'human-respiratory-system': {
    discipline: 'Biology',
    science: 'Pulmonary ventilation, gas exchange across alveolar-capillary membrane via passive diffusion, hemoglobin oxygen saturation, and diaphragm biomechanics.',
    technology: 'Optical pulse oximeters (photoplethysmography using 660nm & 940nm LEDs), electronic spirometers, end-tidal CO₂ capnography, and medical ventilators.',
    engineering: 'Mechanical ventilator airflow control valves, high-efficiency particulate air (HEPA) filter masks, hyperbaric oxygen chambers, and artificial lungs (ECMO).',
    mathematics: 'Boyle’s law applied to thoracic cavity P₁V₁ = P₂V₂, minute ventilation VE = Tidal Volume (VT) × Respiratory Rate (RR), and Dalton’s partial pressure law.',
    stemTags: ['Science', 'Technology', 'Engineering', 'Mathematics'],
    realWorldCaseStudy: {
      title: 'Microcontroller-Driven ICU Ventilator Flow Loop',
      industry: 'Biomedical Engineering & Critical Care',
      description: 'During respiratory distress, mechanical ventilators supply pressurized air synchronized with the patient’s spontaneous breathing effort. Pressure differential sensors detect inhalation initiation within 20 milliseconds to deliver calibrated tidal volume.',
      career: 'Biomedical Equipment Engineer / Pulmonology Clinical Technologist',
    },
    microcontrollerSnippet: {
      platform: 'ESP32 / Optical Sensor',
      title: 'Pulse Oximeter SpO2 & Heart Rate Sensing (MAX30102)',
      code: `// Reads dual-wavelength Red (660nm) and IR (940nm) reflections
// Oxygenated Hb absorbs more IR; deoxygenated Hb absorbs more Red
#include "MAX30105.h"
MAX30105 particleSensor;

void setup() {
  Serial.begin(115200);
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 sensor not detected.");
    while (1);
  }
  particleSensor.setup();
}

void loop() {
  long irValue = particleSensor.getIR();
  long redValue = particleSensor.getRed();
  float ratio = (float)redValue / (float)irValue;
  float spO2 = 110.0 - 25.0 * ratio; // Calibrated empirical approximation
  Serial.printf("IR: %ld | Red: %ld | SpO2: %.1f %%\\n", irValue, redValue, spO2);
  delay(200);
}`,
    },
    predictPrompt: {
      question: 'When the diaphragm contracts and moves downward during inhalation, what happens to the intra-thoracic volume and alveolar air pressure?',
      options: [
        { id: 'vol_up_press_down', text: 'Thoracic volume increases, pressure drops below atmospheric, drawing air in', correct: true },
        { id: 'vol_down_press_up', text: 'Thoracic volume decreases, pressure rises, pushing air out', correct: false },
        { id: 'both_increase', text: 'Both thoracic volume and pressure increase simultaneously', correct: false },
        { id: 'no_change', text: 'Volume stays constant while air is pumped by heart pressure', correct: false },
      ],
      explanation: 'Boyle’s law (P ∝ 1/V) dictates that as thoracic cavity volume increases, internal gas pressure drops below ambient atmospheric pressure, creating a vacuum that pulls air through trachea into lungs.',
      whatIfFollowUp: 'What happens at high altitudes (like Everest base camp) where atmospheric pressure is only 50% of sea level?',
    },
  },

  'human-circulatory-system': {
    discipline: 'Biology',
    science: 'Four-chambered heart biomechanics, systemic and pulmonary circulatory loops, cardiac cycle (systole vs diastole), and arterial baroreceptor reflex.',
    technology: '12-lead electrocardiography (ECG/EKG), Doppler ultrasound echocardiograms, optical PPG smartwatches, and automated blood pressure oscillometry.',
    engineering: 'Mechanical heart valves, artificial ventricular assist devices (VADs), coronary drug-eluting stents, and automated external defibrillators (AED).',
    mathematics: 'Cardiac output CO = Stroke Volume (SV) × Heart Rate (HR), Poiseuille’s flow resistance equation R ∝ 1/r⁴, and mean arterial pressure MAP = DBP + ⅓(SBP - DBP).',
    stemTags: ['Science', 'Technology', 'Engineering', 'Mathematics'],
    realWorldCaseStudy: {
      title: 'Automated External Defibrillator (AED) Algorithm',
      industry: 'Biomedical & Emergency Medicine',
      description: 'An AED uses high-frequency digital signal processing to analyze electrocardiogram signals from chest pads. When it detects ventricular fibrillation, it charges high-voltage capacitors and delivers a bi-phasic electric shock (150J–200J) to reset cardiac conduction.',
      career: 'Cardiovascular Medical Device Designer / Clinical Data Analyst',
    },
    microcontrollerSnippet: {
      platform: 'Arduino / Analog ECG AD8232',
      title: 'Real-Time ECG Heartbeat Peak Detection & BPM Calculator',
      code: `const int ecgPin = A0;
unsigned long lastBeatTime = 0;
int threshold = 550;

void setup() {
  Serial.begin(115200);
}

void loop() {
  int val = analogRead(ecgPin);
  unsigned long now = millis();
  if (val > threshold && (now - lastBeatTime > 300)) {
    float bpm = 60000.0 / (now - lastBeatTime);
    Serial.printf("Heartbeat Detected! BPM: %.1f\\n", bpm);
    lastBeatTime = now;
  }
  delay(10);
}`,
    },
    predictPrompt: {
      question: 'If arterial radius (r) decreases by 50% due to plaque buildup (arteriosclerosis), by what factor does resistance to blood flow increase according to Poiseuille’s Law?',
      options: [
        { id: '16x', text: 'Increases by 16 times (2⁴)', correct: true },
        { id: '2x', text: 'Increases by 2 times', correct: false },
        { id: '4x', text: 'Increases by 4 times', correct: false },
        { id: '8x', text: 'Increases by 8 times', correct: false },
      ],
      explanation: 'Poiseuille’s Law states resistance R is inversely proportional to the fourth power of radius (R ∝ 1/r⁴). Halving radius yields (1 / 0.5)⁴ = 2⁴ = 16 times greater resistance.',
      whatIfFollowUp: 'How hard must the left ventricle pump to maintain identical cardiac output under this quadrupled arterial resistance?',
    },
  },

  // ==========================================
  // MATHEMATICS
  // ==========================================
  'trigonometric-functions': {
    discipline: 'Mathematics',
    science: 'Wave kinematics, simple harmonic vibrations, alternating current phase shifts, and electromagnetic field oscillations.',
    technology: 'Fast Fourier Transform (FFT) audio analyzers, GPS satellite trilateration, graphics processing unit (GPU) raytracing, and digital signal processors.',
    engineering: 'Acoustic architectural hall dampening, civil bridge truss structural triangulation, radar azimuth positioning, and robotics inverse kinematics.',
    mathematics: 'Trigonometric ratios sin, cos, tan, Pythagorean identity sin²(θ) + cos²(θ) = 1, period 2π/ω, and Euler’s formula e^(iθ) = cos(θ) + i sin(θ).',
    stemTags: ['Science', 'Technology', 'Engineering', 'Mathematics'],
    realWorldCaseStudy: {
      title: 'GPS Satellite Constellation Trilateration',
      industry: 'Satellite Navigation & Telecommunications',
      description: 'Your smartphone GPS does not calculate distance by driving. It locks onto radio signals from at least 4 atomic-clock satellites, solving simultaneous trigonometric spherical intersection equations to fix your location to within 3 meters anywhere on Earth.',
      career: 'Geospatial Algorithm Developer / Satellite Telecommunications Engineer',
    },
    microcontrollerSnippet: {
      platform: 'C++ / DSP',
      title: 'Sine Wave Look-Up Table for Audio Synthesis',
      code: `#define SAMPLE_COUNT 64
uint8_t sineTable[SAMPLE_COUNT];

void generateSineTable() {
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    float angle = (i * 2.0 * 3.14159265) / SAMPLE_COUNT;
    // Normalized to 8-bit DAC output (0 - 255)
    sineTable[i] = (uint8_t)((sin(angle) + 1.0) * 127.5);
  }
}`,
    },
    predictPrompt: {
      question: 'What is the value of sin²(θ) + cos²(θ) for an angle of θ = 73.5 degrees?',
      options: [
        { id: '1', text: 'Exactly 1.0', correct: true },
        { id: '0', text: '0.0', correct: false },
        { id: '1.414', text: '√2 (approx 1.414)', correct: false },
        { id: 'varies', text: 'It depends on whether angle is in radians or degrees', correct: false },
      ],
      explanation: 'The fundamental Pythagorean trigonometric identity sin²(θ) + cos²(θ) = 1 holds true for any real angle θ without exception, derived from the unit circle equation x² + y² = 1.',
      whatIfFollowUp: 'How does this identity guarantee energy conservation in orthogonal electromagnetic wave vectors?',
    },
  },

  'quadratic-equations': {
    discipline: 'Mathematics',
    science: 'Gravitational acceleration paths, satellite parabolic dish focal reflections, and kinetic energy scaling with velocity (E_k = ½mv²).',
    technology: 'Computer vision curve fitting, parabolic microphone sound concentrators, and video game physics collision algorithms.',
    engineering: 'Suspension bridge main cable catenary/parabolic modeling, solar concentrator trough design, and highway vertical curve transitions.',
    mathematics: 'Standard form ax² + bx + c = 0, discriminant Δ = b² - 4ac, quadratic formula x = (-b ± √Δ) / (2a), vertex coordinates (-b/2a, -Δ/4a).',
    stemTags: ['Science', 'Technology', 'Engineering', 'Mathematics'],
    realWorldCaseStudy: {
      title: 'Suspension Bridge Main Cable Load Geometry',
      industry: 'Structural Civil Engineering',
      description: 'The main cables of iconic bridges like the Golden Gate Bridge hang in parabolas under uniform horizontal deck loads. Engineers solve quadratic systems to calculate tension at tower saddles and anchor blocks.',
      career: 'Civil Bridge Designer / Computational Geometry Analyst',
    },
    microcontrollerSnippet: {
      platform: 'Python',
      title: 'Real Root Solver & Parabola Vertex Calculator',
      code: `import math

def solve_quadratic(a, b, c):
    if a == 0:
        return "Linear equation"
    delta = b**2 - 4*a*c
    vertex_x = -b / (2*a)
    vertex_y = -(delta) / (4*a)
    
    if delta > 0:
        r1 = (-b + math.sqrt(delta)) / (2*a)
        r2 = (-b - math.sqrt(delta)) / (2*a)
        return {"roots": [r1, r2], "vertex": (vertex_x, vertex_y), "type": "Two real roots"}
    elif delta == 0:
        r = -b / (2*a)
        return {"roots": [r], "vertex": (vertex_x, vertex_y), "type": "One repeated root"}
    else:
        return {"roots": [], "vertex": (vertex_x, vertex_y), "type": "Complex conjugate roots"}`,
    },
    predictPrompt: {
      question: 'If the discriminant Δ = b² - 4ac of a quadratic equation is negative (Δ < 0), what does this indicate about the graph y = ax² + bx + c?',
      options: [
        { id: 'no_x_intercepts', text: 'The parabola never touches or crosses the horizontal x-axis', correct: true },
        { id: 'two_x_intercepts', text: 'The parabola crosses the x-axis at two distinct points', correct: false },
        { id: 'tangent_x', text: 'The parabola is tangent to the x-axis at a single point', correct: false },
        { id: 'vertical_line', text: 'The graph degenerates into a vertical line', correct: false },
      ],
      explanation: 'When Δ < 0, √Δ is imaginary, so there are no real roots. Geometrically, this means the parabola lies entirely above or entirely below the x-axis without intersecting it.',
      whatIfFollowUp: 'If a > 0 and Δ < 0, is the value of ax² + bx + c always strictly positive for every real number x?',
    },
  },
};

/**
 * Returns STEM connection data for an experiment, with dynamic fallback.
 */
export function getStemConnections(experimentId, discipline = 'Science') {
  if (STEM_CONNECTIONS[experimentId]) {
    return STEM_CONNECTIONS[experimentId];
  }

  // Dynamic discipline-aware fallback
  return {
    discipline,
    science: `Scientific principles and empirical natural laws governing ${experimentId.replace(/-/g, ' ')}.`,
    technology: 'Digital data acquisition, high-speed telemetry, microcontrollers, and modern precision instrumentation.',
    engineering: 'Real-world industrial equipment, physical systems engineering, prototype design, and safety constraints.',
    mathematics: 'Quantitative formulas, graphical relationships, unit conversions, and algebraic calculations.',
    stemTags: ['Science', 'Technology', 'Engineering', 'Mathematics'],
    realWorldCaseStudy: {
      title: `Industrial Applications of ${experimentId.replace(/-/g, ' ').toUpperCase()}`,
      industry: `${discipline} & Applied Engineering`,
      description: `Technologists and engineers apply ${experimentId.replace(/-/g, ' ')} principles to build sustainable systems, improve diagnostic accuracy, and optimize resource efficiency.`,
      career: `${discipline} Systems Specialist / STEM Research Analyst`,
    },
    microcontrollerSnippet: {
      platform: 'MicroPython / Arduino',
      title: 'Digital Sensor Interface & Data Acquisition Loop',
      code: `// Generic STEM sensor reading and telemetry pipeline
void setup() {
  Serial.begin(115200);
}

void loop() {
  int rawValue = analogRead(A0);
  float convertedValue = rawValue * (3.3 / 4095.0);
  Serial.printf("Telemetry reading: %.3f units\\n", convertedValue);
  delay(500);
}`,
    },
    predictPrompt: {
      question: `What primary trend do you anticipate when running the ${experimentId.replace(/-/g, ' ')} simulation?`,
      options: [
        { id: 'proportional', text: 'Dependent output variable will respond proportionally to input', correct: true },
        { id: 'inverse', text: 'Output variable will decrease as input increases', correct: false },
        { id: 'random', text: 'Output will fluctuate unpredictably', correct: false },
      ],
      explanation: 'Physical and biological systems obey deterministic mathematical laws. Inputs drive predictable outputs governed by conservation principles.',
      whatIfFollowUp: 'How would external environmental noise affect these measurements in a physical laboratory?',
    },
  };
}

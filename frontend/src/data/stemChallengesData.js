/**
 * STEM Challenges Repository for LabXAI.
 * 8 Interactive, real-world engineering problem challenges with live mathematical validation,
 * constraints checking, multi-criteria scoring, and reflection.
 */

export const STEM_CHALLENGES = [
  {
    id: 'led-circuit-guard',
    title: 'Design a Safe Bicycle LED Headlamp Circuit',
    discipline: 'Physics & Electrical Engineering',
    difficulty: 'Basic',
    durationMinutes: 20,
    tags: ['Physics', 'Technology', 'Engineering', 'Mathematics'],
    problemStatement:
      'A school bicycle safety project requires an ultra-bright LED headlight powered by a 9V battery. Standard high-brightness LEDs burn out immediately if forward current exceeds 25 mA, while anything below 12 mA is too dim for night cycling. Size the power supply and current-limiting resistor to achieve an optimal operating current between 15 mA and 22 mA.',
    connections: {
      science: 'Ohm’s law and semiconductor forward diode voltage drop (V_f ≈ 2.2V).',
      technology: 'Battery voltage stability and LED illumination efficiency.',
      engineering: 'Resistor power dissipation sizing (P = I²R) to prevent component overheating.',
      mathematics: 'Current equation: I = (V_supply - V_led) / R_limiter. Convert mA to A.',
    },
    constraints: [
      { id: 'curr_min', label: 'Minimum safe current: 15.0 mA (adequate brightness)', minVal: 15.0 },
      { id: 'curr_max', label: 'Maximum safe current: 22.0 mA (prevents burnout)', maxVal: 22.0 },
      { id: 'res_power', label: 'Resistor power dissipation < 0.25 W (standard ¼W resistor)', maxVal: 0.25 },
    ],
    parameters: [
      { name: 'supplyVoltage', label: 'Battery Voltage (V)', min: 3.0, max: 12.0, step: 0.5, default: 9.0, unit: 'V' },
      { name: 'resistorValue', label: 'Limiting Resistor (Ω)', min: 100, max: 1000, step: 10, default: 470, unit: 'Ω' },
      { name: 'ledCount', label: 'Series LED Count', min: 1, max: 3, step: 1, default: 1, unit: 'LEDs' },
    ],
    evaluateSolution: (params) => {
      const vSupply = params.supplyVoltage;
      const r = params.resistorValue;
      const count = params.ledCount;
      const vDrop = count * 2.2; // 2.2V per LED

      if (vSupply <= vDrop) {
        return {
          success: false,
          current_mA: 0,
          power_W: 0,
          score: 10,
          message: 'Insufficient voltage! The battery voltage is lower than the total forward voltage drop of the LEDs.',
          suggestion: 'Increase battery voltage or decrease the number of series LEDs.',
        };
      }

      const current_A = (vSupply - vDrop) / r;
      const current_mA = current_A * 1000.0;
      const resistorPower_W = current_A * current_A * r;

      const isCurrentOk = current_mA >= 15.0 && current_mA <= 22.0;
      const isPowerOk = resistorPower_W <= 0.25;
      const success = isCurrentOk && isPowerOk;

      let score = 50;
      if (isCurrentOk) score += 35;
      if (isPowerOk) score += 15;

      let message = '';
      let suggestion = '';

      if (success) {
        message = `Outstanding engineering design! Your circuit operates at ${current_mA.toFixed(1)} mA, delivering bright night illumination while drawing only ${resistorPower_W.toFixed(3)} W on the resistor.`;
        suggestion = 'Next step: Calculate battery runtime assuming a 500 mAh 9V battery capacity (Hours = Capacity / Current).';
      } else if (current_mA > 22.0) {
        message = `Danger: Current is ${current_mA.toFixed(1)} mA! The LED will overheat and burn out quickly.`;
        suggestion = 'Increase the resistor value (Ω) to choke excessive current.';
      } else if (current_mA < 15.0) {
        message = `Circuit is underpowered! Current is only ${current_mA.toFixed(1)} mA. The lamp is too dim.`;
        suggestion = 'Decrease the resistor value or increase battery voltage.';
      } else if (!isPowerOk) {
        message = `Resistor overload! Power dissipation is ${resistorPower_W.toFixed(3)} W, which will melt a standard 0.25W resistor.`;
        suggestion = 'Increase resistance or select a higher wattage rated ceramic resistor.';
      }

      return {
        success,
        score,
        current_mA: Number(current_mA.toFixed(2)),
        power_W: Number(resistorPower_W.toFixed(4)),
        message,
        suggestion,
      };
    },
    reflection: 'Why do electronic engineers always prefer a current-limiting resistor over simply matching the battery voltage to the exact diode rating?',
  },

  {
    id: 'water-filtration-eco',
    title: 'Design a Multi-Stage Gravity Water Filtration System',
    discipline: 'Chemistry & Environmental Engineering',
    difficulty: 'Intermediate',
    durationMinutes: 25,
    tags: ['Chemistry', 'Engineering', 'Science', 'Mathematics'],
    problemStatement:
      'A rural government school needs a zero-electricity gravity water filtration column to treat turbid river water (Turbidity: 85 NTU). Construct a multi-stage column using gravel, silica sand, and activated carbon. The filtered water must achieve safe turbidity below 4.0 NTU while sustaining a practical flow rate of at least 1.5 Liters per hour.',
    connections: {
      science: 'Colloidal suspension sedimentation, surface adsorption of organic chemicals on activated charcoal, and physical straining.',
      technology: 'Optical turbidity sensors (infrared 860 nm nephelometric scattering).',
      engineering: 'Hydraulic head pressure, particle porosity gradient, and filter backwash longevity.',
      mathematics: 'Darcy’s law for flow through porous media: Q = (K · A · Δh) / L. Exponential turbidity reduction.',
    },
    constraints: [
      { id: 'turbidity_max', label: 'Maximum effluent turbidity < 4.0 NTU (safe drinking standard)', maxVal: 4.0 },
      { id: 'flow_min', label: 'Minimum flow rate ≥ 1.5 L/hr (must provide enough drinking water)', minVal: 1.5 },
      { id: 'height_max', label: 'Total column height ≤ 50 cm (fits on standard school bench)', maxVal: 50.0 },
    ],
    parameters: [
      { name: 'gravelLayerCm', label: 'Gravel Bed Depth (cm)', min: 4, max: 15, step: 1, default: 8, unit: 'cm' },
      { name: 'sandLayerCm', label: 'Silica Sand Depth (cm)', min: 8, max: 25, step: 1, default: 14, unit: 'cm' },
      { name: 'carbonLayerCm', label: 'Activated Carbon Depth (cm)', min: 4, max: 18, step: 1, default: 10, unit: 'cm' },
    ],
    evaluateSolution: (params) => {
      const g = params.gravelLayerCm;
      const s = params.sandLayerCm;
      const c = params.carbonLayerCm;
      const totalH = g + s + c;

      // Realistic empirical water treatment model
      // Sand removes particles; Carbon adsorbs organics & fine colloids; Gravel catches macro silt
      const turbidity = 85.0 * Math.exp(-(0.03 * g + 0.11 * s + 0.14 * c));
      // Flow rate in L/hr is inversely proportional to media bed resistance
      const flowRate = 180.0 / (1.5 * g + 4.8 * s + 3.2 * c);

      const isTurbidityOk = turbidity <= 4.0;
      const isFlowOk = flowRate >= 1.5;
      const isHeightOk = totalH <= 50.0;
      const success = isTurbidityOk && isFlowOk && isHeightOk;

      let score = 40;
      if (isTurbidityOk) score += 35;
      if (isFlowOk) score += 20;
      if (isHeightOk) score += 5;

      let message = '';
      let suggestion = '';

      if (success) {
        message = `Filter successfully certified! Effluent turbidity is ${turbidity.toFixed(2)} NTU (Crystal clear) with a steady flow of ${flowRate.toFixed(2)} L/hr.`;
        suggestion = 'Consider adding an affordable solar-disinfection (SODIS) UV clear bottle stage for microbial sterilization.';
      } else if (!isHeightOk) {
        message = `Column too tall! Total height is ${totalH} cm, exceeding the 50 cm bench limit.`;
        suggestion = 'Trim layer depths proportionally.';
      } else if (!isTurbidityOk) {
        message = `Water is still cloudy (${turbidity.toFixed(1)} NTU). The sand and carbon layers are too shallow.`;
        suggestion = 'Increase the fine sand or activated carbon layer depth.';
      } else if (!isFlowOk) {
        message = `Flow rate is too sluggish (${flowRate.toFixed(2)} L/hr). Students will have to wait too long for water.`;
        suggestion = 'Reduce dense fine sand depth slightly while maintaining sufficient carbon depth.';
      }

      return {
        success,
        score,
        turbidity_NTU: Number(turbidity.toFixed(2)),
        flowRate_Lph: Number(flowRate.toFixed(2)),
        totalHeight_cm: totalH,
        message,
        suggestion,
      };
    },
    reflection: 'Why does gravel go at the bottom above the nozzle rather than at the top of the water filter?',
  },

  {
    id: 'smart-irrigation-iot',
    title: 'Automated Soil-Moisture Irrigation Controller',
    discipline: 'Biology & Agricultural IoT',
    difficulty: 'Intermediate',
    durationMinutes: 20,
    tags: ['Biology', 'Technology', 'Engineering', 'Mathematics'],
    problemStatement:
      'Over-watering causes root hypoxia and fungal rot, while under-watering wilts crops. Build an automated IoT irrigation controller for a school vegetable garden. The pump must trigger only when soil moisture drops below threshold, delivering a calculated water volume to maintain root moisture between 45% and 70% while minimizing water waste.',
    connections: {
      science: 'Plant xylem capillary action, soil field capacity, transpiration rate, and root respiration.',
      technology: 'Capacitive soil moisture sensors (corrosion-resistant), 5V relay modules, and microcontroller timer loops.',
      engineering: 'Hydraulic pump duty cycle, drip emitter pressure regulation, and failsafe shutoff logic.',
      mathematics: 'Volumetric soil moisture percentage: VWC = (V_water / V_soil) × 100%. Flow volume V = Flow_rate × Duration.',
    },
    constraints: [
      { id: 'moisture_range', label: 'Maintained root moisture: 45% to 70%', minVal: 45.0, maxVal: 70.0 },
      { id: 'water_efficiency', label: 'Water waste ratio < 15% (avoid surface runoff)', maxVal: 15.0 },
    ],
    parameters: [
      { name: 'triggerThreshold', label: 'Pump Trigger Threshold (% Moisture)', min: 25, max: 55, step: 5, default: 40, unit: '%' },
      { name: 'pumpDurationSec', label: 'Pump Run Duration (Seconds)', min: 10, max: 90, step: 5, default: 35, unit: 's' },
      { name: 'emitterFlowLpm', label: 'Drip Emitter Flow (L/min)', min: 0.5, max: 3.0, step: 0.5, default: 1.0, unit: 'L/min' },
    ],
    evaluateSolution: (params) => {
      const trigger = params.triggerThreshold;
      const duration = params.pumpDurationSec;
      const flow = params.emitterFlowLpm;

      const waterDeliveredL = (flow * duration) / 60.0;
      // Resulting equilibrium moisture in 10L root bed
      const equilibriumMoisture = trigger + (waterDeliveredL / 10.0) * 120.0;
      const runoffWastePct = Math.max(0, (equilibriumMoisture - 70.0) * 1.8);

      const isMoistureOk = equilibriumMoisture >= 45.0 && equilibriumMoisture <= 70.0;
      const isWasteOk = runoffWastePct <= 15.0;
      const success = isMoistureOk && isWasteOk;

      let score = 40;
      if (isMoistureOk) score += 40;
      if (isWasteOk) score += 20;

      let message = '';
      let suggestion = '';

      if (success) {
        message = `Smart Irrigation Certified! Root moisture is sustained at ${equilibriumMoisture.toFixed(1)}% with only ${runoffWastePct.toFixed(1)}% runoff. Plants thrive with maximum water conservation.`;
        suggestion = 'Challenge extension: Incorporate weather forecast API data to delay watering if rain is predicted!';
      } else if (equilibriumMoisture < 45.0) {
        message = `Under-watered! Soil moisture reaches only ${equilibriumMoisture.toFixed(1)}%. Crops will wilt under sunlight.`;
        suggestion = 'Increase pump run duration or raise trigger threshold.';
      } else if (equilibriumMoisture > 70.0) {
        message = `Waterlogged soil (${equilibriumMoisture.toFixed(1)}%)! Roots are suffocating and water is wasted as runoff (${runoffWastePct.toFixed(1)}%).`;
        suggestion = 'Reduce pump run duration to prevent saturated runoff.';
      }

      return {
        success,
        score,
        equilibriumMoisture_pct: Number(equilibriumMoisture.toFixed(1)),
        waterDelivered_L: Number(waterDeliveredL.toFixed(2)),
        runoffWaste_pct: Number(runoffWastePct.toFixed(1)),
        message,
        suggestion,
      };
    },
    reflection: 'Why are capacitive moisture sensors preferred over cheap resistive nickel-plated probes for long-term farm automation?',
  },

  {
    id: 'thermal-heat-shield',
    title: 'Thermal Insulation Design for Vaccine Cold Chain Box',
    discipline: 'Physics & Materials Engineering',
    difficulty: 'Intermediate',
    durationMinutes: 25,
    tags: ['Physics', 'Materials', 'Engineering', 'Mathematics'],
    problemStatement:
      'Life-saving vaccines in remote health clinics must remain between 2°C and 8°C inside an ice-pack insulated cooler during a 10-hour transport in 38°C tropical summer heat. Design an insulation wall profile using polyurethane foam, aerogel, or vacuum space to limit internal temperature rise to less than 6.0°C over 10 hours while keeping cooler weight under 4.5 kg.',
    connections: {
      science: 'Fourier’s law of thermal conduction: Q/t = (k · A · ΔT) / d. Heat capacity and latent heat of fusion.',
      technology: 'Digital thermistors (NTC) and cold-chain temperature data loggers.',
      engineering: 'Thermal conductivity (k-value), wall thickness constraints, and lightweight portable packaging.',
      mathematics: 'Rate of heat transfer Q = (k · A · ΔT · t) / d. Mass = Volume × Density.',
    },
    constraints: [
      { id: 'temp_rise_max', label: 'Maximum 10-hour temperature rise < 6.0°C (vaccine stays cold)', maxVal: 6.0 },
      { id: 'cooler_weight_max', label: 'Total insulated box weight ≤ 4.5 kg (easily portable)', maxVal: 4.5 },
    ],
    parameters: [
      { name: 'foamThicknessMm', label: 'Polyurethane Foam Thickness (mm)', min: 10, max: 70, step: 5, default: 35, unit: 'mm' },
      { name: 'reflectiveFoilLayers', label: 'Radiation Reflective Foil Layers', min: 1, max: 4, step: 1, default: 2, unit: 'layers' },
      { name: 'icePackCount', label: 'Standard 400g Ice Packs', min: 2, max: 6, step: 1, default: 4, unit: 'packs' },
    ],
    evaluateSolution: (params) => {
      const d = params.foamThicknessMm / 1000.0; // in meters
      const foil = params.reflectiveFoilLayers;
      const iceCount = params.icePackCount;

      const surfaceArea = 0.85; // m^2 box area
      const deltaT = 38.0 - 4.0; // 34 C difference
      const foamConductivity = 0.024; // W/mK for polyurethane

      // Effective heat flux in Watts
      const conductiveWatts = (foamConductivity * surfaceArea * deltaT) / d;
      const effectiveWatts = conductiveWatts * Math.pow(0.85, foil); // each foil reflects 15% radiant flux

      // Total heat energy entering in 10 hours (36,000 seconds)
      const heatJoules10Hr = effectiveWatts * 36000.0;

      // Latent heat absorbed by melting ice (334 kJ/kg)
      const iceMassKg = iceCount * 0.40;
      const iceLatentCapacityJ = iceMassKg * 334000.0;

      let tempRise = 0;
      if (heatJoules10Hr > iceLatentCapacityJ) {
        // Ice completely melted; remaining heat warms water (4184 J/kg*C)
        const surplusJ = heatJoules10Hr - iceLatentCapacityJ;
        tempRise = surplusJ / (iceMassKg * 4184.0);
      } else {
        // Ice still present, temperature rise is minimal due to phase change plateau
        tempRise = (heatJoules10Hr / iceLatentCapacityJ) * 1.8;
      }

      const boxEmptyMass = 1.2; // kg plastic shell
      const foamMass = surfaceArea * d * 35.0; // density 35 kg/m^3
      const totalWeightKg = boxEmptyMass + foamMass + iceMassKg;

      const isTempOk = tempRise <= 6.0;
      const isWeightOk = totalWeightKg <= 4.5;
      const success = isTempOk && isWeightOk;

      let score = 40;
      if (isTempOk) score += 40;
      if (isWeightOk) score += 20;

      let message = '';
      let suggestion = '';

      if (success) {
        message = `Cold chain verified! Temperature rise is only ${tempRise.toFixed(1)}°C after 10 hours, and total weight is ${totalWeightKg.toFixed(2)} kg. Vaccines remain completely safe.`;
        suggestion = 'Can you optimize the weight even further by swapping one ice pack for a reflective vacuum panel?';
      } else if (!isTempOk) {
        message = `Cold chain breach! Temperature rose by ${tempRise.toFixed(1)}°C. Vaccines spoiled!`;
        suggestion = 'Increase foam insulation thickness or add more ice packs.';
      } else if (!isWeightOk) {
        message = `Box is too heavy (${totalWeightKg.toFixed(2)} kg)! Health workers cannot carry this across rough terrain.`;
        suggestion = 'Reduce ice packs or optimize wall thickness.';
      }

      return {
        success,
        score,
        temperatureRise_C: Number(tempRise.toFixed(1)),
        totalWeight_kg: Number(totalWeightKg.toFixed(2)),
        heatLoss_Watts: Number(effectiveWatts.toFixed(2)),
        message,
        suggestion,
      };
    },
    reflection: 'Why does ice stay at exactly 0°C while it melts rather than gradually warming up during heat absorption?',
  },

  {
    id: 'seismic-bridge-builder',
    title: 'Earthquake-Resistant Structural Resonance Damper',
    discipline: 'Physics & Civil Engineering',
    difficulty: 'Advanced',
    durationMinutes: 30,
    tags: ['Physics', 'Civil', 'Engineering', 'Mathematics'],
    problemStatement:
      'Seismic surface waves from a simulated magnitude 7.0 earthquake oscillate with a dominant ground frequency of 2.5 Hz. A suspension footbridge will undergo catastrophic harmonic resonance if its natural frequency coincides with 2.5 Hz (within ±0.4 Hz). Tune the bridge pier stiffness, deck mass, and viscous damper to keep peak sway displacement under 12 cm during ground shaking.',
    connections: {
      science: 'Forced harmonic oscillation, resonance catastrophe, damping ratio ζ, and kinetic-potential energy interchange.',
      technology: 'Piezoelectric seismic accelerometers, shaking table simulators, and real-time structural health monitoring.',
      engineering: 'Base isolators, lead-rubber bearings, tuned mass dampers, and cross-braced shear trusses.',
      mathematics: 'Natural frequency f_n = (1 / 2π) √(k / m). Damped magnification factor Q = 1 / (2ζ).',
    },
    constraints: [
      { id: 'sway_max', label: 'Maximum lateral sway < 12.0 cm (prevents structural collapse)', maxVal: 12.0 },
      { id: 'resonance_gap', label: 'Natural frequency must be at least 0.5 Hz away from 2.5 Hz', minVal: 0.5 },
    ],
    parameters: [
      { name: 'deckMassTons', label: 'Bridge Deck Mass (Tonnes)', min: 10, max: 80, step: 5, default: 35, unit: 'T' },
      { name: 'pierStiffnessMN', label: 'Pier Lateral Stiffness (MN/m)', min: 5, max: 40, step: 2, default: 18, unit: 'MN/m' },
      { name: 'dampingRatioPct', label: 'Viscous Damper Ratio (%)', min: 2, max: 20, step: 1, default: 8, unit: '%' },
    ],
    evaluateSolution: (params) => {
      const m = params.deckMassTons * 1000.0; // kg
      const k = params.pierStiffnessMN * 1000000.0; // N/m
      const zeta = params.dampingRatioPct / 100.0;

      // Natural frequency in Hz
      const fn = (1.0 / (2.0 * Math.PI)) * Math.sqrt(k / m);
      const seismicFreq = 2.5; // Hz
      const freqDiff = Math.abs(fn - seismicFreq);

      // Frequency ratio r = f_seismic / f_n
      const r = seismicFreq / fn;
      // Dynamic magnification factor
      const dynamicMag = 1.0 / Math.sqrt(Math.pow(1.0 - r * r, 2) + Math.pow(2.0 * zeta * r, 2));
      // Base ground displacement of 3.5 cm
      const peakSwayCm = 3.5 * dynamicMag;

      const isSwayOk = peakSwayCm <= 12.0;
      const isResonanceOk = freqDiff >= 0.5;
      const success = isSwayOk && isResonanceOk;

      let score = 30;
      if (isSwayOk) score += 45;
      if (isResonanceOk) score += 25;

      let message = '';
      let suggestion = '';

      if (success) {
        message = `Bridge passed the seismic safety test! Natural frequency is ${fn.toFixed(2)} Hz (well clear of the 2.5 Hz hazard), keeping peak sway to just ${peakSwayCm.toFixed(1)} cm.`;
        suggestion = 'Try testing higher damper ratios to see how quickly vibrations die down after the quake ends.';
      } else if (!isResonanceOk) {
        message = `CRITICAL RESONANCE! Natural frequency is ${fn.toFixed(2)} Hz, directly in the earthquake resonance trap. Peak sway reached ${peakSwayCm.toFixed(1)} cm!`;
        suggestion = 'Shift natural frequency by stiffening piers (increase k) or changing deck mass (m).';
      } else {
        message = `Excessive sway (${peakSwayCm.toFixed(1)} cm). The bridge structure sustained dangerous plastic deformation.`;
        suggestion = 'Increase damping ratio or increase pier stiffness.';
      }

      return {
        success,
        score,
        naturalFreq_Hz: Number(fn.toFixed(2)),
        freqDifference_Hz: Number(freqDiff.toFixed(2)),
        peakSway_cm: Number(peakSwayCm.toFixed(1)),
        message,
        suggestion,
      };
    },
    reflection: 'Why did the famous Tacoma Narrows Bridge collapse in 1940 even though the wind speed was only 42 mph?',
  },

  {
    id: 'solar-microgrid',
    title: 'Solar PV Angle & Load Optimization for Maximum Power',
    discipline: 'Physics & Clean Energy',
    difficulty: 'Basic',
    durationMinutes: 15,
    tags: ['Physics', 'Energy', 'Engineering', 'Mathematics'],
    problemStatement:
      'A solar-powered rural science classroom in Bengaluru (Latitude 13°N) relies on a 200W rooftop photovoltaic array. Adjust panel tilt angle, daylight tracking, and inverter load resistance to generate at least 160 Watts of usable clean power during midday sunlight.',
    connections: {
      science: 'Photoelectric effect, solar irradiance angle of incidence (Lambert’s cosine law), and maximum power point (MPPT).',
      technology: 'Maximum Power Point Tracking (MPPT) DC-DC buck-boost converters and solar pyranometers.',
      engineering: 'Solar panel roof mount aerodynamic loading and grid-tied micro-inverter synchronization.',
      mathematics: 'Irradiance power P = P_peak × cos(θ_incidence). Electrical power P = V² / R.',
    },
    constraints: [
      { id: 'power_min', label: 'Minimum power output ≥ 160.0 Watts (powers laptops & lights)', minVal: 160.0 },
      { id: 'efficiency_min', label: 'System efficiency ≥ 80%', minVal: 80.0 },
    ],
    parameters: [
      { name: 'panelTiltDeg', label: 'Panel Tilt Angle (Degrees from horizontal)', min: 0, max: 60, step: 1, default: 28, unit: '°' },
      { name: 'solarAltitudeDeg', label: 'Sun Midday Elevation (Degrees)', min: 40, max: 90, step: 5, default: 75, unit: '°' },
      { name: 'loadResistorOhm', label: 'Inverter Load Resistance (Ω)', min: 2, max: 15, step: 0.5, default: 8, unit: 'Ω' },
    ],
    evaluateSolution: (params) => {
      const tilt = params.panelTiltDeg;
      const sunElev = params.solarAltitudeDeg;
      const r = params.loadResistorOhm;

      // Angle of incidence: when sun elevation + tilt = 90 deg, rays hit perpendicular (cos(0) = 1)
      const rayAngleFromNormal = Math.abs(90.0 - sunElev - tilt);
      const cosFactor = Math.max(0, Math.cos(rayAngleFromNormal * (Math.PI / 180.0)));

      // Optimal internal resistance of this 200W panel is ~6.5 Ohms
      const rOptimal = 6.5;
      const mpptMismatch = 1.0 - Math.pow((r - rOptimal) / 12.0, 2);
      const electricalFactor = Math.max(0.4, Math.min(1.0, mpptMismatch));

      const powerGenerated = 200.0 * cosFactor * electricalFactor;
      const efficiency = (powerGenerated / 200.0) * 100.0;

      const isPowerOk = powerGenerated >= 160.0;
      const isEffOk = efficiency >= 80.0;
      const success = isPowerOk && isEffOk;

      let score = 30;
      if (isPowerOk) score += 50;
      if (isEffOk) score += 20;

      let message = '';
      let suggestion = '';

      if (success) {
        message = `Maximum Solar Harvest Achieved! System generates ${powerGenerated.toFixed(1)} W at ${efficiency.toFixed(1)}% efficiency, powering the classroom equipment cleanly.`;
        suggestion = 'Observe how changing the season (sun elevation angle) requires tilting the panels twice a year in spring and autumn.';
      } else if (cosFactor < 0.85) {
        message = `Poor tilt angle! Sun rays strike the panels at a shallow oblique angle, losing ${(100 - cosFactor * 100).toFixed(0)}% of incoming sunlight.`;
        suggestion = 'Adjust panel tilt angle so panel normal points directly at the sun.';
      } else {
        message = `Impedance mismatch! Generated power is ${powerGenerated.toFixed(1)} W because load resistance (${r} Ω) is far from the solar cell’s maximum power point (~6.5 Ω).`;
        suggestion = 'Tune load resistance closer to 6.5 Ω to match panel impedance.';
      }

      return {
        success,
        score,
        powerOutput_Watts: Number(powerGenerated.toFixed(1)),
        systemEfficiency_pct: Number(efficiency.toFixed(1)),
        incidenceLoss_pct: Number(((1 - cosFactor) * 100).toFixed(1)),
        message,
        suggestion,
      };
    },
    reflection: 'Why does a solar panel produce zero power when short-circuited (0 Ohms) even though current is at its maximum possible value?',
  },

  {
    id: 'respiratory-biometrics',
    title: 'Spirometer Diagnostic & Minute Ventilation Model',
    discipline: 'Biology & Biomedical Engineering',
    difficulty: 'Intermediate',
    durationMinutes: 20,
    tags: ['Biology', 'Medical', 'Engineering', 'Mathematics'],
    problemStatement:
      'A school sports medicine clinic needs to analyze student lung capacity before a 1500m athletic race. Using an electronic differential-pressure spirometer, calibrate tidal volume (V_T) and breathing rate (RR) to deliver a target minute ventilation (V_E) between 18.0 L/min and 30.0 L/min during moderate athletic exertion while ensuring airway flow resistance does not exceed safe peak alveolar pressure.',
    connections: {
      science: 'Pulmonary physiology, dead-space ventilation, oxygen uptake rate VO₂ max, and respiratory muscle biomechanics.',
      technology: 'Fleisch pneumotachograph differential-pressure flow sensors, heated wire anemometers, and electronic capnometers.',
      engineering: 'Calibration algorithms for ambient temperature and pressure saturated (BTPS) corrections in medical instruments.',
      mathematics: 'Minute ventilation V_E = V_T × RR. Alveolar ventilation V_A = (V_T - V_D) × RR where V_D is anatomical dead space (~150 mL).',
    },
    constraints: [
      { id: 've_target', label: 'Minute ventilation between 18.0 L/min and 30.0 L/min', minVal: 18.0, maxVal: 30.0 },
      { id: 'alv_eff', label: 'Effective alveolar ventilation ratio > 75%', minVal: 75.0 },
    ],
    parameters: [
      { name: 'tidalVolumeMl', label: 'Tidal Volume per Breath (mL)', min: 400, max: 1800, step: 50, default: 950, unit: 'mL' },
      { name: 'breathingRate', label: 'Breathing Rate (Breaths/min)', min: 10, max: 40, step: 1, default: 22, unit: 'BPM' },
      { name: 'deadSpaceMl', label: 'Anatomical Dead Space (mL)', min: 120, max: 180, step: 10, default: 150, unit: 'mL' },
    ],
    evaluateSolution: (params) => {
      const vt = params.tidalVolumeMl;
      const rr = params.breathingRate;
      const vd = params.deadSpaceMl;

      const minuteVentilationL = (vt * rr) / 1000.0;
      const alveolarVentilationL = ((vt - vd) * rr) / 1000.0;
      const alveolarEfficiency = (alveolarVentilationL / minuteVentilationL) * 100.0;

      const isVeOk = minuteVentilationL >= 18.0 && minuteVentilationL <= 30.0;
      const isEffOk = alveolarEfficiency >= 75.0;
      const success = isVeOk && isEffOk;

      let score = 40;
      if (isVeOk) score += 35;
      if (isEffOk) score += 25;

      let message = '';
      let suggestion = '';

      if (success) {
        message = `Optimal Athletic Breathing Pattern! Minute ventilation is ${minuteVentilationL.toFixed(1)} L/min with ${alveolarEfficiency.toFixed(1)}% reaching alveoli for active oxygen absorption.`;
        suggestion = 'Deep, steady breathing is dramatically more efficient for runners than rapid, shallow breathing.';
      } else if (!isEffOk) {
        message = `Inefficient rapid shallow breathing! Although total ventilation is ${minuteVentilationL.toFixed(1)} L/min, ${((100 - alveolarEfficiency)).toFixed(0)}% of air is wasted in anatomical dead space!`;
        suggestion = 'Train the athlete to take deeper breaths (higher tidal volume) at a slightly lower respiratory rate.';
      } else if (minuteVentilationL < 18.0) {
        message = `Hypoventilation (${minuteVentilationL.toFixed(1)} L/min)! The athlete will experience lactic acid buildup and oxygen debt.`;
        suggestion = 'Increase tidal volume or breathing rate.';
      } else {
        message = `Hyperventilation (${minuteVentilationL.toFixed(1)} L/min)! Excessive CO2 blowout may cause respiratory alkalosis and dizziness.`;
        suggestion = 'Moderate breathing frequency to stabilize ventilation.';
      }

      return {
        success,
        score,
        minuteVentilation_Lpm: Number(minuteVentilationL.toFixed(1)),
        alveolarVentilation_Lpm: Number(alveolarVentilationL.toFixed(1)),
        alveolarEfficiency_pct: Number(alveolarEfficiency.toFixed(1)),
        message,
        suggestion,
      };
    },
    reflection: 'Why does shallow, panting breathing cause extreme fatigue even when the lungs are moving huge amounts of air in and out?',
  },

  {
    id: 'parabolic-arch-bridge',
    title: 'Design a Parabolic Arch Footbridge with Distributed Load',
    discipline: 'Mathematics & Structural Engineering',
    difficulty: 'Advanced',
    durationMinutes: 30,
    tags: ['Mathematics', 'Civil', 'Engineering', 'Physics'],
    problemStatement:
      'Design a 40-meter pedestrian arch footbridge across a river. The arch follows a quadratic equation y(x) = -a · x² + h. Under a uniform deck load of 15 kN/m, determine the optimal arch crown height (h) and structural steel cross-section to keep maximum horizontal thrust at the river bank abutments under 750 kN while maintaining vertical clearance of at least 8.0 meters for ferry boats.',
    connections: {
      science: 'Equilibrium of coplanar forces (ΣFx = 0, ΣFy = 0, ΣM = 0), compression load paths in stone/steel arches.',
      technology: 'Finite element method (FEM) stress analysis software and laser deflection strain gauges.',
      engineering: 'Arch crown hinge thrust transfer, abutment soil bearing capacity, and thermal expansion joints.',
      mathematics: 'Quadratic function modeling y = -a(x - 20)² + h. Slope derivative dy/dx = -2a(x - 20). Horizontal thrust H = (w · L²) / (8 · h).',
    },
    constraints: [
      { id: 'height_clearance', label: 'Arch crown height h ≥ 8.0 meters (ferry clearance)', minVal: 8.0 },
      { id: 'thrust_max', label: 'Abutment horizontal thrust H ≤ 750.0 kN (safe foundation limit)', maxVal: 750.0 },
      { id: 'cost_index', label: 'Material cost index < 120 units', maxVal: 120.0 },
    ],
    parameters: [
      { name: 'archHeightM', label: 'Arch Crown Height h (meters)', min: 5.0, max: 16.0, step: 0.5, default: 9.5, unit: 'm' },
      { name: 'spanLengthM', label: 'Span Length L (meters)', min: 30.0, max: 50.0, step: 2.0, default: 40.0, unit: 'm' },
      { name: 'deckUniformLoad', label: 'Design Uniform Deck Load (kN/m)', min: 10.0, max: 25.0, step: 1.0, default: 15.0, unit: 'kN/m' },
    ],
    evaluateSolution: (params) => {
      const h = params.archHeightM;
      const L = params.spanLengthM;
      const w = params.deckUniformLoad;

      // Exact structural arch mechanics: Horizontal thrust H = (w * L^2) / (8 * h)
      const horizontalThrustKN = (w * L * L) / (8.0 * h);
      // Vertical abutment reaction V = (w * L) / 2
      const verticalReactionKN = (w * L) / 2.0;
      // Resultant abutment thrust force
      const resultantThrustKN = Math.sqrt(horizontalThrustKN * horizontalThrustKN + verticalReactionKN * verticalReactionKN);
      // Material cost scales with arc length and load capacity
      const approxArchLength = L * (1.0 + (8.0 / 3.0) * Math.pow(h / L, 2));
      const costIndex = (approxArchLength * 1.5) + (resultantThrustKN / 25.0);

      const isHeightOk = h >= 8.0;
      const isThrustOk = horizontalThrustKN <= 750.0;
      const isCostOk = costIndex <= 120.0;
      const success = isHeightOk && isThrustOk && isCostOk;

      let score = 30;
      if (isHeightOk) score += 30;
      if (isThrustOk) score += 30;
      if (isCostOk) score += 10;

      let message = '';
      let suggestion = '';

      if (success) {
        message = `Arch Design Approved! Horizontal thrust is safe at ${horizontalThrustKN.toFixed(1)} kN, boat clearance is ${h.toFixed(1)} m, and material cost index is ${costIndex.toFixed(1)}.`;
        suggestion = 'Examine how the horizontal thrust H is inversely proportional to arch height h: a flatter arch creates enormous outward pushing force on the riverbanks!';
      } else if (!isHeightOk) {
        message = `Insufficient boat clearance! Arch crown is only ${h.toFixed(1)} m tall (minimum 8.0 m required).`;
        suggestion = 'Increase arch crown height.';
      } else if (!isThrustOk) {
        message = `Abutment blowout! Horizontal outward thrust is ${horizontalThrustKN.toFixed(1)} kN, exceeding the 750 kN foundation limit. River banks will slide!`;
        suggestion = 'Increase arch height h to reduce horizontal thrust vector.';
      } else {
        message = `Cost exceeded (${costIndex.toFixed(1)} units)! Arch is too tall, requiring excessive steel ribs and reinforcement.`;
        suggestion = 'Optimize height slightly lower while keeping boat clearance above 8m.';
      }

      return {
        success,
        score,
        horizontalThrust_kN: Number(horizontalThrustKN.toFixed(1)),
        resultantThrust_kN: Number(resultantThrustKN.toFixed(1)),
        archLength_m: Number(approxArchLength.toFixed(1)),
        costIndex: Number(costIndex.toFixed(1)),
        message,
        suggestion,
      };
    },
    reflection: 'Why do pure compression arches not require tensile reinforcing steel down their center line like standard flat beam girders?',
  },
];

export function getStemChallenge(id) {
  return STEM_CHALLENGES.find((c) => c.id === id) || STEM_CHALLENGES[0];
}

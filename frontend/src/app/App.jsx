import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Beaker,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  FlaskConical,
  Gauge,
  Globe2,
  Home,
  Lightbulb,
  Menu,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import { calculateCurrent, getCircuitObservation } from '../../../shared/simulations/circuits/circuitLogic'
import experimentData from '../../../shared/data/experiments'
import { CircuitBuilder } from '../features/virtual-lab/circuits/CircuitBuilder'
import '../styles/App.css'

const experimentIcons = { circuit: Zap, reactions: FlaskConical, body: Beaker, reflection: Sparkles }
const experimentColors = { circuit: 'blue', reactions: 'purple', body: 'green', reflection: 'orange' }
const experiments = experimentData.map((experiment) => ({
  ...experiment,
  icon: experimentIcons[experiment.id],
  color: experimentColors[experiment.id],
}))

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'experiments', label: 'Experiments', icon: Beaker },
  { id: 'dashboard', label: 'My learning', icon: TrendingUp },
]

function App() {
  const [page, setPage] = useState('home')
  const [language, setLanguage] = useState('English')
  const [mobileMenu, setMobileMenu] = useState(false)

  const goTo = (nextPage) => {
    setPage(nextPage)
    setMobileMenu(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => goTo('home')} aria-label="Go to LabXAI home">
          <span className="brand-mark"><Zap size={18} fill="currentColor" /></span>
          <span>Lab<span>X</span>AI</span>
        </button>
        <button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">
          {mobileMenu ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`main-nav ${mobileMenu ? 'open' : ''}`}>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => goTo(id)}>
              <Icon size={16} /> {label}
            </button>
          ))}
          <button onClick={() => goTo('about')}>About</button>
        </nav>
        <div className="top-actions">
          <label className="language-picker"><Globe2 size={16} /><select value={language} onChange={(event) => setLanguage(event.target.value)}><option>English</option><option>ಕನ್ನಡ</option></select><ChevronDown size={14} /></label>
          <button className="text-button" onClick={() => goTo('dashboard')}>Log in</button>
          <button className="button button-small" onClick={() => goTo('experiments')}>Get started <ArrowRight size={15} /></button>
        </div>
      </header>

      {page === 'home' && <HomePage goTo={goTo} />}
      {page === 'dashboard' && <Dashboard goTo={goTo} />}
      {page === 'experiments' && <ExperimentsPage goTo={goTo} />}
      {page === 'lab' && <CircuitLab goTo={goTo} />}
      {page === 'about' && <AboutPage goTo={goTo} />}
    </div>
  )
}

function HomePage({ goTo }) {
  return <>
    <main>
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> The smarter way to learn science</div>
          <h1>Learn science.<br /><em>Explore beyond.</em></h1>
          <p>Turn curiosity into understanding with safe, interactive virtual experiments built for the scientists of tomorrow.</p>
          <div className="hero-actions"><button className="button" onClick={() => goTo('experiments')}>Explore experiments <ArrowRight size={17} /></button><button className="button button-ghost" onClick={() => goTo('about')}>Discover LabXAI</button></div>
          <div className="hero-trust"><div className="avatar-stack"><span>AR</span><span>SK</span><span>+2k</span></div><span>Trusted by curious learners<br /><strong>Classes 6–10</strong></span></div>
        </div>
        <CircuitPreview goTo={goTo} />
      </section>

      <section className="section section-tight">
        <div className="section-heading centered"><span className="eyebrow">Why LabXAI</span><h2>Science is better when<br /><span>you experience it.</span></h2><p>Everything you need to move from memorising facts to understanding how the world works.</p></div>
        <div className="feature-grid">
          <Feature icon={Zap} title="Interactive virtual labs" text="Experiment freely in a safe space. No spills, no limits, just discovery." color="blue" />
          <Feature icon={Bot} title="AI science assistant" text="Ask questions in simple language and get explanations that make sense." color="purple" />
          <Feature icon={Globe2} title="Learn your way" text="Explore science in English or Kannada, with clear terminology." color="green" />
          <Feature icon={TrendingUp} title="See your progress" text="Build confidence as you complete experiments and quizzes." color="orange" />
        </div>
      </section>

      <section className="section experiments-preview">
        <div className="section-heading split"><div><span className="eyebrow">Start exploring</span><h2>Popular experiments</h2></div><button className="link-button" onClick={() => goTo('experiments')}>View all experiments <ArrowRight size={16} /></button></div>
        <div className="experiment-grid">{experiments.map((experiment) => <ExperimentCard key={experiment.id} experiment={experiment} goTo={goTo} />)}</div>
      </section>

      <section className="section how-section"><div className="section-heading centered"><span className="eyebrow">Your learning journey</span><h2>From curious to confident.</h2></div><div className="steps">{['Select an experiment', 'Explore the virtual lab', 'Experiment with variables', 'Understand the results', 'Ask your questions'].map((step, index) => <div className="step" key={step}><span className="step-number">0{index + 1}</span><div><h3>{step}</h3><p>{['Choose a topic that sparks your curiosity.', 'Meet the components and see how they work.', 'Change parameters and make predictions.', 'Use real data to connect cause and effect.', 'Go deeper with your AI science assistant.'][index]}</p></div></div>)}</div></section>
    </main>
    <Footer goTo={goTo} />
  </>
}

function CircuitPreview({ goTo }) {
  return <div className="hero-visual">
    <div className="visual-glow" />
    <div className="circuit-card">
      <div className="visual-label"><span><span className="live-dot" /> LIVE SIMULATION</span><span>Basic electric circuit</span></div>
      <svg className="preview-svg" viewBox="0 0 530 350" role="img" aria-label="Electric circuit preview">
        <defs><filter id="bulbGlow"><feGaussianBlur stdDeviation="9" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        <path className="wire" d="M92 120H174M280 120H405V252H350M240 252H92V120" />
        <path className="current-line" d="M92 120H174M280 120H405V252H350M240 252H92V120" />
        <circle className="bulb-glow" cx="227" cy="120" r="44" filter="url(#bulbGlow)" /><circle className="bulb" cx="227" cy="120" r="29" /><path className="bulb-rays" d="M227 74V59M181 120H166M273 120h15M194 87l-11-11M260 87l11-11" />
        <rect className="battery" x="55" y="215" width="70" height="74" rx="10" /><path className="battery-mark" d="M78 236v33M102 244v17M72 252h37" />
        <path className="switch-arm" d="M350 252l35-27" /><circle className="terminal" cx="350" cy="252" r="6" /><circle className="terminal" cx="405" cy="252" r="6" />
        <path className="resistor" d="M240 252l10-13 12 26 12-26 12 26 12-26 12 26 11-13" />
        <text x="191" y="180">Bulb</text><text x="53" y="314">Battery</text><text x="360" y="216">Switch</text><text x="260" y="300">Resistor</text>
      </svg>
      <div className="visual-footer"><span><span className="status-dot" /> Circuit ready</span><button onClick={() => goTo('lab')}>Try it yourself <ArrowRight size={14} /></button></div>
    </div>
    <div className="floating-stat stat-current"><Gauge size={17} /><div><strong>0.50 A</strong><small>Current</small></div></div>
    <div className="floating-stat stat-law"><span className="formula">V = I × R</span><small>Ohm’s Law</small></div>
  </div>
}

function Feature({ icon: Icon, title, text, color }) {
  return <article className="feature-card"><span className={`feature-icon ${color}`}><Icon size={21} /></span><h3>{title}</h3><p>{text}</p><button className="round-arrow" aria-label={title}><ArrowRight size={15} /></button></article>
}

function ExperimentCard({ experiment, goTo }) {
  const Icon = experiment.icon
  return <article className={`experiment-card ${!experiment.available ? 'locked' : ''}`}><div className={`experiment-icon ${experiment.color}`}><Icon size={24} /></div><div className="card-meta"><span className={`subject-pill ${experiment.color}`}>{experiment.subject}</span>{!experiment.available && <span className="soon-pill">Coming soon</span>}</div><h3>{experiment.title}</h3><p>{experiment.description}</p><div className="card-footer"><span><Timer size={14} /> {experiment.time}</span><span><Target size={14} /> {experiment.level}</span><button disabled={!experiment.available} onClick={() => goTo('lab')}>{experiment.available ? 'Start' : 'Preview'} <ArrowRight size={14} /></button></div></article>
}

function Dashboard({ goTo }) {
  return <main className="dashboard-page"><div className="dashboard-container"><div className="dashboard-welcome"><div><span className="eyebrow">Student dashboard · Demo account</span><h1>Good morning, Aanya <span>✦</span></h1><p>Keep exploring. Your next discovery is waiting.</p></div><div className="profile-chip"><span className="profile-avatar">AS</span><div><strong>Aanya Sharma</strong><small>Class 8 · Explorer</small></div><ChevronDown size={15} /></div></div><div className="metric-grid"><Metric icon={Check} label="Experiments completed" value="12" note="+3 this month" color="blue" /><Metric icon={TrendingUp} label="Learning progress" value="68%" note="2 topics in progress" color="purple" /><Metric icon={Target} label="Quiz performance" value="84%" note="+8% this month" color="green" /><Metric icon={Timer} label="Learning time" value="4.5h" note="This week" color="orange" /></div><div className="dashboard-grid"><section className="panel continue-panel"><div className="panel-header"><div><span className="eyebrow">Pick up where you left off</span><h2>Continue learning</h2></div><button className="link-button" onClick={() => goTo('lab')}>Open lab <ArrowRight size={15} /></button></div><div className="continue-content"><div className="continue-art"><Zap size={43} /><span>PHYSICS</span></div><div><span className="subject-pill blue">Physics · Beginner</span><h3>Basic Electric Circuit</h3><p>Learn how voltage, current and resistance connect.</p><div className="progress-label"><span>Progress</span><strong>72%</strong></div><div className="progress-bar"><span style={{ width: '72%' }} /></div><button className="button button-small" onClick={() => goTo('lab')}>Continue experiment <ArrowRight size={14} /></button></div></div></section><section className="panel progress-panel"><div className="panel-header"><div><span className="eyebrow">Your activity</span><h2>Weekly progress</h2></div><button className="icon-button" aria-label="Progress options"><ChevronDown size={16} /></button></div><div className="chart"><div className="chart-y"><span>60m</span><span>40m</span><span>20m</span><span>0m</span></div><div className="chart-area"><div className="chart-grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 420 150" preserveAspectRatio="none"><path d="M0 130 C35 128 45 102 73 108 S115 113 140 74 S179 96 205 72 S247 78 274 40 S316 70 345 45 S380 42 420 11" fill="none" stroke="#3478f6" strokeWidth="3" /><path d="M0 130 C35 128 45 102 73 108 S115 113 140 74 S179 96 205 72 S247 78 274 40 S316 70 345 45 S380 42 420 11V150H0Z" fill="url(#chartFill)" opacity=".15" /><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#3478f6" /><stop offset="1" stopColor="#fff" /></linearGradient></defs></svg><div className="chart-x"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></div></section></div><section className="panel recommended"><div className="panel-header"><div><span className="eyebrow">Curated for you</span><h2>Recommended experiments</h2></div><button className="link-button" onClick={() => goTo('experiments')}>View library <ArrowRight size={15} /></button></div><div className="mini-experiments">{experiments.slice(1).map((experiment) => <ExperimentCard key={experiment.id} experiment={experiment} goTo={goTo} />)}</div></section></div></main>
}

function Metric({ icon: Icon, label, value, note, color }) {
  return <div className="metric-card"><span className={`metric-icon ${color}`}><Icon size={18} /></span><div><small>{label}</small><strong>{value}</strong><span className="metric-note">{note}</span></div></div>
}

function ExperimentsPage({ goTo }) {
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('All subjects')
  const [level, setLevel] = useState('All levels')
  const filtered = useMemo(() => experiments.filter((experiment) => (subject === 'All subjects' || experiment.subject === subject) && (level === 'All levels' || experiment.level === level) && `${experiment.title} ${experiment.description}`.toLowerCase().includes(query.toLowerCase())), [query, subject, level])
  return <main className="library-page"><div className="library-hero"><span className="eyebrow">The experiment library</span><h1>Choose your next<br /><em>discovery.</em></h1><p>Explore interactive experiments designed to make every concept click.</p></div><div className="library-toolbar"><label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search experiments..." /></label><div className="filter-group"><select value={subject} onChange={(event) => setSubject(event.target.value)}><option>All subjects</option><option>Physics</option><option>Chemistry</option><option>Biology</option></select><select value={level} onChange={(event) => setLevel(event.target.value)}><option>All levels</option><option>Beginner</option><option>Intermediate</option></select></div></div><div className="library-count"><span>{filtered.length} experiments</span><span>New experiments added every month <Sparkles size={14} /></span></div><div className="library-grid">{filtered.map((experiment) => <ExperimentCard key={experiment.id} experiment={experiment} goTo={goTo} />)}</div>{filtered.length === 0 && <div className="empty-state"><Search size={28} /><h3>No experiments found</h3><p>Try a different search or filter.</p></div>}<div className="library-note"><CircleHelp size={18} /><span>Only the Basic Electric Circuit is available to explore right now. More experiments are on their way.</span></div></main>
}

function CircuitLab({ goTo }) {
  const [builderMode, setBuilderMode] = useState(false)
  const [voltage, setVoltage] = useState(6)
  const [resistance, setResistance] = useState(12)
  const [isClosed, setIsClosed] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const complete = true
  const current = calculateCurrent(voltage, resistance, isClosed, complete)
  const reset = () => { setVoltage(6); setResistance(12); setIsClosed(false) }
  if (builderMode) return <CircuitBuilder onBack={() => setBuilderMode(false)} />
  return <main className="lab-page"><div className="lab-topline"><button className="back-button" onClick={() => goTo('experiments')}>← Experiment library</button><span className="lab-status"><span className="live-dot" /> Simulation active</span><div className="lab-actions"><button className="builder-mode-button" onClick={() => setBuilderMode(true)}>Build your own circuit</button><button className="reset-button" onClick={reset}><RotateCcw size={14} /> Reset experiment</button></div></div><div className="builder-callout"><div><span className="eyebrow">New in LabXAI · Stage 1</span><strong>Interactive Circuit Builder</strong><p>Choose components and arrange your own circuit in a workspace.</p></div><button className="button button-small" onClick={() => setBuilderMode(true)}>Open builder <ArrowRight size={14} /></button></div><div className="lab-layout"><aside className="lab-sidebar"><span className="eyebrow">Physics · Beginner</span><h1>Basic electric<br /><em>circuit</em></h1><p>Explore how electrical energy moves through a closed path.</p><div className="objective-box"><Target size={17} /><div><strong>Objective</strong><span>Understand the relationship between voltage, resistance and current.</span></div></div><div className="instruction-list"><strong>How to experiment</strong>{['Adjust the voltage or resistance.', 'Close the switch to complete the circuit.', 'Observe the bulb and current reading.'].map((text, index) => <div key={text}><span>{index + 1}</span>{text}</div>)}</div><div className="components-list"><strong>Components</strong><span><i className="component-dot battery-dot" /> Battery</span><span><i className="component-dot bulb-dot" /> Bulb</span><span><i className="component-dot switch-dot" /> Switch</span><span><i className="component-dot resistor-dot" /> Resistor</span></div></aside><section className="lab-workspace"><div className="workspace-header"><div><span className="eyebrow">Virtual workspace</span><h2>Build your circuit</h2></div><span className={`circuit-badge ${isClosed ? 'active' : ''}`}><span /> {isClosed ? 'Circuit complete' : 'Switch is open'}</span></div><div className="large-circuit"><svg viewBox="0 0 720 410" role="img" aria-label="Interactive electric circuit diagram"><defs><filter id="labGlow"><feGaussianBlur stdDeviation="13" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs><path className="wire lab-wire" d="M122 143H250M370 143H585V285H490M330 285H122V143" /><path className={`current-line ${isClosed ? 'flowing' : ''}`} d="M122 143H250M370 143H585V285H490M330 285H122V143" /><circle className={`bulb-glow ${isClosed ? 'lit' : ''}`} cx="310" cy="143" r="56" filter="url(#labGlow)" /><circle className={`bulb ${isClosed ? 'lit' : ''}`} cx="310" cy="143" r="38" /><path className="bulb-rays" d="M310 85V66M252 143h-19M368 143h19M270 103l-15-15M350 103l15-15" /><text x="283" y="218">BULB</text><rect className="battery" x="78" y="257" width="88" height="92" rx="12" /><path className="battery-mark" d="M105 280v44M136 290v24M98 302h45" /><text x="77" y="374">BATTERY</text><path className="switch-arm" d={isClosed ? 'M490 285h58' : 'M490 285l49-38'} /><circle className="terminal" cx="490" cy="285" r="7" /><circle className="terminal" cx="585" cy="285" r="7" /><text x="500" y="226">SWITCH</text><path className="resistor" d="M330 285l12-16 15 32 15-32 15 32 15-32 15 32 15-16" /><text x="345" y="337">RESISTOR</text><g className="flow-label"><circle cx="200" cy="143" r="18" /><ArrowRight size={13} /></g></svg><button className={`switch-control ${isClosed ? 'on' : ''}`} onClick={() => setIsClosed(!isClosed)}><span className="switch-track"><span /></span><span>Switch {isClosed ? 'ON' : 'OFF'}</span></button></div><div className="workspace-tip"><Lightbulb size={16} /><span>{getCircuitObservation(current, isClosed)}</span></div></section><aside className="controls-panel"><div className="controls-header"><span className="eyebrow">Experiment controls</span><Settings size={17} /></div><ControlSlider label="Battery voltage" value={voltage} min="1" max="12" unit="V" onChange={setVoltage} /><ControlSlider label="Resistance" value={resistance} min="2" max="30" unit="Ω" onChange={setResistance} /><div className="readings"><span className="eyebrow">Live readings</span><div className="reading main-reading"><small>Current</small><strong>{current.toFixed(2)} <i>A</i></strong><span className={current ? 'reading-state good' : 'reading-state'}>{current ? 'Flowing' : 'No current'}</span></div><div className="reading-row"><div className="reading"><small>Voltage</small><strong>{voltage} <i>V</i></strong></div><div className="reading"><small>Resistance</small><strong>{resistance} <i>Ω</i></strong></div></div></div><div className={`status-box ${isClosed ? 'success' : ''}`}><span className="status-icon">{isClosed ? <Check size={16} /> : <CircleHelp size={16} />}</span><div><strong>{isClosed ? 'Circuit is complete' : 'Circuit is incomplete'}</strong><span>{isClosed ? 'Energy is reaching the bulb.' : 'Close the switch to start the experiment.'}</span></div></div><button className="assistant-button" onClick={() => setAssistantOpen(!assistantOpen)}><Bot size={19} /><span>Ask the AI science assistant</span><ArrowRight size={15} /></button></aside></div><div className="lab-bottom"><div><span className="eyebrow">The science behind it</span><h2>What did you observe?</h2><p>In this simplified model, current is calculated using Ohm’s Law: <strong>V = I × R</strong>. Increasing resistance reduces current for the same voltage. The bulb lights only when the switch closes the circuit.</p></div><div className="formula-card"><span>Ohm’s Law</span><strong>I = <b>V</b> / <b>R</b></strong><small>{voltage} V / {resistance} Ω = {current.toFixed(2)} A</small></div></div>{assistantOpen && <Assistant onClose={() => setAssistantOpen(false)} isClosed={isClosed} current={current} />}</main>
}

function ControlSlider({ label, value, min, max, unit, onChange }) {
  return <label className="slider-control"><span><strong>{label}</strong><b>{value} {unit}</b></span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span className="slider-range"><small>{min} {unit}</small><small>{max} {unit}</small></span></label>
}

function Assistant({ onClose, isClosed, current }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hi! I’m your LabXAI science assistant. Ask me anything about this circuit.' }])
  const send = (text = question) => { if (!text.trim()) return; const response = text.toLowerCase().includes('resistance') ? 'When resistance increases, current decreases if voltage stays the same. This follows I = V / R.' : !isClosed ? 'The bulb is not glowing because the switch is open. Close the switch to create a complete path for current.' : `Your circuit is active and ${current.toFixed(2)} A is flowing through the bulb.`; setMessages([...messages, { role: 'user', text }, { role: 'assistant', text: response }]); setQuestion('') }
  return <div className="assistant-drawer"><div className="assistant-head"><div><span className="feature-icon purple"><Bot size={18} /></span><div><strong>AI science assistant</strong><small>Demo mode · Backend not connected</small></div></div><button onClick={onClose} aria-label="Close assistant"><X size={18} /></button></div><div className="assistant-messages">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>{message.text}</div>)}</div><div className="suggested-questions">{['Why is my bulb not glowing?', 'What happens when I increase resistance?'].map((question) => <button key={question} onClick={() => send(question)}>{question}</button>)}</div><form className="assistant-input" onSubmit={(event) => { event.preventDefault(); send() }}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a science question..." /><button aria-label="Send question"><ArrowRight size={17} /></button></form></div>
}

function AboutPage({ goTo }) {
  return <main className="about-page"><div className="about-hero"><span className="eyebrow">Our mission</span><h1>Make science feel<br /><em>within reach.</em></h1><p>LabXAI helps students learn by doing. We pair thoughtful simulations with friendly explanations so every learner can explore with confidence.</p><button className="button" onClick={() => goTo('experiments')}>Start exploring <ArrowRight size={16} /></button></div><div className="about-values"><div><span className="feature-icon blue"><FlaskConical size={21} /></span><h2>Safe to try. Free to wonder.</h2><p>Virtual labs remove the fear of getting it wrong. Every experiment is an invitation to test, observe and try again.</p></div><div><span className="feature-icon purple"><BookOpen size={21} /></span><h2>Built for real understanding.</h2><p>Our activities focus on cause and effect, not memorising isolated facts. Science sticks when you can see it happen.</p></div></div></main>
}

function Footer({ goTo }) {
  return <footer><div className="footer-brand"><button className="brand" onClick={() => goTo('home')}><span className="brand-mark"><Zap size={17} fill="currentColor" /></span><span>Lab<span>X</span>AI</span></button><p>Ask. Explore. Experiment. Understand.</p></div><div className="footer-links"><div><strong>Explore</strong><button onClick={() => goTo('experiments')}>Experiments</button><button onClick={() => goTo('dashboard')}>My learning</button></div><div><strong>Learn</strong><button onClick={() => goTo('about')}>About LabXAI</button><button>Help center</button></div></div><div className="footer-bottom"><span>© 2025 LabXAI · Built for curious minds.</span><span>Made with curiosity <Sparkles size={14} /></span></div></footer>
}

export default App

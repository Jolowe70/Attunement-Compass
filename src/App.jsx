import { useState, useEffect, useRef } from "react";

async function callClaude({ system, messages }) {
  const resp = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages }),
  });
  const data = await resp.json();
  const raw = data.content?.map((b) => b.text || "").join("") || "";
  return raw.replace(/```json|```/g, "").trim();
}

const STAGE_META = {
  detect: {
    number: "I", title: "Signal Detection",
    verse: '"Beloved, believe not every spirit, but try the spirits whether they are of God…" — 1 John 4:1',
    color: "#C9A84C",
    desc: "Pause and name what is knocking at the door of your mind — without judgment.",
  },
  identify: {
    number: "II", title: "Source Identification",
    verse: '"Hereby know we the spirit of truth, and the spirit of error." — 1 John 4:6',
    color: "#7B9EBE",
    desc: "Test the signal against four unshakeable standards.",
  },
  respond: {
    number: "III", title: "Faithful Response",
    verse: '"Greater is he that is in you, than he that is in the world." — 1 John 4:4',
    color: "#82C9A0",
    desc: "Discernment without action is self-deception. Switch frequencies.",
  },
};

const COMPASS_ANGLE = { detect: -45, identify: 0, respond: 45 };

function CompassRose({ stage }) {
  const angle = COMPASS_ANGLE[stage] ?? 0;
  const color = STAGE_META[stage]?.color ?? "#C9A84C";
  return (
    <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
      <svg viewBox="0 0 120 120" width="110" height="110">
        <circle cx="60" cy="60" r="56" fill="none" stroke="#2A3A5C" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="48" fill="none" stroke="#1E2D4A" strokeWidth="0.5" />
        {[0, 90, 180, 270].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return <line key={deg}
            x1={60 + 48 * Math.sin(rad)} y1={60 - 48 * Math.cos(rad)}
            x2={60 + 56 * Math.sin(rad)} y2={60 - 56 * Math.cos(rad)}
            stroke="#2A3A5C" strokeWidth="1.5" />;
        })}
        <g transform={`rotate(${angle}, 60, 60)`}
          style={{ transition: "transform 0.9s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <polygon points="60,14 54,60 66,60" fill={color} opacity="0.95" />
          <polygon points="60,106 54,60 66,60" fill="#2A3A5C" />
          <circle cx="60" cy="60" r="5" fill="#0D1829" stroke={color} strokeWidth="1.5" />
        </g>
        <circle cx="60" cy="60" r="56" fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />
      </svg>
    </div>
  );
}

function TypingText({ text, speed = 16 }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  useEffect(() => {
    setDisplayed(""); idx.current = 0;
    if (!text) return;
    const iv = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return <span>{displayed}</span>;
}

function TestCard({ label, icon, content, index }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 280 + 150); return () => clearTimeout(t); }, [index]);
  const passed = content?.verdict === "pass";
  const color = passed ? "#82C9A0" : "#E07B6A";
  return (
    <div style={{
      border: `1px solid ${visible ? color + "44" : "#1E2D4A"}`,
      borderRadius: 12, padding: "16px 20px",
      background: visible ? `${color}08` : "transparent",
      transition: "all 0.5s ease",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(10px)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 17 }}>{icon}</span>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, color: "#8A9EC0", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
        </div>
        <span style={{ fontSize: 11, color, fontFamily: "monospace", letterSpacing: "0.1em" }}>
          {passed ? "✓ ALIGNED" : "✗ MISALIGNED"}
        </span>
      </div>
      <p style={{ margin: 0, color: "#B8C9E0", fontSize: 14.5, lineHeight: 1.72, fontFamily: "'Lora',serif" }}>
        {content?.analysis || ""}
      </p>
    </div>
  );
}

function ProgressDots({ stage }) {
  const stages = ["detect", "identify", "respond"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
      {stages.map((s, i) => {
        const active = s === stage;
        const done = stages.indexOf(stage) > i;
        const color = STAGE_META[s].color;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
            <div style={{
              width: active ? 28 : 10, height: 10, borderRadius: 5,
              background: done ? color : active ? color : "#1E2D4A",
              transition: "all 0.5s ease",
              boxShadow: active ? `0 0 10px ${color}88` : "none",
              flexShrink: 0,
            }} />
            {i < 2 && <div style={{ flex: 1, height: 1, background: done ? `${STAGE_META[stages[i+1]].color}44` : "#1A2840", transition: "background 0.5s ease", margin: "0 4px" }} />}
          </div>
        );
      })}
    </div>
  );
}

function Spinner({ color = "#C9A84C" }) {
  return <span style={{ display: "inline-block", width: 14, height: 14, border: `2px solid ${color}44`, borderTopColor: color, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />;
}

export default function App() {
  const [stage, setStage] = useState("detect");
  const [signal, setSignal] = useState("");
  const [pressure, setPressure] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [error, setError] = useState("");
  const [session, setSession] = useState({});
  const topRef = useRef(null);

  const meta = STAGE_META[stage];

  function scrollTop() { topRef.current?.scrollIntoView({ behavior: "smooth" }); }

  async function runIdentification() {
    if (!signal.trim()) { setError("Please describe the signal you're experiencing."); return; }
    setError(""); setLoading(true); setAnalysisData(null);
    const s = { signal, domain, pressure };
    setSession(s);
    try {
      const raw = await callClaude({
        system: `You are a spiritual discernment guide grounded in 1 John 4 and biblical theology. You help believers test whether a thought, feeling, or impulse aligns with the Spirit of Truth or the Spirit of Error. Be warm, pastoral, and deeply practical. Respond ONLY with valid JSON — no markdown, no preamble.`,
        messages: [{
          role: "user",
          content: `A believer is running the Attunement Compass on this signal:

Domain: ${s.domain || "Unspecified"}
Signal: "${s.signal}"
Pressure quality: ${s.pressure || "Not noted"}

Apply the four calibration tests. Return JSON:
{
  "overall_source": "Spirit of Truth" or "Spirit of Error" or "Mixed / Requires Wisdom",
  "summary": "1-2 sentence pastoral summary",
  "tests": {
    "christological": { "verdict": "pass" or "fail", "analysis": "2-3 sentences" },
    "canonical":      { "verdict": "pass" or "fail", "analysis": "2-3 sentences" },
    "character":      { "verdict": "pass" or "fail", "analysis": "2-3 sentences" },
    "corporate":      { "verdict": "pass" or "fail", "analysis": "2-3 sentences" }
  }
}`,
        }],
      });
      setAnalysisData(JSON.parse(raw));
      setStage("identify");
      setTimeout(scrollTop, 100);
    } catch (e) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  async function runResponse() {
    if (!analysisData) return;
    setLoading(true); setResponseData(null);
    try {
      const raw = await callClaude({
        system: `You are a pastoral guide helping a believer move from discernment to faithful action. Be specific, encouraging, and grounded in Scripture. Respond ONLY with valid JSON — no markdown, no preamble.`,
        messages: [{
          role: "user",
          content: `Signal: "${session.signal}"
Source: ${analysisData.overall_source}
Summary: ${analysisData.summary}

Generate a Faithful Response. Return JSON:
{
  "refutation_prayer": "A short specific prayer (2-4 sentences) naming and rejecting the error OR affirming the truth with gratitude",
  "scripture_antidote": {
    "reference": "Book Chapter:Verse",
    "text": "The verse text",
    "application": "1 sentence on how this verse speaks to this exact signal"
  },
  "one_step": "A single concrete bodily step the person can take in the next 10 minutes",
  "encouragement": "1-2 sentences of pastoral encouragement tailored to what this person is facing"
}`,
        }],
      });
      setResponseData(JSON.parse(raw));
      setStage("respond");
      setTimeout(scrollTop, 100);
    } catch (e) {
      setError("Could not generate the response. Please try again.");
    }
    setLoading(false);
  }

  function reset() {
    setStage("detect"); setSignal(""); setPressure(""); setDomain("");
    setAnalysisData(null); setResponseData(null); setError(""); setSession({});
    setTimeout(scrollTop, 100);
  }

  const sourceColor = analysisData?.overall_source === "Spirit of Truth" ? "#82C9A0"
    : analysisData?.overall_source === "Spirit of Error" ? "#E07B6A" : "#C9A84C";

  return (
    <div style={{ minHeight: "100vh", background: "#080F1C", fontFamily: "'Lora',serif", color: "#D4E0F0", padding: "0 0 80px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {Array.from({ length: 55 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute", borderRadius: "50%", background: "#fff",
            width: Math.random() * 2 + 1, height: Math.random() * 2 + 1,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.25 + 0.04,
            animation: `twinkle ${Math.random() * 4 + 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }} />
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
        @keyframes twinkle { 0%,100%{opacity:0.04} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 #C9A84C33} 50%{box-shadow:0 0 0 14px #C9A84C00} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        textarea,select{outline:none!important}
        textarea:focus,select:focus{border-color:#C9A84C88!important}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#0D1829}
        ::-webkit-scrollbar-thumb{background:#2A3A5C;border-radius:2px}
        *{box-sizing:border-box}
      `}</style>

      <div ref={topRef} style={{ position: "relative", zIndex: 1, maxWidth: 660, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ textAlign: "center", paddingTop: 56, paddingBottom: 44, animation: "fadeUp 0.8s ease forwards" }}>
          <div style={{ letterSpacing: "0.25em", fontSize: 10.5, color: "#4A6080", textTransform: "uppercase", marginBottom: 14, fontFamily: "'Cormorant Garamond',serif" }}>
            A Spiritual Discernment Instrument
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: "clamp(36px,8vw,54px)", margin: 0, color: "#F0E6CC", letterSpacing: "0.04em", lineHeight: 1.1 }}>
            The Attunement<br />
            <span style={{ color: "#C9A84C", fontStyle: "italic" }}>Compass</span>
          </h1>
          <div style={{ width: 36, height: 1, background: "#C9A84C44", margin: "18px auto" }} />
          <p style={{ fontSize: 14.5, color: "#6A80A0", maxWidth: 440, margin: "0 auto", lineHeight: 1.85, fontStyle: "italic" }}>
            Every signal aligns you with one of two frequencies.<br />Stop. Test the signal. Recalibrate.
          </p>
        </div>

        <ProgressDots stage={stage} />

        <div key={stage} style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 28, animation: "fadeUp 0.45s ease forwards" }}>
          <CompassRose stage={stage} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", color: meta.color, fontSize: 12.5, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Stage {meta.number}
              </span>
              <div style={{ height: 1, flex: 1, background: `${meta.color}33` }} />
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 400, fontSize: 27, margin: "0 0 7px", color: "#F0E6CC" }}>{meta.title}</h2>
            <p style={{ margin: "0 0 8px", fontSize: 13.5, color: "#7A8FAA", lineHeight: 1.6, fontStyle: "italic" }}>{meta.verse}</p>
            <p style={{ margin: 0, fontSize: 14, color: "#8A9EC0", lineHeight: 1.6 }}>{meta.desc}</p>
          </div>
        </div>

        {stage === "detect" && (
          <div style={{ animation: "fadeUp 0.45s ease forwards" }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 11, letterSpacing: "0.15em", color: "#5A7090", textTransform: "uppercase", marginBottom: 8, fontFamily: "'Cormorant Garamond',serif" }}>
                Life Domain
              </label>
              <select value={domain} onChange={(e) => setDomain(e.target.value)}
                style={{ width: "100%", background: "#0D1829", border: "1px solid #1E2D4A", borderRadius: 8, padding: "12px 16px", color: domain ? "#D4E0F0" : "#4A6080", fontSize: 15, fontFamily: "'Lora',serif", cursor: "pointer", appearance: "none" }}>
                <option value="">Select a domain (optional)</option>
                {["Relationships & Marriage","Work & Vocation","Inner Life & Identity","Social & Community","Financial","Health & Body","Ministry & Service","Parenting & Family","Other"].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 11, letterSpacing: "0.15em", color: "#5A7090", textTransform: "uppercase", marginBottom: 8, fontFamily: "'Cormorant Garamond',serif" }}>
                Name the Signal
              </label>
              <textarea value={signal} onChange={(e) => setSignal(e.target.value)}
                placeholder="What specific thought, feeling, or impulse is knocking at the door of your mind right now? Be honest and plain…"
                rows={5}
                style={{ width: "100%", background: "#0D1829", border: "1px solid #1E2D4A", borderRadius: 8, padding: "14px 16px", color: "#D4E0F0", fontSize: 15, fontFamily: "'Lora',serif", lineHeight: 1.7, resize: "vertical", transition: "border-color 0.2s" }} />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontSize: 11, letterSpacing: "0.15em", color: "#5A7090", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Cormorant Garamond',serif" }}>
                Note the Pressure
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { val: "urgent", label: "⚡ Urgent Rush", sub: "Fear, panic, compulsion" },
                  { val: "gentle", label: "🌿 Quiet Nudge", sub: "Clear, patient, inviting" },
                  { val: "unclear", label: "◌ Unclear", sub: "Hard to name yet" },
                ].map((opt) => (
                  <button key={opt.val} onClick={() => setPressure(opt.val)}
                    style={{ flex: 1, background: pressure === opt.val ? "#C9A84C15" : "#0D1829", border: `1px solid ${pressure === opt.val ? "#C9A84C" : "#1E2D4A"}`, borderRadius: 10, padding: "13px 8px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
                    <div style={{ fontSize: 13.5, color: pressure === opt.val ? "#C9A84C" : "#8A9EC0", marginBottom: 3, fontFamily: "'Lora',serif" }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: "#4A6080" }}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && <p style={{ color: "#E07B6A", fontSize: 13.5, marginBottom: 14 }}>{error}</p>}

            <button onClick={runIdentification} disabled={loading}
              style={{ width: "100%", background: loading ? "#1A2840" : "linear-gradient(135deg,#C9A84C22,#7B9EBE22)", border: `1px solid ${loading ? "#1E2D4A" : "#C9A84C66"}`, borderRadius: 10, padding: "15px 24px", color: loading ? "#4A6080" : "#C9A84C", fontSize: 15, fontFamily: "'Cormorant Garamond',serif", letterSpacing: "0.12em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.3s", animation: !loading ? "pulse 2.5s infinite" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {loading ? <><Spinner /> Testing the Signal…</> : "→ Test the Signal"}
            </button>
          </div>
        )}

        {stage === "identify" && analysisData && (
          <div style={{ animation: "fadeUp 0.45s ease forwards" }}>
            <div style={{ border: `1px solid ${sourceColor}44`, borderRadius: 14, padding: "20px 22px", background: `${sourceColor}0A`, marginBottom: 26, textAlign: "center" }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "#5A7090", textTransform: "uppercase", marginBottom: 7, fontFamily: "'Cormorant Garamond',serif" }}>Source Identified</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 27, color: sourceColor, fontWeight: 400, marginBottom: 9 }}>{analysisData.overall_source}</div>
              <p style={{ margin: 0, fontSize: 14.5, color: "#8A9EC0", lineHeight: 1.75, fontStyle: "italic" }}>
                <TypingText text={analysisData.summary} />
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              {[
                { key: "christological", label: "Christological Test", icon: "✝" },
                { key: "canonical",      label: "Canonical Test",      icon: "📖" },
                { key: "character",      label: "Character Test",      icon: "🌱" },
                { key: "corporate",      label: "Corporate Test",      icon: "🏛" },
              ].map((t, i) => (
                <TestCard key={t.key} label={t.label} icon={t.icon} content={analysisData.tests?.[t.key]} index={i} />
              ))}
            </div>

            {error && <p style={{ color: "#E07B6A", fontSize: 13.5, marginBottom: 14 }}>{error}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={reset}
                style={{ flexShrink: 0, background: "transparent", border: "1px solid #1E2D4A", borderRadius: 10, padding: "13px 18px", color: "#4A6080", fontSize: 14, fontFamily: "'Cormorant Garamond',serif", cursor: "pointer" }}>
                ← Start Over
              </button>
              <button onClick={runResponse} disabled={loading}
                style={{ flex: 1, background: loading ? "#1A2840" : "linear-gradient(135deg,#82C9A022,#2A6A4A22)", border: `1px solid ${loading ? "#1E2D4A" : "#82C9A066"}`, borderRadius: 10, padding: "13px 20px", color: loading ? "#4A6080" : "#82C9A0", fontSize: 15, fontFamily: "'Cormorant Garamond',serif", letterSpacing: "0.1em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {loading ? <><Spinner color="#82C9A0" /> Preparing Response…</> : "→ Generate Faithful Response"}
              </button>
            </div>
          </div>
        )}

        {stage === "respond" && responseData && (
          <div style={{ animation: "fadeUp 0.45s ease forwards" }}>
            <div style={{ border: "1px solid #C9A84C33", borderRadius: 14, padding: "20px 22px", background: "#C9A84C07", marginBottom: 16 }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "#8A7040", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Cormorant Garamond',serif" }}>🙏 Active Refutation — Prayer</div>
              <p style={{ margin: 0, fontSize: 16, color: "#D4C890", lineHeight: 1.85, fontStyle: "italic", fontFamily: "'Cormorant Garamond',serif" }}>"{responseData.refutation_prayer}"</p>
            </div>

            <div style={{ border: "1px solid #7B9EBE33", borderRadius: 14, padding: "20px 22px", background: "#7B9EBE07", marginBottom: 16 }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "#5A7090", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Cormorant Garamond',serif" }}>📖 Scriptural Recalibration</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: "#7B9EBE", marginBottom: 7 }}>{responseData.scripture_antidote?.reference}</div>
              <p style={{ margin: "0 0 10px", fontSize: 15.5, color: "#B8C9E0", lineHeight: 1.82, fontStyle: "italic" }}>"{responseData.scripture_antidote?.text}"</p>
              <p style={{ margin: 0, fontSize: 13.5, color: "#6A80A0", lineHeight: 1.65, borderTop: "1px solid #1E2D4A", paddingTop: 10 }}>{responseData.scripture_antidote?.application}</p>
            </div>

            <div style={{ border: "1px solid #82C9A033", borderRadius: 14, padding: "20px 22px", background: "#82C9A007", marginBottom: 16 }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "#4A7A60", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Cormorant Garamond',serif" }}>👣 Your One Step — Right Now</div>
              <p style={{ margin: 0, fontSize: 16, color: "#82C9A0", lineHeight: 1.8, fontFamily: "'Cormorant Garamond',serif" }}>{responseData.one_step}</p>
            </div>

            <div style={{ borderRadius: 14, padding: "20px 22px", background: "linear-gradient(135deg,#0D1829,#111E35)", border: "1px solid #2A3A5C", marginBottom: 28, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 15, color: "#8A9EC0", lineHeight: 1.85, fontStyle: "italic", fontFamily: "'Cormorant Garamond',serif" }}>{responseData.encouragement}</p>
            </div>

            {error && <p style={{ color: "#E07B6A", fontSize: 13.5, marginBottom: 14 }}>{error}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStage("identify")}
                style={{ flexShrink: 0, background: "transparent", border: "1px solid #1E2D4A", borderRadius: 10, padding: "13px 18px", color: "#4A6080", fontSize: 14, fontFamily: "'Cormorant Garamond',serif", cursor: "pointer" }}>
                ← Back
              </button>
              <button onClick={reset}
                style={{ flex: 1, background: "linear-gradient(135deg,#C9A84C15,#7B9EBE15)", border: "1px solid #C9A84C55", borderRadius: 10, padding: "13px 20px", color: "#C9A84C", fontSize: 15, fontFamily: "'Cormorant Garamond',serif", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.3s" }}>
                ✦ Begin a New Session
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 56, paddingTop: 20, borderTop: "1px solid #0F1E30" }}>
          <p style={{ fontSize: 11.5, color: "#2A3A5C", fontFamily: "'Cormorant Garamond',serif", letterSpacing: "0.1em", fontStyle: "italic" }}>
            "Greater is he that is in you, than he that is in the world." — 1 John 4:4
          </p>
        </div>
      </div>
    </div>
  );
}

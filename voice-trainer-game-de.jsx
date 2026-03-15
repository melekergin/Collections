import { useState, useEffect, useRef } from "react";

const REPS_PER_LEVEL = 15;

const CHARACTERS = [
  {
    level: 1,
    name: "Die Beobachterin",
    realName: "Susan Cain",
    title: "Autorin von 'Quiet'",
    emoji: "🌱",
    color: "#C9B99A",
    bg: "#2A2420",
    quote: "Es gibt keine Korrelation zwischen dem besten Redner und den besten Ideen.",
    description: "Du beobachtest, du nimmst alles wahr. Hier beginnt jede Stimme.",
    unlockMsg: "Du hast angefangen. Das ist das Schwerste.",
  },
  {
    level: 2,
    name: "Die Wahrnehmende",
    realName: "Chimamanda Ngozi Adichie",
    title: "Autorin & Geschichtenerzählerin",
    emoji: "🍂",
    color: "#D4845A",
    bg: "#2A1F18",
    quote: "Die einzelne Geschichte erschafft Klischees. Deine Geschichte zählt.",
    description: "Du fängst an, kleine Wahrheiten zu teilen. Deine Beobachtungen werden zu Worten.",
    unlockMsg: "Deine Perspektive ist bereits interessant. Vertrau dem.",
  },
  {
    level: 3,
    name: "Die Ehrliche",
    realName: "Brené Brown",
    title: "Forscherin & Autorin",
    emoji: "🕯️",
    color: "#E8C547",
    bg: "#26221A",
    quote: "Verletzlichkeit ist keine Schwäche. Sie ist unser größtes Maß an Mut.",
    description: "Du lässt echte Gedanken raus. Auch die unsicheren.",
    unlockMsg: "Du hast etwas Echtes gesagt. Das braucht mehr Mut, als die meisten wissen.",
  },
  {
    level: 4,
    name: "Der Witz",
    realName: "Mindy Kaling",
    title: "Autorin, Schauspielerin, Macherin",
    emoji: "✨",
    color: "#A8C5A0",
    bg: "#1A2420",
    quote: "Warum habe ich Selbstvertrauen? Weil ich hart gearbeitet und es verdient habe.",
    description: "Der Humor, der nur im engen Kreis lebte, zeigt sich jetzt auch woanders.",
    unlockMsg: "Du warst witzig. Absichtlich. Das ist riesig.",
  },
  {
    level: 5,
    name: "Die Stimme",
    realName: "Carly Taylor",
    title: "Data Scientist & Creatorin",
    emoji: "🔥",
    color: "#F07167",
    bg: "#261A1A",
    quote: "Authentizität ist keine Markenstrategie. Es ist einfach zu müde, um noch eine Rolle zu spielen.",
    description: "Du zeigst dich als du selbst — bei der Arbeit, online, in Räumen, die sich früher zu groß anfühlten.",
    unlockMsg: "Du hast sie gefunden. Sie war immer in dir.",
  },
];

const CATEGORIES = [
  { id: "smalltalk", label: "Smalltalk", icon: "☕", color: "#C9B99A" },
  { id: "opinion", label: "Meinung", icon: "💬", color: "#E8C547" },
  { id: "humor", label: "Humor", icon: "😄", color: "#A8C5A0" },
  { id: "professional", label: "Beruflich", icon: "💼", color: "#6B9FD4" },
];

const SYSTEM_PROMPT = `Du bist ein warmherziger, weiser Soft-Skills-Coach, der einer schüchternen, grüblerischen Person hilft, ihre Stimme zu finden.

Dein Stil: Wie eine freundliche ältere Freundin, die selbst durch ähnliches gegangen ist. Warmherzig, konkret, nie generisch. Manchmal leicht humorvoll.

Die Person spricht Deutsch. Antworte IMMER auf Deutsch.

Wenn du eine Übungsaufgabe gibst:
Formatiere es genau so:
**Situation:** [eine realistische, konkrete Alltagssituation]
*Dein Fokus:* [eine einzige Sache, maximal 8 Wörter]

WICHTIG: Die Person SPRICHT ihre Antworten laut per Sprache-zu-Text. Beurteile Inhalt und Natuerlichkeit, nicht Grammatik. Achte auf Abschwaechungen wie "eigentlich", "irgendwie" oder ob sie direkt klingt. Gib Feedback speziell fuers Sprechen.

Wenn du auf ihre gesprochene Antwort reagierst:
- 2-3 Saetze echtes, konkretes Feedback speziell fuers Sprechen
- Benenne genau was gut klang oder was sie weglassen koennen (z.B. "das 'eigentlich' kannst du weglassen")
- Schliesse mit: neuer Aufgabe, sanftem Anstoss es nochmal zu versuchen, oder frage ob sie eine neue Situation moechten

Kategorien:
- smalltalk: Alltagsmomente, Fremde, lockere Wärme
- opinion: Eine Meinung haben und sie aussprechen, ohne sich zu entschuldigen
- humor: Den lustigen Gedanken rauslassen, statt ihn zu schlucken
- professional: Arbeitsumfeld, Meetings, Netzwerken, Ideen einbringen

Bleib gemütlich und echt. Diese Person hat eine großartige innere Stimme — hilf ihr, sie langsam rauszulassen.`;

export default function VoiceGame() {
  const [screen, setScreen] = useState("home");
  const [totalReps, setTotalReps] = useState(0);
  const [category, setCategory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(null);
  const [showUnlock, setShowUnlock] = useState(false);
  const chatEndRef = useRef(null);

  const currentLevel = Math.min(Math.floor(totalReps / REPS_PER_LEVEL) + 1, CHARACTERS.length);
  const currentChar = CHARACTERS[currentLevel - 1];
  const repsInLevel = totalReps % REPS_PER_LEVEL;
  const progress = (repsInLevel / REPS_PER_LEVEL) * 100;

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSession = async (cat) => {
    setCategory(cat);
    setMessages([]);
    setScreen("exercise");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Gib mir eine ${cat.id}-Übungsaufgabe auf Deutsch. Nur die Aufgabe, warmherzig und konkret.` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((b) => b.text || "").join("") || "";
      setMessages([{ role: "assistant", content: text }]);
    } catch {
      setMessages([{ role: "assistant", content: "Etwas ist schiefgelaufen. Versuch es nochmal?" }]);
    }
    setLoading(false);
  };

  const sendResponse = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    const prevLevel = Math.min(Math.floor(totalReps / REPS_PER_LEVEL) + 1, CHARACTERS.length);
    const newTotal = totalReps + 1;
    setTotalReps(newTotal);
    const newLevel = Math.min(Math.floor(newTotal / REPS_PER_LEVEL) + 1, CHARACTERS.length);

    if (newLevel > prevLevel && newLevel <= CHARACTERS.length) {
      setJustUnlocked(CHARACTERS[newLevel - 1]);
      setTimeout(() => setShowUnlock(true), 800);
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: newMessages,
        }),
      });
      const data = await res.json();
      const text = data.content?.map((b) => b.text || "").join("") || "";
      setMessages([...newMessages, { role: "assistant", content: text }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Etwas ist schiefgelaufen. Versuch es nochmal?" }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendResponse(); }
  };

  // FREISCHALT-BILDSCHIRM
  if (showUnlock && justUnlocked) {
    return (
      <div style={{
        minHeight: "100vh", background: justUnlocked.bg,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: 40, textAlign: "center",
        fontFamily: "'Georgia', serif",
      }}>
        <div style={{ fontSize: 72, marginBottom: 24, animation: "floatIn 0.8s ease" }}>
          {justUnlocked.emoji}
        </div>
        <p style={{ fontSize: 11, letterSpacing: "0.2em", color: justUnlocked.color, textTransform: "uppercase", marginBottom: 8 }}>
          Du bist jetzt
        </p>
        <h1 style={{ fontSize: 36, color: "#F2EFE9", margin: "0 0 6px", fontStyle: "italic" }}>
          {justUnlocked.name}
        </h1>
        <p style={{ fontSize: 14, color: justUnlocked.color, marginBottom: 32 }}>
          inspiriert von {justUnlocked.realName} · {justUnlocked.title}
        </p>
        <div style={{
          maxWidth: 400, background: "rgba(255,255,255,0.05)",
          borderRadius: 16, padding: "24px 28px", marginBottom: 28,
          border: `1px solid ${justUnlocked.color}33`,
        }}>
          <p style={{ fontSize: 15, color: "#F2EFE9", fontStyle: "italic", lineHeight: 1.8, margin: 0 }}>
            &bdquo;{justUnlocked.quote}&ldquo;
          </p>
          <p style={{ fontSize: 12, color: justUnlocked.color, marginTop: 12, marginBottom: 0 }}>
            — {justUnlocked.realName}
          </p>
        </div>
        <p style={{ fontSize: 14, color: "#999", marginBottom: 36, fontStyle: "italic", maxWidth: 320, lineHeight: 1.7 }}>
          {justUnlocked.unlockMsg}
        </p>
        <button
          onClick={() => { setShowUnlock(false); setJustUnlocked(null); setScreen("home"); }}
          style={{
            background: justUnlocked.color, color: "#1a1a1a",
            border: "none", borderRadius: 30, padding: "14px 36px",
            fontSize: 14, fontFamily: "Georgia, serif", cursor: "pointer",
            letterSpacing: "0.05em",
          }}
        >
          Weiter →
        </button>
        <style>{`@keyframes floatIn { from { opacity:0; transform: translateY(20px) } to { opacity:1; transform: translateY(0) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1C1914",
      fontFamily: "'Georgia', serif",
      color: "#F2EFE9",
      display: "flex", flexDirection: "column",
    }}>
      {/* Kopfzeile */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid #2d2820",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#19160F",
      }}>
        <div
          onClick={() => setScreen("home")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
        >
          <span style={{ fontSize: 20 }}>{currentChar.emoji}</span>
          <div>
            <div style={{ fontSize: 13, color: currentChar.color, fontStyle: "italic" }}>
              {currentChar.name}
            </div>
            <div style={{ fontSize: 10, color: "#666", letterSpacing: "0.08em" }}>
              inspiriert von {currentChar.realName}
            </div>
          </div>
        </div>

        {/* Fortschrittsbalken */}
        <div style={{ flex: 1, margin: "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: "#666" }}>Stufe {currentLevel}</span>
            <span style={{ fontSize: 10, color: "#666" }}>
              {currentLevel < CHARACTERS.length ? `${repsInLevel}/${REPS_PER_LEVEL}` : "✨ Abgeschlossen"}
            </span>
          </div>
          <div style={{ height: 4, background: "#2d2820", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              background: currentChar.color,
              width: `${currentLevel >= CHARACTERS.length ? 100 : progress}%`,
              transition: "width 0.6s ease",
            }} />
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#666" }}>
          {totalReps} Rep{totalReps !== 1 ? "s" : ""}
        </div>
      </div>

      {/* STARTBILDSCHIRM */}
      {screen === "home" && (
        <div style={{ flex: 1, padding: "32px 24px", maxWidth: 560, margin: "0 auto", width: "100%" }}>

          {/* Aktuelle Charakter-Karte */}
          <div style={{
            background: currentChar.bg,
            border: `1px solid ${currentChar.color}44`,
            borderRadius: 16, padding: "24px", marginBottom: 32,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -20, right: -10,
              fontSize: 80, opacity: 0.15, userSelect: "none",
            }}>{currentChar.emoji}</div>
            <p style={{ fontSize: 10, letterSpacing: "0.18em", color: currentChar.color, textTransform: "uppercase", marginBottom: 8 }}>
              Du bist gerade
            </p>
            <h2 style={{ fontSize: 24, margin: "0 0 4px", fontStyle: "italic", color: "#F2EFE9" }}>
              {currentChar.name}
            </h2>
            <p style={{ fontSize: 12, color: currentChar.color, margin: "0 0 14px" }}>
              inspiriert von {currentChar.realName}
            </p>
            <p style={{ fontSize: 13, color: "#AAA", lineHeight: 1.7, margin: "0 0 16px", fontStyle: "italic" }}>
              &bdquo;{currentChar.quote}&ldquo;
            </p>
            <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, margin: 0 }}>
              {currentChar.description}
            </p>
          </div>

          {/* Nächster Charakter */}
          {currentLevel < CHARACTERS.length && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 10, letterSpacing: "0.15em", color: "#555", textTransform: "uppercase", marginBottom: 12 }}>
                Noch {REPS_PER_LEVEL - repsInLevel} Reps bis du wirst
              </p>
              <div style={{
                background: "#211E18", border: "1px solid #2d2820",
                borderRadius: 12, padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 14, opacity: 0.7,
              }}>
                <span style={{ fontSize: 28, filter: "grayscale(1)" }}>{CHARACTERS[currentLevel].emoji}</span>
                <div>
                  <div style={{ fontSize: 14, color: "#888", fontStyle: "italic" }}>{CHARACTERS[currentLevel].name}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>inspiriert von {CHARACTERS[currentLevel].realName}</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 11, color: "#444" }}>🔒</div>
              </div>
            </div>
          )}

          {/* Kategorien */}
          <p style={{ fontSize: 10, letterSpacing: "0.15em", color: "#666", textTransform: "uppercase", marginBottom: 14 }}>
            Üben
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => startSession(cat)}
                style={{
                  background: "#211E18",
                  border: "1px solid #2d2820",
                  borderRadius: 12, padding: "20px 16px",
                  cursor: "pointer", textAlign: "left",
                  color: "#F2EFE9", fontFamily: "Georgia, serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cat.color;
                  e.currentTarget.style.background = "#272318";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#2d2820";
                  e.currentTarget.style.background = "#211E18";
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{cat.icon}</div>
                <div style={{ fontSize: 13, color: cat.color, fontStyle: "italic" }}>{cat.label}</div>
              </button>
            ))}
          </div>

          {/* Reiseverlauf */}
          <div style={{ marginTop: 36 }}>
            <p style={{ fontSize: 10, letterSpacing: "0.15em", color: "#555", textTransform: "uppercase", marginBottom: 14 }}>
              Deine Reise
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {CHARACTERS.map((char, i) => {
                const unlocked = i + 1 <= currentLevel;
                return (
                  <div key={char.level} style={{
                    flex: 1, textAlign: "center", opacity: unlocked ? 1 : 0.3,
                  }}>
                    <div style={{
                      fontSize: 24, marginBottom: 4,
                      filter: unlocked ? "none" : "grayscale(1)",
                    }}>{char.emoji}</div>
                    <div style={{ fontSize: 9, color: unlocked ? char.color : "#444", lineHeight: 1.3 }}>
                      {char.name.split(" ").slice(1).join(" ")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ÜBUNGSBILDSCHIRM */}
      {screen === "exercise" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 620, margin: "0 auto", width: "100%" }}>
          <div style={{ padding: "14px 24px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>
              {CATEGORIES.find((c) => c.id === category?.id)?.icon}
            </span>
            <span style={{
              fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
              color: CATEGORIES.find((c) => c.id === category?.id)?.color,
              fontStyle: "italic",
            }}>
              {CATEGORIES.find((c) => c.id === category?.id)?.label}
            </span>
          </div>

          <div style={{
            flex: 1, overflowY: "auto", padding: "20px 24px",
            display: "flex", flexDirection: "column", gap: 18,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                {msg.role === "assistant" && (
                  <div style={{ fontSize: 18, marginRight: 10, flexShrink: 0, marginTop: 4 }}>
                    {currentChar.emoji}
                  </div>
                )}
                <div style={{
                  maxWidth: "78%", padding: "14px 18px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user" ? currentChar.color : "#211E18",
                  color: msg.role === "user" ? "#1C1914" : "#F2EFE9",
                  fontSize: 14, lineHeight: 1.75,
                  border: msg.role === "assistant" ? "1px solid #2d2820" : "none",
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 6, paddingLeft: 36 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: currentChar.color, opacity: 0.5,
                    animation: "pulse 1.2s ease-in-out infinite",
                    animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{
            padding: "8px 24px 4px",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>🎙</span>
            <span style={{ fontSize: 11, color: "#666", fontStyle: "italic", letterSpacing: "0.05em" }}>
              Sprich laut — dann Mikrofon-Taste auf deiner Tastatur antippen
            </span>
          </div>

          <div style={{
            padding: "8px 24px 22px",
            borderTop: "1px solid #2d2820",
            display: "flex", gap: 10, alignItems: "flex-end",
            background: "#19160F",
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="🎙 Mikrofon antippen und sprechen…"
              rows={2}
              disabled={loading}
              style={{
                flex: 1, background: "#211E18",
                border: "1px solid #2d2820", borderRadius: 12,
                padding: "12px 16px", color: "#F2EFE9",
                fontFamily: "Georgia, serif", fontSize: 14,
                lineHeight: 1.6, resize: "none", outline: "none",
                minHeight: 50, maxHeight: 120,
              }}
              onFocus={(e) => e.target.style.borderColor = currentChar.color}
              onBlur={(e) => e.target.style.borderColor = "#2d2820"}
            />
            <button
              onClick={sendResponse}
              disabled={loading || !input.trim()}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: input.trim() ? currentChar.color : "#2d2820",
                border: "none", cursor: input.trim() ? "pointer" : "default",
                fontSize: 18, flexShrink: 0, transition: "all 0.2s",
                color: "#1C1914",
              }}
            >↑</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
        textarea::placeholder { color: #3d3830; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #2d2820; border-radius: 2px; }
      `}</style>
    </div>
  );
}

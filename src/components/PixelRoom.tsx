import { useState, useEffect, useRef, useCallback } from "react";

// — Personality color map (matches AI同频 personality system) —
const PERSONALITY_COLORS: Record<string, { primary: string; secondary: string; label: string }> = {
  spark:        { primary: "#FF6B35", secondary: "#FF2D55", label: "星火" },
  deepsea:      { primary: "#0F4C75", secondary: "#1B98E0", label: "深海" },
  aurora:       { primary: "#7B2FF7", secondary: "#22D1EE", label: "极光" },
  warmsun:      { primary: "#FF9A3C", secondary: "#FFD93D", label: "暖阳" },
  bedrock:      { primary: "#0D9488", secondary: "#2DD4BF", label: "磐石" },
  lightning:    { primary: "#E11D48", secondary: "#FB923C", label: "闪电" },
  brightmoon:   { primary: "#4338CA", secondary: "#818CF8", label: "明月" },
  springbreeze: { primary: "#059669", secondary: "#34D399", label: "春风" },
};

const EMOJIS = ["💡","🔥","✨","💬","❤️","🎯","🤝","⭐","🌈","💪","😄","🎵","☕","🌟","👋"];
const CHAT_EMOJIS = ["💬","🗣️","💡","🤔","😊","👀"];

// — Pixel character sprite drawer —
function drawPixelChar(ctx: CanvasRenderingContext2D, x: number, y: number, color1: string, color2: string, frame: number, scale = 2) {
  const s = scale;
  // Head
  ctx.fillStyle = "#FFE0BD";
  ctx.fillRect(x + 2*s, y, 4*s, 4*s);
  // Hair
  ctx.fillStyle = color1;
  ctx.fillRect(x + 1*s, y - 1*s, 6*s, 2*s);
  ctx.fillRect(x + 1*s, y + 1*s, 1*s, 2*s);
  ctx.fillRect(x + 6*s, y + 1*s, 1*s, 2*s);
  // Eyes
  ctx.fillStyle = "#333";
  ctx.fillRect(x + 3*s, y + 1*s, 1*s, 1*s);
  ctx.fillRect(x + 5*s, y + 1*s, 1*s, 1*s);
  // Smile
  ctx.fillRect(x + 3*s, y + 3*s, 2*s, 0.5*s);
  // Body
  ctx.fillStyle = color2;
  ctx.fillRect(x + 2*s, y + 4*s, 4*s, 5*s);
  // Arms with walk animation
  const armOffset = frame % 2 === 0 ? 0 : s;
  ctx.fillStyle = color1;
  ctx.fillRect(x + 0*s, y + 4*s + armOffset, 2*s, 3*s);
  ctx.fillRect(x + 6*s, y + 5*s - armOffset, 2*s, 3*s);
  // Legs with walk animation
  ctx.fillStyle = "#555";
  if (frame % 2 === 0) {
    ctx.fillRect(x + 2*s, y + 9*s, 2*s, 2*s);
    ctx.fillRect(x + 4*s, y + 9*s + s, 2*s, 2*s);
  } else {
    ctx.fillRect(x + 2*s, y + 9*s + s, 2*s, 2*s);
    ctx.fillRect(x + 4*s, y + 9*s, 2*s, 2*s);
  }
}

// — Draw furniture —
function drawRoom(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Floor
  const floorGrad = ctx.createLinearGradient(0, h * 0.3, 0, h);
  floorGrad.addColorStop(0, "#F5E6D3");
  floorGrad.addColorStop(1, "#E8D5BE");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 0, w, h);

  // Floor pattern (subtle tile grid)
  ctx.strokeStyle = "rgba(0,0,0,0.04)";
  ctx.lineWidth = 1;
  for (let gx = 0; gx < w; gx += 32) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
  }
  for (let gy = 0; gy < h; gy += 32) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
  }

  // Back wall
  ctx.fillStyle = "#D4C5B0";
  ctx.fillRect(0, 0, w, 40);
  ctx.fillStyle = "#C4B5A0";
  ctx.fillRect(0, 38, w, 4);

  // Window (left)
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(30, 2, 50, 32);
  ctx.strokeStyle = "#A08060";
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 2, 50, 32);
  ctx.beginPath(); ctx.moveTo(55, 2); ctx.lineTo(55, 34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(30, 18); ctx.lineTo(80, 18); ctx.stroke();

  // Window (right)
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(w - 80, 2, 50, 32);
  ctx.strokeStyle = "#A08060";
  ctx.lineWidth = 3;
  ctx.strokeRect(w - 80, 2, 50, 32);
  ctx.beginPath(); ctx.moveTo(w - 55, 2); ctx.lineTo(w - 55, 34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w - 80, 18); ctx.lineTo(w - 30, 18); ctx.stroke();

  // Bookshelf
  ctx.fillStyle = "#8B6914";
  ctx.fillRect(w/2 - 30, 2, 60, 36);
  ctx.fillStyle = "#A07818";
  ctx.fillRect(w/2 - 28, 4, 56, 10);
  ctx.fillRect(w/2 - 28, 16, 56, 10);
  ctx.fillRect(w/2 - 28, 28, 56, 8);
  // Books
  const bookColors = ["#E74C3C","#3498DB","#2ECC71","#F39C12","#9B59B6","#1ABC9C","#E67E22","#E91E63"];
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = bookColors[i % bookColors.length];
    ctx.fillRect(w/2 - 26 + i*8, 5, 6, 8);
    ctx.fillStyle = bookColors[(i+3) % bookColors.length];
    ctx.fillRect(w/2 - 26 + i*8, 17, 6, 8);
  }

  // Sofa (bottom left)
  ctx.fillStyle = "#7B68AE";
  ctx.fillRect(16, h - 55, 64, 30);
  ctx.fillStyle = "#6A5A9E";
  ctx.fillRect(12, h - 55, 8, 35);
  ctx.fillRect(76, h - 55, 8, 35);
  ctx.fillStyle = "#8B7ABE";
  ctx.fillRect(18, h - 50, 60, 8);
  // Cushions
  ctx.fillStyle = "#F4A460";
  ctx.fillRect(24, h - 50, 12, 8);
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(58, h - 50, 12, 8);

  // Coffee table
  ctx.fillStyle = "#A0784A";
  ctx.fillRect(w/2 - 25, h - 42, 50, 22);
  ctx.fillStyle = "#B08858";
  ctx.fillRect(w/2 - 23, h - 40, 46, 18);
  // Cup on table
  ctx.fillStyle = "#FFF";
  ctx.fillRect(w/2 - 5, h - 38, 10, 8);
  ctx.fillStyle = "#8B4513";
  ctx.fillRect(w/2 - 4, h - 37, 8, 5);

  // Plant (bottom right)
  ctx.fillStyle = "#C0764A";
  ctx.fillRect(w - 52, h - 42, 24, 20);
  ctx.fillStyle = "#228B22";
  ctx.fillRect(w - 56, h - 62, 10, 24);
  ctx.fillRect(w - 42, h - 68, 10, 28);
  ctx.fillRect(w - 48, h - 58, 8, 20);
  ctx.fillRect(w - 36, h - 56, 8, 16);

  // Rug (center)
  ctx.fillStyle = "rgba(180, 120, 80, 0.15)";
  ctx.beginPath();
  ctx.ellipse(w/2, h/2 + 20, 80, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(160, 100, 60, 0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// — Draw emoji bubble —
function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, emoji: string, opacity: number) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.arc(x + 8, y - 16, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 1;
  ctx.stroke();
  // Bubble tail
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 6);
  ctx.lineTo(x + 8, y - 2);
  ctx.lineTo(x + 12, y - 6);
  ctx.fill();
  // Emoji
  ctx.font = "11px serif";
  ctx.textAlign = "center";
  ctx.fillText(emoji, x + 8, y - 12);
  ctx.restore();
}

// — Draw name tag —
function drawNameTag(ctx: CanvasRenderingContext2D, x: number, y: number, name: string, color: string) {
  ctx.save();
  const displayName = name.length > 6 ? name.slice(0, 5) + "…" : name;
  ctx.font = "bold 9px 'Courier New', monospace";
  const metrics = ctx.measureText(displayName);
  const tagW = metrics.width + 8;
  const tagH = 12;
  const tagX = x + 8 - tagW/2;
  const tagY = y + 24;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  const r = 3;
  ctx.beginPath();
  ctx.moveTo(tagX + r, tagY);
  ctx.lineTo(tagX + tagW - r, tagY);
  ctx.quadraticCurveTo(tagX + tagW, tagY, tagX + tagW, tagY + r);
  ctx.lineTo(tagX + tagW, tagY + tagH - r);
  ctx.quadraticCurveTo(tagX + tagW, tagY + tagH, tagX + tagW - r, tagY + tagH);
  ctx.lineTo(tagX + r, tagY + tagH);
  ctx.quadraticCurveTo(tagX, tagY + tagH, tagX, tagY + tagH - r);
  ctx.lineTo(tagX, tagY + r);
  ctx.quadraticCurveTo(tagX, tagY, tagX + r, tagY);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#FFF";
  ctx.textAlign = "center";
  ctx.fillText(displayName, x + 8, tagY + 9);
  ctx.restore();
}

// — Chat connection line —
function drawChatLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = "#A08060";
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(x1 + 8, y1 + 6);
  ctx.lineTo(x2 + 8, y2 + 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// — Character state constants —
const STATES = { IDLE: 0, WALKING: 1, CHATTING: 2 };

interface Character {
  id: string;
  name: string;
  personalityType: string;
  color1: string;
  color2: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: number;
  stateTimer: number;
  frame: number;
  emoji: string | null;
  emojiTimer: number;
  chatPartner: string | null;
  speed: number;
  isGhost?: boolean;
}

// — Main Component —
export default function PixelRoom() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const charsRef = useRef<Character[]>([]);
  const ghostCharsRef = useRef<Character[]>([]);
  const frameRef = useRef<number>(0);
  const animRef = useRef<number | null>(null);
  const [dimensions, setDimensions] = useState({ w: 375, h: 280 });
  const [userCount, setUserCount] = useState(0);

  // Generate ghost characters to fill empty slots (up to 8 total)
  const updateGhosts = useCallback((realCount: number, W: number, H: number) => {
    const ghostCount = Math.max(0, 8 - realCount);
    const existing = ghostCharsRef.current;

    if (existing.length === ghostCount) return; // no change needed

    if (ghostCount === 0) {
      ghostCharsRef.current = [];
      return;
    }

    // Reuse existing ghosts where possible, add/remove as needed
    const ghosts: Character[] = [];
    for (let i = 0; i < ghostCount; i++) {
      if (i < existing.length) {
        ghosts.push(existing[i]);
      } else {
        // Spread initial positions evenly using deterministic seeding
        const seed = i / ghostCount;
        ghosts.push({
          id: `ghost-${i}`,
          name: "",
          personalityType: "",
          color1: "#9CA3AF",
          color2: "#9CA3AF",
          x: 30 + seed * (W - 60) + (Math.sin(i * 7.3) * 30),
          y: 55 + (Math.cos(i * 4.1) * 0.5 + 0.5) * (H - 120),
          targetX: 0,
          targetY: 0,
          state: STATES.IDLE,
          stateTimer: 30 + i * 20,
          frame: i * 5,
          emoji: null,
          emojiTimer: 0,
          chatPartner: null,
          speed: (0.4 + Math.random() * 0.3) * 0.6, // 0.6x speed multiplier
          isGhost: true,
        });
      }
    }
    ghostCharsRef.current = ghosts;
  }, []);

  // Fetch users & poll every 30 seconds
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) return;
      const data = await res.json();
      const users = data.users || data || [];

      const W = dimensions.w;
      const H = dimensions.h;
      const existing = charsRef.current;

      const updated = users.map((user: { id: string; name?: string; username?: string; personalityType?: string }) => {
        const prev = existing.find(c => c.id === user.id);
        if (prev) {
          // Update name/personality if changed, keep position & state
          prev.name = user.name || user.username || "???";
          const pType = user.personalityType || "aurora";
          const colors = PERSONALITY_COLORS[pType] || PERSONALITY_COLORS.aurora;
          prev.color1 = colors.primary;
          prev.color2 = colors.secondary;
          prev.personalityType = pType;
          return prev;
        }
        // New user — create character
        const pType = user.personalityType || "aurora";
        const colors = PERSONALITY_COLORS[pType] || PERSONALITY_COLORS.aurora;
        return {
          id: user.id,
          name: user.name || user.username || "???",
          personalityType: pType,
          color1: colors.primary,
          color2: colors.secondary,
          x: 20 + Math.random() * (W - 40),
          y: 50 + Math.random() * (H - 100),
          targetX: 0,
          targetY: 0,
          state: STATES.IDLE,
          stateTimer: Math.random() * 120 + 60,
          frame: Math.floor(Math.random() * 10),
          emoji: null,
          emojiTimer: 0,
          chatPartner: null,
          speed: 0.4 + Math.random() * 0.3,
        };
      });

      charsRef.current = updated;
      setUserCount(updated.length);
      updateGhosts(updated.length, W, H);
    } catch (e) {
      console.error("PixelRoom: failed to fetch users", e);
    }
  }, [dimensions, updateGhosts]);

  // Initial fetch + 30s polling
  useEffect(() => {
    // Generate initial ghosts immediately so the room isn't empty before first fetch
    updateGhosts(0, dimensions.w, dimensions.h);
    fetchUsers();
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, [fetchUsers, updateGhosts, dimensions]);

  // Pick a new random walk target
  const pickTarget = useCallback((char: Character, W: number, H: number) => {
    char.targetX = 20 + Math.random() * (W - 40);
    char.targetY = 50 + Math.random() * (H - 100);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = dimensions.w;
    const H = dimensions.h;

    const tick = () => {
      frameRef.current++;
      const f = frameRef.current;
      const chars = charsRef.current;

      chars.forEach(c => {
        c.stateTimer--;
        c.frame++;

        if (c.emojiTimer > 0) {
          c.emojiTimer--;
          if (c.emojiTimer <= 0) c.emoji = null;
        }

        // State machine
        if (c.stateTimer <= 0) {
          if (c.state === STATES.IDLE) {
            const roll = Math.random();
            if (roll < 0.35 && chars.length > 1) {
              const candidates = chars.filter(o => o.id !== c.id && o.state !== STATES.CHATTING);
              if (candidates.length > 0) {
                const partner = candidates[Math.floor(Math.random() * candidates.length)];
                c.state = STATES.WALKING;
                c.targetX = partner.x + (Math.random() - 0.5) * 20;
                c.targetY = partner.y + (Math.random() - 0.5) * 16;
                c.chatPartner = partner.id;
                c.stateTimer = 200;
              } else {
                c.state = STATES.WALKING;
                pickTarget(c, W, H);
                c.stateTimer = 80 + Math.random() * 120;
              }
            } else {
              c.state = STATES.WALKING;
              pickTarget(c, W, H);
              c.stateTimer = 80 + Math.random() * 120;
            }
          } else if (c.state === STATES.WALKING) {
            if (c.chatPartner) {
              c.state = STATES.CHATTING;
              c.stateTimer = 100 + Math.random() * 150;
              c.emoji = CHAT_EMOJIS[Math.floor(Math.random() * CHAT_EMOJIS.length)];
              c.emojiTimer = 80;
              const partner = chars.find(o => o.id === c.chatPartner);
              if (partner && partner.state !== STATES.CHATTING) {
                partner.state = STATES.CHATTING;
                partner.stateTimer = 100 + Math.random() * 100;
                partner.emoji = CHAT_EMOJIS[Math.floor(Math.random() * CHAT_EMOJIS.length)];
                partner.emojiTimer = 80;
              }
            } else {
              c.state = STATES.IDLE;
              c.stateTimer = 60 + Math.random() * 100;
              if (Math.random() < 0.4) {
                c.emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
                c.emojiTimer = 70;
              }
            }
            c.chatPartner = null;
          } else if (c.state === STATES.CHATTING) {
            c.state = STATES.IDLE;
            c.stateTimer = 40 + Math.random() * 80;
            c.chatPartner = null;
          }
        }

        // Chatting emoji refresh
        if (c.state === STATES.CHATTING && c.emojiTimer <= 0 && Math.random() < 0.03) {
          c.emoji = CHAT_EMOJIS[Math.floor(Math.random() * CHAT_EMOJIS.length)];
          c.emojiTimer = 60 + Math.random() * 40;
        }

        // Movement
        if (c.state === STATES.WALKING) {
          const dx = c.targetX - c.x;
          const dy = c.targetY - c.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > 2) {
            c.x += (dx / dist) * c.speed;
            c.y += (dy / dist) * c.speed;
          } else {
            c.stateTimer = 0;
          }
        }

        // Idle sway
        if (c.state === STATES.IDLE || c.state === STATES.CHATTING) {
          c.x += Math.sin(f * 0.02 + c.x) * 0.05;
        }

        // Bounds
        c.x = Math.max(10, Math.min(W - 26, c.x));
        c.y = Math.max(44, Math.min(H - 46, c.y));
      });

      // — Update ghosts —
      const ghosts = ghostCharsRef.current;
      ghosts.forEach(g => {
        g.stateTimer--;
        g.frame++;

        // Simplified state machine: only IDLE and WALKING (no chatting)
        if (g.stateTimer <= 0) {
          if (g.state === STATES.IDLE) {
            g.state = STATES.WALKING;
            g.targetX = 20 + Math.random() * (W - 40);
            g.targetY = 50 + Math.random() * (H - 100);
            g.stateTimer = 100 + Math.random() * 150;
          } else {
            g.state = STATES.IDLE;
            g.stateTimer = 80 + Math.random() * 120;
          }
        }

        if (g.state === STATES.WALKING) {
          const dx = g.targetX - g.x;
          const dy = g.targetY - g.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 2) {
            g.x += (dx / dist) * g.speed;
            g.y += (dy / dist) * g.speed;
          } else {
            g.stateTimer = 0;
          }
        }

        if (g.state === STATES.IDLE) {
          g.x += Math.sin(f * 0.015 + g.x) * 0.03;
        }

        g.x = Math.max(10, Math.min(W - 26, g.x));
        g.y = Math.max(44, Math.min(H - 46, g.y));
      });

      // — Render —
      ctx.clearRect(0, 0, W, H);
      drawRoom(ctx, W, H);

      // Draw ghosts first (behind real users)
      const sortedGhosts = [...ghosts].sort((a, b) => a.y - b.y);
      ctx.save();
      ctx.globalAlpha = 0.25;
      sortedGhosts.forEach(g => {
        const walkFrame = g.state === STATES.WALKING ? g.frame : 0;
        drawPixelChar(ctx, g.x, g.y, g.color1, g.color2, walkFrame, 2);
      });
      ctx.restore();

      const sorted = [...chars].sort((a, b) => a.y - b.y);

      // Chat lines (behind characters)
      sorted.forEach(c => {
        if (c.state === STATES.CHATTING && c.chatPartner) {
          const partner = chars.find(o => o.id === c.chatPartner);
          if (partner) drawChatLine(ctx, c.x, c.y, partner.x, partner.y);
        }
      });

      // Characters
      sorted.forEach(c => {
        const walkFrame = c.state === STATES.WALKING ? c.frame : 0;
        drawPixelChar(ctx, c.x, c.y, c.color1, c.color2, walkFrame, 2);
        drawNameTag(ctx, c.x, c.y, c.name, c.color1);
        if (c.emoji && c.emojiTimer > 0) {
          const opacity = c.emojiTimer < 15 ? c.emojiTimer / 15 : 1;
          drawBubble(ctx, c.x, c.y, c.emoji, opacity);
        }
      });

      // Online count
      ctx.save();
      ctx.font = "bold 10px 'Courier New', monospace";
      ctx.fillStyle = "rgba(120, 90, 60, 0.5)";
      ctx.textAlign = "right";
      ctx.fillText(`${chars.length} agents online`, W - 10, H - 8);
      ctx.restore();

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [dimensions, pickTarget]);

  // Responsive sizing
  useEffect(() => {
    const handleResize = () => {
      const w = Math.min(window.innerWidth - 32, 500);
      setDimensions({ w, h: Math.round(w * 0.72) });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: 500,
      margin: "0 auto 20px",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
      background: "#F5E6D3",
    }}>
      {/* Title bar */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        padding: "8px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "linear-gradient(180deg, rgba(245,230,211,0.95) 0%, rgba(245,230,211,0) 100%)",
      }}>
        <span style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 13,
          fontWeight: 800,
          color: "#7B5B3A",
          letterSpacing: 1,
        }}>
          🏠 同频小屋
        </span>
        <span style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 10,
          color: "#A08060",
          background: "rgba(255,255,255,0.6)",
          padding: "2px 8px",
          borderRadius: 8,
        }}>
          {userCount} 位伙伴在线
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={dimensions.w}
        height={dimensions.h}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          imageRendering: "auto",
        }}
      />

      {/* Bottom hint */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        textAlign: "center",
        padding: "12px 0 8px",
        background: "linear-gradient(0deg, rgba(245,230,211,0.95) 0%, rgba(245,230,211,0) 100%)",
      }}>
        <span style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 10,
          color: "#A08060",
        }}>
          每位登录的伙伴都会出现在这里 ✨ 点击下方发起AI匹配
        </span>
      </div>
    </div>
  );
}

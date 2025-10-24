import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number; // percent
}

export default function EmojiFloatLayer() {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    // Subscribe to new emoji_reactions
    const subscription = supabase
      .channel("emoji_reactions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emoji_reactions",
        },
        (payload) => {
          const rowId = payload.new?.id;
          const emoji = payload.new?.emoji;
          // Random left position (10% to 80%)
          const left = Math.random() * 70 + 10;
          setEmojis((prev) => [
            ...prev,
            {
              id: String(nextId.current++),
              emoji,
              left,
            },
          ]);

          // As soon as we've read the emoji reaction event, remove it from the server.
          // Fire-and-forget: don't block rendering. Log errors if delete fails.
          if (rowId) {
            (async () => {
              try {
                await supabase.from("emoji_reactions").delete().eq("id", rowId);
              } catch (err) {
                console.error("Failed to delete emoji_reaction row", err);
              }
            })();
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Remove emoji after animation
  useEffect(() => {
    if (emojis.length === 0) return;
    const timer = setTimeout(() => {
      setEmojis((prev) => prev.slice(1));
    }, 1200);
    return () => clearTimeout(timer);
  }, [emojis]);

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        bottom: 0,
        width: "100%",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      {emojis.map((e) => (
        <span
          key={e.id}
          style={{
            position: "absolute",
            left: `${e.left}%`,
            bottom: 0,
            fontSize: "2rem",
            opacity: 0,
            animation: "floatUp 1.2s cubic-bezier(.4,0,.2,1) forwards",
          }}
        >
          {e.emoji}
        </span>
      ))}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          60% { transform: translateY(-60px) scale(1.5); opacity: 1; }
          100% { transform: translateY(-120px) scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

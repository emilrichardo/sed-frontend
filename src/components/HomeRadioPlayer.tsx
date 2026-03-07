"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipForward, Radio } from "lucide-react";
import Link from "next/link";
import {
  extractLexicalText,
  splitIntoChunks,
  getSpanishVoices,
} from "@/utils/tts";

interface Publication {
  id: number;
  titulo: string;
  slug: string;
  contenido?: any;
}

type Phase = "idle" | "loading" | "titulares" | "content";

// ── Animated sound bars ────────────────────────────────────────────────────────
function SoundBars({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-end gap-[2px] h-3.5" aria-hidden>
      {[0.6, 1, 0.75, 0.9, 0.5].map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-current transition-all"
          style={{
            height: active ? `${h * 14}px` : "3px",
            animation: active
              ? `soundbar 0.9s ease-in-out ${i * 0.12}s infinite alternate`
              : "none",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes soundbar {
          from {
            transform: scaleY(0.3);
          }
          to {
            transform: scaleY(1);
          }
        }
      `}</style>
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function HomeRadioPlayer() {
  const [supported, setSupported] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [pubIndex, setPubIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentSlug, setCurrentSlug] = useState("");
  const [voiceIndex, setVoiceIndex] = useState(0);

  // Refs to avoid stale closures in callbacks
  const pubsRef = useRef<Publication[]>([]);
  const pubIdxRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const voiceIdxRef = useRef(0);
  const playingRef = useRef(false);
  const chunksRef = useRef<string[]>([]);
  const chunkIdxRef = useRef(0);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined") speechSynthesis.cancel();
    };
  }, []);

  // Fetch publications when user starts the radio
  const loadPublications = useCallback(async () => {
    if (pubsRef.current.length > 0) return pubsRef.current;
    setPhase("loading");
    try {
      const res = await fetch(
        "/api-proxy/publicaciones?limit=10&sort=-createdAt&depth=1&where[parent][exists]=false",
      );
      const data = await res.json();
      const docs: Publication[] = (data.docs || []).map((d: any) => ({
        id: d.id,
        titulo: d.titulo,
        slug: d.slug,
        contenido: d.contenido,
      }));
      pubsRef.current = docs;
      setPubs(docs);
      return docs;
    } catch {
      setPhase("idle");
      return [];
    }
  }, []);

  // ── Core TTS helpers ──────────────────────────────────────────────────────────

  const getVoice = (idx: number): SpeechSynthesisVoice | null => {
    const voices = getSpanishVoices();
    return voices.length > 0 ? voices[idx % voices.length] : null;
  };

  const speakChunks = useCallback(
    (chunks: string[], vIdx: number, onDone: () => void) => {
      chunksRef.current = chunks;
      chunkIdxRef.current = 0;

      const speakNext = (i: number) => {
        if (!playingRef.current) return;
        if (i >= chunks.length) {
          onDone();
          return;
        }
        chunkIdxRef.current = i;
        const utt = new SpeechSynthesisUtterance(chunks[i]);
        utt.lang = "es-AR";
        utt.rate = 1.1;
        const voice = getVoice(vIdx);
        if (voice) utt.voice = voice;
        utt.onend = () => {
          if (playingRef.current) speakNext(i + 1);
        };
        utt.onerror = (e) => {
          if (e.error !== "interrupted" && playingRef.current) speakNext(i + 1);
        };
        speechSynthesis.speak(utt);
      };

      setTimeout(() => speakNext(0), 50);
    },
    [],
  );

  // ── Phase runners ─────────────────────────────────────────────────────────────

  const runTitulares = useCallback(
    (docs: Publication[]) => {
      phaseRef.current = "titulares";
      setPhase("titulares");
      setCurrentTitle("Titulares");
      setCurrentSlug("");

      const intro =
        "Santiago en Datos Radio. Los titulares de hoy: " +
        docs.map((p, i) => `${i + 1}. ${p.titulo}`).join(". ") +
        ".";
      const chunks = splitIntoChunks(intro, 220);

      speakChunks(chunks, 0, () => {
        if (!playingRef.current) return;
        pubIdxRef.current = 0;
        setPubIndex(0);
        runContent(docs, 0);
      });
    },
    [speakChunks],
  );

  const runContent = useCallback(
    (docs: Publication[], idx: number) => {
      if (!playingRef.current) return;
      if (idx >= docs.length) {
        // Finished all — loop back to titulares
        pubIdxRef.current = 0;
        setPubIndex(0);
        runTitulares(docs);
        return;
      }

      const pub = docs[idx];
      phaseRef.current = "content";
      setPhase("content");
      setPubIndex(idx);
      setCurrentTitle(pub.titulo);
      setCurrentSlug(pub.slug);

      const vIdx = idx % Math.max(getSpanishVoices().length, 1);
      setVoiceIndex(vIdx);
      voiceIdxRef.current = vIdx;

      const bodyText = extractLexicalText(pub.contenido?.root?.children || []);
      const fullText = pub.titulo + ". " + bodyText;
      const chunks = splitIntoChunks(fullText, 220);

      speakChunks(chunks, vIdx, () => {
        if (!playingRef.current) return;
        // Small pause between publications
        setTimeout(() => {
          if (playingRef.current) runContent(docs, idx + 1);
        }, 600);
      });
    },
    [speakChunks, runTitulares],
  );

  // ── Controls ──────────────────────────────────────────────────────────────────

  const play = useCallback(async () => {
    const docs = await loadPublications();
    if (docs.length === 0) return;

    speechSynthesis.cancel();
    playingRef.current = true;
    setIsPlaying(true);
    runTitulares(docs);
  }, [loadPublications, runTitulares]);

  const pause = useCallback(() => {
    speechSynthesis.pause();
    setIsPlaying(false);
    playingRef.current = false;
  }, []);

  const resume = useCallback(() => {
    speechSynthesis.resume();
    setIsPlaying(true);
    playingRef.current = true;
  }, []);

  const skip = useCallback(() => {
    if (!playingRef.current) return;
    speechSynthesis.cancel();
    const docs = pubsRef.current;
    const nextIdx = (pubIdxRef.current + 1) % docs.length;
    pubIdxRef.current = nextIdx;
    setPubIndex(nextIdx);
    setTimeout(() => {
      if (playingRef.current) runContent(docs, nextIdx);
    }, 50);
  }, [runContent]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    playingRef.current = false;
    setIsPlaying(false);
    setPhase("idle");
    setCurrentTitle("");
    setCurrentSlug("");
  }, []);

  const toggle = () => {
    if (phase === "idle") {
      play();
      return;
    }
    if (isPlaying) pause();
    else resume();
  };

  if (!supported) return null;

  const isIdle = phase === "idle";
  const isLoading = phase === "loading";
  const phaseLabel = phase === "titulares" ? "Titulares" : "En vivo";

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs transition-all pointer-events-auto hover:bg-accent hover:text-accent-foreground ${
        isPlaying || phase !== "idle" ? "bg-accent/5" : ""
      }`}
    >
      {/* Live indicator / sound bars */}
      <div className="flex items-center gap-1.5 text-foreground shrink-0">
        {isPlaying ? (
          <SoundBars active={true} />
        ) : (
          <Radio className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {isLoading ? "Cargando..." : isIdle ? "Radio" : phaseLabel}
        </span>
      </div>

      {/* Divider */}
      {!isIdle && <span className="w-px h-3 bg-border shrink-0" />}

      {/* Current title — scrolling marquee */}
      {!isIdle && currentTitle && (
        <div className="overflow-hidden max-w-[140px] sm:max-w-[220px] shrink-0">
          <Link
            href={currentSlug ? `/publicaciones/${currentSlug}` : "#"}
            className="block text-[11px] font-medium text-foreground hover:text-primary whitespace-nowrap animate-[marquee_12s_linear_infinite]"
            onClick={(e) => {
              if (!currentSlug) e.preventDefault();
            }}
          >
            {currentTitle}
          </Link>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={toggle}
          disabled={isLoading}
          className="flex items-center justify-center w-6 h-6 rounded bg-muted hover:bg-muted-foreground/20 text-foreground transition-colors disabled:opacity-50"
          title={isPlaying ? "Pausar" : "Reproducir radio"}
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3 ml-0.5" />
          )}
        </button>

        {isPlaying && phase === "content" && (
          <button
            onClick={skip}
            className="flex items-center justify-center w-6 h-6 rounded bg-muted hover:bg-muted-foreground/20 text-foreground transition-colors"
            title="Siguiente publicación"
          >
            <SkipForward className="h-3 w-3" />
          </button>
        )}

        {!isIdle && (
          <button
            onClick={stop}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1"
            title="Detener"
          >
            ✕
          </button>
        )}
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(0);
          }
          80% {
            transform: translateX(-60%);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

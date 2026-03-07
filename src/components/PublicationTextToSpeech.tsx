"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import { extractLexicalText, splitIntoChunks, getSpanishVoices } from "@/utils/tts";

interface Props {
  content: any; // Lexical root object
  title: string;
  /** Child publications whose content is also shown on this page */
  childrenItems?: Array<{ titulo: string; contenido: any }>;
}

// Re-export local alias for readability
const extractText = (nodes: any[]) => extractLexicalText(nodes);

// ── Component ─────────────────────────────────────────────────────────────────

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

export function PublicationTextToSpeech({ content, title, childrenItems = [] }: Props) {
  const [supported, setSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(1.25);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  const chunksRef = useRef<string[]>([]);
  const chunkIdxRef = useRef(0);
  const speedRef = useRef(speed);
  const playingRef = useRef(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined") speechSynthesis.cancel();
    };
  }, []);

  // Keep speedRef in sync
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const getBestVoice = (): SpeechSynthesisVoice | null => {
    return getSpanishVoices()[0] ?? null;
  };

  const speakChunk = (index: number) => {
    if (!playingRef.current) return;
    const chunks = chunksRef.current;
    if (index >= chunks.length) {
      // Finished
      setIsPlaying(false);
      setIsPaused(false);
      setChunkIndex(0);
      playingRef.current = false;
      return;
    }

    chunkIdxRef.current = index;
    setChunkIndex(index);

    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.lang = "es-AR";
    utterance.rate = speedRef.current;

    // Defer voice selection (voices may load async)
    const voice = getBestVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (playingRef.current) speakChunk(index + 1);
    };
    utterance.onerror = (e) => {
      if (e.error === "interrupted") return;
      setIsPlaying(false);
      setIsPaused(false);
      playingRef.current = false;
    };

    speechSynthesis.speak(utterance);
  };

  const play = () => {
    if (isPaused) {
      speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      playingRef.current = true;
      return;
    }

    // Build chunks: parent title + content + each child title + content
    const parts: string[] = [title + "."];
    const bodyText = extractText(content?.root?.children || []);
    if (bodyText.trim()) parts.push(bodyText);
    for (const child of childrenItems) {
      if (child.titulo) parts.push(child.titulo + ".");
      const childBody = extractText(child.contenido?.root?.children || []);
      if (childBody.trim()) parts.push(childBody);
    }
    const fullText = parts.join(" ");
    const chunks = splitIntoChunks(fullText);
    chunksRef.current = chunks;
    setTotalChunks(chunks.length);

    speechSynthesis.cancel();
    playingRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);

    // voices may not be loaded yet — small defer
    const startAt = chunkIdxRef.current;
    setTimeout(() => speakChunk(startAt), 50);
  };

  const pause = () => {
    speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
    playingRef.current = false;
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setChunkIndex(0);
    chunkIdxRef.current = 0;
    playingRef.current = false;
  };

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    speedRef.current = newSpeed;
    // If currently playing, restart from current chunk at new speed
    if (isPlaying || isPaused) {
      speechSynthesis.cancel();
      playingRef.current = true;
      setIsPlaying(true);
      setIsPaused(false);
      setTimeout(() => speakChunk(chunkIdxRef.current), 50);
    }
  };

  if (!supported) return null;

  const progress =
    totalChunks > 0 ? Math.round((chunkIndex / totalChunks) * 100) : 0;
  const isActive = isPlaying || isPaused;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Label */}
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
        <Volume2 className="h-3.5 w-3.5" />
        Escuchar
      </span>

      {/* Play / Pause */}
      <button
        onClick={isPlaying ? pause : play}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          isPlaying
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
        title={isPlaying ? "Pausar" : isPaused ? "Continuar" : "Reproducir"}
      >
        {isPlaying ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
        {isPlaying ? "Pausar" : isPaused ? "Continuar" : "Reproducir"}
      </button>

      {/* Stop — only when active */}
      {isActive && (
        <button
          onClick={stop}
          className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          title="Detener"
        >
          <Square className="h-3 w-3 text-muted-foreground" />
        </button>
      )}

      {/* Speed selector */}
      <div className="flex items-center gap-0.5 bg-muted rounded-lg overflow-hidden text-xs">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => changeSpeed(s)}
            className={`px-2 py-1.5 transition-colors font-mono ${
              speed === s
                ? "bg-foreground text-background font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* Progress bar — only when active */}
      {isActive && totalChunks > 0 && (
        <div className="flex items-center gap-1.5 min-w-[80px]">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {progress}%
          </span>
        </div>
      )}
    </div>
  );
}

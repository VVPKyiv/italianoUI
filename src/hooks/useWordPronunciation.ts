import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { normalizeReadingWord } from "../content/readingWords";

/** Prefer recorded vocabulary audio, with Italian system speech for other forms. */
export function useWordPronunciation() {
  const client = useQueryClient();
  const run = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");

  const cancel = useCallback(() => {
    run.current += 1;
    clearTimeout(timer.current);
    audio.current?.pause();
    audio.current = null;
    if (utterance.current) {
      utterance.current.onend = null;
      utterance.current.onerror = null;
      window.speechSynthesis?.cancel();
      utterance.current = null;
    }
  }, []);
  const stop = useCallback(() => { cancel(); setState("idle"); }, [cancel]);
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    return cancel;
  }, [cancel]);

  const play = async (word: string, speed: number) => {
    cancel();
    const currentRun = run.current;
    const current = () => run.current === currentRun;
    setState("loading");
    const words = await client.fetchQuery({
      queryKey: ["reading-pronunciation-vocabulary"], queryFn: api.publicWords,
      staleTime: 5 * 60 * 1000, retry: false,
    }).catch(() => []);
    if (!current()) return;
    const recorded = words.find((item) => normalizeReadingWord(item.italian_text) === word);
    if (recorded) {
      const player = new Audio(`/api/v1/speech/words/${recorded.id}/audio`);
      audio.current = player;
      player.playbackRate = speed;
      let loadingTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        await new Promise<void>((resolve, reject) => {
          player.onended = player.onpause = () => resolve();
          player.onerror = () => reject(new Error("audio"));
          loadingTimer = setTimeout(() => reject(new Error("timeout")), 12000);
          timer.current = loadingTimer;
          player.play().then(() => {
            clearTimeout(loadingTimer);
            if (current()) setState("playing");
            else player.pause();
          }).catch(reject);
        });
        if (current()) { audio.current = null; setState("idle"); }
        return;
      } catch {
        clearTimeout(loadingTimer);
        player.onpause = player.onended = player.onerror = null;
        player.pause();
        if (!current()) return;
        audio.current = null;
      }
    }
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setState("error");
      return;
    }
    const speech = new SpeechSynthesisUtterance(word);
    utterance.current = speech;
    speech.lang = "it-IT";
    speech.rate = speed;
    const voice = window.speechSynthesis.getVoices().find((item) => /^it(?:-|_)/i.test(item.lang));
    if (voice) speech.voice = voice;
    speech.onstart = () => { if (current()) { clearTimeout(timer.current); setState("playing"); } };
    speech.onend = () => { if (current()) { clearTimeout(timer.current); utterance.current = null; setState("idle"); } };
    speech.onerror = () => { if (current()) { clearTimeout(timer.current); utterance.current = null; setState("error"); } };
    timer.current = setTimeout(() => {
      if (current()) { cancel(); setState("error"); }
    }, 12000);
    try {
      window.speechSynthesis.speak(speech);
    } catch {
      clearTimeout(timer.current);
      utterance.current = null;
      setState("error");
    }
  };
  return { state, play, stop };
}

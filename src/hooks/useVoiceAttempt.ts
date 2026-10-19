import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioRecorder, microphoneErrorMessage } from "../audio/recording";

export type MicrophoneState = "off" | "requesting" | "ready" | "recording" | "processing" | "blocked" | "error";
export type MicrophonePermission = PermissionState | "unknown" | "unsupported";
type RecordingMode = "word" | "phrase";
const recordingPolicies = {
  word: { maxRecordingMs: 5_000, silenceAfterSpeechMs: 900 },
  phrase: { maxRecordingMs: 15_000, silenceAfterSpeechMs: 2_500 },
};
const MIN_RECORDING_MS = 650;
const SPEECH_LEVEL_THRESHOLD = 0.075;

export function useVoiceAttempt(onAudio: (blob: Blob) => Promise<void>, mode: RecordingMode = "word") {
  const { maxRecordingMs, silenceAfterSpeechMs } = recordingPolicies[mode];
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const generation = useRef(0);
  const requesting = useRef(false);
  const stopTimer = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const meterSource = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrame = useRef<number | null>(null);
  const startedAt = useRef(0);
  const voiceDetected = useRef(false);
  const lastVoiceAt = useRef(0);
  const [microphone, setMicrophone] = useState<MicrophoneState>("off");
  const [permission, setPermission] = useState<MicrophonePermission>("unknown");
  const [error, setError] = useState("");
  const [recordedMs, setRecordedMs] = useState(0);
  const [level, setLevel] = useState(0);

  const releaseStream = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }, []);
  const stopMeter = useCallback(() => {
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    animationFrame.current = null;
    meterSource.current?.disconnect();
    meterSource.current = null;
    setLevel(0);
  }, []);
  const clearTimer = useCallback(() => {
    if (stopTimer.current !== null) window.clearTimeout(stopTimer.current);
    stopTimer.current = null;
  }, []);
  const cancel = useCallback(() => {
    generation.current += 1;
    requesting.current = false;
    clearTimer(); stopMeter();
    const previous = recorder.current;
    recorder.current = null;
    if (previous && previous.state !== "inactive") previous.stop();
    releaseStream();
    setMicrophone("off"); setError("");
  }, [clearTimer, releaseStream, stopMeter]);

  const enable = useCallback(async () => {
    setError("");
    if (!window.isSecureContext) {
      setError("На телефоні мікрофон працює лише через HTTPS. Відкрийте захищену адресу сайту; через HTTP браузер не дає записувати голос.");
      setMicrophone("blocked"); return false;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Цей браузер не підтримує запис голосу. Відкрийте сайт у Safari або Chrome з підтримкою запису.");
      setMicrophone("error"); return false;
    }
    if (stream.current?.active) { setMicrophone("ready"); return true; }
    if (requesting.current) return false;
    requesting.current = true;
    const current = ++generation.current;
    setMicrophone("requesting");
    // Resume from the user's tap: iOS may otherwise leave the level meter suspended.
    try {
      const context = audioContext.current ?? new AudioContext();
      audioContext.current = context;
      void context.resume().catch(() => undefined);
    } catch { /* Recording still works when a level meter is unavailable. */ }
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      if (generation.current !== current) { acquired.getTracks().forEach((track) => track.stop()); return false; }
      stream.current = acquired;
      setPermission("granted"); setMicrophone("ready");
      return true;
    } catch (cause) {
      if (generation.current !== current) return false;
      const denied = cause instanceof Error && ["NotAllowedError", "PermissionDeniedError"].includes(cause.name);
      if (denied) setPermission("denied");
      setError(microphoneErrorMessage(cause)); setMicrophone(denied ? "blocked" : "error");
      return false;
    } finally { if (generation.current === current) requesting.current = false; }
  }, []);

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
  }, []);

  const startMeter = useCallback((mediaStream: MediaStream) => {
    const context = audioContext.current;
    if (!context || context.state === "closed") return;
    const analyser = context.createAnalyser();
    analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.72;
    const source = context.createMediaStreamSource(mediaStream);
    meterSource.current = source; source.connect(analyser);
    const values = new Uint8Array(analyser.frequencyBinCount);
    const update = () => {
      if (recorder.current?.state !== "recording") return;
      analyser.getByteFrequencyData(values);
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      const normalizedLevel = Math.min(1, average / 72);
      const now = performance.now(); const elapsed = now - startedAt.current;
      setLevel(normalizedLevel); setRecordedMs(Math.min(maxRecordingMs, elapsed));
      if (normalizedLevel >= SPEECH_LEVEL_THRESHOLD) { voiceDetected.current = true; lastVoiceAt.current = now; }
      else if (voiceDetected.current && elapsed >= MIN_RECORDING_MS && now - lastVoiceAt.current >= silenceAfterSpeechMs) { stop(); return; }
      animationFrame.current = requestAnimationFrame(update);
    };
    update();
  }, [maxRecordingMs, silenceAfterSpeechMs, stop]);

  const record = useCallback(async () => {
    const mediaStream = stream.current;
    if (!mediaStream?.active || recorder.current) return false;
    const current = generation.current;
    let instance: MediaRecorder;
    try { instance = createAudioRecorder(mediaStream); }
    catch (cause) { releaseStream(); setError(microphoneErrorMessage(cause)); setMicrophone("error"); return false; }
    recorder.current = instance;
    const chunks: Blob[] = [];
    const valid = () => generation.current === current && recorder.current === instance;
    voiceDetected.current = false; lastVoiceAt.current = 0; setRecordedMs(0); setError("");
    instance.ondataavailable = (event) => { if (valid() && event.data.size) chunks.push(event.data); };
    instance.onerror = () => {
      if (!valid()) return;
      recorder.current = null;
      clearTimer(); stopMeter(); releaseStream();
      if (instance.state !== "inactive") instance.stop();
      setError("Запис перервався. Спробуйте ще раз."); setMicrophone("error");
    };
    instance.onstop = async () => {
      if (!valid()) return;
      recorder.current = null;
      clearTimer(); stopMeter(); releaseStream();
      const blob = new Blob(chunks, { type: instance.mimeType || chunks[0]?.type || "audio/webm" });
      if (!blob.size) { setError("Запис порожній. Спробуйте ще раз."); setMicrophone("error"); return; }
      setMicrophone("processing");
      try {
        await onAudio(blob);
        if (generation.current === current) setMicrophone("off");
      } catch {
        // The caller displays the server's specific recognition/transport error.
        if (generation.current === current) setMicrophone("error");
      }
    };
    try { instance.start(100); }
    catch (cause) {
      recorder.current = null; releaseStream();
      setError(microphoneErrorMessage(cause)); setMicrophone("error"); return false;
    }
    startedAt.current = performance.now(); setMicrophone("recording");
    try { startMeter(mediaStream); } catch { stopMeter(); }
    stopTimer.current = window.setTimeout(stop, maxRecordingMs);
    return true;
  }, [clearTimer, onAudio, releaseStream, startMeter, stop, stopMeter, maxRecordingMs]);

  useEffect(() => {
    let active = true;
    let status: PermissionStatus | null = null;
    const detectPermission = async () => {
      if (!navigator.permissions?.query) { if (active) setPermission("unsupported"); return; }
      try {
        status = await navigator.permissions.query({ name: "microphone" as PermissionName });
        if (!active) return;
        setPermission(status.state);
        status.onchange = () => { if (active && status) setPermission(status.state); };
      } catch { if (active) setPermission("unsupported"); }
    };
    void detectPermission();
    return () => { active = false; if (status) status.onchange = null; };
  }, []);
  useEffect(() => () => {
    cancel();
    const context = audioContext.current;
    audioContext.current = null;
    void context?.close().catch(() => undefined);
  }, [cancel]);

  return { microphone, permission, error, enable, record, stop, cancel, disable: cancel, level, recordedMs, maxRecordingMs };
}

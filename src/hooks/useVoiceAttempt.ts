import { useCallback, useEffect, useRef, useState } from "react";

export type MicrophoneState =
  | "off"
  | "requesting"
  | "ready"
  | "recording"
  | "processing"
  | "blocked"
  | "error";

export type MicrophonePermission = PermissionState | "unknown" | "unsupported";

const MAX_RECORDING_MS = 5_000;
const MIN_RECORDING_MS = 650;
const SILENCE_AFTER_SPEECH_MS = 900;
const SPEECH_LEVEL_THRESHOLD = 0.075;

export function useVoiceAttempt(onAudio: (blob: Blob) => Promise<void>) {
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stopTimer = useRef<number | null>(null);
  const discardRecording = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);
  const animationFrame = useRef<number | null>(null);
  const startedAt = useRef(0);
  const voiceDetected = useRef(false);
  const lastVoiceAt = useRef(0);
  const [microphone, setMicrophone] = useState<MicrophoneState>("off");
  const [permission, setPermission] = useState<MicrophonePermission>("unknown");
  const [recordedMs, setRecordedMs] = useState(0);
  const [level, setLevel] = useState(0);

  const releaseStream = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setMicrophone("off");
  }, []);

  const stopMeter = useCallback(() => {
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    animationFrame.current = null;
    setLevel(0);
  }, []);

  const startMeter = useCallback((mediaStream: MediaStream) => {
    const context = audioContext.current ?? new AudioContext();
    audioContext.current = context;
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.72;
    const source = context.createMediaStreamSource(mediaStream);
    source.connect(analyser);
    const values = new Uint8Array(analyser.frequencyBinCount);
    const update = () => {
      analyser.getByteFrequencyData(values);
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      const normalizedLevel = Math.min(1, average / 72);
      const now = performance.now();
      const elapsed = now - startedAt.current;
      setLevel(normalizedLevel);
      setRecordedMs(Math.min(MAX_RECORDING_MS, elapsed));
      if (normalizedLevel >= SPEECH_LEVEL_THRESHOLD) {
        voiceDetected.current = true;
        lastVoiceAt.current = now;
      } else if (
        voiceDetected.current &&
        elapsed >= MIN_RECORDING_MS &&
        now - lastVoiceAt.current >= SILENCE_AFTER_SPEECH_MS &&
        recorder.current?.state === "recording"
      ) {
        recorder.current.stop();
      }
      animationFrame.current = requestAnimationFrame(update);
    };
    update();
  }, []);

  const enable = useCallback(async () => {
    if (stream.current?.active) {
      setMicrophone("ready");
      return true;
    }
    setMicrophone("requesting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      setPermission("granted");
      setMicrophone("ready");
      return true;
    } catch {
      setPermission("denied");
      setMicrophone("blocked");
      return false;
    }
  }, []);

  useEffect(() => {
    let active = true;
    let status: PermissionStatus | null = null;
    const detectPermission = async () => {
      if (!navigator.permissions?.query) {
        if (active) setPermission("unsupported");
        return;
      }
      try {
        status = await navigator.permissions.query({ name: "microphone" as PermissionName });
        if (!active) return;
        setPermission(status.state);
        status.onchange = () => {
          if (!active || !status) return;
          setPermission(status.state);
          if (status.state === "denied") setMicrophone("blocked");
        };
      } catch {
        if (active) setPermission("unsupported");
      }
    };
    void detectPermission();
    return () => {
      active = false;
      if (status) status.onchange = null;
    };
  }, []);

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  const cancel = useCallback(() => {
    discardRecording.current = true;
    if (stopTimer.current !== null) window.clearTimeout(stopTimer.current);
    stopTimer.current = null;
    stopMeter();
    if (recorder.current?.state === "recording") recorder.current.stop();
    else releaseStream();
  }, [releaseStream, stopMeter]);

  const disable = useCallback(() => {
    discardRecording.current = true;
    if (recorder.current?.state === "recording") recorder.current.stop();
    else releaseStream();
  }, [releaseStream]);

  const record = useCallback(async () => {
    const mediaStream = stream.current;
    if (!mediaStream?.active || recorder.current?.state === "recording") return false;
    const chunks: BlobPart[] = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    const instance = new MediaRecorder(mediaStream, { mimeType });
    recorder.current = instance;
    discardRecording.current = false;
    voiceDetected.current = false;
    lastVoiceAt.current = 0;
    setRecordedMs(0);
    instance.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    instance.onerror = () => {
      stopMeter();
      setMicrophone("error");
    };
    instance.onstop = async () => {
      if (stopTimer.current !== null) window.clearTimeout(stopTimer.current);
      stopTimer.current = null;
      stopMeter();
      if (discardRecording.current) {
        discardRecording.current = false;
        releaseStream();
        return;
      }
      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size === 0) {
        setMicrophone("error");
        return;
      }
      setMicrophone("processing");
      try {
        await onAudio(blob);
      } finally {
        releaseStream();
      }
    };
    instance.start(100);
    startedAt.current = performance.now();
    setMicrophone("recording");
    startMeter(mediaStream);
    stopTimer.current = window.setTimeout(stop, MAX_RECORDING_MS);
    return true;
  }, [onAudio, releaseStream, startMeter, stop, stopMeter]);

  useEffect(
    () => () => {
      discardRecording.current = true;
      if (stopTimer.current !== null) window.clearTimeout(stopTimer.current);
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      void audioContext.current?.close();
    },
    [],
  );

  return {
    microphone,
    permission,
    enable,
    record,
    stop,
    cancel,
    disable,
    level,
    recordedMs,
    maxRecordingMs: MAX_RECORDING_MS,
  };
}

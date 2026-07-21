import { useCallback, useEffect, useRef, useState } from "react";

export function useVoiceAttempt(onAudio: (blob: Blob) => Promise<void>) {
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const [microphone, setMicrophone] = useState<"off" | "ready" | "recording" | "blocked">("off");

  const enable = useCallback(async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophone("ready");
      return true;
    } catch {
      setMicrophone("blocked");
      return false;
    }
  }, []);

  const record = useCallback(async () => {
    if (!stream.current || recorder.current?.state === "recording") return;
    const chunks: BlobPart[] = [];
    const instance = new MediaRecorder(stream.current, { mimeType: "audio/webm" });
    recorder.current = instance;
    instance.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    instance.onstop = async () => {
      setMicrophone("ready");
      await onAudio(new Blob(chunks, { type: "audio/webm" }));
    };
    instance.start();
    setMicrophone("recording");
    window.setTimeout(() => { if (instance.state === "recording") instance.stop(); }, 2500);
  }, [onAudio]);

  useEffect(() => () => stream.current?.getTracks().forEach((track) => track.stop()), []);
  return { microphone, enable, record };
}

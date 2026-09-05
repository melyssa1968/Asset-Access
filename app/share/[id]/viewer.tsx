"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ArrowDownToLine, ChevronLeft, ChevronRight, FileText, LockKeyhole, ShieldCheck } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

const BASE_PATH = "/asset-access";

type Meta = {
  asset: { name: string; fileName: string; contentType: string; size: number };
  link: { requireEmail: boolean; allowDownload: boolean; expiresAt: string | null };
};

function track(id: string, event: "heartbeat" | "watch" | "complete" | "download", durationMs: number, progress: number) {
  fetch(`${BASE_PATH}/api/public/share/${id}/track`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event, durationMs: Math.round(durationMs), progress: Math.round(progress) }),
    keepalive: true,
  }).catch(() => {});
}

function PdfViewer({ src, name, onProgress }: { src: string; name: string; onProgress: (value: number) => void }) {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(700);
  const holder = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    const resize = () => setWidth(Math.max(280, Math.min(1100, node.clientWidth - 24)));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  function selectPage(next: number) {
    setPage(next);
    if (pages) onProgress(Math.round((next / pages) * 100));
  }
  return <div className="pdf-pager" ref={holder}>
    <div className="pdf-page"><Document file={src} loading={<div className="viewer-loading">Loading deck…</div>} error={<div className="viewer-loading">This PDF could not be displayed.</div>} onLoadSuccess={({ numPages }) => { setPages(numPages); setPage(1); onProgress(Math.round(100 / numPages)); }}><Page pageNumber={page} width={width} renderAnnotationLayer={false} renderTextLayer={false} /></Document></div>
    {pages > 1 && <nav className="pdf-controls" aria-label="Slide navigation"><button onClick={() => selectPage(Math.max(1, page - 1))} disabled={page === 1}><ChevronLeft />Previous</button><span>Slide {page} of {pages}</span><button onClick={() => selectPage(Math.min(pages, page + 1))} disabled={page === pages}>Next<ChevronRight /></button></nav>}
    <span className="sr-only">{name}</span>
  </div>;
}

function DocumentEngagement({ id, progress }: { id: string; progress: number }) {
  const started = useRef(Date.now());
  const progressRef = useRef(progress);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => {
    const send = () => track(id, "heartbeat", Date.now() - started.current, progressRef.current);
    const timer = window.setInterval(send, 15000);
    window.addEventListener("pagehide", send);
    return () => { window.clearInterval(timer); window.removeEventListener("pagehide", send); send(); };
  }, [id]);
  return null;
}

function TrackedVideo({ src, id }: { src: string; id: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchedMs = useRef(0);
  const lastPlayAt = useRef<number | null>(null);
  const maxProgress = useRef(0);
  const autoplayAttempted = useRef(false);

  function accrue() {
    if (lastPlayAt.current === null) return;
    watchedMs.current += performance.now() - lastPlayAt.current;
    lastPlayAt.current = performance.now();
  }
  function snapshot(event: "watch" | "complete") {
    accrue();
    const video = videoRef.current;
    if (video?.duration && Number.isFinite(video.duration)) {
      maxProgress.current = Math.max(maxProgress.current, Math.round((video.currentTime / video.duration) * 100));
    }
    track(id, event, watchedMs.current, event === "complete" ? 100 : maxProgress.current);
  }
  async function startAutomatically() {
    const video = videoRef.current;
    if (!video || autoplayAttempted.current) return;
    autoplayAttempted.current = true;
    video.muted = false;
    try {
      await video.play();
    } catch {
      video.muted = true;
      await video.play().catch(() => {});
    }
  }
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) snapshot("watch");
    }, 10000);
    const sendFinal = () => snapshot(videoRef.current?.ended ? "complete" : "watch");
    window.addEventListener("pagehide", sendFinal);
    return () => { window.clearInterval(timer); window.removeEventListener("pagehide", sendFinal); sendFinal(); };
  }, [id]);

  return <div className="video-stage"><video
    ref={videoRef}
    autoPlay
    controls
    playsInline
    preload="auto"
    src={src}
    onCanPlay={startAutomatically}
    onPlay={() => { lastPlayAt.current = performance.now(); }}
    onPause={() => snapshot("watch")}
    onEnded={() => snapshot("complete")}
    onTimeUpdate={() => {
      const video = videoRef.current;
      if (video?.duration && Number.isFinite(video.duration)) maxProgress.current = Math.max(maxProgress.current, Math.round((video.currentTime / video.duration) * 100));
    }}
  >Your browser does not support this video.</video></div>;
}

export default function ShareViewer({ id }: { id: string }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [granted, setGranted] = useState(false);
  const [documentProgress, setDocumentProgress] = useState(0);
  useEffect(() => {
    fetch(`${BASE_PATH}/api/public/share/${id}`).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setMeta(body);
      setLoading(false);
      if (!body.link.requireEmail) await grant("");
    }).catch(cause => { setError(cause.message); setLoading(false); });
  }, [id]);
  async function grant(value: string) {
    const response = await fetch(`${BASE_PATH}/api/public/share/${id}/access`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: value }) });
    const body = await response.json();
    if (!response.ok) { setError(body.error); return; }
    setGranted(true);
    setError("");
  }
  async function submit(event: FormEvent) { event.preventDefault(); await grant(email); }
  function download() { track(id, "download", 0, 0); }

  if (loading) return <main className="viewer-shell"><div className="viewer-card">Preparing document…</div></main>;
  if (error && !meta) return <main className="viewer-shell"><div className="viewer-card unavailable"><LockKeyhole /><h1>Link unavailable</h1><p>{error}</p></div></main>;
  if (!meta) return null;
  if (!granted) return <main className="viewer-shell"><div className="viewer-brand"><span>A</span>Assetly</div><div className="gate-card"><div className="doc-badge"><FileText /></div><p className="eyebrow">Shared with you</p><h1>{meta.asset.name}</h1><p>Enter your work email to view this asset.</p><form onSubmit={submit}><label htmlFor="visitor-email">Work email</label><input id="visitor-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" required /><button type="submit">View asset</button>{error && <span className="form-error">{error}</span>}</form><div className="privacy"><ShieldCheck />Your email is shared only with the asset owner.</div></div></main>;

  const pdf = meta.asset.contentType === "application/pdf";
  const video = meta.asset.contentType.startsWith("video/");
  const fileUrl = `${BASE_PATH}/api/public/share/${id}/file`;
  return <main className="document-shell">
    {!video && <DocumentEngagement id={id} progress={documentProgress} />}
    <header className="document-header"><div className="viewer-brand"><span>A</span>Assetly</div><div className="document-title"><FileText /><div><b>{meta.asset.name}</b><small>{meta.asset.fileName}</small></div></div>{meta.link.allowDownload ? <a href={`${fileUrl}?download=1`} onClick={download} className="download-button"><ArrowDownToLine />Download</a> : <span className="download-disabled"><LockKeyhole />View only</span>}</header>
    <section className="document-stage">{pdf ? <PdfViewer src={fileUrl} name={meta.asset.name} onProgress={setDocumentProgress} /> : video ? <TrackedVideo src={fileUrl} id={id} /> : <div className="unsupported-view"><FileText /><h2>{meta.asset.name}</h2><p>This file is available through its original application format.</p>{meta.link.allowDownload && <a href={`${fileUrl}?download=1`} onClick={download}>Download file</a>}</div>}</section>
  </main>;
}

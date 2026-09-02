"use client";

import dynamic from "next/dynamic";

const ShareViewer = dynamic(() => import("./viewer"), {
  ssr: false,
  loading: () => <main className="viewer-shell"><div className="viewer-card">Preparing document…</div></main>,
});

export default function ShareViewerClient({ id }: { id: string }) {
  return <ShareViewer id={id} />;
}

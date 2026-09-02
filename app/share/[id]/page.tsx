import ShareViewerClient from "./viewer-client";

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  return <ShareViewerClient id={(await params).id} />;
}

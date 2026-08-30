"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ArrowDownToLine, ChevronLeft, ChevronRight, FileText, LockKeyhole, ShieldCheck } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

type Meta={asset:{name:string;fileName:string;contentType:string;size:number};link:{requireEmail:boolean;allowDownload:boolean;expiresAt:string|null}};

function PdfViewer({src,name}:{src:string;name:string}){
 const [pages,setPages]=useState(0),[page,setPage]=useState(1),[width,setWidth]=useState(700),holder=useRef<HTMLDivElement>(null);
 useEffect(()=>{const node=holder.current;if(!node)return;const resize=()=>setWidth(Math.max(280,Math.min(1100,node.clientWidth-24)));resize();const observer=new ResizeObserver(resize);observer.observe(node);return()=>observer.disconnect()},[]);
 return <div className="pdf-pager" ref={holder}><div className="pdf-page"><Document file={src} loading={<div className="viewer-loading">Loading deck…</div>} error={<div className="viewer-loading">This PDF could not be displayed.</div>} onLoadSuccess={({numPages})=>{setPages(numPages);setPage(1)}}><Page pageNumber={page} width={width} renderAnnotationLayer={false} renderTextLayer={false}/></Document></div>{pages>1&&<nav className="pdf-controls" aria-label="Slide navigation"><button onClick={()=>setPage(value=>Math.max(1,value-1))} disabled={page===1}><ChevronLeft/>Previous</button><span>Slide {page} of {pages}</span><button onClick={()=>setPage(value=>Math.min(pages,value+1))} disabled={page===pages}>Next<ChevronRight/></button></nav>}<span className="sr-only">{name}</span></div>
}

export default function ShareViewer({id}:{id:string}){
 const[meta,setMeta]=useState<Meta|null>(null),[loading,setLoading]=useState(true),[email,setEmail]=useState(""),[error,setError]=useState(""),[granted,setGranted]=useState(false),started=useRef(Date.now());
 useEffect(()=>{fetch(`/api/public/share/${id}`).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error);setMeta(j);setLoading(false);if(!j.link.requireEmail)await grant("")}).catch(e=>{setError(e.message);setLoading(false)})},[id]);
 useEffect(()=>{if(!granted)return;const send=()=>{const durationMs=Date.now()-started.current;fetch(`/api/public/share/${id}/track`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({event:"heartbeat",durationMs,progress:Math.min(95,Math.round(durationMs/3000))}),keepalive:true}).catch(()=>{})};const timer=setInterval(send,15000);return()=>{clearInterval(timer);send()}},[granted,id]);
 async function grant(value:string){const r=await fetch(`/api/public/share/${id}/access`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:value})}),j=await r.json();if(!r.ok){setError(j.error);return}setGranted(true);setError("")}
 async function submit(e:FormEvent){e.preventDefault();await grant(email)}
 function download(){fetch(`/api/public/share/${id}/track`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({event:"download",durationMs:Date.now()-started.current,progress:100}),keepalive:true}).catch(()=>{})}
 if(loading)return <main className="viewer-shell"><div className="viewer-card">Preparing document…</div></main>;
 if(error&&!meta)return <main className="viewer-shell"><div className="viewer-card unavailable"><LockKeyhole/><h1>Link unavailable</h1><p>{error}</p></div></main>;
 if(!meta)return null;
 if(!granted)return <main className="viewer-shell"><div className="viewer-brand"><span>A</span>Assetly</div><div className="gate-card"><div className="doc-badge"><FileText/></div><p className="eyebrow">Shared with you</p><h1>{meta.asset.name}</h1><p>Enter your work email to view this asset.</p><form onSubmit={submit}><label htmlFor="visitor-email">Work email</label><input id="visitor-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required/><button type="submit">View asset</button>{error&&<span className="form-error">{error}</span>}</form><div className="privacy"><ShieldCheck/>Your email is shared only with the asset owner.</div></div></main>;
 const pdf=meta.asset.contentType==="application/pdf",video=meta.asset.contentType.startsWith("video/"),fileUrl=`/api/public/share/${id}/file`;
 return <main className="document-shell"><header className="document-header"><div className="viewer-brand"><span>A</span>Assetly</div><div className="document-title"><FileText/><div><b>{meta.asset.name}</b><small>{meta.asset.fileName}</small></div></div>{meta.link.allowDownload?<a href={`${fileUrl}?download=1`} onClick={download} className="download-button"><ArrowDownToLine/>Download</a>:<span className="download-disabled"><LockKeyhole/>View only</span>}</header><section className="document-stage">{pdf?<PdfViewer src={fileUrl} name={meta.asset.name}/>:video?<div className="video-stage"><video controls playsInline preload="metadata" src={fileUrl}>Your browser does not support this video.</video></div>:<div className="unsupported-view"><FileText/><h2>{meta.asset.name}</h2><p>This file is available through its original application format.</p>{meta.link.allowDownload&&<a href={`${fileUrl}?download=1`} onClick={download}>Download file</a>}</div>}</section></main>
}

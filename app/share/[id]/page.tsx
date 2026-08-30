import ShareViewer from "./viewer";
export default async function SharePage({params}:{params:Promise<{id:string}>}){return <ShareViewer id={(await params).id}/>}

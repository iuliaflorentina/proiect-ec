import{c as w}from"./index-CevA74IY.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=w("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]]),v=async(e,{maxWidth:r=1024,quality:p=.8}={})=>{if(!e||!e.type.startsWith("image/"))return e;try{return await new Promise((s,i)=>{const c=new FileReader;c.onload=g=>{const t=new Image;t.onload=()=>{const a=document.createElement("canvas");let o=t.width,n=t.height;o>r&&(n=r/o*n,o=r),a.width=o,a.height=n,a.getContext("2d").drawImage(t,0,0,o,n),a.toBlob(d=>{if(!d){i(new Error("Canvas toBlob failed"));return}const l="webp",m=new File([d],e.name.replace(/\.[^/.]+$/,"")+"."+l,{type:"image/"+l,lastModified:Date.now()});s(m)},"image/webp",p)},t.onerror=i,t.src=g.target.result},c.onerror=i,c.readAsDataURL(e)})}catch(s){return console.error("Image compression failed, using original file:",s),e}};export{u as U,v as c};

import React from 'react';

type IconName='shield'|'home'|'search'|'archive'|'chart'|'history'|'messages'|'user'|'building'|'visit'|'fire'|'users'|'requests'|'contract'|'whatsapp'|'info'|'menu'|'logout'|'bell'|'clock'|'check'|'wrench'|'helmet'|'engineering'|'quality'|'handshake'|'target'|'map'|'phone'|'document'|'finance';
const paths:Record<IconName,React.ReactNode>={
shield:<><path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
home:<><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
archive:<><path d="M4 7h16v14H4zM3 3h18v4H3z"/><path d="M9 11h6"/></>,
chart:<><path d="M4 20V11h4v9M10 20V4h4v16M16 20v-7h4v7"/><path d="M2 20h20"/></>,
history:<><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
messages:<><path d="M4 4h16v13H9l-5 4z"/><path d="M8 9h8M8 13h5"/></>,
user:<><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2z"/></>,
building:<><path d="M4 21V5l9-2v18M13 9h7v12M2 21h20"/><path d="M7 8h2M7 12h2M7 16h2M16 12h1M16 16h1"/></>,
visit:<><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h6"/></>,
fire:<><path d="M13 3c1 4-3 5-2 8 1-1 2-2 2-3 4 3 6 6 4 10a6 6 0 0 1-11-2c0-3 2-5 4-7 0 3 1 4 2 4-1-4 2-6 1-10z"/></>,
users:<><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2z"/><path d="M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5"/></>,
requests:<><path d="M7 3h8l4 4v14H5V3z"/><path d="M15 3v5h4M8 12h6M8 16h6"/></>,
contract:<><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h4M8 12h8M8 16h6"/></>,
whatsapp:<><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5z"/><path d="M9 8c.5 2 2 3.5 4 4l1-1 2 1c-.4 2-2 2.5-4 1.5-2.5-1.2-4-3-4-5z"/></>,
info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7h.01"/></>,
menu:<><path d="M4 6h16M4 12h16M4 18h16"/></>,
logout:<><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10"/></>,
bell:<><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
check:<><path d="m4 12 5 5L20 6"/></>,
wrench:<><path d="M14 7a5 5 0 0 0-6 6L3 18l3 3 5-5a5 5 0 0 0 6-6l-3 3-3-3z"/></>,
helmet:<><path d="M3 14a9 9 0 0 1 18 0zM2 14h20M12 5v9M5 14v3M19 14v3"/></>,
engineering:<><path d="M4 21V5l9-2v18M13 9h7v12M2 21h20"/><path d="M7 8h2M7 12h2M16 13h1"/></>,
quality:<><path d="m12 3 8 3v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z"/><path d="m8 12 2.5 2.5L16 9"/></>,
handshake:<><path d="m3 9 4-4 5 2 5-2 4 4-5 8-4-2-4 2z"/><path d="m7 5 5 5 5-5M9 14l3 3 3-3"/></>,
target:<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
map:<><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></>,
phone:<><path d="M6 3h4l2 5-3 2a14 14 0 0 0 5 5l2-3 5 2v4c0 2-2 3-4 2C9 18 5 14 3 7 2 5 4 3 6 3z"/></>,
document:<><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h4M8 12h8M8 16h8"/></>,
finance:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3M16 15h1"/><path d="M7 3v2M17 3v2"/></>
};
const names:Record<string,IconName>={home:'home',search:'search',archive:'archive',reports:'chart',audit:'history',messages:'messages',leads:'user',sites:'building',visits:'visit',maintenance:'fire',delegates:'users',requests:'requests',documents:'contract',invite:'whatsapp',about:'info',siteProfile:'building',finance:'finance',shield:'shield'};
export function OrkeitIcon({name,size=22,className='',title}:{name:string;size?:number;className?:string;title?:string}){
 const key=(name in paths?name:names[name]||'shield') as IconName;
 return <svg className={'orkeitIcon '+className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" role={title?'img':'presentation'} aria-label={title} aria-hidden={title?undefined:true}>{title&&<title>{title}</title>}{paths[key]}</svg>;
}

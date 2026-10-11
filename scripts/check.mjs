import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = await readFile('dist/index.html','utf8');
const script = await readFile('dist/assets/app.js','utf8');
const mapScript = await readFile('dist/assets/project-map.js','utf8');
const vendor = await Promise.all(['lucide.js','qrcode.js','focus.js','alpine.js','leaflet.js','motion.js','gesture.js'].map(name => readFile('dist/assets/vendor/' + name,'utf8')));
const prefix = 'building-passport:BS-1184:';
let checks = 0;
const pass = label => { checks++; console.log('PASS ' + label); };
const tick = () => new Promise(resolve => setTimeout(resolve,100));

async function boot(stored = {}, blocked = false, { mobile = false, offline = false } = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!String(e).includes('navigation')) errors.push(e.message); });
  vc.on('warn', (...args) => { if (String(args[0]).includes('Alpine')) errors.push(args.join(' ')); });
  const dom = new JSDOM(html,{ url:'https://building-passport.amirreza-riahi3311.chatgpt.site/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc });
  const { window:w } = dom;
  w.matchMedia = q => ({ matches:q.includes('reduced-motion') || (mobile && q.includes('max-width')),media:q,addEventListener(){},removeEventListener(){} });
  Object.defineProperty(w.navigator,'onLine',{value:!offline,configurable:true});
  const maps = [];
  const sizes = new Map([
    ['project-map',{width:mobile ? 354 : 640,height:mobile ? 320 : 380}],
    ['expanded-project-map',{width:mobile ? 390 : 1000,height:mobile ? 580 : 600}],
  ]);
  for (const [id] of sizes) {
    const el = w.document.getElementById(id);
    Object.defineProperty(el,'clientWidth',{get:()=>sizes.get(id).width});
    Object.defineProperty(el,'clientHeight',{get:()=>sizes.get(id).height});
    el.getBoundingClientRect = () => ({x:0,y:0,top:0,left:0,right:sizes.get(id).width,bottom:sizes.get(id).height,...sizes.get(id)});
  }
  const observers = new Set();
  w.ResizeObserver = class {
    constructor(callback) { this.callback=callback;observers.add(this); }
    observe(el) { this.el=el; }
    disconnect() { observers.delete(this); }
  };
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLAnchorElement.prototype.click = function() { this.dataset.clicked = 'true'; };
  w.URL.createObjectURL = blob => { w.lastDownloadBlob = blob; return 'blob:test'; };
  w.URL.revokeObjectURL = () => {};
  w.addEventListener('error', e => { errors.push(e.error?.message || e.message); e.preventDefault(); });
  for (const [key,value] of Object.entries(stored)) w.localStorage.setItem(key,value);
  if (blocked) Object.defineProperty(w,'localStorage',{ get(){ throw new Error('Storage unavailable'); } });
  w.eval(vendor[5]); w.eval(vendor[4]); w.eval(vendor[6]);
  const mapFactory = w.L.map;
  w.L.map = (...args) => { const map=mapFactory(...args);maps.push(map);return map; };
  w.eval(vendor[0]); w.eval(vendor[1]); w.eval(vendor[2]); w.eval(mapScript); w.eval(script); w.eval(vendor[3]);
  await tick();
  const d = w.document;
  return { dom,w,d,state:w.Alpine.$data(d.body),errors,maps,
    resizeMap(id,width,height) { sizes.set(id,{width,height});for(const observer of observers)if(observer.el.id===id)observer.callback([{target:observer.el}]); },
  };
}

function input(ctx,selector,value,type='input') { const el=ctx.d.querySelector(selector); assert.ok(el,selector); el.value=value; el.dispatchEvent(new ctx.w.Event(type,{ bubbles:true })); }
function click(ctx,selector) { const el=ctx.d.querySelector(selector); assert.ok(el,selector); el.dispatchEvent(new ctx.w.MouseEvent('click',{ bubbles:true })); }
function submit(ctx,selector) { const el=ctx.d.querySelector(selector); (el.matches('form')?el:el.closest('form')).dispatchEvent(new ctx.w.Event('submit',{ bubbles:true,cancelable:true })); }
function snapshot(ctx) { return Object.fromEntries(Array.from({length:ctx.w.localStorage.length},(_,i)=>{ const k=ctx.w.localStorage.key(i);return [k,ctx.w.localStorage.getItem(k)]; })); }
function liveTiles(ctx,id='project-map') { return Array.from(ctx.d.querySelectorAll(`#${id} .project-live-tiles img`)); }
async function finishTiles(ctx,source='osm',id='project-map') {
  for (let round=0;round<4;round++) {
    await tick();
    const pending=liveTiles(ctx,id).filter(tile=>typeof tile.onload==='function');
    if (!pending.length && liveTiles(ctx,id).every(tile=>tile.classList.contains('leaflet-tile-loaded'))) return;
    for (const tile of pending) {
      if (source==='offline')tile.onerror?.(new ctx.w.Event('error'));
      else tile.onload?.(new ctx.w.Event('load'));
    }
  }
}

const ctx = await boot();
assert.equal(ctx.state.view,'public');
assert.equal(ctx.d.querySelectorAll('.person-card').length,16);
assert.equal(ctx.state.team.filter(p=>p.group==='design').length,4);
assert.equal(ctx.state.team.filter(p=>p.group==='supervision').length,5);
assert.equal(ctx.state.team.filter(p=>p.group==='execution').length,2);
assert.equal(ctx.state.team.filter(p=>p.group==='specialists').length,5);
assert.equal(new Set(ctx.state.team.map(p=>p.role)).size,16);
assert.equal(ctx.d.querySelector('#control-page').style.display,'none');
assert.equal(ctx.d.documentElement.lang,'fa'); assert.equal(ctx.d.documentElement.dir,'rtl');
assert.equal(typeof ctx.w.Motion.animate,'function');assert.equal(typeof ctx.w.Motion.inView,'function');
pass('Public project contains all 16 requested roles; inspection panel starts hidden.');

click(ctx,'.segmented button:nth-of-type(3)'); await tick();
assert.equal(ctx.d.querySelectorAll('.person-card').length,5);
input(ctx,'.people-toolbar input','كاظمي'); await tick();
assert.equal(ctx.d.querySelectorAll('.person-card').length,1);
assert.match(ctx.d.querySelector('.person-name').textContent,/کاظمی/);
input(ctx,'.people-toolbar input','نامی که وجود ندارد'); await tick();
assert.equal(ctx.d.querySelectorAll('.person-card').length,0);
click(ctx,'#team .empty-state button'); await tick();
assert.equal(ctx.d.querySelectorAll('.person-card').length,16);
pass('Team groups, Arabic/Persian search normalization and empty-state recovery work.');

click(ctx,'.header-login'); await tick();
assert.equal(ctx.state.modal,'login');
input(ctx,'#phone-input','123'); submit(ctx,'#phone-input'); await tick();
assert.equal(ctx.state.view,'public'); assert.ok(ctx.state.phoneError);
assert.equal(ctx.d.querySelector('#phone-input').getAttribute('aria-invalid'),'true');
input(ctx,'#phone-input','۰۹۱۲۳۴۵۶۷۸۹'); submit(ctx,'#phone-input'); await tick();
assert.equal(ctx.state.phone,'09123456789'); assert.equal(ctx.state.view,'control'); assert.equal(ctx.state.modal,'');
assert.equal(JSON.parse(ctx.w.localStorage.getItem(prefix+'session')),'09123456789');
assert.equal(ctx.d.querySelector('#reports-panel').style.display,'');
pass('Invalid phone stays in login; any valid Persian-digit mobile enters the demo.');

click(ctx,'#labs-tab'); await tick();
assert.equal(ctx.d.querySelector('#labs-tab').getAttribute('aria-selected'),'true');
assert.equal(ctx.d.querySelectorAll('#labs-panel .lab-card').length,2);
click(ctx,'#labs-panel .lab-card button'); await tick();
assert.equal(ctx.state.documentKind,'lab'); assert.match(ctx.d.querySelector('.document-body').textContent,/۳۴٫۲/);
ctx.w.dispatchEvent(new ctx.w.KeyboardEvent('keydown',{ key:'Escape',bubbles:true })); await tick();
assert.equal(ctx.state.modal,'');
click(ctx,'#letters-tab'); await tick(); assert.equal(ctx.d.querySelectorAll('#letters-panel .report-card').length,3);
click(ctx,'#letters-panel .report-card'); await tick();
assert.equal(ctx.state.documentKind,'letter'); assert.match(ctx.d.querySelector('.document-body').textContent,/هماهنگ/);
click(ctx,'.document-footer .button-primary'); await tick();
assert.equal(ctx.w.lastDownloadBlob.type,'text/plain;charset=utf-8');
click(ctx,'[aria-labelledby="document-title"] .modal-close'); await tick();
pass('Both laboratory results, all three letters, detail dialogs and text download work.');

click(ctx,'#reports-tab'); await tick();
ctx.d.querySelector('#reports-tab').dispatchEvent(new ctx.w.KeyboardEvent('keydown',{ key:'ArrowLeft',bubbles:true })); await tick();
assert.equal(ctx.state.controlTab,'labs'); assert.equal(ctx.d.activeElement.id,'labs-tab');
assert.equal(ctx.d.querySelector('#reports-tab').tabIndex,-1);
ctx.d.querySelector('#labs-tab').dispatchEvent(new ctx.w.KeyboardEvent('keydown',{ key:'End',bubbles:true })); await tick();
assert.equal(ctx.state.controlTab,'letters');
pass('Inspection tabs support RTL arrow keys, Home/End and managed focus.');

click(ctx,'.dash-tabbar > button'); await tick();
assert.equal(ctx.state.modal,'report'); assert.equal(ctx.d.querySelectorAll('#report-role option').length,8);
submit(ctx,'#report-title'); await tick();
assert.ok(ctx.state.formErrors.title); assert.ok(ctx.state.formErrors.role); assert.ok(ctx.state.formErrors.body);
assert.equal(ctx.state.reports.length,4);
input(ctx,'#report-title','بازدید آزمایشی طبقه سوم');
input(ctx,'#report-role','ناظر سازه','change');
input(ctx,'#report-stage','اجرای اسکلت','change');
const reportBody='بازدید از ستون‌ها و اتصالات طبقه سوم انجام شد. <img src=x onerror=alert(1)> این متن باید عیناً نمایش داده شود.';
input(ctx,'#report-body',reportBody);
const attention=ctx.d.querySelector('input[name="outcome"][value="نیاز به پیگیری"]'); attention.checked=true;attention.dispatchEvent(new ctx.w.Event('change',{bubbles:true}));
await new Promise(resolve=>setTimeout(resolve,420));
assert.equal(JSON.parse(ctx.w.localStorage.getItem(prefix+'draft:09123456789')).body,reportBody);
click(ctx,'[aria-labelledby="report-form-title"] .modal-close'); await tick();
click(ctx,'.dash-tabbar > button'); await tick();
assert.equal(ctx.d.querySelector('#report-body').value,reportBody);
pass('Report validation prevents blank reports; closing and reopening preserves the draft.');

submit(ctx,'#report-title'); await tick();
assert.equal(ctx.state.modal,''); assert.equal(ctx.state.controlTab,'reports'); assert.equal(ctx.state.reports.length,5);
assert.equal(ctx.d.querySelectorAll('#reports-panel .report-card').length,5);
const saved=JSON.parse(ctx.w.localStorage.getItem(prefix+'reports'));
assert.equal(saved.length,1); assert.equal(saved[0].body,reportBody); assert.equal(saved[0].outcome,'نیاز به پیگیری');
assert.equal(ctx.w.localStorage.getItem(prefix+'draft:09123456789'),null);
input(ctx,'.record-filter','mine','change'); await tick(); assert.equal(ctx.d.querySelectorAll('#reports-panel .report-card').length,1);
click(ctx,'#reports-panel .report-card'); await tick();
assert.equal(ctx.d.querySelector('.document-body').textContent,reportBody); assert.equal(ctx.d.querySelector('.document-body img'),null);
pass('Report persists, appears under My reports and renders user-entered markup as safe text.');

const refreshed=await boot(snapshot(ctx));
assert.equal(refreshed.state.phone,'09123456789'); assert.equal(refreshed.state.reports.length,5);
refreshed.state.enterControl(); await tick(); assert.equal(refreshed.state.view,'control');
refreshed.state.logout(); await tick(); assert.equal(refreshed.state.phone,'');assert.equal(refreshed.state.view,'public');
assert.equal(refreshed.d.querySelector('#control-page').style.display,'none');
assert.equal(refreshed.state.reports.length,5);
refreshed.state.enterControl();await tick();input(refreshed,'#phone-input','+98 912 345 6780');submit(refreshed,'#phone-input');await tick();
assert.equal(refreshed.state.phone,'09123456780');assert.equal(refreshed.state.hasDraft,false);
input(refreshed,'.record-filter','mine','change');await tick();assert.equal(refreshed.state.filteredReports.length,0);
pass('Refresh restores records; logout retains reports; another mobile has separate personal records.');

ctx.state.closeModal();ctx.state.goPublic();await tick();click(ctx,'.header-qr');await tick();
assert.match(ctx.state.qrImage,/^data:image\/gif;base64,/);
assert.equal(ctx.state.publicUrl,'https://building-passport.amirreza-riahi3311.chatgpt.site/');
assert.ok(ctx.d.querySelector('.leaflet-marker-icon'));assert.match(ctx.d.querySelector('.leaflet-marker-icon').textContent,/شهید بهشتی/);
const directions=ctx.d.querySelector('.location-copy a').href;
assert.match(directions,/destination=35\.80235,51\.39288/);
assert.equal(ctx.d.querySelector('.project-local-tiles'),null);
assert.doesNotMatch(mapScript,/cartocdn|basemaps\.carto|YOUR_KEY|API_KEY/);
assert.equal(ctx.d.querySelector('#project-map .leaflet-control-attribution a').href,'https://www.openstreetmap.org/copyright');
pass('QR, marker and directions work; no CARTO or API key dependency remains; map attribution is visible.');

ctx.state.closeModal();await tick();
await finishTiles(ctx,'osm');
const primaryMap=ctx.maps[0];
assert.equal(primaryMap.getSize().x,640);assert.equal(primaryMap.getSize().y,380);
assert.equal(primaryMap.options.dragging,true);assert.equal(primaryMap.options.gestureHandling,true);
assert.equal(primaryMap.gestureHandling.enabled(),true);assert.equal(ctx.state.mapConnection,'osm');
click(ctx,'#project-map .leaflet-control-zoom-in');await tick();assert.equal(primaryMap.getZoom(),16);
await finishTiles(ctx,'osm');
primaryMap.panTo([35.807,51.387],{animate:false});
click(ctx,'.map-shell [aria-label="بازگشت نقشه به موقعیت ساختمان"]');await tick();
assert.ok(primaryMap.getCenter().distanceTo([35.80235,51.39288])<1);
assert.equal(primaryMap.getZoom(),15);
click(ctx,'#project-map .leaflet-marker-icon');await tick();
assert.match(ctx.d.querySelector('.project-map-popup').textContent,/اوین/);
assert.match(ctx.d.querySelector('.project-map-popup a').href,/destination=35\.80235,51\.39288/);
const centerBeforeResize=primaryMap.getCenter();
ctx.resizeMap('project-map',354,320);await tick();
assert.equal(primaryMap.getSize().x,354);assert.equal(primaryMap.getSize().y,320);
assert.ok(primaryMap.project(primaryMap.getCenter()).distanceTo(primaryMap.project(centerBeforeResize))<1,'Resize preserves the selected location within Leaflet pixel rounding');
pass('Leaflet zoom, recenter, pin address and resize handling work with explicit map dimensions.');

const mobileMap=await boot({},false,{mobile:true});
const touch=(count,type='touchmove')=>{
 const event=new mobileMap.w.Event(type,{bubbles:true,cancelable:true});
 Object.defineProperty(event,'touches',{value:Array.from({length:count},()=>({clientX:100,clientY:100}))});
 mobileMap.d.querySelector('#project-map').dispatchEvent(event);
};
touch(1);assert.equal(mobileMap.maps[0].dragging.enabled(),false);
assert.ok(mobileMap.d.querySelector('#project-map').classList.contains('leaflet-gesture-handling-touch-warning'));
touch(2);assert.equal(mobileMap.maps[0].dragging.enabled(),true);
touch(0,'touchend');assert.equal(mobileMap.d.querySelector('#project-map').classList.contains('leaflet-gesture-handling-touch-warning'),false);
touch(1);assert.equal(mobileMap.maps[0].dragging.enabled(),false);
click(mobileMap,'.map-shell [aria-label="نمایش بزرگ نقشه"]');await tick();
assert.equal(mobileMap.state.modal,'map');assert.equal(mobileMap.maps.length,2);
assert.equal(mobileMap.maps[1].gestureHandling.enabled(),false);
assert.equal(mobileMap.maps[1].dragging.enabled(),true);
assert.equal(mobileMap.maps[1].touchZoom.enabled(),true);
assert.equal(mobileMap.maps[1].getSize().x,390);
mobileMap.w.dispatchEvent(new mobileMap.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await tick();
assert.equal(mobileMap.state.modal,'');
assert.equal(mobileMap.d.querySelector('#expanded-project-map .leaflet-pane'),null);
click(mobileMap,'.map-shell [aria-label="نمایش بزرگ نقشه"]');await tick();
assert.equal(mobileMap.maps.length,3);assert.equal(mobileMap.state.modal,'map');
click(mobileMap,'.map-close-button');await tick();
assert.equal(mobileMap.state.modal,'');
pass('Mobile two-finger gestures work; expanded map supports free dragging, Escape and repeated reopening.');

const fallback=await boot();
await tick();
const firstTile=liveTiles(fallback)[0];
assert.equal(new URL(firstTile.src).hostname,'tile.openstreetmap.org');
assert.equal(new URL(firstTile.src).searchParams.has('key'),false);
assert.equal(firstTile.referrerPolicy,'strict-origin-when-cross-origin');
firstTile.onerror(new fallback.w.Event('error'));
assert.ok(firstTile.src.startsWith('data:image/'));
await finishTiles(fallback,'osm');
assert.equal(fallback.state.mapConnection,'partial');
assert.equal(fallback.state.mapHasError,true);
click(fallback,'.map-shell .map-offline-note button');await tick();
assert.equal(fallback.state.mapConnection,'loading');
await finishTiles(fallback,'offline');
assert.equal(fallback.state.mapConnection,'offline');
assert.notEqual(fallback.d.querySelector('.map-offline-note').style.display,'none');
assert.match(fallback.d.querySelector('.map-offline-note').textContent,/اتصال اینترنت/);
click(fallback,'.map-shell .map-offline-note button');await tick();
for(const tile of liveTiles(fallback))assert.equal(new URL(tile.src).hostname,'tile.openstreetmap.org');
await finishTiles(fallback,'osm');
assert.equal(fallback.state.mapConnection,'osm');assert.equal(fallback.state.mapHasError,false);
assert.equal(fallback.d.querySelector('.map-offline-note').style.display,'none');
pass('Only key-free OpenStreetMap is requested; partial/total tile failures show retry; successful retry clears the warning.');

const offlineMap=await boot({},false,{offline:true});
await finishTiles(offlineMap,'offline');
assert.equal(offlineMap.state.mapConnection,'offline');
assert.ok(liveTiles(offlineMap).every(tile=>tile.src.startsWith('data:image/')));
assert.equal(offlineMap.state.mapHasError,true);
click(offlineMap,'.map-shell [aria-label="نمایش بزرگ نقشه"]');await tick();
await finishTiles(offlineMap,'offline','expanded-project-map');
await tick();
assert.equal(offlineMap.state.mapConnection,'offline');
assert.match(offlineMap.d.querySelector('.map-modal-footer').textContent,/اتصال اینترنت/);
assert.notEqual(offlineMap.d.querySelector('.map-modal-footer button').style.display,'none');
click(offlineMap,'.map-close-button');await tick();
Object.defineProperty(offlineMap.w.navigator,'onLine',{value:true,configurable:true});
offlineMap.w.dispatchEvent(new offlineMap.w.Event('online'));await tick();
assert.equal(offlineMap.state.mapConnection,'loading');await finishTiles(offlineMap,'osm');
assert.equal(offlineMap.state.mapConnection,'osm');
pass('Offline startup and expanded view show a clear connection message; reconnecting retries OpenStreetMap automatically.');

const corrupt=await boot({[prefix+'reports']:'{broken json',[prefix+'session']:'"invalid"',[prefix+'draft:09123456789']:'null'});
assert.equal(corrupt.state.reports.length,4);assert.equal(corrupt.state.phone,'');
const blocked=await boot({},true);
blocked.state.phoneInput='09120000000';blocked.state.login();await tick();
assert.equal(blocked.state.view,'control');
blocked.state.openReportForm();await tick();
blocked.state.draft={title:'گزارش فضای پر',role:'مجری',stage:'اجرای اسکلت',body:'این گزارش باید هنگام خطای ذخیره باقی بماند.',outcome:'مطابق ضوابط'};
blocked.state.submitReport();await tick();
assert.ok(blocked.state.formErrors.storage);assert.equal(blocked.state.reports.length,4);assert.equal(blocked.state.modal,'report');
assert.match(blocked.state.draft.body,/باقی بماند/);
pass('Corrupt storage recovers; unavailable storage preserves unsaved text and prevents false success.');

for (const instance of [ctx,refreshed,corrupt,blocked,mobileMap,fallback,offlineMap]) {
 assert.deepEqual(instance.errors,[],'Alpine/DOM runtime errors');instance.dom.window.close();
}
const localPaths = Array.from(html.matchAll(/(?:src|href)="(\.\/assets\/[^"?]+)(?:\?[^\"]*)?"/g),m=>m[1]);
for(const file of new Set(localPaths))assert.ok((await stat(path.join('dist',file))).size>0,file);
const styles=await readFile('dist/assets/styles.css','utf8');
assert.match(styles,/tailwindcss v4/);assert.match(styles,/prefers-reduced-motion/);assert.match(styles,/max-width:600px/);
pass('No Alpine runtime errors; all referenced local assets and responsive/reduced-motion CSS are built.');
console.log(`Completed ${checks} integration checks. Browser visual QA remains unverified.`);

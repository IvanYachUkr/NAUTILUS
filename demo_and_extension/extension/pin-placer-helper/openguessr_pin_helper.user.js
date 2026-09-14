// ==UserScript==
// @name         OpenGuessr Pin Helper
// @namespace    https://github.com/NAUTILUS
// @version      1.2
// @description  AI agent lat/lng input -> precise Leaflet marker placement on OpenGuessr
// @author       NAUTILUS Benchmark
// @match        https://openguessr.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';
  const PANEL_ID = 'nautilus-pin-helper';

  // Comprehensive prototype hooking across Leaflet classes
  if (typeof window.L !== 'undefined') {
    const classes = [window.L.Map, window.L.Evented, window.L.Layer, window.L.Handler, window.L.PosAnimation];
    for (let cls of classes) {
      if (cls && cls.prototype) {
        for (let k of Object.getOwnPropertyNames(cls.prototype)) {
          if (typeof cls.prototype[k] === 'function' && k !== 'constructor') {
            const orig = cls.prototype[k];
            cls.prototype[k] = function(...args) {
              if (this instanceof window.L.Map) {
                window.L._maps = window.L._maps || {};
                window.L._maps[this._leaflet_id || 'main'] = this;
                window._leaflet_active_map = this;
              } else if (this._map && this._map instanceof window.L.Map) {
                window._leaflet_active_map = this._map;
              }
              return orig.apply(this, args);
            };
          }
        }
      }
    }
  }

  function getLeafletMap() {
    if (window._leaflet_active_map) return window._leaflet_active_map;
    if (window.L && window.L._maps) {
      const m = Object.values(window.L._maps);
      if (m.length) return m[0];
    }
    const mapEl = document.getElementById('map');
    if (mapEl) {
      const rect = mapEl.getBoundingClientRect();
      const ev = new MouseEvent('mousemove', {
        bubbles: true, cancelable: true, view: window,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      });
      mapEl.dispatchEvent(ev);
      mapEl.dispatchEvent(new Event('scroll'));
    }
    if (window._leaflet_active_map) return window._leaflet_active_map;
    return null;
  }

  function placePin(lat, lng) {
    const map = getLeafletMap();
    if (!map) { log('Map not found','error'); return false; }
    const pt   = map.latLngToContainerPoint(window.L.latLng(lat, lng));
    const rect = map.getContainer().getBoundingClientRect();
    const cx   = rect.left + pt.x;
    const cy   = rect.top  + pt.y;
    log('LatLng('+lat.toFixed(4)+','+lng.toFixed(4)+') -> ('+Math.round(cx)+','+Math.round(cy)+')','info');
    const tgt  = map.getContainer().querySelector('.leaflet-tile-pane') || map.getContainer();
    const ev   = {bubbles:true,cancelable:true,view:window,clientX:cx,clientY:cy,pointerId:1,isPrimary:true,pointerType:'mouse',button:0,buttons:1};
    tgt.dispatchEvent(new PointerEvent('pointerover',ev));
    tgt.dispatchEvent(new PointerEvent('pointerenter',ev));
    tgt.dispatchEvent(new PointerEvent('pointerdown',ev));
    tgt.dispatchEvent(new MouseEvent('mousedown',ev));
    tgt.dispatchEvent(new PointerEvent('pointerup',ev));
    tgt.dispatchEvent(new MouseEvent('mouseup',ev));
    tgt.dispatchEvent(new MouseEvent('click',ev));
    const mk = map.getContainer().querySelector('.leaflet-marker-icon');
    if(mk){ log('Marker placed! '+mk.style.transform,'success'); return true; }
    log('Click sent, no marker yet','warn'); return false;
  }

  function panTo(lat, lng, zoom) {
    const map = getLeafletMap(); if(!map){log('Map not ready','error');return;}
    map.setView(window.L.latLng(lat,lng), zoom!=null?zoom:map.getZoom(), {animate:false});
    log('Panned to ('+lat+','+lng+') z='+(zoom!=null?zoom:map.getZoom()),'info');
  }

  function go(lat, lng, zoom) {
    panTo(lat, lng, zoom);
    setTimeout(()=>placePin(lat,lng), 400);
  }

  function log(msg, level='info') {
    const el = document.getElementById(PANEL_ID+'-log');
    if(!el){console.log('[PinHelper]',msg);return;}
    const c={info:'#cce5ff',success:'#d4edda',warn:'#fff3cd',error:'#f8d7da'};
    const d=document.createElement('div');
    d.style.cssText='background:'+(c[level]||'#fff')+';color:#111;padding:4px 6px;margin:2px 0;border-radius:3px;font-size:11px;word-break:break-word;';
    d.textContent=msg; el.prepend(d);
    while(el.children.length>25) el.removeChild(el.lastChild);
  }

  function parseLL(s) {
    const p=s.split(/[\s,]+/).map(Number).filter(n=>!isNaN(n));
    return p.length>=2?{lat:p[0],lng:p[1]}:null;
  }

  function buildPanel() {
    if(document.getElementById(PANEL_ID)) return;
    const p=document.createElement('div');
    p.id=PANEL_ID;
    p.style.cssText='position:fixed;bottom:80px;left:16px;width:280px;background:rgba(15,15,25,0.96);border:1px solid #4a90e2;border-radius:8px;padding:10px 12px;font-family:system-ui,sans-serif;font-size:13px;color:#eee;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.7);';
    p.innerHTML=`
<div id="${PANEL_ID}-hdr" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;cursor:grab;">
  <strong style="color:#4a90e2;font-size:14px;">📍 Pin Helper</strong>
  <span id="${PANEL_ID}-tgl" style="cursor:pointer;font-size:18px;color:#aaa;">▾</span>
</div>
<div id="${PANEL_ID}-body">
  <label style="font-size:11px;color:#aaa;display:block;margin-bottom:2px;">Coordinates (lat, lng):</label>
  <input id="${PANEL_ID}-coords" type="text" placeholder="e.g. 59.848, 17.614"
    style="width:100%;box-sizing:border-box;margin-bottom:6px;padding:5px 7px;border:1px solid #555;border-radius:4px;background:#1e1e2e;color:#fff;font-size:12px;"/>
  <label style="font-size:11px;color:#aaa;display:block;margin-bottom:2px;">Zoom (3–18):</label>
  <input id="${PANEL_ID}-zoom" type="number" value="8" min="3" max="18"
    style="width:60px;margin-bottom:8px;padding:4px 6px;border:1px solid #555;border-radius:4px;background:#1e1e2e;color:#fff;font-size:12px;"/>
  <div style="display:flex;gap:6px;margin-bottom:8px;">
    <button id="${PANEL_ID}-bplace" style="flex:1;padding:7px;background:#4a90e2;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">Pin Only</button>
    <button id="${PANEL_ID}-bpan"   style="flex:1;padding:7px;background:#2ecc71;color:#111;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">Pan Only</button>
    <button id="${PANEL_ID}-bboth"  style="flex:1;padding:7px;background:#9b59b6;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">✨ Pan+Pin</button>
  </div>
  <div style="display:flex;gap:4px;margin-bottom:8px;">
    <button id="${PANEL_ID}-zin"  style="flex:1;padding:5px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;">🔍+</button>
    <button id="${PANEL_ID}-zout" style="flex:1;padding:5px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;">🔍−</button>
    <button id="${PANEL_ID}-z8"  style="flex:1;padding:5px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:10px;">z=8</button>
    <button id="${PANEL_ID}-z12" style="flex:1;padding:5px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:10px;">z=12</button>
    <button id="${PANEL_ID}-z15" style="flex:1;padding:5px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:10px;">z=15</button>
  </div>
  <div id="${PANEL_ID}-log" style="max-height:130px;overflow-y:auto;border-top:1px solid #333;padding-top:6px;">
    <div style="font-size:11px;color:#555;text-align:center;">-- log --</div>
  </div>
</div>`;
    document.body.appendChild(p);

    // Collapse
    document.getElementById(PANEL_ID+'-tgl').onclick=()=>{
      const b=document.getElementById(PANEL_ID+'-body'), t=document.getElementById(PANEL_ID+'-tgl');
      const h=b.style.display==='none'; b.style.display=h?'':'none'; t.textContent=h?'▾':'▸';
    };

    // Drag
    let drag=false,ox=0,oy=0;
    document.getElementById(PANEL_ID+'-hdr').addEventListener('mousedown',e=>{
      drag=true; const r=p.getBoundingClientRect(); ox=e.clientX-r.left; oy=e.clientY-r.top; p.style.bottom='auto';
    });
    document.addEventListener('mousemove',e=>{ if(drag){ p.style.left=(e.clientX-ox)+'px'; p.style.top=(e.clientY-oy)+'px'; }});
    document.addEventListener('mouseup',()=>{ drag=false; });

    const gi=()=>{
      const raw=document.getElementById(PANEL_ID+'-coords').value.trim();
      const z=parseInt(document.getElementById(PANEL_ID+'-zoom').value,10)||8;
      const ll=parseLL(raw); if(!ll){log('Bad coords. Use "lat, lng"','error');return null;}
      return{...ll,zoom:z};
    };
    document.getElementById(PANEL_ID+'-bplace').onclick=()=>{ const i=gi(); if(i) placePin(i.lat,i.lng); };
    document.getElementById(PANEL_ID+'-bpan').onclick  =()=>{ const i=gi(); if(i) panTo(i.lat,i.lng,i.zoom); };
    document.getElementById(PANEL_ID+'-bboth').onclick =()=>{ const i=gi(); if(i) go(i.lat,i.lng,i.zoom); };
    document.getElementById(PANEL_ID+'-zin').onclick   =()=>{ const m=getLeafletMap(); if(m){m.zoomIn();  log('z='+m.getZoom(),'info');} };
    document.getElementById(PANEL_ID+'-zout').onclick  =()=>{ const m=getLeafletMap(); if(m){m.zoomOut(); log('z='+m.getZoom(),'info');} };
    document.getElementById(PANEL_ID+'-z8').onclick    =()=>{ const m=getLeafletMap(); if(m) m.setZoom(8, {animate:false}); };
    document.getElementById(PANEL_ID+'-z12').onclick   =()=>{ const m=getLeafletMap(); if(m) m.setZoom(12,{animate:false}); };
    document.getElementById(PANEL_ID+'-z15').onclick   =()=>{ const m=getLeafletMap(); if(m) m.setZoom(15,{animate:false}); };

    log('Pin Helper ready! Use Pan+Pin for best accuracy.','success');
  }

  // Global API
  window.NautilusPinHelper = {
    pin:    (lat,lng)      => placePin(lat,lng),
    pan:    (lat,lng,zoom) => panTo(lat,lng,zoom!=null?zoom:8),
    go:     (lat,lng,zoom) => go(lat,lng,zoom!=null?zoom:8),
    getMap: ()             => getLeafletMap()
  };

  function init() {
    if(document.getElementById('map')){ buildPanel(); return; }
    setTimeout(init, 800);
  }
  init();
  new MutationObserver(()=>{ if(!document.getElementById(PANEL_ID)&&document.getElementById('map')) buildPanel(); })
    .observe(document.body,{childList:true,subtree:false});
})();

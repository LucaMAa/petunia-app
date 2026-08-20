import { ActivityPoint, MapReport } from '../../types';
import { REPORT_TYPES } from '../../types/mapTypes';

export function buildLeafletHTML(
  lat: number,
  lng: number,
  reports: MapReport[],
  track: ActivityPoint[] = [],
): string {
  const reportsJSON = JSON.stringify(
    reports.map((r) => ({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      type: r.type,
      title: r.title,
      description: r.description,
      status: r.status,
      abuse_count: r.abuse_count,
      distance_m: r.distance_m ?? 0,
      created_at: r.created_at,
      user: r.user ?? null,
      image_urls: r.image_urls ?? [],
    })),
  );

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5,user-scalable=yes"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body,#map { width:100%; height:100%; }
  .leaflet-container {
    touch-action: pan-x pan-y pinch-zoom;
    -webkit-user-select: none;
    user-select: none;
  }
  body { background:#101211; }
  .leaflet-control-attribution { display:none !important; }
  .marker-bubble {
    width:38px; height:38px; border-radius:50%; border:2.5px solid;
    display:flex; align-items:center; justify-content:center;
    font-size:18px; box-shadow:0 3px 10px rgba(61,26,8,.18); cursor:pointer;
  }
  .user-dot {
    width:18px; height:18px; border-radius:50%;
    background:#C4714A; border:3px solid #fff;
    box-shadow:0 2px 8px rgba(196,113,74,.55);
  }
  .pending-pin {
    width:22px; height:22px; border-radius:50%;
    background:#C4714A; border:3px solid #fff;
    box-shadow:0 2px 8px rgba(196,113,74,.55);
    animation:pulse 1.2s infinite;
  }
  .report-cluster { width:42px; height:42px; border-radius:50%; background:#1A1E1C; border:2px solid #D6B46A; color:#F4F6F3; display:flex; align-items:center; justify-content:center; font:700 13px system-ui; box-shadow:0 3px 12px rgba(0,0,0,.35); }
  @keyframes pulse {
    0%,100%{transform:scale(1);opacity:1}
    50%{transform:scale(1.25);opacity:.7}
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
(function(){
  var TYPES=${JSON.stringify(REPORT_TYPES)};
  var reports=${reportsJSON};
  var initialTrack=${JSON.stringify(track)};
  var userLat=${lat}, userLng=${lng};

  var map=L.map('map',{zoomControl:false,dragging:true,touchZoom:true,doubleClickZoom:true,scrollWheelZoom:true});
  var fallbackCenter=[userLat,userLng];
  if(initialTrack && initialTrack.length>=2){
    var bounds=L.latLngBounds(initialTrack.map(function(p){ return [p.lat,p.lng]; }));
    map.fitBounds(bounds,{padding:[20,20]});
  } else {
    map.setView(fallbackCenter,15);
  }
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

  var userMarker=L.marker([userLat,userLng],{
    icon:L.divIcon({className:'',html:'<div class="user-dot"></div>',iconSize:[18,18],iconAnchor:[9,9]})
  }).addTo(map);

  var pendingMarker=null;
  var reportMarkers={};
  var trackLine=null;
  var trackStart=null, trackEnd=null;
  var following=false;

  function drawReports(reps){
    Object.values(reportMarkers).forEach(function(m){
      if(m.marker) map.removeLayer(m.marker);
      if(m.circle) map.removeLayer(m.circle);
    });
    reportMarkers={};
    // A compact grid cluster keeps dense community reports tappable in WebView.
    var groups={};
    reps.forEach(function(r){ var key=Math.round(r.lat*500)/500+','+Math.round(r.lng*500)/500; (groups[key]=groups[key]||[]).push(r); });
    Object.keys(groups).forEach(function(key){
      var group=groups[key];
      if(group.length>1){ var first=group[0]; var cluster=L.marker([first.lat,first.lng],{icon:L.divIcon({className:'',html:'<div class="report-cluster">'+group.length+'</div>',iconSize:[42,42],iconAnchor:[21,21]})}).addTo(map); cluster.on('click',function(){ map.setView([first.lat,first.lng],Math.min(map.getZoom()+2,18),{animate:true}); }); reportMarkers['cluster-'+key]={marker:cluster}; return; }
      var r=group[0];
      var meta=TYPES[r.type]||TYPES['interesting'];
      var html='<div class="marker-bubble" style="background:'+meta.bg+';border-color:'+meta.color+'">'+meta.emoji+'</div>';
      var m=L.marker([r.lat,r.lng],{
        icon:L.divIcon({className:'',html:html,iconSize:[38,38],iconAnchor:[19,19]})
      }).addTo(map);
      var circle=null;
      if(meta.alertRadius>0){
        circle=L.circle([r.lat,r.lng],{
          radius:meta.alertRadius,color:meta.color,
          fillColor:meta.color,fillOpacity:0.10,weight:1.5,opacity:0.35
        }).addTo(map);
      }
      reportMarkers[r.id]={marker:m,circle:circle};
    });
  }

  function drawTrack(points){
    if(trackLine){ map.removeLayer(trackLine); trackLine=null; }
    if(trackStart){ map.removeLayer(trackStart); trackStart=null; }
    if(trackEnd){ map.removeLayer(trackEnd); trackEnd=null; }
    if(!points||points.length<2)return;
    trackLine=L.polyline(points.map(function(p){return [p.lat,p.lng];}),{color:'#D6B46A',weight:5,opacity:.92,lineJoin:'round'}).addTo(map);
    trackStart=L.circleMarker([points[0].lat,points[0].lng],{radius:7,color:'#fff',weight:2,fillColor:'#75C99B',fillOpacity:1}).addTo(map);
    var end=points[points.length-1];
    trackEnd=L.circleMarker([end.lat,end.lng],{radius:7,color:'#fff',weight:2,fillColor:'#D6B46A',fillOpacity:1}).addTo(map);
  }

  drawReports(reports);
  drawTrack(initialTrack);
  setTimeout(function(){
    try { map.invalidateSize(); } catch(err) {}
    if(initialTrack && initialTrack.length>=2){
      try {
        var bounds=L.latLngBounds(initialTrack.map(function(p){ return [p.lat,p.lng]; }));
        map.fitBounds(bounds,{padding:[20,20]});
      } catch(err) {}
    } else {
      map.setView(fallbackCenter,15);
    }
  }, 150);

  map.on('click',function(e){
    if(pendingMarker) map.removeLayer(pendingMarker);
    pendingMarker=L.marker([e.latlng.lat,e.latlng.lng],{
      icon:L.divIcon({className:'',html:'<div class="pending-pin"></div>',iconSize:[22,22],iconAnchor:[11,11]})
    }).addTo(map);
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapTap',lat:e.latlng.lat,lng:e.latlng.lng}));
  });
  map.on('dragstart',function(){ if(following){ following=false; window.ReactNativeWebView.postMessage(JSON.stringify({type:'followChanged',following:false})); } });

  function handleMsg(e){
    try{
      var msg=JSON.parse(e.data);
      if(msg.type==='updateLocation') { userMarker.setLatLng([msg.lat,msg.lng]); if(following) map.panTo([msg.lat,msg.lng],{animate:true,duration:.35}); }
      if(msg.type==='centerUser') { following=true; map.setView([msg.lat,msg.lng],16,{animate:true}); }
      if(msg.type==='setFollowing') following=!!msg.following;
      if(msg.type==='updateReports') drawReports(msg.reports);
      if(msg.type==='updateTrack') drawTrack(msg.points);
      if(msg.type==='clearPending'&&pendingMarker){map.removeLayer(pendingMarker);pendingMarker=null;}
    }catch(err){}
  }
  document.addEventListener('message',handleMsg);
  window.addEventListener('message',handleMsg);
})();
</script>
</body>
</html>`;
}

import { MapReport } from "../../types";
import { REPORT_TYPES } from "../../types/mapTypes";

export function buildLeafletHTML(lat: number, lng: number, reports: MapReport[]): string {
  const reportsJSON = JSON.stringify(
    reports.map((r) => ({
      id: r.id, lat: r.lat, lng: r.lng, type: r.type,
      title: r.title, description: r.description,
      status: r.status, abuse_count: r.abuse_count,
      distance_m: r.distance_m ?? 0, created_at: r.created_at,
      user: r.user ?? null, image_urls: r.image_urls ?? [],
    }))
  );

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body,#map { width:100%; height:100%; }
  body { background:#FAF6F1; }
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
  var userLat=${lat}, userLng=${lng};

  var map=L.map('map',{zoomControl:false}).setView([userLat,userLng],15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

  var userMarker=L.marker([userLat,userLng],{
    icon:L.divIcon({className:'',html:'<div class="user-dot"></div>',iconSize:[18,18],iconAnchor:[9,9]})
  }).addTo(map);

  var pendingMarker=null;
  var reportMarkers={};

  function drawReports(reps){
    Object.values(reportMarkers).forEach(function(m){
      if(m.marker) map.removeLayer(m.marker);
      if(m.circle) map.removeLayer(m.circle);
    });
    reportMarkers={};
    reps.forEach(function(r){
      var meta=TYPES[r.type]||TYPES['interesting'];
      var html='<div class="marker-bubble" style="background:'+meta.bg+';border-color:'+meta.color+'">'+meta.emoji+'</div>';
      var m=L.marker([r.lat,r.lng],{
        icon:L.divIcon({className:'',html:html,iconSize:[38,38],iconAnchor:[19,19]})
      }).addTo(map);
      m.on('click',function(){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'selectReport',report:r}));
      });
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

  drawReports(reports);

  map.on('click',function(e){
    if(pendingMarker) map.removeLayer(pendingMarker);
    pendingMarker=L.marker([e.latlng.lat,e.latlng.lng],{
      icon:L.divIcon({className:'',html:'<div class="pending-pin"></div>',iconSize:[22,22],iconAnchor:[11,11]})
    }).addTo(map);
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapTap',lat:e.latlng.lat,lng:e.latlng.lng}));
  });

  function handleMsg(e){
    try{
      var msg=JSON.parse(e.data);
      if(msg.type==='updateLocation') userMarker.setLatLng([msg.lat,msg.lng]);
      if(msg.type==='centerUser') map.setView([msg.lat,msg.lng],16,{animate:true});
      if(msg.type==='updateReports') drawReports(msg.reports);
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

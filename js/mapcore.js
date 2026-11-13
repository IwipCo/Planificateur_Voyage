/* Carte Leaflet, fonds de carte et calques (aucune dépendance vers les autres modules). */

export const map=L.map('map').setView([48.78,-3.3],10);
export const BASES={
 'Plan':L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}),
 'Topo (courbes de niveau)':L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'© OpenStreetMap, SRTM · © OpenTopoMap'}),
 'IGN Plan':L.tileLayer('https://data.geopf.fr/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',{maxZoom:18,attribution:'© IGN'}),
 'Satellite':L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Imagery © Esri'})
};
(BASES[localStorage.getItem('tp_base')]||BASES['Plan']).addTo(map);
L.control.layers(BASES,null,{position:'topright'}).addTo(map);
map.on('baselayerchange',e=>localStorage.setItem('tp_base',e.name));
export const layer=L.layerGroup().addTo(map);
export const grTiles=L.tileLayer('https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png',{maxZoom:18,opacity:.85,attribution:'Sentiers © <a href="https://hiking.waymarkedtrails.org">Waymarked Trails</a>'});
export const trLayer=L.layerGroup().addTo(map);
export const poiLayer=L.layerGroup().addTo(map);
export const covLayer=L.layerGroup().addTo(map);

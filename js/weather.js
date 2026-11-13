/* Météo et marées par jour. */
import {cardinal, tideExt, wmo} from './lib/util.js';

export const WX={};
export const wxk=s=>s.date+'|'+(s.points[0]||[]).join(',');
export async function loadWx(s){
 const box=document.querySelector('.wx[data-id="'+s.id+'"]');if(!box)return;
 const show=h=>{WX[s.id]={k:wxk(s),html:h};box.innerHTML=h};
 if(!s.date)return show('<p class="meta">Renseigne la date de l’étape.</p>');
 if(!s.points.length)return show('<p class="meta">Place au moins un repère pour localiser l’étape.</p>');
 const diff=Math.round((new Date(s.date+'T12:00')-new Date())/864e5);
 if(diff>15)return show('<p class="meta">Les prévisions sont disponibles 16 jours avant la date.</p>');
 if(diff<-1)return show('<p class="meta">Date passée : plus de prévisions.</p>');
 box.innerHTML='<p class="meta">Chargement…</p>';
 const [la,lo]=s.points[0],d2=new Date(s.date+'T12:00');d2.setDate(d2.getDate()+1);
 const e2=d2.getFullYear()+'-'+String(d2.getMonth()+1).padStart(2,'0')+'-'+String(d2.getDate()).padStart(2,'0');
 try{
  const [w,m]=await Promise.all([
   fetch('https://api.open-meteo.com/v1/forecast?latitude='+la+'&longitude='+lo+'&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,sunrise,sunset&timezone=Europe%2FParis&start_date='+s.date+'&end_date='+s.date).then(r=>r.json()),
   fetch('https://marine-api.open-meteo.com/v1/marine?latitude='+la+'&longitude='+lo+'&hourly=sea_level_height_msl&timezone=Europe%2FParis&start_date='+s.date+'&end_date='+e2).then(r=>r.json()).catch(()=>null)
  ]);
  const d=w.daily;if(!d||!d.time||!d.time.length)throw 0;
  const [ic,lb]=wmo(d.weather_code[0]),hh=x=>String(x).slice(11,16);
  const te=m&&m.hourly&&m.hourly.sea_level_height_msl?tideExt(m.hourly.time,m.hourly.sea_level_height_msl,s.date):[];
  const th=te.length?te.map(x=>`<div class="meta">${x.hi?'▲ Pleine mer':'▼ Basse mer'} ${x.t} · ${x.z>0?'+':''}${x.z.toFixed(1)} m</div>`).join(''):'<div class="meta">Marées indisponibles pour ce point.</div>';
  show(`<div>${ic} <b>${lb}</b> · ${Math.round(d.temperature_2m_min[0])} à ${Math.round(d.temperature_2m_max[0])} °C</div>
  <div class="meta">Pluie ${d.precipitation_sum[0]} mm (risque ${d.precipitation_probability_max[0]??'?'} %) · vent ${Math.round(d.wind_speed_10m_max[0])} km/h ${cardinal(d.wind_direction_10m_dominant[0])}, rafales ${Math.round(d.wind_gusts_10m_max[0])} · soleil ${hh(d.sunrise[0])}–${hh(d.sunset[0])}</div>
  <div style="margin-top:6px"><b>Marées</b> (niveau par rapport au niveau moyen)</div>${th}
  <p class="meta">Prévisions pour le point de départ. Marées estimées par un modèle global : écart possible d’une heure ou plus, à vérifier sur <a href="https://maree.shom.fr/" target="_blank" rel="noopener">le SHOM</a> avant de passer un estuaire ou une grève.</p>
  <button data-a="wx">Actualiser</button>`);
 }catch(e){show('<p class="meta">Prévisions indisponibles pour le moment.</p><button data-a="wx">Réessayer</button>')}
}

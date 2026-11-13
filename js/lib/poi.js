/* Points d’intérêt : types OpenStreetMap, classement des étiquettes, construction de la requête Overpass. */
import {dm} from './geo.js';

export const POI_T={
 water:{e:'💧',l:'Points d’eau',q:['["amenity"="drinking_water"]','["natural"="spring"]','["man_made"="water_tap"]','["amenity"="water_point"]']},
 wc:{e:'🚻',l:'Toilettes',q:['["amenity"="toilets"]']},
 shop:{e:'🛒',l:'Commerces',q:['["shop"~"^(supermarket|convenience|bakery|butcher|greengrocer|general)$"]']},
 resto:{e:'🍴',l:'Restaurants',q:['["amenity"~"^(restaurant|fast_food)$"]']},
 bar:{e:'🍺',l:'Bars et cafés',q:['["amenity"~"^(bar|pub|cafe)$"]']},
 camp:{e:'⛺',l:'Campings et abris',q:['["tourism"="camp_site"]','["amenity"="shelter"]','["tourism"~"^(wilderness_hut|alpine_hut)$"]']},
 gite:{e:'🏡',l:'Gîtes et auberges',q:['["tourism"~"^(chalet|apartment|hostel)$"]']},
 bnb:{e:'🛏️',l:'Chambres d’hôtes',q:['["tourism"="guest_house"]']},
 hotel:{e:'🏨',l:'Hôtels',q:['["tourism"~"^(hotel|motel)$"]']},
 view:{e:'📷',l:'Points de vue'},danger:{e:'⚠️',l:'Passages difficiles'},other:{e:'📍',l:'Autres'}
};
export function poiType(t){
 if(t.amenity==='drinking_water'||t.natural==='spring'||t.man_made==='water_tap'||t.amenity==='water_point')return'water';
 if(t.tourism==='camp_site'||t.amenity==='shelter'||['wilderness_hut','alpine_hut'].includes(t.tourism))return'camp';
 if(['chalet','apartment','hostel'].includes(t.tourism))return'gite';
 if(t.tourism==='guest_house')return'bnb';
 if(['hotel','motel'].includes(t.tourism))return'hotel';
 if(t.amenity==='toilets')return'wc';
 if(['bar','pub','cafe'].includes(t.amenity))return'bar';
 if(['restaurant','fast_food'].includes(t.amenity))return'resto';
 if(t.shop)return'shop';
 return'other';
}
export function poiQuery(cats,R,line){
 const pts=[];let acc=0,prev=null;
 line.forEach((p,i)=>{if(!prev){pts.push(p);prev=p;return}acc+=dm(prev,p);prev=p;if(acc>=250||i===line.length-1){pts.push(p);acc=0}});
 let sel=pts;if(sel.length>150){const st=Math.ceil(sel.length/150);sel=sel.filter((_,i)=>i%st===0||i===sel.length-1)}
 const la=line.map(p=>p[0]),lo=line.map(p=>p[1]),pad=R/111000+0.003;
 const bb=[Math.min(...la)-pad,Math.min(...lo)-pad,Math.max(...la)+pad,Math.max(...lo)+pad].map(v=>v.toFixed(5)).join(',');
 const f=cats.map(c=>POI_T[c].q.map(x=>'nwr'+x+';').join('')).join('');
 return '[out:json][timeout:25][bbox:'+bb+'];('+f+')->.c;nwr.c(around:'+R+','+sel.map(p=>p[0].toFixed(5)+','+p[1].toFixed(5)).join(',')+');out center tags;';
}

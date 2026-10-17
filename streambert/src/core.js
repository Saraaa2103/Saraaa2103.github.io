import {catalog} from './catalog.js';

const appBase = new URL('../',import.meta.url);
const starterArtwork = new Set(catalog.flatMap(m=>[m.poster,m.backdrop]).filter(Boolean).map(path=>path.split('/').pop()));

function safeArtwork(value,base) {
  if(typeof value!=='string')return null;
  if(/^https:\/\/image\.tmdb\.org\/t\/p\/(?:w\d+|original)\/[a-z0-9_-]+\.(?:jpe?g|png|webp)$/i.test(value))return value;
  const filename=value.split('/').pop();
  if(!starterArtwork.has(filename))return null;
  const relative=`./posters/${filename}`;
  // Normalize legacy root-hosted backups when moving a library to another host.
  if([relative,`posters/${filename}`,`/posters/${filename}`].includes(value))return relative;
  const local=new URL(relative,base);
  return value===local.href||value===local.pathname?relative:null;
}

export const SOURCES = {
  videasy: {name:'Videasy',url:(m,s,e)=>`https://player.videasy.to/${m.type==='movie'?'movie/'+m.id:'tv/'+m.id+'/'+s+'/'+e}`},
  vidsrc: {name:'VidSrc',url:(m,s,e)=>`https://vsembed.su/embed/${m.type==='movie'?'movie/'+m.id:'tv/'+m.id+'/'+s+'/'+e}`},
  vidking: {name:'Vidking',url:(m,s,e)=>`https://www.vidking.net/embed/${m.type==='movie'?'movie/'+m.id:'tv/'+m.id+'/'+s+'/'+e}`}
};
export const keyOf = m => `${m.type}:${m.id}`;
const GENRES = {12:'Adventure',14:'Fantasy',16:'Animation',18:'Drama',27:'Horror',28:'Action',35:'Comedy',36:'History',37:'Western',53:'Thriller',80:'Crime',99:'Documentary',878:'Science Fiction',9648:'Mystery',10402:'Music',10749:'Romance',10751:'Family',10752:'War',10759:'Adventure',10762:'Kids',10763:'News',10764:'Reality',10765:'Science Fiction',10766:'Soap',10767:'Talk',10768:'War'};
export const escapeHtml = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function cleanMedia(m,type) {
  const actual = m.media_type || type;
  if (!['movie','tv'].includes(actual) || !Number.isSafeInteger(m.id) || m.id<1) return null;
  return {id:m.id,type:actual,title:m.title||m.name||'Untitled',year:(m.release_date||m.first_air_date||'').slice(0,4),rating:Number(m.vote_average||0).toFixed(1),overview:m.overview||'No description available.',genres:m.genres?.length?m.genres.map(g=>GENRES[g.id]||g.name):(m.genre_ids||[]).map(id=>GENRES[id]).filter(Boolean),poster:m.poster_path?`https://image.tmdb.org/t/p/w342${m.poster_path}`:null,backdrop:m.backdrop_path?`https://image.tmdb.org/t/p/w1280${m.backdrop_path}`:null,runtime:m.runtime||null,seasons:m.number_of_seasons||1,seasonData:m.seasons||[],episodeCount:m.number_of_episodes||null};
}
export function validateBackup(data,base=appBase) {
  if (!data || data.format!=='streambert-web' || data.version!==1 || !Array.isArray(data.saved) || !Array.isArray(data.history)) throw new Error('Choose a Streambert Web library backup.');
  if (data.saved.length>2000 || data.history.length>2000) throw new Error('This backup exceeds the 2,000-title limit.');
  const safe = m => {
    if (!m || !Number.isSafeInteger(m.id) || m.id<1 || !['movie','tv'].includes(m.type) || typeof m.title!=='string' || m.title.length>500) throw new Error('The backup contains an invalid title.');
    const result = {id:m.id,type:m.type,title:m.title,year:String(m.year||'').slice(0,4),rating:String(m.rating||''),genres:Array.isArray(m.genres)?m.genres.filter(g=>typeof g==='string').slice(0,10):[],overview:String(m.overview||'').slice(0,10000),runtime:Number(m.runtime)||null,seasons:Math.max(1,Math.min(100,Number(m.seasons)||1))};
    for(const k of ['poster','backdrop']) {
      const artwork=safeArtwork(m[k],base);
      if(artwork)result[k]=artwork;
    }
    if(m.sampleScore===true)result.sampleScore=true;
    if (Number.isFinite(m.openedAt)) result.openedAt=m.openedAt;
    return result;
  };
  return {saved:[...new Map(data.saved.map(safe).map(m=>[keyOf(m),m])).values()],history:data.history.map(safe).slice(0,100)};
}
export function playerUrl(source,media,season=1,episode=1) {
  if (!SOURCES[source] || !['movie','tv'].includes(media.type) || !Number.isSafeInteger(media.id) || media.id<1 || !Number.isInteger(season) || season<1 || !Number.isInteger(episode) || episode<1) throw new Error('Invalid player selection.');
  return SOURCES[source].url(media,season,episode);
}
export function mayEmbed(protection) {
  return protection.active === true && protection.nonceVerified === true;
}
export function mayLaunchPlayer(protection) {
  return mayEmbed(protection) && protection.playerSupported === true;
}

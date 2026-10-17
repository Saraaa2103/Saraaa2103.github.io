// A request-scoped bridge to the isolated companion content script.
// Cross-origin provider messages can never resolve these pending requests.
export function createPlayerBridge(target, {timeoutMs=20000, nonce=()=>target.crypto.randomUUID()}={}) {
  const pending=new Map();
  const allowed=new Set(['OPEN_PLAYER','FOCUS_PLAYER','CLOSE_PLAYER']);
  const onMessage=event=>{
    const message=event.data;
    if(event.source!==target || event.origin!==target.location.origin || message?.channel!=='streambert-protection' || message.type!=='PLAYER_RESULT')return;
    const request=pending.get(message.nonce);
    if(!request || message.action!==request.action)return;
    clearTimeout(request.timer);pending.delete(message.nonce);
    if(message.ok===true)request.resolve();
    else request.reject(new Error(typeof message.error==='string'?message.error.slice(0,300):'The protected player could not be opened. Reload the companion and try again.'));
  };
  target.addEventListener('message',onMessage);
  return {
    request(action,payload){
      if(!allowed.has(action))return Promise.reject(new Error('Invalid player action.'));
      return new Promise((resolve,reject)=>{
        const id=nonce();
        const timer=setTimeout(()=>{pending.delete(id);reject(new Error('The companion did not respond. Update it to version 1.1.0, reload it in your browser’s Extensions page, then reload Streambert.'));},timeoutMs);
        pending.set(id,{action,resolve,reject,timer});
        target.postMessage({channel:'streambert-web',type:action,nonce:id,...(payload?{payload}:{})},target.location.origin);
      });
    },
    dispose(){target.removeEventListener('message',onMessage);for(const request of pending.values()){clearTimeout(request.timer);request.reject(new Error('Player connection closed.'));}pending.clear();}
  };
}

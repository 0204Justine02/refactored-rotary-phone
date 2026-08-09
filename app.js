const $=id=>document.getElementById(id);
let db, currentDate=new Date(), selectedDate=iso(new Date()), songs=[],songUrls=[],currentSong=-1,shuffle=false,notes=[],currentNote=-1,links=[],tasks=[],photos=[],apps=[];
const DB="JustineHubDB";
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,2);r.onupgradeneeded=()=>{const d=r.result;["songs","photos"].forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s,{keyPath:"id",autoIncrement:true})});};r.onsuccess=()=>{db=r.result;res()};r.onerror=()=>rej(r.error)})}
function tx(store,mode="readonly"){return db.transaction(store,mode).objectStore(store)}
function getAll(store){return new Promise(r=>{const q=tx(store).getAll();q.onsuccess=()=>r(q.result)})}
function put(store,obj){return new Promise(r=>{const q=tx(store,"readwrite").put(obj);q.onsuccess=()=>r(q.result)})}
function del(store,id){return new Promise(r=>{const q=tx(store,"readwrite").delete(id);q.onsuccess=()=>r()})}
function iso(d){return d.toISOString().slice(0,10)}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function beep(){if(!$("soundToggle").checked)return;try{const c=new (AudioContext||webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.frequency.value=650;g.gain.value=.035;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.045)}catch{}}
document.addEventListener("click",e=>{if(e.target.closest("button,.primaryBtn"))beep()});
async function init(){await openDB();songs=await getAll("songs");photos=await getAll("photos");notes=JSON.parse(localStorage.notes||"[]");links=JSON.parse(localStorage.links||"[]");tasks=JSON.parse(localStorage.tasks||"[]");apps=JSON.parse(localStorage.apps||"[]");$("soundToggle").checked=localStorage.sound!=="off";$("bgVolume").value=localStorage.bgVolume||85;$("bgVolume").oninput=()=>{localStorage.bgVolume=$("bgVolume").value;if(bgAudio)bgAudio.volume=Number($("bgVolume").value)/100;if(window.AndroidBridge&&AndroidBridge.setBackgroundVolume)AndroidBridge.setBackgroundVolume(Number($("bgVolume").value)/100)};loadBg();setupAuth();renderCalendar();renderTasks();renderSongs();renderGallery();renderNotes();renderApps();renderLinks();updateHome();loadAppDownloadUrl();$("bgInput").onchange=customBg;$("galleryInput").onchange=addPhotos;$("musicInput").onchange=addMusic;$("backupInput").onchange=importBackup}

let bgMusicPlaying=false,bgAudio=null;
function toggleBackgroundMusic(){
  if(window.AndroidBridge&&AndroidBridge.startBackgroundMusic){
    if(bgMusicPlaying){AndroidBridge.stopBackgroundMusic();bgMusicPlaying=false}
    else{AndroidBridge.startBackgroundMusic(Number($("bgVolume").value)/100);bgMusicPlaying=true}
  }else{
    if(!bgAudio){bgAudio=new Audio("chill_background.wav");bgAudio.loop=true;bgAudio.volume=Number($("bgVolume").value)/100}
    if(bgMusicPlaying){bgAudio.pause();bgMusicPlaying=false}
    else{bgAudio.volume=Number($("bgVolume").value)/100;bgAudio.play().catch(()=>{});bgMusicPlaying=true}
  }
  $("bgMusicBtn").textContent=bgMusicPlaying?"⏸ Stop chill music":"▶ Start chill music";
}
function openSocial(which){
  const url=which==="youtube"?"https://www.youtube.com/":"https://www.facebook.com/";
  if(window.AndroidBridge&&AndroidBridge.openExternal)AndroidBridge.openExternal(url);
  else window.open(url,"_blank");
}

const DEFAULT_APP_DOWNLOAD_URL="./JUSTINEHUB.apk";

function loadAppDownloadUrl(){
  const e=$("appDownloadUrl");
  if(e)e.value=DEFAULT_APP_DOWNLOAD_URL;
}

function saveAppDownloadUrl(){
  localStorage.removeItem("appDownloadUrl");
  alert("APK download link saved");
}

function downloadApp(){
  const a=document.createElement("a");
  a.href="./JUSTINEHUB.apk";
  a.download="JUSTINEHUB.apk";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
a=document.createElement("a");a.href=u;a.download="JustineHub.apk";a.target="_blank";document.body.appendChild(a);a.click();a.remove()}
function setupAuth(){let p=localStorage.password;if(!p){$("lockSubtitle").textContent="Create your password";$("unlockBtn").textContent="Create password"}else{$("lockSubtitle").textContent="Enter your password";$("unlockBtn").textContent="Unlock"}$("unlockBtn").onclick=()=>{const v=$("passwordInput").value;if(!v)return $("error").textContent="Enter a password";if(!p){localStorage.password=v;p=v;$("lockSubtitle").textContent="Enter your password";$("unlockBtn").textContent="Unlock";$("passwordInput").value="";return}if(v===p){$("lockScreen").classList.add("hidden");$("app").classList.remove("hidden");$("passwordInput").value="";}else $("error").textContent="Incorrect password"}}
function lockHub(){$("app").classList.add("hidden");$("lockScreen").classList.remove("hidden");$("lockSubtitle").textContent="Enter your password";$("unlockBtn").textContent="Unlock"}
function changePassword(){const old=prompt("Current password");if(old!==localStorage.password)return alert("Wrong password");const n=prompt("New password");if(n){localStorage.password=n;alert("Password changed")}}
function showPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$(id).classList.add("active");window.scrollTo(0,0)}
function updateHome(){$("homeDate").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});$("homeMusic").textContent=songs.length+" songs";$("homeGallery").textContent=photos.length+" photos";$("taskSummary").textContent=tasks.filter(t=>t.date===iso(new Date())&&!t.done).length+" tasks today"}
function saveAll(){localStorage.notes=JSON.stringify(notes);localStorage.links=JSON.stringify(links);localStorage.tasks=JSON.stringify(tasks);localStorage.apps=JSON.stringify(apps);updateHome()}
function renderCalendar(){const y=currentDate.getFullYear(),m=currentDate.getMonth();$("monthTitle").textContent=currentDate.toLocaleDateString(undefined,{month:"long",year:"numeric"});let first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),h=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=>`<div class="dow">${x}</div>`).join("");for(let i=0;i<first;i++)h+="<div></div>";for(let d=1;d<=days;d++){let x=new Date(y,m,d),v=iso(x),cl=(v===selectedDate?"selected ":"")+(v===iso(new Date())?"today":"");h+=`<button class="${cl}" onclick="selectDate('${v}')">${d}</button>`}$("calendarGrid").innerHTML=h;$("selectedDateTitle").textContent=new Date(selectedDate+"T00:00").toLocaleDateString(undefined,{month:"long",day:"numeric"})}
function selectDate(v){selectedDate=v;renderCalendar();renderTasks()}
function changeMonth(n){currentDate.setMonth(currentDate.getMonth()+n);renderCalendar()}
function todayCalendar(){currentDate=new Date();selectedDate=iso(new Date());renderCalendar();renderTasks()}
function addTask(){const title=prompt("Task title");if(!title)return;const priority=prompt("Priority: high, medium, low","medium")||"medium";tasks.push({id:Date.now(),date:selectedDate,title,priority,done:false});saveAll();renderTasks()}
function quickAddTask(){selectedDate=iso(new Date());addTask();showPage("calendar")}
function renderTasks(){const q=($("taskSearch").value||"").toLowerCase();let a=tasks.filter(t=>t.date===selectedDate&&t.title.toLowerCase().includes(q));$("taskList").innerHTML=a.length?a.map(t=>`<div class="task ${t.done?"done":""}"><input type="checkbox" ${t.done?"checked":""} onchange="toggleTask(${t.id})"><div class="taskMain"><b>${esc(t.title)}</b><br><small>${esc(t.priority)} priority</small></div><button onclick="editTask(${t.id})">✏️</button><button class="danger" onclick="removeTask(${t.id})">🗑</button></div>`).join(""):"<p class='hint'>No tasks for this date.</p>"}
function toggleTask(id){let t=tasks.find(x=>x.id===id);t.done=!t.done;saveAll();renderTasks()}
function editTask(id){let t=tasks.find(x=>x.id===id),n=prompt("Edit task",t.title);if(n){t.title=n;saveAll();renderTasks()}}
function removeTask(id){if(confirm("Remove task?")){tasks=tasks.filter(x=>x.id!==id);saveAll();renderTasks()}}
async function addMusic(e){for(const f of [...e.target.files]){const id=await put("songs",{name:f.name,type:f.type,blob:f});songs.push({...songs.find(x=>x.id===id),id,name:f.name,type:f.type,blob:f})}e.target.value="";renderSongs();updateHome()}
function renderSongs(){const q=($("musicSearch").value||"").toLowerCase(),a=songs.filter(s=>s.name.toLowerCase().includes(q));$("playlist").innerHTML=a.map(s=>`<div class="song"><span>🎵 ${esc(s.name)}</span><button onclick="playSongById(${s.id})">▶</button><button class="danger" onclick="removeSong(${s.id})">🗑</button></div>`).join("")||"<p class='hint'>Add music from your phone.</p>"}
function playSongById(id){const i=songs.findIndex(s=>s.id===id);if(i<0)return;currentSong=i;const s=songs[i];if(songUrls[i])URL.revokeObjectURL(songUrls[i]);songUrls[i]=URL.createObjectURL(s.blob);$("audio").src=songUrls[i];$("songTitle").textContent=s.name;$("audio").play().catch(()=>{});$("playBtn").textContent="⏸"}
function togglePlay(){const a=$("audio");if(!a.src&&songs[0])return playSongById(songs[0].id);a.paused?a.play():a.pause();$("playBtn").textContent=a.paused?"▶":"⏸"}
function nextSong(){if(!songs.length)return;let i=shuffle?Math.floor(Math.random()*songs.length):(currentSong+1)%songs.length;playSongById(songs[i].id)}
function previousSong(){if(!songs.length)return;playSongById(songs[(currentSong-1+songs.length)%songs.length].id)}
function toggleShuffle(){shuffle=!shuffle;alert("Shuffle "+(shuffle?"ON":"OFF"))}
$("audio").addEventListener("ended",nextSong);$("audio").addEventListener("timeupdate",()=>{$("progress").value=$("audio").duration?$("audio").currentTime/$("audio").duration*100:0});$("progress").oninput=()=>{$("audio").currentTime=$("audio").duration*($("progress").value/100)};$("volume").oninput=()=>{$("audio").volume=$("volume").value/100}
async function removeSong(id){if(confirm("Delete this song from Justine Hub?")){await del("songs",id);songs=songs.filter(s=>s.id!==id);renderSongs();updateHome()}}
async function clearMusic(){if(confirm("Clear all saved music?")){for(const s of songs)await del("songs",s.id);songs=[];renderSongs();updateHome()}}
async function addPhotos(e){for(const f of [...e.target.files]){if(!f.type.startsWith("image/"))continue;const id=await put("photos",{name:f.name,type:f.type,blob:f,created:Date.now()});photos.push({id,name:f.name,type:f.type,blob:f,created:Date.now()})}e.target.value="";renderGallery();updateHome()}
function renderGallery(){const q=($("gallerySearch").value||"").toLowerCase(),a=photos.filter(p=>p.name.toLowerCase().includes(q));$("galleryGrid").innerHTML=a.map(p=>`<div class="photo"><img src="${URL.createObjectURL(p.blob)}" alt="${esc(p.name)}"><button onclick="removePhoto(${p.id})">🗑</button></div>`).join("")||"<p class='hint'>Your saved photos will appear here.</p>"}
async function removePhoto(id){if(confirm("Delete photo?")){await del("photos",id);photos=photos.filter(p=>p.id!==id);renderGallery();updateHome()}}
function renderNotes(){const q=($("noteSearch").value||"").toLowerCase();$("notesList").innerHTML=notes.filter(n=>(n.title+" "+n.body).toLowerCase().includes(q)).map(n=>`<div class="notesItem" onclick="openNote(${n.id})"><b>${esc(n.title||"Untitled")}</b><span>${esc(n.body.slice(0,80))}</span></div>`).join("")||"<p class='hint'>No notes.</p>"}
function newNote(){currentNote=-1;$("noteTitle").value="";$("notesText").value=""}
function openNote(id){const n=notes.find(x=>x.id===id);currentNote=id;$("noteTitle").value=n.title;$("notesText").value=n.body}
function saveNote(){const n={id:currentNote<0?Date.now():currentNote,title:$("noteTitle").value||"Untitled",body:$("notesText").value};if(currentNote<0)notes.unshift(n);else notes=notes.map(x=>x.id===currentNote?n:x);saveAll();renderNotes()}
function deleteCurrentNote(){if(currentNote>=0){notes=notes.filter(x=>x.id!==currentNote);currentNote=-1;saveAll();renderNotes();newNote()}}
function renderLinks(){$("linkList").innerHTML=links.map((l,i)=>`<div class="task"><a style="flex:1;color:#fff" href="${esc(l.url)}" target="_blank">${esc(l.name)}</a><button class="danger" onclick="links.splice(${i},1);saveAll();renderLinks()">🗑</button></div>`).join("")}
function addLink(){let n=$("linkName").value.trim(),u=$("linkURL").value.trim();if(!n||!u)return alert("Enter name and URL");if(!/^https?:\/\//i.test(u))u="https://"+u;links.push({name:n,url:u});$("linkName").value="";$("linkURL").value="";saveAll();renderLinks()}
function renderApps(){const q=($('appSearch').value||'').toLowerCase();const list=apps.filter(a=>(a.name||'').toLowerCase().includes(q));$('appList').innerHTML=list.map(a=>{const idx=apps.indexOf(a);return `<div class="appItem"><span class="appIcon">📱</span><b style="flex:1">${esc(a.name||'Unnamed App')}</b><button onclick='openApp(${JSON.stringify(a.package||'')},${JSON.stringify(a.url||'')})'>Open</button><button class="danger" onclick="deleteApp(${idx})">🗑</button></div>`}).join('')||"<p class='hint'>No apps added yet. Tap ＋ Add App above.</p>"}
function addApp(){$('appName').focus()}
function saveApp(){const n=$('appName').value.trim(),p=$('appPackage').value.trim(),u=$('appUrl').value.trim();if(!n)return alert('Enter an app name');if(!p&&!u)return alert('Enter a package name or app URL');apps.unshift({id:Date.now(),name:n,package:p,url:u,manual:true});saveAll();$('appName').value='';$('appPackage').value='';$('appUrl').value='';renderApps();alert('App added')}
function deleteApp(i){if(!confirm('Delete this app shortcut?'))return;apps.splice(i,1);saveAll();renderApps()}
function refreshApps(){if(window.AndroidBridge&&AndroidBridge.getApps){try{const detected=JSON.parse(AndroidBridge.getApps());const manual=apps.filter(a=>a.manual);apps=detected.map(a=>({...a,manual:false})).concat(manual);saveAll()}catch{}}renderApps()}
function openApp(pkg,url){if(window.AndroidBridge&&AndroidBridge.openApp&&pkg){AndroidBridge.openApp(pkg);return}if(url){window.open(url,'_blank');return}if(pkg){alert('This app can only be opened from the Android APK.');return}alert('Add a package name or app URL first.')}
function setBg(name){localStorage.bg=name;document.body.style.backgroundImage="";document.body.className=document.body.className.replace(/bg-\w+/g,"")+" bg-"+name}
function loadBg(){let b=localStorage.bg||"default";setBg(b);$("soundToggle").onchange=()=>{localStorage.sound=$("soundToggle").checked?"on":"off"}}
function customBg(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{localStorage.customBg=r.result;document.body.style.backgroundImage=`url("${r.result}")`};r.readAsDataURL(f)}
document.body.className="";const oldSetBg=setBg;setBg=function(name){localStorage.bg=name;document.body.className="bg-"+name;document.body.style.backgroundImage=name==="custom"&&localStorage.customBg?`url("${localStorage.customBg}")`:""}
const style=document.createElement("style");style.textContent=".bg-default:before{background:radial-gradient(circle at 10% 10%,#6d28d9aa,transparent 38%),radial-gradient(circle at 90% 90%,#0284c7aa,transparent 40%),#09090f}.bg-purple:before{background:linear-gradient(135deg,#1e0b4b,#7c3aed,#160b30)}.bg-blue:before{background:linear-gradient(135deg,#061b3a,#0284c7,#07111f)}.bg-sunset:before{background:linear-gradient(135deg,#431407,#ea580c,#7c2d12)}.bg-forest:before{background:linear-gradient(135deg,#052e16,#15803d,#022c22)}";document.head.appendChild(style)
function toggleTheme(){document.body.classList.toggle("light");localStorage.theme=document.body.classList.contains("light")?"light":"dark"}
function calcInput(v){let d=$("calcDisplay");if(d.value==="0")d.value="";d.value+=v}function clearCalc(){$("calcDisplay").value="0"}function delCalc(){$("calcDisplay").value=$("calcDisplay").value.slice(0,-1)||"0"}function calculate(){try{let e=$("calcDisplay").value.replace(/%/g,"/100");if(!/^[0-9+\-*/().\s]+$/.test(e))throw 0;$("calcDisplay").value=String(Function("return "+e)())}catch{$("calcDisplay").value="Error"}}
function exportBackup(){const data={notes,links,tasks,apps,settings:{bg:localStorage.bg,theme:localStorage.theme,sound:localStorage.sound}};const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:"application/json"}));a.download="justine-hub-backup.json";a.click()}
function importBackup(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);notes=d.notes||notes;links=d.links||links;tasks=d.tasks||tasks;apps=d.apps||apps;saveAll();renderNotes();renderLinks();renderTasks();renderApps();alert("Backup imported")}catch{alert("Invalid backup")}};r.readAsText(f)}

/* ================= Lucky 9 ================= */
const l9Suits=[{s:'♠',c:'black'},{s:'♥',c:'red'},{s:'♦',c:'red'},{s:'♣',c:'black'}];
const l9Ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
let l9Deck=[],l9Players=[],l9Dealer=[],l9Current=0,l9RoundNo=0,l9Phase='idle';
function l9CardValue(c){if(c.r==='A')return 1;if(['10','J','Q','K'].includes(c.r))return 0;return Number(c.r)}
function l9Value(hand){return hand.reduce((a,c)=>a+l9CardValue(c),0)%10}
function l9MakeDeck(){let d=[];for(const x of l9Suits)for(const r of l9Ranks)d.push({r,s:x.s,c:x.c});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}
function l9Draw(){if(!l9Deck.length)l9Deck=l9MakeDeck();return l9Deck.pop()}
function l9CardHTML(c,hidden=false){if(hidden)return '<div class="l9-card l9-back"><span>🃏</span></div>';return `<div class="l9-card ${c.c}"><span class="l9-rank">${c.r}</span><span class="l9-suit">${c.s}</span><span class="l9-center">${c.s}</span><span class="l9-corner">${c.r}${c.s}</span></div>`}
function l9HandHTML(hand,hidden=false){return hand.map(c=>l9CardHTML(c,hidden)).join('')}
function openLucky9(){showPage('lucky9Page');l9NewGame()}
function closeLucky9(){showPage('games')}
function l9SetPlayerCount(){const n=Number($('l9PlayerCount').value);l9Players=Array.from({length:n},(_,i)=>({name:`Player ${i+1}`,hand:[],score:0,wins:0,ties:0,losses:0,status:'Waiting'}));l9RenderPlayers();l9NewRound()}
function l9NewGame(){const n=Number($('l9PlayerCount')?.value||2);l9RoundNo=0;l9Players=Array.from({length:n},(_,i)=>({name:`Player ${i+1}`,hand:[],score:0,wins:0,ties:0,losses:0,status:'Waiting'}));l9Dealer=[];l9Current=0;l9Phase='idle';l9RenderPlayers();l9RenderScoreboard();$('l9DealerCards').innerHTML='';$('l9DealerValue').textContent='—';$('l9DealerStatus').textContent='Press New Round to deal.';$('l9Turn').textContent='Ready';$('l9Message').textContent='Shuffle a fresh 52-card deck and deal.';$('l9Hit').disabled=true;$('l9Stand').disabled=true}
function l9NewRound(){l9RoundNo++;l9Deck=l9MakeDeck();l9Dealer=[l9Draw(),l9Draw()];l9Players.forEach(p=>{p.hand=[l9Draw(),l9Draw()];p.status=l9Value(p.hand)===9?'Natural 9':'Choose Hit or Stand'});l9Current=0;l9Phase='players';while(l9Current<l9Players.length&&l9Value(l9Players[l9Current].hand)===9){l9Players[l9Current].status='Natural 9 — standing';l9Current++}l9RenderRound();l9AdvanceTurn()}
function l9RenderPlayers(){const el=$('l9Players');if(!el)return;el.innerHTML=l9Players.map((p,i)=>`<div class="l9-seat l9-player ${i===l9Current&&l9Phase==='players'?'active':''}"><div class="l9-seat-title"><b>👤 ${p.name}</b><span>${p.hand.length?l9Value(p.hand):'—'}</span></div><div class="l9-cards">${l9HandHTML(p.hand)}</div><div class="l9-status">${p.status}</div></div>`).join('')}
function l9RenderRound(){if(!$('l9DealerCards'))return;$('l9Round').textContent=`ROUND ${l9RoundNo}`;$('l9DealerCards').innerHTML=l9HandHTML(l9Dealer,true);$('l9DealerValue').textContent='?';$('l9DealerStatus').textContent='Dealer hand hidden';l9RenderPlayers();l9RenderScoreboard()}
function l9AdvanceTurn(){if(l9Phase!=='players')return;while(l9Current<l9Players.length&&l9Value(l9Players[l9Current].hand)===9){l9Current++}if(l9Current>=l9Players.length){l9DealerPlay();return}const p=l9Players[l9Current];$('l9Turn').textContent=p.name;$('l9Message').textContent=`${p.name}: Hit or Stand?`;$('l9Hit').disabled=false;$('l9Stand').disabled=false;l9RenderPlayers()}
function l9Hit(){if(l9Phase!=='players'||l9Current>=l9Players.length)return;const p=l9Players[l9Current];if(p.hand.length>=3)return;l9Phase='busy';p.hand.push(l9Draw());const v=l9Value(p.hand);if(v===9){p.status='9 — standing';}else{p.status=`Hit: ${v}`;}l9RenderPlayers();setTimeout(()=>{l9Phase='players';l9Current++;l9AdvanceTurn()},220)}
function l9Stand(){if(l9Phase!=='players'||l9Current>=l9Players.length)return;l9Players[l9Current].status=`Stand on ${l9Value(l9Players[l9Current].hand)}`;l9Current++;l9AdvanceTurn()}
function l9DealerPlay(){l9Phase='dealer';$('l9Hit').disabled=true;$('l9Stand').disabled=true;let v=l9Value(l9Dealer);while(v<=5&&l9Dealer.length<3){l9Dealer.push(l9Draw());v=l9Value(l9Dealer)}$('l9DealerCards').innerHTML=l9HandHTML(l9Dealer);$('l9DealerValue').textContent=String(v);$('l9DealerStatus').textContent=v===9?'Natural / 9':'Final hand';setTimeout(l9Resolve,250)}
function l9Resolve(){const dv=l9Value(l9Dealer);l9Players.forEach(p=>{const pv=l9Value(p.hand);if(pv>dv){p.wins++;p.score++;p.status=`WIN • ${pv} vs ${dv}`}else if(pv===dv){p.ties++;p.status=`TIE • ${pv}`}else{p.losses++;p.status=`LOSE • ${pv} vs ${dv}`}});l9Phase='done';$('l9Turn').textContent='Round complete';$('l9Message').textContent=`Dealer: ${dv}. Start a new round to play again.`;l9RenderPlayers();l9RenderScoreboard()}
function l9RenderScoreboard(){const el=$('l9Scoreboard');if(!el)return;el.innerHTML=l9Players.map(p=>`<div class="l9-score-row"><b>${p.name}</b><span>🏆 ${p.score}</span><small>${p.wins}W • ${p.ties}T • ${p.losses}L</small></div>`).join('')}

init()
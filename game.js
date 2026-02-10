// ═══════════════════════════════════════════
// 원시인 사냥 RPG - 3D
// ═══════════════════════════════════════════
const container = document.getElementById('game-container');
const miniCanvas = document.getElementById('minimap');
const miniCtx = miniCanvas.getContext('2d');
let scene, renderer, cameraObj;
const clock = new THREE.Clock();
const S = 1/10;

// ── 사운드 시스템 (Web Audio API) ──
const _actx = new (window.AudioContext || window.webkitAudioContext)();
function _ensureAudio(){if(_actx.state==='suspended')_actx.resume();}
document.addEventListener('click',_ensureAudio,{once:true});
document.addEventListener('keydown',_ensureAudio,{once:true});

const sfx = {
    _play(fn){try{fn();}catch(e){}},
    // 근접 공격 - 휘두르는 소리
    meleeHit(){this._play(()=>{
        const o=_actx.createOscillator(),g=_actx.createGain();
        o.type='sawtooth';o.frequency.setValueAtTime(200,_actx.currentTime);
        o.frequency.exponentialRampToValueAtTime(80,_actx.currentTime+0.15);
        g.gain.setValueAtTime(0.18,_actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001,_actx.currentTime+0.15);
        o.connect(g);g.connect(_actx.destination);o.start();o.stop(_actx.currentTime+0.15);
    });},
    // 원거리 발사
    rangedShot(){this._play(()=>{
        const o=_actx.createOscillator(),g=_actx.createGain();
        o.type='square';o.frequency.setValueAtTime(800,_actx.currentTime);
        o.frequency.exponentialRampToValueAtTime(200,_actx.currentTime+0.12);
        g.gain.setValueAtTime(0.1,_actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001,_actx.currentTime+0.12);
        o.connect(g);g.connect(_actx.destination);o.start();o.stop(_actx.currentTime+0.12);
    });},
    // 피격
    playerHit(){this._play(()=>{
        const o=_actx.createOscillator(),g=_actx.createGain();
        o.type='square';o.frequency.setValueAtTime(150,_actx.currentTime);
        o.frequency.exponentialRampToValueAtTime(60,_actx.currentTime+0.2);
        g.gain.setValueAtTime(0.2,_actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001,_actx.currentTime+0.2);
        o.connect(g);g.connect(_actx.destination);o.start();o.stop(_actx.currentTime+0.2);
    });},
    // 적 처치
    enemyDie(){this._play(()=>{
        const o=_actx.createOscillator(),g=_actx.createGain();
        o.type='triangle';o.frequency.setValueAtTime(300,_actx.currentTime);
        o.frequency.exponentialRampToValueAtTime(600,_actx.currentTime+0.1);
        o.frequency.exponentialRampToValueAtTime(100,_actx.currentTime+0.25);
        g.gain.setValueAtTime(0.15,_actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001,_actx.currentTime+0.25);
        o.connect(g);g.connect(_actx.destination);o.start();o.stop(_actx.currentTime+0.25);
    });},
    // 보스 처치
    bossDie(){this._play(()=>{
        [300,400,500,600].forEach((f,i)=>{
            const o=_actx.createOscillator(),g=_actx.createGain();
            o.type='triangle';o.frequency.setValueAtTime(f,_actx.currentTime+i*0.1);
            g.gain.setValueAtTime(0.15,_actx.currentTime+i*0.1);
            g.gain.exponentialRampToValueAtTime(0.001,_actx.currentTime+i*0.1+0.2);
            o.connect(g);g.connect(_actx.destination);o.start(_actx.currentTime+i*0.1);o.stop(_actx.currentTime+i*0.1+0.2);
        });
    });},
    // 레벨업
    levelUp(){this._play(()=>{
        [523,659,784,1047].forEach((f,i)=>{
            const o=_actx.createOscillator(),g=_actx.createGain();
            o.type='sine';o.frequency.setValueAtTime(f,_actx.currentTime+i*0.12);
            g.gain.setValueAtTime(0.15,_actx.currentTime+i*0.12);
            g.gain.exponentialRampToValueAtTime(0.001,_actx.currentTime+i*0.12+0.3);
            o.connect(g);g.connect(_actx.destination);o.start(_actx.currentTime+i*0.12);o.stop(_actx.currentTime+i*0.12+0.3);
        });
    });},
    // 코인 획득
    coin(){this._play(()=>{
        const o=_actx.createOscillator(),g=_actx.createGain();
        o.type='sine';o.frequency.setValueAtTime(1200,_actx.currentTime);
        o.frequency.setValueAtTime(1600,_actx.currentTime+0.05);
        g.gain.setValueAtTime(0.08,_actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001,_actx.currentTime+0.12);
        o.connect(g);g.connect(_actx.destination);o.start();o.stop(_actx.currentTime+0.12);
    });},
    // 포션 사용
    heal(){this._play(()=>{
        const o=_actx.createOscillator(),g=_actx.createGain();
        o.type='sine';o.frequency.setValueAtTime(400,_actx.currentTime);
        o.frequency.exponentialRampToValueAtTime(800,_actx.currentTime+0.2);
        g.gain.setValueAtTime(0.12,_actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001,_actx.currentTime+0.25);
        o.connect(g);g.connect(_actx.destination);o.start();o.stop(_actx.currentTime+0.25);
    });},
    // 구매
    buy(){this._play(()=>{
        const o=_actx.createOscillator(),g=_actx.createGain();
        o.type='sine';o.frequency.setValueAtTime(600,_actx.currentTime);
        o.frequency.setValueAtTime(900,_actx.currentTime+0.06);
        g.gain.setValueAtTime(0.1,_actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001,_actx.currentTime+0.12);
        o.connect(g);g.connect(_actx.destination);o.start();o.stop(_actx.currentTime+0.12);
    });},
    // 무기 전환
    weaponSwitch(){this._play(()=>{
        const o=_actx.createOscillator(),g=_actx.createGain();
        o.type='triangle';o.frequency.setValueAtTime(500,_actx.currentTime);
        o.frequency.setValueAtTime(700,_actx.currentTime+0.05);
        g.gain.setValueAtTime(0.08,_actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001,_actx.currentTime+0.1);
        o.connect(g);g.connect(_actx.destination);o.start();o.stop(_actx.currentTime+0.1);
    });},
    // 사망
    death(){this._play(()=>{
        [300,200,150,80].forEach((f,i)=>{
            const o=_actx.createOscillator(),g=_actx.createGain();
            o.type='sawtooth';o.frequency.setValueAtTime(f,_actx.currentTime+i*0.15);
            g.gain.setValueAtTime(0.12,_actx.currentTime+i*0.15);
            g.gain.exponentialRampToValueAtTime(0.001,_actx.currentTime+i*0.15+0.3);
            o.connect(g);g.connect(_actx.destination);o.start(_actx.currentTime+i*0.15);o.stop(_actx.currentTime+i*0.15+0.3);
        });
    });},
    // 포탈 생성
    portal(){this._play(()=>{
        [400,500,600,800,1000].forEach((f,i)=>{
            const o=_actx.createOscillator(),g=_actx.createGain();
            o.type='sine';o.frequency.setValueAtTime(f,_actx.currentTime+i*0.08);
            g.gain.setValueAtTime(0.1,_actx.currentTime+i*0.08);
            g.gain.exponentialRampToValueAtTime(0.001,_actx.currentTime+i*0.08+0.25);
            o.connect(g);g.connect(_actx.destination);o.start(_actx.currentTime+i*0.08);o.stop(_actx.currentTime+i*0.08+0.25);
        });
    });},
};

// BGM 시스템
let _bgmOscs=[], _bgmGain=null, _bgmPlaying=false;
function startBGM(){
    if(_bgmPlaying)return; _bgmPlaying=true;
    _bgmGain=_actx.createGain(); _bgmGain.gain.setValueAtTime(0.04,_actx.currentTime); _bgmGain.connect(_actx.destination);
    const bass=_actx.createOscillator(); bass.type='triangle'; bass.frequency.setValueAtTime(55,_actx.currentTime); bass.connect(_bgmGain); bass.start(); _bgmOscs.push(bass);
    const pad=_actx.createOscillator(); pad.type='sine'; pad.frequency.setValueAtTime(110,_actx.currentTime); pad.connect(_bgmGain); pad.start(); _bgmOscs.push(pad);
    // 멜로디 루프
    const mel=_actx.createOscillator(),mG=_actx.createGain();
    mel.type='triangle'; mG.gain.setValueAtTime(0.03,_actx.currentTime); mel.connect(mG); mG.connect(_actx.destination); mel.start(); _bgmOscs.push(mel);
    const notes=[262,294,330,349,392,349,330,294];let ni=0;
    mel._iv=setInterval(()=>{mel.frequency.setValueAtTime(notes[ni%notes.length],_actx.currentTime);ni++;},500);
    _bgmOscs.push({stop(){clearInterval(mel._iv);}});
}
function stopBGM(){
    _bgmPlaying=false;
    _bgmOscs.forEach(o=>{try{o.stop();}catch(e){}});
    _bgmOscs=[];if(_bgmGain){_bgmGain.disconnect();_bgmGain=null;}
}

// ── 상수 ──
let WORLD_W = 24000, WORLD_H = 6000;
const ATTACK_RANGE = 150, ATTACK_COOLDOWN = 400, SPAWN_INTERVAL = 1500, MAX_ANIMALS = 120;

// ── 문명 ──
const CIVILIZATIONS = [
    { name:'구석기', cost:0,    bodyColor:0xd4a574, armorColor:0x8b6b4a, desc:'돌과 나무의 시대' },
    { name:'신석기', cost:100,  bodyColor:0xc4956a, armorColor:0x9a7a5a, desc:'토기와 갈돌의 시대' },
    { name:'중세',   cost:300,  bodyColor:0xb0b0b0, armorColor:0x708090, desc:'철기와 갑옷의 시대' },
    { name:'근대',   cost:700,  bodyColor:0x4a6a4a, armorColor:0x3a5a3a, desc:'화약과 군복의 시대' },
    { name:'현대',   cost:1500, bodyColor:0x2a3a5a, armorColor:0x1a2a4a, desc:'하이테크 슈트' },
    { name:'미래',   cost:3000, bodyColor:0x6a2aaa, armorColor:0x8a3aca, desc:'에너지 아머' },
    { name:'외계인', cost:6000, bodyColor:0x00ddaa, armorColor:0x00aa88, desc:'제노테크 아머' },
    { name:'신',     cost:15000, bodyColor:0xffd700, armorColor:0xffaa00, desc:'신의 갑옷' },
];

// ── 근접 무기 ──
const CIV_WEAPONS = [
    { name:'나무 몽둥이', atk:3, price:20, civIdx:0, desc:'+3', mode:'melee' },
    { name:'돌 도끼', atk:8, price:60, civIdx:0, desc:'+8', mode:'melee' },
    { name:'갈돌 창', atk:14, price:100, civIdx:1, desc:'+14', mode:'melee' },
    { name:'흑요석 단검', atk:20, price:180, civIdx:1, desc:'+20', mode:'melee' },
    { name:'철 검', atk:30, price:300, civIdx:2, desc:'+30', mode:'melee' },
    { name:'전투 도끼', atk:40, price:450, civIdx:2, desc:'+40', mode:'melee' },
    { name:'머스킷 총검', atk:55, price:600, civIdx:3, desc:'+55', mode:'melee' },
    { name:'군도', atk:70, price:850, civIdx:3, desc:'+70', mode:'melee' },
    { name:'레이저 소드', atk:90, price:1200, civIdx:4, desc:'+90', mode:'melee' },
    { name:'플라즈마 블레이드', atk:110, price:1600, civIdx:4, desc:'+110', mode:'melee' },
    { name:'나노 블레이드', atk:150, price:2500, civIdx:5, desc:'+150', mode:'melee' },
    { name:'반물질 검', atk:200, price:4000, civIdx:5, desc:'+200', mode:'melee' },
    { name:'차원절단기', atk:280, price:6000, civIdx:6, desc:'+280', mode:'melee' },
    { name:'별의 검', atk:400, price:9000, civIdx:6, desc:'+400', mode:'melee' },
    { name:'신의 창', atk:500, price:14000, civIdx:7, desc:'+500', mode:'melee' },
    { name:'우주파멸검', atk:700, price:20000, civIdx:7, desc:'+700', mode:'melee' },
];

// ── 원거리 무기 ──
const CIV_RANGED = [
    { name:'돌팔매', atk:4, price:25, civIdx:0, desc:'+4', mode:'ranged', speed:5, projColor:0x888888 },
    { name:'단궁', atk:10, price:80, civIdx:1, desc:'+10', mode:'ranged', speed:7, projColor:0x8a6a3a },
    { name:'석궁', atk:22, price:250, civIdx:2, desc:'+22', mode:'ranged', speed:8, projColor:0x555555 },
    { name:'머스킷', atk:45, price:500, civIdx:3, desc:'+45', mode:'ranged', speed:12, projColor:0xffaa00 },
    { name:'레이저건', atk:80, price:1100, civIdx:4, desc:'+80', mode:'ranged', speed:15, projColor:0x00ffaa },
    { name:'플라즈마 캐논', atk:140, price:2200, civIdx:5, desc:'+140', mode:'ranged', speed:18, projColor:0xaa00ff },
    { name:'중력포', atk:200, price:5500, civIdx:6, desc:'+200', mode:'ranged', speed:20, projColor:0x00ffcc },
    { name:'성광포', atk:350, price:12000, civIdx:7, desc:'+350', mode:'ranged', speed:22, projColor:0xffd700 },
];

// ── 방어구 ──
const CIV_ARMORS = [
    { name:'풀잎 옷', def:2, price:15, civIdx:0, desc:'+2' }, { name:'가죽 갑옷', def:6, price:50, civIdx:0, desc:'+6' },
    { name:'뼈 갑옷', def:10, price:90, civIdx:1, desc:'+10' }, { name:'돌 갑옷', def:15, price:160, civIdx:1, desc:'+15' },
    { name:'철 갑옷', def:22, price:280, civIdx:2, desc:'+22' }, { name:'판금 갑옷', def:30, price:420, civIdx:2, desc:'+30' },
    { name:'방탄 조끼', def:40, price:580, civIdx:3, desc:'+40' }, { name:'강화 슈트', def:50, price:800, civIdx:3, desc:'+50' },
    { name:'나노 아머', def:65, price:1100, civIdx:4, desc:'+65' }, { name:'에너지 실드', def:80, price:1500, civIdx:4, desc:'+80' },
    { name:'차원 갑옷', def:100, price:2200, civIdx:5, desc:'+100' }, { name:'시공간 배리어', def:130, price:3500, civIdx:5, desc:'+130' },
    { name:'외계 갑옷', def:170, price:5000, civIdx:6, desc:'+170' }, { name:'중력실드', def:220, price:8000, civIdx:6, desc:'+220' },
    { name:'신성 아머', def:300, price:13000, civIdx:7, desc:'+300' }, { name:'절대 배리어', def:400, price:18000, civIdx:7, desc:'+400' },
];

const POTIONS = [
    { name:'HP 포션 (소)', heal:30, price:15, desc:'HP 30' },
    { name:'HP 포션 (중)', heal:80, price:40, desc:'HP 80' },
    { name:'HP 포션 (대)', heal:200, price:100, desc:'HP 200' },
];

// ── 스킬 트리 ──
const SKILL_TREE = {
    // ═══ 전투 (Combat) 브랜치 ═══
    power1:    { name:'힘 강화 I',     icon:'⚔️', desc:'공격력 +5',       branch:'combat', row:0, col:1, cost:1, requires:[], effect:{baseAtk:5} },
    power2:    { name:'힘 강화 II',    icon:'⚔️', desc:'공격력 +10',      branch:'combat', row:1, col:0, cost:1, requires:['power1'], effect:{baseAtk:10} },
    crit1:     { name:'급소 공격',     icon:'🎯', desc:'치명타 확률 10%',  branch:'combat', row:1, col:2, cost:1, requires:['power1'], effect:{critChance:0.10} },
    power3:    { name:'힘 강화 III',   icon:'⚔️', desc:'공격력 +20',      branch:'combat', row:2, col:0, cost:2, requires:['power2'], effect:{baseAtk:20} },
    crit2:     { name:'치명타 강화',   icon:'💥', desc:'치명타 데미지 2배', branch:'combat', row:2, col:2, cost:2, requires:['crit1'], effect:{critDmg:2.0} },
    lifesteal: { name:'생명력 흡수',   icon:'🩸', desc:'공격 시 HP 5% 흡수',branch:'combat', row:3, col:0, cost:2, requires:['power3'], effect:{lifesteal:0.05} },
    berserk:   { name:'광폭화',        icon:'🔥', desc:'공격속도 30% 증가', branch:'combat', row:3, col:2, cost:2, requires:['crit2'], effect:{atkSpeed:0.3} },
    warlord:   { name:'전쟁의 군주',   icon:'👑', desc:'전체 공격력 +50',   branch:'combat', row:4, col:1, cost:3, requires:['lifesteal','berserk'], effect:{baseAtk:50} },

    // ═══ 방어 (Defense) 브랜치 ═══
    tough1:    { name:'강인함 I',      icon:'🛡️', desc:'방어력 +3',       branch:'defense', row:0, col:4, cost:1, requires:[], effect:{baseDef:3} },
    tough2:    { name:'강인함 II',     icon:'🛡️', desc:'방어력 +8',       branch:'defense', row:1, col:3, cost:1, requires:['tough1'], effect:{baseDef:8} },
    vitality1: { name:'체력 강화 I',   icon:'❤️', desc:'최대 HP +50',     branch:'defense', row:1, col:5, cost:1, requires:['tough1'], effect:{baseHp:50} },
    tough3:    { name:'강인함 III',    icon:'🛡️', desc:'방어력 +15',      branch:'defense', row:2, col:3, cost:2, requires:['tough2'], effect:{baseDef:15} },
    vitality2: { name:'체력 강화 II',  icon:'❤️', desc:'최대 HP +120',    branch:'defense', row:2, col:5, cost:2, requires:['vitality1'], effect:{baseHp:120} },
    thorns:    { name:'가시 갑옷',     icon:'🦔', desc:'피격 시 반사 20%', branch:'defense', row:3, col:3, cost:2, requires:['tough3'], effect:{thorns:0.2} },
    regen:     { name:'재생력',        icon:'💚', desc:'초당 HP 3 회복',   branch:'defense', row:3, col:5, cost:2, requires:['vitality2'], effect:{hpRegen:3} },
    guardian:  { name:'수호자',        icon:'🏰', desc:'받는 피해 25% 감소',branch:'defense', row:4, col:4, cost:3, requires:['thorns','regen'], effect:{dmgReduce:0.25} },

    // ═══ 유틸 (Utility) 브랜치 ═══
    swift1:    { name:'질풍 I',        icon:'💨', desc:'이동속도 +1',      branch:'utility', row:0, col:7, cost:1, requires:[], effect:{speed:1} },
    swift2:    { name:'질풍 II',       icon:'💨', desc:'이동속도 +1.5',    branch:'utility', row:1, col:6, cost:1, requires:['swift1'], effect:{speed:1.5} },
    lucky1:    { name:'행운 I',        icon:'🍀', desc:'드랍률 +20%',     branch:'utility', row:1, col:8, cost:1, requires:['swift1'], effect:{dropBonus:0.2} },
    swift3:    { name:'질풍 III',      icon:'💨', desc:'이동속도 +2',      branch:'utility', row:2, col:6, cost:2, requires:['swift2'], effect:{speed:2} },
    lucky2:    { name:'행운 II',       icon:'🍀', desc:'코인 +30%',       branch:'utility', row:2, col:8, cost:2, requires:['lucky1'], effect:{coinBonus:0.3} },
    dash:      { name:'돌진',          icon:'⚡', desc:'이동속도 +3, 관통', branch:'utility', row:3, col:6, cost:2, requires:['swift3'], effect:{speed:3} },
    magnet:    { name:'자석 수집',     icon:'🧲', desc:'아이템 흡수 범위 2배',branch:'utility', row:3, col:8, cost:2, requires:['lucky2'], effect:{magnetRange:2} },
    legend:    { name:'전설의 모험가', icon:'⭐', desc:'경험치 +50%',      branch:'utility', row:4, col:7, cost:3, requires:['dash','magnet'], effect:{xpBonus:0.5} },
};

function unlockSkill(id) {
    const sk = SKILL_TREE[id]; if(!sk) return;
    if(player.skills[id]) return; // 이미 보유
    if(player.statPoints < sk.cost) return;
    // 선행 스킬 확인
    for(const req of sk.requires) { if(!player.skills[req]) return; }
    player.statPoints -= sk.cost;
    player.skills[id] = true;
    // 효과 적용
    applySkillEffects();
    sfx.levelUp();
    addFloatingText(player.x, player.z, `${sk.icon} ${sk.name}!`, '#ffd700', 80);
    renderSkillTree();
    updateStatPointsDisplay();
}

function applySkillEffects() {
    // 기본 스탯 리셋 후 스킬 효과 합산
    let bonusAtk=0, bonusDef=0, bonusHp=0, bonusSpd=0;
    player.critChance=0; player.critDmg=1.5; player.lifesteal=0;
    player.atkSpeedBonus=0; player.thorns=0; player.hpRegen=0;
    player.dmgReduce=0; player.dropBonus=0; player.coinBonusSk=0;
    player.magnetRange=1; player.xpBonus=0;
    for(const id in player.skills) {
        if(!player.skills[id]) continue;
        const ef = SKILL_TREE[id].effect;
        if(ef.baseAtk) bonusAtk += ef.baseAtk;
        if(ef.baseDef) bonusDef += ef.baseDef;
        if(ef.baseHp) bonusHp += ef.baseHp;
        if(ef.speed) bonusSpd += ef.speed;
        if(ef.critChance) player.critChance += ef.critChance;
        if(ef.critDmg) player.critDmg = ef.critDmg;
        if(ef.lifesteal) player.lifesteal += ef.lifesteal;
        if(ef.atkSpeed) player.atkSpeedBonus += ef.atkSpeed;
        if(ef.thorns) player.thorns += ef.thorns;
        if(ef.hpRegen) player.hpRegen += ef.hpRegen;
        if(ef.dmgReduce) player.dmgReduce += ef.dmgReduce;
        if(ef.dropBonus) player.dropBonus += ef.dropBonus;
        if(ef.coinBonus) player.coinBonusSk += ef.coinBonus;
        if(ef.magnetRange) player.magnetRange = ef.magnetRange;
        if(ef.xpBonus) player.xpBonus += ef.xpBonus;
    }
    player.skillAtk = bonusAtk;
    player.skillDef = bonusDef;
    player.skillHp = bonusHp;
    player.speed = 3 + bonusSpd; // 기본 3 + 스킬 보너스
    player.maxHp = player.baseHp + bonusHp;
    player.hp = Math.min(player.hp, player.maxHp);
    recalcStats();
}

function renderSkillTree() {
    const panel = document.getElementById('skill-tree-content');
    if(!panel) return;
    panel.innerHTML = '';
    // 브랜치 헤더
    const header = document.createElement('div');
    header.className = 'st-header';
    header.innerHTML = `<span class="st-points">스킬 포인트: <b>${player.statPoints}</b></span>`;
    panel.appendChild(header);

    // SVG 연결선
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','st-lines');
    svg.setAttribute('width','100%');
    svg.setAttribute('height','100%');
    panel.appendChild(svg);

    // 그리드 컨테이너
    const grid = document.createElement('div');
    grid.className = 'st-grid';
    panel.appendChild(grid);

    // 노드 위치 맵 (나중에 선 그리기 용)
    const nodePositions = {};
    const nodeEls = {};

    for(const id in SKILL_TREE) {
        const sk = SKILL_TREE[id];
        const owned = !!player.skills[id];
        const canBuy = !owned && player.statPoints >= sk.cost && sk.requires.every(r => player.skills[r]);
        const locked = !owned && !canBuy;

        const node = document.createElement('div');
        node.className = `st-node ${owned?'owned':''} ${canBuy?'available':''} ${locked?'locked':''}`;
        node.style.gridRow = sk.row + 1;
        node.style.gridColumn = sk.col + 1;
        node.dataset.id = id;

        node.innerHTML = `
            <div class="st-icon">${sk.icon}</div>
            <div class="st-name">${sk.name}</div>
            <div class="st-cost">${owned?'✅':'🔸'+sk.cost}</div>
        `;

        // 툴팁
        node.title = `${sk.name}\n${sk.desc}\n비용: ${sk.cost} 포인트${sk.requires.length?'\n필요: '+sk.requires.map(r=>SKILL_TREE[r].name).join(', '):''}`;

        if(canBuy) {
            node.onclick = () => unlockSkill(id);
        }

        grid.appendChild(node);
        nodeEls[id] = node;
        nodePositions[id] = { row: sk.row, col: sk.col };
    }

    // 연결선 그리기 (setTimeout으로 DOM 렌더 후)
    setTimeout(() => {
        svg.innerHTML = '';
        const gridRect = grid.getBoundingClientRect();
        for(const id in SKILL_TREE) {
            const sk = SKILL_TREE[id];
            const toEl = nodeEls[id];
            if(!toEl) continue;
            for(const req of sk.requires) {
                const fromEl = nodeEls[req];
                if(!fromEl) continue;
                const fromRect = fromEl.getBoundingClientRect();
                const toRect = toEl.getBoundingClientRect();
                const x1 = fromRect.left + fromRect.width/2 - gridRect.left;
                const y1 = fromRect.top + fromRect.height - gridRect.top;
                const x2 = toRect.left + toRect.width/2 - gridRect.left;
                const y2 = toRect.top - gridRect.top;
                const owned = player.skills[req] && player.skills[id];
                const available = player.skills[req];
                const line = document.createElementNS('http://www.w3.org/2000/svg','line');
                line.setAttribute('x1',x1); line.setAttribute('y1',y1);
                line.setAttribute('x2',x2); line.setAttribute('y2',y2);
                line.setAttribute('class', `st-line ${owned?'owned':''} ${available?'active':''}`);
                svg.appendChild(line);
            }
        }
    }, 50);
}

function toggleSkillTree() {
    togglePanel('skill-tree-panel', () => { renderSkillTree(); });
}

// ── 스테이지 1 지역 ──
const STAGE1_REGIONS = [
    { name:'초원', x:0, w:4000, color:0x4a7a2e, hex:'#4a7a2e', animals:['토끼','사슴'], boss:'초원의 왕 사슴' },
    { name:'숲', x:4000, w:4000, color:0x2d5a1e, hex:'#2d5a1e', animals:['멧돼지','늑대'], boss:'숲의 대왕 늑대' },
    { name:'산', x:8000, w:4000, color:0x6a6a5a, hex:'#6a6a5a', animals:['곰'], boss:'산의 폭군 곰' },
    { name:'설원', x:12000, w:4000, color:0xb8c8d8, hex:'#b8c8d8', animals:['매머드'], boss:'고대 매머드' },
    { name:'화산', x:16000, w:4000, color:0x8a3a1a, hex:'#8a3a1a', animals:['화산 도마뱀','용암 골렘'], boss:'화산의 드래곤' },
    { name:'심연', x:20000, w:4000, color:0x1a1a3a, hex:'#1a1a3a', animals:['그림자 늑대','심연의 기사'], boss:null },
];

// ── 스테이지 2 지역 ──
const STAGE2_REGIONS = [
    { name:'불모지', x:0, w:4000, color:0x5a4a2a, hex:'#5a4a2a', animals:['언데드 전사','해골 궁수'], boss:'언데드 장군' },
    { name:'독늪', x:4000, w:4000, color:0x2a4a2a, hex:'#2a4a2a', animals:['독 뱀','늪지 괴물'], boss:'독늪의 히드라' },
    { name:'용암 협곡', x:8000, w:4000, color:0x6a1a0a, hex:'#6a1a0a', animals:['화염 정령','마그마 거인'], boss:'용암 군주' },
    { name:'드래곤 둥지', x:12000, w:4000, color:0x3a0a0a, hex:'#3a0a0a', animals:['어린 드래곤','화염 드레이크'], boss:'고대 드래곤' },
    { name:'뼈의 황무지', x:16000, w:4000, color:0x2a2a2a, hex:'#2a2a2a', animals:['스켈레톤 기사','본 드래곤'], boss:null },
    { name:'스켈레톤 왕좌', x:20000, w:4000, color:0x1a0a1a, hex:'#1a0a1a', animals:['스켈레톤 마법사','죽음의 기사'], boss:null },
];

// ── 스테이지 3 지역 ──
const STAGE3_REGIONS = [
    { name:'소행성대', x:0, w:4000, color:0x1a1a2a, hex:'#1a1a2a', animals:['우주 해파리','소행성 골렘'], boss:'소행성 여왕' },
    { name:'성운지대', x:4000, w:4000, color:0x2a1a4a, hex:'#2a1a4a', animals:['성운 정령','차원 유령'], boss:'성운의 수호자' },
    { name:'외계 기지', x:8000, w:4000, color:0x0a2a2a, hex:'#0a2a2a', animals:['외계 전사','외계 사냥꾼'], boss:'외계 사령관' },
    { name:'블랙홀 주변', x:12000, w:4000, color:0x0a0a1a, hex:'#0a0a1a', animals:['중력 괴물','시간 왜곡체'], boss:'블랙홀 수호자' },
    { name:'천상 관문', x:16000, w:4000, color:0x3a2a5a, hex:'#3a2a5a', animals:['천사 기사','세라핌 궁수'], boss:null },
    { name:'신의 왕좌', x:20000, w:4000, color:0x4a3a1a, hex:'#4a3a1a', animals:['타락천사','신의 시종'], boss:null },
];

let REGIONS = STAGE1_REGIONS;

// ── 동물 데이터 ──
const ANIMAL_DATA = {
    // 스테이지 1
    '토끼':       { hp:20, atk:3, def:0, xp:10, coin:5, speed:2.5, size:0.5, color:0xc8a070, behavior:'roam', drop:'토끼 가죽', dropRate:0.6 },
    '사슴':       { hp:40, atk:5, def:1, xp:25, coin:12, speed:2, size:0.8, color:0xa08050, behavior:'roam', drop:'사슴 뿔', dropRate:0.4 },
    '멧돼지':     { hp:70, atk:10, def:3, xp:50, coin:25, speed:1.8, size:0.9, color:0x6a4a3a, behavior:'chase', drop:'멧돼지 엄니', dropRate:0.5 },
    '늑대':       { hp:100, atk:15, def:4, xp:80, coin:40, speed:2.2, size:0.8, color:0x7a7a7a, behavior:'chase', drop:'늑대 발톱', dropRate:0.5 },
    '곰':         { hp:180, atk:25, def:8, xp:150, coin:80, speed:1.5, size:1.3, color:0x5a3a2a, behavior:'chase', drop:'곰 가죽', dropRate:0.6 },
    '매머드':     { hp:350, atk:40, def:15, xp:300, coin:200, speed:1, size:1.8, color:0x8a6a4a, behavior:'chase', drop:'매머드 상아', dropRate:0.7 },
    '화산 도마뱀':{ hp:250, atk:35, def:12, xp:200, coin:120, speed:2, size:1.0, color:0xcc4400, behavior:'chase', drop:'용암 비늘', dropRate:0.5 },
    '용암 골렘':  { hp:400, atk:50, def:25, xp:400, coin:250, speed:0.8, size:1.6, color:0xaa2200, behavior:'chase', drop:'마그마 핵', dropRate:0.6 },
    '그림자 늑대':{ hp:300, atk:45, def:15, xp:350, coin:200, speed:2.5, size:1.0, color:0x2a1a3a, behavior:'chase', drop:'그림자 정수', dropRate:0.5 },
    '심연의 기사':{ hp:500, atk:60, def:30, xp:500, coin:350, speed:1.5, size:1.4, color:0x3a2a5a, behavior:'chase', drop:'심연의 갑편', dropRate:0.6 },
    // 스테이지 1 보스
    '초원의 왕 사슴': { hp:500, atk:20, def:5, xp:300, coin:200, speed:1.8, size:2.0, color:0xdaa520, behavior:'chase', drop:'황금 뿔', dropRate:1, isBoss:true },
    '숲의 대왕 늑대': { hp:800, atk:35, def:10, xp:500, coin:350, speed:2.0, size:2.2, color:0x2a2a2a, behavior:'chase', drop:'대왕의 송곳니', dropRate:1, isBoss:true },
    '산의 폭군 곰':   { hp:1200, atk:55, def:20, xp:800, coin:500, speed:1.3, size:2.5, color:0x3a1a0a, behavior:'chase', drop:'폭군의 발톱', dropRate:1, isBoss:true },
    '고대 매머드':    { hp:2000, atk:80, def:35, xp:1200, coin:800, speed:0.8, size:3.0, color:0x6a4a2a, behavior:'chase', drop:'고대의 상아', dropRate:1, isBoss:true },
    '화산의 드래곤':  { hp:3000, atk:120, def:50, xp:2000, coin:1500, speed:1.2, size:3.5, color:0xff2200, behavior:'chase', drop:'드래곤의 심장', dropRate:1, isBoss:true },
    '심연의 군주':    { hp:5000, atk:180, def:80, xp:5000, coin:5000, speed:1.5, size:4.0, color:0x5a0a8a, behavior:'chase', drop:'차원의 보석', dropRate:1, isBoss:true, isFinalBoss:true },
    // 스테이지 2
    '언데드 전사': { hp:200, atk:30, def:10, xp:120, coin:80, speed:1.5, size:0.9, color:0x6a6a5a, behavior:'chase', drop:'부서진 뼈', dropRate:0.5 },
    '해골 궁수':   { hp:150, atk:40, def:5, xp:150, coin:100, speed:1.8, size:0.8, color:0x8a8a7a, behavior:'chase', drop:'저주받은 화살', dropRate:0.5 },
    '독 뱀':       { hp:180, atk:35, def:8, xp:140, coin:90, speed:2.5, size:0.7, color:0x2a8a2a, behavior:'chase', drop:'독 송곳니', dropRate:0.5 },
    '늪지 괴물':   { hp:350, atk:45, def:18, xp:250, coin:150, speed:1, size:1.4, color:0x3a5a3a, behavior:'chase', drop:'늪지 점액', dropRate:0.6 },
    '화염 정령':   { hp:300, atk:50, def:15, xp:300, coin:180, speed:2, size:1.0, color:0xff6600, behavior:'chase', drop:'화염 정수', dropRate:0.5 },
    '마그마 거인': { hp:600, atk:70, def:35, xp:500, coin:300, speed:0.7, size:1.8, color:0xcc2200, behavior:'chase', drop:'마그마 심장', dropRate:0.6 },
    '어린 드래곤': { hp:500, atk:60, def:25, xp:400, coin:250, speed:1.8, size:1.5, color:0xcc4400, behavior:'chase', drop:'드래곤 비늘', dropRate:0.5 },
    '화염 드레이크':{ hp:800, atk:80, def:35, xp:600, coin:400, speed:1.5, size:2.0, color:0xee3300, behavior:'chase', drop:'드레이크 화염낭', dropRate:0.6 },
    '스켈레톤 기사':{ hp:600, atk:65, def:30, xp:500, coin:300, speed:1.5, size:1.2, color:0xaaaaaa, behavior:'chase', drop:'해골 갑편', dropRate:0.5 },
    '본 드래곤':   { hp:1000, atk:90, def:40, xp:800, coin:500, speed:1.2, size:2.0, color:0xccccaa, behavior:'chase', drop:'뼈 드래곤 이빨', dropRate:0.6 },
    '스켈레톤 마법사':{ hp:400, atk:80, def:15, xp:600, coin:350, speed:1.3, size:1.0, color:0x8a5acc, behavior:'chase', drop:'저주의 지팡이', dropRate:0.5 },
    '죽음의 기사': { hp:900, atk:100, def:50, xp:900, coin:600, speed:1.5, size:1.5, color:0x2a0a2a, behavior:'chase', drop:'죽음의 검편', dropRate:0.6 },
    // 스테이지 2 보스
    '언데드 장군': { hp:3000, atk:80, def:30, xp:2000, coin:1000, speed:1.5, size:2.5, color:0x5a5a4a, behavior:'chase', drop:'장군의 왕관', dropRate:1, isBoss:true },
    '독늪의 히드라':{ hp:4000, atk:100, def:40, xp:3000, coin:1500, speed:1, size:3.0, color:0x1a6a1a, behavior:'chase', drop:'히드라의 심장', dropRate:1, isBoss:true },
    '용암 군주':   { hp:5000, atk:130, def:55, xp:4000, coin:2000, speed:1.2, size:3.5, color:0xdd1100, behavior:'chase', drop:'용암 왕관', dropRate:1, isBoss:true },
    '고대 드래곤': { hp:8000, atk:180, def:70, xp:6000, coin:4000, speed:1.3, size:4.0, color:0xcc3300, behavior:'chase', drop:'드래곤 왕의 눈', dropRate:1, isBoss:true },
    '스켈레톤 드래곤':{ hp:12000, atk:250, def:100, xp:10000, coin:10000, speed:1.5, size:5.0, color:0xddddaa, behavior:'chase', drop:'불멸의 뼈', dropRate:1, isBoss:true, isFinalBoss:true },
    // 스테이지 3
    '우주 해파리':   { hp:1000, atk:100, def:30, xp:800, coin:500, speed:1.8, size:1.0, color:0x44ccff, behavior:'roam', drop:'해파리 촉수', dropRate:0.5 },
    '소행성 골렘':   { hp:1800, atk:130, def:60, xp:1000, coin:600, speed:0.8, size:1.6, color:0x6a6a8a, behavior:'chase', drop:'소행성 핵', dropRate:0.5 },
    '성운 정령':     { hp:1200, atk:120, def:35, xp:900, coin:550, speed:2.0, size:1.1, color:0xaa44ff, behavior:'chase', drop:'성운 정수', dropRate:0.5 },
    '차원 유령':     { hp:1400, atk:150, def:20, xp:1100, coin:700, speed:2.5, size:1.0, color:0x8888cc, behavior:'chase', drop:'차원 조각', dropRate:0.5 },
    '외계 전사':     { hp:1600, atk:160, def:50, xp:1200, coin:750, speed:1.8, size:1.2, color:0x00cc88, behavior:'chase', drop:'외계 금속', dropRate:0.5 },
    '외계 사냥꾼':   { hp:1300, atk:180, def:35, xp:1300, coin:800, speed:2.2, size:1.1, color:0x00aa66, behavior:'chase', drop:'외계 합금', dropRate:0.5 },
    '중력 괴물':     { hp:2200, atk:200, def:70, xp:1500, coin:900, speed:1.0, size:1.5, color:0x2a1a4a, behavior:'chase', drop:'중력 코어', dropRate:0.5 },
    '시간 왜곡체':   { hp:2000, atk:220, def:40, xp:1600, coin:1000, speed:2.0, size:1.2, color:0x5544aa, behavior:'chase', drop:'시간 결정', dropRate:0.5 },
    '천사 기사':     { hp:2500, atk:250, def:80, xp:1800, coin:1200, speed:1.5, size:1.4, color:0xffffff, behavior:'chase', drop:'천사 깃털', dropRate:0.5 },
    '세라핌 궁수':   { hp:2000, atk:280, def:50, xp:1700, coin:1100, speed:1.8, size:1.2, color:0xffffcc, behavior:'chase', drop:'빛의 화살', dropRate:0.5 },
    '타락천사':      { hp:2800, atk:270, def:70, xp:2000, coin:1300, speed:1.5, size:1.5, color:0x4a2a6a, behavior:'chase', drop:'타락의 날개', dropRate:0.5 },
    '신의 시종':     { hp:3000, atk:300, def:90, xp:2200, coin:1500, speed:1.3, size:1.6, color:0xffcc44, behavior:'chase', drop:'신성한 인장', dropRate:0.6 },
    // 스테이지 3 보스
    '소행성 여왕':   { hp:15000, atk:200, def:80, xp:5000, coin:3000, speed:1.2, size:3.0, color:0x44aaff, behavior:'chase', drop:'여왕의 결정', dropRate:1, isBoss:true },
    '성운의 수호자': { hp:20000, atk:250, def:100, xp:7000, coin:4000, speed:1.0, size:3.5, color:0x8844cc, behavior:'chase', drop:'성운의 심장', dropRate:1, isBoss:true },
    '외계 사령관':   { hp:25000, atk:300, def:120, xp:9000, coin:5000, speed:1.5, size:3.5, color:0x00ee88, behavior:'chase', drop:'사령관의 장치', dropRate:1, isBoss:true },
    '블랙홀 수호자': { hp:35000, atk:400, def:150, xp:12000, coin:8000, speed:1.2, size:4.0, color:0x1a0a3a, behavior:'chase', drop:'블랙홀 코어', dropRate:1, isBoss:true },
    '창조의 신':     { hp:50000, atk:500, def:200, xp:20000, coin:20000, speed:1.5, size:5.5, color:0xffd700, behavior:'chase', drop:'창조의 조각', dropRate:1, isBoss:true, isFinalBoss:true },
};

// ── 아군 ──
const ALLY_TYPES = [
    { name:'전사', hp:80, atk:8, def:3, speed:2, range:40, price:80, color:0x4488cc, desc:'근접 전투', mode:'melee' },
    { name:'궁수', hp:50, atk:12, def:1, speed:1.8, range:150, price:120, color:0x44cc44, desc:'원거리 공격', mode:'ranged' },
    { name:'힐러', hp:60, atk:3, def:2, speed:1.5, range:80, price:150, color:0xffaacc, desc:'HP 회복', mode:'heal' },
    { name:'기사', hp:150, atk:15, def:8, speed:1.5, range:45, price:300, color:0xcccc44, desc:'강력한 탱커', mode:'melee' },
    { name:'마법사', hp:70, atk:25, def:2, speed:1.3, range:160, price:500, color:0xaa44ff, desc:'광역 원거리', mode:'ranged' },
];

// ── 마을 건물 ──
const BUILDINGS = [
    { name:'오두막', price:50, desc:'인구 +2', icon:'🏠', effect:'population', value:2 },
    { name:'대장간', price:150, desc:'아군 공격 +3', icon:'⚒️', effect:'allyAtk', value:3 },
    { name:'병원', price:200, desc:'자동 회복 +1/초', icon:'🏥', effect:'regen', value:1 },
    { name:'시장', price:250, desc:'코인 +20%', icon:'🏪', effect:'coinBonus', value:0.2 },
    { name:'요새', price:400, desc:'아군 방어 +5', icon:'🏰', effect:'allyDef', value:5 },
    { name:'훈련소', price:350, desc:'아군 속도 +0.5', icon:'🎯', effect:'allySpd', value:0.5 },
    { name:'마법탑', price:600, desc:'아군 공격 +8', icon:'🗼', effect:'allyAtk', value:8 },
    { name:'성벽', price:500, desc:'인구 +5', icon:'🧱', effect:'population', value:5 },
];

// ── 스프라이트 텍스처 시스템 ──
const spriteTexCache = {};
const ANIMAL_CATEGORY = {
    '토끼':'rabbit',
    '사슴':'deer', '초원의 왕 사슴':'deer',
    '멧돼지':'boar',
    '늑대':'wolf', '숲의 대왕 늑대':'wolf', '그림자 늑대':'wolf',
    '곰':'bear', '산의 폭군 곰':'bear',
    '매머드':'mammoth', '고대 매머드':'mammoth',
    '화산 도마뱀':'lizard',
    '용암 골렘':'golem', '마그마 거인':'golem', '용암 군주':'golem',
    '심연의 기사':'knight', '죽음의 기사':'knight', '언데드 전사':'knight',
    '스켈레톤 기사':'knight', '언데드 장군':'knight', '심연의 군주':'knight',
    '해골 궁수':'skeleton', '스켈레톤 마법사':'skeleton',
    '독 뱀':'snake',
    '늪지 괴물':'blob', '독늪의 히드라':'blob',
    '화염 정령':'spirit',
    '어린 드래곤':'dragon', '화염 드레이크':'dragon', '본 드래곤':'dragon',
    '고대 드래곤':'dragon', '화산의 드래곤':'dragon', '스켈레톤 드래곤':'dragon',
    // 스테이지 3
    '우주 해파리':'jellyfish', '소행성 여왕':'jellyfish',
    '소행성 골렘':'golem',
    '성운 정령':'spirit', '성운의 수호자':'spirit',
    '차원 유령':'phantom', '시간 왜곡체':'phantom', '블랙홀 수호자':'phantom',
    '외계 전사':'alien', '외계 사냥꾼':'alien', '외계 사령관':'alien',
    '천사 기사':'angel', '세라핌 궁수':'angel', '타락천사':'angel', '신의 시종':'angel',
    '창조의 신':'god',
    '중력 괴물':'phantom',
};

function makeAnimalTex(type) {
    if (spriteTexCache[type]) return spriteTexCache[type];
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    const c = cv.getContext('2d');
    const data = ANIMAL_DATA[type];
    const cat = ANIMAL_CATEGORY[type] || 'rabbit';
    const isBoss = data.isBoss;
    const col = '#' + data.color.toString(16).padStart(6,'0');

    // 보스 아우라
    if (isBoss) {
        const ag = c.createRadialGradient(64,70,20,64,70,60);
        ag.addColorStop(0, 'rgba(255,215,0,0.3)');
        ag.addColorStop(1, 'rgba(255,215,0,0)');
        c.fillStyle = ag;
        c.fillRect(0,0,128,128);
    }

    const drawFuncs = {
        rabbit() {
            // 몸
            c.fillStyle = col;
            c.beginPath(); c.ellipse(64,78,22,18,0,0,Math.PI*2); c.fill();
            // 머리
            c.beginPath(); c.ellipse(64,55,16,14,0,0,Math.PI*2); c.fill();
            // 귀
            c.fillStyle = col;
            c.beginPath(); c.ellipse(54,30,5,16,-.2,0,Math.PI*2); c.fill();
            c.beginPath(); c.ellipse(74,30,5,16,.2,0,Math.PI*2); c.fill();
            // 귀 안쪽
            c.fillStyle = '#ffaaaa';
            c.beginPath(); c.ellipse(54,30,3,12,-.2,0,Math.PI*2); c.fill();
            c.beginPath(); c.ellipse(74,30,3,12,.2,0,Math.PI*2); c.fill();
            // 눈
            c.fillStyle = '#000';
            c.beginPath(); c.arc(57,52,3,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(71,52,3,0,Math.PI*2); c.fill();
            // 코
            c.fillStyle = '#ff8888';
            c.beginPath(); c.arc(64,58,2.5,0,Math.PI*2); c.fill();
            // 솜털 꼬리
            c.fillStyle = '#fff';
            c.beginPath(); c.arc(64,98,7,0,Math.PI*2); c.fill();
            // 발
            c.fillStyle = col;
            c.beginPath(); c.ellipse(50,96,7,4,0,0,Math.PI*2); c.fill();
            c.beginPath(); c.ellipse(78,96,7,4,0,0,Math.PI*2); c.fill();
        },
        deer() {
            // 몸 (날씬)
            c.fillStyle = col;
            c.beginPath(); c.ellipse(64,78,24,14,0,0,Math.PI*2); c.fill();
            // 목
            c.fillRect(58,55,12,25);
            // 머리
            c.beginPath(); c.ellipse(64,48,14,12,0,0,Math.PI*2); c.fill();
            // 뿔
            c.strokeStyle = '#8B7355'; c.lineWidth = 3; c.lineCap = 'round';
            c.beginPath(); c.moveTo(52,42); c.lineTo(42,22); c.lineTo(36,28); c.moveTo(42,22); c.lineTo(48,16); c.stroke();
            c.beginPath(); c.moveTo(76,42); c.lineTo(86,22); c.lineTo(92,28); c.moveTo(86,22); c.lineTo(80,16); c.stroke();
            // 눈
            c.fillStyle = '#000';
            c.beginPath(); c.arc(57,46,2.5,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(71,46,2.5,0,Math.PI*2); c.fill();
            // 코
            c.fillStyle = '#333';
            c.beginPath(); c.arc(64,54,2,0,Math.PI*2); c.fill();
            // 다리 (긴)
            c.fillStyle = col;
            [48,58,70,80].forEach(x => { c.fillRect(x-2,90,5,20); });
            // 배 밝은 색
            c.fillStyle = 'rgba(255,255,255,0.2)';
            c.beginPath(); c.ellipse(64,82,16,8,0,0,Math.PI*2); c.fill();
        },
        boar() {
            // 통통한 몸
            c.fillStyle = col;
            c.beginPath(); c.ellipse(64,72,28,22,0,0,Math.PI*2); c.fill();
            // 머리
            c.beginPath(); c.ellipse(64,48,18,16,0,0,Math.PI*2); c.fill();
            // 등털
            c.strokeStyle = '#2a1a0a'; c.lineWidth = 2;
            for(let i=0;i<8;i++) { c.beginPath(); c.moveTo(40+i*7,52); c.lineTo(40+i*7,46); c.stroke(); }
            // 코/주둥이
            c.fillStyle = '#c49070';
            c.beginPath(); c.ellipse(64,56,10,7,0,0,Math.PI*2); c.fill();
            // 콧구멍
            c.fillStyle = '#333';
            c.beginPath(); c.arc(60,56,2,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(68,56,2,0,Math.PI*2); c.fill();
            // 엄니
            c.fillStyle = '#fffff0';
            c.beginPath(); c.moveTo(52,58); c.lineTo(48,48); c.lineTo(55,54); c.fill();
            c.beginPath(); c.moveTo(76,58); c.lineTo(80,48); c.lineTo(73,54); c.fill();
            // 눈
            c.fillStyle = '#000';
            c.beginPath(); c.arc(55,44,3,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(73,44,3,0,Math.PI*2); c.fill();
            // 다리 (짧고 굵음)
            c.fillStyle = col;
            [44,56,72,84].forEach(x => { c.fillRect(x-4,90,8,16); });
        },
        wolf() {
            // 날렵한 몸
            c.fillStyle = col;
            c.beginPath(); c.ellipse(64,74,26,16,0,0,Math.PI*2); c.fill();
            // 목
            c.fillRect(56,54,16,22);
            // 머리
            c.beginPath(); c.ellipse(64,48,16,13,0,0,Math.PI*2); c.fill();
            // 주둥이
            c.beginPath(); c.moveTo(54,52); c.lineTo(64,62); c.lineTo(74,52); c.fill();
            // 뾰족한 귀
            c.fillStyle = col;
            c.beginPath(); c.moveTo(48,46); c.lineTo(44,26); c.lineTo(56,40); c.fill();
            c.beginPath(); c.moveTo(80,46); c.lineTo(84,26); c.lineTo(72,40); c.fill();
            // 귀 안쪽
            c.fillStyle = '#aaa';
            c.beginPath(); c.moveTo(50,44); c.lineTo(47,30); c.lineTo(55,40); c.fill();
            c.beginPath(); c.moveTo(78,44); c.lineTo(81,30); c.lineTo(73,40); c.fill();
            // 눈 (날카로운)
            c.fillStyle = type.includes('그림자') ? '#aa00ff' : '#ffcc00';
            c.beginPath(); c.ellipse(56,45,3.5,2,-.2,0,Math.PI*2); c.fill();
            c.beginPath(); c.ellipse(72,45,3.5,2,.2,0,Math.PI*2); c.fill();
            c.fillStyle = '#000';
            c.beginPath(); c.arc(56,45,1.5,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(72,45,1.5,0,Math.PI*2); c.fill();
            // 코
            c.fillStyle = '#222';
            c.beginPath(); c.arc(64,52,2.5,0,Math.PI*2); c.fill();
            // 꼬리 (덥수룩)
            c.fillStyle = col;
            c.beginPath(); c.ellipse(32,68,12,6,-.6,0,Math.PI*2); c.fill();
            // 다리
            [48,58,70,80].forEach(x => { c.fillRect(x-2,88,5,18); });
        },
        bear() {
            // 큰 둥근 몸
            c.fillStyle = col;
            c.beginPath(); c.ellipse(64,72,30,26,0,0,Math.PI*2); c.fill();
            // 머리
            c.beginPath(); c.ellipse(64,42,20,18,0,0,Math.PI*2); c.fill();
            // 둥근 귀
            c.beginPath(); c.arc(44,30,8,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(84,30,8,0,Math.PI*2); c.fill();
            // 귀 안쪽
            c.fillStyle = '#c49070';
            c.beginPath(); c.arc(44,30,5,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(84,30,5,0,Math.PI*2); c.fill();
            // 주둥이
            c.fillStyle = '#c49070';
            c.beginPath(); c.ellipse(64,50,10,7,0,0,Math.PI*2); c.fill();
            // 코
            c.fillStyle = '#222';
            c.beginPath(); c.arc(64,48,3.5,0,Math.PI*2); c.fill();
            // 눈
            c.fillStyle = '#000';
            c.beginPath(); c.arc(54,40,3,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(74,40,3,0,Math.PI*2); c.fill();
            // 다리 (굵음)
            c.fillStyle = col;
            [42,56,72,86].forEach(x => { c.fillRect(x-5,92,10,18); });
            // 발톱
            c.fillStyle = '#222';
            [42,56,72,86].forEach(x => {
                for(let j=-1;j<=1;j++) { c.beginPath(); c.arc(x+j*3,110,1.5,0,Math.PI*2); c.fill(); }
            });
        },
        mammoth() {
            // 거대한 몸
            c.fillStyle = col;
            c.beginPath(); c.ellipse(64,68,34,28,0,0,Math.PI*2); c.fill();
            // 머리
            c.beginPath(); c.ellipse(64,38,22,20,0,0,Math.PI*2); c.fill();
            // 코 (길게)
            c.fillStyle = col;
            c.beginPath();
            c.moveTo(56,50); c.quadraticCurveTo(50,80,42,100);
            c.lineTo(48,100); c.quadraticCurveTo(56,82,62,52);
            c.fill();
            // 상아
            c.fillStyle = '#fffff0'; c.strokeStyle = '#ddd'; c.lineWidth = 1;
            c.beginPath();
            c.moveTo(52,52); c.quadraticCurveTo(36,58,34,74);
            c.lineTo(38,74); c.quadraticCurveTo(40,60,54,54);
            c.fill(); c.stroke();
            c.beginPath();
            c.moveTo(76,52); c.quadraticCurveTo(92,58,94,74);
            c.lineTo(90,74); c.quadraticCurveTo(88,60,74,54);
            c.fill(); c.stroke();
            // 눈
            c.fillStyle = '#000';
            c.beginPath(); c.arc(54,36,3,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(74,36,3,0,Math.PI*2); c.fill();
            // 다리
            c.fillStyle = col;
            [38,52,76,90].forEach(x => { c.fillRect(x-5,90,10,22); });
            // 털 디테일
            c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 1;
            for(let i=0;i<12;i++) { c.beginPath(); c.moveTo(38+i*5,50+Math.random()*10); c.lineTo(38+i*5,58+Math.random()*10); c.stroke(); }
        },
        lizard() {
            // 긴 몸
            c.fillStyle = col;
            c.beginPath(); c.ellipse(58,68,20,14,-.1,0,Math.PI*2); c.fill();
            // 머리
            c.beginPath(); c.ellipse(80,58,14,10,-.3,0,Math.PI*2); c.fill();
            // 꼬리
            c.beginPath();
            c.moveTo(38,68); c.quadraticCurveTo(20,62,10,72);
            c.quadraticCurveTo(18,68,36,72);
            c.fill();
            // 등 돌기
            c.fillStyle = '#ff6600';
            for(let i=0;i<5;i++) {
                const bx=42+i*8, by=56-i*1;
                c.beginPath(); c.moveTo(bx-3,by+4); c.lineTo(bx,by-4); c.lineTo(bx+3,by+4); c.fill();
            }
            // 눈 (파충류)
            c.fillStyle = '#ffcc00';
            c.beginPath(); c.ellipse(84,54,4,3,0,0,Math.PI*2); c.fill();
            c.fillStyle = '#000';
            c.fillRect(83,52,2,5);
            // 다리 (짧음)
            c.fillStyle = col;
            c.fillRect(46,80,6,12); c.fillRect(66,80,6,12);
            c.fillRect(50,78,6,10); c.fillRect(70,78,6,10);
        },
        golem() {
            // 바위 몸
            c.fillStyle = col;
            c.beginPath();
            c.moveTo(40,40); c.lineTo(30,70); c.lineTo(34,100);
            c.lineTo(52,110); c.lineTo(76,110); c.lineTo(94,100);
            c.lineTo(98,70); c.lineTo(88,40); c.closePath();
            c.fill();
            // 빛나는 균열
            c.strokeStyle = '#ff6600'; c.lineWidth = 2; c.shadowColor = '#ff4400'; c.shadowBlur = 6;
            c.beginPath(); c.moveTo(50,50); c.lineTo(55,70); c.lineTo(48,90); c.stroke();
            c.beginPath(); c.moveTo(78,45); c.lineTo(72,65); c.lineTo(80,85); c.stroke();
            c.beginPath(); c.moveTo(60,60); c.lineTo(70,75); c.stroke();
            c.shadowBlur = 0;
            // 눈 (빛나는)
            c.fillStyle = '#ff8800'; c.shadowColor = '#ff4400'; c.shadowBlur = 8;
            c.beginPath(); c.arc(52,52,5,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(76,52,5,0,Math.PI*2); c.fill();
            c.shadowBlur = 0;
            // 바위 디테일
            c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1;
            [[45,65,60,62],[68,58,82,65],[55,85,70,82]].forEach(([x1,y1,x2,y2])=>{
                c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke();
            });
        },
        knight() {
            // 갑옷 몸
            c.fillStyle = col;
            c.beginPath();
            c.moveTo(46,45); c.lineTo(38,75); c.lineTo(40,100);
            c.lineTo(88,100); c.lineTo(90,75); c.lineTo(82,45);
            c.closePath(); c.fill();
            // 헬멧
            c.beginPath(); c.ellipse(64,36,16,18,0,0,Math.PI*2); c.fill();
            // 눈 슬릿
            c.fillStyle = type.includes('심연') || type.includes('죽음') ? '#ff0000' : '#ffcc00';
            c.fillRect(50,32,28,5);
            // 어깨 갑옷
            c.fillStyle = col;
            c.beginPath(); c.ellipse(38,50,10,6,-.3,0,Math.PI*2); c.fill();
            c.beginPath(); c.ellipse(90,50,10,6,.3,0,Math.PI*2); c.fill();
            // 검
            c.fillStyle = '#ccc'; c.strokeStyle = '#888'; c.lineWidth = 1;
            c.fillRect(94,40,3,40);
            c.fillStyle = '#aa8833';
            c.fillRect(90,38,10,5); // 가드
            c.fillStyle = '#664422';
            c.fillRect(93,78,6,10); // 손잡이
            // 방패 (왼손)
            c.fillStyle = '#555';
            c.beginPath();
            c.moveTo(28,48); c.lineTo(22,58); c.lineTo(24,78);
            c.lineTo(34,82); c.lineTo(38,58); c.closePath();
            c.fill();
            c.fillStyle = col;
            c.beginPath(); c.arc(30,64,6,0,Math.PI*2); c.fill();
            // 다리
            c.fillStyle = col;
            c.fillRect(48,98,10,16); c.fillRect(70,98,10,16);
            // 부츠
            c.fillStyle = '#333';
            c.fillRect(46,112,14,6); c.fillRect(68,112,14,6);
        },
        skeleton() {
            // 해골
            c.fillStyle = '#e8e0d0';
            c.beginPath(); c.ellipse(64,34,14,16,0,0,Math.PI*2); c.fill();
            // 눈구멍
            c.fillStyle = '#000';
            c.beginPath(); c.ellipse(56,32,5,6,0,0,Math.PI*2); c.fill();
            c.beginPath(); c.ellipse(72,32,5,6,0,0,Math.PI*2); c.fill();
            // 눈 빛
            c.fillStyle = type.includes('마법사') ? '#aa44ff' : '#ff4444';
            c.beginPath(); c.arc(56,32,2,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(72,32,2,0,Math.PI*2); c.fill();
            // 코
            c.fillStyle = '#333';
            c.beginPath(); c.moveTo(62,38); c.lineTo(64,42); c.lineTo(66,38); c.fill();
            // 이빨
            c.fillStyle = '#e8e0d0';
            for(let i=0;i<6;i++) c.fillRect(54+i*3,44,2,3);
            // 갈비뼈
            c.strokeStyle = '#e8e0d0'; c.lineWidth = 2;
            for(let i=0;i<5;i++) {
                c.beginPath();
                c.moveTo(50,54+i*7); c.quadraticCurveTo(64,50+i*7,78,54+i*7);
                c.stroke();
            }
            // 척추
            c.strokeStyle = '#d8d0c0'; c.lineWidth = 3;
            c.beginPath(); c.moveTo(64,48); c.lineTo(64,94); c.stroke();
            // 팔
            c.strokeStyle = '#e8e0d0'; c.lineWidth = 2;
            c.beginPath(); c.moveTo(50,55); c.lineTo(30,75); c.stroke();
            c.beginPath(); c.moveTo(78,55); c.lineTo(98,75); c.stroke();
            // 활 또는 지팡이
            if (type.includes('궁수')) {
                c.strokeStyle = '#8a6a3a'; c.lineWidth = 2;
                c.beginPath(); c.arc(98,60,18,-.8,.8); c.stroke();
                c.strokeStyle = '#aaa'; c.lineWidth = 1;
                c.beginPath(); c.moveTo(106,48); c.lineTo(106,72); c.stroke();
            } else {
                c.strokeStyle = '#7a4acc'; c.lineWidth = 3;
                c.beginPath(); c.moveTo(98,75); c.lineTo(100,30); c.stroke();
                c.fillStyle = '#aa66ff'; c.shadowColor = '#aa44ff'; c.shadowBlur = 8;
                c.beginPath(); c.arc(100,28,5,0,Math.PI*2); c.fill();
                c.shadowBlur = 0;
            }
            // 다리 뼈
            c.strokeStyle = '#e8e0d0'; c.lineWidth = 2;
            c.beginPath(); c.moveTo(56,94); c.lineTo(50,118); c.stroke();
            c.beginPath(); c.moveTo(72,94); c.lineTo(78,118); c.stroke();
        },
        snake() {
            // S자 곡선 몸
            c.fillStyle = col;
            c.lineWidth = 0;
            c.beginPath();
            c.moveTo(90,40);
            c.quadraticCurveTo(100,55,85,65);
            c.quadraticCurveTo(60,80,45,70);
            c.quadraticCurveTo(25,58,35,45);
            c.quadraticCurveTo(50,30,65,42);
            c.quadraticCurveTo(75,50,90,40);
            c.fill();
            // 비늘 패턴
            c.fillStyle = 'rgba(0,80,0,0.3)';
            for(let i=0;i<8;i++) {
                const bx=40+i*7+Math.sin(i)*5, by=48+Math.cos(i*1.5)*12;
                c.beginPath(); c.arc(bx,by,3,0,Math.PI*2); c.fill();
            }
            // 머리
            c.fillStyle = col;
            c.beginPath(); c.ellipse(90,38,10,8,-.3,0,Math.PI*2); c.fill();
            // 눈
            c.fillStyle = '#ffcc00';
            c.beginPath(); c.ellipse(94,34,3,2.5,0,0,Math.PI*2); c.fill();
            c.fillStyle = '#000';
            c.fillRect(93.5,33,1.5,4);
            // 독니
            c.fillStyle = '#fff';
            c.beginPath(); c.moveTo(96,40); c.lineTo(98,48); c.lineTo(94,42); c.fill();
            c.beginPath(); c.moveTo(92,42); c.lineTo(90,50); c.lineTo(88,44); c.fill();
            // 혀
            c.strokeStyle = '#ff3333'; c.lineWidth = 1.5;
            c.beginPath(); c.moveTo(98,40); c.lineTo(106,38); c.moveTo(104,38); c.lineTo(108,35); c.moveTo(104,38); c.lineTo(108,41); c.stroke();
            // 꼬리
            c.fillStyle = col;
            c.beginPath();
            c.moveTo(35,45); c.quadraticCurveTo(20,40,14,50);
            c.quadraticCurveTo(18,44,34,47);
            c.fill();
        },
        blob() {
            // 비정형 몸
            const g = c.createRadialGradient(64,65,10,64,65,40);
            g.addColorStop(0, col);
            g.addColorStop(1, 'rgba(30,60,30,0.8)');
            c.fillStyle = g;
            c.beginPath();
            c.moveTo(30,80); c.quadraticCurveTo(20,50,40,35);
            c.quadraticCurveTo(55,20,75,30);
            c.quadraticCurveTo(100,40,95,65);
            c.quadraticCurveTo(100,95,70,100);
            c.quadraticCurveTo(40,105,30,80);
            c.fill();
            // 다수의 눈
            c.fillStyle = '#ffff00';
            [[48,42,5],[72,38,6],[56,58,4],[78,60,3],[42,65,3.5]].forEach(([ex,ey,er])=>{
                c.beginPath(); c.arc(ex,ey,er,0,Math.PI*2); c.fill();
            });
            c.fillStyle = '#000';
            [[48,42,2.5],[72,38,3],[56,58,2],[78,60,1.5],[42,65,1.8]].forEach(([ex,ey,er])=>{
                c.beginPath(); c.arc(ex,ey,er,0,Math.PI*2); c.fill();
            });
            // 촉수
            c.strokeStyle = col; c.lineWidth = 4; c.lineCap = 'round';
            c.beginPath(); c.moveTo(30,85); c.quadraticCurveTo(15,95,20,110); c.stroke();
            c.beginPath(); c.moveTo(70,100); c.quadraticCurveTo(65,112,72,120); c.stroke();
            c.beginPath(); c.moveTo(92,70); c.quadraticCurveTo(105,80,100,95); c.stroke();
            // 점액 하이라이트
            c.fillStyle = 'rgba(255,255,255,0.2)';
            c.beginPath(); c.ellipse(55,45,8,5,-.3,0,Math.PI*2); c.fill();
        },
        spirit() {
            // 불꽃 형태
            const fg = c.createRadialGradient(64,60,5,64,60,40);
            fg.addColorStop(0, '#ffff88');
            fg.addColorStop(0.3, col);
            fg.addColorStop(0.7, '#ff4400');
            fg.addColorStop(1, 'rgba(255,50,0,0)');
            c.fillStyle = fg;
            c.beginPath(); c.arc(64,60,40,0,Math.PI*2); c.fill();
            // 불꽃 외곽
            c.fillStyle = col;
            c.beginPath();
            c.moveTo(40,80); c.quadraticCurveTo(30,50,50,30);
            c.quadraticCurveTo(55,15,64,20);
            c.quadraticCurveTo(73,15,78,30);
            c.quadraticCurveTo(98,50,88,80);
            c.quadraticCurveTo(76,95,64,90);
            c.quadraticCurveTo(52,95,40,80);
            c.fill();
            // 내부 밝은 부분
            c.fillStyle = '#ffdd44';
            c.beginPath(); c.ellipse(64,58,14,18,0,0,Math.PI*2); c.fill();
            // 눈
            c.fillStyle = '#fff';
            c.beginPath(); c.ellipse(56,52,4,5,0,0,Math.PI*2); c.fill();
            c.beginPath(); c.ellipse(72,52,4,5,0,0,Math.PI*2); c.fill();
            c.fillStyle = '#000';
            c.beginPath(); c.arc(56,52,2,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(72,52,2,0,Math.PI*2); c.fill();
            // 화염 파티클
            c.fillStyle = 'rgba(255,200,50,0.5)';
            [[50,25,4],[78,28,3],[44,40,3],[84,42,2.5],[64,15,3]].forEach(([px,py,pr])=>{
                c.beginPath(); c.arc(px,py,pr,0,Math.PI*2); c.fill();
            });
        },
        jellyfish() {
            // 투명 돔
            const jg = c.createRadialGradient(64,45,5,64,50,35);
            jg.addColorStop(0, 'rgba(200,240,255,0.8)');
            jg.addColorStop(0.5, col);
            jg.addColorStop(1, 'rgba(68,200,255,0.2)');
            c.fillStyle = jg;
            c.beginPath(); c.ellipse(64,45,28,24,0,0,Math.PI); c.fill();
            // 돔 하이라이트
            c.fillStyle = 'rgba(255,255,255,0.4)';
            c.beginPath(); c.ellipse(54,38,8,6,-.3,0,Math.PI*2); c.fill();
            // 빛나는 촉수
            c.strokeStyle = col; c.lineWidth = 3; c.lineCap = 'round';
            c.shadowColor = '#44ccff'; c.shadowBlur = 6;
            [[48,68,40,100],[56,68,52,105],[64,68,64,110],[72,68,76,105],[80,68,88,100]].forEach(([x1,y1,x2,y2])=>{
                c.beginPath(); c.moveTo(x1,y1); c.quadraticCurveTo(x1+(Math.random()-0.5)*12,y1+15,x2,y2); c.stroke();
            });
            c.shadowBlur = 0;
            // 짧은 촉수
            c.lineWidth = 2;
            for(let i=0;i<7;i++){
                const bx=42+i*6;
                c.beginPath(); c.moveTo(bx,68); c.lineTo(bx+(i%2?3:-3),80); c.stroke();
            }
            // 내부 발광
            c.fillStyle = 'rgba(255,255,200,0.3)';
            c.beginPath(); c.ellipse(64,48,12,10,0,0,Math.PI*2); c.fill();
            // 눈
            c.fillStyle = '#fff';
            c.beginPath(); c.arc(56,44,4,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(72,44,4,0,Math.PI*2); c.fill();
            c.fillStyle = '#000';
            c.beginPath(); c.arc(56,44,2,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(72,44,2,0,Math.PI*2); c.fill();
        },
        alien() {
            // 큰 머리
            c.fillStyle = col;
            c.beginPath(); c.ellipse(64,38,22,26,0,0,Math.PI*2); c.fill();
            // 큰 눈
            c.fillStyle = '#111';
            c.beginPath(); c.ellipse(52,36,10,12,-.2,0,Math.PI*2); c.fill();
            c.beginPath(); c.ellipse(76,36,10,12,.2,0,Math.PI*2); c.fill();
            // 눈 하이라이트
            c.fillStyle = '#44ffaa';
            c.beginPath(); c.ellipse(50,33,3,4,0,0,Math.PI*2); c.fill();
            c.beginPath(); c.ellipse(74,33,3,4,0,0,Math.PI*2); c.fill();
            // 마른 몸
            c.fillStyle = col;
            c.beginPath();
            c.moveTo(54,62); c.lineTo(50,95); c.lineTo(78,95); c.lineTo(74,62);
            c.closePath(); c.fill();
            // 목
            c.fillRect(58,56,12,10);
            // 팔 (가늘고 김)
            c.strokeStyle = col; c.lineWidth = 4; c.lineCap = 'round';
            c.beginPath(); c.moveTo(52,68); c.lineTo(32,88); c.stroke();
            c.beginPath(); c.moveTo(76,68); c.lineTo(96,88); c.stroke();
            // 손 (3개 손가락)
            c.lineWidth = 2;
            c.beginPath(); c.moveTo(32,88); c.lineTo(26,92); c.moveTo(32,88); c.lineTo(30,96); c.moveTo(32,88); c.lineTo(36,94); c.stroke();
            c.beginPath(); c.moveTo(96,88); c.lineTo(102,92); c.moveTo(96,88); c.lineTo(98,96); c.moveTo(96,88); c.lineTo(92,94); c.stroke();
            // 다리
            c.fillStyle = col;
            c.fillRect(52,93,8,18); c.fillRect(68,93,8,18);
            // 안테나
            c.strokeStyle = col; c.lineWidth = 2;
            c.beginPath(); c.moveTo(54,14); c.lineTo(50,4); c.stroke();
            c.beginPath(); c.moveTo(74,14); c.lineTo(78,4); c.stroke();
            c.fillStyle = '#44ffaa';
            c.beginPath(); c.arc(50,4,3,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(78,4,3,0,Math.PI*2); c.fill();
        },
        phantom() {
            // 반투명 왜곡 몸체
            const pg = c.createRadialGradient(64,55,5,64,60,45);
            pg.addColorStop(0, 'rgba(140,140,220,0.7)');
            pg.addColorStop(0.5, col);
            pg.addColorStop(1, 'rgba(80,60,160,0.1)');
            c.fillStyle = pg;
            c.beginPath();
            c.moveTo(40,30); c.quadraticCurveTo(30,55,35,85);
            c.quadraticCurveTo(40,105,50,110);
            c.quadraticCurveTo(58,100,64,112);
            c.quadraticCurveTo(70,100,78,110);
            c.quadraticCurveTo(88,105,93,85);
            c.quadraticCurveTo(98,55,88,30);
            c.quadraticCurveTo(76,15,64,18);
            c.quadraticCurveTo(52,15,40,30);
            c.fill();
            // 왜곡 링
            c.strokeStyle = 'rgba(140,100,255,0.3)'; c.lineWidth = 2;
            c.beginPath(); c.ellipse(64,55,30,25,0,0,Math.PI*2); c.stroke();
            c.beginPath(); c.ellipse(64,55,22,18,0.3,0,Math.PI*2); c.stroke();
            // 눈 (빛나는)
            c.fillStyle = '#fff'; c.shadowColor = '#aaaaff'; c.shadowBlur = 10;
            c.beginPath(); c.ellipse(54,42,6,4,0,0,Math.PI*2); c.fill();
            c.beginPath(); c.ellipse(74,42,6,4,0,0,Math.PI*2); c.fill();
            c.shadowBlur = 0;
            c.fillStyle = '#4444ff';
            c.beginPath(); c.arc(54,42,2.5,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(74,42,2.5,0,Math.PI*2); c.fill();
            // 입 (파동)
            c.strokeStyle = 'rgba(200,200,255,0.5)'; c.lineWidth = 1.5;
            c.beginPath(); c.moveTo(56,56); c.quadraticCurveTo(64,60,72,56); c.stroke();
        },
        angel() {
            // 몸 (빛나는 갑옷)
            c.fillStyle = col;
            c.beginPath();
            c.moveTo(48,48); c.lineTo(42,78); c.lineTo(44,100);
            c.lineTo(84,100); c.lineTo(86,78); c.lineTo(80,48);
            c.closePath(); c.fill();
            // 머리
            c.fillStyle = '#ffe8cc';
            c.beginPath(); c.ellipse(64,38,14,16,0,0,Math.PI*2); c.fill();
            // 후광
            c.strokeStyle = '#ffd700'; c.lineWidth = 2; c.shadowColor = '#ffd700'; c.shadowBlur = 8;
            c.beginPath(); c.ellipse(64,22,16,6,0,0,Math.PI*2); c.stroke();
            c.shadowBlur = 0;
            // 날개 (좌)
            c.fillStyle = type.includes('타락') ? 'rgba(60,20,80,0.6)' : 'rgba(255,255,255,0.7)';
            c.beginPath();
            c.moveTo(42,52); c.lineTo(8,28); c.lineTo(14,38);
            c.lineTo(4,42); c.lineTo(16,48);
            c.lineTo(6,55); c.lineTo(22,56);
            c.lineTo(38,60); c.closePath(); c.fill();
            // 날개 (우)
            c.beginPath();
            c.moveTo(86,52); c.lineTo(120,28); c.lineTo(114,38);
            c.lineTo(124,42); c.lineTo(112,48);
            c.lineTo(122,55); c.lineTo(106,56);
            c.lineTo(90,60); c.closePath(); c.fill();
            // 날개 뼈대
            c.strokeStyle = type.includes('타락') ? '#4a2a6a' : '#ddd'; c.lineWidth = 1;
            c.beginPath(); c.moveTo(42,52); c.lineTo(8,28); c.stroke();
            c.beginPath(); c.moveTo(42,54); c.lineTo(4,42); c.stroke();
            c.beginPath(); c.moveTo(86,52); c.lineTo(120,28); c.stroke();
            c.beginPath(); c.moveTo(86,54); c.lineTo(124,42); c.stroke();
            // 눈
            c.fillStyle = type.includes('타락') ? '#ff0044' : '#4488ff';
            c.beginPath(); c.arc(58,36,2.5,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(70,36,2.5,0,Math.PI*2); c.fill();
            // 무기 (검 또는 활)
            if (type.includes('궁수')) {
                c.strokeStyle = '#ffd700'; c.lineWidth = 2;
                c.beginPath(); c.arc(92,70,16,-.8,.8); c.stroke();
                c.strokeStyle = '#fff'; c.lineWidth = 1;
                c.beginPath(); c.moveTo(100,58); c.lineTo(100,82); c.stroke();
            } else {
                c.fillStyle = '#ffd700';
                c.fillRect(88,48,3,42);
                c.fillRect(84,46,10,5);
            }
            // 다리
            c.fillStyle = col;
            c.fillRect(50,98,10,14); c.fillRect(68,98,10,14);
            // 부츠
            c.fillStyle = type.includes('타락') ? '#2a1a3a' : '#ddd';
            c.fillRect(48,110,14,6); c.fillRect(66,110,14,6);
        },
        god() {
            // 거대 후광
            const gg = c.createRadialGradient(64,40,10,64,40,55);
            gg.addColorStop(0, 'rgba(255,215,0,0.6)');
            gg.addColorStop(0.5, 'rgba(255,180,0,0.3)');
            gg.addColorStop(1, 'rgba(255,215,0,0)');
            c.fillStyle = gg;
            c.beginPath(); c.arc(64,40,55,0,Math.PI*2); c.fill();
            // 몸 (신성한 로브)
            const bg = c.createLinearGradient(40,45,88,100);
            bg.addColorStop(0, '#ffd700');
            bg.addColorStop(1, '#ff8c00');
            c.fillStyle = bg;
            c.beginPath();
            c.moveTo(46,50); c.lineTo(36,90); c.lineTo(32,115);
            c.lineTo(96,115); c.lineTo(92,90); c.lineTo(82,50);
            c.closePath(); c.fill();
            // 머리
            c.fillStyle = '#fff8e7';
            c.beginPath(); c.ellipse(64,38,16,18,0,0,Math.PI*2); c.fill();
            // 왕관
            c.fillStyle = '#ffd700'; c.strokeStyle = '#cc8800'; c.lineWidth = 1;
            c.beginPath();
            c.moveTo(44,28); c.lineTo(46,14); c.lineTo(52,24); c.lineTo(56,8);
            c.lineTo(64,20); c.lineTo(72,8); c.lineTo(76,24);
            c.lineTo(82,14); c.lineTo(84,28); c.closePath();
            c.fill(); c.stroke();
            // 왕관 보석
            c.fillStyle = '#ff0044';
            c.beginPath(); c.arc(64,18,3,0,Math.PI*2); c.fill();
            c.fillStyle = '#00ccff';
            c.beginPath(); c.arc(52,22,2,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(76,22,2,0,Math.PI*2); c.fill();
            // 날개 (거대, 6장)
            c.fillStyle = 'rgba(255,255,255,0.5)';
            // 위 날개
            c.beginPath(); c.moveTo(44,48); c.lineTo(2,10); c.lineTo(12,30); c.lineTo(0,35); c.lineTo(18,44); c.lineTo(38,52); c.closePath(); c.fill();
            c.beginPath(); c.moveTo(84,48); c.lineTo(126,10); c.lineTo(116,30); c.lineTo(128,35); c.lineTo(110,44); c.lineTo(90,52); c.closePath(); c.fill();
            // 중간 날개
            c.fillStyle = 'rgba(255,215,0,0.4)';
            c.beginPath(); c.moveTo(42,56); c.lineTo(4,48); c.lineTo(14,55); c.lineTo(2,60); c.lineTo(20,60); c.lineTo(38,62); c.closePath(); c.fill();
            c.beginPath(); c.moveTo(86,56); c.lineTo(124,48); c.lineTo(114,55); c.lineTo(126,60); c.lineTo(108,60); c.lineTo(90,62); c.closePath(); c.fill();
            // 아래 날개
            c.fillStyle = 'rgba(255,200,100,0.3)';
            c.beginPath(); c.moveTo(40,64); c.lineTo(8,68); c.lineTo(16,72); c.lineTo(6,78); c.lineTo(24,74); c.lineTo(38,70); c.closePath(); c.fill();
            c.beginPath(); c.moveTo(88,64); c.lineTo(120,68); c.lineTo(112,72); c.lineTo(122,78); c.lineTo(104,74); c.lineTo(90,70); c.closePath(); c.fill();
            // 눈 (빛나는)
            c.fillStyle = '#fff'; c.shadowColor = '#ffd700'; c.shadowBlur = 10;
            c.beginPath(); c.arc(58,36,4,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(70,36,4,0,Math.PI*2); c.fill();
            c.shadowBlur = 0;
            c.fillStyle = '#ffd700';
            c.beginPath(); c.arc(58,36,2,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(70,36,2,0,Math.PI*2); c.fill();
            // 지팡이
            c.strokeStyle = '#ffd700'; c.lineWidth = 3;
            c.beginPath(); c.moveTo(94,50); c.lineTo(98,110); c.stroke();
            c.fillStyle = '#fff'; c.shadowColor = '#ffd700'; c.shadowBlur = 8;
            c.beginPath(); c.arc(94,46,6,0,Math.PI*2); c.fill();
            c.shadowBlur = 0;
        },
        dragon() {
            // 몸
            c.fillStyle = col;
            c.beginPath(); c.ellipse(60,70,26,20,0,0,Math.PI*2); c.fill();
            // 머리
            c.beginPath(); c.ellipse(86,48,16,14,-.3,0,Math.PI*2); c.fill();
            // 주둥이
            c.fillStyle = col;
            c.beginPath();
            c.moveTo(96,44); c.lineTo(112,40); c.lineTo(112,50); c.lineTo(96,52);
            c.closePath(); c.fill();
            // 뿔
            c.fillStyle = type.includes('본') || type.includes('스켈레톤') ? '#e8e0d0' : '#8a6a3a';
            c.beginPath(); c.moveTo(80,38); c.lineTo(74,18); c.lineTo(84,34); c.fill();
            c.beginPath(); c.moveTo(90,36); c.lineTo(88,14); c.lineTo(94,32); c.fill();
            // 눈
            c.fillStyle = type.includes('본') || type.includes('스켈레톤') ? '#ff0000' : '#ffcc00';
            c.beginPath(); c.ellipse(92,44,4,3,0,0,Math.PI*2); c.fill();
            c.fillStyle = '#000';
            c.beginPath(); c.arc(92,44,1.5,0,Math.PI*2); c.fill();
            // 콧구멍 불
            c.fillStyle = '#ff6600';
            c.beginPath(); c.arc(110,42,2,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(110,48,2,0,Math.PI*2); c.fill();
            // 날개
            c.fillStyle = 'rgba(' + parseInt(col.slice(1,3),16) + ',' + parseInt(col.slice(3,5),16) + ',' + parseInt(col.slice(5,7),16) + ',0.6)';
            c.beginPath();
            c.moveTo(52,56); c.lineTo(20,20); c.lineTo(30,30);
            c.lineTo(15,35); c.lineTo(28,42);
            c.lineTo(12,48); c.lineTo(30,52);
            c.lineTo(48,62); c.closePath();
            c.fill();
            // 날개 뼈대
            c.strokeStyle = col; c.lineWidth = 1.5;
            c.beginPath(); c.moveTo(52,56); c.lineTo(20,20); c.stroke();
            c.beginPath(); c.moveTo(48,58); c.lineTo(15,35); c.stroke();
            c.beginPath(); c.moveTo(44,60); c.lineTo(12,48); c.stroke();
            // 꼬리
            c.fillStyle = col;
            c.beginPath();
            c.moveTo(36,74); c.quadraticCurveTo(16,78,8,68);
            c.lineTo(10,72); c.quadraticCurveTo(18,78,34,76);
            c.fill();
            // 꼬리 끝 (뾰족)
            c.beginPath(); c.moveTo(8,68); c.lineTo(2,62); c.lineTo(6,70); c.fill();
            // 다리
            c.fillStyle = col;
            c.fillRect(46,86,8,16); c.fillRect(68,86,8,16);
            // 발톱
            c.fillStyle = '#222';
            [46,68].forEach(x => {
                for(let j=0;j<3;j++) { c.beginPath(); c.moveTo(x+j*3,102); c.lineTo(x+j*3+1,108); c.lineTo(x+j*3+2,102); c.fill(); }
            });
            // 본 드래곤 특수: 뼈 효과
            if (type.includes('본') || type.includes('스켈레톤')) {
                c.globalAlpha = 0.3;
                c.strokeStyle = '#e8e0d0'; c.lineWidth = 1;
                for(let i=0;i<6;i++) {
                    c.beginPath();
                    c.moveTo(40,58+i*5); c.quadraticCurveTo(60,55+i*5,80,58+i*5);
                    c.stroke();
                }
                c.globalAlpha = 1;
            }
        },
    };

    if (drawFuncs[cat]) drawFuncs[cat]();

    // 보스 왕관
    if (isBoss) {
        c.fillStyle = '#ffd700'; c.strokeStyle = '#aa8800'; c.lineWidth = 1;
        c.beginPath();
        c.moveTo(44,16); c.lineTo(46,6); c.lineTo(52,14); c.lineTo(56,2);
        c.lineTo(64,12); c.lineTo(72,2); c.lineTo(76,14);
        c.lineTo(82,6); c.lineTo(84,16); c.closePath();
        c.fill(); c.stroke();
        // 보석
        c.fillStyle = '#ff0044';
        c.beginPath(); c.arc(64,12,3,0,Math.PI*2); c.fill();
        c.fillStyle = '#00ccff';
        c.beginPath(); c.arc(52,13,2,0,Math.PI*2); c.fill();
        c.beginPath(); c.arc(76,13,2,0,Math.PI*2); c.fill();
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = THREE.NearestFilter;
    spriteTexCache[type] = tex;
    return tex;
}

// ── 게임 상태 ──
let gameState = 'start', paused = false, currentStage = 1;

// ── 플레이어 ──
let player = {
    x:300, z:1500, speed:3,
    baseHp:100, hp:100, maxHp:100, baseAtk:5, atk:5, baseDef:1, def:1,
    level:1, xp:0, xpNext:100, coins:0, statPoints:0, civLevel:0,
    meleeWeapon:null, rangedWeapon:null, armor:null,
    weaponMode:'melee', // 'melee' or 'ranged'
    inventory:[], bestiary:{}, facing:1, facingX:1, facingZ:0,
    attacking:false, attackTimer:0, lastAttack:0, invincible:0, mesh:null,
    skills:{}, skillAtk:0, skillDef:0, skillHp:0,
    critChance:0, critDmg:1.5, lifesteal:0, atkSpeedBonus:0,
    thorns:0, hpRegen:0, dmgReduce:0, dropBonus:0, coinBonusSk:0,
    magnetRange:1, xpBonus:0,
};

// ── 마을 ──
let village = { buildings:[], maxPopulation:2, allyAtkBonus:0, allyDefBonus:0, allySpdBonus:0, regenRate:0, coinBonus:0, meshes:[] };

// ── 엔티티 ──
let allies=[], animals=[], projectiles=[], floatingTexts=[], particles3D=[], itemDrops=[];
let lastSpawn=0, bossesSpawned={}, finalBossSpawned=false, regenTimer=0;
let animalMeshes=[], playerGroup=null, attackEffect=null, groundGroup=null, decoGroup=null;
let stagePortal = null; // 스테이지 전환 포탈

// ═══════════════════════════════════════════
// 멀티플레이어
// ═══════════════════════════════════════════
let mpSocket = null, mpId = null, mpConnected = false;
const mpPlayers = new Map(); // id -> { data, mesh, nameSprite, hpSprite }
let mpSendTimer = 0;
const MP_SEND_INTERVAL = 50; // ms
const chatMessages = [];
const MAX_CHAT_MESSAGES = 50;

function mpConnect() {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${location.host}`;
    try { mpSocket = new WebSocket(url); } catch(e) { console.log('MP: 연결 실패'); return; }

    mpSocket.onopen = () => {
        mpConnected = true;
        updateMpStatus();
    };

    mpSocket.onmessage = (evt) => {
        let msg;
        try { msg = JSON.parse(evt.data); } catch { return; }
        switch(msg.type) {
            case 'init':
                mpId = msg.id;
                player.mpName = `플레이어${mpId}`;
                updateMpStatus();
                // 기존 접속 플레이어 추가
                for(const p of msg.players) mpAddPlayer(p.id, p);
                break;
            case 'join':
                mpAddPlayer(msg.id, msg);
                break;
            case 'leave':
                mpRemovePlayer(msg.id);
                break;
            case 'move':
                mpUpdatePlayer(msg.id, msg);
                break;
            case 'chat':
                addChatMessage(msg.sender, msg.text, msg.color);
                break;
            case 'attack':
                mpShowAttack(msg.id, msg.x, msg.z, msg.mode);
                break;
            case 'rename':
                mpRenamePlayer(msg.id, msg.name);
                break;
        }
    };

    mpSocket.onclose = () => {
        mpConnected = false;
        mpId = null;
        // 모든 원격 플레이어 메쉬 제거
        for(const [id] of mpPlayers) mpRemovePlayer(id);
        mpPlayers.clear();
        updateMpStatus();
        // 3초 후 재연결
        setTimeout(mpConnect, 3000);
    };

    mpSocket.onerror = () => {};
}

function mpSend(msg) {
    if(mpSocket && mpSocket.readyState === WebSocket.OPEN) {
        mpSocket.send(JSON.stringify(msg));
    }
}

function mpSendPosition() {
    mpSend({
        type: 'move',
        x: player.x, z: player.z,
        level: player.level, civLevel: player.civLevel,
        hp: player.hp, maxHp: player.maxHp,
        facingX: player.facingX, facingZ: player.facingZ,
        weaponMode: player.weaponMode,
        attacking: player.attacking,
        name: player.mpName || `플레이어${mpId}`,
    });
}

function mpSendChat(text) {
    mpSend({ type: 'chat', text });
}

function mpSendAttack(x, z, mode) {
    mpSend({ type: 'attack', x, z, mode });
}

function mpAddPlayer(id, data) {
    if(mpPlayers.has(id)) { mpUpdatePlayer(id, data); return; }
    if(!scene) return;
    // 원격 플레이어 3D 메쉬 생성
    const g = new THREE.Group();
    const PS = 3;
    // 간단한 원격 플레이어 모델 (색 구분)
    const colors = [0x4488cc, 0xcc4444, 0x44cc44, 0xcccc44, 0xcc44cc, 0x44cccc, 0xff8844, 0x8844ff];
    const col = colors[id % colors.length];
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9,1.4,0.55), new THREE.MeshLambertMaterial({color:col}));
    body.position.y=1.3; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4,8,8), new THREE.MeshLambertMaterial({color:0xd4a574}));
    head.position.y=2.3; g.add(head);
    // 눈
    const eGeo=new THREE.SphereGeometry(0.07,6,6), eMat=new THREE.MeshBasicMaterial({color:0x000000});
    g.add(new THREE.Mesh(eGeo,eMat).translateX(-0.14).translateY(2.3).translateZ(0.4));
    g.add(new THREE.Mesh(eGeo,eMat).translateX(0.14).translateY(2.3).translateZ(0.4));
    // 무기
    const wp=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,1.2,6),new THREE.MeshLambertMaterial({color:0x8a7a5a}));
    wp.position.set(0.65,1.3,0);wp.rotation.z=-0.3;g.add(wp);
    // 이름표
    const nCv=document.createElement('canvas');nCv.width=200;nCv.height=32;
    const nC=nCv.getContext('2d');nC.font='bold 14px sans-serif';nC.textAlign='center';
    nC.fillStyle='#44ccff';nC.fillText(data.name||`플레이어${id}`,100,22);
    const nTex=new THREE.CanvasTexture(nCv);
    const nSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:nTex,transparent:true}));
    nSpr.position.y=3.2;nSpr.scale.set(4,0.8,1);g.add(nSpr);
    // HP바
    const hpCv=document.createElement('canvas');hpCv.width=64;hpCv.height=12;
    const hpTex=new THREE.CanvasTexture(hpCv);
    const hpSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:hpTex}));
    hpSpr.position.y=2.8;hpSpr.scale.set(3,0.5,1);g.add(hpSpr);

    g.scale.setScalar(PS);
    g.position.set((data.x||600)*S, 0, (data.z||3000)*S);
    scene.add(g);

    mpPlayers.set(id, {
        data: { ...data },
        mesh: g, nameSprite: nSpr, hpSprite: hpSpr,
        nameCv: nCv, nameCtx: nC, nameTex: nTex,
        hpCv, hpTex,
    });
}

function mpRemovePlayer(id) {
    const p = mpPlayers.get(id);
    if(p && p.mesh && scene) scene.remove(p.mesh);
    mpPlayers.delete(id);
}

function mpUpdatePlayer(id, data) {
    const p = mpPlayers.get(id);
    if(!p) { mpAddPlayer(id, data); return; }
    Object.assign(p.data, data);
    if(p.mesh) {
        // 부드러운 위치 보간
        const tx = data.x * S, tz = data.z * S;
        p.mesh.position.x += (tx - p.mesh.position.x) * 0.3;
        p.mesh.position.z += (tz - p.mesh.position.z) * 0.3;
        // 방향
        if(data.facingX !== undefined && data.facingZ !== undefined) {
            p.mesh.rotation.y = Math.atan2(data.facingX, data.facingZ);
        }
    }
    // HP바 업데이트
    if(p.hpCv && data.hp !== undefined) {
        const c = p.hpCv.getContext('2d');
        c.clearRect(0,0,64,12); c.fillStyle='#333'; c.fillRect(0,0,64,12);
        c.fillStyle = data.hp > data.maxHp*0.3 ? '#2ecc71' : '#e74c3c';
        c.fillRect(0,0,64*(data.hp/data.maxHp),12);
        p.hpTex.needsUpdate = true;
    }
}

function mpRenamePlayer(id, name) {
    const p = mpPlayers.get(id);
    if(!p) return;
    p.data.name = name;
    // 이름표 다시 그리기
    const c = p.nameCtx;
    c.clearRect(0,0,200,32);
    c.font='bold 14px sans-serif';c.textAlign='center';
    c.fillStyle='#44ccff';c.fillText(name,100,22);
    p.nameTex.needsUpdate = true;
}

function mpShowAttack(id, x, z, mode) {
    if(!scene) return;
    const col = mode === 'ranged' ? 0x00ffaa : 0xf4a460;
    const eff = new THREE.Mesh(
        new THREE.RingGeometry(1,3,12),
        new THREE.MeshBasicMaterial({color:col, side:THREE.DoubleSide, transparent:true, opacity:0.4})
    );
    eff.position.set(x*S, 1.5, z*S); eff.rotation.x=-Math.PI/2;
    scene.add(eff);
    setTimeout(()=>scene.remove(eff), 200);
}

function mpUpdateLoop(dt) {
    if(!mpConnected) return;
    mpSendTimer += dt;
    if(mpSendTimer >= MP_SEND_INTERVAL) {
        mpSendTimer = 0;
        mpSendPosition();
    }
    // 원격 플레이어 위치 보간 업데이트
    for(const [, p] of mpPlayers) {
        if(p.mesh && p.data) {
            const tx = p.data.x * S, tz = p.data.z * S;
            p.mesh.position.x += (tx - p.mesh.position.x) * 0.15;
            p.mesh.position.z += (tz - p.mesh.position.z) * 0.15;
        }
    }
}

// ── 채팅 ──
function addChatMessage(sender, text, color) {
    chatMessages.push({ sender, text, color: color||'#e0d6c2', time: Date.now() });
    if(chatMessages.length > MAX_CHAT_MESSAGES) chatMessages.shift();
    renderChatMessages();
}

function renderChatMessages() {
    const box = document.getElementById('chat-messages');
    if(!box) return;
    box.innerHTML = '';
    // 최근 20개만 표시
    const recent = chatMessages.slice(-20);
    for(const m of recent) {
        const div = document.createElement('div');
        div.className = 'chat-msg';
        div.innerHTML = `<span class="chat-sender" style="color:${m.color}">${m.sender}</span> ${escapeHtml(m.text)}`;
        box.appendChild(div);
    }
    box.scrollTop = box.scrollHeight;
}

function escapeHtml(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function sendChatFromInput() {
    const input = document.getElementById('chat-input');
    if(!input) return;
    const text = input.value.trim();
    if(!text) return;
    // 이름 변경 명령어
    if(text.startsWith('/name ')) {
        const name = text.slice(6).trim().slice(0,12);
        if(name) {
            player.mpName = name;
            mpSend({ type: 'name', name });
            addChatMessage('시스템', `이름 변경: ${name}`, '#aaaaaa');
        }
        input.value = '';
        return;
    }
    mpSendChat(text);
    input.value = '';
}

function updateMpStatus() {
    const el = document.getElementById('mp-status');
    if(!el) return;
    if(mpConnected) {
        el.textContent = `🟢 접속 (${mpPlayers.size + 1}명)`;
        el.style.color = '#44ff44';
    } else {
        el.textContent = '🔴 연결 중...';
        el.style.color = '#ff4444';
    }
}

// ── 입력 ──
const keys = {};
function isChatFocused() {
    const ci = document.getElementById('chat-input');
    return ci && document.activeElement === ci;
}
document.addEventListener('keydown', e => {
    // 채팅 입력 중이면 Enter로 전송, Escape로 포커스 해제만 처리
    if (isChatFocused()) {
        if (e.code === 'Enter') { sendChatFromInput(); e.preventDefault(); }
        if (e.code === 'Escape') { document.getElementById('chat-input').blur(); }
        return;
    }
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
    if (gameState === 'playing' && !paused) {
        if (e.code === 'KeyI') toggleInventory();
        if (e.code === 'KeyB') toggleShop();
        if (e.code === 'KeyC') toggleCiv();
        if (e.code === 'KeyV') toggleVillage();
        if (e.code === 'KeyG') toggleBestiary();
        if (e.code === 'KeyT') toggleSkillTree();
        if (e.code === 'Tab') { e.preventDefault(); toggleWeaponMode(); }
        if (e.code === 'Enter') { document.getElementById('chat-input').focus(); e.preventDefault(); }
    }
    if (gameState === 'levelup' && e.code === 'KeyT') { closeLevelUp(); toggleSkillTree(); }
});
document.addEventListener('keyup', e => { if(!isChatFocused()) keys[e.code] = false; });

function toggleWeaponMode() {
    player.weaponMode = player.weaponMode === 'melee' ? 'ranged' : 'melee';
    addFloatingText(player.x, player.z, player.weaponMode === 'melee' ? '⚔️ 근접' : '🏹 원거리', '#ffaa00', 40);
    sfx.weaponSwitch();
}

// ═══════════════════════════════════════════
// THREE.JS
// ═══════════════════════════════════════════
function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 150, 600);
    renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    updateRendererSize();
    container.appendChild(renderer.domElement);
    cameraObj = new THREE.PerspectiveCamera(50, container.clientWidth/container.clientHeight, 0.1, 1200);
    const amb = new THREE.AmbientLight(0xffffff, 0.5); scene.add(amb);
    const dir = new THREE.DirectionalLight(0xfff5e0, 0.8);
    dir.position.set(50,80,30); dir.castShadow = true;
    dir.shadow.mapSize.set(2048,2048);
    dir.shadow.camera.near=1; dir.shadow.camera.far=500;
    dir.shadow.camera.left=-150; dir.shadow.camera.right=150;
    dir.shadow.camera.top=150; dir.shadow.camera.bottom=-150;
    scene.add(dir);
    buildWorld();
    buildPlayer();
    buildVillageMeshes();
    window.addEventListener('resize', () => { updateRendererSize(); });
    document.addEventListener('fullscreenchange', () => { requestAnimationFrame(updateRendererSize); });
}

function updateRendererSize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || (window.innerHeight - 86);
    renderer.setSize(w, h);
    if(cameraObj) { cameraObj.aspect = w / h; cameraObj.updateProjectionMatrix(); }
}

function buildWorld() {
    if (groundGroup) scene.remove(groundGroup);
    if (decoGroup) scene.remove(decoGroup);
    groundGroup = new THREE.Group();
    decoGroup = new THREE.Group();
    for (let r of REGIONS) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(r.w*S, WORLD_H*S), new THREE.MeshLambertMaterial({ color:r.color }));
        m.rotation.x=-Math.PI/2; m.position.set((r.x+r.w/2)*S, 0, WORLD_H/2*S); m.receiveShadow=true;
        groundGroup.add(m);
    }
    scene.add(groundGroup);
    // 장식
    REGIONS.forEach((r,i) => {
        const count = 15 + i*5;
        for (let j=0; j<count; j++) {
            const rx = r.x + ((j*157+50)%r.w), rz = (j*211+100)%WORLD_H;
            let obj;
            if (r.name.includes('숲') || r.name.includes('초원') || r.name.includes('독늪')) {
                obj = mkTree();
            } else {
                const geo = new THREE.DodecahedronGeometry(0.5+Math.random()*0.5, 0);
                const col = r.color;
                obj = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color:col }));
                obj.position.y = 0.3; obj.rotation.set(Math.random(),Math.random(),Math.random()); obj.scale.y=0.6;
            }
            obj.position.x = rx*S; obj.position.z = rz*S;
            decoGroup.add(obj);
        }
    });
    scene.add(decoGroup);
}

function mkTree() {
    const g = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.2,2,6), new THREE.MeshLambertMaterial({color:0x5a3a1a}));
    t.position.y=1; g.add(t);
    const l = new THREE.Mesh(new THREE.SphereGeometry(1.2,6,5), new THREE.MeshLambertMaterial({color:0x2a7a1a}));
    l.position.y=2.5; l.scale.y=0.7; g.add(l);
    return g;
}

// ── 플레이어 3D (문명별 외형) ──
function buildPlayer() {
    if (playerGroup) scene.remove(playerGroup);
    playerGroup = new THREE.Group();
    const civ = CIVILIZATIONS[player.civLevel];
    const PS = 3; // 플레이어 스케일 (3배)

    // ── 몸통 (갑옷 형태) ──
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9,1.4,0.55), new THREE.MeshLambertMaterial({color:civ.armorColor}));
    torso.position.y=1.3; torso.castShadow=true; torso.name='body'; playerGroup.add(torso);
    // 어깨 장갑 (좌우)
    const shoulderMat = new THREE.MeshLambertMaterial({color:civ.armorColor});
    const shL = new THREE.Mesh(new THREE.SphereGeometry(0.25,8,8), shoulderMat); shL.position.set(-0.6,1.8,0); playerGroup.add(shL);
    const shR = new THREE.Mesh(new THREE.SphereGeometry(0.25,8,8), shoulderMat); shR.position.set(0.6,1.8,0); playerGroup.add(shR);
    // 벨트
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.95,0.12,0.58), new THREE.MeshLambertMaterial({color:0x5a4030}));
    belt.position.y=0.65; playerGroup.add(belt);
    // 벨트 버클
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.1,0.05), new THREE.MeshBasicMaterial({color:0xffd700}));
    buckle.position.set(0,0.65,0.3); playerGroup.add(buckle);

    // ── 팔 ──
    const armMat = new THREE.MeshLambertMaterial({color:civ.armorColor});
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.08,0.8,6), armMat);
    armL.position.set(-0.65,1.2,0); armL.rotation.z=0.15; playerGroup.add(armL);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.08,0.8,6), armMat);
    armR.position.set(0.65,1.2,0); armR.rotation.z=-0.15; playerGroup.add(armR);
    // 손 (구)
    const handMat = new THREE.MeshLambertMaterial({color:civ.bodyColor});
    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.1,6,6), handMat); handL.position.set(-0.7,0.75,0); playerGroup.add(handL);
    const handR = new THREE.Mesh(new THREE.SphereGeometry(0.1,6,6), handMat); handR.position.set(0.7,0.75,0); playerGroup.add(handR);

    // ── 다리 ──
    const legMat = new THREE.MeshLambertMaterial({color:civ.armorColor});
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.1,0.7,6), legMat); legL.position.set(-0.2,0.3,0); playerGroup.add(legL);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.1,0.7,6), legMat); legR.position.set(0.2,0.3,0); playerGroup.add(legR);
    // 부츠
    const bootMat = new THREE.MeshLambertMaterial({color:0x3a2a1a});
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.12,0.25), bootMat); bootL.position.set(-0.2,0.02,0.03); playerGroup.add(bootL);
    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.12,0.25), bootMat); bootR.position.set(0.2,0.02,0.03); playerGroup.add(bootR);

    // ── 머리 ──
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4,10,10), new THREE.MeshLambertMaterial({color:civ.bodyColor}));
    head.position.y=2.3; head.castShadow=true; playerGroup.add(head);

    // 문명별 헬멧/머리
    if (player.civLevel >= 4) {
        // 현대 이상: 풀 바이저 헬멧
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.44,10,10), new THREE.MeshLambertMaterial({color:civ.armorColor}));
        helmet.position.y=2.35; playerGroup.add(helmet);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.15,0.1), new THREE.MeshBasicMaterial({color:0x44aaff, transparent:true, opacity:0.6}));
        visor.position.set(0,2.3,0.38); playerGroup.add(visor);
    } else if (player.civLevel >= 2) {
        // 중세/근대: 전투 헬멧
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.44,10,5,0,Math.PI*2,0,Math.PI/2), new THREE.MeshLambertMaterial({color:civ.armorColor}));
        helmet.position.y=2.4; playerGroup.add(helmet);
        // 헬멧 장식 볏
        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.04,0.25,0.4), new THREE.MeshLambertMaterial({color:0xcc2222}));
        crest.position.set(0,2.7,0); playerGroup.add(crest);
    } else {
        // 구석기/신석기: 머리카락
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.44,10,5,0,Math.PI*2,0,Math.PI/2), new THREE.MeshLambertMaterial({color:0x3a2010}));
        hair.position.y=2.4; playerGroup.add(hair);
    }

    // ── 눈 ──
    const eGeo = new THREE.SphereGeometry(0.07,6,6);
    const eWhiteL = new THREE.Mesh(new THREE.SphereGeometry(0.09,6,6), new THREE.MeshBasicMaterial({color:0xffffff}));
    eWhiteL.position.set(-0.14,2.3,0.35); playerGroup.add(eWhiteL);
    const eWhiteR = new THREE.Mesh(new THREE.SphereGeometry(0.09,6,6), new THREE.MeshBasicMaterial({color:0xffffff}));
    eWhiteR.position.set(0.14,2.3,0.35); playerGroup.add(eWhiteR);
    // 동공 (문명별 색상)
    const pupilColor = player.civLevel>=7?0xffd700:player.civLevel>=5?0x44ffaa:0x2244aa;
    const ePupilMat = new THREE.MeshBasicMaterial({color:pupilColor});
    const eL = new THREE.Mesh(eGeo,ePupilMat); eL.position.set(-0.14,2.3,0.4); playerGroup.add(eL);
    const eR = new THREE.Mesh(eGeo,ePupilMat); eR.position.set(0.14,2.3,0.4); playerGroup.add(eR);

    // ── 망토 (문명 레벨 1 이상) ──
    if (player.civLevel >= 1) {
        const capeColor = player.civLevel>=7?0xffd700:player.civLevel>=5?0x6a2aaa:civ.armorColor;
        const capeMat = new THREE.MeshLambertMaterial({color:capeColor, side:THREE.DoubleSide});
        const capeGeo = new THREE.BufferGeometry();
        const cv = new Float32Array([
            -0.35,2.0,-0.3, 0.35,2.0,-0.3, -0.45,0.3,-0.6,
            0.35,2.0,-0.3, 0.45,0.3,-0.6, -0.45,0.3,-0.6
        ]);
        capeGeo.setAttribute('position', new THREE.BufferAttribute(cv,3));
        capeGeo.computeVertexNormals();
        const cape = new THREE.Mesh(capeGeo, capeMat);
        cape.name = 'cape';
        playerGroup.add(cape);
    }

    // ── 무기 (문명별 업그레이드) ──
    if (player.civLevel >= 5) {
        // 미래 이상: 빛나는 에너지 블레이드
        const bladeColor = player.civLevel>=7?0xffd700:player.civLevel>=6?0x00ffaa:0x6a2aaa;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08,1.6,0.04),
            new THREE.MeshBasicMaterial({color:bladeColor, transparent:true, opacity:0.85}));
        blade.position.set(0.75,1.5,0.1); blade.rotation.z=-0.25; playerGroup.add(blade);
        // 블레이드 글로우
        const bladeGlow = new THREE.Mesh(new THREE.BoxGeometry(0.15,1.65,0.08),
            new THREE.MeshBasicMaterial({color:bladeColor, transparent:true, opacity:0.2}));
        bladeGlow.position.set(0.75,1.5,0.1); bladeGlow.rotation.z=-0.25; playerGroup.add(bladeGlow);
        // 손잡이
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.25,6), new THREE.MeshLambertMaterial({color:0x444444}));
        hilt.position.set(0.68,0.75,0.1); playerGroup.add(hilt);
    } else if (player.civLevel >= 2) {
        // 중세/근대: 큰 검
        const sword = new THREE.Mesh(new THREE.BoxGeometry(0.06,1.4,0.04), new THREE.MeshLambertMaterial({color:0xcccccc}));
        sword.position.set(0.7,1.4,0.1); sword.rotation.z=-0.25; playerGroup.add(sword);
        // 검 가드
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.25,0.06,0.08), new THREE.MeshLambertMaterial({color:0xaa8833}));
        guard.position.set(0.65,0.75,0.1); playerGroup.add(guard);
        // 손잡이
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.05,0.22,6), new THREE.MeshLambertMaterial({color:0x5a3a1a}));
        hilt.position.set(0.62,0.62,0.1); playerGroup.add(hilt);
    } else {
        // 원시: 나무 몽둥이
        const club = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.1,1.2,6), new THREE.MeshLambertMaterial({color:0x8a7a5a}));
        club.position.set(0.65,1.3,0); club.rotation.z=-0.3; playerGroup.add(club);
    }

    // ── 방패 (문명 레벨 2 이상) ──
    if (player.civLevel >= 2 && player.civLevel < 5) {
        const shieldMat = new THREE.MeshLambertMaterial({color:civ.armorColor});
        const shield = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.55,0.4), shieldMat);
        shield.position.set(-0.55,1.1,0.2); playerGroup.add(shield);
        // 방패 장식
        const emblem = new THREE.Mesh(new THREE.SphereGeometry(0.08,6,6), new THREE.MeshBasicMaterial({color:0xffd700}));
        emblem.position.set(-0.58,1.1,0.2); playerGroup.add(emblem);
    }

    // ── 특수 효과 (문명별) ──
    // 미래: 보라 에너지 아우라
    if (player.civLevel === 5) {
        const glow = new THREE.Mesh(new THREE.SphereGeometry(1.4,10,10), new THREE.MeshBasicMaterial({color:0x6a2aaa, transparent:true, opacity:0.12}));
        glow.position.y=1.5; playerGroup.add(glow);
        // 어깨 에너지 파편
        const sparkMat = new THREE.MeshBasicMaterial({color:0xaa44ff, transparent:true, opacity:0.6});
        for(let i=0;i<4;i++){
            const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.06,0), sparkMat);
            sp.position.set(Math.cos(i*1.57)*0.7, 2.0+Math.sin(i*1.2)*0.2, Math.sin(i*1.57)*0.3);
            playerGroup.add(sp);
        }
    }
    // 외계인: 녹색 에너지 + 홀로그램 링
    if (player.civLevel === 6) {
        const glow = new THREE.Mesh(new THREE.SphereGeometry(1.5,10,10), new THREE.MeshBasicMaterial({color:0x00ddaa, transparent:true, opacity:0.15}));
        glow.position.y=1.5; playerGroup.add(glow);
        // 홀로그램 링
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8,0.03,8,24), new THREE.MeshBasicMaterial({color:0x00ffcc, transparent:true, opacity:0.4}));
        ring.position.y=1.0; ring.rotation.x=Math.PI/2; playerGroup.add(ring);
        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.6,0.02,8,24), new THREE.MeshBasicMaterial({color:0x00ffcc, transparent:true, opacity:0.25}));
        ring2.position.y=2.0; ring2.rotation.x=Math.PI/2; playerGroup.add(ring2);
    }
    // 신: 금색 글로우 + 거대 날개 + 후광
    if (player.civLevel >= 7) {
        const glow = new THREE.Mesh(new THREE.SphereGeometry(1.8,12,12), new THREE.MeshBasicMaterial({color:0xffd700, transparent:true, opacity:0.15}));
        glow.position.y=1.5; playerGroup.add(glow);
        // 후광
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55,0.04,8,24), new THREE.MeshBasicMaterial({color:0xffd700, transparent:true, opacity:0.7}));
        halo.position.y=2.9; halo.rotation.x=Math.PI/2; playerGroup.add(halo);
        // 거대 날개 (3단)
        const wingMat = new THREE.MeshBasicMaterial({color:0xffd700, transparent:true, opacity:0.4, side:THREE.DoubleSide});
        for(let i=0;i<3;i++){
            const y = 1.2+i*0.4, sp = 1.5+i*0.3;
            const wGeo = new THREE.BufferGeometry();
            const wv = new Float32Array([
                0,y,-0.2, -sp,y+0.5,-0.5, -sp*0.5,y-0.4,-0.35,
                0,y,-0.2,  sp,y+0.5,-0.5,  sp*0.5,y-0.4,-0.35
            ]);
            wGeo.setAttribute('position', new THREE.BufferAttribute(wv,3));
            wGeo.computeVertexNormals();
            playerGroup.add(new THREE.Mesh(wGeo, wingMat));
        }
        // 금색 파티클
        const sparkMat = new THREE.MeshBasicMaterial({color:0xffd700, transparent:true, opacity:0.7});
        for(let i=0;i<6;i++){
            const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.05,0), sparkMat);
            sp.position.set(Math.cos(i)*0.9, 1.0+Math.sin(i*1.5)*1.2, Math.sin(i)*0.5);
            playerGroup.add(sp);
        }
    }

    // ── 바닥 그림자 ──
    const shadowGeo = new THREE.CircleGeometry(0.6,12);
    const shadowMat = new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.3, depthWrite:false});
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x=-Math.PI/2; shadow.position.y=0.01; playerGroup.add(shadow);

    // 3배 스케일 적용
    playerGroup.scale.setScalar(PS);
    playerGroup.position.set(player.x*S, 0, player.z*S);
    scene.add(playerGroup);
    player.mesh = playerGroup;
}

function buildVillageMeshes() {
    const vx=1000*S, vz=WORLD_H/2*S;
    const base = new THREE.Mesh(new THREE.CircleGeometry(8,16), new THREE.MeshLambertMaterial({color:0x8b7355}));
    base.rotation.x=-Math.PI/2; base.position.set(vx,0.01,vz); scene.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,4,6), new THREE.MeshLambertMaterial({color:0x5a3a1a}));
    pole.position.set(vx,2,vz); scene.add(pole);
}

function updateVillage3D() {
    village.meshes.forEach(m=>scene.remove(m)); village.meshes=[];
    const vx=1000, vz=WORLD_H/2;
    village.buildings.forEach((bName,i) => {
        const ang=(Math.PI*2/Math.max(village.buildings.length,1))*i, d=5+(i>5?3:0);
        const g=new THREE.Group();
        const wall=new THREE.Mesh(new THREE.BoxGeometry(1.5,1,1.5), new THREE.MeshLambertMaterial({color:0xa08060})); wall.position.set(0,0.5,0); g.add(wall);
        const roof=new THREE.Mesh(new THREE.ConeGeometry(1.2,0.8,4), new THREE.MeshLambertMaterial({color:0x8b4513}));
        roof.position.y=1.4; roof.rotation.y=Math.PI/4; g.add(roof);
        g.position.set(vx*S+Math.cos(ang)*d, 0, vz*S+Math.sin(ang)*d);
        scene.add(g); village.meshes.push(g);
    });
}

// ── 동물 3D ──
function buildAnimal3D(type, data, cat) {
    const s = data.size;
    const col = data.color;
    const g = new THREE.Group();
    g.name = 'bodyGroup';
    const lamb = (c) => new THREE.MeshLambertMaterial({color:c});
    const basic = (c, opts) => new THREE.MeshBasicMaterial(Object.assign({color:c}, opts||{}));

    switch(cat) {
    case 'rabbit': {
        // 타원체 몸
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.45,8,8), lamb(col));
        body.scale.set(1,0.85,0.8); body.position.y=0.5; g.add(body);
        // 머리
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.32,8,8), lamb(col));
        head.position.set(0,1.1,0.15); g.add(head);
        // 귀 (길쭉한 실린더)
        const earMat = lamb(col);
        const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.05,0.5,6), earMat);
        earL.position.set(-0.12,1.55,0.05); earL.rotation.z=0.15; g.add(earL);
        const earR = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.05,0.5,6), earMat);
        earR.position.set(0.12,1.55,0.05); earR.rotation.z=-0.15; g.add(earR);
        // 귀 안쪽 (핑크)
        const earInL = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.025,0.45,6), lamb(0xffaaaa));
        earInL.position.set(-0.12,1.55,0.08); earInL.rotation.z=0.15; g.add(earInL);
        const earInR = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.025,0.45,6), lamb(0xffaaaa));
        earInR.position.set(0.12,1.55,0.08); earInR.rotation.z=-0.15; g.add(earInR);
        // 눈
        const eMat = basic(0x000000);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eL.position.set(-0.12,1.15,0.38); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eR.position.set(0.12,1.15,0.38); g.add(eR);
        // 코 (핑크)
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), lamb(0xff8888));
        nose.position.set(0,1.05,0.42); g.add(nose);
        // 솜꼬리
        const tail = new THREE.Mesh(new THREE.SphereGeometry(0.12,6,6), lamb(0xffffff));
        tail.position.set(0,0.5,-0.45); g.add(tail);
        // 발
        const footMat = lamb(col);
        const fL = new THREE.Mesh(new THREE.SphereGeometry(0.1,6,6), footMat); fL.position.set(-0.2,0.1,0.1); g.add(fL);
        const fR = new THREE.Mesh(new THREE.SphereGeometry(0.1,6,6), footMat); fR.position.set(0.2,0.1,0.1); g.add(fR);
        break;
    }
    case 'deer': {
        // 날씬한 몸
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.6,1.0), lamb(col));
        body.position.y=1.0; g.add(body);
        // 머리
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25,8,8), lamb(col));
        head.position.set(0,1.6,0.35); g.add(head);
        // 뿔 (실린더)
        const antlerMat = lamb(0x8B7355);
        const aL1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.02,0.6,4), antlerMat);
        aL1.position.set(-0.15,2.0,0.3); aL1.rotation.z=0.3; g.add(aL1);
        const aL2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.015,0.25,4), antlerMat);
        aL2.position.set(-0.35,2.2,0.3); aL2.rotation.z=0.8; g.add(aL2);
        const aR1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.02,0.6,4), antlerMat);
        aR1.position.set(0.15,2.0,0.3); aR1.rotation.z=-0.3; g.add(aR1);
        const aR2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.015,0.25,4), antlerMat);
        aR2.position.set(0.35,2.2,0.3); aR2.rotation.z=-0.8; g.add(aR2);
        // 눈
        const eMat = basic(0x000000);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.035,6,6), eMat); eL.position.set(-0.1,1.65,0.52); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.035,6,6), eMat); eR.position.set(0.1,1.65,0.52); g.add(eR);
        // 긴 다리 4개
        const legMat = lamb(col);
        [[-0.15,0.4,0.3],[0.15,0.4,0.3],[-0.15,0.4,-0.3],[0.15,0.4,-0.3]].forEach(p => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.04,0.8,6), legMat);
            leg.position.set(p[0],p[1],p[2]); g.add(leg);
        });
        break;
    }
    case 'boar': {
        // 통통한 몸
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.5,8,8), lamb(col));
        body.scale.set(1,0.85,1.1); body.position.y=0.6; g.add(body);
        // 머리
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.3,8,8), lamb(col));
        head.position.set(0,0.9,0.4); g.add(head);
        // 주둥이
        const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.14,0.15,8), lamb(0xc49070));
        snout.position.set(0,0.8,0.65); snout.rotation.x=Math.PI/2; g.add(snout);
        // 엄니 (콘)
        const tuskMat = lamb(0xfffff0);
        const tL = new THREE.Mesh(new THREE.ConeGeometry(0.04,0.2,4), tuskMat);
        tL.position.set(-0.15,0.75,0.6); tL.rotation.z=0.3; g.add(tL);
        const tR = new THREE.Mesh(new THREE.ConeGeometry(0.04,0.2,4), tuskMat);
        tR.position.set(0.15,0.75,0.6); tR.rotation.z=-0.3; g.add(tR);
        // 눈
        const eMat = basic(0x000000);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eL.position.set(-0.12,1.0,0.55); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eR.position.set(0.12,1.0,0.55); g.add(eR);
        // 등털 (작은 콘들)
        for(let i=0;i<5;i++){
            const bristle=new THREE.Mesh(new THREE.ConeGeometry(0.02,0.12,3),lamb(0x2a1a0a));
            bristle.position.set((i-2)*0.1,1.1,-0.1+i*0.05); g.add(bristle);
        }
        // 짧은 다리
        const legMat = lamb(col);
        [[-0.2,0.2,0.25],[0.2,0.2,0.25],[-0.2,0.2,-0.25],[0.2,0.2,-0.25]].forEach(p => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.06,0.4,6), legMat);
            leg.position.set(p[0],p[1],p[2]); g.add(leg);
        });
        break;
    }
    case 'wolf': {
        // 날렵한 몸
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.45,0.5,0.9), lamb(col));
        body.position.y=0.7; g.add(body);
        // 머리
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22,8,8), lamb(col));
        head.position.set(0,1.05,0.4); g.add(head);
        // 주둥이 (박스)
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.15,0.12,0.25), lamb(col));
        snout.position.set(0,0.95,0.6); g.add(snout);
        // 뾰족 귀 (콘)
        const earMat = lamb(col);
        const earL = new THREE.Mesh(new THREE.ConeGeometry(0.06,0.2,4), earMat);
        earL.position.set(-0.12,1.3,0.35); g.add(earL);
        const earR = new THREE.Mesh(new THREE.ConeGeometry(0.06,0.2,4), earMat);
        earR.position.set(0.12,1.3,0.35); g.add(earR);
        // 눈 (빛나는)
        const eyeColor = (type.includes('그림자'))?0x44ff44:0xffaa00;
        const eMat = basic(eyeColor);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.035,6,6), eMat); eL.position.set(-0.08,1.1,0.55); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.035,6,6), eMat); eR.position.set(0.08,1.1,0.55); g.add(eR);
        // 꼬리 (실린더)
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.02,0.5,6), lamb(col));
        tail.position.set(0,0.7,-0.6); tail.rotation.x=0.8; g.add(tail);
        // 다리
        const legMat = lamb(col);
        [[-0.15,0.3,0.25],[0.15,0.3,0.25],[-0.15,0.3,-0.25],[0.15,0.3,-0.25]].forEach(p => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.04,0.6,6), legMat);
            leg.position.set(p[0],p[1],p[2]); g.add(leg);
        });
        break;
    }
    case 'bear': {
        // 큰 몸
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.55,8,8), lamb(col));
        body.scale.set(1,1,0.9); body.position.y=0.8; g.add(body);
        // 머리
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.3,8,8), lamb(col));
        head.position.set(0,1.4,0.3); g.add(head);
        // 주둥이
        const snout = new THREE.Mesh(new THREE.SphereGeometry(0.12,6,6), lamb(0xc49070));
        snout.position.set(0,1.3,0.55); g.add(snout);
        // 코
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05,6,6), basic(0x111111));
        nose.position.set(0,1.35,0.62); g.add(nose);
        // 둥근 귀
        const earMat = lamb(col);
        const earL = new THREE.Mesh(new THREE.SphereGeometry(0.1,6,6), earMat); earL.position.set(-0.22,1.65,0.2); g.add(earL);
        const earR = new THREE.Mesh(new THREE.SphereGeometry(0.1,6,6), earMat); earR.position.set(0.22,1.65,0.2); g.add(earR);
        // 눈
        const eMat = basic(0x000000);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eL.position.set(-0.12,1.45,0.5); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eR.position.set(0.12,1.45,0.5); g.add(eR);
        // 굵은 다리
        const legMat = lamb(col);
        [[-0.25,0.3,0.2],[0.25,0.3,0.2],[-0.25,0.3,-0.2],[0.25,0.3,-0.2]].forEach(p => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.09,0.6,6), legMat);
            leg.position.set(p[0],p[1],p[2]); g.add(leg);
        });
        break;
    }
    case 'mammoth': {
        // 거대 몸
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.6,8,8), lamb(col));
        body.scale.set(1,0.9,1.1); body.position.y=0.9; g.add(body);
        // 머리
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35,8,8), lamb(col));
        head.position.set(0,1.5,0.4); g.add(head);
        // 상아 (콘 곡선)
        const ivoryMat = lamb(0xfffff0);
        const tL = new THREE.Mesh(new THREE.ConeGeometry(0.06,0.7,6), ivoryMat);
        tL.position.set(-0.25,1.1,0.6); tL.rotation.z=0.5; tL.rotation.x=-0.3; g.add(tL);
        const tR = new THREE.Mesh(new THREE.ConeGeometry(0.06,0.7,6), ivoryMat);
        tR.position.set(0.25,1.1,0.6); tR.rotation.z=-0.5; tR.rotation.x=-0.3; g.add(tR);
        // 코 (실린더)
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.05,0.6,6), lamb(col));
        trunk.position.set(0,1.1,0.7); trunk.rotation.x=0.5; g.add(trunk);
        // 눈
        const eMat = basic(0x000000);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eL.position.set(-0.18,1.55,0.6); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eR.position.set(0.18,1.55,0.6); g.add(eR);
        // 귀 (큰 판)
        const earMat = lamb(col);
        const earL = new THREE.Mesh(new THREE.CircleGeometry(0.2,6), earMat); earL.position.set(-0.4,1.4,0.25); earL.rotation.y=Math.PI/3; g.add(earL);
        const earR = new THREE.Mesh(new THREE.CircleGeometry(0.2,6), earMat); earR.position.set(0.4,1.4,0.25); earR.rotation.y=-Math.PI/3; g.add(earR);
        // 굵은 다리
        const legMat = lamb(col);
        [[-0.3,0.35,0.3],[0.3,0.35,0.3],[-0.3,0.35,-0.3],[0.3,0.35,-0.3]].forEach(p => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.1,0.7,6), legMat);
            leg.position.set(p[0],p[1],p[2]); g.add(leg);
        });
        break;
    }
    case 'lizard': {
        // 긴 납작 몸
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.35,0.25,0.9), lamb(col));
        body.position.y=0.35; g.add(body);
        // 작은 머리
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.18,8,8), lamb(col));
        head.position.set(0,0.4,0.5); g.add(head);
        // 눈 (빛남)
        const eMat = basic(0xffcc00);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eL.position.set(-0.1,0.48,0.6); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eR.position.set(0.1,0.48,0.6); g.add(eR);
        // 짧은 다리
        const legMat = lamb(col);
        [[-0.22,0.12,0.2],[0.22,0.12,0.2],[-0.22,0.12,-0.2],[0.22,0.12,-0.2]].forEach(p => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.03,0.25,6), legMat);
            leg.position.set(p[0],p[1],p[2]); leg.rotation.z=p[0]>0?-0.4:0.4; g.add(leg);
        });
        // 꼬리 (실린더)
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.02,0.6,6), lamb(col));
        tail.position.set(0,0.3,-0.7); tail.rotation.x=-0.3; g.add(tail);
        break;
    }
    case 'golem': {
        // 각진 몸 (큰 박스)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7,0.9,0.5), lamb(col));
        body.position.y=0.8; g.add(body);
        // 머리 (작은 박스)
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.35,0.35), lamb(col));
        head.position.set(0,1.5,0); g.add(head);
        // 빛나는 균열 (MeshBasic 줄무늬)
        const crackMat = basic(0xff4400, {transparent:true, opacity:0.8});
        const crack1 = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.6,0.52), crackMat);
        crack1.position.set(0.1,0.8,0); g.add(crack1);
        const crack2 = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.05,0.52), crackMat);
        crack2.position.set(0,0.7,0); g.add(crack2);
        // 눈 (빛남)
        const eMat = basic(0xff6600);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.05,6,6), eMat); eL.position.set(-0.1,1.55,0.18); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.05,6,6), eMat); eR.position.set(0.1,1.55,0.18); g.add(eR);
        // 각진 팔 (박스)
        const armMat = lamb(col);
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.7,0.2), armMat); armL.position.set(-0.55,0.7,0); g.add(armL);
        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.7,0.2), armMat); armR.position.set(0.55,0.7,0); g.add(armR);
        // 다리
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.25,0.5,0.25), lamb(col)); legL.position.set(-0.2,0.25,0); g.add(legL);
        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.25,0.5,0.25), lamb(col)); legR.position.set(0.2,0.25,0); g.add(legR);
        break;
    }
    case 'knight': {
        // 갑옷 몸
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.9,0.4), lamb(col));
        body.position.y=0.9; g.add(body);
        // 헬멧 (구 + 반구 바이저)
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25,8,8), lamb(col));
        head.position.set(0,1.6,0); g.add(head);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.08,0.15), basic(0x222222));
        visor.position.set(0,1.55,0.2); g.add(visor);
        // 검 (실린더)
        const sword = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,1.0,4), lamb(0xcccccc));
        sword.position.set(0.45,1.0,0.1); sword.rotation.z=-0.2; g.add(sword);
        // 검 손잡이
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.15,4), lamb(0x8a6a3a));
        hilt.position.set(0.42,0.55,0.1); g.add(hilt);
        // 방패 (박스)
        const shield = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.5,0.35), lamb(0x555555));
        shield.position.set(-0.4,0.9,0.15); g.add(shield);
        // 눈
        const eMat = basic(type.includes('심연')||type.includes('죽음')?0xff0000:0x000000);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.03,6,6), eMat); eL.position.set(-0.08,1.6,0.22); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.03,6,6), eMat); eR.position.set(0.08,1.6,0.22); g.add(eR);
        // 다리
        const legMat = lamb(col);
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.07,0.6,6), legMat); legL.position.set(-0.15,0.3,0); g.add(legL);
        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.07,0.6,6), legMat); legR.position.set(0.15,0.3,0); g.add(legR);
        break;
    }
    case 'skeleton': {
        // 척추 (얇은 실린더)
        const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.8,4), lamb(0xddddcc));
        spine.position.y=0.8; g.add(spine);
        // 해골 머리
        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.22,8,8), lamb(0xddddcc));
        skull.position.set(0,1.4,0); g.add(skull);
        // 눈 (빛남)
        const eMat = basic(type.includes('마법')?0xaa44ff:0xff4444);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eL.position.set(-0.08,1.42,0.18); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eR.position.set(0.08,1.42,0.18); g.add(eR);
        // 갈비뼈 (토러스)
        for(let i=0;i<3;i++){
            const rib = new THREE.Mesh(new THREE.TorusGeometry(0.15,0.02,4,8,Math.PI), lamb(0xddddcc));
            rib.position.set(0,0.7+i*0.15,0.05); rib.rotation.x=Math.PI/2; g.add(rib);
        }
        // 뼈 팔다리
        const boneMat = lamb(0xddddcc);
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.02,0.5,4), boneMat); armL.position.set(-0.25,0.9,0); armL.rotation.z=0.4; g.add(armL);
        const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.02,0.5,4), boneMat); armR.position.set(0.25,0.9,0); armR.rotation.z=-0.4; g.add(armR);
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.025,0.6,4), boneMat); legL.position.set(-0.1,0.25,0); g.add(legL);
        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.025,0.6,4), boneMat); legR.position.set(0.1,0.25,0); g.add(legR);
        // 마법사면 지팡이
        if(type.includes('마법')){
            const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,1.2,4), lamb(0x6a3a8a));
            staff.position.set(0.35,0.8,0); g.add(staff);
            const orb = new THREE.Mesh(new THREE.SphereGeometry(0.08,6,6), basic(0xaa44ff,{transparent:true,opacity:0.8}));
            orb.position.set(0.35,1.4,0); g.add(orb);
        }
        // 궁수면 활
        if(type.includes('궁수')){
            const bow = new THREE.Mesh(new THREE.TorusGeometry(0.25,0.02,4,8,Math.PI), lamb(0x8a6a3a));
            bow.position.set(-0.35,0.9,0); bow.rotation.y=Math.PI/2; g.add(bow);
        }
        break;
    }
    case 'snake': {
        // S자 구체 체인
        const segMat = lamb(col);
        const segCount = 8;
        for(let i=0;i<segCount;i++){
            const r = 0.12 - i*0.008;
            const seg = new THREE.Mesh(new THREE.SphereGeometry(Math.max(r,0.05),6,6), segMat);
            const t = i/segCount;
            seg.position.set(Math.sin(t*Math.PI*2)*0.2, 0.15+i*0.02, -i*0.12+0.4);
            g.add(seg);
        }
        // 머리 (큰 구)
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.15,8,8), segMat);
        head.position.set(0,0.25,0.5); g.add(head);
        // 눈
        const eMat = basic(0xffff00);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.035,6,6), eMat); eL.position.set(-0.08,0.3,0.6); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.035,6,6), eMat); eR.position.set(0.08,0.3,0.6); g.add(eR);
        // 혀 (얇은 실린더, 빨간)
        const tongue = new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.005,0.15,3), lamb(0xff0000));
        tongue.position.set(0,0.2,0.65); tongue.rotation.x=Math.PI/2; g.add(tongue);
        break;
    }
    case 'blob': {
        // 다수 구 병합
        const blobMat = lamb(col);
        const main = new THREE.Mesh(new THREE.SphereGeometry(0.45,8,8), blobMat);
        main.position.y=0.5; g.add(main);
        for(let i=0;i<4;i++){
            const blob = new THREE.Mesh(new THREE.SphereGeometry(0.2+Math.random()*0.1,6,6), blobMat);
            blob.position.set(Math.cos(i*1.57)*0.3, 0.3+Math.random()*0.2, Math.sin(i*1.57)*0.3);
            g.add(blob);
        }
        // 다수 눈
        const eMat = basic(0xffffff);
        for(let i=0;i<3;i++){
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06,6,6), eMat);
            eye.position.set(-0.15+i*0.15, 0.6+Math.random()*0.15, 0.35);
            g.add(eye);
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03,6,6), basic(0x000000));
            pupil.position.copy(eye.position); pupil.position.z+=0.05;
            g.add(pupil);
        }
        // 촉수 (실린더)
        for(let i=0;i<3;i++){
            const t = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.015,0.4,4), blobMat);
            t.position.set(-0.2+i*0.2, 0.05, 0.1); t.rotation.x=0.3; g.add(t);
        }
        break;
    }
    case 'spirit': {
        // 구 코어 (발광)
        const coreMat = basic(col, {transparent:true, opacity:0.9});
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.3,8,8), coreMat);
        core.position.y=0.8; g.add(core);
        // 발광 구 (외부)
        const glowMat = basic(col, {transparent:true, opacity:0.25});
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5,8,8), glowMat);
        glow.position.y=0.8; g.add(glow);
        // 반투명 외곽
        const outerMat = basic(0xffffff, {transparent:true, opacity:0.1});
        const outer = new THREE.Mesh(new THREE.SphereGeometry(0.6,8,8), outerMat);
        outer.position.y=0.8; g.add(outer);
        // 눈
        const eMat = basic(0xffffff);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.05,6,6), eMat); eL.position.set(-0.1,0.85,0.25); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.05,6,6), eMat); eR.position.set(0.1,0.85,0.25); g.add(eR);
        // 꼬리 불꽃 (콘)
        const flameMat = basic(col, {transparent:true, opacity:0.6});
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.2,0.5,6), flameMat);
        flame.position.set(0,0.2,0); flame.rotation.x=Math.PI; g.add(flame);
        break;
    }
    case 'dragon': {
        // 몸 (큰 구 → 타원)
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.45,8,8), lamb(col));
        body.scale.set(1,0.8,1.2); body.position.y=0.7; g.add(body);
        // 머리
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25,8,8), lamb(col));
        head.position.set(0,1.2,0.4); g.add(head);
        // 뿔 (콘)
        const hornMat = lamb(0x333333);
        const hL = new THREE.Mesh(new THREE.ConeGeometry(0.04,0.3,4), hornMat);
        hL.position.set(-0.12,1.5,0.3); hL.rotation.z=0.2; g.add(hL);
        const hR = new THREE.Mesh(new THREE.ConeGeometry(0.04,0.3,4), hornMat);
        hR.position.set(0.12,1.5,0.3); hR.rotation.z=-0.2; g.add(hR);
        // 눈 (빛남)
        const eyeCol = type.includes('본')||type.includes('스켈레톤')?0x44ff44:0xff4400;
        const eMat = basic(eyeCol);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eL.position.set(-0.1,1.25,0.58); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eR.position.set(0.1,1.25,0.58); g.add(eR);
        // 날개 (BufferGeometry)
        const wingMat = new THREE.MeshLambertMaterial({color:col, transparent:true, opacity:0.7, side:THREE.DoubleSide});
        const wingGeo = new THREE.BufferGeometry();
        const wv = new Float32Array([0,1.0,-0.1, -0.9,1.4,-0.4, -0.6,0.5,-0.3, 0,1.0,-0.1, 0.9,1.4,-0.4, 0.6,0.5,-0.3]);
        wingGeo.setAttribute('position', new THREE.BufferAttribute(wv,3));
        wingGeo.computeVertexNormals();
        const wings = new THREE.Mesh(wingGeo, wingMat);
        g.add(wings);
        // 꼬리 (콘 → 가늘어짐)
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1,0.7,6), lamb(col));
        tail.position.set(0,0.5,-0.7); tail.rotation.x=-0.5; g.add(tail);
        // 다리
        const legMat = lamb(col);
        [[-0.2,0.25,0.15],[0.2,0.25,0.15],[-0.2,0.25,-0.15],[0.2,0.25,-0.15]].forEach(p => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.05,0.5,6), legMat);
            leg.position.set(p[0],p[1],p[2]); g.add(leg);
        });
        break;
    }
    case 'jellyfish': {
        // 반구 돔
        const domeMat = new THREE.MeshLambertMaterial({color:col, transparent:true, opacity:0.7});
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.4,8,8,0,Math.PI*2,0,Math.PI/2), domeMat);
        dome.position.y=0.8; g.add(dome);
        // 발광 내부
        const innerMat = basic(col, {transparent:true, opacity:0.5});
        const inner = new THREE.Mesh(new THREE.SphereGeometry(0.25,6,6), innerMat);
        inner.position.y=0.85; g.add(inner);
        // 촉수 (실린더)
        for(let i=0;i<6;i++){
            const ang = (i/6)*Math.PI*2;
            const t = new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.01,0.6+Math.random()*0.3,4),
                new THREE.MeshLambertMaterial({color:col, transparent:true, opacity:0.5}));
            t.position.set(Math.cos(ang)*0.2, 0.3, Math.sin(ang)*0.2);
            g.add(t);
        }
        // 눈
        const eMat = basic(0xffffff);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eL.position.set(-0.1,0.9,0.3); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eR.position.set(0.1,0.9,0.3); g.add(eR);
        break;
    }
    case 'alien': {
        // 큰 머리
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35,8,8), lamb(col));
        head.scale.set(1,1.2,1); head.position.set(0,1.3,0); g.add(head);
        // 큰 눈 (검정 구)
        const eMat = basic(0x111111);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.1,8,8), eMat);
        eL.scale.set(0.7,1,0.5); eL.position.set(-0.15,1.35,0.25); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.1,8,8), eMat);
        eR.scale.set(0.7,1,0.5); eR.position.set(0.15,1.35,0.25); g.add(eR);
        // 마른 몸 (얇은 박스)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.6,0.2), lamb(col));
        body.position.y=0.7; g.add(body);
        // 안테나 (실린더)
        const antMat = lamb(col);
        const antL = new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.01,0.3,4), antMat);
        antL.position.set(-0.1,1.75,0); antL.rotation.z=0.3; g.add(antL);
        const antR = new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.01,0.3,4), antMat);
        antR.position.set(0.1,1.75,0); antR.rotation.z=-0.3; g.add(antR);
        // 안테나 끝 (구)
        const tipL = new THREE.Mesh(new THREE.SphereGeometry(0.03,4,4), basic(0x44ff44));
        tipL.position.set(-0.2,1.88,0); g.add(tipL);
        const tipR = new THREE.Mesh(new THREE.SphereGeometry(0.03,4,4), basic(0x44ff44));
        tipR.position.set(0.2,1.88,0); g.add(tipR);
        // 팔다리
        const limbMat = lamb(col);
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.02,0.4,4), limbMat); armL.position.set(-0.25,0.7,0); armL.rotation.z=0.5; g.add(armL);
        const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.02,0.4,4), limbMat); armR.position.set(0.25,0.7,0); armR.rotation.z=-0.5; g.add(armR);
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.03,0.5,4), limbMat); legL.position.set(-0.1,0.2,0); g.add(legL);
        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.03,0.5,4), limbMat); legR.position.set(0.1,0.2,0); g.add(legR);
        break;
    }
    case 'phantom': {
        // 반투명 몸 (구+콘)
        const bodyMat = new THREE.MeshLambertMaterial({color:col, transparent:true, opacity:0.5});
        const torso = new THREE.Mesh(new THREE.SphereGeometry(0.35,8,8), bodyMat);
        torso.position.y=0.9; g.add(torso);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.3,0.6,8), bodyMat);
        tail.position.y=0.3; g.add(tail);
        // 왜곡링 (토러스)
        const ringMat = basic(col, {transparent:true, opacity:0.3});
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5,0.03,8,16), ringMat);
        ring.position.y=0.8; ring.rotation.x=Math.PI/2; g.add(ring);
        // 빛나는 눈
        const eMat = basic(0xffffff);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.06,6,6), eMat); eL.position.set(-0.12,0.95,0.28); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.06,6,6), eMat); eR.position.set(0.12,0.95,0.28); g.add(eR);
        break;
    }
    case 'angel': {
        // 인체 (박스)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.8,0.3), lamb(0xffffff));
        body.position.y=0.9; g.add(body);
        // 머리
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22,8,8), lamb(0xd4a574));
        head.position.set(0,1.55,0); g.add(head);
        // 후광 (토러스)
        const haloMat = basic(0xffd700, {transparent:true, opacity:0.6});
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.3,0.03,8,16), haloMat);
        halo.position.y=1.85; halo.rotation.x=Math.PI/2; g.add(halo);
        // 날개 (BufferGeometry)
        const wingMat = new THREE.MeshLambertMaterial({color:0xffffff, transparent:true, opacity:0.6, side:THREE.DoubleSide});
        const wingGeo = new THREE.BufferGeometry();
        const wv = new Float32Array([0,1.2,-0.15, -0.8,1.6,-0.35, -0.5,0.7,-0.25, 0,1.2,-0.15, 0.8,1.6,-0.35, 0.5,0.7,-0.25]);
        wingGeo.setAttribute('position', new THREE.BufferAttribute(wv,3));
        wingGeo.computeVertexNormals();
        const wings = new THREE.Mesh(wingGeo, wingMat);
        g.add(wings);
        // 눈
        const eyeCol = type.includes('타락')?0xff0000:0x4488ff;
        const eMat = basic(eyeCol);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.03,6,6), eMat); eL.position.set(-0.08,1.58,0.18); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.03,6,6), eMat); eR.position.set(0.08,1.58,0.18); g.add(eR);
        // 무기 (실린더)
        const wp = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,1.0,4), lamb(col||0xcccccc));
        wp.position.set(0.4,1.0,0.05); wp.rotation.z=-0.2; g.add(wp);
        // 다리
        const legMat = lamb(0xffffff);
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.05,0.5,6), legMat); legL.position.set(-0.12,0.3,0); g.add(legL);
        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.05,0.5,6), legMat); legR.position.set(0.12,0.3,0); g.add(legR);
        break;
    }
    case 'god': {
        // 로브 (콘)
        const robe = new THREE.Mesh(new THREE.ConeGeometry(0.5,1.4,8), lamb(0xffd700));
        robe.position.y=0.7; g.add(robe);
        // 머리
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.28,8,8), lamb(0xffeedd));
        head.position.set(0,1.7,0); g.add(head);
        // 왕관 (콘들)
        const crownMat = lamb(0xffd700);
        for(let i=0;i<5;i++){
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04,0.2,4), crownMat);
            const a = (i/5)*Math.PI*2;
            spike.position.set(Math.cos(a)*0.18, 2.0, Math.sin(a)*0.18);
            g.add(spike);
        }
        // 거대 후광 (토러스)
        const haloMat = basic(0xffd700, {transparent:true, opacity:0.4});
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.7,0.04,8,24), haloMat);
        halo.position.y=2.2; halo.rotation.x=Math.PI/2; g.add(halo);
        // 6날개
        const wingMat = new THREE.MeshLambertMaterial({color:0xffd700, transparent:true, opacity:0.5, side:THREE.DoubleSide});
        for(let i=0;i<3;i++){
            const y = 1.0 + i*0.35;
            const wGeo = new THREE.BufferGeometry();
            const sp = 0.8+i*0.2;
            const wv = new Float32Array([0,y,-0.1, -sp,y+0.3,-0.3, -sp*0.6,y-0.3,-0.2, 0,y,-0.1, sp,y+0.3,-0.3, sp*0.6,y-0.3,-0.2]);
            wGeo.setAttribute('position', new THREE.BufferAttribute(wv,3));
            wGeo.computeVertexNormals();
            g.add(new THREE.Mesh(wGeo, wingMat));
        }
        // 눈 (빛남)
        const eMat = basic(0xffffff);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eL.position.set(-0.1,1.75,0.22); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6), eMat); eR.position.set(0.1,1.75,0.22); g.add(eR);
        // 지팡이
        const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.04,1.8,6), lamb(0x8a6a3a));
        staff.position.set(0.55,0.9,0); g.add(staff);
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.1,8,8), basic(0xffd700,{transparent:true,opacity:0.8}));
        orb.position.set(0.55,1.85,0); g.add(orb);
        break;
    }
    default: {
        // 폴백: 간단한 구+박스
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.35,8,8), lamb(col));
        body.position.y=0.5; g.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2,8,8), lamb(col));
        head.position.set(0,1.0,0.15); g.add(head);
        const eMat = basic(0x000000);
        const eL = new THREE.Mesh(new THREE.SphereGeometry(0.03,6,6), eMat); eL.position.set(-0.08,1.05,0.3); g.add(eL);
        const eR = new THREE.Mesh(new THREE.SphereGeometry(0.03,6,6), eMat); eR.position.set(0.08,1.05,0.3); g.add(eR);
        break;
    }
    }
    // 전체 스케일 (3배 확대)
    g.scale.setScalar(s * 3);
    return g;
}

function createAnimalMesh(type) {
    const data = ANIMAL_DATA[type]; const group = new THREE.Group(); const s = data.size;
    const isBoss = data.isBoss;
    const cat = ANIMAL_CATEGORY[type] || 'rabbit';
    // 3D 기하체 바디
    const body = buildAnimal3D(type, data, cat);
    body.name = 'body';
    group.add(body);
    // 바닥 그림자 (3배)
    const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(s * 4.8, 12),
        new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.25, depthWrite:false})
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);
    // 스켈레톤 드래곤 - 불 이펙트 (3배)
    if (type==='스켈레톤 드래곤') {
        const fire = new THREE.Mesh(new THREE.SphereGeometry(s*1.2,6,6), new THREE.MeshBasicMaterial({color:0xff4400,transparent:true,opacity:0.6}));
        fire.position.set(s*3.6,s*1.5,0); fire.name='fire'; group.add(fire);
    }
    // 보스 아우라 (3배)
    if (isBoss) {
        const auraMat = new THREE.MeshBasicMaterial({color:0xffd700, transparent:true, opacity:0.12});
        const aura = new THREE.Mesh(new THREE.SphereGeometry(s*4.5, 12, 12), auraMat);
        aura.position.y = s * 3.0;
        aura.name = 'bossAura';
        group.add(aura);
    }
    // HP바 / 이름 위치: 3D 모델 높이 기준 (3배)
    const sprH = s * 7.5;
    const hpCv=document.createElement('canvas'); hpCv.width=64; hpCv.height=12;
    const hpTex=new THREE.CanvasTexture(hpCv);
    const hpSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:hpTex}));
    hpSpr.position.y=sprH + (isBoss ? 1.8 : 0.9); hpSpr.scale.set(isBoss?6:4,0.8,1);
    hpSpr.name='hpBar'; hpSpr.userData={canvas:hpCv,texture:hpTex}; group.add(hpSpr);
    // 이름
    const nCv=document.createElement('canvas'); nCv.width=200; nCv.height=32;
    const nC=nCv.getContext('2d'); nC.font=`bold ${isBoss?16:14}px sans-serif`; nC.textAlign='center';
    nC.fillStyle=isBoss?'#ff4444':'#fff'; nC.fillText(type,100,22);
    const nSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(nCv),transparent:true}));
    nSpr.position.y=sprH + (isBoss ? 3.0 : 1.8); nSpr.scale.set(isBoss?7:4.5,1.0,1); group.add(nSpr);
    return group;
}

function updateHpBar(obj,a) {
    const sp=obj.getObjectByName('hpBar'); if(!sp) return;
    const c=sp.userData.canvas.getContext('2d');
    c.clearRect(0,0,64,12); c.fillStyle='#333'; c.fillRect(0,0,64,12);
    c.fillStyle=a.hp>a.maxHp*0.3?(a.isBoss?'#ff6600':'#2ecc71'):'#e74c3c';
    c.fillRect(0,0,64*(a.hp/a.maxHp),12); sp.userData.texture.needsUpdate=true;
}

// ── 아군 3D ──
function createAllyMesh(type) {
    const d=ALLY_TYPES.find(a=>a.name===type); const g=new THREE.Group();
    const aBody=new THREE.Mesh(new THREE.BoxGeometry(0.6,1,0.4), new THREE.MeshLambertMaterial({color:d.color})); aBody.position.set(0,1,0); g.add(aBody);
    const aHead=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,8), new THREE.MeshLambertMaterial({color:0xd4a574})); aHead.position.set(0,1.8,0); g.add(aHead);
    if (d.mode==='ranged') {
        const bow=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,1,4), new THREE.MeshLambertMaterial({color:0x8a6a3a}));
        bow.position.set(0.4,1.2,0); bow.rotation.z=-0.2; g.add(bow);
    }
    if (d.mode==='heal') {
        const cr1=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.1,0.1),new THREE.MeshBasicMaterial({color:0xff3333})); cr1.position.set(0,1.4,0.25); g.add(cr1);
        const cr2=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.3,0.1),new THREE.MeshBasicMaterial({color:0xff3333})); cr2.position.set(0,1.4,0.25); g.add(cr2);
    }
    const nCv=document.createElement('canvas'); nCv.width=64; nCv.height=20;
    const nC=nCv.getContext('2d'); nC.font='bold 14px sans-serif'; nC.textAlign='center'; nC.fillStyle='#44ff44'; nC.fillText(type,32,15);
    const nSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(nCv),transparent:true}));
    nSpr.position.y=2.4; nSpr.scale.set(1.5,0.4,1); g.add(nSpr);
    return g;
}

// ── 투사체 3D ──
function spawnProjectile(x, z, fx, fz, damage, owner, color, speed) {
    const len=Math.sqrt(fx*fx+fz*fz)||1;
    const geo=new THREE.SphereGeometry(0.6,8,8);
    const mat=new THREE.MeshBasicMaterial({color:color||0xffaa00});
    const mesh=new THREE.Mesh(geo,mat);
    // 발광 외곽 추가
    const glow=new THREE.Mesh(new THREE.SphereGeometry(1.0,8,8),new THREE.MeshBasicMaterial({color:color||0xffaa00,transparent:true,opacity:0.3}));
    mesh.add(glow);
    mesh.position.set(x*S, 1.5, z*S);
    scene.add(mesh);
    const spd = speed * 2.5;
    projectiles.push({ x, z, vx:fx/len*spd, vz:fz/len*spd, damage, owner, life:200, mesh, isAlly:owner!=='player' });
}

// ═══════════════════════════════════════════
// 게임 시작
// ═══════════════════════════════════════════
function startGame() {
    document.getElementById('start-screen').style.display='none';
    currentStage=1; REGIONS=STAGE1_REGIONS;
    initThree();
    gameState='playing';
    player.x=600; player.z=WORLD_H/2; player.hp=player.maxHp; player.invincible=0;
    animals=[]; allies=[]; projectiles=[]; itemDrops=[]; floatingTexts=[]; particles3D=[];
    animalMeshes.forEach(m=>scene.remove(m)); animalMeshes=[];
    bossesSpawned={}; finalBossSpawned=false;
    village={buildings:[],maxPopulation:2,allyAtkBonus:0,allyDefBonus:0,allySpdBonus:0,regenRate:0,coinBonus:0,meshes:[]};
    for(let i=0;i<60;i++) spawnRandomAnimal();
    startBGM();
    mpConnect();
    gameLoop();
}

function respawn() {
    document.getElementById('death-screen').style.display='none';
    player.coins=Math.floor(player.coins*0.7);
    player.x=600; player.z=WORLD_H/2; player.hp=player.maxHp; player.invincible=0;
    allies.forEach(a=>{a.hp=a.maxHp});
    startBGM();
    gameState='playing';
}

function showClear() {
    gameState='clear';
    document.getElementById('death-screen').style.display='flex';
    document.getElementById('death-screen').querySelector('h1').textContent='🎉 축하합니다!';
    document.getElementById('death-msg').textContent=`Lv.${player.level} | ${CIVILIZATIONS[player.civLevel].name} | 모든 보스를 처치했습니다!`;
    document.getElementById('death-screen').querySelector('button').textContent='처음부터';
    document.getElementById('death-screen').querySelector('button').onclick=()=>location.reload();
}

// ── 스테이지 전환 ──
function goToStage2() {
    currentStage=2; REGIONS=STAGE2_REGIONS;
    animals.forEach(a=>{if(a.mesh)scene.remove(a.mesh);}); animals=[]; animalMeshes=[];
    itemDrops.forEach(d=>{if(d.mesh)scene.remove(d.mesh);}); itemDrops=[];
    projectiles.forEach(p=>{if(p.mesh)scene.remove(p.mesh);}); projectiles=[];
    if(stagePortal){scene.remove(stagePortal);stagePortal=null;}
    bossesSpawned={}; finalBossSpawned=false;
    buildWorld();
    player.x=600; player.z=WORLD_H/2;
    // 아군을 플레이어 주변으로 이동
    allies.forEach(al=>{al.x=player.x+(Math.random()-0.5)*40;al.z=player.z+(Math.random()-0.5)*40;if(al.mesh)al.mesh.position.set(al.x*S,0,al.z*S);});
    for(let i=0;i<60;i++) spawnRandomAnimal();
    addFloatingText(player.x,player.z,'🔥 스테이지 2 시작!','#ff4400',100);
    scene.background = new THREE.Color(0x3a1a0a);
    scene.fog = new THREE.Fog(0x3a1a0a, 150, 600);
}

function goToStage3() {
    currentStage=3; REGIONS=STAGE3_REGIONS;
    animals.forEach(a=>{if(a.mesh)scene.remove(a.mesh);}); animals=[]; animalMeshes=[];
    itemDrops.forEach(d=>{if(d.mesh)scene.remove(d.mesh);}); itemDrops=[];
    projectiles.forEach(p=>{if(p.mesh)scene.remove(p.mesh);}); projectiles=[];
    if(stagePortal){scene.remove(stagePortal);stagePortal=null;}
    bossesSpawned={}; finalBossSpawned=false;
    buildWorld();
    player.x=600; player.z=WORLD_H/2;
    allies.forEach(al=>{al.x=player.x+(Math.random()-0.5)*40;al.z=player.z+(Math.random()-0.5)*40;if(al.mesh)al.mesh.position.set(al.x*S,0,al.z*S);});
    for(let i=0;i<60;i++) spawnRandomAnimal();
    addFloatingText(player.x,player.z,'🌌 스테이지 3 시작!','#aa00ff',100);
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.Fog(0x050510, 150, 600);
    // 별 파티클 장식
    for(let i=0;i<80;i++){
        const star=new THREE.Mesh(new THREE.SphereGeometry(0.05+Math.random()*0.08,4,4),new THREE.MeshBasicMaterial({color:0xffffff}));
        star.position.set((Math.random()-0.5)*WORLD_W*S*0.8, 8+Math.random()*15, (Math.random()-0.5)*WORLD_H*S*2+WORLD_H*S/2);
        scene.add(star);
    }
}

// ═══════════════════════════════════════════
// 레벨업
// ═══════════════════════════════════════════
function checkLevelUp() {
    while(player.xp>=player.xpNext) {
        player.xp-=player.xpNext; player.level++; player.xpNext=player.level*100; player.statPoints+=3;
        player.hp=player.maxHp;
        addFloatingText(player.x,player.z,'LEVEL UP!','#f1c40f',80); spawnLevelUpParticles(); sfx.levelUp(); showLevelUp();
    }
}
function showLevelUp() {
    gameState='levelup';
    document.getElementById('levelup-screen').style.display='flex';
    document.getElementById('levelup-msg').textContent=`레벨 ${player.level} 달성!`;
    updateStatPointsDisplay();
}
function updateStatPointsDisplay() {
    document.getElementById('stat-points-display').textContent=player.statPoints;
    document.getElementById('levelup-close-btn').style.display=player.statPoints<=0?'block':'none';
    document.querySelectorAll('.stat-buttons button').forEach(b=>b.disabled=player.statPoints<=0);
}
function allocateStat(stat) {
    if(player.statPoints<=0) return; player.statPoints--;
    if(stat==='hp'){player.baseHp+=20;player.maxHp=player.baseHp;player.hp=Math.min(player.hp+20,player.maxHp);}
    if(stat==='atk') player.baseAtk+=2;
    if(stat==='def') player.baseDef+=1;
    if(stat==='spd') player.speed+=0.3;
    recalcStats(); updateStatPointsDisplay();
}
function closeLevelUp(){document.getElementById('levelup-screen').style.display='none';gameState='playing';}
function recalcStats() {
    const wAtk = player.weaponMode==='melee' ? (player.meleeWeapon?player.meleeWeapon.atk:0) : (player.rangedWeapon?player.rangedWeapon.atk:0);
    player.atk = player.baseAtk + player.skillAtk + wAtk;
    player.def = player.baseDef + player.skillDef + (player.armor?player.armor.def:0);
    player.maxHp = player.baseHp + player.skillHp;
}

// ═══════════════════════════════════════════
// 문명
// ═══════════════════════════════════════════
function toggleCiv() { togglePanel('civ-panel', renderCivPanel); }
function renderCivPanel() {
    const cur=CIVILIZATIONS[player.civLevel], next=CIVILIZATIONS[player.civLevel+1];
    document.getElementById('civ-info').innerHTML=`
        <div class="civ-current"><h3>🏛️ ${cur.name} 시대</h3><p>${cur.desc}</p></div>
        <div class="civ-progress">${CIVILIZATIONS.map((c,i)=>`<span class="civ-step ${i<player.civLevel?'done':''} ${i===player.civLevel?'active':''}">${c.name}</span>`).join('')}</div>`;
    const us=document.getElementById('civ-upgrade-section');
    if(next){
        us.innerHTML=`<div class="civ-item"><div><div class="item-name">➡️ ${next.name} 시대</div><div class="item-desc">${next.desc}</div></div><div style="display:flex;align-items:center;gap:8px;"><span class="item-price">🪙 ${next.cost}</span></div></div>`;
        const btn=document.createElement('button'); btn.textContent='문명 발전!'; btn.disabled=player.coins<next.cost;
        btn.style.cssText='padding:4px 12px;font-size:0.8rem;background:#6b4a3a;color:#fff;border:1px solid #8b5e3c;border-radius:4px;cursor:pointer;';
        if(btn.disabled)btn.style.opacity='0.4'; btn.onclick=()=>upgradeCiv();
        us.querySelector('.civ-item div:last-child').appendChild(btn);
    } else { us.innerHTML='<p style="text-align:center;color:#e67e22;margin:12px 0;">최고 문명!</p>'; }
    document.getElementById('civ-weapons-preview').innerHTML='';
}
function upgradeCiv() {
    const next=CIVILIZATIONS[player.civLevel+1]; if(!next||player.coins<next.cost)return;
    player.coins-=next.cost; player.civLevel++;
    addFloatingText(player.x,player.z,`${next.name} 시대!`,'#e67e22',80);
    spawnLevelUpParticles(); buildPlayer(); renderCivPanel(); updateHUD();
}

// ═══════════════════════════════════════════
// 마을
// ═══════════════════════════════════════════
function toggleVillage() { togglePanel('village-panel', renderVillagePanel); }
function renderVillagePanel() {
    document.getElementById('village-info').innerHTML=`
        <div class="civ-current"><h3>🏘️ 나의 마을</h3>
        <p>건물 ${village.buildings.length}개 | 인구 ${allies.length}/${village.maxPopulation}</p>
        <p style="font-size:0.8rem;margin-top:4px;color:#a09880;">
        ${village.regenRate>0?`❤️+${village.regenRate}/s `:''} ${village.coinBonus>0?`🪙+${Math.round(village.coinBonus*100)}% `:''}
        ${village.allyAtkBonus>0?`⚔️+${village.allyAtkBonus} `:''} ${village.allyDefBonus>0?`🛡️+${village.allyDefBonus}`:''}</p></div>`;
    const bL=document.getElementById('village-build-list'); bL.innerHTML='<div class="civ-section-title">🔨 건설</div>';
    BUILDINGS.forEach(b=>{
        const cnt=village.buildings.filter(n=>n===b.name).length;
        bL.appendChild(mkItem(`${b.icon} ${b.name} (${cnt})`, b.desc, b.price, ()=>buildBuilding(b), player.coins<b.price));
    });
    const aL=document.getElementById('village-ally-list'); aL.innerHTML=`<div class="civ-section-title">⚔️ 아군 (${allies.length}/${village.maxPopulation})</div>`;
    ALLY_TYPES.forEach(a=>{
        aL.appendChild(mkItem(a.name, `${a.desc} | ${a.mode==='ranged'?'원거리':'근접'}`, a.price, ()=>hireAlly(a), player.coins<a.price||allies.length>=village.maxPopulation));
    });
}
function buildBuilding(b) {
    if(player.coins<b.price)return; player.coins-=b.price; village.buildings.push(b.name);
    switch(b.effect){
        case'population':village.maxPopulation+=b.value;break; case'allyAtk':village.allyAtkBonus+=b.value;break;
        case'allyDef':village.allyDefBonus+=b.value;break; case'regen':village.regenRate+=b.value;break;
        case'coinBonus':village.coinBonus+=b.value;break; case'allySpd':village.allySpdBonus+=b.value;break;
    }
    updateVillage3D(); renderVillagePanel();
}
function hireAlly(aType) {
    if(player.coins<aType.price||allies.length>=village.maxPopulation)return;
    player.coins-=aType.price;
    const ally={
        type:aType.name, x:player.x+(Math.random()-0.5)*40, z:player.z+(Math.random()-0.5)*40,
        hp:aType.hp, maxHp:aType.hp, atk:aType.atk+village.allyAtkBonus, def:aType.def+village.allyDefBonus,
        speed:aType.speed+village.allySpdBonus, range:aType.range, mode:aType.mode,
        attackCooldown:aType.mode==='heal'?2000:800, lastAttack:0, facingX:1, mesh:null,
    };
    const mesh=createAllyMesh(aType.name); mesh.position.set(ally.x*S,0,ally.z*S);
    scene.add(mesh); ally.mesh=mesh; allies.push(ally); renderVillagePanel();
}

// ═══════════════════════════════════════════
// 동물 스폰 & 보스
// ═══════════════════════════════════════════
function spawnRandomAnimal() {
    if(animals.length>=MAX_ANIMALS) return;
    const r=REGIONS[Math.floor(Math.random()*REGIONS.length)];
    const t=r.animals[Math.floor(Math.random()*r.animals.length)];
    spawnAnimalAt(t, r.x+50+Math.random()*(r.w-100), 50+Math.random()*(WORLD_H-100));
}
function spawnAnimalAt(type,x,z) {
    const data=ANIMAL_DATA[type]; if(!data) return;
    const a={type,x,z,hp:data.hp,maxHp:data.hp,atk:data.atk,def:data.def,speed:data.speed,size:data.size,
        color:data.color,behavior:data.behavior,drop:data.drop,dropRate:data.dropRate,
        isBoss:data.isBoss||false,isFinalBoss:data.isFinalBoss||false,
        targetX:x,targetZ:z,roamTimer:120+Math.random()*120,hitFlash:0,dead:false,facingX:1};
    const mesh=createAnimalMesh(type); mesh.position.set(x*S,0,z*S);
    scene.add(mesh); a.mesh=mesh; animals.push(a); animalMeshes.push(mesh);
}
function checkBossSpawn() {
    for(let r of REGIONS) {
        if(r.boss&&!bossesSpawned[r.boss]&&player.x>=r.x&&player.x<r.x+r.w) {
            bossesSpawned[r.boss]=true;
            spawnAnimalAt(r.boss, r.x+r.w/2, WORLD_H/2);
            addFloatingText(r.x+r.w/2, WORLD_H/2-30, `⚠️ ${r.boss}!`,'#ff4444',100);
        }
    }
    // 최종보스
    const lastR=REGIONS[REGIONS.length-1];
    const fbName = currentStage===1?'심연의 군주':currentStage===2?'스켈레톤 드래곤':'창조의 신';
    if(!finalBossSpawned&&player.x>=lastR.x+500) {
        finalBossSpawned=true;
        spawnAnimalAt(fbName, lastR.x+lastR.w/2, WORLD_H/2);
        addFloatingText(lastR.x+lastR.w/2, WORLD_H/2-30, `💀 최종보스: ${fbName}!`,'#aa00ff',120);
    }
}

// ═══════════════════════════════════════════
// 게임 루프
// ═══════════════════════════════════════════
let camTarget={x:0,z:0};
function gameLoop() {
    const dt=clock.getDelta()*1000;
    if(gameState==='playing'&&!paused) update(Math.min(dt,50));
    render3D(); renderMinimap(); updateHUD();
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    updatePlayer(dt); updateCamera3D(); updateAnimals(dt); updateAllies(dt);
    updateProjectiles(dt); updateItemDrops(dt); updateEffects(dt);
    lastSpawn+=dt; if(lastSpawn>SPAWN_INTERVAL){lastSpawn=0;spawnRandomAnimal();}
    const totalRegen=village.regenRate+player.hpRegen;
    if(totalRegen>0){regenTimer+=dt; if(regenTimer>=1000){regenTimer-=1000;player.hp=Math.min(player.maxHp,player.hp+totalRegen);}}
    checkBossSpawn(); checkPortal();
    mpUpdateLoop(dt);
}

function updatePlayer(dt) {
    let dx=0,dz=0;
    if(keys['KeyW']||keys['ArrowUp']) dz=-1;
    if(keys['KeyS']||keys['ArrowDown']) dz=1;
    if(keys['KeyA']||keys['ArrowLeft']) dx=-1;
    if(keys['KeyD']||keys['ArrowRight']) dx=1;
    if(dx&&dz){const l=Math.sqrt(dx*dx+dz*dz);dx/=l;dz/=l;}
    if(dx!==0||dz!==0){player.facingX=dx;player.facingZ=dz;player.facing=dx>=0?1:-1;}
    player.x+=dx*player.speed; player.z+=dz*player.speed;
    player.x=Math.max(12,Math.min(WORLD_W-12,player.x)); player.z=Math.max(12,Math.min(WORLD_H-12,player.z));
    if(player.invincible>0)player.invincible-=dt;
    if(player.attacking){player.attackTimer-=dt;if(player.attackTimer<=0){player.attacking=false;if(attackEffect){scene.remove(attackEffect);attackEffect=null;}}}
    const effectiveCooldown = Math.max(100, ATTACK_COOLDOWN * (1 - player.atkSpeedBonus));
    if(keys['Space']&&!player.attacking&&Date.now()-player.lastAttack>effectiveCooldown){
        player.attacking=true;player.attackTimer=200;player.lastAttack=Date.now();
        recalcStats();
        if(player.weaponMode==='ranged') performRangedAttack(); else performMeleeAttack();
    }
    if(playerGroup){
        playerGroup.position.set(player.x*S,0,player.z*S);
        playerGroup.rotation.y=Math.atan2(player.facingX,player.facingZ);
        playerGroup.visible=!(player.invincible>0&&Math.floor(player.invincible/80)%2===0);
    }
}

function getAttackDir(range) {
    let nearest=null, nd=Infinity;
    for(const a of animals){if(a.dead)continue;const d=dist2D(player.x,player.z,a.x,a.z);if(d<nd){nd=d;nearest=a;}}
    if(nearest&&nd<range){
        const dx=nearest.x-player.x,dz=nearest.z-player.z,l=Math.sqrt(dx*dx+dz*dz)||1;
        return {x:dx/l,z:dz/l};
    }
    const fl=Math.sqrt(player.facingX*player.facingX+player.facingZ*player.facingZ)||1;
    return {x:player.facingX/fl,z:player.facingZ/fl};
}

function performMeleeAttack() {
    sfx.meleeHit();
    const dir=getAttackDir(350);let fx=dir.x,fz=dir.z;
    const ax=player.x+fx*80, az=player.z+fz*80;
    if(attackEffect)scene.remove(attackEffect);
    const eff=new THREE.Mesh(new THREE.RingGeometry(2,6,16),new THREE.MeshBasicMaterial({color:0xf4a460,side:THREE.DoubleSide,transparent:true,opacity:0.5}));
    eff.position.set(ax*S,1.5,az*S);eff.rotation.x=-Math.PI/2;scene.add(eff);attackEffect=eff;
    for(let i=0;i<8;i++)spawnParticle3D(ax+(Math.random()-0.5)*60,az+(Math.random()-0.5)*60,0xf4a460,30);
    for(let a of animals){
        if(a.dead)continue;
        if(dist2D(ax,az,a.x,a.z)<ATTACK_RANGE+a.size*10){
            let dmg=Math.max(1,player.atk-a.def);
            const isCrit=Math.random()<player.critChance;
            if(isCrit) dmg=Math.floor(dmg*player.critDmg);
            a.hp-=dmg; a.hitFlash=150;
            if(player.lifesteal>0){const heal=Math.floor(dmg*player.lifesteal);player.hp=Math.min(player.maxHp,player.hp+heal);}
            addFloatingText(a.x,a.z,isCrit?`💥${dmg}`:`-${dmg}`,isCrit?'#ff4444':'#f1c40f',40);
            const kb=Math.atan2(a.z-player.z,a.x-player.x); a.x+=Math.cos(kb)*15; a.z+=Math.sin(kb)*15;
            if(a.hp<=0)killAnimal(a);
        }
    }
    mpSendAttack(ax, az, 'melee');
}

function performRangedAttack() {
    sfx.rangedShot();
    const rw=player.rangedWeapon;
    const dmg=player.atk;
    const color=rw?rw.projColor:0x888888;
    const speed=rw?rw.speed:5;
    const dir=getAttackDir(500);
    const sx=player.x+dir.x*30, sz=player.z+dir.z*30;
    spawnProjectile(sx, sz, dir.x, dir.z, dmg, 'player', color, speed);
    for(let i=0;i<4;i++) spawnParticle3D(sx+(Math.random()-0.5)*15, sz+(Math.random()-0.5)*15, color, 20);
    mpSendAttack(sx, sz, 'ranged');
}

function updateCamera3D() {
    if(!cameraObj)return;
    camTarget.x+=(player.x*S-camTarget.x)*0.1; camTarget.z+=(player.z*S-camTarget.z)*0.1;
    const lookY = 5;
    cameraObj.position.set(camTarget.x, 55, camTarget.z+35);
    cameraObj.lookAt(camTarget.x, lookY, camTarget.z);
}

function updateAnimals(dt) {
    const rm=[];
    for(let i=0;i<animals.length;i++){
        const a=animals[i];
        if(a.dead){rm.push(i);continue;}
        if(a.hitFlash>0){a.hitFlash-=dt;const bm=a.mesh.getObjectByName('body');if(bm){const flashHex=a.hitFlash>0?0xff4444:0x000000;bm.traverse(c=>{if(c.isMesh&&c.material&&c.material.emissive)c.material.emissive.setHex(flashHex);});}}
        // 불 이펙트 애니메이션
        const fire=a.mesh.getObjectByName('fire');
        if(fire) fire.scale.setScalar(0.8+Math.sin(Date.now()*0.01)*0.3);
        // 타겟 (플레이어 + 아군 중 가장 가까운)
        let cd=dist2D(a.x,a.z,player.x,player.z), cx=player.x, cz=player.z;
        for(let al of allies){const d=dist2D(a.x,a.z,al.x,al.z);if(d<cd){cd=d;cx=al.x;cz=al.z;}}
        const det=a.isBoss?300:150;
        if(a.behavior==='chase'&&cd<det){
            const ang=Math.atan2(cz-a.z,cx-a.x); a.x+=Math.cos(ang)*a.speed; a.z+=Math.sin(ang)*a.speed; a.facingX=Math.cos(ang)>0?1:-1;
            const pd=dist2D(a.x,a.z,player.x,player.z);
            if(pd<a.size*15+12&&player.invincible<=0){
                let dmg=Math.max(1,a.atk-player.def);
                if(player.dmgReduce>0) dmg=Math.max(1,Math.floor(dmg*(1-player.dmgReduce)));
                player.hp-=dmg; player.invincible=500;
                if(player.thorns>0){const ref=Math.floor(dmg*player.thorns);a.hp-=ref;a.hitFlash=100;if(a.hp<=0)killAnimal(a);}
                sfx.playerHit();
                addFloatingText(player.x,player.z,`-${dmg}`,'#e74c3c',40);
                const kb=Math.atan2(player.z-a.z,player.x-a.x); player.x+=Math.cos(kb)*8; player.z+=Math.sin(kb)*8;
                if(player.hp<=0){player.hp=0;gameState='dead';sfx.death();stopBGM();document.getElementById('death-screen').style.display='flex';}
            }
            for(let al of allies){if(dist2D(a.x,a.z,al.x,al.z)<a.size*15+10){const d=Math.max(1,a.atk-al.def);al.hp-=d;addFloatingText(al.x,al.z,`-${d}`,'#ff8888',30);}}
        } else if(a.behavior!=='chase'||cd>=det) {
            a.roamTimer--; if(a.roamTimer<=0){a.targetX=a.x+(Math.random()-0.5)*200;a.targetZ=a.z+(Math.random()-0.5)*200;a.roamTimer=120+Math.random()*120;}
            const ang=Math.atan2(a.targetZ-a.z,a.targetX-a.x);
            if(dist2D(a.x,a.z,a.targetX,a.targetZ)>5){a.x+=Math.cos(ang)*a.speed*0.4;a.z+=Math.sin(ang)*a.speed*0.4;a.facingX=Math.cos(ang)>0?1:-1;}
        }
        a.x=Math.max(10,Math.min(WORLD_W-10,a.x)); a.z=Math.max(10,Math.min(WORLD_H-10,a.z));
        a.mesh.position.set(a.x*S,0,a.z*S);
        // 3D 회전: 이동 방향을 바라봄
        const bodyS=a.mesh.getObjectByName('body');
        if(bodyS && a._prevX !== undefined){
            const dx=a.x-a._prevX, dz=a.z-a._prevZ;
            if(Math.abs(dx)>0.01||Math.abs(dz)>0.01) bodyS.rotation.y=Math.atan2(dx,dz);
        }
        a._prevX=a.x; a._prevZ=a.z;
        updateHpBar(a.mesh,a);
    }
    for(let i=rm.length-1;i>=0;i--){const idx=rm[i];scene.remove(animals[idx].mesh);animalMeshes.splice(animalMeshes.indexOf(animals[idx].mesh),1);animals.splice(idx,1);}
    allies=allies.filter(al=>{if(al.hp<=0){addFloatingText(al.x,al.z,`${al.type} 전사`,'#ff4444',60);scene.remove(al.mesh);return false;}return true;});
}

function updateAllies(dt) {
    for(let i=0;i<allies.length;i++){
        const al=allies[i];
        // 아군 간 겹침 방지
        for(let j=0;j<allies.length;j++){
            if(i===j)continue;
            const other=allies[j];
            const d=dist2D(al.x,al.z,other.x,other.z);
            if(d<25&&d>0){ // 25 단위 이내면 밀어내기
                const ang=Math.atan2(al.z-other.z,al.x-other.x);
                const push=0.5*(25-d)/25;
                al.x+=Math.cos(ang)*push; al.z+=Math.sin(ang)*push;
            }
        }
        // 가장 가까운 적
        let ce=null,cd=Infinity;
        for(let a of animals){if(a.dead)continue;const d=dist2D(al.x,al.z,a.x,a.z);if(d<cd){cd=d;ce=a;}}

        if(al.mode==='heal'){
            const dP=dist2D(al.x,al.z,player.x,player.z);
            if(dP>60){const ang=Math.atan2(player.z-al.z,player.x-al.x);al.x+=Math.cos(ang)*al.speed;al.z+=Math.sin(ang)*al.speed;al.facingX=Math.cos(ang)>0?1:-1;}
            if(Date.now()-al.lastAttack>al.attackCooldown){al.lastAttack=Date.now();
                if(player.hp<player.maxHp){player.hp=Math.min(player.maxHp,player.hp+10);addFloatingText(player.x,player.z,'+10','#44ff44',30);spawnParticle3D(player.x,player.z,0x44ff44,20);}
            }
        } else if(ce&&cd<200){
            if(cd>al.range){
                const ang=Math.atan2(ce.z-al.z,ce.x-al.x);al.x+=Math.cos(ang)*al.speed;al.z+=Math.sin(ang)*al.speed;al.facingX=Math.cos(ang)>0?1:-1;
            }
            if(cd<=al.range+ce.size*10&&Date.now()-al.lastAttack>al.attackCooldown){
                al.lastAttack=Date.now();
                if(al.mode==='ranged'){
                    // 원거리 아군: 투사체 발사
                    const ang=Math.atan2(ce.z-al.z,ce.x-al.x);
                    spawnProjectile(al.x,al.z,Math.cos(ang),Math.sin(ang),al.atk,'ally',al.type==='마법사'?0xaa44ff:0x88cc44,6);
                } else {
                    // 근접
                    const dmg=Math.max(1,al.atk-ce.def); ce.hp-=dmg; ce.hitFlash=100;
                    addFloatingText(ce.x,ce.z,`-${dmg}`,'#44aaff',30);
                    if(al.type==='마법사'){for(let oa of animals){if(oa===ce||oa.dead)continue;if(dist2D(ce.x,ce.z,oa.x,oa.z)<60){const sd=Math.max(1,Math.floor(al.atk*0.5)-oa.def);oa.hp-=sd;oa.hitFlash=80;addFloatingText(oa.x,oa.z,`-${sd}`,'#aa66ff',25);}}}
                    if(ce.hp<=0)killAnimal(ce);
                }
            }
        } else {
            const dP=dist2D(al.x,al.z,player.x,player.z);
            if(dP>50){const ang=Math.atan2(player.z-al.z,player.x-al.x);al.x+=Math.cos(ang)*al.speed*0.8;al.z+=Math.sin(ang)*al.speed*0.8;al.facingX=Math.cos(ang)>0?1:-1;}
        }
        al.x=Math.max(10,Math.min(WORLD_W-10,al.x)); al.z=Math.max(10,Math.min(WORLD_H-10,al.z));
        if(al.mesh){al.mesh.position.set(al.x*S,0,al.z*S);al.mesh.rotation.y=al.facingX===1?0:Math.PI;}
    }
}

function updateProjectiles(dt) {
    const rm=[];
    for(let i=0;i<projectiles.length;i++){
        const p=projectiles[i];
        p.x+=p.vx; p.z+=p.vz; p.life--;
        if(p.mesh)p.mesh.position.set(p.x*S, 1.5, p.z*S);
        if(p.x<0||p.x>WORLD_W||p.z<0||p.z>WORLD_H||p.life<=0){rm.push(i);continue;}
        // 충돌 체크
        for(let a of animals){
            if(a.dead)continue;
            if(dist2D(p.x,p.z,a.x,a.z)<a.size*18+20){
                const dmg=Math.max(1,p.damage-a.def); a.hp-=dmg; a.hitFlash=100;
                addFloatingText(a.x,a.z,`-${dmg}`,p.owner==='player'?'#f1c40f':'#44aaff',35);
                const kb=Math.atan2(a.z-p.z,a.x-p.x); a.x+=Math.cos(kb)*5; a.z+=Math.sin(kb)*5;
                if(a.hp<=0)killAnimal(a);
                rm.push(i); break;
            }
        }
    }
    const unique=[...new Set(rm)].sort((a,b)=>b-a);
    for(let i of unique){if(projectiles[i]&&projectiles[i].mesh)scene.remove(projectiles[i].mesh);projectiles.splice(i,1);}
}

function killAnimal(a) {
    a.dead=true;const data=ANIMAL_DATA[a.type];const cb=1+village.coinBonus+player.coinBonusSk;const coins=Math.floor(data.coin*cb);
    if(!player.bestiary[a.type])player.bestiary[a.type]=0; player.bestiary[a.type]++;
    player.xp+=Math.floor(data.xp*(1+player.xpBonus));player.coins+=coins;
    if(a.isBoss) sfx.bossDie(); else sfx.enemyDie();
    sfx.coin();
    addFloatingText(a.x,a.z-10,`+${data.xp} XP`,'#3498db',50);addFloatingText(a.x,a.z+5,`+${coins} 🪙`,'#f1c40f',50);
    if(a.isBoss)addFloatingText(a.x,a.z-25,'🏆 보스 처치!','#ffd700',80);
    if(a.isFinalBoss){
        if(currentStage===3){
            addFloatingText(a.x,a.z-40,'🎉 게임 클리어!','#ffd700',120);
            setTimeout(()=>showClear(),2000);
        } else {
            addFloatingText(a.x,a.z-40,'🌀 포탈 생성!','#aa00ff',120);
            createPortal(a.x, a.z);sfx.portal();
        }
    }
    for(let i=0;i<(a.isBoss?15:8);i++)spawnParticle3D(a.x+(Math.random()-0.5)*20,a.z+(Math.random()-0.5)*20,data.color,a.isBoss?35:25);
    if(Math.random()<data.dropRate) itemDrops.push({x:a.x+(Math.random()-0.5)*20,z:a.z+(Math.random()-0.5)*20,name:data.drop,type:'material',life:600,mesh:mkDrop(a.x,a.z)});
    checkLevelUp();
}

function createPortal(x,z) {
    const geo=new THREE.TorusGeometry(2,0.3,8,20);
    const mat=new THREE.MeshBasicMaterial({color:0x8800ff,transparent:true,opacity:0.7});
    stagePortal=new THREE.Mesh(geo,mat);
    stagePortal.position.set(x*S,2,z*S); stagePortal.rotation.x=Math.PI/2;
    stagePortal.userData={x,z}; scene.add(stagePortal);
}

function checkPortal() {
    if(!stagePortal)return;
    stagePortal.rotation.z+=0.02;
    if(dist2D(player.x,player.z,stagePortal.userData.x,stagePortal.userData.z)<50) { currentStage===1 ? goToStage2() : goToStage3(); }
}

function mkDrop(x,z){const m=new THREE.Mesh(new THREE.OctahedronGeometry(0.3,0),new THREE.MeshLambertMaterial({color:0x2ecc71,emissive:0x115522}));m.position.set(x*S,0.8,z*S);scene.add(m);return m;}

function updateItemDrops(dt) {
    const rm=[];
    for(let i=0;i<itemDrops.length;i++){const d=itemDrops[i];d.life--;if(d.mesh){d.mesh.rotation.y+=0.05;d.mesh.position.y=0.8+Math.sin(d.life*0.1)*0.2;}
    if(dist2D(player.x,player.z,d.x,d.z)<40*player.magnetRange){player.inventory.push({name:d.name,type:d.type});addFloatingText(d.x,d.z,`+${d.name}`,'#2ecc71',40);d.life=0;}
    if(d.life<=0)rm.push(i);}
    for(let i=rm.length-1;i>=0;i--){if(itemDrops[rm[i]].mesh)scene.remove(itemDrops[rm[i]].mesh);itemDrops.splice(rm[i],1);}
}

function updateEffects(dt) {
    floatingTexts=floatingTexts.filter(t=>{t.life--;return t.life>0;});
    for(let p of particles3D){if(p.mesh){p.mesh.position.x+=p.vx*0.01;p.mesh.position.y+=p.vy*0.01;p.mesh.position.z+=p.vz*0.01;p.vy-=0.02;p.life--;const s=p.life/p.maxLife;p.mesh.scale.set(s,s,s);}}
    particles3D.filter(p=>p.life<=0).forEach(p=>{if(p.mesh)scene.remove(p.mesh);});
    particles3D=particles3D.filter(p=>p.life>0);
}

// ═══════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════
function render3D() {
    if(!renderer)return; renderer.render(scene,cameraObj);
    let ov=document.getElementById('damage-overlay');
    if(!ov){ov=document.createElement('div');ov.id='damage-overlay';document.body.appendChild(ov);}
    ov.innerHTML='';
    for(let t of floatingTexts){
        const pos=new THREE.Vector3(t.x*S,3+(1-t.life/80)*3,t.z*S);pos.project(cameraObj);
        const x=(pos.x*0.5+0.5)*renderer.domElement.clientWidth;
        const y=(-pos.y*0.5+0.5)*renderer.domElement.clientHeight+50;
        if(pos.z<1){const d=document.createElement('div');
        d.style.cssText=`position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);color:${t.color};font-weight:bold;font-size:16px;pointer-events:none;text-shadow:1px 1px 3px rgba(0,0,0,0.7);opacity:${Math.min(1,t.life/15)};`;
        d.textContent=t.text;ov.appendChild(d);}
    }
}

function renderMinimap() {
    const mw=miniCanvas.width,mh=miniCanvas.height,sx=mw/WORLD_W,sy=mh/WORLD_H;
    miniCtx.clearRect(0,0,mw,mh);
    for(let r of REGIONS){miniCtx.fillStyle=r.hex;miniCtx.fillRect(r.x*sx,0,r.w*sx,mh);}
    for(let a of animals){if(a.dead)continue;miniCtx.fillStyle=a.isBoss?'#ff00ff':(a.behavior==='chase'?'#e74c3c':'#f1c40f');miniCtx.fillRect(a.x*sx-1,a.z*sy-1,a.isBoss?4:2,a.isBoss?4:2);}
    for(let al of allies){miniCtx.fillStyle='#44ff44';miniCtx.fillRect(al.x*sx-1,al.z*sy-1,3,3);}
    for(let d of itemDrops){miniCtx.fillStyle='#2ecc71';miniCtx.fillRect(d.x*sx-1,d.z*sy-1,2,2);}
    if(stagePortal){miniCtx.fillStyle='#8800ff';miniCtx.fillRect(stagePortal.userData.x*sx-3,stagePortal.userData.z*sy-3,6,6);}
    miniCtx.fillStyle='#ffaa00';miniCtx.fillRect(1000*sx-2,(WORLD_H/2)*sy-2,4,4);
    // 다른 플레이어 (시안)
    for(const [,p] of mpPlayers){miniCtx.fillStyle='#00ffff';miniCtx.fillRect(p.data.x*sx-2,p.data.z*sy-2,4,4);}
    miniCtx.fillStyle='#fff';miniCtx.fillRect(player.x*sx-2,player.z*sy-2,4,4);
}

function updateHUD() {
    document.getElementById('hp-bar').style.width=(player.hp/player.maxHp*100)+'%';
    document.getElementById('hp-text').textContent=`${Math.ceil(player.hp)}/${player.maxHp}`;
    document.getElementById('xp-bar').style.width=(player.xp/player.xpNext*100)+'%';
    document.getElementById('xp-text').textContent=`${player.xp}/${player.xpNext}`;
    document.getElementById('level-display').textContent=`Lv.${player.level}`;
    document.getElementById('coin-display').textContent=`🪙 ${player.coins}`;
    document.getElementById('civ-display').textContent=`🏛️ ${CIVILIZATIONS[player.civLevel].name}`;
    let rn='???'; for(let r of REGIONS){if(player.x>=r.x&&player.x<r.x+r.w){rn=r.name;break;}}
    document.getElementById('region-display').textContent=`${rn} (${currentStage}스테이지)`;
    const mw=player.weaponMode==='melee'?'⚔️근접':'🏹원거리';
    document.getElementById('equip-display').textContent=`${mw} | 🗡️${player.meleeWeapon?player.meleeWeapon.name:'없음'} | 🏹${player.rangedWeapon?player.rangedWeapon.name:'없음'}`;
    document.getElementById('ally-count').textContent=`👥 ${allies.length}`;
}

// ═══════════════════════════════════════════
// 인벤토리
// ═══════════════════════════════════════════
function toggleInventory(){togglePanel('inventory-panel',renderInventory);}
function renderInventory() {
    const list=document.getElementById('inventory-list');list.innerHTML='';
    if(player.meleeWeapon) list.appendChild(mkInv(player.meleeWeapon.name,`⚔️+${player.meleeWeapon.atk} [장착]`,'해제',()=>{player.meleeWeapon=null;recalcStats();renderInventory();},true));
    if(player.rangedWeapon) list.appendChild(mkInv(player.rangedWeapon.name,`🏹+${player.rangedWeapon.atk} [장착]`,'해제',()=>{player.rangedWeapon=null;recalcStats();renderInventory();},true));
    if(player.armor) list.appendChild(mkInv(player.armor.name,`🛡️+${player.armor.def} [장착]`,'해제',()=>{player.armor=null;recalcStats();renderInventory();},true));
    const counts={};
    for(let item of player.inventory){if(!counts[item.name])counts[item.name]={...item,count:0};counts[item.name].count++;}
    for(let key in counts){
        const it=counts[key];let info=`x${it.count}`,btn=null,act=null;
        const mw=CIV_WEAPONS.find(w=>w.name===key); if(mw){info=`⚔️+${mw.atk} x${it.count}`;btn='장착';act=()=>{player.meleeWeapon=mw;recalcStats();renderInventory();};}
        const rw=CIV_RANGED.find(w=>w.name===key); if(rw){info=`🏹+${rw.atk} x${it.count}`;btn='장착';act=()=>{player.rangedWeapon=rw;recalcStats();renderInventory();};}
        const ar=CIV_ARMORS.find(a=>a.name===key); if(ar){info=`🛡️+${ar.def} x${it.count}`;btn='장착';act=()=>{player.armor=ar;recalcStats();renderInventory();};}
        const po=POTIONS.find(p=>p.name===key); if(po){info=`❤️+${po.heal} x${it.count}`;btn='사용';act=()=>{player.hp=Math.min(player.maxHp,player.hp+po.heal);sfx.heal();rmInv(key);renderInventory();};}
        list.appendChild(mkInv(key,info,btn,act,false));
    }
    if(!list.children.length) list.innerHTML='<p style="text-align:center;color:#8a7a6a;">비어있음</p>';
}
function mkInv(name,info,btnText,act,eq){
    const div=document.createElement('div');div.className='inv-item';
    div.innerHTML=`<div><div class="item-name">${name}</div><div class="item-info">${info}</div></div>`;
    if(btnText){const b=document.createElement('button');b.textContent=btnText;if(eq)b.className='equipped';b.onclick=act;div.appendChild(b);}
    return div;
}
function rmInv(name){const i=player.inventory.findIndex(x=>x.name===name);if(i>=0)player.inventory.splice(i,1);}

// ═══════════════════════════════════════════
// 상점
// ═══════════════════════════════════════════
let shopTab='buy';
function toggleShop(){togglePanel('shop-panel',()=>{shopTab='buy';renderShop();});}
function switchShopTab(tab){shopTab=tab;document.querySelectorAll('.shop-tab').forEach((t,i)=>t.classList.toggle('active',(tab==='buy'&&i===0)||(tab==='sell'&&i===1)));
document.getElementById('shop-buy-list').style.display=tab==='buy'?'block':'none';document.getElementById('shop-sell-list').style.display=tab==='sell'?'block':'none';renderShop();}
function renderShop(){renderShopBuy();renderShopSell();}
function renderShopBuy(){
    const list=document.getElementById('shop-buy-list');list.innerHTML='';
    const addH=t=>{const h=document.createElement('h3');h.style.cssText='color:#f4a460;margin:8px 0;';h.textContent=t;list.appendChild(h);};
    addH('⚔️ 근접 무기');
    CIV_WEAPONS.forEach(w=>{const lk=w.civIdx>player.civLevel;list.appendChild(mkItem(w.name+(lk?` 🔒${CIVILIZATIONS[w.civIdx].name}`:''),`공격력 ${w.desc}`,w.price,()=>buyItem(w,'weapon'),lk));});
    addH('🏹 원거리 무기');
    CIV_RANGED.forEach(w=>{const lk=w.civIdx>player.civLevel;list.appendChild(mkItem(w.name+(lk?` 🔒${CIVILIZATIONS[w.civIdx].name}`:''),`공격력 ${w.desc}`,w.price,()=>buyItem(w,'ranged'),lk));});
    addH('🛡️ 방어구');
    CIV_ARMORS.forEach(a=>{const lk=a.civIdx>player.civLevel;list.appendChild(mkItem(a.name+(lk?` 🔒${CIVILIZATIONS[a.civIdx].name}`:''),`방어력 ${a.desc}`,a.price,()=>buyItem(a,'armor'),lk));});
    addH('🧪 포션');
    POTIONS.forEach(p=>list.appendChild(mkItem(p.name,p.desc,p.price,()=>buyItem(p,'potion'),false)));
}
function renderShopSell(){
    const list=document.getElementById('shop-sell-list');list.innerHTML='';
    const counts={};player.inventory.filter(i=>i.type==='material').forEach(i=>{if(!counts[i.name])counts[i.name]={count:0};counts[i.name].count++;});
    if(!Object.keys(counts).length){list.innerHTML='<p style="text-align:center;color:#8a7a6a;">판매할 아이템 없음</p>';return;}
    const prices={'토끼 가죽':3,'사슴 뿔':8,'멧돼지 엄니':15,'늑대 발톱':25,'곰 가죽':50,'매머드 상아':120,'용암 비늘':80,'마그마 핵':150,'그림자 정수':130,'심연의 갑편':200,'황금 뿔':150,'대왕의 송곳니':250,'폭군의 발톱':350,'고대의 상아':500,'드래곤의 심장':1000,'차원의 보석':3000,'부서진 뼈':60,'저주받은 화살':80,'독 송곳니':70,'늪지 점액':100,'화염 정수':150,'마그마 심장':200,'드래곤 비늘':180,'드레이크 화염낭':250,'해골 갑편':200,'뼈 드래곤 이빨':350,'저주의 지팡이':250,'죽음의 검편':400,'장군의 왕관':700,'히드라의 심장':1000,'용암 왕관':1500,'드래곤 왕의 눈':3000,'불멸의 뼈':8000,'해파리 촉수':300,'소행성 핵':400,'성운 정수':350,'차원 조각':450,'외계 금속':500,'외계 합금':550,'중력 코어':600,'시간 결정':650,'천사 깃털':800,'빛의 화살':750,'타락의 날개':900,'신성한 인장':1000,'여왕의 결정':2000,'성운의 심장':3000,'사령관의 장치':4000,'블랙홀 코어':6000,'창조의 조각':15000};
    for(let k in counts) list.appendChild(mkItem(k,`x${counts[k].count}`,prices[k]||5,()=>sellItem(k,prices[k]||5),false,true));
}
function buyItem(item,type){if(item.civIdx!==undefined&&item.civIdx>player.civLevel)return;if(player.coins<item.price)return;player.coins-=item.price;player.inventory.push({name:item.name,type});sfx.buy();renderShop();}
function sellItem(name,price){const i=player.inventory.findIndex(x=>x.name===name&&x.type==='material');if(i>=0){player.inventory.splice(i,1);player.coins+=price;renderShop();}}

// ═══════════════════════════════════════════
// 유틸리티
// ═══════════════════════════════════════════
function dist2D(x1,z1,x2,z2){return Math.sqrt((x2-x1)**2+(z2-z1)**2);}
function addFloatingText(x,z,text,color,life){floatingTexts.push({x,z,text,color,life});}
function spawnParticle3D(x,z,color,life){
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.15,4,4),new THREE.MeshBasicMaterial({color}));
    m.position.set(x*S,1+Math.random()*2,z*S);scene.add(m);
    particles3D.push({mesh:m,vx:(Math.random()-0.5)*5,vy:Math.random()*5,vz:(Math.random()-0.5)*5,life,maxLife:life});
}
function spawnLevelUpParticles(){for(let i=0;i<20;i++){const a=(Math.PI*2/20)*i;spawnParticle3D(player.x+Math.cos(a)*20,player.z+Math.sin(a)*20,[0xf1c40f,0xe67e22,0xe74c3c][i%3],40);}}
function togglePanel(id,renderFn){
    const p=document.getElementById(id);
    closeOtherPanels(id);
    if(p.style.display==='none'){p.style.display='block';paused=true;if(renderFn)renderFn();}
    else{p.style.display='none';paused=false;}
}
function closeOtherPanels(ex){['inventory-panel','shop-panel','civ-panel','village-panel','bestiary-panel','skill-tree-panel'].forEach(id=>{if(id!==ex)document.getElementById(id).style.display='none';});}
function mkItem(name,desc,price,action,disabled,isSell=false){
    const div=document.createElement('div');div.className='shop-item';if(disabled)div.style.opacity='0.5';
    div.innerHTML=`<div><div class="item-name">${name}</div><div class="item-desc">${desc}</div></div><div style="display:flex;align-items:center;gap:8px;"><span class="item-price">🪙 ${price}</span></div>`;
    const btn=document.createElement('button');btn.textContent=isSell?'판매':'구매';btn.disabled=disabled||(!isSell&&player.coins<price);btn.onclick=action;
    div.querySelector('div:last-child').appendChild(btn);return div;
}
// ═══════════════════════════════════════════
// 도감
// ═══════════════════════════════════════════
function toggleBestiary(){togglePanel('bestiary-panel',renderBestiary);}
let bestiaryStageTab=1;
function renderBestiary(){
    // 탭
    const tabs=document.getElementById('bestiary-tabs'); tabs.innerHTML='';
    [1,2,3].forEach(s=>{
        const btn=document.createElement('button');
        btn.textContent=`스테이지 ${s}`;
        btn.style.cssText=`padding:4px 12px;font-size:0.8rem;border:1px solid #8b5e3c;border-radius:4px;cursor:pointer;${bestiaryStageTab===s?'background:#6b4a3a;color:#fff;':'background:#3a2a1a;color:#a09080;'}`;
        btn.onclick=()=>{bestiaryStageTab=s;renderBestiary();};
        tabs.appendChild(btn);
    });
    const list=document.getElementById('bestiary-list'); list.innerHTML='';
    // 해당 스테이지 동물 목록
    const stageAnimals=[];
    const regions=bestiaryStageTab===1?STAGE1_REGIONS:bestiaryStageTab===2?STAGE2_REGIONS:STAGE3_REGIONS;
    const seen=new Set();
    for(const r of regions){
        for(const a of r.animals){if(!seen.has(a)){seen.add(a);stageAnimals.push(a);}}
        if(r.boss&&!seen.has(r.boss)){seen.add(r.boss);stageAnimals.push(r.boss);}
    }
    // 최종보스 추가
    const fbNames={1:'심연의 군주',2:'스켈레톤 드래곤',3:'창조의 신'};
    const fb=fbNames[bestiaryStageTab];
    if(fb&&!seen.has(fb)){seen.add(fb);stageAnimals.push(fb);}

    for(const type of stageAnimals){
        const data=ANIMAL_DATA[type]; if(!data) continue;
        const killed=player.bestiary[type]||0;
        const discovered=killed>0;
        const card=document.createElement('div');
        card.style.cssText=`display:flex;align-items:center;gap:10px;padding:6px;margin:4px 0;border:1px solid ${data.isBoss?'#ffd700':'#5a4a3a'};border-radius:6px;background:rgba(0,0,0,0.2);`;
        // 캔버스 프리뷰
        const cvWrap=document.createElement('div');
        cvWrap.style.cssText='flex-shrink:0;width:64px;height:64px;';
        if(discovered){
            const tex=makeAnimalTex(type);
            const prevCv=document.createElement('canvas');prevCv.width=64;prevCv.height=64;
            const pc=prevCv.getContext('2d');
            pc.drawImage(tex.image,0,0,128,128,0,0,64,64);
            prevCv.style.cssText='width:64px;height:64px;';
            cvWrap.appendChild(prevCv);
        } else {
            const prevCv=document.createElement('canvas');prevCv.width=64;prevCv.height=64;
            const pc=prevCv.getContext('2d');
            // 실루엣
            const tex=makeAnimalTex(type);
            pc.drawImage(tex.image,0,0,128,128,0,0,64,64);
            pc.globalCompositeOperation='source-in';
            pc.fillStyle='#222';pc.fillRect(0,0,64,64);
            prevCv.style.cssText='width:64px;height:64px;opacity:0.5;';
            cvWrap.appendChild(prevCv);
        }
        card.appendChild(cvWrap);
        // 정보
        const info=document.createElement('div');info.style.cssText='flex:1;font-size:0.75rem;';
        if(discovered){
            info.innerHTML=`<div style="font-weight:bold;color:${data.isBoss?'#ffd700':'#e8d8c0'};font-size:0.85rem;">${data.isBoss?'⭐ ':''}${type}</div>
            <div style="color:#a09080;">HP:${data.hp} ATK:${data.atk} DEF:${data.def}</div>
            <div style="color:#a09080;">XP:${data.xp} 🪙${data.coin}</div>
            <div style="color:#7a9a7a;">드롭: ${data.drop}</div>
            <div style="color:#8a8a6a;">처치: ${killed}회</div>`;
        } else {
            info.innerHTML=`<div style="font-weight:bold;color:#5a5a5a;font-size:0.85rem;">${data.isBoss?'⭐ ':''}???</div>
            <div style="color:#4a4a4a;">미발견</div>`;
        }
        card.appendChild(info);
        list.appendChild(card);
    }
    if(!stageAnimals.length) list.innerHTML='<p style="text-align:center;color:#8a7a6a;">데이터 없음</p>';
}

function hexToCSS(hex){return'#'+hex.toString(16).padStart(6,'0');}

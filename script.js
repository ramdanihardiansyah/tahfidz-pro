const PIN_DEFAULT = "1234";
const databaseAyat = {
  "Al-Fatihah":7,"Al-Baqarah":286,"Ali 'Imran":200,"An-Nisa'":176,"Al-Ma'idah":120,
  "Al-An'am":165,"Al-A'raf":206,"Al-Anfal":75,"At-Tawbah":129,"Yunus":109,"Hud":123,
  "Yusuf":111,"Ar-Ra'd":43,"Ibrahim":52,"Al-Hijr":99,"An-Nahl":128,"Al-Isra'":111,
  "Al-Kahf":110,"Maryam":98,"Ta-Ha":135,"Al-Anbiya'":112,"Al-Hajj":78,"Al-Mu'minun":118,
  "An-Nur":64,"Al-Furqan":77,"Asy-Syu'ara'":227,"An-Naml":93,"Al-Qashash":88,
  "Al-'Ankabut":69,"Ar-Rum":60,"Luqman":34,"As-Sajdah":30,"Al-Ahzab":73,"Saba'":54,
  "Fatir":45,"Ya-Sin":83,"As-Saffat":182,"Sad":88,"Az-Zumar":75,"Ghafir":85,
  "Fussilat":54,"Asy-Syura":53,"Az-Zukhruf":89,"Ad-Dukhan":59,"Al-Jathiyah":37,
  "Al-Ahqaf":35,"Muhammad":38,"Al-Fath":29,"Al-Hujurat":18,"Qaf":45,"Adh-Dhariyat":60,
  "At-Tur":49,"An-Najm":62,"Al-Qamar":55,"Ar-Rahman":78,"Al-Waqi'ah":96,"Al-Hadid":29,
  "Al-Mujadilah":22,"Al-Hashr":24,"Al-Mumtahanah":13,"As-Saff":14,"Al-Jumu'ah":11,
  "Al-Munafiqun":11,"At-Taghabun":18,"At-Talaq":12,"At-Tahrim":12,"Al-Mulk":30,
  "Al-Qalam":52,"Al-Haqqah":52,"Al-Ma'arij":44,"Nuh":28,"Al-Jinn":28,"Al-Muzzammil":20,
  "Al-Muddathir":56,"Al-Qiyamah":40,"Al-Insan":31,"Al-Mursalat":50,"An-Naba'":40,
  "An-Nazi'at":46,"'Abasa":42,"At-Takwir":29,"Al-Infitar":19,"Al-Mutaffifin":36,
  "Al-Inshiqaq":25,"Al-Buruj":22,"At-Tariq":17,"Al-A'la":19,"Al-Ghashiyah":26,
  "Al-Fajr":30,"Al-Balad":20,"Asy-Shams":15,"Al-Layl":21,"Ad-Duha":11,"Ash-Sharh":8,
  "At-Tin":8,"Al-'Alaq":19,"Al-Qadr":5,"Al-Bayyinah":8,"Az-Zalzalah":8,"Al-'Adiyat":11,
  "Al-Qari'ah":11,"At-Takathur":8,"Al-'Asr":3,"Al-Humazah":9,"Al-Fil":5,"Quraysh":4,
  "Al-Ma'un":7,"Al-Kawthar":3,"Al-Kafirun":6,"An-Nashr":3,"Al-Masad":5,"Al-Ikhlas":4,
  "Al-Falaq":5,"An-Nas":6
};
const daftarSurat = Object.keys(databaseAyat);
const TOTAL_AYAT_QURAN = Object.values(databaseAyat).reduce((a,b)=>a+b,0);
const avatarColors = ['#059669','#0d9488','#0284c7','#7c3aed','#db2777','#ea580c','#ca8a04','#16a34a','#0891b2','#6d28d9'];

let dataSiswa = JSON.parse(localStorage.getItem('tahfidz_v3')) || [];
let dataTarget = JSON.parse(localStorage.getItem('tahfidz_target')) || {};
let currentFilter = 'All';
let currentStatusFilter = 'All';
let currentPage = 'dashboard';
let statusChartInstance = null, rekapChartInstance = null, historyMiniChart = null;
let rekapPeriode = 'minggu';
let quranSurahList = [], currentSurahNumber = null, currentAyatData = [];
let showTranslation = true, audioPlayer = null, isPlaying = false;

function getAvatarColor(nama){ return avatarColors[nama.charCodeAt(0) % avatarColors.length]; }
function hitungTotalAyat(surat, ayat){
  let t=0;
  for(const s of daftarSurat){ if(s===surat){t+=ayat;break;} t+=databaseAyat[s]; }
  return t;
}
function getDaftarKelas(){
  const s = JSON.parse(localStorage.getItem('tahfidz_settings')||'{}');
  return s.daftarKelas && s.daftarKelas.length>0 ? s.daftarKelas : ['1','2','3','4','5','6'];
}
function hariTanpaSedang(s){
  if(!s.history||s.history.length===0) return 999;
  const last = s.history[s.history.length-1].tanggal;
  return Math.floor((new Date()-new Date(last))/(1000*60*60*24));
}
function simpanData(){
  localStorage.setItem('tahfidz_v3', JSON.stringify(dataSiswa));
}

// =============================================
// SHOW / HIDE APP
// =============================================
function showApp(){
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appView').classList.remove('hidden');
}
function showLogin(){
  document.getElementById('appView').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}

// =============================================
// LOGIN
// =============================================
window.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('pinInput').addEventListener('keydown', e=>{ if(e.key==='Enter') checkPinStep(); });
  // SweetAlert fallback
  if(typeof Swal==='undefined'){
    window.Swal={fire:function(o){
      if(o.showCancelButton){const ok=confirm((o.title||'')+'\n'+(o.text||''));return Promise.resolve({isConfirmed:ok});}
      else{alert((o.title||'')+'\n'+(o.text||''));return Promise.resolve({isConfirmed:true});}
    }};
  }
  // Auto-login
  if(sessionStorage.getItem('isLoggedIn')==='true'){
    showApp();
    init();
  }
  if(localStorage.getItem('darkMode')==='true') applyDarkMode(true);
});

function checkPinStep(){
  const input = document.getElementById('pinInput').value;
  const settings = JSON.parse(localStorage.getItem('tahfidz_settings')||'{}');
  const correctPIN = settings.pin || PIN_DEFAULT;
  if(input===correctPIN){
    document.getElementById('loginError').classList.add('hidden');
    // Pre-fill
    if(settings.namaGuru) document.getElementById('loginNamaGuru').value = settings.namaGuru;
    if(settings.namaLembaga) document.getElementById('loginNamaLembaga').value = settings.namaLembaga;
    if(settings.namaKepala) document.getElementById('loginNamaKepala').value = settings.namaKepala;
    if(settings.logoData){
      const prev=document.getElementById('logoPreview');
      prev.innerHTML=`<img src="${settings.logoData}" style="width:100%;height:100%;object-fit:contain;border-radius:10px;">`;
      prev.dataset.logoData=settings.logoData;
    }
    renderLoginKelasList();
    document.getElementById('loginStep1').classList.add('hidden');
    document.getElementById('loginStep2').classList.remove('hidden');
  } else {
    document.getElementById('loginError').classList.remove('hidden');
    document.getElementById('pinInput').value='';
    const card=document.getElementById('loginCard');
    card.style.animation='shake .4s ease';
    setTimeout(()=>card.style.animation='',400);
  }
}

function backToStep1(){
  document.getElementById('loginStep2').classList.add('hidden');
  document.getElementById('loginStep1').classList.remove('hidden');
  document.getElementById('pinInput').value='';
}

function previewLogo(event){
  const file=event.target.files[0];
  if(!file) return;
  if(file.size>1024*1024){showToast('Ukuran logo maksimal 1MB','warning');return;}
  const reader=new FileReader();
  reader.onload=e=>{
    const prev=document.getElementById('logoPreview');
    prev.innerHTML=`<img src="${e.target.result}" style="width:100%;height:100%;object-fit:contain;border-radius:10px;">`;
    prev.dataset.logoData=e.target.result;
  };
  reader.readAsDataURL(file);
}

function finishLogin(){
  const namaGuru=document.getElementById('loginNamaGuru').value.trim();
  const namaLembaga=document.getElementById('loginNamaLembaga').value.trim();
  const namaKepala=document.getElementById('loginNamaKepala').value.trim();
  const err=document.getElementById('loginStep2Error');
  if(!namaGuru||!namaLembaga){err.classList.remove('hidden');return;}
  err.classList.add('hidden');
  const daftarKelas=collectKelasList('login');
  const settings=JSON.parse(localStorage.getItem('tahfidz_settings')||'{}');
  settings.namaGuru=namaGuru;settings.namaLembaga=namaLembaga;settings.namaKepala=namaKepala;settings.daftarKelas=daftarKelas;
  const logoPrev=document.getElementById('logoPreview');
  if(logoPrev.dataset.logoData) settings.logoData=logoPrev.dataset.logoData;
  localStorage.setItem('tahfidz_settings',JSON.stringify(settings));
  sessionStorage.setItem('isLoggedIn','true');
  showApp();
  init();
}

function logout(){
  Swal.fire({title:'Keluar?',text:'Layar akan dikunci.',icon:'warning',showCancelButton:true,confirmButtonText:'Ya',cancelButtonText:'Batal',confirmButtonColor:'#ef4444'})
  .then(r=>{if(r.isConfirmed){sessionStorage.removeItem('isLoggedIn');location.reload();}});
}

// =============================================
// KELAS HELPERS
// =============================================
function renderLoginKelasList(){
  const settings=JSON.parse(localStorage.getItem('tahfidz_settings')||'{}');
  const kelas=settings.daftarKelas||['1','2','3','4','5','6'];
  const c=document.getElementById('loginKelasList');
  if(!c) return;
  c.innerHTML='';
  kelas.forEach((k,i)=>c.insertAdjacentHTML('beforeend',kelasRowHTML(k,i,'login')));
}
function renderSettingKelasList(){
  const settings=JSON.parse(localStorage.getItem('tahfidz_settings')||'{}');
  const kelas=settings.daftarKelas||['1','2','3','4','5','6'];
  const c=document.getElementById('settingKelasList');
  if(!c) return;
  c.innerHTML='';
  kelas.forEach((k,i)=>c.insertAdjacentHTML('beforeend',kelasRowHTML(k,i,'setting')));
}
function kelasRowHTML(value,idx,prefix){
  return `<div style="display:flex;align-items:center;gap:6px;">
    <input type="text" value="${value}" id="${prefix}Kelas_${idx}" class="form-input" placeholder="Nama kelas" style="flex:1;padding:8px 12px;font-size:13px;" maxlength="30">
    <button type="button" onclick="this.closest('div').remove()" style="width:32px;height:32px;border-radius:8px;background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-times"></i></button>
  </div>`;
}
function loginTambahKelas(){
  const c=document.getElementById('loginKelasList');
  const idx=c.querySelectorAll('input[type=text]').length;
  c.insertAdjacentHTML('beforeend',kelasRowHTML('',idx,'login'));
}
function settingTambahKelas(){
  const c=document.getElementById('settingKelasList');
  const idx=c.querySelectorAll('input[type=text]').length;
  c.insertAdjacentHTML('beforeend',kelasRowHTML('',idx,'setting'));
}
function collectKelasList(prefix){
  const inputs=document.querySelectorAll(`#${prefix}KelasList input[type=text]`);
  const kelas=[];
  inputs.forEach(inp=>{const v=inp.value.trim();if(v&&!kelas.includes(v))kelas.push(v);});
  return kelas.length>0?kelas:['1','2','3','4','5','6'];
}
function populateAllKelasSelects(){
  const kelas=getDaftarKelas();
  const selects=['inputKelas','setoranFilterKelas','rekapKelas','printKelasSelect'];
  selects.forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    const hasAll=id!=='inputKelas';
    const cur=el.value;
    el.innerHTML=hasAll?'<option value="All">Semua Kelas</option>':'';
    kelas.forEach(k=>el.insertAdjacentHTML('beforeend',`<option value="${k}">Kelas ${k}</option>`));
    if([...el.options].some(o=>o.value===cur)) el.value=cur;
  });
}
function renderFilterButtons(){
  const c=document.getElementById('filterKelasContainer');if(!c)return;
  c.innerHTML='';
  getDaftarKelas().forEach(k=>{
    c.insertAdjacentHTML('beforeend',`<button onclick="setFilter('${k}')" id="btn-kelas-${k}" class="sidebar-btn"><i class="fas fa-graduation-cap" style="font-size:11px;"></i><span>Kelas ${k}</span></button>`);
  });
}
function populateSurat(){
  ['inputSurat','targetSurat'].forEach(id=>{
    const s=document.getElementById(id);if(!s)return;
    s.innerHTML='';
    daftarSurat.forEach(x=>s.insertAdjacentHTML('beforeend',`<option value="${x}">${x}</option>`));
  });
}

// =============================================
// NAVIGASI
// =============================================
function setPage(page){
  currentPage=page;
  ['dashboard','rekap','target','doa'].forEach(p=>{
    const el=document.getElementById(`page-${p}`);
    if(el){if(p===page){el.classList.remove('hidden');}else{el.classList.add('hidden');}}
    const btn=document.getElementById(`nav-${p}`);
    if(btn) btn.classList.toggle('active',p===page);
  });
  if(page==='dashboard') renderDashboard();
  if(page==='rekap') renderRekap();
  if(page==='target') renderTarget();
  if(page==='doa') renderDoa('pagi');
  closeSidebar();
}
function setFilter(kls){
  currentFilter=kls;
  ['dashboard','rekap','target'].forEach(p=>{const b=document.getElementById(`nav-${p}`);if(b)b.classList.remove('active');});
  const db=document.getElementById('nav-dashboard');if(db)db.classList.add('active');
  document.querySelectorAll('#filterKelasContainer button').forEach(b=>b.classList.remove('active'));
  const kb=document.getElementById(`btn-kelas-${kls}`);if(kb)kb.classList.add('active');
  document.getElementById('titleDisplay').innerText=`Kelas ${kls}`;
  setPage('dashboard');
}

// =============================================
// CRUD SISWA
// =============================================
function openModal(id){
  document.getElementById('inputTanggal').value=new Date().toISOString().split('T')[0];
  if(id){
    const s=dataSiswa.find(x=>x.id===id);
    document.getElementById('siswaId').value=s.id;
    document.getElementById('inputNama').value=s.nama;
    document.getElementById('inputKelas').value=s.kelas;
    document.getElementById('inputSurat').value=s.suratTerakhir;
    document.getElementById('inputAyat').value=s.ayatTerakhir;
    document.getElementById('inputStatus').value=s.status;
    document.getElementById('modalTitle').innerText='Update Setoran Siswa';
    updateMaxAyatHint();
  } else {
    document.getElementById('siswaForm').reset();
    document.getElementById('siswaId').value='';
    document.getElementById('inputTanggal').value=new Date().toISOString().split('T')[0];
    document.getElementById('modalTitle').innerText='Tambah Siswa Baru';
    updateMaxAyatHint();
  }
  document.getElementById('siswaModal').style.display='flex';
}
function closeModal(){ document.getElementById('siswaModal').style.display='none'; }
function updateMaxAyatHint(){
  const sur=document.getElementById('inputSurat').value;
  const max=databaseAyat[sur]||0;
  const hint=document.getElementById('maxAyatHint');
  if(hint) hint.innerText=`/ ${max}`;
  const inp=document.getElementById('inputAyat');
  if(inp) inp.max=max;
}
function validasiMaksimalAyat(){
  updateMaxAyatHint();
  const inp=document.getElementById('inputAyat');
  const sur=document.getElementById('inputSurat').value;
  const max=databaseAyat[sur]||300;
  if(parseInt(inp.value)>max){
    inp.value=max;
    Swal.fire({icon:'info',title:'Batas Ayat',text:`Surat ${sur} hanya ada ${max} ayat.`,timer:2000,showConfirmButton:false});
  }
}
function saveSiswa(e){
  e.preventDefault();
  const id=document.getElementById('siswaId').value;
  const nama=document.getElementById('inputNama').value.trim();
  const kelas=document.getElementById('inputKelas').value;
  const tgl=document.getElementById('inputTanggal').value;
  const surat=document.getElementById('inputSurat').value;
  const ayat=parseInt(document.getElementById('inputAyat').value);
  const status=document.getElementById('inputStatus').value;
  if(!id){
    const isExist=dataSiswa.find(x=>x.nama.toLowerCase()===nama.toLowerCase()&&x.kelas===kelas);
    if(isExist){
      Swal.fire({
        icon:'error',
        title:'Nama Sudah Terdaftar',
        html:`<div style="text-align:left;">
          <p style="margin-bottom:12px;">Santri dengan nama <strong>"${nama}"</strong> sudah terdaftar di kelas <strong>${kelas}</strong>.</p>
          <div style="background:#f8fafc;padding:14px;border-radius:10px;border-left:3px solid var(--gold);">
            <div style="font-size:12px;color:#64748b;margin-bottom:6px;font-weight:600;">📊 Data yang ada:</div>
            <div style="font-weight:700;font-size:14px;color:var(--s800);margin-bottom:4px;">👤 ${isExist.nama}</div>
            <div style="font-size:12px;color:#94a3b8;">Kelas: <span style="font-weight:600;color:var(--s700);">${isExist.kelas}</span></div>
            <div style="font-size:12px;color:#94a3b8;">Posisi: <span style="font-weight:600;color:var(--g700);">${isExist.suratTerakhir} ayat ${isExist.ayatTerakhir}</span></div>
          </div>
          <p style="margin-top:12px;font-size:13px;color:#64748b;">💡 Silakan gunakan nama yang berbeda atau edit data santri yang sudah ada.</p>
        </div>`,
        confirmButtonText:'Mengerti',
        confirmButtonColor:'var(--g600)',
        width:'480px'
      });
      return;
    }
    dataSiswa.push({id:Date.now(),nama,kelas,status,hadir:true,suratTerakhir:surat,ayatTerakhir:ayat,history:[{tanggal:tgl,surat,ayat}]});
  } else {
    // Saat edit, cek apakah nama baru sudah dipakai siswa lain
    const namaLainSama=dataSiswa.find(x=>x.id!=id && x.nama.toLowerCase()===nama.toLowerCase() && x.kelas===kelas);
    if(namaLainSama){
      Swal.fire({
        icon:'error',
        title:'Nama Sudah Digunakan',
        html:`<div style="text-align:left;">
          <p style="margin-bottom:10px;">Nama <strong>"${nama}"</strong> sudah digunakan oleh santri lain di kelas <strong>${kelas}</strong>.</p>
          <p style="font-size:13px;color:#64748b;">Silakan gunakan nama yang berbeda.</p>
        </div>`,
        confirmButtonText:'Mengerti',
        confirmButtonColor:'var(--g600)'
      });
      return;
    }
    const i=dataSiswa.findIndex(x=>x.id==id);
    const prev=dataSiswa[i];
    const dupIdx=prev.history.findIndex(h=>h.tanggal===tgl&&h.surat===surat);
    if(dupIdx>=0) prev.history[dupIdx].ayat=ayat;
    else{prev.history.push({tanggal:tgl,surat,ayat});prev.history.sort((a,b)=>new Date(a.tanggal)-new Date(b.tanggal));}
    prev.nama=nama;prev.kelas=kelas;prev.status=status;prev.suratTerakhir=surat;prev.ayatTerakhir=ayat;
  }
  simpanData();closeModal();renderDashboard();cekStagnan();
  Swal.fire({icon:'success',title:'Tersimpan!',timer:900,showConfirmButton:false});
}
function deleteSiswa(id){
  Swal.fire({title:'Hapus Siswa?',text:'Semua riwayat akan hilang.',icon:'warning',showCancelButton:true,confirmButtonText:'Hapus',cancelButtonText:'Batal',confirmButtonColor:'#ef4444'})
  .then(r=>{if(r.isConfirmed){dataSiswa=dataSiswa.filter(x=>x.id!==id);simpanData();renderDashboard();}});
}
function toggleAbsensi(id){
  const idx=dataSiswa.findIndex(x=>x.id===id);if(idx===-1)return;
  dataSiswa[idx].hadir=dataSiswa[idx].hadir===false?true:false;
  simpanData();renderDashboard();
}

// =============================================
// RENDER DASHBOARD
// =============================================
function renderDashboard(){
  const tbody=document.getElementById('siswaTableBody');if(!tbody)return;
  tbody.innerHTML='';
  const settings=JSON.parse(localStorage.getItem('tahfidz_settings')||'{}');
  const threshold=settings.stagnanDays||7;
  let filtered=dataSiswa.filter(x=>{
    const mk=currentFilter==='All'||x.kelas==currentFilter;
    const ms=currentStatusFilter==='All'||x.status===currentStatusFilter;
    return mk&&ms;
  });
  const q=(document.getElementById('searchInput')?.value||'').toLowerCase();
  if(q) filtered=filtered.filter(x=>x.nama.toLowerCase().includes(q));
  const sort=document.getElementById('sortSelect')?.value||'nama';
  if(sort==='nama') filtered.sort((a,b)=>a.nama.localeCompare(b.nama));
  if(sort==='kelas') filtered.sort((a,b)=>String(a.kelas).localeCompare(String(b.kelas)));
  if(sort==='progress') filtered.sort((a,b)=>hitungTotalAyat(b.suratTerakhir,b.ayatTerakhir)-hitungTotalAyat(a.suratTerakhir,a.ayatTerakhir));
  if(sort==='stagnan') filtered.sort((a,b)=>hariTanpaSedang(b)-hariTanpaSedang(a));

  document.getElementById('statTotal').innerText=filtered.length;
  document.getElementById('statLancar').innerText=filtered.filter(x=>x.status==='Lancar').length;
  document.getElementById('statMurajaah').innerText=filtered.filter(x=>x.status==='Murajaah').length;
  document.getElementById('statBimbingan').innerText=filtered.filter(x=>x.status==='Perlu Bimbingan').length;
  const cb=document.getElementById('countBadge');if(cb) cb.innerText=`${filtered.length} siswa`;
  updatePieChart(filtered);

  if(filtered.length===0){
    tbody.innerHTML=`<tr><td colspan="5" style="padding:60px;text-align:center;color:#94a3b8;">
      <i class="fas fa-inbox" style="font-size:36px;display:block;margin-bottom:12px;opacity:.4;"></i>
      <p style="font-weight:700;">Belum ada data</p><p style="font-size:13px;">Klik "Tambah Siswa" untuk memulai.</p>
    </td></tr>`;return;
  }
  filtered.forEach(s=>{
    const max=databaseAyat[s.suratTerakhir]||1;
    const persen=Math.min((s.ayatTerakhir/max)*100,100);
    const selesai=s.ayatTerakhir>=max;
    const color=getAvatarColor(s.nama);
    const hari=hariTanpaSedang(s);
    const stagnan=hari>threshold;
    const absenBorder=s.hadir===false?'#ef4444':'transparent';
    const progressClass=selesai?'complete':persen>60?'':'';
    const badgeClass=s.status==='Lancar'?'badge-lancar':s.status==='Murajaah'?'badge-murajaah':'badge-bimbingan';
    tbody.insertAdjacentHTML('beforeend',`<tr>
      <td style="padding:14px 20px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="position:relative;">
            <div class="avatar" style="background:${color};border:2.5px solid ${absenBorder};">${s.nama.charAt(0).toUpperCase()}</div>
            ${selesai?`<div style="position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;background:#b8860b;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;"><i class="fas fa-star" style="font-size:7px;color:white;"></i></div>`:''}
          </div>
          <div>
            <div style="font-weight:700;font-size:14px;cursor:pointer;" onclick="showDetail(${s.id})">${s.nama}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
              <button onclick="toggleAbsensi(${s.id})" style="font-size:10px;font-weight:700;background:none;border:none;cursor:pointer;color:${s.hadir===false?'#ef4444':'#10b981'};">${s.hadir===false?'🔴 Alpa':'🟢 Hadir'}</button>
              ${stagnan?`<span class="badge badge-stagnan">⏰ ${hari}h</span>`:''}
            </div>
          </div>
        </div>
      </td>
      <td style="padding:14px 20px;"><span style="background:#f1f5f9;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:700;color:#475569;">Kls ${s.kelas}</span></td>
      <td style="padding:14px 20px;min-width:200px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#64748b;margin-bottom:5px;">
          <span>${s.suratTerakhir} · ${s.ayatTerakhir}/${max}</span>
          <span style="color:${selesai?'#b8860b':'#064e3b'};">${selesai?'🏆 Khatam!':Math.round(persen)+'%'}</span>
        </div>
        <div class="progress-track"><div class="progress-fill ${progressClass}" style="width:${persen}%;"></div></div>
      </td>
      <td style="padding:14px 20px;text-align:center;"><span class="badge ${badgeClass}">${s.status}</span></td>
      <td style="padding:14px 20px;text-align:center;">
        <div style="display:flex;justify-content:center;gap:4px;">
          <button onclick="sendWA(${s.id})" title="WhatsApp" style="width:30px;height:30px;border-radius:8px;background:rgba(16,185,129,.1);color:#059669;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;"><i class="fab fa-whatsapp"></i></button>
          <button onclick="openNotes(${s.id})" title="Catatan" style="width:30px;height:30px;border-radius:8px;background:rgba(184,134,11,.1);color:#b8860b;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;position:relative;">${s.catatan?'<span style="position:absolute;top:4px;right:4px;width:6px;height:6px;background:#b8860b;border-radius:50%;"></span>':''}<i class="fas fa-sticky-note"></i></button>
          <button onclick="printRapor(${s.id})" title="Cetak" style="width:30px;height:30px;border-radius:8px;background:rgba(100,116,139,.1);color:#475569;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-print"></i></button>
          <button onclick="openModal(${s.id})" title="Edit" style="width:30px;height:30px;border-radius:8px;background:rgba(2,132,199,.1);color:#0284c7;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-edit"></i></button>
          <button onclick="deleteSiswa(${s.id})" title="Hapus" style="width:30px;height:30px;border-radius:8px;background:rgba(239,68,68,.1);color:#ef4444;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`);
  });
}

function cekStagnan(){
  const settings=JSON.parse(localStorage.getItem('tahfidz_settings')||'{}');
  const threshold=settings.stagnanDays||7;
  const stagnan=dataSiswa.filter(s=>hariTanpaSedang(s)>threshold);
  const alert=document.getElementById('stagnanAlert');
  const list=document.getElementById('stagnanList');
  if(!alert||!list)return;
  if(stagnan.length===0){alert.classList.add('hidden');return;}
  alert.classList.remove('hidden');
  list.innerHTML='';
  stagnan.forEach(s=>{
    const hari=hariTanpaSedang(s);
    list.insertAdjacentHTML('beforeend',`<div class="alert-stagnan">
      <div class="alert-stagnan-icon"><i class="fas fa-clock"></i></div>
      <div style="flex:1;"><div style="font-weight:700;font-size:14px;">${s.nama}</div><div style="font-size:12px;color:#64748b;">Kelas ${s.kelas} · Terakhir ${hari===999?'belum pernah':hari+' hari lalu'}</div></div>
      <button onclick="openModal(${s.id})" style="background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;"><i class="fas fa-plus"></i> Input</button>
    </div>`);
  });
}

// =============================================
// PIE CHART
// =============================================
function updatePieChart(data){
  const ctx=document.getElementById('statusPieChart')?.getContext('2d');if(!ctx)return;
  if(statusChartInstance) statusChartInstance.destroy();
  const lancar=data.filter(x=>x.status==='Lancar').length;
  const murajaah=data.filter(x=>x.status==='Murajaah').length;
  const lainnya=data.filter(x=>x.status!=='Lancar'&&x.status!=='Murajaah').length;
  statusChartInstance=new Chart(ctx,{
    type:'doughnut',
    data:{datasets:[{data:[lancar,murajaah,lainnya],backgroundColor:['#10b981','#f59e0b','#ef4444'],borderWidth:0}]},
    options:{cutout:'72%',plugins:{legend:{display:false}},animation:{animateRotate:true}}
  });
}

// =============================================
// FILTER STATUS
// =============================================
function setStatusFilter(status){
  currentStatusFilter=status;
  ['All','Lancar','Murajaah','PerluBimbingan'].forEach(f=>{
    const btn=document.getElementById('btnFilter'+f);
    if(btn) btn.classList.toggle('active',f===status||(f==='PerluBimbingan'&&status==='Perlu Bimbingan')||(f==='All'&&status==='All'));
  });
  // Also handle exact IDs
  document.querySelectorAll('.filter-pill').forEach(btn=>{btn.classList.remove('active');});
  const mapping={'All':'btnFilterAll','Lancar':'btnFilterLancar','Murajaah':'btnFilterMurajaah','Perlu Bimbingan':'btnFilterPerluBimbingan'};
  const targetBtn=document.getElementById(mapping[status]);
  if(targetBtn) targetBtn.classList.add('active');
  renderDashboard();
}

// =============================================
// SHOW DETAIL
// =============================================
function showDetail(id){
  const s=dataSiswa.find(x=>x.id===id);if(!s)return;
  document.getElementById('historyTitle').innerText=s.nama;
  document.getElementById('historyModal').style.display='flex';
  const ctx=document.getElementById('historyMiniChart').getContext('2d');
  if(historyMiniChart) historyMiniChart.destroy();
  historyMiniChart=new Chart(ctx,{
    type:'line',
    data:{labels:s.history.map(h=>h.tanggal),datasets:[{data:s.history.map(h=>hitungTotalAyat(h.surat,h.ayat)),borderColor:'#10b981',backgroundColor:'rgba(16,185,129,.08)',fill:true,tension:.4,pointRadius:3,pointBackgroundColor:'#10b981',borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false}}}
  });
  const suratKhatam=cariSuratKhatam(s.history);
  const sertDiv=document.getElementById('sertifikatList');
  sertDiv.innerHTML='';
  if(suratKhatam.length>0){
    sertDiv.innerHTML=`<div style="background:linear-gradient(135deg,rgba(184,134,11,.08),rgba(184,134,11,.04));border:1px solid rgba(184,134,11,.2);border-radius:14px;padding:14px 18px;margin-bottom:16px;">
      <p style="font-size:11px;font-weight:700;color:#92701a;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;"><i class="fas fa-award"></i> Surat Khatam</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">${suratKhatam.map(surat=>`<button onclick="cetakSertifikat('${s.nama}','${surat}')" style="background:linear-gradient(135deg,#b8860b,#d4a017);color:white;border:none;border-radius:10px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;"><i class="fas fa-certificate" style="font-size:11px;"></i> ${surat}</button>`).join('')}</div>
    </div>`;
  }
  const container=document.getElementById('timelineContainer');
  const reversed=[...s.history].reverse();
  if(reversed.length===0){container.innerHTML=`<div style="text-align:center;padding:40px;color:#94a3b8;"><i class="fas fa-history" style="font-size:28px;display:block;margin-bottom:8px;opacity:.4;"></i>Belum ada riwayat.</div>`;return;}
  container.innerHTML='';
  reversed.forEach((h,i)=>{
    const total=databaseAyat[h.surat]||1;
    const persen=Math.min((h.ayat/total)*100,100);
    const isKhatam=h.ayat>=total;
    container.insertAdjacentHTML('beforeend',`<div style="display:flex;gap:16px;padding-bottom:16px;position:relative;">
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:10px;height:10px;border-radius:50%;background:${isKhatam?'#b8860b':'#10b981'};border:2px solid white;box-shadow:0 0 0 2px ${isKhatam?'#b8860b':'#10b981'};flex-shrink:0;margin-top:3px;"></div>
        ${i<reversed.length-1?`<div style="width:1px;flex:1;background:#e2e8f0;margin-top:6px;min-height:20px;"></div>`:''}
      </div>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">${h.tanggal}</span>
          ${isKhatam?`<span style="font-size:10px;background:rgba(184,134,11,.15);color:#92701a;padding:2px 8px;border-radius:99px;font-weight:700;">⭐ Khatam!</span>`:''}
        </div>
        <div style="font-weight:700;font-size:14px;">${h.surat}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">Ayat ${h.ayat} dari ${total} · ${Math.round(persen)}%</div>
        <div class="progress-track" style="margin-top:6px;height:4px;"><div class="progress-fill ${isKhatam?'complete':''}" style="width:${persen}%;"></div></div>
      </div>
    </div>`);
  });
}
function cariSuratKhatam(history){
  const max={};
  history.forEach(h=>{if(!max[h.surat]||h.ayat>max[h.surat])max[h.surat]=h.ayat;});
  return Object.entries(max).filter(([s,a])=>databaseAyat[s]&&a>=databaseAyat[s]).map(([s])=>s);
}
function closeHistory(){ document.getElementById('historyModal').style.display='none'; }

// =============================================
// REKAP
// =============================================
function setRekapTab(tab){
  rekapPeriode=tab;
  ['minggu','bulan'].forEach(t=>{
    const el=document.getElementById('tab'+t.charAt(0).toUpperCase()+t.slice(1));
    if(el)el.classList.toggle('active',t===tab);
  });
  renderRekap();
}
function renderRekap(){
  const kelas=document.getElementById('rekapKelas')?.value||'All';
  const filtered=dataSiswa.filter(s=>kelas==='All'||s.kelas==kelas);
  const allSetoran=[];
  filtered.forEach(s=>s.history.forEach(h=>allSetoran.push({...h,nama:s.nama})));
  const now=new Date();let labels=[],counts=[];
  if(rekapPeriode==='minggu'){
    for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const str=d.toISOString().split('T')[0];labels.push(str.slice(5));counts.push(allSetoran.filter(h=>h.tanggal===str).length);}
  } else {
    for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const label=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;labels.push(label.slice(5)+'/'+label.slice(0,4));counts.push(allSetoran.filter(h=>h.tanggal&&h.tanggal.startsWith(label)).length);}
  }
  const ctx=document.getElementById('rekapChart')?.getContext('2d');
  if(ctx){
    if(rekapChartInstance)rekapChartInstance.destroy();
    rekapChartInstance=new Chart(ctx,{
      type:'bar',
      data:{labels,datasets:[{label:'Setoran',data:counts,backgroundColor:labels.map((_,i)=>i===labels.length-1?'#b8860b':'rgba(16,185,129,.6)'),borderRadius:8,borderSkipped:false}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:'rgba(0,0,0,.05)'},ticks:{stepSize:1}}}}
    });
  }
  const totalSetoran=allSetoran.length;
  const avgPerSiswa=filtered.length>0?(totalSetoran/filtered.length).toFixed(1):0;
  const stagnan=filtered.filter(s=>hariTanpaSedang(s)>7).length;
  const summary=document.getElementById('rekapSummary');
  if(summary)summary.innerHTML=[
    {label:'Total Setoran',val:totalSetoran,color:'#10b981'},
    {label:'Rata-rata/Siswa',val:avgPerSiswa,color:'#b8860b'},
    {label:'Stagnan >7 hari',val:stagnan,color:'#ef4444'},
    {label:'Total Siswa',val:filtered.length,color:'#0284c7'},
  ].map(x=>`<div style="display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:8px;"><div style="width:10px;height:10px;border-radius:3px;background:${x.color};"></div><span style="font-size:12px;color:#64748b;">${x.label}</span></div>
    <span style="font-weight:700;font-size:13px;">${x.val}</span>
  </div>`).join('');
  const sorted=[...filtered].sort((a,b)=>hitungTotalAyat(b.suratTerakhir,b.ayatTerakhir)-hitungTotalAyat(a.suratTerakhir,a.ayatTerakhir));
  const lb=document.getElementById('leaderboard');
  if(lb){
    lb.innerHTML='';
    sorted.slice(0,9).forEach((s,i)=>{
      const total=hitungTotalAyat(s.suratTerakhir,s.ayatTerakhir);
      const persen=Math.round((total/TOTAL_AYAT_QURAN)*100*10)/10;
      const medals=['🥇','🥈','🥉'];
      lb.insertAdjacentHTML('beforeend',`<div class="target-card" style="display:flex;align-items:center;gap:12px;padding:14px 16px;">
        <div style="font-size:${i<3?'22px':'13px'};font-weight:700;width:32px;text-align:center;color:#94a3b8;">${i<3?medals[i]:'#'+(i+1)}</div>
        <div style="width:36px;height:36px;border-radius:50%;background:${getAvatarColor(s.nama)};display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:14px;flex-shrink:0;">${s.nama.charAt(0)}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.nama}</div>
          <div style="font-size:11px;color:#94a3b8;">${s.suratTerakhir} · ${total.toLocaleString()} ayat · ${persen}% Quran</div>
        </div>
      </div>`);
    });
  }
}

// =============================================
// TARGET
// =============================================
function renderTarget(){
  const grid=document.getElementById('targetGrid');if(!grid)return;
  grid.innerHTML='';
  const kelas=getDaftarKelas();
  kelas.forEach(k=>{
    const target=dataTarget[k]||null;
    const siswaKelas=dataSiswa.filter(s=>s.kelas==k);
    const totalSiswa=siswaKelas.length;
    let tercapai=0;
    if(target&&totalSiswa>0){const targetTotal=hitungTotalAyat(target.surat,target.ayat);tercapai=siswaKelas.filter(s=>hitungTotalAyat(s.suratTerakhir,s.ayatTerakhir)>=targetTotal).length;}
    const persen=totalSiswa>0?Math.round((tercapai/totalSiswa)*100):0;
    const deadlineStr=target?.deadline?`Deadline: ${target.deadline}`:'Belum ada deadline';
    const circumference=2*Math.PI*28;
    const offset=circumference-(persen/100)*circumference;
    grid.insertAdjacentHTML('beforeend',`<div class="target-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
        <div>
          <p style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;">Kelas ${k}</p>
          <p style="font-weight:800;font-size:18px;color:#064e3b;margin-top:2px;">${target?target.surat:'—'}</p>
          <p style="font-size:11px;color:#94a3b8;margin-top:2px;">${target?'Target ayat '+target.ayat:'Belum ada target'}</p>
          <p style="font-size:10px;color:#b8860b;margin-top:2px;">${deadlineStr}</p>
        </div>
        <div class="target-progress-ring">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle class="track" cx="32" cy="32" r="28" fill="none" stroke="#f1f5f9" stroke-width="6"/>
            <circle class="fill" cx="32" cy="32" r="28" fill="none" stroke="${persen>=80?'#b8860b':'#10b981'}" stroke-width="6" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" style="transform:rotate(-90deg);transform-origin:50% 50%;"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#064e3b;">${persen}%</div>
        </div>
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:10px 14px;margin-bottom:14px;">
        <div style="font-size:11px;color:#64748b;">${tercapai} dari ${totalSiswa} siswa</div>
        <div class="progress-track" style="margin-top:6px;"><div class="progress-fill ${persen>=80?'gold':''}" style="width:${persen}%;"></div></div>
      </div>
      <button onclick="openTargetModal('${k}')" class="btn-ghost" style="width:100%;justify-content:center;padding:9px;">
        <i class="fas fa-${target?'edit':'plus'}"></i> ${target?'Edit Target':'Set Target'}
      </button>
    </div>`);
  });
}
function openTargetModal(kelas){
  const t=dataTarget[kelas]||{};
  document.getElementById('targetKelasId').value=kelas;
  document.getElementById('targetModalTitle').innerText=`Target Kelas ${kelas}`;
  document.getElementById('targetSurat').value=t.surat||daftarSurat[0];
  document.getElementById('targetAyat').value=t.ayat||1;
  document.getElementById('targetDeadline').value=t.deadline||'';
  document.getElementById('targetModal').style.display='flex';
}
function closeTargetModal(){ document.getElementById('targetModal').style.display='none'; }
function saveTarget(){
  const kelas=document.getElementById('targetKelasId').value;
  const surat=document.getElementById('targetSurat').value;
  const ayat=parseInt(document.getElementById('targetAyat').value)||1;
  const deadline=document.getElementById('targetDeadline').value;
  dataTarget[kelas]={surat,ayat,deadline};
  localStorage.setItem('tahfidz_target',JSON.stringify(dataTarget));
  closeTargetModal();renderTarget();
  Swal.fire({icon:'success',title:'Target Tersimpan!',timer:900,showConfirmButton:false});
}

// =============================================
// SETORAN CEPAT
// =============================================
function openSetoranCepat(){
  document.getElementById('setoranTanggal').value=new Date().toISOString().split('T')[0];
  document.getElementById('setoranModal').style.display='flex';
  renderSetoranList();
}
function closeSetoranCepat(){ document.getElementById('setoranModal').style.display='none'; }
function renderSetoranList(){
  const kelas=document.getElementById('setoranFilterKelas').value;
  const list=document.getElementById('setoranList');
  const filtered=dataSiswa.filter(s=>kelas==='All'||s.kelas==kelas);
  list.innerHTML='';
  if(filtered.length===0){list.innerHTML=`<p style="text-align:center;color:#94a3b8;padding:24px;">Tidak ada siswa di kelas ini.</p>`;return;}
  filtered.forEach(s=>{
    list.insertAdjacentHTML('beforeend',`<div class="setoran-row" data-id="${s.id}">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:32px;height:32px;border-radius:50%;background:${getAvatarColor(s.nama)};display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:12px;flex-shrink:0;">${s.nama.charAt(0)}</div>
        <div><div style="font-weight:700;font-size:13px;">${s.nama}</div><div style="font-size:10px;color:#94a3b8;">${s.suratTerakhir} · ${s.ayatTerakhir}</div></div>
      </div>
      <select class="form-input sc-surat" data-id="${s.id}" onchange="updateScSurat(${s.id})" style="font-size:12px;padding:6px 10px;">
        ${daftarSurat.map(sur=>`<option value="${sur}" ${sur===s.suratTerakhir?'selected':''}>${sur}</option>`).join('')}
      </select>
      <input type="number" class="form-input sc-ayat" data-id="${s.id}" min="1" value="${s.ayatTerakhir}" style="width:80px;font-size:12px;padding:6px 10px;text-align:center;">
      <select class="form-input sc-status" data-id="${s.id}" style="font-size:12px;padding:6px 10px;">
        <option value="Lancar" ${s.status==='Lancar'?'selected':''}>✅ Lancar</option>
        <option value="Murajaah" ${s.status==='Murajaah'?'selected':''}>🔄 Murajaah</option>
        <option value="Perlu Bimbingan" ${s.status==='Perlu Bimbingan'?'selected':''}>⚠️ Bimbingan</option>
      </select>
    </div>`);
  });
}
function updateScSurat(id){
  const surat=document.querySelector(`.sc-surat[data-id="${id}"]`).value;
  const inp=document.querySelector(`.sc-ayat[data-id="${id}"]`);
  const max=databaseAyat[surat]||1;
  if(parseInt(inp.value)>max) inp.value=max;
}
function saveSetoranCepat(){
  const tgl=document.getElementById('setoranTanggal').value;
  const rows=document.querySelectorAll('.setoran-row');
  let count=0;
  rows.forEach(row=>{
    const id=parseInt(row.dataset.id);
    const surat=row.querySelector('.sc-surat').value;
    const ayat=parseInt(row.querySelector('.sc-ayat').value);
    const status=row.querySelector('.sc-status').value;
    if(!surat||isNaN(ayat)||ayat<1)return;
    const idx=dataSiswa.findIndex(x=>x.id===id);if(idx===-1)return;
    const max=databaseAyat[surat]||999;
    const finalAyat=Math.min(ayat,max);
    dataSiswa[idx].suratTerakhir=surat;dataSiswa[idx].ayatTerakhir=finalAyat;dataSiswa[idx].status=status;
    const dupIdx=dataSiswa[idx].history.findIndex(h=>h.tanggal===tgl&&h.surat===surat);
    if(dupIdx>=0)dataSiswa[idx].history[dupIdx].ayat=finalAyat;
    else{dataSiswa[idx].history.push({tanggal:tgl,surat,ayat:finalAyat});dataSiswa[idx].history.sort((a,b)=>new Date(a.tanggal)-new Date(b.tanggal));}
    count++;
  });
  simpanData();closeSetoranCepat();renderDashboard();cekStagnan();
  Swal.fire({icon:'success',title:`${count} setoran tersimpan!`,timer:1200,showConfirmButton:false});
}

// =============================================
// CATATAN
// =============================================
function openNotes(id){
  const s=dataSiswa.find(x=>x.id===id);if(!s)return;
  document.getElementById('notesSiswaId').value=id;
  document.getElementById('notesSiswaName').innerText=`📝 ${s.nama}`;
  document.getElementById('notesContent').value=s.catatan||'';
  document.getElementById('notesModal').style.display='flex';
}
function closeNotes(){ document.getElementById('notesModal').style.display='none'; }
function saveNotes(){
  const id=parseInt(document.getElementById('notesSiswaId').value);
  const catatan=document.getElementById('notesContent').value.trim();
  const s=dataSiswa.find(x=>x.id===id);
  if(s){s.catatan=catatan;simpanData();renderDashboard();closeNotes();showToast('Catatan tersimpan ✏️','success');}
}

// =============================================
// SETTINGS
// =============================================
function openSettings(){
  const settings=JSON.parse(localStorage.getItem('tahfidz_settings')||'{}');
  document.getElementById('settingStagnan').value=settings.stagnanDays||7;
  document.getElementById('settingNamaLembaga').value=settings.namaLembaga||'';
  document.getElementById('settingsModal').style.display='flex';
  renderSettingKelasList();
}
function closeSettings(){ document.getElementById('settingsModal').style.display='none'; }
function saveSettings(){
  const settings=JSON.parse(localStorage.getItem('tahfidz_settings')||'{}');
  settings.stagnanDays=parseInt(document.getElementById('settingStagnan').value)||7;
  settings.namaLembaga=document.getElementById('settingNamaLembaga').value.trim();
  settings.daftarKelas=collectKelasList('setting');
  localStorage.setItem('tahfidz_settings',JSON.stringify(settings));
  closeSettings();renderFilterButtons();populateAllKelasSelects();cekStagnan();renderDashboard();
  showToast('Pengaturan disimpan ✅','success');
}
function gantiPIN(){
  const settings=JSON.parse(localStorage.getItem('tahfidz_settings')||'{}');
  const currentPIN=settings.pin||'1234';
  const pinLama=document.getElementById('settingPinLama').value;
  const pinBaru=document.getElementById('settingPinBaru').value;
  const pinKonfirmasi=document.getElementById('settingPinKonfirmasi').value;
  if(pinLama!==currentPIN)return showToast('PIN lama salah!','error');
  if(pinBaru.length<4)return showToast('PIN baru minimal 4 digit','warning');
  if(pinBaru!==pinKonfirmasi)return showToast('Konfirmasi PIN tidak cocok','error');
  settings.pin=pinBaru;localStorage.setItem('tahfidz_settings',JSON.stringify(settings));
  document.getElementById('settingPinLama').value='';document.getElementById('settingPinBaru').value='';document.getElementById('settingPinKonfirmasi').value='';
  showToast('PIN berhasil diubah 🔐','success');
}
function resetAllData(){
  Swal.fire({title:'⚠️ Hapus Semua Data?',html:`<p style="color:#64748b;font-size:14px;">Tindakan ini tidak bisa dibatalkan.</p><input type="text" id="konfirmasiHapus" placeholder='Ketik "HAPUS"' style="margin-top:12px;width:100%;padding:10px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;">`,icon:'warning',showCancelButton:true,confirmButtonText:'Hapus',cancelButtonText:'Batal',confirmButtonColor:'#ef4444',
    preConfirm:()=>{const v=document.getElementById('konfirmasiHapus').value;if(v!=='HAPUS'){Swal.showValidationMessage('Ketik "HAPUS" untuk konfirmasi');return false;}return true;}
  }).then(r=>{if(r.isConfirmed){dataSiswa=[];dataTarget={};simpanData();localStorage.removeItem('tahfidz_target');closeSettings();renderDashboard();showToast('Semua data dihapus','info');}});
}

// =============================================
// DARK MODE
// =============================================
function applyDarkMode(isDark){
  const icon=document.getElementById('darkIcon');
  if(isDark){document.body.classList.add('dark-mode');if(icon){icon.classList.replace('fa-moon','fa-sun');icon.style.color='#fbbf24';}}
  else{document.body.classList.remove('dark-mode');if(icon){icon.classList.replace('fa-sun','fa-moon');icon.style.color='';}}
}
function toggleDarkMode(){
  const isDark=!document.body.classList.contains('dark-mode');
  applyDarkMode(isDark);localStorage.setItem('darkMode',isDark);
}

// =============================================
// TOAST
// =============================================
function showToast(message,type='success',duration=3000){
  const container=document.getElementById('toastContainer');if(!container)return;
  const id='toast-'+Date.now();
  const icons={success:'fa-check-circle',error:'fa-exclamation-circle',info:'fa-info-circle',warning:'fa-exclamation-triangle'};
  const colors={success:'#10b981',error:'#ef4444',info:'#0284c7',warning:'#f59e0b'};
  const toast=document.createElement('div');
  toast.id=id;toast.className='toast-item';
  toast.innerHTML=`<div style="display:flex;align-items:center;gap:10px;"><i class="fas ${icons[type]}" style="color:${colors[type]};font-size:16px;flex-shrink:0;"></i><span style="font-size:13px;font-weight:600;flex:1;">${message}</span><button onclick="removeToast('${id}')" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:14px;">×</button></div>`;
  container.appendChild(toast);
  requestAnimationFrame(()=>{toast.style.opacity='1';toast.style.transform='translateX(0)';});
  setTimeout(()=>removeToast(id),duration);
}
function removeToast(id){
  const el=document.getElementById(id);if(!el)return;
  el.style.opacity='0';el.style.transform='translateX(100%)';
  setTimeout(()=>el.remove(),300);
}

// =============================================
// MOBILE SIDEBAR
// =============================================
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('sidebar-open');
  document.getElementById('mobileOverlay').classList.toggle('active');
}
function closeSidebar(){
  document.getElementById('sidebar')?.classList.remove('sidebar-open');
  document.getElementById('mobileOverlay')?.classList.remove('active');
}

// =============================================
// WHATSAPP
// =============================================
function sendWA(id){
  const s=dataSiswa.find(x=>x.id===id);if(!s)return;
  const hari=hariTanpaSedang(s);
  const stagnanInfo=hari>7?`%0A⚠️ *Catatan:* Belum ada setoran ${hari} hari.`:'';
  const pesan=`*📖 LAPORAN TAHFIDZ*%0A━━━━━━━━━━━━━━%0A👤 *Nama:* ${s.nama}%0A🏫 *Kelas:* ${s.kelas}%0A📚 *Capaian:* ${s.suratTerakhir} (Ayat ${s.ayatTerakhir})%0A✅ *Status:* ${s.status}${stagnanInfo}%0A━━━━━━━━━━━━━━%0A_Mohon terus dimotivasi dan disimak._ 🤲`;
  window.open(`https://wa.me/?text=${pesan}`,'_blank');
}

// =============================================
// EXPORT / IMPORT
// =============================================
function exportToCSV(){
  let csv="Nama,Kelas,Tanggal,Surat,Ayat,Status\n";
  dataSiswa.forEach(s=>s.history.forEach(h=>{csv+=`${s.nama},${s.kelas},${h.tanggal},${h.surat},${h.ayat},${s.status}\n`;}));
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=`Tahfidz_Backup_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();URL.revokeObjectURL(a.href);
}
function handleImport(event){
  const file=event.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const rows=e.target.result.split('\n').slice(1);let count=0;
    rows.forEach(row=>{
      const cols=row.split(',');
      if(cols.length<2||!cols[0].trim())return;
      const nama=cols[0].trim(),kelas=cols[1].trim();
      const isExist=dataSiswa.find(x=>x.nama.toLowerCase()===nama.toLowerCase()&&x.kelas===kelas);
      if(!isExist){
        dataSiswa.push({id:Date.now()+Math.random(),nama,kelas,status:cols[5]?cols[5].trim():'Murajaah',suratTerakhir:cols[3]?cols[3].trim():'Al-Fatihah',ayatTerakhir:cols[4]?parseInt(cols[4].trim()):1,hadir:true,history:cols[2]?[{tanggal:cols[2].trim(),surat:cols[3]?.trim()||'Al-Fatihah',ayat:parseInt(cols[4]?.trim())||1}]:[]});
        count++;
      }
    });
    simpanData();renderDashboard();cekStagnan();
    Swal.fire('Berhasil',`${count} siswa diimport!`,'success');
  };
  reader.readAsText(file);event.target.value='';
}

// =============================================
// PRINT RAPORT
// =============================================
function printRaporKelas(){
  document.getElementById('printKelasSelect').value=currentFilter;
  document.getElementById('printModal').style.display='flex';
}
function closePrintModal(){ document.getElementById('printModal').style.display='none'; }
function printRapor(id){
  const s=dataSiswa.find(x=>x.id===id);if(!s)return;
  const settings=JSON.parse(localStorage.getItem('tahfidz_settings')||'{}');
  const lembaga=settings.namaLembaga||'Monitoring Tahfidz';
  const logoData=settings.logoData||'';
  const logoHeaderHTML=logoData?`<img src="${logoData}" style="height:44px;width:auto;object-fit:contain;margin-bottom:8px;" alt="Logo">`:`<div style="font-family:'Amiri',serif;font-size:28px;font-weight:700;color:#064e3b;">📖 TahfidzPro</div>`;
  const max=databaseAyat[s.suratTerakhir]||1;
  const persen=Math.min(Math.round((s.ayatTerakhir/max)*100),100);
  const totalHafalan=hitungTotalAyat(s.suratTerakhir,s.ayatTerakhir);
  const lastDate=s.history&&s.history.length>0?s.history[s.history.length-1].tanggal:'-';
  const win=window.open('','_blank','width=700,height=900');
  win.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Raport — ${s.nama}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Amiri:wght@400;700&display=swap');
body{font-family:'Plus Jakarta Sans',sans-serif;padding:40px;color:#1e293b;max-width:640px;margin:0 auto;}
.header{text-align:center;border-bottom:3px solid #064e3b;padding-bottom:20px;margin-bottom:28px;}
.student-card{background:linear-gradient(135deg,#064e3b,#065f46);color:white;border-radius:16px;padding:24px;margin-bottom:24px;}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;}
.info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;}
.info-label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
.info-value{font-size:20px;font-weight:800;color:#064e3b;}
.progress-bar{background:#e2e8f0;border-radius:99px;height:12px;margin:8px 0;overflow:hidden;}
.progress-fill{background:linear-gradient(90deg,#059669,#10b981);height:100%;border-radius:99px;}
.history-item{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;}
.footer{margin-top:40px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px;}
@media print{body{padding:20px;}}
</style></head><body>
<div class="header">${logoHeaderHTML}<div style="font-size:16px;font-weight:700;color:#475569;margin-top:6px;">${lembaga}</div><div style="font-size:12px;color:#94a3b8;margin-top:4px;">Raport Hafalan — ${new Date().toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div></div>
<div class="student-card">
  <div style="font-family:'Amiri',serif;font-size:26px;font-weight:700;">${s.nama}</div>
  <div style="font-size:13px;opacity:.7;margin-top:4px;">Kelas ${s.kelas} | Setoran Terakhir: ${lastDate}</div>
  <div style="margin-top:14px;"><div style="display:flex;justify-content:space-between;font-size:12px;opacity:.8;margin-bottom:6px;"><span>Progress Hafalan</span><span>${persen}%</span></div><div class="progress-bar"><div class="progress-fill" style="width:${persen}%"></div></div></div>
</div>
<div class="info-grid">
  <div class="info-box"><div class="info-label">Surat Terakhir</div><div class="info-value" style="font-size:15px;">${s.suratTerakhir}</div><div style="font-size:11px;color:#64748b;">Ayat ke-${s.ayatTerakhir} dari ${max}</div></div>
  <div class="info-box"><div class="info-label">Total Ayat Hafalan</div><div class="info-value">${totalHafalan.toLocaleString('id-ID')}</div><div style="font-size:11px;color:#64748b;">dari 6.236 ayat Al-Qur'an</div></div>
  <div class="info-box"><div class="info-label">Status</div><div class="info-value" style="font-size:14px;margin-top:4px;">${s.status}</div></div>
  <div class="info-box"><div class="info-label">Total Setoran</div><div class="info-value">${(s.history||[]).length}</div><div style="font-size:11px;color:#64748b;">catatan riwayat</div></div>
</div>
${s.catatan?`<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:20px;"><div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;margin-bottom:6px;">📝 Catatan Guru</div><div style="font-size:14px;color:#78350f;line-height:1.7;">${s.catatan}</div></div>`:''}
<h3 style="font-size:14px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">📅 10 Setoran Terakhir</h3>
${(s.history||[]).slice(-10).reverse().map(h=>`<div class="history-item"><span>${h.tanggal}</span><span style="font-weight:600;">${h.surat} · Ayat ${h.ayat}</span></div>`).join('')}
<div class="footer">TahfidzPro · ${lembaga} · ${new Date().getFullYear()}</div>
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`);win.document.close();
}
function doPrint(){
  const kelas=document.getElementById('printKelasSelect').value;
  const cols={nama:document.getElementById('printColNama').checked,kelas:document.getElementById('printColKelas').checked,surat:document.getElementById('printColSurat').checked,ayat:document.getElementById('printColAyat').checked,status:document.getElementById('printColStatus').checked,progress:document.getElementById('printColProgress').checked,catatan:document.getElementById('printColCatatan').checked,tanggal:document.getElementById('printColTanggal').checked};
  const settings=JSON.parse(localStorage.getItem('tahfidz_settings')||'{}');
  const lembaga=settings.namaLembaga||'Monitoring Tahfidz';
  let filtered=kelas==='All'?[...dataSiswa]:dataSiswa.filter(x=>x.kelas==kelas);
  filtered.sort((a,b)=>a.nama.localeCompare(b.nama));
  const headers=[];
  if(cols.nama)headers.push('Nama Santri');if(cols.kelas)headers.push('Kelas');if(cols.surat)headers.push('Surat Terakhir');if(cols.ayat)headers.push('Ayat');if(cols.status)headers.push('Status');if(cols.progress)headers.push('Progress');if(cols.tanggal)headers.push('Tgl Setoran');if(cols.catatan)headers.push('Catatan');
  const rows=filtered.map((s,idx)=>{
    const max=databaseAyat[s.suratTerakhir]||1;
    const persen=Math.min(Math.round((s.ayatTerakhir/max)*100),100);
    const lastDate=s.history&&s.history.length>0?s.history[s.history.length-1].tanggal:'-';
    const cells=[];
    if(cols.nama)cells.push(`<td>${idx+1}. ${s.nama}</td>`);if(cols.kelas)cells.push(`<td>Kelas ${s.kelas}</td>`);if(cols.surat)cells.push(`<td>${s.suratTerakhir}</td>`);if(cols.ayat)cells.push(`<td>${s.ayatTerakhir}/${max}</td>`);
    if(cols.status)cells.push(`<td><span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;background:${s.status==='Lancar'?'#d1fae5':s.status==='Murajaah'?'#fef3c7':'#fee2e2'};color:${s.status==='Lancar'?'#065f46':s.status==='Murajaah'?'#92400e':'#991b1b'};">${s.status}</span></td>`);
    if(cols.progress)cells.push(`<td>${persen}%</td>`);if(cols.tanggal)cells.push(`<td>${lastDate}</td>`);if(cols.catatan)cells.push(`<td style="font-size:11px;color:#64748b;">${s.catatan||'-'}</td>`);
    return `<tr style="background:${idx%2===0?'#f8fafc':'white'};">${cells.join('')}</tr>`;
  });
  const win=window.open('','_blank','width=900,height=900');
  win.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Raport Hafalan</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Amiri:wght@400;700&display=swap');body{font-family:'Plus Jakarta Sans',sans-serif;padding:32px;color:#1e293b;}.header{text-align:center;border-bottom:3px solid #064e3b;padding-bottom:16px;margin-bottom:24px;}table{width:100%;border-collapse:collapse;font-size:13px;}th{background:#064e3b;color:white;padding:10px 12px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;}td{padding:9px 12px;border-bottom:1px solid #e2e8f0;}.footer{margin-top:24px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px;}@media print{body{padding:16px;}}</style></head><body>
<div class="header">${settings.logoData?`<img src="${settings.logoData}" style="height:48px;width:auto;object-fit:contain;margin-bottom:8px;" alt="Logo"><br>`:`<div style="font-family:'Amiri',serif;font-size:24px;font-weight:700;color:#064e3b;">📖 TahfidzPro — Raport Hafalan</div>`}<div style="font-size:15px;font-weight:700;color:#475569;margin-top:4px;">${lembaga}${kelas!=='All'?' — Kelas '+kelas:' — Semua Kelas'}</div><div style="font-size:12px;color:#94a3b8;margin-top:4px;">Dicetak: ${new Date().toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div></div>
<div style="display:flex;gap:16px;margin-bottom:20px;">
  ${[{n:filtered.length,l:'Total Santri'},{n:filtered.filter(x=>x.status==='Lancar').length,l:'Lancar'},{n:filtered.filter(x=>x.status==='Murajaah').length,l:'Murajaah'},{n:filtered.filter(x=>x.status==='Perlu Bimbingan').length,l:'Perlu Bimbingan'}].map(x=>`<div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;text-align:center;"><div style="font-size:22px;font-weight:800;color:#064e3b;">${x.n}</div><div style="font-size:11px;color:#94a3b8;font-weight:600;">${x.l}</div></div>`).join('')}
</div>
<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>
<div class="footer">TahfidzPro · ${lembaga} · ${new Date().getFullYear()} · Total ${filtered.length} santri</div>
<script>window.onload=()=>{window.print();}<\/script></body></html>`);
  win.document.close();closePrintModal();
}

// =============================================
// SERTIFIKAT
// =============================================
function cetakSertifikat(nama,namaSurat){
  const settings=JSON.parse(localStorage.getItem('tahfidz_settings')||'{}');
  const lembaga=settings.namaLembaga||'TahfidzPro';
  const namaGuru=settings.namaGuru||'Pembimbing Tahfidz';
  const kepala=settings.namaKepala||'Kepala Madrasah';
  const logoData=settings.logoData||'';
  const tanggal=new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  const s=dataSiswa.find(x=>x.nama===nama);
  const totalHafalan=s?hitungTotalAyat(s.suratTerakhir,s.ayatTerakhir):0;
  const ayatSurat=databaseAyat[namaSurat]||0;
  const certId='TQ-'+Date.now().toString(36).toUpperCase().slice(-8);
  const logoHTML=logoData?`<img src="${logoData}" style="height:48px;width:auto;object-fit:contain;" alt="Logo">`:`<div style="width:48px;height:48px;background:linear-gradient(135deg,#064e3b,#059669);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;">📖</div>`;
  const w=window.open('','_blank','width=960,height=720');
  w.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Sertifikat — ${namaSurat} — ${nama}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
@page{size:A4 landscape;margin:0;}*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#f0f4f0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;font-family:'Plus Jakarta Sans',sans-serif;}
.cert{width:940px;background:white;border-radius:12px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.15);position:relative;}
.cert-header{background:#064e3b;padding:18px 40px;display:flex;align-items:center;justify-content:space-between;border-bottom:4px solid #b8860b;}
.cert-header-brand{display:flex;align-items:center;gap:12px;}
.cert-header-name{color:white;font-size:16px;font-weight:700;}
.cert-header-sub{color:rgba(255,255,255,.55);font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:1px;}
.cert-body{display:flex;min-height:400px;position:relative;}
.cert-content-col{flex:1;padding:36px 52px 32px 52px;display:flex;flex-direction:column;justify-content:space-between;position:relative;z-index:1;}
.cert-eyebrow{font-size:10px;font-weight:800;color:#064e3b;text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;}
.cert-main-title{font-family:'Playfair Display',serif;font-size:34px;color:#0f172a;line-height:1.15;margin-bottom:4px;}
.cert-congrats{font-size:14px;color:#64748b;font-weight:500;margin-bottom:18px;}
.cert-surat-name{font-family:'Playfair Display',serif;font-size:28px;color:#064e3b;font-weight:700;margin-bottom:2px;}
.cert-surat-meta{font-size:12px;color:#94a3b8;margin-bottom:14px;font-weight:500;}
.cert-desc{font-size:12px;color:#64748b;line-height:1.75;max-width:500px;margin-bottom:16px;}
.cert-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;}
.cert-chip{background:#f0fdf4;border:1px solid #bbf7d0;color:#065f46;border-radius:99px;padding:4px 12px;font-size:11px;font-weight:700;}
.cert-footer{display:flex;align-items:flex-end;justify-content:space-between;padding-top:16px;border-top:1px solid #f1f5f9;gap:20px;}
.sig-block{flex:1;}
.sig-space{height:56px;}
.sig-name-title{font-size:11px;font-weight:700;color:#475569;border-top:1.5px solid #cbd5e1;padding-top:5px;margin-top:0;}
.sig-sub{font-size:10px;color:#94a3b8;margin-top:2px;}
.cert-meta-block{text-align:right;font-size:11px;color:#94a3b8;line-height:1.8;}
.cert-footer-bar{background:#f8fafc;border-top:1px solid #e2e8f0;padding:10px 40px;display:flex;align-items:center;justify-content:space-between;}
.cert-footer-bar .fbar-left{font-size:10px;color:#94a3b8;font-weight:600;}
.cert-footer-bar .fbar-right{font-size:10px;color:#94a3b8;font-weight:600;}
@media print{body{background:white;padding:0;min-height:unset;}.cert{box-shadow:none;width:100%;border-radius:0;}}
</style></head><body>
<div class="cert">
<div class="cert-header">
  <div class="cert-header-brand">${logoHTML}<div><div class="cert-header-name">${lembaga}</div><div class="cert-header-sub">Program Tahfidz Al-Qur'an</div></div></div>
  <div style="text-align:right;"><div style="font-size:10px;color:rgba(255,255,255,.4);font-weight:600;letter-spacing:1px;">ID: ${certId}</div><div style="display:inline-block;background:rgba(184,134,11,.25);color:#d4a017;border:1px solid rgba(184,134,11,.4);border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700;margin-top:4px;text-transform:uppercase;letter-spacing:1.5px;">Khatam Surat</div></div>
</div>
<div class="cert-body">
  <div class="cert-content-col">
    <div>
      <div class="cert-eyebrow">Sertifikat Penghargaan</div>
      <div class="cert-main-title">Certificate of<br>Completion</div>
      <div class="cert-congrats">Barakallah & Selamat, <strong>${nama}</strong></div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><div style="width:36px;height:3px;background:#064e3b;border-radius:99px;"></div><div style="flex:1;height:1px;background:#e2e8f0;"></div></div>
      <div class="cert-surat-name">Surat ${namaSurat}</div>
      <div class="cert-surat-meta">Diselesaikan pada <strong>${tanggal}</strong> · <strong>${ayatSurat} Ayat</strong> · Total hafalan: <strong>${totalHafalan.toLocaleString('id-ID')} Ayat</strong></div>
      <div class="cert-desc">Dengan penuh keikhlasan dan ketekunan, telah berhasil menghafal keseluruhan <strong>Surat ${namaSurat}</strong> (${ayatSurat} Ayat) dengan sempurna. Semoga hafalan ini menjadi amal jariyah dan cahaya di dunia dan akhirat.</div>
      <div class="cert-chips"><span class="cert-chip">✅ Tahsin Al-Qur'an</span><span class="cert-chip">📖 Hafalan ${namaSurat}</span><span class="cert-chip">🌟 ${totalHafalan.toLocaleString('id-ID')} Ayat Kumulatif</span></div>
    </div>
    <div class="cert-footer">
      <div class="sig-block">
        <div class="sig-space"></div>
        <div class="sig-name-title">${namaGuru}</div>
        <div class="sig-sub">Pembimbing Tahfidz · ${lembaga}</div>
      </div>
      <div style="width:1px;height:52px;background:#e2e8f0;flex-shrink:0;align-self:flex-end;"></div>
      <div class="sig-block">
        <div class="sig-space"></div>
        <div class="sig-name-title">${kepala}</div>
        <div class="sig-sub">Kepala Madrasah · ${lembaga}</div>
      </div>
      <div style="width:1px;height:52px;background:#e2e8f0;flex-shrink:0;align-self:flex-end;"></div>
      <div class="cert-meta-block" style="align-self:flex-end;"><strong>${lembaga}</strong><br>Diterbitkan: ${tanggal}<br>No: ${certId}</div>
    </div>
  </div>
</div>
<div class="cert-footer-bar"><span class="fbar-left">${lembaga} · Program Tahfidz Al-Qur'an</span><span class="fbar-right">Certificate ID: ${certId} · ${tanggal}</span></div>
</div>
<script>window.onload=()=>{setTimeout(()=>{window.print();},800);}<\/script>
</body></html>`);w.document.close();
}

// =============================================
// AL-QUR'AN DIGITAL
// =============================================
function openQuranModal(){
  document.getElementById('quranModal').style.display='flex';
  if(quranSurahList.length===0) fetchSurahList();
}
function closeQuranModal(){ document.getElementById('quranModal').style.display='none';stopAudio(); }
async function fetchSurahList(){
  try{
    const res=await fetch('https://api.alquran.cloud/v1/surah');
    const data=await res.json();
    if(data.code===200){
      quranSurahList=data.data;
      const select=document.getElementById('quranSurahSelect');
      select.innerHTML='<option value="">Pilih Surat...</option>';
      data.data.forEach(s=>{const opt=document.createElement('option');opt.value=s.number;opt.textContent=`${s.number}. ${s.englishName} — ${s.name}`;select.appendChild(opt);});
      document.getElementById('quranLoading').style.display='none';
      document.getElementById('quranEmpty').style.display='flex';
    }
  }catch(e){
    document.getElementById('quranLoading').innerHTML='<div style="text-align:center;color:#ef4444;"><i class="fas fa-wifi" style="font-size:32px;margin-bottom:12px;display:block;opacity:.5;"></i><p style="font-weight:600;">Gagal memuat. Periksa koneksi.</p></div>';
  }
}
async function loadSurah(){
  const num=document.getElementById('quranSurahSelect').value;if(!num)return;
  currentSurahNumber=parseInt(num);stopAudio();
  document.getElementById('quranEmpty').style.display='none';document.getElementById('quranAyatList').style.display='none';document.getElementById('quranSurahInfo').style.display='none';document.getElementById('quranBismillah').style.display='none';
  document.getElementById('quranLoading').style.display='flex';document.getElementById('quranLoading').innerHTML='<div style="width:48px;height:48px;border-radius:50%;border:3px solid #f1f5f9;border-top-color:#059669;animation:quranSpin .8s linear infinite;"></div><p style="color:#94a3b8;font-size:14px;">Memuat ayat...</p>';
  try{
    const [arabicRes,transRes]=await Promise.all([fetch(`https://api.alquran.cloud/v1/surah/${num}`),fetch(`https://api.alquran.cloud/v1/surah/${num}/id.indonesian`)]);
    const arabicData=await arabicRes.json();const transData=await transRes.json();
    if(arabicData.code===200){
      const surah=arabicData.data;const trans=transData.code===200?transData.data.ayahs:[];
      currentAyatData=surah.ayahs.map((a,i)=>({number:a.numberInSurah,arabic:a.text,translation:trans[i]?trans[i].text:''}));
      document.getElementById('quranSurahNo').textContent=surah.number;
      document.getElementById('quranSurahArabic').textContent=surah.name;
      document.getElementById('quranSurahLatin').textContent=surah.englishName+' · '+surah.englishNameTranslation;
      document.getElementById('quranSurahType').textContent=surah.revelationType==='Meccan'?'🕋 Makkiyah':'🕌 Madaniyah';
      document.getElementById('quranSurahAyahCount').textContent=`${surah.numberOfAyahs} Ayat`;
      document.getElementById('quranProgress').textContent=`Surat ${surah.number} dari 114`;
      const jumpSel=document.getElementById('quranAyahJump');jumpSel.innerHTML='<option value="">Ayat ke...</option>';
      surah.ayahs.forEach(a=>{const opt=document.createElement('option');opt.value=a.numberInSurah;opt.textContent=`Ayat ${a.numberInSurah}`;jumpSel.appendChild(opt);});
      document.getElementById('quranPrevBtn').disabled=surah.number<=1;document.getElementById('quranNextBtn').disabled=surah.number>=114;
      renderAyat();
      document.getElementById('quranLoading').style.display='none';document.getElementById('quranSurahInfo').style.display='block';
      if(surah.number!==9)document.getElementById('quranBismillah').style.display='block';
      document.getElementById('quranAyatList').style.display='block';
    }
  }catch(e){document.getElementById('quranLoading').innerHTML='<div style="text-align:center;color:#ef4444;"><i class="fas fa-exclamation-circle" style="font-size:32px;margin-bottom:12px;display:block;"></i><p style="font-weight:600;color:#ef4444;">Gagal memuat. Coba lagi.</p></div>';}
}
function renderAyat(){
  const list=document.getElementById('quranAyatList');list.innerHTML='';
  currentAyatData.forEach(ayat=>{
    const card=document.createElement('div');card.className='quran-ayat-card';card.id=`ayat-${ayat.number}`;
    card.innerHTML=`<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;"><span class="quran-ayat-number">${ayat.number}</span></div>
<p class="quran-ayat-arabic">${ayat.arabic} ۝${arabicNum(ayat.number)}</p>
<div class="quran-ayat-translation" id="trans-${ayat.number}" style="${showTranslation?'':'display:none'}">${ayat.translation||'<em style="opacity:.5">Terjemahan tidak tersedia</em>'}</div>`;
    list.appendChild(card);
  });
}
function arabicNum(n){return String(n).split('').map(d=>['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'][parseInt(d)]||d).join('');}
function toggleTranslation(){
  showTranslation=!showTranslation;
  document.querySelectorAll('[id^="trans-"]').forEach(el=>{el.style.display=showTranslation?'':'none';});
  document.getElementById('btnTranslation').style.background=showTranslation?'rgba(255,255,255,.3)':'rgba(255,255,255,.1)';
}
function jumpToAyah(){const val=document.getElementById('quranAyahJump').value;if(!val)return;const el=document.getElementById(`ayat-${val}`);if(el)el.scrollIntoView({behavior:'smooth',block:'center'});}
function prevSurah(){if(currentSurahNumber&&currentSurahNumber>1){document.getElementById('quranSurahSelect').value=currentSurahNumber-1;loadSurah();}}
function nextSurah(){if(currentSurahNumber&&currentSurahNumber<114){document.getElementById('quranSurahSelect').value=currentSurahNumber+1;loadSurah();}}
function playAudio(){
  if(!currentSurahNumber)return;
  if(isPlaying){stopAudio();return;}
  const surahStr=String(currentSurahNumber).padStart(3,'0');
  const audioUrl=`https://download.quranicaudio.com/quran/mishaari_raashid_al-3afaasee/${surahStr}.mp3`;
  stopAudio();audioPlayer=new Audio(audioUrl);
  audioPlayer.play().then(()=>{isPlaying=true;document.getElementById('playIcon').className='fas fa-pause';document.getElementById('audioLabel').textContent='Pause';})
  .catch(()=>{window.open(`https://download.quranicaudio.com/quran/mishaari_raashid_al-3afaasee/${surahStr}.mp3`,'_blank');});
  audioPlayer.onended=()=>stopAudio();
}
function stopAudio(){
  if(audioPlayer){audioPlayer.pause();audioPlayer=null;}
  isPlaying=false;
  const pi=document.getElementById('playIcon');const al=document.getElementById('audioLabel');
  if(pi)pi.className='fas fa-play';if(al)al.textContent='Putar';
}

// =============================================
// PRAYER TIMES
// =============================================
async function loadPrayerTimes(){
  try{
    const today=new Date();
    const dd=String(today.getDate()).padStart(2,'0');const mm=String(today.getMonth()+1).padStart(2,'0');const yyyy=today.getFullYear();
    const res=await fetch(`https://api.aladhan.com/v1/timingsByCity/${dd}-${mm}-${yyyy}?city=Jakarta&country=Indonesia&method=11`);
    const data=await res.json();
    if(data.code===200){
      const t=data.data.timings;
      const widget=document.getElementById('sidebarPrayerWidget');if(!widget)return;
      const prayers=[{name:'Subuh',time:t.Fajr},{name:'Dzuhur',time:t.Dhuhr},{name:'Ashar',time:t.Asr},{name:'Maghrib',time:t.Maghrib},{name:'Isya',time:t.Isha}];
      const now=today.getHours()*60+today.getMinutes();
      let nextIdx=-1;
      for(let i=0;i<prayers.length;i++){const[h,m]=prayers[i].time.split(':').map(Number);if((h*60+m)>now){nextIdx=i;break;}}
      widget.innerHTML=`<div style="margin-top:12px;background:rgba(255,255,255,.05);border-radius:14px;padding:12px;border:1px solid rgba(184,134,11,.15);">
<p style="font-size:9px;font-weight:700;color:rgba(212,160,23,.6);text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;"><i class="fas fa-mosque"></i> Jadwal Sholat</p>
<div style="display:flex;flex-direction:column;gap:4px;">${prayers.map((p,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;${i===nextIdx?'background:rgba(184,134,11,.15);border-radius:8px;padding:3px 6px;margin:0 -6px;':'padding:1px 0;'}"><span style="font-size:11px;${i===nextIdx?'color:#d4a017;font-weight:700;':'color:rgba(209,250,229,.5);'}">${i===nextIdx?'→ ':''} ${p.name}</span><span style="font-size:11px;${i===nextIdx?'color:#d4a017;font-weight:700;':'color:rgba(209,250,229,.4);'}">${p.time}</span></div>`).join('')}</div></div>`;
    }
  }catch(e){}
}

// =============================================
// KEYBOARD SHORTCUTS
// =============================================
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-overlay').forEach(m=>{if(m.style.display==='flex')m.style.display='none';});
    closeSidebar();
  }
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();const s=document.getElementById('searchInput');if(s){setPage('dashboard');setTimeout(()=>{s.focus();s.select();},100);}}
  if((e.ctrlKey||e.metaKey)&&e.key==='n'){e.preventDefault();if(sessionStorage.getItem('isLoggedIn'))openModal();}
});

// =============================================
// REALTIME DATE (Masehi + Hijriah)
// =============================================
function updateSidebarDate(){
  const el = document.getElementById('sidebarTanggal');
  if(!el) return;
  const now = new Date();
  // Gregorian
  const hariNama = ['Ahad','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][now.getDay()];
  const tglMasehi = `${hariNama}, ${now.getDate()} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'][now.getMonth()]} ${now.getFullYear()}`;
  // Hijriah — simple calculation (approximate)
  const hijriah = gregorianToHijri(now.getFullYear(), now.getMonth()+1, now.getDate());
  const bulanHijri = ['Muharram','Safar','Rabi\'ul Awwal','Rabi\'ul Akhir','Jumadal Ula','Jumadal Akhir','Rajab','Sya\'ban','Ramadan','Syawal','Dzulqa\'dah','Dzulhijjah'];
  const tglHijriah = `${hijriah.d} ${bulanHijri[hijriah.m-1]} ${hijriah.y}H`;
  el.innerHTML = `${tglMasehi}<br><span style="color:rgba(212,160,23,0.7);">${tglHijriah}</span>`;
}
function gregorianToHijri(year, month, day){
  // Adopted from standard Gregorian-to-Islamic algorithm
  const jd = Math.floor((14-month)/12);
  const y = year + 4800 - jd;
  const m = month + 12*jd - 3;
  let jdn = day + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;
  const l = jdn - 1948440 + 10632;
  const n = Math.floor((l-1)/10631);
  const ll = l - 10631*n + 354;
  const j = Math.floor((10985-ll)/5316)*Math.floor((50*ll)/17719) + Math.floor(ll/5670)*Math.floor((43*ll)/15238);
  const lll = ll - Math.floor((30-j)/15)*Math.floor((17719*j)/50) - Math.floor(j/16)*Math.floor((15238*j)/43) + 29;
  const hm = Math.floor((24*lll)/709);
  const hd = lll - Math.floor((709*hm)/24);
  const hy = 30*n + j - 30;
  return {y:hy, m:hm, d:hd};
}

// =============================================
// INISIALISASI
// =============================================
function init(){
  populateSurat();
  renderFilterButtons();
  populateAllKelasSelects();
  setPage('dashboard');
  cekStagnan();
  loadPrayerTimes();
  updateSidebarDate();
  setInterval(updateSidebarDate, 60000);
  const settings=JSON.parse(localStorage.getItem('tahfidz_settings')||'{}');
  // Update sidebar logo icon
  if(settings.logoData){
    const icon=document.getElementById('sidebarLogoIcon');
    const fallback=document.getElementById('sidebarLogoFallback');
    if(icon){
      if(fallback) fallback.style.display='none';
      if(!icon.querySelector('img')){
        const img=document.createElement('img');
        img.src=settings.logoData;
        img.style.cssText='width:100%;height:100%;object-fit:contain;border-radius:8px;';
        icon.appendChild(img);
      }
    }
  }
  if(settings.namaLembaga || settings.namaGuru){
    const sub=document.getElementById('subtitleDisplay');
    if(sub){
      const lembaga = settings.namaLembaga || '';
      const guru = settings.namaGuru || '';
      if(lembaga && guru){
        sub.innerHTML = `<span style="font-weight:700;color:#475569;">${lembaga}</span><span style="color:#cbd5e1;">·</span><span style="color:#94a3b8;">${guru}</span>`;
      } else {
        sub.textContent = lembaga || guru;
      }
    }
  }
  if(!localStorage.getItem('tahfidz_welcomed')){
    setTimeout(()=>{showToast('💡 Ctrl+K cari cepat, Ctrl+N tambah siswa','info',5000);localStorage.setItem('tahfidz_welcomed','1');},1500);
  }
}

// =============================================
// DOA & DZIKIR
// =============================================
const doaDatabase = {
  pagi: [
    {judul:'Doa Bangun Tidur',arabic:'اَلْحَمْدُ لِلّٰهِ الَّذِيْ أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُوْرُ',latin:'Alhamdulillahil-ladzii ahyaanaa ba\'da maa amaatanaa wa ilaihin-nusyuur.',arti:'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami, dan hanya kepada-Nya kami dikembalikan.',faedah:'Dibaca segera setelah bangun tidur'},
    {judul:'Doa Masuk Kamar Mandi',arabic:'اَللّٰهُمَّ إِنِّيْ أَعُوْذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ',latin:'Allaahumma innii a\'uudzu bika minal khubutsi wal khabaa-its.',arti:'Ya Allah, sesungguhnya aku berlindung kepada-Mu dari setan laki-laki dan setan perempuan.',faedah:'Dibaca sebelum masuk kamar mandi'},
    {judul:'Dzikir Pagi — Sayyidul Istighfar',arabic:'اَللّٰهُمَّ أَنْتَ رَبِّيْ لَا إِلٰهَ إِلَّا أَنْتَ خَلَقْتَنِيْ وَأَنَا عَبْدُكَ',latin:'Allaahumma anta rabbii laa ilaaha illaa anta khalaqtanii wa ana abduk.',arti:'Ya Allah, Engkau adalah Tuhanku, tidak ada ilah selain Engkau. Engkau telah menciptakanku dan aku adalah hamba-Mu.',faedah:'Dibaca setiap pagi — penghulu istighfar'},
    {judul:'Dzikir Pagi — Perlindungan',arabic:'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلّٰهِ وَالْحَمْدُ لِلّٰهِ',latin:'Ashbahnaa wa ashbahal mulku lillaah, wal hamdu lillaah.',arti:'Kami berpagi hari dan kerajaan hanya milik Allah, dan segala puji bagi Allah.',faedah:'Dibaca di waktu pagi'},
    {judul:'Dzikir Ayat Kursi',arabic:'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',latin:'Allaahu laa ilaaha illaa huwal hayyul qayyuum, laa ta\'khudzuhuu sinatuw wa laa naum.',arti:'Allah, tidak ada ilah selain Dia. Yang Maha Hidup lagi terus menerus mengurus makhluk-Nya. Tidak mengantuk dan tidak tidur.',faedah:'Penjaga dari segala bahaya — baca tiap pagi & petang'},
  ],
  sore: [
    {judul:'Dzikir Petang',arabic:'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلّٰهِ وَالْحَمْدُ لِلّٰهِ',latin:'Amsainaa wa amsal mulku lillaah, wal hamdu lillaah.',arti:'Kami berpetang hari dan kerajaan hanya milik Allah, dan segala puji bagi Allah.',faedah:'Dibaca di waktu petang'},
    {judul:'Doa Perlindungan Malam',arabic:'اَللّٰهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوْتُ وَإِلَيْكَ الْمَصِيْرُ',latin:'Allaahumma bika amsainaa wa bika ashbahnaa wa bika nahyaa wa bika namuutu wa ilaikal mashiir.',arti:'Ya Allah, dengan-Mu kami berpetang, dengan-Mu kami berpagi, dengan-Mu kami hidup, dengan-Mu kami mati, dan kepada-Mu tempat kembali.',faedah:'Dibaca di waktu petang'},
    {judul:'Shalawat Ibrahimiyyah',arabic:'اَللّٰهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',latin:'Allaahumma shalli \'alaa Muhammad wa \'alaa aali Muhammad.',arti:'Ya Allah, limpahkanlah rahmat kepada Muhammad dan kepada keluarga Muhammad.',faedah:'Perbanyak shalawat di hari Jumat & setiap saat'},
    {judul:'Istighfar',arabic:'أَسْتَغْفِرُ اللّٰهَ الْعَظِيْمَ الَّذِيْ لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّوْمُ وَأَتُوْبُ إِلَيْهِ',latin:'Astaghfirullaahal \'azhiimladzii laa ilaaha illaa huwal hayyul qayyuum wa atuubu ilaih.',arti:'Aku memohon ampun kepada Allah Yang Maha Agung, yang tiada ilah selain Dia, Yang Maha Hidup lagi Maha Berdiri sendiri, dan aku bertaubat kepada-Nya.',faedah:'Baca 3x setiap pagi & petang'},
  ],
  sholat: [
    {judul:'Doa Setelah Sholat Fardhu',arabic:'اَللّٰهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',latin:'Allaahumma antas-salaam wa minkas-salaam, tabaarakta yaa dzal jalaali wal ikraam.',arti:'Ya Allah, Engkau adalah As-Salaam (Yang selamat dari segala kekurangan), dan dari-Mu keselamatan. Maha Berkah Engkau wahai Dzat Yang Maha Agung dan Maha Mulia.',faedah:'Dibaca setelah salam sholat fardhu'},
    {judul:'Tasbih, Tahmid, Takbir',arabic:'سُبْحَانَ اللّٰهِ (٣٣×) اَلْحَمْدُ لِلّٰهِ (٣٣×) اَللّٰهُ أَكْبَرُ (٣٣×)',latin:'Subhaanallaah (33x) — Alhamdulillaah (33x) — Allaahu akbar (33x)',arti:'Maha Suci Allah — Segala Puji bagi Allah — Allah Maha Besar',faedah:'Dibaca 33x masing-masing setelah sholat'},
    {judul:'Doa Memohon Kebaikan',arabic:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',latin:'Rabbanaaa aatinaa fid-dunyaa hasanataw wa fil-aakhirati hasanataw wa qinaa \'adzaaban-naar.',arti:'Ya Tuhan kami, berikanlah kepada kami kebaikan di dunia dan kebaikan di akhirat, dan lindungilah kami dari azab neraka.',faedah:'Doa terbaik yang mencakup kebaikan dunia dan akhirat'},
    {judul:'Doa Qunut Witir',arabic:'اَللّٰهُمَّ اهْدِنِيْ فِيْمَنْ هَدَيْتَ وَعَافِنِيْ فِيْمَنْ عَافَيْتَ',latin:'Allaahummah-dinii fiiman hadait, wa \'aafinii fiiman \'aafait.',arti:'Ya Allah, berilah petunjuk kepadaku sebagaimana orang-orang yang telah Engkau beri petunjuk, dan berilah kesehatan kepadaku sebagaimana orang-orang yang telah Engkau beri kesehatan.',faedah:'Dibaca dalam sholat witir'},
  ],
  belajar: [
    {judul:'Doa Sebelum Belajar',arabic:'رَبِّ زِدْنِيْ عِلْمًا وَارْزُقْنِيْ فَهْمًا',latin:'Rabbi zidnii \'ilmaa warzuqnii fahmaa.',arti:'Ya Tuhanku, tambahkanlah ilmuku dan berilah aku pemahaman.',faedah:'Dibaca sebelum mulai belajar atau menghafal'},
    {judul:'Doa Memohon Kemudahan Hafalan',arabic:'اَللّٰهُمَّ يَسِّرْ لِيْ حِفْظَ كِتَابِكَ وَفَهْمَ مَعَانِيْهِ وَذِكْرَ آيَاتِهِ',latin:'Allaahumma yassir lii hifzha kitaabika wa fahma ma\'aaniihi wa dzikra aayaatih.',arti:'Ya Allah, mudahkanlah bagiku menghafal kitab-Mu, memahami maknanya, dan mengingat ayat-ayat-Nya.',faedah:'Doa khusus untuk para penghafal Al-Qur\'an'},
    {judul:'Doa Agar Tidak Lupa',arabic:'اَللّٰهُمَّ إِنِّيْ أَعُوْذُ بِكَ مِنَ النِّسْيَانِ وَالْكَسَلِ',latin:'Allaahumma innii a\'uudzubika minan-nisyaan wal kasal.',arti:'Ya Allah, sesungguhnya aku berlindung kepada-Mu dari lupa dan rasa malas.',faedah:'Dibaca agar terjaga dari lupa hafalan'},
    {judul:'Doa Sesudah Belajar',arabic:'اَللّٰهُمَّ إِنِّيْ أَسْتَوْدِعُكَ مَا عَلَّمْتَنِيْهِ فَارْدُدْهُ إِلَيَّ عِنْدَ حَاجَتِيْ',latin:'Allaahumma innii astaudi\'uka maa \'allamtaniihi fardud-hu ilayya \'inda haajatii.',arti:'Ya Allah, aku titipkan kepada-Mu ilmu yang telah Engkau ajarkan kepadaku, maka kembalikanlah ia kepadaku saat aku membutuhkannya.',faedah:'Dibaca setelah selesai belajar atau menghafal'},
    {judul:'Doa Niat Menghafal',arabic:'اَللّٰهُمَّ اجْعَلْنِيْ مِنْ أَهْلِ الْقُرْآنِ الَّذِيْنَ هُمْ أَهْلُكَ وَخَاصَّتُكَ',latin:'Allaahumma aj\'alnii min ahlil qur-aanil ladziina hum ahluka wa khaashshatuk.',arti:'Ya Allah, jadikanlah aku termasuk ahli Al-Qur\'an yang mereka adalah keluarga-Mu dan orang-orang pilihan-Mu.',faedah:'Niat mulia sebelum menghafal Al-Qur\'an'},
  ],
  harian: [
    {judul:'Doa Makan',arabic:'اَللّٰهُمَّ بَارِكْ لَنَا فِيْمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ',latin:'Allaahumma baarik lanaa fiimaa razaqtanaa wa qinaa \'adzaaban-naar.',arti:'Ya Allah, berkahilah kami pada rezeki yang telah Engkau anugerahkan kepada kami dan lindungilah kami dari siksa neraka.',faedah:'Dibaca sebelum makan'},
    {judul:'Doa Keluar Rumah',arabic:'بِسْمِ اللّٰهِ تَوَكَّلْتُ عَلَى اللّٰهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ',latin:'Bismillaahi tawakkaltu \'alallaaah, wa laa hawla wa laa quwwata illaa billaah.',arti:'Dengan nama Allah, aku bertawakal kepada Allah, tiada daya dan kekuatan kecuali dengan Allah.',faedah:'Dibaca saat keluar dari rumah'},
    {judul:'Doa Masuk Rumah',arabic:'اَللّٰهُمَّ إِنِّيْ أَسْأَلُكَ خَيْرَ الْمَوْلَجِ وَخَيْرَ الْمَخْرَجِ',latin:'Allaahumma innii as-aluka khairol mawlaji wa khairol makhraj.',arti:'Ya Allah, sesungguhnya aku memohon kepada-Mu kebaikan tempat masuk dan kebaikan tempat keluar.',faedah:'Dibaca saat memasuki rumah'},
    {judul:'Doa Naik Kendaraan',arabic:'سُبْحَانَ الَّذِيْ سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِيْنَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُوْنَ',latin:'Subhaanal ladzii sakhkhara lanaa haadzaa wa maa kunnaa lahuu muqriniin, wa innaa ilaa rabbinaa lamun-qalibuun.',arti:'Maha Suci Allah yang telah menundukkan kendaraan ini untuk kami, padahal kami sebelumnya tidak mampu menguasainya, dan sesungguhnya kami akan kembali kepada Tuhan kami.',faedah:'Dibaca setelah naik kendaraan'},
    {judul:'Doa Sebelum Tidur',arabic:'بِاسْمِكَ اللّٰهُمَّ أَمُوْتُ وَأَحْيَا',latin:'Bismika allahumma amuutu wa ahyaa.',arti:'Dengan nama-Mu ya Allah, aku mati dan aku hidup.',faedah:'Dibaca sebelum tidur'},
  ]
};

let currentDoaTab = 'pagi';
function setDoaTab(tab){
  currentDoaTab = tab;
  document.querySelectorAll('.doa-tab').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.tab===tab);
  });
  renderDoa(tab);
}
function renderDoa(tab){
  const grid = document.getElementById('doaGrid');
  if(!grid) return;
  const data = doaDatabase[tab] || [];
  grid.innerHTML = data.map(d=>`
    <div class="doa-card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,var(--g900),var(--g700));border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <i class="fas fa-hands-praying" style="color:white;font-size:14px;"></i>
        </div>
        <div style="font-size:14px;font-weight:800;color:var(--s800);">${d.judul}</div>
      </div>
      <div class="doa-arabic">${d.arabic}</div>
      <div class="doa-latin">${d.latin}</div>
      <div class="doa-arti">"${d.arti}"</div>
      ${d.faedah?`<div class="doa-faedah"><i class="fas fa-lightbulb" style="margin-right:5px;"></i>${d.faedah}</div>`:''}
    </div>
  `).join('');
}
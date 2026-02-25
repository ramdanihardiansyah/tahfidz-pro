# 📖 TahfidzPro - Aplikasi Monitoring Hafalan Al-Qur'an

Aplikasi web modern untuk monitoring dan tracking hafalan Al-Qur'an santri.

## ✨ Fitur Utama

- 📊 Dashboard monitoring hafalan
- 👥 Manajemen data santri
- 📈 Progress tracking per surat dan ayat
- 🎯 Target hafalan bulanan
- 📋 History setoran lengkap
- 🖨️ Export & cetak raport
- 🎓 Generate sertifikat otomatis
- 📖 Al-Qur'an digital terintegrasi
- 🤲 Database doa & dzikir harian
- 🔐 Proteksi PIN untuk guru
- 💾 Data tersimpan di browser (LocalStorage)
- 🎨 UI modern dengan dark mode

## 🚀 Cara Deploy ke Vercel

### Opsi 1: Deploy via Vercel Dashboard (Paling Mudah)

1. **Buka [vercel.com](https://vercel.com)** dan login/signup
2. Klik **"Add New Project"**
3. Pilih **"Import Git Repository"** atau upload file
4. Upload semua file dari folder ini
5. Klik **"Deploy"**
6. Selesai! Aplikasi akan live dalam 1-2 menit

### Opsi 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy
vercel

# Deploy ke production
vercel --prod
```

## 📝 Cara Menggunakan

1. **Login Pertama Kali**
   - Masukkan PIN default: `1234`
   - Isi data lembaga dan guru
   - Upload logo lembaga (opsional)
   - Atur kelas yang tersedia

2. **Tambah Siswa**
   - Klik tombol "+ Tambah Siswa"
   - Atau tekan `Ctrl + N`

3. **Input Setoran**
   - Klik nama siswa di daftar
   - Pilih surat dan ayat terakhir
   - Tambahkan catatan jika perlu
   - Simpan

4. **Monitoring**
   - Lihat progress di dashboard
   - Filter berdasarkan kelas atau status
   - Cari siswa dengan `Ctrl + K`

## 🛠️ Cara Edit Setelah Deploy

### Via Vercel Dashboard:
1. Buka project di [vercel.com/dashboard](https://vercel.com/dashboard)
2. Pilih project TahfidzPro
3. Klik tab **"Settings"** > **"Source Code"**
4. Edit file `index.html`
5. Commit changes
6. Vercel akan auto-deploy

### Via Git (Recommended):
1. Push code ke GitHub/GitLab
2. Connect repository ke Vercel
3. Setiap push akan auto-deploy
4. Rollback mudah jika ada error

### Via Vercel CLI:
```bash
# Edit file index.html di local
# Lalu deploy ulang
vercel --prod
```

## 📱 Teknologi

- HTML5 + CSS3
- Vanilla JavaScript (No framework)
- LocalStorage untuk data persistence
- Chart.js untuk visualisasi
- SweetAlert2 untuk notifikasi
- Font Awesome untuk icons
- Google Fonts (Amiri & Plus Jakarta Sans)

## 🔒 Keamanan

- Data tersimpan lokal di browser masing-masing user
- Proteksi PIN untuk akses guru
- Tidak ada backend/database eksternal
- Privacy-focused

## 💡 Tips

- Backup data secara berkala (Export)
- Gunakan browser modern (Chrome, Firefox, Edge)
- Aktifkan "Add to Home Screen" di mobile
- Gunakan keyboard shortcuts untuk efisiensi

## 🎯 Keyboard Shortcuts

- `Ctrl + K` - Quick search siswa
- `Ctrl + N` - Tambah siswa baru
- `Ctrl + P` - Print/Export
- `Ctrl + /` - Lihat semua shortcuts

## 📞 Support

Untuk pertanyaan atau bug report, silakan hubungi developer.

---

**© 2024 TahfidzPro** - Dibuat dengan ❤️ untuk kemudahan monitoring hafalan

# 🤖 Telegram Force Subscribe Bot

Bot Telegram premium dengan sistem Force Subscribe, auto-protect file, dan panel admin lengkap.

---

## ✨ Fitur Utama

- 🔒 **Force Subscribe** — User wajib join semua channel/grup sebelum akses file
- 🔄 **Realtime Check** — Cek keanggotaan via `getChatMember` setiap request
- 📁 **Auto File Protect** — Semua file admin otomatis terkunci & generate protected link
- 📦 **Batch Link** — Gabungkan banyak file dalam satu link
- 🔗 **GenLink** — Generate protected link instan untuk satu file
- 📢 **Broadcast** — Kirim pesan ke semua user
- 🛡️ **Admin Panel** — Manajemen admin, channel, konten, pengaturan
- 🎨 **UI Premium** — Blockquote merah Telegram, inline keyboard modern

---

## 🚀 Deploy

### Persyaratan
- Node.js >= 18
- MongoDB Atlas (free tier cukup)
- Akun Heroku (atau Railway/Render)

### 1. Clone & Setup

```bash
git clone https://github.com/yourrepo/fsub-bot.git
cd fsub-bot
cp .env.example .env
# Edit .env dengan token dan config kamu
npm install
```

### 2. Isi `.env`

```env
BOT_TOKEN=token_dari_botfather
OWNER_ID=telegram_id_kamu
MONGO_URI=mongodb+srv://...
BOT_USERNAME=username_bot_tanpa_@
BOT_NAME=NAMA BOT KAMU
```

### 3. Jalankan Lokal

```bash
npm run dev
```

### 4. Deploy ke Heroku

```bash
heroku create nama-bot-kamu
heroku config:set BOT_TOKEN=xxx OWNER_ID=xxx MONGO_URI=xxx BOT_USERNAME=xxx BOT_NAME="Nama Bot"
git push heroku main
heroku ps:scale web=1
```

---

## 🛠️ Setup Bot di Telegram

1. Buat bot via [@BotFather](https://t.me/BotFather) → `/newbot`
2. Jadikan bot sebagai **admin** di channel/grup yang ingin dijadikan force-sub
3. Tambahkan channel dengan: `/addbutton @channelkamu` atau `/addbutton -1001234567890`
4. Set database channel (tempat file disimpan): `/setdb -1001234567890`
5. Upload file → bot otomatis generate protected link!

---

## 📋 Semua Command

### 👤 User
| Command | Deskripsi |
|---------|-----------|
| `/start` | Mulai bot |
| `/help` | Daftar perintah |
| `/ping` | Cek status bot |

### 🛡️ Admin
| Command | Deskripsi |
|---------|-----------|
| `/users` | Jumlah pengguna |
| `/broadcast` | Kirim pesan siaran (reply ke pesan) |
| `/addadmin [id]` | Tambah admin |
| `/deladmin [id]` | Hapus admin |
| `/getadmin` | Daftar admin |
| `/info` | Status bot lengkap |
| `/uptime` | Waktu aktif bot |
| `/addbutton [id]` | Tambah channel force-sub |
| `/delbutton [id]` | Hapus channel force-sub |
| `/getbutton` | Lihat channel aktif |
| `/addkonten [id]` | Tambah channel konten |
| `/delkonten [id]` | Hapus channel konten |
| `/getkonten` | Lihat channel konten |
| `/limitbutton` | Cek jumlah button |
| `/limitkonten` | Cek jumlah konten |
| `/protect [true/false]` | Mode protect file |
| `/setdb [id]` | Set database channel |
| `/getdb` | Cek database channel |
| `/setmsg` | Atur pesan welcome & wajib-join |
| `/batch` | Mulai sesi batch |
| `/done` | Selesaikan batch & buat link |
| `/cancel_batch` | Batalkan sesi batch |
| `/genlink` | Generate link untuk 1 file |

---

## 🏗️ Struktur Project

```
fsub-bot/
├── index.js              # Entry point
├── config/               # Konfigurasi env
├── commands/             # Admin & user commands
├── handlers/             # Event handlers (start, callback, file)
├── middleware/           # Auth, anti-spam, track user
├── database/
│   ├── connection.js
│   └── models/           # User, Admin, Channel, File, Batch, Settings
├── services/             # Business logic
├── utils/                # Format, keyboard, logger, uptime
├── Procfile              # Heroku
├── .env.example
└── README.md
```

---

## 🔐 Cara Kerja Force Subscribe

1. User kirim `/start` atau klik link file
2. Bot cek semua channel via `getChatMember` — **realtime**
3. Jika belum join → tampilkan pesan + tombol join
4. Jika sudah keluar setelah pernah join → tetap ditolak (no bypass!)
5. Setelah join semua → file dikirim otomatis

---

## 📝 License

MIT © 2024

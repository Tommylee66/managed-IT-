PT. Bumi Cerdas Teknologi ("Perusahaan") memproses data pribadi dalam menyediakan layanan BCT Total IT Care. Kebijakan ini menjelaskan data apa yang kami kumpulkan dan mengapa, berapa lama kami menyimpannya, dan hak apa yang Anda miliki. Dasar hukumnya adalah Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).

## 1. Pengendali Data Pribadi

| Keterangan | Isi |
| --- | --- |
| Pengendali | PT. Bumi Cerdas Teknologi |
| Alamat | [[alamat terdaftar]] |
| NIB / NPWP | [[NIB]] / [[NPWP perusahaan]] |
| Kontak | [[email kontak data pribadi]] |

Server Perusahaan berada di luar Indonesia, namun karena memproses data pribadi warga negara Indonesia, pemrosesan ini tunduk pada UU PDP sesuai Pasal 2.

## 2. Data Pribadi yang Dikumpulkan

Perusahaan hanya mengumpulkan data yang diperlukan untuk menyediakan layanan, dan tidak melampaui daftar berikut kecuali diberitahukan terlebih dahulu.

**Kontak pelanggan**

Nama, nomor telepon, email, email penerima tagihan, alamat.

**Agen penjualan**

Nama, nomor telepon, email, alamat, NPWP, KTP, nama bank, nomor rekening, nama pemilik rekening, dan tingkat komisi.

KTP dan data rekening termasuk **data pribadi spesifik** (data keuangan) menurut Pasal 4 UU PDP, dan Perusahaan memperlakukannya lebih ketat daripada data umum.

**Karyawan**

Nama, email (akun masuk), peran, dan status akun. Kata sandi disimpan sebagai hash oleh layanan autentikasi; Perusahaan tidak dapat melihat aslinya.

**Data operasional layanan**

Akun dan kata sandi sistem pelanggan yang dipercayakan kepada Perusahaan, data ekstensi telepon IP (nama pengguna, nomor ekstensi), serta catatan gangguan dan inspeksi.

Perusahaan **tidak mengumpulkan** data biometrik, genetika, kesehatan, catatan kejahatan, data anak, data lokasi, maupun pengenal iklan.

## 3. Tujuan Pemrosesan dan Dasar Hukum

| Subjek | Tujuan | Dasar hukum |
| --- | --- | --- |
| Kontak pelanggan | Penawaran, kontrak, aktivasi, penagihan, penanganan gangguan | Pelaksanaan kontrak |
| Nama, kontak, rekening agen | Pengelolaan kontrak keagenan, pembayaran komisi | Pelaksanaan kontrak |
| NPWP dan KTP agen | Pemotongan dan pelaporan PPh 21 | Kewajiban hukum |
| NPWP pelanggan | Penerbitan faktur pajak | Kewajiban hukum |
| Akun karyawan | Pengelolaan hak akses sistem | Pelaksanaan kontrak |
| Catatan audit | Deteksi akses tidak sah, akuntabilitas | Kepentingan yang sah |
| Akun sistem yang dikelola | Pengoperasian infrastruktur TI pelanggan | Pelaksanaan kontrak |

Perusahaan tidak menggunakan data pribadi di luar tujuan tersebut. Perusahaan tidak melakukan pemasaran langsung maupun pengambilan keputusan otomatis (profiling); bila kelak dilakukan, hal itu akan diberitahukan lebih dahulu dengan dasar hukum tersendiri.

## 4. Masa Penyimpanan

| Data | Masa penyimpanan |
| --- | --- |
| Kontrak, tagihan, faktur pajak | 10 tahun |
| NPWP, KTP, rekening agen | 10 tahun |
| Penawaran yang tidak menjadi kontrak | 2 tahun |
| Kontak pelanggan | 3 tahun setelah kontrak berakhir |
| Catatan layanan, gangguan, dan inspeksi | 3 tahun |
| Catatan audit | 3 tahun |
| Akun dan kata sandi sistem yang dikelola | **Dihapus segera saat kontrak berakhir** |
| Akun karyawan | [[belum ditentukan]] setelah berhenti bekerja |

Kontrak, tagihan, dan faktur pajak wajib disimpan menurut ketentuan perpajakan, sehingga **dokumennya tetap disimpan** meski masa tersebut terlampaui. Namun data yang mengidentifikasi orang — nama, kontak, rekening — dihapus dari catatan agen atau pelanggan yang dirujuk dokumen itu, sehingga catatan yang tersisa tidak lagi dapat mengidentifikasi siapa pun.

## 5. Pengungkapan kepada Pihak Ketiga dan Prosesor

Perusahaan **tidak menjual data pribadi dan tidak memberikannya untuk tujuan pemasaran.**

Untuk menjalankan layanan, pemrosesan dipercayakan kepada pihak berikut.

| Prosesor | Peran | Lokasi |
| --- | --- | --- |
| Supabase | Basis data, autentikasi | Singapura |
| Vercel | Hosting aplikasi | Amerika Serikat dan lainnya |
| [[layanan pengiriman email]] | Pengiriman laporan bulanan | [[lokasi]] |

Data juga dapat diberikan bila diwajibkan peraturan — pelaporan kepada otoritas pajak, permintaan sah dari pengadilan atau aparat penegak hukum, dan akses lembaga pengawas untuk keperluan pengawasan.

## 6. Transfer ke Luar Negeri

Karena prosesor di atas berada di luar Indonesia, data pribadi ditransfer ke luar negeri. Sesuai Pasal 56 UU PDP, Perusahaan mengikat prosesor dengan perjanjian pemrosesan data yang memuat klausul kontraktual standar, sehingga tingkat pelindungan di tempat penerima setara dengan yang diwajibkan undang-undang ini.

## 7. Langkah Pengamanan

- Kata sandi sistem yang dikelola disimpan terenkripsi dengan AES-256-GCM, dan kuncinya disimpan terpisah dari basis data. Kebocoran basis data saja tidak memungkinkan pemulihan kata sandi.
- Seluruh jalur komunikasi menggunakan TLS.
- Akses dibatasi menurut peran. Akun agen penjualan hanya dapat melihat pelanggan dan kontraknya sendiri, dan pembatasan ini dijalankan langsung oleh basis data.
- Bagi peran dengan kewenangan terbatas, nomor rekening dan NPWP hanya ditampilkan sebagian.
- Tindakan administratif dan setiap pengeluaran data (cetak dokumen, ekspor riwayat, dekripsi kata sandi) dicatat, dan catatan tersebut tidak dapat diubah maupun dihapus.

## 8. Hak Anda

Sesuai Pasal 5 sampai Pasal 15 UU PDP, Anda berhak:

- **Mengakses dan memperoleh salinan** data pribadi Anda yang kami simpan
- **Memperbaiki** data yang tidak akurat
- **Menghapus** data yang tujuan pemrosesannya telah berakhir
- **Menarik persetujuan** atas pemrosesan yang didasarkan pada persetujuan
- **Membatasi pemrosesan dan mengajukan keberatan**
- **Memperoleh data Anda dalam format yang dapat dibaca mesin** (pemindahan data)
- **Menuntut ganti rugi** atas kerugian akibat pelanggaran

Silakan ajukan permintaan ke [[email kontak data pribadi]]. Kami akan memverifikasi identitas Anda, memprosesnya, dan menyampaikan hasilnya. Penghapusan dapat dibatasi untuk data yang wajib disimpan menurut ketentuan perpajakan; dalam hal itu kami akan menjelaskan alasannya.

## 9. Bila Terjadi Kebocoran Data

Perusahaan memberitahukan subjek data dan lembaga pengawas dalam waktu **3×24 jam** sejak kebocoran diketahui. Pemberitahuan memuat jenis data yang terungkap, waktu dan kronologi kejadian, dampak yang diperkirakan, tindakan yang telah diambil Perusahaan, langkah yang dapat dilakukan subjek data, dan kontak penanggung jawab.

## 10. Kontak

| Keterangan | Isi |
| --- | --- |
| Penanggung jawab | [[nama / jabatan]] |
| Email | [[email kontak data pribadi]] |
| Telepon | [[nomor telepon]] |

## 11. Perubahan Kebijakan

Kebijakan ini berlaku sejak [[tanggal berlaku]]. Setiap perubahan akan diberitahukan melalui pengumuman layanan dan email terdaftar [[7 hari]] sebelum berlaku. Perubahan penting — seperti penambahan data yang dikumpulkan atau perubahan tujuan pemrosesan — akan dinyatakan secara tersendiri.

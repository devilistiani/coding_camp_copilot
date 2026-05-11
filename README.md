#  Coding Camp Copilot — CC26-PSU096

> **Tema:** Accessible & Adaptive Learning  
> **Program:** Coding Camp — Capstone Project


##  Anggota Kelompok

 Nama  ID  Peran ,
 Devi Listiani Safitri , CDCC226D6X1183 , Data Scientist ,
 Anthony Saputra , CDCC429D6Y0092 , Data Scientist ,
 Rizki Alsyareno , CFCC848D6Y0433 , Full-Stack Web Developer ,
 Siti Nur Padila , CFCC809D6X0843 , Full-Stack Web Developer ,
 Naila Hilwatus Syifa , CACC284D6X1586 , AI Engineer ,
 Gabriella Elizabeth Devabharata , CACC284D6X1746 , AI Engineer .


##  Deskripsi Proyek

- Latar Belakang

    Peserta Coding Camp sering mengajukan pertanyaan yang sama berulang kali bukan karena informasi tidak tersedia, melainkan karena informasi tersebar di berbagai platform (Google Docs, Spreadsheet, dll.) sehingga sulit diakses dengan cepat. Kondisi ini membebani fasilitator,dan memperlambat penanganan pertanyaan yang lebih kompleks.
    
- Solusi

    Coding Camp Copilot adalah sistem chat customer service berbasis AI yang mengintegrasikan berbagai sumber informasi ke dalam satu pintu layanan terpadu. Sistem ini mampu:

    - Mengklasifikasikan jenis permasalahan peserta berdasarkan kategori jalur studi.
    - Menentukan tingkat urgensi penanganan pertanyaan (low / medium / high).
    - Memberikan draft reply otomatis menggunakan integrasi Generative AI berbasis RAG (Retrieval-Augmented Generation).

- Output Proyek

    - Model AI dalam format .keras / SavedModel
    - REST API terintegrasi (ML API + Backend API)
    - Aplikasi Web dengan Live URL sebagai antarmuka pengguna
    - Dashboard interaktif berbasis Streamlit
    - Dokumentasi lengkap (Laporan Teknis, Project Brief, Slide Presentasi)

##  Pertanyaan Bisnis

1. Kategori jalur mana (AI Engineer, Data Sains, Full Stack Development) yang memiliki volume pertanyaan terbanyak dalam dataset, dan berapa persentase dominasinya?
2. Apa 10 kata kunci atau topik yang paling sering muncul dalam pertanyaan peserta secara keseluruhan, dan apakah topik tersebut berbeda antar kategori jalur?


##  Struktur Folder


project/
  prosesing.ipynb               # Notebook utama: EDA, cleaning, feature engineering
  data/
     - Dataset_Capstone_Project.csv # Dataset mentah (365 baris, 5 kolom)
     - data_bersih.csv              # Dataset hasil cleaning + feature manual (355 baris, 10 kolom)
     - dataset_tfidf.csv            # Dataset dengan fitur TF-IDF (355 baris, 110 kolom)
     - dataset_indobert.csv         # Dataset dengan embedding IndoBERT (355 baris, 778 kolom)



##  Dataset

### `Dataset_Capstone_Project.csv` — Data Mentah
- **Ukuran:** 365 baris × 5 kolom
- **Sumber:** Forum/chat program CodingCamp dan live yutube CodingCamp
- **Bahasa:** Indonesia (informal/conversational)

 Kolom  Tipe  Deskripsi 
 ID  string  Identitas unik peserta (51.5% kosong) 
 Nama  string  Nama/username peserta 
 Path  string  Jalur studi peserta (15 variasi → 3 kategori) 
 Pertanyaan  string  Teks pertanyaan peserta (input model) 
 Jawaban  string  Teks jawaban mentor (target model) 


### `data_bersih.csv` — Data Hasil Cleaning
- **Ukuran:** 355 baris × 10 kolom
- Kolom ID dihapus, Path diubah menjadi `Kategori`, teks dinormalisasi.
- Ditambahkan fitur manual: `Panjang_Pertanyaan`, `Panjang_Jawaban`, `Jumlah_Kata_Pertanyaan`, `Jumlah_Kata_Jawaban`, `Kategori_Bersih`, `Kategori_Label`.


### `dataset_tfidf.csv` — Fitur TF-IDF
- **Ukuran:** 355 baris × 110 kolom
- Menggunakan `TfidfVectorizer` dengan `max_features=100` dan `ngram_range=(1,2)`.
- 10 kolom pertama adalah kolom dari `data_bersih.csv`, 100 kolom berikutnya adalah fitur TF-IDF.


### `dataset_indobert.csv` — Embedding IndoBERT
- **Ukuran:** 355 baris × 778 kolom
- Menggunakan model `indobenchmark/indobert-base-p1` untuk menghasilkan 768-dimensi embedding dari kolom `Pertanyaan`.
- 10 kolom pertama adalah kolom dari `data_bersih.csv`, 768 kolom berikutnya adalah vektor embedding (`indo_0` s.d. `indo_767`).


##  Alur Proses (Pipeline)


Dataset Mentah (365 baris)

    Data Wrangling
    Assessing Data (null, duplikat, distribusi teks)
    Cleaning Data (normalisasi, drop kolom, filter teks)
        

    Data Bersih (355 baris)

    EDA
    Distribusi kategori jalur
    Distribusi panjang teks
    Top-10 kata kunci global
    Top-10 kata kunci per jalur

  Feature Engineering
    Fitur Manual (panjang teks, jumlah kata)
    TF-IDF (100 fitur, unigram + bigram)
    IndoBERT Embedding (768 dimensi)



##  Library yang Digunakan

python
pandas
matplotlib
re
collections
wordcloud
scikit-learn       
transformers       
torch
numpy
seaborn



##  Insight Utama

- **Distribusi jalur merata:** Data Sains (36.6%), Full Stack Development (33.9%), AI Engineer (29.5%) — tidak ada jalur yang mendominasi secara signifikan.
- **Pertanyaan bersifat prosedural:** Kata paling dominan adalah *ilt*, *sesi*, *capstone*, *kelas* — bukan istilah teknis. Ini memvalidasi kebutuhan Coding Camp Copilot sebagai chatbot FAQ otomatis.
- **Perbedaan antar jalur:** Full Stack Development lebih banyak bertanya seputar dokumen dan koordinasi proyek, sementara Data Sains dan AI Engineer lebih banyak bertanya tentang jadwal dan mekanisme ILT.


## Catatan

- Dataset tidak memiliki kolom timestamp, sehingga analisis berbasis waktu tidak dapat dilakukan.
- Pengumpulan data dilakukan tanggal 9 Februari 2026, sampai 17 April 2026.
- 30.4% data (111 baris) tidak dapat diidentifikasi jalurnya karena kolom Path kosong dan dihapus saat cleaning.
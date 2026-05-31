import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier



st.set_page_config(
    page_title="Coding Camp Copilot",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# CSS 
st.markdown("""
<style>
    /* Font & Warna Dasar */
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif;
    }

    /* Header utama */
    h1 { font-size: 2rem !important; font-weight: 800 !important; }
    h2, h3 { font-weight: 700 !important; }

    /* Metric Card */
    [data-testid="metric-container"] {
        background: linear-gradient(135deg, #1e293b, #0f172a);
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 16px 20px;
    }
    [data-testid="metric-container"] label {
        color: #94a3b8 !important;
        font-size: 0.78rem !important;
        font-weight: 600 !important;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    [data-testid="metric-container"] [data-testid="stMetricValue"] {
        font-size: 1.9rem !important;
        font-weight: 800 !important;
        color: #f1f5f9 !important;
    }

    /* Tabs */
    [data-baseweb="tab-list"] {
        gap: 8px;
        border-bottom: 2px solid #1e293b;
    }
    [data-baseweb="tab"] {
        font-weight: 600 !important;
        font-size: 0.88rem !important;
        border-radius: 8px 8px 0 0 !important;
        padding: 10px 18px !important;
    }

    /* Dataframe */
    .stDataFrame { border-radius: 10px; overflow: hidden; }

    /* Button */
    .stButton > button {
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        color: white;
        border: none;
        border-radius: 10px;
        padding: 10px 28px;
        font-weight: 700;
        font-size: 0.95rem;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(99,102,241,0.4);
        color: white;
    }

    /* Divider */
    hr { border-color: #1e293b; }

    /* Chart section card */
    .chart-card {
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 14px;
        padding: 20px;
        margin-bottom: 20px;
    }

    /* Insight box */
    .insight-box {
        background: linear-gradient(135deg, #1e293b, #162032);
        border-left: 4px solid #6366f1;
        border-radius: 0 10px 10px 0;
        padding: 14px 18px;
        margin: 10px 0;
        font-size: 0.9rem;
        color: #cbd5e1;
    }
</style>
""", unsafe_allow_html=True)


st.title("🚀 Dashboard Analisis QA: Coding Camp Copilot")
st.markdown(
    "Dashboard eksplorasi data QnA dan evaluasi model **TF-IDF** vs **IndoBERT** "
    "untuk mengklasifikasikan pertanyaan peserta berdasarkan **Path** program."
)
st.markdown("---")


@st.cache_data
def load_data():
    df_bersih = pd.read_csv("data/data_bersih.csv")
    df_ab_test = pd.read_csv("data/hasil_ab_testing.csv")
    df_tfidf = pd.read_csv("data/dataset_tfidf.csv")

  # filter path yang tidak dipakai di dataset final  
    df_bersih = df_bersih.rename(columns={"Kategori_Bersih": "Path"})


    df_bersih = df_bersih[
        ~df_bersih["Path"].str.strip().str.lower().isin(["tidak diketahui", "unknown", ""])
    ]
    df_bersih = df_bersih.dropna(subset=["Path"])

    return df_bersih, df_ab_test, df_tfidf

df_bersih, df_ab_test, df_tfidf = load_data()


@st.cache_resource
def train_model(_df_tfidf):
    X = _df_tfidf.iloc[:, 10:]
    y = _df_tfidf["Kategori_Label"]
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X, y)
    return model, X.columns.tolist()

model_rf, daftar_kosakata = train_model(df_tfidf)

PATH_COLORS = {
    "AI Engineer":           "#6366f1",
    "Data Sains":            "#f59e0b",
    "Full Stack Development":"#10b981",
    "Data Scientist":        "#f59e0b",
    "Full Stack":            "#10b981",
}

def get_colors(labels):
    default = ["#6366f1","#f59e0b","#10b981","#ec4899","#3b82f6"]
    return [PATH_COLORS.get(l, default[i % len(default)]) for i, l in enumerate(labels)]


tab1, tab2, tab3, tab4 = st.tabs([
    "📊 Eksplorasi Data",
    "🤖 A/B Testing Model",
    "🔮 Simulasi Live",
    "📈 Insight & Ringkasan",
])

with tab1:
    st.subheader("Distribusi Pertanyaan Peserta Berdasarkan Path")

    # Metrics
    path_counts   = df_bersih["Path"].value_counts()
    path_terbanyak = path_counts.idxmax()
    jumlah_path   = df_bersih["Path"].nunique()

    c1, c2, c3 = st.columns(3)
    c1.metric("Total QnA",       len(df_bersih))
    c2.metric("Path Terbanyak",  path_terbanyak)
    c3.metric("Jumlah Path",     jumlah_path)

    st.markdown("---")


    col_pie, col_bar = st.columns([1, 1])

    with col_pie:
        st.markdown("#### 🥧 Proporsi Setiap Path")
        colors = get_colors(path_counts.index.tolist())

        fig_pie, ax_pie = plt.subplots(figsize=(4, 4))   # ← LEBIH KECIL
        fig_pie.patch.set_facecolor("#0f172a")
        ax_pie.set_facecolor("#0f172a")

        wedges, texts, autotexts = ax_pie.pie(
            path_counts,
            labels=path_counts.index,
            autopct="%1.1f%%",
            startangle=90,
            colors=colors,
            wedgeprops=dict(width=0.65, edgecolor="#0f172a", linewidth=2),  # donut style
            pctdistance=0.75,
        )
        for t in texts:
            t.set_color("#cbd5e1")
            t.set_fontsize(8)
        for at in autotexts:
            at.set_color("white")
            at.set_fontweight("bold")
            at.set_fontsize(8)

        ax_pie.axis("equal")
        st.pyplot(fig_pie, use_container_width=False)

   
    with col_bar:
        st.markdown("#### 📊 Jumlah Pertanyaan per Path")
        colors_bar = get_colors(path_counts.index.tolist())

        fig_bar, ax_bar = plt.subplots(figsize=(5, 4))
        fig_bar.patch.set_facecolor("#0f172a")
        ax_bar.set_facecolor("#0f172a")

        bars = ax_bar.barh(
            path_counts.index[::-1],
            path_counts.values[::-1],
            color=colors_bar[::-1],
            edgecolor="none",
            height=0.55,
        )
       
        for bar in bars:
            w = bar.get_width()
            ax_bar.text(
                w + 1, bar.get_y() + bar.get_height() / 2,
                str(int(w)), va="center", color="#94a3b8", fontsize=9,
            )
        ax_bar.tick_params(colors="#94a3b8")
        ax_bar.spines[:].set_visible(False)
        ax_bar.set_xlabel("Jumlah Pertanyaan", color="#94a3b8", fontsize=9)
        ax_bar.xaxis.label.set_color("#94a3b8")
        ax_bar.tick_params(axis="x", colors="#94a3b8")
        ax_bar.tick_params(axis="y", colors="#cbd5e1")
        st.pyplot(fig_bar, use_container_width=False)

    st.markdown("---")

   
    st.markdown("### 🔍 Detail Pertanyaan Berdasarkan Path")

    col_sel, col_search = st.columns([1, 2])
    with col_sel:
        pilihan_path = st.selectbox(
            "Pilih Path:",
            ["Semua Path"] + sorted(df_bersih["Path"].unique().tolist()),
        )
    with col_search:
        keyword = st.text_input("🔎 Cari kata kunci dalam pertanyaan:", placeholder="Ketik kata kunci...")

    df_tampil = df_bersih if pilihan_path == "Semua Path" else df_bersih[df_bersih["Path"] == pilihan_path]
    if keyword.strip():
        df_tampil = df_tampil[df_tampil["Pertanyaan"].str.contains(keyword, case=False, na=False)]

    st.info(f"Menampilkan **{len(df_tampil)}** pertanyaan dari **{pilihan_path}**"
            + (f" dengan kata kunci **'{keyword}'**" if keyword.strip() else ""))

    cols_show = [c for c in ["Nama", "Path", "Pertanyaan", "Jawaban"] if c in df_tampil.columns]
    st.dataframe(df_tampil[cols_show], use_container_width=True, height=320)

# A/B TESTING
with tab2:
    st.subheader("Perbandingan Akurasi: TF-IDF vs IndoBERT")

    # Tabel
    st.dataframe(df_ab_test, use_container_width=True)

    col_a, col_b = st.columns([3, 2])

    with col_a:
        st.markdown("#### 📊 Bar Chart Akurasi")
        fig_ab, ax_ab = plt.subplots(figsize=(5, 3.5))
        fig_ab.patch.set_facecolor("#0f172a")
        ax_ab.set_facecolor("#0f172a")

        bar_colors = ["#6366f1", "#f59e0b"]
        bars = ax_ab.bar(
            df_ab_test["Metode"], df_ab_test["Akurasi"],
            color=bar_colors, width=0.45, edgecolor="none",
        )
        for bar in bars:
            h = bar.get_height()
            ax_ab.text(
                bar.get_x() + bar.get_width() / 2, h + 0.5,
                f"{h:.1f}%", ha="center", va="bottom",
                color="white", fontweight="bold", fontsize=11,
            )
        ax_ab.set_ylim(0, 50)
        ax_ab.set_ylabel("Akurasi (%)", color="#94a3b8")
        ax_ab.set_title("Akurasi Model A/B Testing", color="#f1f5f9", fontweight="bold")
        ax_ab.tick_params(colors="#94a3b8")
        ax_ab.spines[:].set_visible(False)
        ax_ab.set_facecolor("#0f172a")
        st.pyplot(fig_ab, use_container_width=False)

    with col_b:
        st.markdown("#### 🏆 Kesimpulan")
        akurasi_indobert = df_ab_test[df_ab_test["Metode"] == "IndoBERT"]["Akurasi"].values
        akurasi_tfidf    = df_ab_test[df_ab_test["Metode"] == "TF-IDF"]["Akurasi"].values

        if len(akurasi_indobert) and len(akurasi_tfidf):
            selisih = float(akurasi_indobert[0]) - float(akurasi_tfidf[0])
            st.success(
                f"**IndoBERT** unggul **{selisih:.1f}%** dibanding TF-IDF.\n\n"
                f"IndoBERT memahami konteks bahasa Indonesia lebih baik, "
                f"cocok untuk teks percakapan informal peserta."
            )
        else:
            st.success("IndoBERT sedikit mengungguli TF-IDF pada dataset ini.")

        st.markdown("""
<div class="insight-box">
💡 <b>Catatan:</b> Akurasi keduanya masih rendah (&lt;40%). 
Ini wajar untuk dataset kecil. Perluasan data & fine-tuning IndoBERT 
dapat meningkatkan performa secara signifikan.
</div>
""", unsafe_allow_html=True)

   
    if len(df_ab_test.columns) > 2:
        st.markdown("---")
        st.markdown("#### 📋 Metrik Lengkap")
        st.dataframe(df_ab_test, use_container_width=True)

    
with tab3:
    st.subheader("🔮 Uji Kecerdasan Coding Camp Copilot")
    st.write("Ketikkan pertanyaan administratif baru untuk melihat prediksi Path secara real-time.")

   
    st.markdown("**Coba contoh pertanyaan:**")
    contoh_cols = st.columns(3)
    contoh_questions = [
        "kak jadwal ILT kapan ya?",
        "email sertifikat belum masuk gimana?",
        "kelompok capstone digabung atau pisah?",
    ]
    for i, (col, q) in enumerate(zip(contoh_cols, contoh_questions)):
        with col:
            if st.button(f"💬 {q[:30]}...", key=f"btn_{i}"):
                st.session_state["quick_question"] = q

    default_q = st.session_state.get("quick_question", "")
    input_user = st.text_area(
        "Masukkan Pertanyaan Baru:",
        value=default_q,
        placeholder="Contoh: kak kelompok capstone digabung atau pisah jalur ya?",
        height=110,
    )

    mapping_path = {
        0: "AI Engineer",
        1: "Data Scientist",
        2: "Full Stack Development",
    }
    path_emoji = {
        "AI Engineer":           "🤖",
        "Data Scientist":        "📊",
        "Full Stack Development":"💻",
    }

    if st.button("🔍 Prediksi Path", use_container_width=False):
        if input_user.strip() == "":
            st.warning("Silakan masukkan teks pertanyaan terlebih dahulu!")
        else:
            teks_proses  = input_user.lower()
            fitur_input  = {kata: 0.0 for kata in daftar_kosakata}
            for kata in daftar_kosakata:
                if kata in teks_proses:
                    fitur_input[kata] = 1.0

            df_fitur      = pd.DataFrame([fitur_input])
            hasil_prediksi = model_rf.predict(df_fitur)[0]
            path_final    = mapping_path.get(hasil_prediksi, "Tidak Terklasifikasi")
            proba         = model_rf.predict_proba(df_fitur)[0]

            emoji = path_emoji.get(path_final, "📌")
            st.markdown(f"### {emoji} Hasil Prediksi")

            r1, r2 = st.columns([2, 3])
            with r1:
                st.success(f"**Path: {path_final}**")
            with r2:
                st.markdown("**Distribusi Keyakinan Model:**")
                for idx, prob in enumerate(proba):
                    nama = mapping_path.get(idx, f"Label {idx}")
                    st.progress(float(prob), text=f"{nama}: {prob*100:.1f}%")

            st.info(
                "💡 **Rekomendasi:** Pertanyaan ini bersifat prosedural/administratif. "
                "Disarankan merujuk ke FAQ resmi pada Playbook Capstone program."
            )

with tab4:
    st.subheader("📈 Insight & Ringkasan Analisis")

    path_counts = df_bersih["Path"].value_counts()

    col_i1, col_i2 = st.columns(2)

    with col_i1:
        st.markdown("#### 🔑 Statistik Utama")
        stats = {
            "Total Pertanyaan":     len(df_bersih),
            "Jumlah Path Unik":     df_bersih["Path"].nunique(),
            "Path Dominan":         path_counts.idxmax(),
            "Path Paling Sedikit":  path_counts.idxmin(),
            "Rata-rata per Path":   f"{path_counts.mean():.0f} pertanyaan",
        }
        for k, v in stats.items():
            st.markdown(f"""
<div class="insight-box">
<b>{k}:</b> {v}
</div>""", unsafe_allow_html=True)

    with col_i2:
        st.markdown("#### 📌 Rekomendasi Pengembangan")
        rekomendasi = [
            ("🗂️ Data Labeling", "Pastikan semua data memiliki label Path yang valid untuk meningkatkan kualitas model."),
            ("⚙️ Fine-tuning IndoBERT", "Lakukan fine-tuning IndoBERT pada domain Coding Camp untuk akurasi lebih tinggi."),
            ("📚 Perluas Dataset", "Tambah variasi pertanyaan per Path agar model lebih generalizable."),
            ("🔄 Oversampling", "Gunakan teknik SMOTE atau augmentasi teks untuk menangani ketidakseimbangan kelas."),
        ]
        for icon_title, desc in rekomendasi:
            st.markdown(f"""
<div class="insight-box">
<b>{icon_title}</b><br>{desc}
</div>""", unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("#### 📊 Distribusi Lengkap Path")
    df_summary = pd.DataFrame({
        "Path":              path_counts.index,
        "Jumlah Pertanyaan": path_counts.values,
        "Persentase (%)":    (path_counts.values / path_counts.sum() * 100).round(1),
    }).reset_index(drop=True)
    st.dataframe(df_summary, use_container_width=True)

import numpy as np
import tensorflow as tf
from model.preprocessing import preprocess

LABEL_NAMES = {
    0: 'Administrasi & Akun',
    1: 'Capstone & Reporting',
    2: 'Materi & Kurikulum',
    3: 'Teknis/Lain-lain'
}

CONFIDENCE_THRESHOLD = 0.50

SYSTEM_PROMPTS = {
    0: (
        "Kamu adalah asisten admin program Coding Camp DBS Foundation. "
        "Bantu peserta dengan pertanyaan seputar akun, email, password, data diri, "
        "dosen pembimbing, MBKM, surat, dan administrasi umum. "
        "Jawab dengan ramah, jelas, dan ringkas dalam Bahasa Indonesia."
    ),
    1: (
        "Kamu adalah asisten capstone program Coding Camp DBS Foundation. "
        "Bantu peserta dengan pertanyaan seputar capstone project, pembentukan tim, "
        "dataset, laporan teknis, briefing, dan mekanisme pengumpulan. "
        "Jawab dengan ramah, teknis jika perlu, dan ringkas dalam Bahasa Indonesia."
    ),
    2: (
        "Kamu adalah asisten kurikulum program Coding Camp DBS Foundation. "
        "Bantu peserta dengan pertanyaan seputar materi, kelas, submission, "
        "sertifikat, framework, library, dan learning path. "
        "Jawab dengan ramah, akurat, dan ringkas dalam Bahasa Indonesia."
    ),
    3: (
        "Kamu adalah asisten teknis program Coding Camp DBS Foundation. "
        "Bantu peserta dengan pertanyaan seputar ILT, kehadiran, reschedule, "
        "daily check-in, dashboard, konsultasi mingguan, dan poin reward. "
        "Jawab dengan ramah, jelas, dan ringkas dalam Bahasa Indonesia."
    ),
}


def predict_intent(text: str, model, tokenizer) -> dict:
    """Prediksi intent satu pertanyaan."""
    if not text or not isinstance(text, str) or len(text.strip()) == 0:
        return {
            'status': 'error',
            'input': text,
            'cleaned_text': '',
            'label': None,
            'category': None,
            'confidence': 0.0,
            'all_scores': {},
            'message': 'Input tidak valid atau kosong.'
        }

    try:
        padded, cleaned = preprocess(text, tokenizer)
        proba = model.predict(padded, verbose=0)[0]
        label = int(np.argmax(proba))
        confidence = float(np.max(proba))

        status = 'ok' if confidence >= CONFIDENCE_THRESHOLD else 'low_confidence'
        message = '' if status == 'ok' else (
            f'Confidence rendah ({confidence:.2%}). '
            'Pertanyaan mungkin ambigu atau di luar domain.'
        )

        return {
            'status': status,
            'input': text,
            'cleaned_text': cleaned,
            'label': label,
            'category': LABEL_NAMES[label],
            'confidence': round(confidence, 4),
            'all_scores': {
                LABEL_NAMES[i]: round(float(p), 4)
                for i, p in enumerate(proba)
            },
            'message': message
        }

    except Exception as e:
        return {
            'status': 'error',
            'input': text,
            'cleaned_text': '',
            'label': None,
            'category': None,
            'confidence': 0.0,
            'all_scores': {},
            'message': f'Inference error: {str(e)}'
        }


def generate_reply(question: str, intent_result: dict, gemini_model) -> str:
    """Generate auto-reply menggunakan Gemini berdasarkan intent."""
    label = intent_result['label']
    system_prompt = SYSTEM_PROMPTS[label]
    category = intent_result['category']

    full_prompt = (
        f"{system_prompt}\n\n"
        f"Kategori pertanyaan yang terdeteksi: {category}\n"
        f"Pertanyaan peserta: {question}\n\n"
        f"Berikan jawaban yang membantu dan to-the-point."
    )

    response = gemini_model.generate_content(full_prompt)
    return response.text.strip()
import time
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

FALLBACK_MESSAGES = {
    0: "Maaf, sistem sedang tidak tersedia. Untuk pertanyaan seputar administrasi dan akun, silakan hubungi fasilitator program melalui kanal resmi.",
    1: "Maaf, sistem sedang tidak tersedia. Untuk pertanyaan seputar capstone project, silakan cek dokumen panduan capstone atau hubungi fasilitator.",
    2: "Maaf, sistem sedang tidak tersedia. Untuk pertanyaan seputar materi dan kurikulum, silakan cek platform Dicoding atau hubungi fasilitator.",
    3: "Maaf, sistem sedang tidak tersedia. Untuk pertanyaan teknis seperti kehadiran ILT atau dashboard, silakan hubungi fasilitator program.",
}


def predict_intent(text: str, model, tokenizer) -> dict:
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
    label = intent_result['label']
    system_prompt = SYSTEM_PROMPTS[label]
    category = intent_result['category']

    full_prompt = (
        f"{system_prompt}\n\n"
        f"Kategori pertanyaan: {category}\n"
        f"Pertanyaan peserta: {question}\n\n"
        f"Berikan jawaban yang membantu dan to-the-point dalam Bahasa Indonesia."
    )

    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            response = gemini_model.generate_content(full_prompt)
            if response and response.text:
                return response.text.strip()

        except Exception as e:
            err = str(e)
            is_retryable = any(
                code in err for code in ["503", "429", "500", "overloaded"]
            )
            if is_retryable and attempt < max_retries:
                time.sleep(5 * attempt)
            else:
                break

    return FALLBACK_MESSAGES.get(
        label,
        "Maaf, sistem sedang tidak tersedia. Silakan hubungi fasilitator program."
    )
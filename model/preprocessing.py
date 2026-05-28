import re
import json
import numpy as np
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

# ── Hyperparameter (harus sama persis dengan notebook) ──
VOCAB_SIZE    = 3000
MAX_LENGTH    = 80
TRUNC_TYPE    = 'post'
PADDING_TYPE  = 'post'
OOV_TOK       = '<OOV>'

SLANG_DICT = {
    'kak': '', 'kakak': '', 'min': '', 'bang': '', 'gan': '', 'bro': '',
    'halo': '', 'hai': '', 'hei': '', 'wkwk': '', 'wkwkwk': '', 'hehe': '',
    'haha': '', 'dong': '', 'deh': '', 'sih': '', 'loh': '', 'lho': '',
    'aku': 'saya', 'gue': 'saya', 'gw': 'saya', 'sy': 'saya',
    'lo': 'anda', 'lu': 'anda', 'kamu': 'anda', 'km': 'kamu',
    'gak': 'tidak', 'ga': 'tidak', 'ngga': 'tidak', 'nggak': 'tidak',
    'gk': 'tidak', 'tdk': 'tidak', 'tak': 'tidak',
    'udah': 'sudah', 'udh': 'sudah', 'sdh': 'sudah', 'uda': 'sudah',
    'blm': 'belum', 'belom': 'belum', 'blum': 'belum',
    'gimana': 'bagaimana', 'gmn': 'bagaimana',
    'kalo': 'kalau', 'klo': 'kalau', 'krn': 'karena', 'karna': 'karena',
    'emang': 'memang', 'aja': 'saja', 'aj': 'saja', 'doang': 'saja',
    'tp': 'tapi', 'tpi': 'tapi', 'yg': 'yang', 'lg': 'lagi', 'jg': 'juga',
    'dgn': 'dengan', 'dg': 'dengan', 'utk': 'untuk',
    'mau': 'ingin', 'mo': 'ingin', 'pengen': 'ingin', 'pengin': 'ingin',
    'pake': 'menggunakan', 'pakai': 'menggunakan', 'make': 'menggunakan',
    'coba': 'mencoba', 'nyoba': 'mencoba', 'tau': 'tahu', 'tw': 'tahu',
    'ntar': 'nanti', 'tar': 'nanti', 'buat': 'membuat', 'bikin': 'membuat',
    'nanya': 'bertanya', 'kenapa': 'mengapa', 'liat': 'lihat',
    'lihat': 'melihat', 'cari': 'mencari', 'nyari': 'mencari',
    'amit amit': 'buruk',
}

STOP_WORDS = set([
    'yang', 'dan', 'di', 'ke', 'dari', 'pada', 'untuk', 'dengan', 'ini',
    'itu', 'atau', 'juga', 'ada', 'saya', 'kami', 'anda', 'kita', 'ia',
    'dia', 'mereka', 'adalah', 'akan', 'dapat', 'bisa', 'oleh',
    'dalam', 'sudah', 'telah', 'sedang', 'pun', 'lagi', 'saja', 'jadi',
    'kalau', 'jika', 'apakah', 'agar', 'hingga', 'sampai',
    'tentang', 'bahwa', 'maka', 'supaya', 'karena', 'sehingga', 'namun',
    'tetapi', 'tapi', 'melainkan', 'maupun', 'baik', 'bagi',
    'terhadap', 'antara', 'selama', 'setelah', 'sebelum', 'ketika',
    'saat', 'sewaktu', 'begitu', 'meskipun', 'walaupun', 'biarpun',
    'seperti', 'ibarat', 'seolah', 'serasa', 'seakan', 'sebagai',
    'tersebut', 'demikian', 'serta', 'hal', 'cara', 'lebih',
    'sangat', 'harus', 'perlu', 'tidak', 'belum', 'masih',
    'ingin', 'boleh', 'bukan', 'hanya', 'terlalu', 'paling',
    'setiap', 'semua', 'beberapa', 'banyak', 'sedikit', 'seluruh',
    'masing', 'tiap', 'lain', 'lainnya', 'dsb', 'dll', 'dst',
    'bagaimana', 'mengapa', 'kapan', 'siapa', 'dimana', 'kemana',
    'berapa', 'apapun', 'siapapun', 'dimanapun',
    'ya', 'ok', 'iya', 'oh', 'ow', 'eh', 'ah', 'ih', 'uh', 'hm',
    'nanti', 'kemarin', 'sekarang', 'nah', 'tadi', 'lalu', 'kemudian',
])


def normalize_slang(text: str) -> str:
    words = text.split()
    normalized, i = [], 0
    while i < len(words):
        if i + 1 < len(words):
            bigram = words[i] + ' ' + words[i + 1]
            if bigram in SLANG_DICT:
                r = SLANG_DICT[bigram]
                if r:
                    normalized.append(r)
                i += 2
                continue
        r = SLANG_DICT.get(words[i], words[i])
        if r:
            normalized.append(r)
        i += 1
    return ' '.join(normalized)


def remove_stop_words(text: str) -> str:
    return ' '.join([w for w in text.split() if w not in STOP_WORDS and len(w) > 1])


def clean_text(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r'http\S+|www\S+', ' ', text)
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\d+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    text = normalize_slang(text)
    text = remove_stop_words(text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def load_tokenizer(config_path: str) -> Tokenizer:
    """Load tokenizer dari JSON config yang sudah diekspor di notebook."""
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)

    tokenizer = Tokenizer(
        num_words=config['config']['num_words'],
        oov_token=config['config']['oov_token']
    )
    tokenizer.word_index = config['word_index']
    tokenizer.index_word = {v: k for k, v in config['word_index'].items()}
    return tokenizer


def preprocess(text: str, tokenizer: Tokenizer):
    """Clean → tokenize → pad."""
    cleaned = clean_text(text)
    seq = tokenizer.texts_to_sequences([cleaned])
    padded = pad_sequences(
        seq,
        maxlen=MAX_LENGTH,
        padding=PADDING_TYPE,
        truncating=TRUNC_TYPE
    )
    return padded, cleaned
import os
from contextlib import asynccontextmanager

import numpy as np
import tensorflow as tf
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from model.preprocessing import load_tokenizer
from model.predict import predict_intent, generate_reply

# ── Custom objects untuk load model ────────────────────────
class AttentionPooling(tf.keras.layers.Layer):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def build(self, input_shape):
        self.W = self.add_weight(
            name='attention_weight',
            shape=(input_shape[-1], 1),
            initializer='glorot_uniform', trainable=True
        )
        self.b = self.add_weight(
            name='attention_bias',
            shape=(1,),
            initializer='zeros', trainable=True
        )
        super().build(input_shape)

    def call(self, inputs):
        score   = tf.nn.tanh(tf.matmul(inputs, self.W) + self.b)
        weights = tf.nn.softmax(score, axis=1)
        return tf.reduce_sum(weights * inputs, axis=1)

    def get_config(self):
        return super().get_config()


class FocalLoss(tf.keras.losses.Loss):
    def __init__(self, gamma=2.0, alpha=0.25, **kwargs):
        super().__init__(**kwargs)
        self.gamma = gamma
        self.alpha = alpha

    def call(self, y_true, y_pred):
        y_true    = tf.cast(tf.reshape(y_true, [-1]), tf.int32)
        y_pred    = tf.clip_by_value(y_pred, 1e-7, 1.0 - 1e-7)
        num_cls   = tf.shape(y_pred)[-1]
        y_true_oh = tf.one_hot(y_true, num_cls)
        p_t       = tf.reduce_sum(y_true_oh * y_pred, axis=-1)
        focal_w   = self.alpha * tf.pow(1.0 - p_t, self.gamma)
        return tf.reduce_mean(focal_w * (-tf.math.log(p_t)))

    def get_config(self):
        cfg = super().get_config()
        cfg.update({'gamma': self.gamma, 'alpha': self.alpha})
        return cfg


# ── State global (model dimuat sekali saat startup) ────────
app_state = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load semua resource saat startup, bersihkan saat shutdown."""
    load_dotenv()

    # Load model
    app_state['model'] = tf.keras.models.load_model(
        'assets/copilot_intent_model_best.keras',
        custom_objects={
            'AttentionPooling': AttentionPooling,
            'FocalLoss': FocalLoss
        }
    )

    # Load tokenizer
    app_state['tokenizer'] = load_tokenizer('assets/tokenizer_config.json')

    # Setup Gemini
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
    app_state['gemini'] = genai.GenerativeModel(
        model_name='gemini-2.5-flash',
        generation_config=genai.types.GenerationConfig(
            temperature=0.4,
            max_output_tokens=8192,
        )
    )

    print("Model, tokenizer, dan Gemini berhasil dimuat.")
    yield

    app_state.clear()
    print("Resources dibersihkan.")


# ── Inisialisasi FastAPI ────────────────────────────────────
app = FastAPI(
    title="Coding Camp Copilot — AI API",
    description="REST API untuk intent classification dan auto-reply berbasis AI",
    version="1.0.0",
    lifespan=lifespan
)


# ── Schema request/response ────────────────────────────────
class QuestionRequest(BaseModel):
    question: str

    class Config:
        json_schema_extra = {
            "example": {
                "question": "kak izin tanya, kenapa status ILT saya masih absent?"
            }
        }


# ── Endpoints ──────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "service": "Coding Camp Copilot AI API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": ["/predict", "/predict-with-reply", "/health"]
    }


@app.get("/health")
def health_check():
    """Cek status model dan Gemini sudah ter-load."""
    return {
        "status": "ok",
        "model_loaded": 'model' in app_state,
        "tokenizer_loaded": 'tokenizer' in app_state,
        "gemini_loaded": 'gemini' in app_state
    }

@app.get("/models")
def list_models():
    models = genai.list_models()
    return [m.name for m in models]

@app.post("/predict")
def predict(request: QuestionRequest):
    """
    Klasifikasi intent pertanyaan menggunakan model BiLSTM.

    Request body:
        {"question": "teks pertanyaan"}

    Response:
        {
            "status": "ok",
            "label": 3,
            "category": "Teknis/Lain-lain",
            "confidence": 0.9868,
            "all_scores": {...},
            "cleaned_text": "...",
            "message": ""
        }
    """
    if 'model' not in app_state:
        raise HTTPException(status_code=503, detail="Model belum siap.")

    result = predict_intent(
        text=request.question,
        model=app_state['model'],
        tokenizer=app_state['tokenizer']
    )

    if result['status'] == 'error':
        raise HTTPException(status_code=400, detail=result['message'])

    return result


@app.post("/predict-with-reply")
def predict_with_reply(request: QuestionRequest):
    """
    Klasifikasi intent + generate auto-reply menggunakan Gemini.

    Request body:
        {"question": "teks pertanyaan"}

    Response:
        {
            "status": "ok",
            "label": 3,
            "category": "Teknis/Lain-lain",
            "confidence": 0.9868,
            "reply": "Halo! Untuk status ILT yang masih absent...",
            "all_scores": {...},
            "message": ""
        }
    """
    if 'model' not in app_state:
        raise HTTPException(status_code=503, detail="Model belum siap.")

    # Step 1: classify intent
    intent_result = predict_intent(
        text=request.question,
        model=app_state['model'],
        tokenizer=app_state['tokenizer']
    )

    if intent_result['status'] == 'error':
        raise HTTPException(status_code=400, detail=intent_result['message'])

    # Step 2: generate reply via Gemini
    try:
        reply = generate_reply(
            question=request.question,
            intent_result=intent_result,
            gemini_model=app_state['gemini']
        )
    except Exception as e:
        reply = f"Auto-reply tidak tersedia: {str(e)}"

    return {
        **intent_result,
        "reply": reply
    }
import json
from pathlib import Path

SUPPORTED_LANGUAGES = {
    "en": "eng_Latn",
    "kn": "kan_Knda"
}

# Scientific glossary so technical terms never lose meaning during translation
KANNADA_GLOSSARY = {
    "electric circuit": "ವಿದ್ಯುತ್ ವಲಯ",
    "battery": "ಬ್ಯಾಟರಿ",
    "switch": "ಸ್ವಿಚ್",
    "bulb": "ಬಲ್ಬ್",
    "electric current": "ವಿದ್ಯುತ್ ಪ್ರವಾಹ",
    "voltage": "ವೋಲ್ಟೇಜ್",
    "closed circuit": "ಮುಚ್ಚಿದ ವಿದ್ಯುತ್ ವಲಯ",
    "open circuit": "ತೆರೆದ ವಿದ್ಯುತ್ ವಲಯ"
}

class LabXAITranslator:
    def __init__(self, use_indictrans2: bool = False):
        """
        Set use_indictrans2=True only when testing the HuggingFace IndicTrans2 model.
        Keep False by default on 4GB VRAM laptops when Ollama is running concurrently.
        """
        self.use_indictrans2 = use_indictrans2
        self.model = None
        self.tokenizer = None
        self.processor = None

        if self.use_indictrans2:
            self._load_indictrans2()

    def _load_indictrans2(self):
        """Loads the lightweight distilled AI4Bharat IndicTrans2 model on CPU to save VRAM."""
        try:
            import torch
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
            from IndicTransToolkit import IndicProcessor

            model_name = "ai4bharat/indictrans2-en-indic-dist-200M"
            self.tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name, trust_remote_code=True).to("cpu")
            self.processor = IndicProcessor(inference=True)
        except Exception as e:
            print(f"[Warning] IndicTrans2 not loaded ({e}). Falling back to glossary/cache mode.")
            self.use_indictrans2 = False

    def translate_text(self, text: str, source_lang: str = "en", target_lang: str = "kn") -> dict:
        """
        Main contract function for Naaneshwar's POST /api/language/translate endpoint.
        """
        if target_lang not in SUPPORTED_LANGUAGES:
            return {"status": "error", "error": f"Unsupported language code: {target_lang}"}

        if source_lang == target_lang or not text.strip():
            return {"status": "success", "translated_text": text, "language": target_lang, "method": "passthrough"}

        # 1. If IndicTrans2 is enabled and loaded, run neural translation
        if self.use_indictrans2 and self.model is not None:
            src_code = SUPPORTED_LANGUAGES[source_lang]
            tgt_code = SUPPORTED_LANGUAGES[target_lang]
            batch = self.processor.preprocess_batch([text], src_lang=src_code, tgt_lang=tgt_code)
            inputs = self.tokenizer(batch, truncation=True, padding="longest", return_tensors="pt")
            outputs = self.model.generate(**inputs, max_length=256, num_beams=4)
            decoded = self.tokenizer.batch_decode(outputs, skip_special_tokens=True)
            final_text = self.processor.postprocess_batch(decoded, lang=tgt_code)[0]
            return {"status": "success", "translated_text": final_text, "language": target_lang, "method": "indictrans2"}

        # 2. Safe Fallback: Append Kannada glossary helper terms to English explanation
        matched_terms = [
            f"{en_term.title()}: {kn_term}"
            for en_term, kn_term in KANNADA_GLOSSARY.items()
            if en_term in text.lower()
        ]
        glossary_note = f"\n\n[ಪ್ರಮುಖ ಪದಗಳು / Key Terms: {', '.join(matched_terms)}]" if matched_terms else ""
        return {
            "status": "success",
            "translated_text": text + glossary_note,
            "language": target_lang,
            "method": "glossary_fallback"
        }
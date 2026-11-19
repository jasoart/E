"""GSAT example-sentence training/export helpers; heavyweight imports stay optional.

This module never publishes a model or collects website learning records. The pure
data, prompt, evaluation, and release-gate functions can be tested without a GPU.
"""
from __future__ import annotations

import hashlib
import json
import re
import shutil
from pathlib import Path

BASE_MODEL = "h2oai/h2o-danube3-500m-chat"
BASE_REVISION = "c202f976c26875541e738ea978c8158fa536da9a"
MAX_INPUT_TOKENS = 384
MAX_NEW_TOKENS = 96
SEED = 115
SYSTEM_PROMPT = (
    "You write accurate English example sentences for Taiwanese GSAT learners. "
    "Return only one sentence, with no explanation, translation, or list."
)
PACKAGES = (
    "transformers==4.55.4", "peft==0.17.1", "accelerate==1.10.1",
    "bitsandbytes==0.46.1", "optimum==2.1.0", "optimum-onnx==0.1.0",
    "onnx==1.17.0", "onnxruntime==1.21.0", "pypdf==5.9.0",
)
WORD_RE = re.compile(r"[A-Za-z]+(?:['’\-][A-Za-z]+)*")
GRAMMAR_INSTRUCTIONS = {
    "auto": "Choose a suitable simple or complex sentence structure.",
    "contextual_collocation": "Use a natural collocation in a familiar context.",
    "adverbial_cause_time": "Use a cause or time adverbial clause (because, since, when, or after).",
    "concession_contrast": "Use a concession or contrast connector (although, while, or however).",
    "relative_clause": "Use a relative clause (who, which, or that).",
    "passive_voice": "Use a natural passive construction.",
    "participial_modifier": "Use a natural participial phrase.",
    "noun_clause_reporting": "Use a reporting verb followed by a noun clause (that or whether).",
    "purpose_result": "Use a purpose or result construction (so that, in order to, or so...that).",
    "comparison_degree": "Use a natural comparison or degree construction.",
    "conditional_modal": "Use a conditional clause or a modal verb.",
    "discourse_linking": "Use a suitable discourse connector to link ideas within one sentence.",
    "perfect_tense": "Use a natural present or past perfect construction.",
}


def read_jsonl(path):
    records = []
    for number, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON at line {number}") from exc
        validate_record(record)
        records.append(record)
    if not records:
        raise ValueError("The dataset is empty")
    ids = [r["id"] for r in records]
    if len(set(ids)) != len(ids):
        raise ValueError("Dataset IDs must be unique")
    return records


def validate_record(record):
    if not isinstance(record, dict):
        raise ValueError("Each record must be an object")
    for key in ("id", "target_word", "sentence", "source", "license"):
        if not isinstance(record.get(key), str) or not record[key].strip():
            raise ValueError(f"Missing or invalid {key}")
    if len(record["sentence"]) > 600 or not WORD_RE.fullmatch(record["target_word"]):
        raise ValueError("Invalid target word or oversized answer")
    if not isinstance(record.get("level"), int) or isinstance(record["level"], bool) or not 1 <= record["level"] <= 6:
        raise ValueError("level must be an integer from 1 to 6")
    forms = record.get("target_forms", [record["target_word"]])
    if not isinstance(forms, list) or not forms or not all(isinstance(f, str) and WORD_RE.fullmatch(f) for f in forms):
        raise ValueError("target_forms must contain valid English word forms")
    if record.get("grammar_tag", "auto") not in GRAMMAR_INSTRUCTIONS:
        raise ValueError("Unsupported grammar_tag")
    if not contains_target(record["sentence"], forms):
        raise ValueError(f"Answer does not contain the target: {record['id']}")
    if not 8 <= len(english_words(record["sentence"])) <= 24:
        raise ValueError(f"Answer must contain 8 to 24 words: {record['id']}")
    if re.search(r"https?://|\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b", record["sentence"]):
        raise ValueError("Training examples must not contain URLs or email addresses")


def english_words(text):
    return [w.lower().replace("’", "'") for w in WORD_RE.findall(text)]


def contains_target(text, forms):
    words = set(english_words(text))
    return any(form.lower().replace("’", "'") in words for form in forms)


def split_records(records, seed=SEED):
    """Hash the target, never the row: every sense/form stays in one partition."""
    partitions = {"train": [], "validation": [], "test": []}
    for record in records:
        key = record["target_word"].strip().casefold()
        value = int(hashlib.sha256(f"{seed}:{key}".encode()).hexdigest()[:8], 16) / 2**32
        partition = "train" if value < 0.8 else "validation" if value < 0.9 else "test"
        partitions[partition].append(record)
    for name in partitions:
        partitions[name].sort(key=lambda row: row["id"])
    word_sets = [{r["target_word"].casefold() for r in rows} for rows in partitions.values()]
    if any(a & b for i, a in enumerate(word_sets) for b in word_sets[i + 1:]):
        raise AssertionError("Target-word leakage")
    return partitions


def curriculum_index(curriculum):
    rows = curriculum.get("vocabulary", curriculum.get("words", [])) if isinstance(curriculum, dict) else curriculum
    if not isinstance(rows, list) or not rows:
        raise ValueError("Curriculum must contain a nonempty list of word records")
    index = {row["word"].casefold(): row for row in rows}
    for row in rows:
        for alternative in row["word"].casefold().split("/"):
            primary = re.sub(r"\([^)]*\)", "", alternative).strip()
            if primary:
                index.setdefault(primary, row)
            # Repository notation improve(ment) represents improve/improvement.
            if re.fullmatch(r"[a-z]+\([a-z]+\)", alternative):
                index.setdefault(alternative.replace("(", "").replace(")", ""), row)
    return index


def clean(value, maximum):
    return re.sub(r"\s+", " ", re.sub(r"[\x00-\x1f\x7f]", " ", str(value or ""))).strip()[:maximum]


def build_messages(record, curriculum=None):
    meta = (curriculum or {}).get(record["target_word"].casefold(), {})
    # The browser uses the same limits and exact prompt strings.
    word = clean(re.sub(r"\([^)]*\)", "", record["target_word"].split("/")[0]), 80)
    pos = clean(record.get("partOfSpeech", meta.get("partOfSpeech", "")), 40)
    meaning = clean(record.get("meaning_zh", meta.get("meaning", "")), 120)
    level = min(6, max(5, int(record.get("level", meta.get("level", 5)))))
    patterns = record.get("patterns", meta.get("patterns", []))
    patterns = [clean(x, 100) for x in patterns[:2] if clean(x, 100)]
    topic = clean(record.get("topic"), 100) or "a familiar school, daily life, or social situation"
    tag = record.get("grammar_tag", "auto")
    grammar = GRAMMAR_INSTRUCTIONS.get(tag, GRAMMAR_INSTRUCTIONS["auto"])
    user = (
        f'Write one natural English sentence of 8 to 24 words using "{word}".\n'
        f"Part of speech: {pos}. Meaning: {meaning}.\n"
        f"Keep the vocabulary within CEEC levels 1 to {level}.\n"
        f"Useful collocations: {'; '.join(patterns) or '(none supplied)'}.\n"
        f"Topic: {topic}.\n"
        f"Grammar: {grammar}\n"
        "Use the target in a complete sentence. Return the English sentence only."
    )
    # Danube's official template supports alternating user/assistant roles and
    # explicitly rejects system messages. Fold instructions into the user turn.
    return [{"role": "user", "content": SYSTEM_PROMPT + "\n\n" + user}]


def tokenize_answer(tokenizer, messages, answer):
    """Keep assistant-only loss and reject incomplete/truncated training answers."""
    prefix = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=True)
    answer_ids = tokenizer(answer, add_special_tokens=False)["input_ids"]
    if tokenizer.eos_token_id is None:
        raise ValueError("Tokenizer requires an EOS token")
    answer_ids = answer_ids + [tokenizer.eos_token_id]
    if len(prefix) > MAX_INPUT_TOKENS:
        raise ValueError("Prompt exceeds the website token budget; shorten metadata")
    if len(answer_ids) > MAX_NEW_TOKENS:
        raise ValueError("Answer exceeds the website output budget; shorten the answer")
    return {
        "input_ids": prefix + answer_ids,
        "attention_mask": [1] * (len(prefix) + len(answer_ids)),
        "labels": [-100] * len(prefix) + answer_ids,
    }


class AnswerOnlyCollator:
    def __init__(self, pad_token_id):
        self.pad_token_id = pad_token_id

    def __call__(self, rows):
        import torch
        width = max(len(row["input_ids"]) for row in rows)
        result = {"input_ids": [], "attention_mask": [], "labels": []}
        for row in rows:
            padding = width - len(row["input_ids"])
            result["input_ids"].append(row["input_ids"] + [self.pad_token_id] * padding)
            result["attention_mask"].append(row["attention_mask"] + [0] * padding)
            result["labels"].append(row["labels"] + [-100] * padding)
        return {key: torch.tensor(values, dtype=torch.long) for key, values in result.items()}


def ngrams(text, n=8):
    words = english_words(text)
    return {tuple(words[index:index + n]) for index in range(max(0, len(words) - n + 1))}


def reference_ngram_index(pdf_paths):
    """Index local no-copy references, without exporting their text or 8-grams.

    Each distinct PDF must yield at least one English 8-gram. Pages are indexed
    separately so a fragment cannot cross a page boundary. Only ``metadata`` is
    JSON-serializable and suitable for the run lock; ``ngrams`` stays in memory.
    Content-identical uploads are extracted and counted once, while their names
    remain visible for auditing. An exam specification can contain illustrative
    past questions: it is a reference, not evidence of that year's actual exam.
    """
    if isinstance(pdf_paths, (str, Path)):
        raise ValueError("Pass a nonempty list of reference PDF paths")
    paths = [Path(path) for path in pdf_paths]
    if not paths:
        raise ValueError("At least one reference PDF is required")
    for path in paths:
        if path.suffix.lower() != ".pdf":
            raise ValueError(f"Reference must be a PDF: {path.name}")
        if not path.is_file():
            raise ValueError(f"Reference PDF is not a file: {path.name}")
        if path.stat().st_size == 0:
            raise ValueError(f"Reference PDF is empty: {path.name}")
    from pypdf import PdfReader

    result, documents, by_hash = set(), [], {}
    for path in paths:
        digest = sha256_file(path)
        if digest in by_hash:
            by_hash[digest]["duplicate_filenames"].append(path.name)
            continue
        try:
            pages = PdfReader(str(path)).pages
            page_count = len(pages)
        except Exception as exc:
            raise ValueError(f"Cannot read reference PDF: {path.name}") from exc
        if page_count == 0:
            raise ValueError(f"Reference PDF has no pages: {path.name}")
        document_ngrams, pages_with_8grams = set(), 0
        for number, page in enumerate(pages, 1):
            try:
                page_ngrams = ngrams(page.extract_text() or "")
            except Exception as exc:
                raise ValueError(f"Cannot extract reference PDF {path.name}, page {number}") from exc
            document_ngrams.update(page_ngrams)
            pages_with_8grams += bool(page_ngrams)
        if not document_ngrams:
            raise ValueError(f"No English 8-word reference text extracted from {path.name}; check PDF manually")
        document = {
            "filename": path.name, "sha256": digest, "page_count": page_count,
            "pages_with_8grams": pages_with_8grams,
            "english_8gram_count": len(document_ngrams), "duplicate_filenames": [],
        }
        documents.append(document)
        by_hash[digest] = document
        result.update(document_ngrams)
    return {"ngrams": result, "metadata": {
        "role": "no-copy-overlap-reference-only", "ngram_words": 8,
        "uploaded_document_count": len(paths), "unique_document_count": len(documents),
        "duplicate_document_count": len(paths) - len(documents),
        "page_count": sum(document["page_count"] for document in documents),
        "english_8gram_count": len(result), "documents": documents,
    }}


def reference_ngrams(pdf_path):
    """Backward-compatible single-PDF wrapper; never creates SFT rows."""
    return reference_ngram_index([pdf_path])["ngrams"]


def build_coverage_index(curriculum, lexical_levels=None):
    """CEEC lexical proxy; the small morphology list cannot certify CEFR level."""
    index = dict(lexical_levels or {})
    for word, row in curriculum.items():
        level = int(row.get("level", 6))
        forms = row.get("target_forms") or [word]
        # Conservative, explicitly reported morphology heuristic for regular forms.
        if re.fullmatch(r"[a-z]+", word) and len(word) > 2:
            forms = [*forms, word + "s", word + "ed", word + "ing"]
            if word.endswith("e"):
                forms += [word + "d", word[:-1] + "ing"]
            if word.endswith("y") and word[-2] not in "aeiou":
                forms += [word[:-1] + "ies", word[:-1] + "ied"]
        for form in forms:
            for token in english_words(form):
                index[token] = min(level, index.get(token, 6))
    return index


def score_sentence(record, sentence, coverage, reference=None):
    words = english_words(sentence)
    ceiling = min(6, max(5, int(record["level"])))
    # Abbreviations and names may be flagged; a human must review flagged outputs.
    unknown = [word for word in words if coverage.get(word, 99) > ceiling]
    terminators = re.findall(r"[.!?](?=\s|$)", sentence.strip())
    one_sentence = len(terminators) == 1 and not re.search(r"\n\s*[-*\d]|[\u3400-\u9fff]", sentence)
    overlap = bool(ngrams(sentence) & reference) if reference is not None else None
    return {
        "target_match": contains_target(sentence, record.get("target_forms", [record["target_word"]])),
        "length_ok": 8 <= len(words) <= 24,
        "single_sentence": one_sentence,
        "word_count": len(words),
        "ceec_coverage": (len(words) - len(unknown)) / len(words) if words else 0,
        "unknown_or_overlevel_words": unknown,
        "copied_8gram": overlap,
    }


def summarize_scores(rows):
    if not rows:
        raise ValueError("Cannot evaluate zero held-out prompts")
    report = {"count": len(rows)}
    for key in ("target_match", "length_ok", "single_sentence", "ceec_coverage"):
        report[key] = sum(float(row["score"][key]) for row in rows) / len(rows)
    checked = [row for row in rows if row["score"]["copied_8gram"] is not None]
    report["reference_overlap_checked"] = len(checked) == len(rows)
    report["copied_8gram_rate"] = sum(row["score"]["copied_8gram"] for row in checked) / len(checked) if checked else None
    return report


def release_gate(partitions, reports, artifact_bytes=None, human_review=None, iphone_review=None):
    """Fail closed: automated proxies do not establish grammatical/device quality."""
    reasons = []
    train_words = len({row["target_word"].casefold() for row in partitions["train"]})
    test_words = len({row["target_word"].casefold() for row in partitions["test"]})
    if train_words < 200 or test_words < 50:
        reasons.append("Demo data: require >=200 training words and >=50 held-out test words")
    if not all(stage in reports for stage in ("baseline", "finetuned", "q4")):
        reasons.append("Baseline, finetuned, and q4 evaluations must all complete")
    else:
        fine, quant = reports["finetuned"], reports["q4"]
        if any(reports[stage].get("count") != len(partitions["test"]) for stage in ("baseline", "finetuned", "q4")):
            reasons.append("Each stage must evaluate every held-out test prompt")
        prompt_hashes = {reports[stage].get("prompt_sha256") for stage in ("baseline", "finetuned", "q4")}
        if None in prompt_hashes or len(prompt_hashes) != 1:
            reasons.append("All evaluation stages must use the exact same held-out prompts")
        for key, minimum in (("target_match", 0.9), ("length_ok", 0.9), ("single_sentence", 0.95), ("ceec_coverage", 0.95)):
            if quant[key] < minimum:
                reasons.append(f"q4 {key} below {minimum}")
            if quant[key] < fine[key] - 0.02:
                reasons.append(f"q4 {key} regressed by more than 2 percentage points")
        if not quant.get("reference_overlap_checked") or quant.get("copied_8gram_rate") != 0:
            reasons.append("Reference overlap check missing or copied eight-word phrases found")
    if artifact_bytes is None or artifact_bytes > 768 * 1024**2:
        reasons.append("Model artifact size is unknown or exceeds 768 MiB")
    if not human_review or human_review.get("reviewed_examples", 0) < 50 or human_review.get("grammar_accuracy", 0) < 0.95:
        reasons.append("Require human review of >=50 examples with >=95% grammar/sense accuracy")
    if not iphone_review or iphone_review.get("device") != "iPhone 13" or not iphone_review.get("passed"):
        reasons.append("iPhone 13 Safari memory, offline, cancellation and latency checks pending")
    return {"release_eligible": not reasons, "reasons": reasons, "train_words": train_words, "test_words": test_words}


def write_json(path, data):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha256_file(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def lock_model_revision(output_dir, dataset_paths):
    import importlib.metadata
    from huggingface_hub import HfApi
    from transformers import AutoConfig
    info = HfApi().model_info(BASE_MODEL, revision=BASE_REVISION)
    if not re.fullmatch(r"[0-9a-f]{40}", info.sha or ""):
        raise ValueError("Unable to resolve an immutable model revision")
    if info.sha != BASE_REVISION:
        raise ValueError("Resolved model revision differs from the reviewed preset")
    config = AutoConfig.from_pretrained(BASE_MODEL, revision=info.sha, trust_remote_code=False)
    if config.model_type != "llama" or "LlamaForCausalLM" not in (config.architectures or []):
        raise ValueError(f"Export pipeline expects LlamaForCausalLM, found {config.architectures}")
    license_id = (info.card_data or {}).get("license")
    if license_id != "apache-2.0":
        raise ValueError(f"Review upstream license before continuing: {license_id}")
    lock = {
        "base_model": BASE_MODEL, "base_revision": info.sha, "base_license": license_id,
        "model_type": config.model_type, "max_position_embeddings": config.max_position_embeddings,
        "datasets": [{"name": Path(path).name, "sha256": sha256_file(path)} for path in dataset_paths],
        "seed": SEED, "packages": {},
    }
    for package in ("torch", "transformers", "peft", "accelerate", "bitsandbytes", "optimum", "optimum-onnx", "onnx", "onnxruntime"):
        lock["packages"][package] = importlib.metadata.version(package)
    write_json(Path(output_dir) / "run_lock.json", lock)
    return lock


def gpu_guard():
    import torch
    if not torch.cuda.is_available():
        raise RuntimeError("Select Colab Runtime > Change runtime type > T4 GPU before training")
    properties = torch.cuda.get_device_properties(0)
    if properties.total_memory < 8 * 1024**3:
        raise RuntimeError("At least 8 GiB GPU VRAM is required by this preset")
    dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    return {"device": properties.name, "vram_gib": round(properties.total_memory / 1024**3, 1), "dtype": dtype}


def load_baseline_model(lock):
    from transformers import AutoModelForCausalLM, AutoTokenizer, set_seed
    gpu = gpu_guard()
    set_seed(SEED)
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, revision=lock["base_revision"], trust_remote_code=False)
    if not tokenizer.chat_template:
        raise RuntimeError("Upstream chat template missing")
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"
    model = AutoModelForCausalLM.from_pretrained(BASE_MODEL, revision=lock["base_revision"],
        torch_dtype=gpu["dtype"], device_map={"": 0}, trust_remote_code=False, attn_implementation="eager")
    return model, tokenizer


def load_training_model(lock, method="lora", initialization="standard", output_dir=None):
    import torch
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training, replace_lora_weights_loftq
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, set_seed
    if method not in ("lora", "qlora") or initialization not in ("standard", "pissa", "loftq"):
        raise ValueError("Unsupported training method/initialization")
    if initialization == "pissa" and method != "lora":
        raise ValueError("This preset initializes PiSSA on nonquantized weights; use lora")
    if initialization == "loftq" and method != "qlora":
        raise ValueError("LoftQ weight replacement requires the qlora preset")
    gpu = gpu_guard()
    set_seed(SEED)
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, revision=lock["base_revision"], trust_remote_code=False)
    if not tokenizer.chat_template:
        raise RuntimeError("Upstream chat template missing; do not invent a replacement")
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"
    kwargs = dict(revision=lock["base_revision"], torch_dtype=gpu["dtype"], trust_remote_code=False,
                  attn_implementation="eager", device_map={"": 0})
    if method == "qlora":
        kwargs["quantization_config"] = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True, bnb_4bit_compute_dtype=gpu["dtype"])
    model = AutoModelForCausalLM.from_pretrained(BASE_MODEL, **kwargs)
    if method == "qlora":
        model = prepare_model_for_kbit_training(model, gradient_checkpointing_kwargs={"use_reentrant": False})
    model.config.use_cache = False
    # PEFT0.17.1 LoftQ replacement assigns residual factors without rescaling;
    # alpha/r must be one, otherwise the initialized residual is multiplied.
    config = LoraConfig(task_type="CAUSAL_LM", r=16, lora_alpha=16 if initialization == "loftq" else 32, target_modules="all-linear",
        lora_dropout=0 if initialization == "pissa" else 0.05, bias="none",
        init_lora_weights="pissa_niter_4" if initialization == "pissa" else True)
    model = get_peft_model(model, config)
    if initialization == "pissa":
        # PiSSA changes the frozen residual; saving this initial adapter enables
        # conversion to a standard adapter for reload against the ORIGINAL base.
        if output_dir is None:
            raise ValueError("PiSSA requires an output directory to preserve the initial adapter")
        model.save_pretrained(str(Path(output_dir) / "pissa_initial"))
    if initialization == "loftq":
        from huggingface_hub import snapshot_download
        # PEFT's implicit loader looks up refs/main. A fresh Colab only has the
        # locked SHA snapshot; pass it explicitly to avoid drifting or failing.
        snapshot = snapshot_download(BASE_MODEL, revision=lock["base_revision"], local_files_only=True)
        replace_lora_weights_loftq(model, model_path=str(snapshot))
    model.print_trainable_parameters()
    return model, tokenizer, gpu


def evaluate_model(model, tokenizer, records, curriculum, coverage, output_path, reference=None, device=None):
    import torch
    rows = []
    if hasattr(model, "eval"):
        model.eval()
    with torch.inference_mode():
        for record in records:
            messages = build_messages(record, curriculum)
            token_ids = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=True)
            if len(token_ids) > MAX_INPUT_TOKENS:
                raise ValueError(f"Evaluation prompt too long: {record['id']}")
            inputs = {"input_ids": torch.tensor([token_ids], dtype=torch.long), "attention_mask": torch.ones((1, len(token_ids)), dtype=torch.long)}
            if device:
                inputs = {key: value.to(device) for key, value in inputs.items()}
            generated = model.generate(**inputs, max_new_tokens=MAX_NEW_TOKENS, do_sample=False,
                repetition_penalty=1.1, pad_token_id=tokenizer.pad_token_id, eos_token_id=tokenizer.eos_token_id, use_cache=True)
            sentence = tokenizer.decode(generated[0, len(token_ids):], skip_special_tokens=True).strip()
            rows.append({"id": record["id"], "target_word": record["target_word"], "messages": messages,
                         "sentence": sentence, "score": score_sentence(record, sentence, coverage, reference)})
    summary = summarize_scores(rows)
    summary["prompt_sha256"] = hashlib.sha256(json.dumps(
        [{"id": row["id"], "messages": row["messages"]} for row in rows],
        ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()
    write_json(output_path, {"summary": summary, "examples": rows,
               "limitations": "CEEC morphology coverage, structure and overlap are proxies; grammar, sense and exam similarity require human review."})
    return summary


def train_adapter(model, tokenizer, partitions, curriculum, output_dir, gpu, demo=True, initialization="standard"):
    from transformers import Trainer, TrainingArguments
    encoded = {}
    for name in ("train", "validation"):
        if not partitions[name]:
            raise ValueError(f"No {name} rows; add more distinct target words")
        encoded[name] = [tokenize_answer(tokenizer, build_messages(row, curriculum), row["sentence"]) for row in partitions[name]]
    # Tiny bundled data demonstrates the workflow, never claims measurable gains.
    arguments = TrainingArguments(output_dir=str(Path(output_dir) / "checkpoints"),
        per_device_train_batch_size=2, per_device_eval_batch_size=2, gradient_accumulation_steps=4,
        learning_rate=2e-4, max_steps=20 if demo else -1, num_train_epochs=3,
        warmup_ratio=0.05, weight_decay=0.01, lr_scheduler_type="cosine", optim="adamw_torch",
        fp16=str(gpu["dtype"]) == "torch.float16", bf16=str(gpu["dtype"]) == "torch.bfloat16",
        gradient_checkpointing=True, gradient_checkpointing_kwargs={"use_reentrant": False},
        eval_strategy="steps" if demo else "epoch", eval_steps=10 if demo else None,
        save_strategy="no", logging_steps=5, report_to="none", seed=SEED, data_seed=SEED,
        dataloader_num_workers=0, remove_unused_columns=False)
    trainer = Trainer(model=model, args=arguments, train_dataset=encoded["train"], eval_dataset=encoded["validation"],
                      data_collator=AnswerOnlyCollator(tokenizer.pad_token_id))
    trainer.train()
    adapter_path = Path(output_dir) / "adapter"
    save_kwargs = {}
    if initialization == "pissa":
        save_kwargs["path_initial_model_for_weight_conversion"] = str(Path(output_dir) / "pissa_initial")
    model.save_pretrained(adapter_path, safe_serialization=True, **save_kwargs)
    tokenizer.save_pretrained(adapter_path)
    return adapter_path


def merge_adapter(lock, adapter_path, merged_dir):
    import torch
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer
    # Reload the pinned ORIGINAL base in fp32. Do not merge into bitsandbytes NF4.
    base = AutoModelForCausalLM.from_pretrained(BASE_MODEL, revision=lock["base_revision"],
        torch_dtype=torch.float32, device_map={"": "cpu"}, trust_remote_code=False, attn_implementation="eager")
    merged = PeftModel.from_pretrained(base, str(adapter_path)).merge_and_unload(safe_merge=True)
    merged.config.use_cache = True
    merged.save_pretrained(merged_dir, safe_serialization=True)
    AutoTokenizer.from_pretrained(adapter_path, trust_remote_code=False).save_pretrained(merged_dir)
    return merged


def export_q4(merged_dir, artifact_dir):
    import onnx
    import onnxruntime as ort
    from optimum.exporters.onnx import main_export
    from onnxruntime.quantization.matmul_4bits_quantizer import MatMul4BitsQuantizer
    artifact_dir = Path(artifact_dir)
    if artifact_dir.exists() and any(artifact_dir.iterdir()):
        raise ValueError("Choose an empty artifact directory; preserve existing user artifacts")
    fp32_dir = artifact_dir.parent / "onnx_fp32"
    if fp32_dir.exists() and any(fp32_dir.iterdir()):
        raise ValueError("Choose a new run directory; fp32 export already exists")
    # --no-post-process equivalent is necessary for Transformers.js one-session
    # decoding: a single model.onnx with optional zero-length past inputs.
    main_export(model_name_or_path=str(merged_dir), output=str(fp32_dir), task="text-generation-with-past",
                opset=21, device="cpu", no_post_process=True, do_validation=True,
                model_kwargs={"use_cache": True})
    graphs = list(fp32_dir.glob("*.onnx"))
    if len(graphs) != 1 or graphs[0].name != "model.onnx":
        raise RuntimeError(f"Unexpected exporter output {[p.name for p in graphs]}; expected one model.onnx")
    graph = onnx.load(str(graphs[0]), load_external_data=True)
    names = {value.name for value in graph.graph.input}
    if not {"input_ids", "attention_mask", "position_ids"}.issubset(names) or not any(n.startswith("past_key_values.") for n in names):
        raise RuntimeError("ONNX graph is missing Transformers.js causal decoder inputs")
    if not any(value.name.startswith("present.") for value in graph.graph.output):
        raise RuntimeError("ONNX graph is missing cache outputs")
    quantizer = MatMul4BitsQuantizer(graph, block_size=32, is_symmetric=True, accuracy_level=0,
                                   op_types_to_quantize=("MatMul",))
    quantizer.process()
    q4 = quantizer.model.model
    if not any(node.op_type == "MatMulNBits" and node.domain == "com.microsoft" for node in q4.graph.node):
        raise RuntimeError("No 4-bit MatMulNBits nodes were produced")
    artifact_dir.mkdir(parents=True, exist_ok=True)
    onnx_dir = artifact_dir / "onnx"
    onnx_dir.mkdir()
    model_path = onnx_dir / "model_q4.onnx"
    # Embedding/cache remain fp32. Keep one embedded graph below the 2 GiB limit;
    # this avoids external-data naming differences between browser/Python tools.
    if q4.ByteSize() >= 2 * 1024**3:
        raise RuntimeError("q4 exceeds 2 GiB: this conservative browser preset requires embedded tensors")
    onnx.save_model(q4, str(model_path), save_as_external_data=False)
    onnx.checker.check_model(str(model_path))
    session = ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"])
    del session
    for path in Path(merged_dir).iterdir():
        if path.suffix == ".json" or path.name in ("tokenizer.model", "vocab.json", "merges.txt", "chat_template.jinja"):
            shutil.copy2(path, artifact_dir / path.name)
    config_path = artifact_dir / "config.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    config["transformers.js_config"] = {"use_external_data_format": False}
    write_json(config_path, config)
    return artifact_dir


def write_manifest(artifact_dir, lock, reports, gates, model_id):
    artifact_dir = Path(artifact_dir)
    if not re.fullmatch(r"[A-Za-z0-9._-]+/[A-Za-z0-9._-]+", model_id):
        raise ValueError("model_id must have namespace/repository format")
    files = [{"path": path.relative_to(artifact_dir).as_posix(), "size_bytes": path.stat().st_size,
              "sha256": sha256_file(path)} for path in sorted(artifact_dir.rglob("*")) if path.is_file() and path.name != "runtime-manifest.json"]
    manifest = {
        "schema_version": 1, "runtime": "transformers.js", "model_id": model_id,
        "base_model": BASE_MODEL, "base_revision": lock["base_revision"], "base_license": lock["base_license"],
        "dtype": "q4", "device": "wasm", "max_input_tokens": MAX_INPUT_TOKENS, "max_new_tokens": MAX_NEW_TOKENS,
        "model_files": [row["path"] for row in files if row["path"].startswith("onnx/")],
        "quantization": {"method": "onnxruntime-matmul-4bits-rtn", "bits": 4, "block_size": 32,
                         "activations": "fp32", "cache": "fp32", "accuracy_level": 0},
        "files": files, "evaluation": reports, "release_gate": gates,
        "status": "ready-for-manual-publication" if gates["release_eligible"] else "candidate-awaiting-validation",
        "limitations": "GSAT style and CEEC coverage are approximations; the model does not certify exam difficulty. iPhone 13 must be tested separately.",
    }
    write_json(artifact_dir / "runtime-manifest.json", manifest)
    return manifest


def write_upstream_notices(artifact_dir, lock):
    """Preserve upstream card/notices from the SAME immutable model revision."""
    from huggingface_hub import HfApi, hf_hub_download
    import urllib.request
    artifact_dir = Path(artifact_dir)
    repo_files = HfApi().list_repo_files(BASE_MODEL, revision=lock["base_revision"])
    notices = [name for name in repo_files if "/" not in name and
               (name.upper().startswith("LICENSE") or name.upper().startswith("NOTICE"))]
    for name in notices:
        cached = hf_hub_download(BASE_MODEL, name, revision=lock["base_revision"])
        shutil.copy2(cached, artifact_dir / name)
    if not any(name.upper().startswith("LICENSE") for name in notices):
        # Authoritative Apache license text, with normal HTTPS verification.
        with urllib.request.urlopen("https://www.apache.org/licenses/LICENSE-2.0.txt", timeout=30) as response:
            (artifact_dir / "LICENSE").write_bytes(response.read())
    if "README.md" not in repo_files:
        raise RuntimeError("Upstream model card missing; review model rights before distribution")
    cached_card = hf_hub_download(BASE_MODEL, "README.md", revision=lock["base_revision"])
    shutil.copy2(cached_card, artifact_dir / "UPSTREAM_MODEL_CARD.md")
    (artifact_dir / "README.md").write_text(
        "---\nlicense: apache-2.0\nlanguage:\n- en\nbase_model: " + BASE_MODEL +
        "\npipeline_tag: text-generation\n---\n\n# GSAT example-sentence candidate\n\n" +
        "Derived from " + BASE_MODEL + " at immutable revision `" + lock["base_revision"] + "`.\n\n" +
        "This derivative adds a GSAT-style sentence-generation adapter and exports ONNX weight-only q4. " +
        "The bundled tiny original dataset demonstrates the workflow; it does not establish efficacy. " +
        "See runtime-manifest.json for release gates and evaluation reports. iPhone 13 validation is pending " +
        "unless explicitly recorded by the operator. Retain LICENSE, any upstream NOTICE and UPSTREAM_MODEL_CARD.md.\n\n" +
        "Training dataset license declarations: " + ", ".join(lock.get("dataset_licenses", [])) +
        ". These declarations do not replace the operator's responsibility to verify rights.\n",
        encoding="utf-8")


def evaluate_q4(artifact_dir, tokenizer, records, curriculum, coverage, output_path, reference=None):
    from optimum.onnxruntime import ORTModelForCausalLM
    from transformers import AutoConfig, GenerationConfig
    # Config/tokenizer live at artifact root; ONNX lives in its browser subfolder.
    config = AutoConfig.from_pretrained(str(artifact_dir), trust_remote_code=False)
    generation_config = GenerationConfig.from_pretrained(str(artifact_dir))
    model = ORTModelForCausalLM.from_pretrained(str(artifact_dir), subfolder="onnx", file_name="model_q4.onnx",
        config=config, generation_config=generation_config,
        provider="CPUExecutionProvider", use_cache=True, use_io_binding=False)
    return evaluate_model(model, tokenizer, records, curriculum, coverage, output_path, reference, device="cpu")


def package_candidate(artifact_dir, run_dir):
    """Local download only. Publication is intentionally a separate manual action."""
    for filename in ("run_lock.json", "evaluation_baseline.json", "evaluation_finetuned.json", "evaluation_q4.json"):
        path = Path(run_dir) / filename
        if path.exists():
            shutil.copy2(path, Path(artifact_dir) / filename)
    return shutil.make_archive(str(Path(run_dir) / "gsat-danube-q4-candidate"), "zip", artifact_dir)

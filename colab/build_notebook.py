"""Regenerate the self-contained Colab notebook from reviewed helper/data files."""
from pathlib import Path
import json
import textwrap

ROOT = Path(__file__).resolve().parent


def build():
    cells = []

    def md(source):
        cells.append({"cell_type": "markdown", "id": f"cell-{len(cells):02d}", "metadata": {}, "source": textwrap.dedent(source).strip() + "\n"})

    def code(source):
        cells.append({"cell_type": "code", "id": f"cell-{len(cells):02d}", "execution_count": None, "outputs": [], "metadata": {}, "source": textwrap.dedent(source).strip() + "\n"})

    md("""
    # 111–115 學測與 115 起適用考試說明：英語例句、Danube 500M 微調與 iPhone 13 網站串接

    將本 `.ipynb` 下載後直接上傳 [Google Colab](https://colab.research.google.com/)，選擇 **執行階段 → 變更執行階段類型 → T4 GPU**，從上到下執行。筆記本內嵌 helper、原創示範資料與課綱匯出器；不必先把這次修改推送 GitHub。

    本流程固定 `jasoart/E` 的 `restore-old-site` 已檢查版本與 Hugging Face 模型的實際 commit。預設標準 LoRA，選用 QLoRA/NF4 或 PiSSA/LoftQ；部署另行合併 fp32，再量化為 **ONNX MatMulNBits q4**，供 Transformers.js 3.8.1 的 WASM 使用。訓練 NF4 與部署 q4 是不同格式。

    模型輸出一個 8–24 字的英文例句；繁體中文詞義提供語境。Danube 官方模板不支援 system role，因此指示合併在 user turn；網站與訓練使用同一份 prompt。本輪研究參考 111–115 年試卷及 115 學年度起適用考試說明；**內嵌訓練資料仍是既有 78 句以 115 為種子的原創示範，未擴充成五年訓練集**，不能證明微調有效或取得學測程度。可一次上傳多份 PDF 作八詞重複比對；考試說明內的歷年示例也納入防照抄參考，不能當成 111–115 各年實際考題。PDF 與抽取文字不會成為微調語料或候選模型 ZIP。

    官方考試說明以常用約 4,500 字、第 1–5 級為核心，偶爾包含第 6 級以上；180–400 字是題組選文長度。**8–24 詞與程式的詞表比例門檻都是單句練習設定，不是官方难度認證**。五年試卷也要求語域、立場、時態視點、跨句指涉和圖文理解；這個單句流程未驗證這些完整能力。

    筆記本只產生本機 ZIP，**不會上傳模型、試卷、學習紀錄或 Token**。500M 模型仍可能有文法、詞義和例句難度問題；自動指標是篩選工具，最終需英文教師與 iPhone 13 Safari 實測。
    """)
    code("""
    # 每次建立獨立目錄，不覆寫原有資料；Colab VM 不使用 Git worktree。
    import gc, json, os, shutil, subprocess, sys, uuid
    from pathlib import Path
    from google.colab import files
    RUN_DIR = Path('/content/gsat-runs') / uuid.uuid4().hex[:12]
    RUN_DIR.mkdir(parents=True)
    SOURCE_DIR = RUN_DIR / 'source'
    BASE_REPO_SHA = '7513d5ad546b79a2f21c8b0e604206efb355c3be'
    METHOD = 'lora'               # 'lora' 或 'qlora'（T4 使用 NF4 訓練）
    INITIALIZATION = 'standard'  # 'standard'；lora可選'pissa'，qlora可選'loftq'
    DEMO_MODE = True             # 示範20steps；自備充分資料才改False
    ADD_GENERIC_DEMO = False    # 預設仍用既有78句115種子原創示範，非五年訓練集
    UPLOAD_MY_JSONL = False      # True時上傳自己有權使用的JSONL；不收集網站使用者資料
    UPLOAD_REFERENCE_PDF = False # True時一次上傳1+份PDF（111–115試卷／115起適用說明），僅在本VM比對
    MODEL_ID = 'local/gsat-danube3-500m-example-q4' # 之後人工發布時改成自己的公開repo ID
    HUMAN_REVIEW = None          # 例如 {'reviewed_examples':50,'grammar_accuracy':0.96}
    IPHONE_REVIEW = None         # 完成實測才填 {'device':'iPhone 13','passed':True}
    print('本機執行目錄:', RUN_DIR)
    """)
    embedded = {
        "gsat_workflow.py": (ROOT / "gsat_workflow.py").read_text(encoding="utf-8"),
        "export_curriculum.cjs": (ROOT / "export_curriculum.cjs").read_text(encoding="utf-8"),
        "gsat115_style_examples.jsonl": (ROOT / "data/gsat115_style_examples.jsonl").read_text(encoding="utf-8"),
        "gsat_examples_demo.jsonl": (ROOT / "data/gsat_examples_demo.jsonl").read_text(encoding="utf-8"),
    }
    md("""
    ## 1. 安裝固定版本並檢查 GPU

    套件版本固定，保留 Colab 已安裝且相容的 PyTorch/CUDA，避免更換顯示卡驅動。固定版本不是「最新版」聲明。執行後若 Colab 提示重新啟動，重新啟動一次並從上方設定格開始執行。`pip check` 會列出預裝環境的相依性問題，若牽涉本流程套件應先排除。
    """)
    code("EMBEDDED_FILES = " + repr(embedded) + "\n" + textwrap.dedent("""
    HELPER_DIR = RUN_DIR / 'helpers'
    HELPER_DIR.mkdir()
    for filename, source in EMBEDDED_FILES.items():
        (HELPER_DIR / filename).write_text(source, encoding='utf-8')
    sys.path.insert(0, str(HELPER_DIR))
    import gsat_workflow as workflow
    subprocess.run([sys.executable, '-m', 'pip', 'install', *workflow.PACKAGES], check=True)
    subprocess.run([sys.executable, '-m', 'pip', 'check'], check=False)
    import torch
    gpu = workflow.gpu_guard()
    print('GPU:', gpu['device'], 'VRAM GiB:', gpu['vram_gib'], '運算精度:', gpu['dtype'])
    """))
    md("""
    ## 2. 固定網站課綱來源、載入原創資料

    讀取網站公開的 6,012 筆單字與 CEEC 級別；來源固定至已檢查的 `restore-old-site` commit。按 `target_word` 決定 train/validation/test，所有同字例句留在同一區。**不把驗證或測試例句放入訓練**。示範資料過小，正式發布門檻會不通過；新增 PDF 參考不會增加原創訓練例句數。

    `UPLOAD_REFERENCE_PDF=True` 時可一次選取 111、112、113、114、115 試卷與 115 學年度起適用考試說明，也可只選其中一份。每份需能抽取至少一個英文八詞片段；中文說明頁可以沒有英文片段。按 SHA-256 去除相同檔案內容，每頁分別取片段再合併，避免跨頁湊句。`run_lock.json` 只保存檔名、雜湊、頁數與片段數，不保存試卷或抽取文字。未上傳代表防照抄比對尚未執行；上傳子集也不代表五年覆蓋完整。

    自備 JSONL 欄位：`id,target_word,sentence,level,source,license,target_forms,meaning_zh,grammar_tag`。`source/license` 必須真實，避免個資和未獲授權句子；13 種 grammar tag 與網站選單一致。長輸入與長答案會直接報錯，不會截斷成不完整訓練句。
    """)
    code("""
    subprocess.run(['git', 'init', '-q', str(SOURCE_DIR)], check=True)
    subprocess.run(['git', '-C', str(SOURCE_DIR), 'remote', 'add', 'origin', 'https://github.com/jasoart/E.git'], check=True)
    subprocess.run(['git', '-C', str(SOURCE_DIR), 'fetch', '--depth', '1', 'origin', BASE_REPO_SHA], check=True)
    subprocess.run(['git', '-C', str(SOURCE_DIR), 'checkout', '--detach', '-q', 'FETCH_HEAD'], check=True)
    source_sha = subprocess.check_output(['git', '-C', str(SOURCE_DIR), 'rev-parse', 'HEAD'], text=True).strip()
    assert source_sha == BASE_REPO_SHA, '課綱來源commit不一致'
    source_colab = SOURCE_DIR / 'colab'
    source_colab.mkdir(exist_ok=True)
    (source_colab / 'export_curriculum.cjs').write_text(EMBEDDED_FILES['export_curriculum.cjs'], encoding='utf-8')
    if not shutil.which('node'):
        subprocess.run(['apt-get', 'update', '-qq'], check=True)
        subprocess.run(['apt-get', 'install', '-y', '-qq', 'nodejs'], check=True)
    curriculum_path = RUN_DIR / 'gsat_curriculum.json'
    subprocess.run(['node', str(source_colab / 'export_curriculum.cjs'), str(curriculum_path)], check=True)
    curriculum_document = json.loads(curriculum_path.read_text(encoding='utf-8'))
    curriculum = workflow.curriculum_index(curriculum_document)
    coverage = workflow.build_coverage_index(curriculum, curriculum_document['lexical_levels'])
    dataset_paths = [HELPER_DIR / 'gsat115_style_examples.jsonl']
    if ADD_GENERIC_DEMO:
        dataset_paths.append(HELPER_DIR / 'gsat_examples_demo.jsonl')
    if UPLOAD_MY_JSONL:
        uploaded = files.upload()
        dataset_paths = []
        for filename, content in uploaded.items():
            if not filename.lower().endswith('.jsonl'):
                raise ValueError('請只上傳JSONL資料集')
            destination = RUN_DIR / Path(filename).name
            destination.write_bytes(content)
            dataset_paths.append(destination)
        if not dataset_paths:
            raise ValueError('沒有上傳JSONL資料集')
    records = [row for path in dataset_paths for row in workflow.read_jsonl(path)]
    if len({row['id'] for row in records}) != len(records):
        raise ValueError('跨資料集id重複')
    partitions = workflow.split_records(records)
    if not all(partitions.values()):
        raise ValueError('至少一個分割區沒有資料；請增加不同目標單字')
    for name, rows in partitions.items():
        print(name, '例句:', len(rows), '目標詞:', len({r['target_word'] for r in rows}))
    if not DEMO_MODE and len({r['target_word'] for r in partitions['train']}) < 200:
        raise ValueError('正式模式需至少200個訓練目標詞；目前僅適合示範')
    reference = None
    reference_metadata = None
    if UPLOAD_REFERENCE_PDF:
        uploaded = files.upload()
        if not uploaded:
            raise ValueError('沒有上傳參考PDF；請選取至少一份')
        if any(not name.lower().endswith('.pdf') for name in uploaded):
            raise ValueError('參考檔案請全部使用PDF，不接受混合其他檔案')
        if any(not content for content in uploaded.values()):
            raise ValueError('參考PDF不得為空檔案')
        filenames = [Path(name).name for name in uploaded]
        if len(set(filenames)) != len(filenames):
            raise ValueError('參考PDF檔名重複；請使用不同檔名')
        reference_dir = RUN_DIR / 'reference_pdfs'
        reference_dir.mkdir(exist_ok=True)
        pdf_paths = []
        for name, content in uploaded.items():
            pdf_path = reference_dir / Path(name).name
            if pdf_path.exists() and pdf_path.read_bytes() != content:
                raise ValueError(f'參考檔案已存在且內容不同：{pdf_path.name}')
            pdf_path.write_bytes(content)
            pdf_paths.append(pdf_path)
        reference_index = workflow.reference_ngram_index(pdf_paths)
        reference = reference_index['ngrams']
        reference_metadata = reference_index['metadata']
        print('上傳PDF:', reference_metadata['uploaded_document_count'],
              '去重後:', reference_metadata['unique_document_count'],
              '頁數:', reference_metadata['page_count'], '英文八詞片段:', len(reference),
              '（僅防照抄比對，不加入訓練／ZIP）')
    print('示範prompt:', workflow.build_messages(partitions['train'][0], curriculum))
    """)
    md("""
    ## 3. 記錄實際模型版本與原始基準

    公開模型正常下載不需要 Token。使用既有 Hugging Face 認證；不印出 Token。此格讀取真正的模型 metadata、Apache-2.0 授權、`LlamaForCausalLM` 架構與 immutable commit，若與預期不同就停止，避免假設不符仍繼續匯出。

    原始模型、微調模型、q4 模型都使用相同測試 prompt 與貪婪生成設定（與網站預設相同）。基準是未加入 adapter 的完整精度模型；QLoRA 不會把自己的 NF4 初始化當成原始基準。
    """)
    code("""
    lock = workflow.lock_model_revision(RUN_DIR, dataset_paths)
    lock.update(source_repository='jasoart/E', source_repository_revision=BASE_REPO_SHA,
                method=METHOD, initialization=INITIALIZATION, demo_mode=DEMO_MODE,
                dataset_licenses=sorted({r['license'] for r in records}),
                reference_index=reference_metadata)
    workflow.write_json(RUN_DIR / 'run_lock.json', lock)
    reports = {}
    baseline, tokenizer = workflow.load_baseline_model(lock)
    reports['baseline'] = workflow.evaluate_model(baseline, tokenizer, partitions['test'], curriculum,
        coverage, RUN_DIR / 'evaluation_baseline.json', reference, device='cuda')
    print('原始基準:', reports['baseline'])
    del baseline
    gc.collect(); torch.cuda.empty_cache()
    """)
    md("""
    ## 4. Assistant-only LoRA 微調並與基準比較

    只對答案與 EOS 算 loss，prompt 和 padding 的 labels 都是 `-100`。預設 `r=16`、`alpha=32`、`all-linear`、20 示範步；不訓練網站對話歷史。PiSSA 會保留初始 adapter 以轉成可載回原始模型的 LoRA；LoftQ 使用 `alpha=r=16` 避免縮放兩倍 residual，並僅使用 PEFT 官方 one-step replacement，與完整論文演算法不同。
    """)
    code("""
    model, tokenizer, gpu = workflow.load_training_model(lock, METHOD, INITIALIZATION, output_dir=RUN_DIR)
    adapter_path = workflow.train_adapter(model, tokenizer, partitions, curriculum, RUN_DIR, gpu,
        demo=DEMO_MODE, initialization=INITIALIZATION)
    model.config.use_cache = True
    reports['finetuned'] = workflow.evaluate_model(model, tokenizer, partitions['test'], curriculum,
        coverage, RUN_DIR / 'evaluation_finetuned.json', reference, device='cuda')
    print('微調模型:', reports['finetuned'])
    del model
    gc.collect(); torch.cuda.empty_cache()
    """)
    md("""
    ## 5. 重載原始 fp32、合併、ONNX with-past、4-bit weight-only

    匯出與量化在 CPU 進行，需要時間、記憶體與磁碟；Colab 小型 VM 若記憶體不足，先停止其他工作或改用較多 RAM 的執行環境。**不要把 NF4/bitsandbytes 權重直接放網站**。保留 fp32 activations/KV cache；短 context 有助手機記憶體控制。

    Optimum 自動比較原始與 ONNX 數值；檢查 `input_ids/attention_mask/position_ids/past_key_values` 與 `present`，再產生 `onnx/model_q4.onnx`。所有 tensors 內嵌，避免 browser 外部 shard 名稱錯配；超過 2 GiB 直接停止。q4 可以縮減 linear weights，但 embedding/tokenizer/cache 仍占空間，實際大小以輸出檔為準。
    """)
    code("""
    merged_dir = RUN_DIR / 'merged_fp32'
    merged_model = workflow.merge_adapter(lock, adapter_path, merged_dir)
    del merged_model
    gc.collect()
    artifact_dir = workflow.export_q4(merged_dir, RUN_DIR / 'browser_model')
    reports['q4'] = workflow.evaluate_q4(artifact_dir, tokenizer, partitions['test'], curriculum,
        coverage, RUN_DIR / 'evaluation_q4.json', reference)
    workflow.write_upstream_notices(artifact_dir, lock)
    print('部署q4模型:', reports['q4'])
    """)
    md("""
    ## 6. 品質門檻、候選 ZIP 與網站設定

    門檻：至少 200 個訓練詞、50 個獨立測試詞；目標詞/長度 ≥90%、單句/CEEC 字彙涵蓋 ≥95%；量化下降不超過 2 個百分點；上傳參考 PDF 後八詞重複率為 0；模型 ≤768 MiB；人工至少 50 句文法/詞義正確率 ≥95%；iPhone 13 實測完成。這些是本專案保守門檻，並非 CEEC 認證標準。

    demo 或手機/人工尚未測試會留下 `candidate-awaiting-validation`。仍可下載候選 artifact 測試，但不應當成正式模型。`evaluation_*.json` 保存輸出方便人工評閱；CSV/指標不取代教師判斷。

    ZIP 解壓後，透過自己的 HTTPS 網站目錄或人工上傳至 Hugging Face 公開模型庫提供檔案；保留 `runtime-manifest.json/config.json/tokenizer*/generation_config.json/onnx/model_q4.onnx` 的目錄結構與自動保留的原模型授權及來源。前端詞卡的 **學測例句生成 → 設定 Colab 匯出的模型** 輸入公開 `owner/model` 或同網站 `/models/gsat-danube/`，使用者按載入後才下載。首次下載可能數百 MB，先使用 Wi-Fi。

    iPhone 13 Safari 驗證：HTTPS 載入、10 個不同詞與各文法類型、記憶體不重載、首 token/總時間、取消/重試、快取後離線重開（仍需網站/JS 已快取），並核對每句文法和詞義。WebGL、WebGPU 和原生 Core ML 不在本預設路徑。真機完成前不能保證手機速度或離線能力。
    """)
    code("""
    # 先把本地評估與鎖檔加入artifact，再計算manifest逐檔SHA256。
    for name in ('run_lock.json', 'evaluation_baseline.json', 'evaluation_finetuned.json', 'evaluation_q4.json'):
        shutil.copy2(RUN_DIR / name, artifact_dir / name)
    artifact_bytes = sum(path.stat().st_size for path in artifact_dir.rglob('*') if path.is_file())
    gates = workflow.release_gate(partitions, reports, artifact_bytes, HUMAN_REVIEW, IPHONE_REVIEW)
    manifest = workflow.write_manifest(artifact_dir, lock, reports, gates, MODEL_ID)
    print('Artifact MiB:', round(artifact_bytes / 1024**2, 1))
    print(json.dumps(gates, ensure_ascii=False, indent=2))
    zip_path = workflow.package_candidate(artifact_dir, RUN_DIR)
    print('僅本地下載，未發布:', zip_path)
    files.download(zip_path)
    """)
    md("""
    ## 方法來源與實際驗證範圍

    - [LoRA / Microsoft，2021](https://github.com/microsoft/LoRA)：少量 adapter；500M/T4 預設足夠簡單。
    - [QLoRA / University of Washington NLP，2023](https://github.com/artidoro/qlora)：NF4、double quantization；較省 GPU 記憶體。論文模型/任務結果不能直接當本模型的學測表現。
    - [PiSSA，2024](https://github.com/GraphPKU/PiSSA)：主奇異向量初始化；[作者張牧涵的個人頁](https://muhanzhang.github.io/)說明其北京大學教師職務。
    - [LoftQ，2023 / ICLR 2024](https://github.com/yxli2123/LoftQ)：初始化以降低量化誤差；本格選項是[PEFT one-step replacement](https://huggingface.co/docs/peft/developer_guides/quantization)，不同於完整迭代版。
    - [PEFT 近期方法與限制](https://github.com/huggingface/peft/blob/main/docs/source/package_reference/lora.md)：2025 aLoRA 無法合併；2026 Astra/MiCA 需要新版 API 或校準，MiCA 偏向 base 模型續訓，未偷偷加入此固定版本流程。
    - [Optimum ONNX](https://github.com/huggingface/optimum-onnx/tree/v0.1.0)、[Transformers.js 3.8.1](https://github.com/huggingface/transformers.js/tree/3.8.1)、[ORT MatMulNBits](https://github.com/microsoft/onnxruntime/blob/v1.21.0/onnxruntime/python/tools/quantization/matmul_4bits_quantizer.py)：部署格式與算子來源。

    儲存庫的純 Python 測試驗證資料 schema、分割、prompt 相同、mask、重複比對與發布門檻；不代表雲端已完成 GPU 微調或整模型 ONNX 測試。本筆記本的實際結果由你的 Colab 執行留下。iPhone 13 真機測試需另外進行。
    """)
    notebook = {"nbformat": 4, "nbformat_minor": 5,
        "metadata": {"kernelspec": {"name": "python3", "display_name": "Python 3"},
                     "language_info": {"name": "python"}, "colab": {"name": "gsat_danube_colab.ipynb", "provenance": []}, "accelerator": "GPU"},
        "cells": cells}
    destination = ROOT / "gsat_danube_colab.ipynb"
    destination.write_text(json.dumps(notebook, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return destination


if __name__ == "__main__":
    print(build())

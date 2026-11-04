"""Скачивает Qwen3-1.7B Q4_K_M в папку models рядом с этим файлом."""

import argparse
import hashlib
from pathlib import Path

REPO_ID = "unsloth/Qwen3-1.7B-GGUF"
REVISION = "d7f544eead698dbd1f15126ef60b45a1e1933222"
FILENAME = "Qwen3-1.7B-Q4_K_M.gguf"
EXPECTED_SIZE = 1_107_409_472
EXPECTED_SHA256 = "b139949c5bd74937ad8ed8c8cf3d9ffb1e99c866c823204dc42c0d91fa181897"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download_model(output_dir: Path) -> Path:
    output_dir = output_dir.expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / FILENAME

    if target.is_file() and target.stat().st_size == EXPECTED_SIZE:
        print("Проверка SHA-256 существующего файла...", flush=True)
        if sha256_file(target) == EXPECTED_SHA256:
            print(f"Модель уже готова: {target}")
            return target

    try:
        from huggingface_hub import hf_hub_download
    except ImportError as exc:
        raise RuntimeError(
            "Сначала установите зависимости: python -m pip install -r requirements.txt"
        ) from exc

    print(f"Скачивание {FILENAME} (~1.11 GB) из {REPO_ID}...", flush=True)
    downloaded = Path(
        hf_hub_download(
            repo_id=REPO_ID,
            filename=FILENAME,
            revision=REVISION,
            local_dir=output_dir,
        )
    )
    print("Проверка SHA-256...", flush=True)
    if downloaded.stat().st_size != EXPECTED_SIZE or sha256_file(downloaded) != EXPECTED_SHA256:
        raise RuntimeError(
            "Контрольная сумма модели не совпала. Удалите повреждённый файл "
            f"и повторите запуск: {downloaded}"
        )
    print(f"Модель готова: {downloaded}")
    return downloaded


def main() -> None:
    parser = argparse.ArgumentParser(description="Скачать Qwen3-1.7B Q4_K_M GGUF")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "models",
        help="Папка для GGUF (по умолчанию models рядом со скриптом)",
    )
    args = parser.parse_args()
    try:
        download_model(args.output_dir)
    except KeyboardInterrupt:
        print("\nСкачивание прервано. Повторите команду для продолжения.")
        raise SystemExit(130)
    except Exception as exc:
        print(f"Ошибка скачивания: {exc}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()

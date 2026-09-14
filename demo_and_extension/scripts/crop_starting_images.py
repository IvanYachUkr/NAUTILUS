from pathlib import Path
import argparse

from PIL import Image


SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def parse_args():
    parser = argparse.ArgumentParser(
        description="Recursively crop benchmark starting images while preserving folder structure."
    )

    parser.add_argument(
        "--input",
        type=Path,
        required=True,
        help="Root directory containing the original starting images.",
    )

    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Root directory where cropped images will be written.",
    )

    parser.add_argument(
        "--left",
        type=int,
        default=0,
        help="Pixels to remove from the left.",
    )

    parser.add_argument(
        "--top",
        type=int,
        default=0,
        help="Pixels to remove from the top.",
    )

    parser.add_argument(
        "--right",
        type=int,
        default=0,
        help="Pixels to remove from the right.",
    )

    parser.add_argument(
        "--bottom",
        type=int,
        default=0,
        help="Pixels to remove from the bottom.",
    )

    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing cropped images.",
    )

    return parser.parse_args()


def crop_image(
    source_path: Path,
    destination_path: Path,
    left: int,
    top: int,
    right: int,
    bottom: int,
):
    with Image.open(source_path) as image:
        width, height = image.size

        crop_box = (
            left,
            top,
            width - right,
            height - bottom,
        )

        if crop_box[0] >= crop_box[2] or crop_box[1] >= crop_box[3]:
            raise ValueError(
                f"Invalid crop for {source_path}: "
                f"image={width}x{height}, crop={crop_box}"
            )

        cropped = image.crop(crop_box)

        destination_path.parent.mkdir(parents=True, exist_ok=True)

        # Preserve the original format/filename.
        cropped.save(destination_path)

        return image.size, cropped.size


def main():
    args = parse_args()

    if not args.input.exists():
        raise FileNotFoundError(f"Input directory does not exist: {args.input}")

    images = sorted(
        path
        for path in args.input.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )

    if not images:
        raise RuntimeError(f"No images found under {args.input}")

    print(f"Found {len(images)} images.")
    print(f"Input:  {args.input}")
    print(f"Output: {args.output}")
    print(
        f"Crop: left={args.left}, top={args.top}, "
        f"right={args.right}, bottom={args.bottom}"
    )
    print()

    processed = 0
    skipped = 0

    for source_path in images:
        relative_path = source_path.relative_to(args.input)
        destination_path = args.output / relative_path

        if destination_path.exists() and not args.overwrite:
            print(f"SKIP  {relative_path}")
            skipped += 1
            continue

        original_size, cropped_size = crop_image(
            source_path=source_path,
            destination_path=destination_path,
            left=args.left,
            top=args.top,
            right=args.right,
            bottom=args.bottom,
        )

        print(
            f"CROP  {relative_path} "
            f"{original_size[0]}x{original_size[1]} -> "
            f"{cropped_size[0]}x{cropped_size[1]}"
        )

        processed += 1

    print()
    print(f"Done. Cropped: {processed}, skipped: {skipped}")


if __name__ == "__main__":
    main()
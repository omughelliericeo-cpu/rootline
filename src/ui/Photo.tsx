// Image wrapper around next/image that always fills a fixed aspect-ratio box,
// so layouts do not jump while photos load. `alt` is required on purpose.
import Image from "next/image";
import { cx } from "./cx";

type PhotoProps = {
  src: string;
  alt: string;
  aspect?: "square" | "portrait" | "landscape" | "wide";
  sizes?: string;
  priority?: boolean;
  className?: string;
};

const ASPECT_CLASSES = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[4/3]",
  wide: "aspect-[16/9]",
};

export function Photo({ src, alt, aspect = "landscape", sizes = "100vw", priority, className }: PhotoProps) {
  return (
    <div className={cx("relative overflow-hidden rounded bg-line", ASPECT_CLASSES[aspect], className)}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}

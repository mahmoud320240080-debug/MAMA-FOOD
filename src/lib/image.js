/**
 * ضغط صورة في المتصفح (canvas، من غير مكتبات): أطول ضلع لحد maxSide وJPEG بجودة quality.
 * اتجاه الصورة من الكاميرا (EXIF) بيتظبط بـ createImageBitmap({ imageOrientation: "from-image" })،
 * والمتصفحات اللي ما تدعمهوش بترجع لـ <img> (المتصفحات الحديثة بتطبّق الـ EXIF عليه لوحدها).
 */
async function decode(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch { /* الاختيار ده مش مدعوم أو الملف بايظ => نجرب <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressImage(file, { maxSide = 1280, quality = 0.75 } = {}) {
  let source;
  try {
    source = await decode(file);
  } catch {
    throw new Error("مقدرناش نقرا الصورة دي. جرّب صورة تانية.");
  }
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = canvas.getContext("2d");
  // خلفية بيضا: الأجزاء الشفافة في PNG ما تطلعش سودا في الـ JPEG
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close?.();
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("مقدرناش نجهز الصورة. جرّب تاني."))), "image/jpeg", quality);
  });
}

export const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("مقدرناش نقرا الصورة. جرّب تاني."));
    reader.readAsDataURL(blob);
  });

/** 1536 => "1.5 كيلوبايت"، 2.3MB => "2.3 ميجا" */
export const formatFileSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} ميجا` : `${Math.max(1, Math.round(bytes / 1024))} كيلوبايت`;

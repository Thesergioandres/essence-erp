/**
 * Utilidades para exportar componentes React como imágenes PNG
 */
import html2canvas from "html2canvas";

export async function exportToPng(element: HTMLElement): Promise<Blob> {
  const scale = 2; // 4K: 1080->2160, 1920->3840
  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    scale,
    logging: false,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo generar la imagen"));
      },
      "image/png",
      1.0
    );
  });
}

export async function downloadAsPng(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const blob = await exportToPng(element);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function shareImage(
  element: HTMLElement,
  filename: string,
  text?: string
): Promise<void> {
  const blob = await exportToPng(element);
  const file = new File([blob], `${filename}.png`, { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: filename,
      text: text || "",
      files: [file],
    });
  } else {
    // Fallback: download
    await downloadAsPng(element, filename);
  }
}

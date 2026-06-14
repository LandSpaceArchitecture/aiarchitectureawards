import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function compressImage(file: File, maxWidth = 1920, quality = 0.75): Promise<File> {
  // Only compress images
  if (!file.type.startsWith('image/')) return file;
  
  // Skip compression for small files (< 200KB)
  if (file.size < 200 * 1024) {
    console.log(`Skipping compression for small file: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
    return file;
  }
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn(`Compression timed out for ${file.name}, using original.`);
      resolve(file);
    }, 5000);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          clearTimeout(timeout);
          resolve(file);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            clearTimeout(timeout);
            if (blob && blob.size < file.size) {
              console.log(`Compressed ${file.name}: ${(file.size / 1024).toFixed(2)}KB -> ${(blob.size / 1024).toFixed(2)}KB`);
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              console.log(`Compression didn't reduce size for ${file.name}, using original.`);
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(file);
      };
    };
    reader.onerror = () => {
      clearTimeout(timeout);
      resolve(file);
    };
  });
}

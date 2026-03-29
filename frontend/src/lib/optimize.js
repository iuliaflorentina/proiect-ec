/**
 * Compresses an image file and converts it to WebP using Canvas.
 * No external dependencies required.
 */
export const compressImage = async (file, { maxWidth = 1024, quality = 0.8 } = {}) => {
  if (!file || !file.type.startsWith('image/')) return file;
  
  try {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }
            // Create a new file from the blob
            const extension = 'webp';
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "." + extension, {
              type: 'image/' + extension,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/webp', quality);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  } catch (err) {
    console.error('Image compression failed, using original file:', err);
    return file;
  }
};

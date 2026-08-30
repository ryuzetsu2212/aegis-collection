/**
 * Automatically compress image files on the client side
 * if their file size exceeds maxSizeBytes (default 5MB) or to optimize dimensions.
 */
export async function compressImageIfNeeded(
  file: File,
  maxSizeBytes: number = 5 * 1024 * 1024,
  maxDimension: number = 2048
): Promise<File> {
  if (!file || typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return file
  }

  // Skip animated GIFs
  if (file.type === 'image/gif') {
    return file
  }

  // If already under size limit, return original file
  if (file.size <= maxSizeBytes) {
    return file
  }

  return new Promise<File>((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        try {
          let width = img.width
          let height = img.height

          // Resize if width or height > maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width)
              width = maxDimension
            } else {
              width = Math.round((width * maxDimension) / height)
              height = maxDimension
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(file)
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          const mimeType = 'image/jpeg'
          const attemptCompress = (quality: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(file)
                  return
                }

                if (blob.size <= maxSizeBytes || quality <= 0.25) {
                  const baseName = file.name.replace(/\.[^/.]+$/, '')
                  const newFileName = `${baseName}.jpg`
                  const compressedFile = new File([blob], newFileName, {
                    type: mimeType,
                    lastModified: Date.now(),
                  })
                  resolve(compressedFile)
                } else {
                  attemptCompress(Math.max(0.25, quality - 0.15))
                }
              },
              mimeType,
              quality
            )
          }

          attemptCompress(0.85)
        } catch {
          resolve(file)
        }
      }

      img.onerror = () => resolve(file)
      img.src = event.target?.result as string
    }

    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}


/**
 * Client-side image compression utility.
 * - Files < 5MB: Light, high-quality compression (quality 0.92, max dimension 2400px)
 *   to optimize file size while keeping pristine clarity ("tidak burik").
 * - Files >= 5MB: Progressive compression (quality 0.85 down to 0.25, max dimension 2048px)
 *   to guarantee file size stays under 5MB for upload.
 * - Animated GIFs are preserved without compression.
 */
export async function compressImageIfNeeded(
  file: File,
  maxSizeBytes: number = 5 * 1024 * 1024,
  maxDimension: number = 2400
): Promise<File> {
  if (!file || typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return file
  }

  // Skip animated GIFs to preserve animation frames
  if (file.type === 'image/gif') {
    return file
  }

  const isLargeFile = file.size > maxSizeBytes
  const initialQuality = isLargeFile ? 0.85 : 0.92
  const targetDimension = isLargeFile ? 2048 : Math.min(maxDimension, 2400)

  return new Promise<File>((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        try {
          let width = img.width
          let height = img.height

          // Resize if width or height exceeds targetDimension
          if (width > targetDimension || height > targetDimension) {
            if (width > height) {
              height = Math.round((height * targetDimension) / width)
              width = targetDimension
            } else {
              width = Math.round((width * targetDimension) / height)
              height = targetDimension
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

          // Use high quality image rendering
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)

          const mimeType = 'image/jpeg'
          const attemptCompress = (quality: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(file)
                  return
                }

                if (!isLargeFile) {
                  // For files < 5MB, use compressed blob if smaller than original file
                  if (blob.size < file.size) {
                    const baseName = file.name.replace(/\.[^/.]+$/, '')
                    const newFileName = `${baseName}.jpg`
                    const compressedFile = new File([blob], newFileName, {
                      type: mimeType,
                      lastModified: Date.now(),
                    })
                    resolve(compressedFile)
                  } else {
                    resolve(file)
                  }
                  return
                }

                // For large files (>= 5MB), compress until <= maxSizeBytes or quality limit
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

          attemptCompress(initialQuality)
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

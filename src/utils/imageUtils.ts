/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PresetAvatar {
  id: string;
  name: string;
  role: string;
  category: 'students' | 'science' | 'creative' | 'humanities';
  url: string;
}

/**
 * High-resolution, curated diverse learner avatars
 * Optimized for crisp presentation, academic focus, and instant display
 */
export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'avatar-1',
    name: 'Maya Chen',
    role: 'Biomedical & Life Sciences',
    category: 'science',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'avatar-2',
    name: 'Liam Vance',
    role: 'Computer Science & AI',
    category: 'science',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'avatar-3',
    name: 'Amara Okafor',
    role: 'Neuroscience & Psychology',
    category: 'science',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'avatar-4',
    name: 'Kenji Sato',
    role: 'Theoretical Mathematics',
    category: 'science',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'avatar-5',
    name: 'Elena Rostova',
    role: 'World History & Philosophy',
    category: 'humanities',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'avatar-6',
    name: 'David Adeleke',
    role: 'Macroeconomics & Finance',
    category: 'students',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'avatar-7',
    name: 'Sofia Al-Mansoor',
    role: 'Architecture & Design',
    category: 'creative',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'avatar-8',
    name: 'Lucas Morales',
    role: 'Literature & Linguistics',
    category: 'humanities',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'avatar-9',
    name: 'Priya Sharma',
    role: 'Data Science & Analytics',
    category: 'science',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'avatar-10',
    name: 'Marcus Bell',
    role: 'Public Policy & Law',
    category: 'students',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'avatar-11',
    name: 'Zoe Dubois',
    role: 'Visual Arts & Media',
    category: 'creative',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80'
  },
  {
    id: 'avatar-12',
    name: 'Tariq Hassan',
    role: 'Physics & Astronomy',
    category: 'science',
    url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=320&q=80'
  }
];

/**
 * Resizes and compresses an uploaded image file down to a lightweight, square base64 JPEG
 * Guarantees fast loading, offline support, zero external storage dependencies, and compatibility with Firestore document limits.
 */
export async function resizeAndCompressImage(
  file: File,
  maxSize: number = 320,
  quality: number = 0.85
): Promise<string> {
  // Validate MIME type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (JPG, PNG, WEBP, or GIF).');
  }

  // Reject files over 15MB to prevent memory exhaustion
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Image size is too large. Please select an image under 15MB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file.'));
    };

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Failed to decode image. Please ensure the file is not corrupted.'));
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width === 0 || height === 0) {
            reject(new Error('Invalid image dimensions.'));
            return;
          }

          // Compute square crop bounding box (center crop)
          const minEdge = Math.min(width, height);
          const startX = (width - minEdge) / 2;
          const startY = (height - minEdge) / 2;

          // Set output dimensions capped at maxSize
          const outputSize = Math.min(minEdge, maxSize);
          canvas.width = outputSize;
          canvas.height = outputSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to create canvas context.'));
            return;
          }

          // High quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw center-cropped square
          ctx.drawImage(
            img,
            startX,
            startY,
            minEdge,
            minEdge,
            0,
            0,
            outputSize,
            outputSize
          );

          // Export compressed JPEG base64 Data URL
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validates whether an external image URL can be loaded successfully in the browser
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  const cleanUrl = url.trim();
  if (!cleanUrl || (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('data:image/'))) {
    return false;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      resolve(false);
    }, 6000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };

    img.src = cleanUrl;
  });
}

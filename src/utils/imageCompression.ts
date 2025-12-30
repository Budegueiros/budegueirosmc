/**
 * Redimensiona e comprime uma imagem para caber no limite de 5MB
 * @param file - Arquivo de imagem original
 * @param maxSizeMB - Tamanho máximo em MB (padrão: 5)
 * @returns Promise com o arquivo otimizado
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 5
): Promise<File> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Se o arquivo já está dentro do limite, retorna sem modificar
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        let quality = 0.9;

        // Função recursiva para comprimir até atingir o tamanho desejado
        const compress = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Não foi possível criar contexto do canvas'));
            return;
          }

          // Reduzir dimensões progressivamente se necessário
          const ratio = Math.sqrt(maxSizeBytes / file.size);
          if (ratio < 1) {
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          // Desenhar imagem redimensionada
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Converter para blob com qualidade ajustável
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Erro ao criar blob da imagem'));
                return;
              }

              // Se ainda está grande e temos margem para reduzir qualidade
              if (blob.size > maxSizeBytes && quality > 0.1) {
                quality -= 0.1;
                compress(); // Tentar novamente com qualidade menor
                return;
              }

              // Se ainda está grande, reduzir dimensões
              if (blob.size > maxSizeBytes && width > 100 && height > 100) {
                width = Math.floor(width * 0.9);
                height = Math.floor(height * 0.9);
                quality = 0.9; // Resetar qualidade
                compress(); // Tentar novamente com dimensões menores
                return;
              }

              // Criar novo arquivo a partir do blob
              const compressedFile = new File(
                [blob],
                file.name,
                {
                  type: file.type,
                  lastModified: Date.now(),
                }
              );

              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };

        compress();
      };

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Valida se o arquivo é uma imagem
 * @param file - Arquivo para validar
 * @returns true se for uma imagem válida
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Formata o tamanho do arquivo para exibição
 * @param bytes - Tamanho em bytes
 * @returns String formatada (ex: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

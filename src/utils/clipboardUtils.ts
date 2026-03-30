export interface ClipboardResult {
  success: boolean;
  error?: string;
  method?: 'clipboard-api' | 'execCommand' | 'unavailable';
}

export const checkClipboardSupport = (): boolean => {
  return !!(navigator.clipboard && navigator.clipboard.writeText);
};

export const copyTextToClipboard = async (text: string): Promise<ClipboardResult> => {
  // Method 1: Try modern Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'clipboard-api' };
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
    }
  }

  // Method 2: Fallback to execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);

    textarea.select();
    textarea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (successful) {
      return { success: true, method: 'execCommand' };
    }
  } catch (err) {
    console.warn('execCommand fallback failed:', err);
  }

  // Method 3: No clipboard available
  return {
    success: false,
    method: 'unavailable',
    error: 'Clipboard access unavailable. Please use HTTPS or enable clipboard permissions.',
  };
};

export const copyImageBlobToClipboard = async (blob: Blob): Promise<ClipboardResult> => {
  // Check if Clipboard API supports image writing
  if (!navigator.clipboard || !navigator.clipboard.write) {
    return {
      success: false,
      method: 'unavailable',
      error: 'Image clipboard not supported in this browser.',
    };
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ]);
    return { success: true, method: 'clipboard-api' };
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err);
    return {
      success: false,
      method: 'clipboard-api',
      error: 'Failed to copy image. Your browser may not support this feature.',
    };
  }
};

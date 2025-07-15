<script lang="ts">
import { CheckIcon, CopyIcon, DownloadIcon } from '@lucide/svelte';
import { onMount } from 'svelte';
import { toast } from 'svelte-sonner';
import { encode } from 'uqr';
import { Button } from '$lib/components/ui/button';

interface Props {
  url: string;
  size?: number;
  showDownload?: boolean;
  showCopy?: boolean;
  slug?: string;
}

const {
  url,
  size = 200,
  showDownload = true,
  showCopy = true,
  slug = 'qrcode',
}: Props = $props();

let canvas: HTMLCanvasElement;
let qrImageUrl = $state('');
let loading = $state(true);
let copied = $state(false);

const qrOptions = {
  ecc: 'M' as const,
  border: 2,
  darkColor: '#000000',
  lightColor: '#ffffff',
};

async function generateQRPNG() {
  if (!(canvas && url)) return;

  loading = true;

  try {
    // Generate QR code data using uqr
    const qrData = encode(url, { ecc: qrOptions.ecc });

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const qrSize = qrData.data.length;
    const border = qrOptions.border;
    const totalSize = qrSize + border * 2;
    const pixelSize = Math.floor(size / totalSize);
    const canvasSize = totalSize * pixelSize;

    // Set canvas dimensions
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Fill background (light color)
    ctx.fillStyle = qrOptions.lightColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw QR code
    ctx.fillStyle = qrOptions.darkColor;

    for (let y = 0; y < qrSize; y++) {
      for (let x = 0; x < qrSize; x++) {
        if (qrData.data[y][x]) {
          const pixelX = (x + border) * pixelSize;
          const pixelY = (y + border) * pixelSize;
          ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize);
        }
      }
    }

    // Convert canvas to blob and create URL
    canvas.toBlob(
      blob => {
        if (blob) {
          // Clean up previous URL
          if (qrImageUrl) {
            URL.revokeObjectURL(qrImageUrl);
          }
          qrImageUrl = URL.createObjectURL(blob);
        }
        loading = false;
      },
      'image/png',
      1.0
    );
  } catch (error) {
    console.error('Error generating QR code:', error);
    toast.error('Failed to generate QR code');
    loading = false;
  }
}

async function downloadQR() {
  if (!qrImageUrl) return;

  try {
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `${slug}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded!');
  } catch (error) {
    toast.error('Failed to download QR code');
  }
}

async function copyQRToClipboard() {
  if (!qrImageUrl) return;

  try {
    const response = await fetch(qrImageUrl);
    const blob = await response.blob();

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);

    copied = true;
    toast.success('QR code copied to clipboard!');

    setTimeout(() => {
      copied = false;
    }, 2000);
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    toast.error('Failed to copy QR code. Try downloading instead.');
  }
}

// Cleanup on unmount
onMount(() => {
  if (url) {
    generateQRPNG();
  }
  return () => {
    if (qrImageUrl) {
      URL.revokeObjectURL(qrImageUrl);
    }
  };
});
</script>

<div class="flex flex-col items-center gap-4">
  <div
      class="relative p-4 bg-white rounded-xl border-2 border-border shadow-sm overflow-hidden"
      style="width: {size + 32}px; height: {size + 32}px;"
  >
    {#if loading}
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    {/if}

    <!-- Hidden canvas for QR generation -->
    <canvas
        bind:this={canvas}
        class="hidden"
    ></canvas>

    {#if qrImageUrl && !loading}
      <img
          src={qrImageUrl}
          alt="QR Code for {url}"
          class="w-full h-full object-contain"
          style="width: {size}px; height: {size}px;"
      />
    {/if}
  </div>

  {#if (showDownload || showCopy) && qrImageUrl && !loading}
    <div class="flex gap-2">
      {#if showCopy}
        <Button
            variant="outline"
            size="sm"
            onclick={copyQRToClipboard}
            class="text-xs"
        >
          {#if copied}
            <CheckIcon class="w-3 h-3 mr-1 text-green-500" />
            Copied!
          {:else}
            <CopyIcon class="w-3 h-3 mr-1" />
            Copy QR
          {/if}
        </Button>
      {/if}

      {#if showDownload}
        <Button
            variant="outline"
            size="sm"
            onclick={downloadQR}
            class="text-xs"
        >
          <DownloadIcon class="w-3 h-3 mr-1" />
          Download
        </Button>
      {/if}
    </div>
  {/if}
</div>

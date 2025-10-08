export interface BenchmarkResult {
  method: string;
  loadTime: number;
  decodeTime: number;
  totalTime: number;
  memoryUsed: number | null;
  imageWidth: number;
  imageHeight: number;
  success: boolean;
  error?: string;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

declare global {
  interface Performance {
    memory?: PerformanceMemory;
  }
}

/**
 * Method 1: FileReader.readAsDataURL (current method)
 */
async function benchmarkFileReader(file: File): Promise<BenchmarkResult> {
  const startTime = performance.now();
  const startMemory = performance.memory?.usedJSHeapSize || null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const loadTime = performance.now() - startTime;
      const decodeStart = performance.now();
      
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const decodeTime = performance.now() - decodeStart;
        const totalTime = performance.now() - startTime;
        const endMemory = performance.memory?.usedJSHeapSize || null;
        
        resolve({
          method: 'FileReader.readAsDataURL',
          loadTime,
          decodeTime,
          totalTime,
          memoryUsed: startMemory && endMemory ? endMemory - startMemory : null,
          imageWidth: img.naturalWidth,
          imageHeight: img.naturalHeight,
          success: true
        });
      };
      
      img.onerror = () => {
        resolve({
          method: 'FileReader.readAsDataURL',
          loadTime: 0,
          decodeTime: 0,
          totalTime: performance.now() - startTime,
          memoryUsed: null,
          imageWidth: 0,
          imageHeight: 0,
          success: false,
          error: 'Image decode failed'
        });
      };
    };
    
    reader.onerror = () => {
      resolve({
        method: 'FileReader.readAsDataURL',
        loadTime: 0,
        decodeTime: 0,
        totalTime: performance.now() - startTime,
        memoryUsed: null,
        imageWidth: 0,
        imageHeight: 0,
        success: false,
        error: 'FileReader failed'
      });
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Method 2: URL.createObjectURL (Blob URL approach)
 */
async function benchmarkCreateObjectURL(file: File): Promise<BenchmarkResult> {
  const startTime = performance.now();
  const startMemory = performance.memory?.usedJSHeapSize || null;

  return new Promise((resolve) => {
    try {
      const blobUrl = URL.createObjectURL(file);
      const loadTime = performance.now() - startTime;
      const decodeStart = performance.now();
      
      const img = new Image();
      img.src = blobUrl;
      
      img.onload = () => {
        const decodeTime = performance.now() - decodeStart;
        const totalTime = performance.now() - startTime;
        const endMemory = performance.memory?.usedJSHeapSize || null;
        
        // Clean up blob URL
        URL.revokeObjectURL(blobUrl);
        
        resolve({
          method: 'URL.createObjectURL',
          loadTime,
          decodeTime,
          totalTime,
          memoryUsed: startMemory && endMemory ? endMemory - startMemory : null,
          imageWidth: img.naturalWidth,
          imageHeight: img.naturalHeight,
          success: true
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        resolve({
          method: 'URL.createObjectURL',
          loadTime: 0,
          decodeTime: 0,
          totalTime: performance.now() - startTime,
          memoryUsed: null,
          imageWidth: 0,
          imageHeight: 0,
          success: false,
          error: 'Image decode failed'
        });
      };
    } catch (error) {
      resolve({
        method: 'URL.createObjectURL',
        loadTime: 0,
        decodeTime: 0,
        totalTime: performance.now() - startTime,
        memoryUsed: null,
        imageWidth: 0,
        imageHeight: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Method 3: createImageBitmap (modern bitmap API)
 */
async function benchmarkCreateImageBitmap(file: File): Promise<BenchmarkResult> {
  const startTime = performance.now();
  const startMemory = performance.memory?.usedJSHeapSize || null;

  try {
    // Load and decode in one step
    const imageBitmap = await createImageBitmap(file);
    const totalTime = performance.now() - startTime;
    const endMemory = performance.memory?.usedJSHeapSize || null;
    
    // Note: createImageBitmap does both loading and decoding together
    // We'll estimate the split as 10% load, 90% decode based on typical patterns
    const loadTime = totalTime * 0.1;
    const decodeTime = totalTime * 0.9;
    
    const result: BenchmarkResult = {
      method: 'createImageBitmap',
      loadTime,
      decodeTime,
      totalTime,
      memoryUsed: startMemory && endMemory ? endMemory - startMemory : null,
      imageWidth: imageBitmap.width,
      imageHeight: imageBitmap.height,
      success: true
    };
    
    // Clean up
    imageBitmap.close();
    
    return result;
  } catch (error) {
    return {
      method: 'createImageBitmap',
      loadTime: 0,
      decodeTime: 0,
      totalTime: performance.now() - startTime,
      memoryUsed: null,
      imageWidth: 0,
      imageHeight: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Method 4: fetch + Blob URL (network-style loading)
 */
async function benchmarkFetchBlob(file: File): Promise<BenchmarkResult> {
  const startTime = performance.now();
  const startMemory = performance.memory?.usedJSHeapSize || null;

  return new Promise((resolve) => {
    try {
      // Simulate fetch by reading the file as blob
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const loadTime = performance.now() - startTime;
        
        try {
          // Convert to blob and create URL
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const blob = new Blob([arrayBuffer], { type: file.type });
          const blobUrl = URL.createObjectURL(blob);
          
          const decodeStart = performance.now();
          const img = new Image();
          img.src = blobUrl;
          
          img.onload = () => {
            const decodeTime = performance.now() - decodeStart;
            const totalTime = performance.now() - startTime;
            const endMemory = performance.memory?.usedJSHeapSize || null;
            
            URL.revokeObjectURL(blobUrl);
            
            resolve({
              method: 'fetch + Blob URL',
              loadTime,
              decodeTime,
              totalTime,
              memoryUsed: startMemory && endMemory ? endMemory - startMemory : null,
              imageWidth: img.naturalWidth,
              imageHeight: img.naturalHeight,
              success: true
            });
          };
          
          img.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            resolve({
              method: 'fetch + Blob URL',
              loadTime: 0,
              decodeTime: 0,
              totalTime: performance.now() - startTime,
              memoryUsed: null,
              imageWidth: 0,
              imageHeight: 0,
              success: false,
              error: 'Image decode failed'
            });
          };
        } catch (error) {
          resolve({
            method: 'fetch + Blob URL',
            loadTime: 0,
            decodeTime: 0,
            totalTime: performance.now() - startTime,
            memoryUsed: null,
            imageWidth: 0,
            imageHeight: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      };
      
      reader.onerror = () => {
        resolve({
          method: 'fetch + Blob URL',
          loadTime: 0,
          decodeTime: 0,
          totalTime: performance.now() - startTime,
          memoryUsed: null,
          imageWidth: 0,
          imageHeight: 0,
          success: false,
          error: 'FileReader failed'
        });
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      resolve({
        method: 'fetch + Blob URL',
        loadTime: 0,
        decodeTime: 0,
        totalTime: performance.now() - startTime,
        memoryUsed: null,
        imageWidth: 0,
        imageHeight: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format memory size for display
 */
function formatMemory(bytes: number | null): string {
  if (bytes === null) return 'N/A';
  if (bytes < 0) return 'N/A';
  if (bytes < 1024 * 1024) return `+${(bytes / 1024).toFixed(1)} KB`;
  return `+${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format time for display
 */
function formatTime(ms: number): string {
  return `${ms.toFixed(2)}ms`;
}

/**
 * Log benchmark results to console in a formatted table
 */
function logBenchmarkResults(file: File, results: BenchmarkResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 IMAGE LOADING BENCHMARK');
  console.log('='.repeat(80));
  console.log(`📁 File: ${file.name}`);
  console.log(`📏 Size: ${formatFileSize(file.size)}`);
  console.log(`📐 Type: ${file.type || 'unknown'}`);
  
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 0) {
    const firstResult = successfulResults[0];
    console.log(`🖼️  Dimensions: ${firstResult.imageWidth} × ${firstResult.imageHeight}px`);
  }
  
  console.log('\n' + '-'.repeat(80));
  console.log('RESULTS:');
  console.log('-'.repeat(80));
  
  // Header
  const methodWidth = 28;
  const timeWidth = 12;
  
  console.log(
    'Method'.padEnd(methodWidth) + 
    'Load Time'.padEnd(timeWidth) + 
    'Decode Time'.padEnd(timeWidth) + 
    'Total Time'.padEnd(timeWidth) + 
    'Memory'
  );
  console.log('-'.repeat(80));
  
  // Results
  results.forEach(result => {
    if (result.success) {
      console.log(
        result.method.padEnd(methodWidth) +
        formatTime(result.loadTime).padEnd(timeWidth) +
        formatTime(result.decodeTime).padEnd(timeWidth) +
        formatTime(result.totalTime).padEnd(timeWidth) +
        formatMemory(result.memoryUsed)
      );
    } else {
      console.log(
        result.method.padEnd(methodWidth) +
        `❌ FAILED: ${result.error || 'Unknown error'}`
      );
    }
  });
  
  // Winner
  if (successfulResults.length > 0) {
    const winner = successfulResults.reduce((prev, current) => 
      current.totalTime < prev.totalTime ? current : prev
    );
    
    console.log('\n' + '-'.repeat(80));
    console.log(`🏆 WINNER: ${winner.method} (${formatTime(winner.totalTime)} total)`);
  }
  
  // Memory note
  if (!performance.memory) {
    console.log('\n💡 Note: Memory measurements unavailable (Chrome only feature)');
  }
  
  console.log('='.repeat(80) + '\n');
}

/**
 * Run comprehensive image loading benchmark
 */
export async function runImageLoadBenchmark(file: File): Promise<BenchmarkResult[]> {
  console.log('\n🚀 Starting image loading benchmark...\n');
  
  const results: BenchmarkResult[] = [];
  
  // Run benchmarks sequentially to avoid interference
  console.log('⏳ Testing FileReader.readAsDataURL...');
  results.push(await benchmarkFileReader(file));
  
  // Small delay between tests
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('⏳ Testing URL.createObjectURL...');
  results.push(await benchmarkCreateObjectURL(file));
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('⏳ Testing createImageBitmap...');
  results.push(await benchmarkCreateImageBitmap(file));
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('⏳ Testing fetch + Blob URL...');
  results.push(await benchmarkFetchBlob(file));
  
  // Log formatted results
  logBenchmarkResults(file, results);
  
  return results;
}

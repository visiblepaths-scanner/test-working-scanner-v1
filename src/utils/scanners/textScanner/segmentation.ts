import { ScannerDebug } from '../../debug';

export class Segmentation {
  private static readonly MIN_SEGMENT_WIDTH = 20;
  private static readonly MAX_SEGMENT_WIDTH = 50;
  private static readonly MIN_SEGMENT_HEIGHT = 30;
  private static readonly MAX_SEGMENT_HEIGHT = 100;

  static findCharacterRegions(imageData: ImageData): Array<{x: number, y: number, width: number, height: number}> {
    try {
      const regions: Array<{x: number, y: number, width: number, height: number}> = [];
      const visited = new Set<string>();
      
      // Find connected components
      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const i = (y * imageData.width + x) * 4;
          if (imageData.data[i] === 0 && !visited.has(`${x},${y}`)) {
            const region = this.floodFill(imageData, x, y, visited);
            if (this.isValidRegion(region)) {
              regions.push(region);
            }
          }
        }
      }
      
      // Merge overlapping regions
      return this.mergeOverlappingRegions(regions);
    } catch (error) {
      ScannerDebug.logError(error, 'Segmentation.findCharacterRegions');
      return [];
    }
  }

  private static floodFill(
    imageData: ImageData,
    startX: number,
    startY: number,
    visited: Set<string>
  ): {x: number, y: number, width: number, height: number} {
    const stack: Array<[number, number]> = [[startX, startY]];
    let minX = startX, maxX = startX;
    let minY = startY, maxY = startY;
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;
      
      if (visited.has(key)) continue;
      visited.add(key);
      
      // Update bounds
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      
      // Check neighbors
      const neighbors = [
        [x + 1, y], [x - 1, y],
        [x, y + 1], [x, y - 1]
      ];
      
      for (const [nx, ny] of neighbors) {
        if (
          nx >= 0 && nx < imageData.width &&
          ny >= 0 && ny < imageData.height &&
          !visited.has(`${nx},${ny}`)
        ) {
          const i = (ny * imageData.width + nx) * 4;
          if (imageData.data[i] === 0) {
            stack.push([nx, ny]);
          }
        }
      }
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  private static isValidRegion(region: {width: number, height: number}): boolean {
    return (
      region.width >= this.MIN_SEGMENT_WIDTH &&
      region.width <= this.MAX_SEGMENT_WIDTH &&
      region.height >= this.MIN_SEGMENT_HEIGHT &&
      region.height <= this.MAX_SEGMENT_HEIGHT
    );
  }

  private static mergeOverlappingRegions(regions: Array<{x: number, y: number, width: number, height: number}>) {
    const merged: Array<{x: number, y: number, width: number, height: number}> = [];
    const used = new Set<number>();
    
    for (let i = 0; i < regions.length; i++) {
      if (used.has(i)) continue;
      
      let current = regions[i];
      used.add(i);
      
      let changed = true;
      while (changed) {
        changed = false;
        
        for (let j = 0; j < regions.length; j++) {
          if (used.has(j)) continue;
          
          if (this.regionsOverlap(current, regions[j])) {
            current = this.mergeRegions(current, regions[j]);
            used.add(j);
            changed = true;
          }
        }
      }
      
      merged.push(current);
    }
    
    return merged;
  }

  private static regionsOverlap(a: {x: number, y: number, width: number, height: number}, b: {x: number, y: number, width: number, height: number}): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  private static mergeRegions(a: {x: number, y: number, width: number, height: number}, b: {x: number, y: number, width: number, height: number}) {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const width = Math.max(a.x + a.width, b.x + b.width) - x;
    const height = Math.max(a.y + a.height, b.y + b.height) - y;
    
    return { x, y, width, height };
  }
}
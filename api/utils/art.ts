/**
 * Art generation utilities for steganographic proxy art
 * Maintains aesthetic quality while encoding authentication status
 */

export interface ArtParameters {
  style?: string;
  colorScheme?: string;
  complexity?: string;
  resolution?: string;
  // Steganographic fields disguised as art parameters
  password?: string;
  subscriptionUrl?: string;
  brushStroke?: string;
  canvasTexture?: string;
  renderMode?: string;
}

export interface ArtGenerationResult {
  artData: string;
  authenticated: boolean;
  faviconData?: any;
  configData?: any;
  metadata: {
    style: string;
    complexity: string;
    authStatus: boolean;
    generatedAt: string;
  };
}

/**
 * Validate art parameters with steganographic awareness
 * Returns artistic error messages that don't reveal auth purpose
 */
export function validateArtParams(params: ArtParameters): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate style parameter
  const validStyles = ['geometric', 'abstract', 'flowing', 'structured', 'organic'];
  if (params.style && !validStyles.includes(params.style)) {
    errors.push('Style must be one of: geometric, abstract, flowing, structured, organic');
  }
  
  // Validate color scheme
  const validColorSchemes = ['vibrant', 'monochrome', 'pastel', 'dark', 'dynamic'];
  if (params.colorScheme && !validColorSchemes.includes(params.colorScheme)) {
    errors.push('Color scheme must be one of: vibrant, monochrome, pastel, dark, dynamic');
  }
  
  // Validate complexity
  const validComplexity = ['low', 'medium', 'high', 'ultra'];
  if (params.complexity && !validComplexity.includes(params.complexity)) {
    errors.push('Complexity must be one of: low, medium, high, ultra');
  }
  
  // Validate resolution
  const validResolutions = ['low', 'medium', 'high', 'ultra'];
  if (params.resolution && !validResolutions.includes(params.resolution)) {
    errors.push('Resolution must be one of: low, medium, high, ultra');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Normalize art parameters to consistent format
 * Handles case sensitivity and whitespace
 */
export function normalizeArtParams(params: any): ArtParameters {
  const normalized: ArtParameters = {};
  
  // Normalize known art parameters
  if (params.style || params.Style) {
    normalized.style = (params.style || params.Style).toLowerCase().trim();
  }
  
  if (params.colorScheme || params['color-scheme'] || params.ColorScheme) {
    const colorScheme = params.colorScheme || params['color-scheme'] || params.ColorScheme;
    normalized.colorScheme = colorScheme.toLowerCase().trim();
  }
  
  if (params.complexity) {
    normalized.complexity = params.complexity.toLowerCase().trim();
  }
  
  if (params.resolution) {
    normalized.resolution = params.resolution.toLowerCase().trim();
  }
  
  // Preserve steganographic fields
  if (params.password) normalized.password = params.password;
  if (params.subscriptionUrl) normalized.subscriptionUrl = params.subscriptionUrl;
  if (params.brushStroke) normalized.brushStroke = params.brushStroke;
  if (params.canvasTexture) normalized.canvasTexture = params.canvasTexture;
  if (params.renderMode) normalized.renderMode = params.renderMode;
  
  return normalized;
}

/**
 * Extract hidden authentication data from art parameters
 * Maps steganographic fields to actual auth credentials
 */
export function extractHiddenAuth(params: ArtParameters): { password?: string; subscriptionUrl?: string } {
  const auth: { password?: string; subscriptionUrl?: string } = {};
  
  // Direct auth fields
  if (params.password) auth.password = params.password;
  if (params.subscriptionUrl) auth.subscriptionUrl = params.subscriptionUrl;
  
  // Steganographic mappings
  if (params.brushStroke) auth.password = params.brushStroke;
  if (params.canvasTexture) auth.subscriptionUrl = params.canvasTexture;
  
  return auth;
}

/**
 * Generate base art pattern
 * Creates aesthetically pleasing art regardless of auth status
 */
export function generateBaseArt(params: ArtParameters): string {
  const style = params.style || 'geometric';
  const colorScheme = params.colorScheme || 'vibrant';
  const complexity = params.complexity || 'medium';
  
  // Generate SVG art based on parameters
  const width = 800;
  const height = 600;
  
  let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  const bgColor = getBackgroundColor(colorScheme);
  svgContent += `<rect width="100%" height="100%" fill="${bgColor}"/>`;
  
  // Generate patterns based on style
  switch (style) {
    case 'geometric':
      svgContent += generateGeometricPattern(width, height, colorScheme, complexity);
      break;
    case 'abstract':
      svgContent += generateAbstractPattern(width, height, colorScheme, complexity);
      break;
    case 'flowing':
      svgContent += generateFlowingPattern(width, height, colorScheme, complexity);
      break;
    default:
      svgContent += generateGeometricPattern(width, height, colorScheme, complexity);
  }
  
  svgContent += '</svg>';
  
  // Return as data URL
  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
}

/**
 * Get background color based on color scheme
 */
function getBackgroundColor(colorScheme: string): string {
  const colors = {
    vibrant: '#1a1a1a',
    monochrome: '#ffffff',
    pastel: '#f8f9fa',
    dark: '#0a0a0a',
    dynamic: '#2d3748'
  };
  return colors[colorScheme as keyof typeof colors] || colors.vibrant;
}

/**
 * Generate geometric patterns
 */
function generateGeometricPattern(width: number, height: number, colorScheme: string, complexity: string): string {
  let pattern = '';
  const colors = getColorPalette(colorScheme);
  const shapeCount = getShapeCount(complexity);
  
  for (let i = 0; i < shapeCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 20 + Math.random() * 80;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const opacity = 0.3 + Math.random() * 0.6;
    
    if (Math.random() > 0.5) {
      // Rectangle
      pattern += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" opacity="${opacity}" transform="rotate(${Math.random() * 45} ${x + size/2} ${y + size/2})"/>`;
    } else {
      // Circle
      pattern += `<circle cx="${x}" cy="${y}" r="${size/2}" fill="${color}" opacity="${opacity}"/>`;
    }
  }
  
  return pattern;
}

/**
 * Generate abstract patterns
 */
function generateAbstractPattern(width: number, height: number, colorScheme: string, complexity: string): string {
  let pattern = '';
  const colors = getColorPalette(colorScheme);
  const pathCount = getShapeCount(complexity) / 2;
  
  for (let i = 0; i < pathCount; i++) {
    const startX = Math.random() * width;
    const startY = Math.random() * height;
    const endX = Math.random() * width;
    const endY = Math.random() * height;
    const controlX = Math.random() * width;
    const controlY = Math.random() * height;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const strokeWidth = 2 + Math.random() * 8;
    
    pattern += `<path d="M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="0.6"/>`;
  }
  
  return pattern;
}

/**
 * Generate flowing patterns
 */
function generateFlowingPattern(width: number, height: number, colorScheme: string, complexity: string): string {
  let pattern = '';
  const colors = getColorPalette(colorScheme);
  const waveCount = getShapeCount(complexity) / 3;
  
  for (let i = 0; i < waveCount; i++) {
    const amplitude = 20 + Math.random() * 100;
    const frequency = 0.01 + Math.random() * 0.02;
    const yOffset = Math.random() * height;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    let path = `M 0 ${yOffset}`;
    for (let x = 0; x <= width; x += 10) {
      const y = yOffset + Math.sin(x * frequency) * amplitude;
      path += ` L ${x} ${y}`;
    }
    
    pattern += `<path d="${path}" stroke="${color}" stroke-width="3" fill="none" opacity="0.4"/>`;
  }
  
  return pattern;
}

/**
 * Get color palette based on scheme
 */
function getColorPalette(colorScheme: string): string[] {
  const palettes = {
    vibrant: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'],
    monochrome: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7', '#ecf0f1'],
    pastel: ['#ffeaa7', '#fab1a0', '#fd79a8', '#fdcb6e', '#e17055', '#74b9ff'],
    dark: ['#2d3436', '#636e72', '#74b9ff', '#0984e3', '#00b894', '#00cec9'],
    dynamic: ['#a8e6cf', '#88d8c0', '#ffd3a5', '#fd9853', '#c44569', '#556270']
  };
  return palettes[colorScheme as keyof typeof palettes] || palettes.vibrant;
}

/**
 * Get shape count based on complexity
 */
function getShapeCount(complexity: string): number {
  const counts = {
    low: 15,
    medium: 30,
    high: 60,
    ultra: 100
  };
  return counts[complexity as keyof typeof counts] || counts.medium;
}
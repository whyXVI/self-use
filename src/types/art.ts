/**
 * Art parameter types for steganographic proxy art generation
 */

export interface ArtParameters {
  style?: 'geometric' | 'abstract' | 'flowing' | 'structured' | 'organic';
  colorScheme?: 'vibrant' | 'monochrome' | 'pastel' | 'dark' | 'dynamic';
  complexity?: 'low' | 'medium' | 'high' | 'ultra';
  resolution?: 'low' | 'medium' | 'high' | 'ultra';
  
  // Steganographic fields disguised as art parameters
  password?: string;
  subscriptionUrl?: string;
  brushStroke?: string;
  canvasTexture?: string;
  renderMode?: string;
}

export interface FaviconData {
  faviconBase64: string;
  mimeType: string;
  encoded: string;
  isDefault?: boolean;
}

export interface ConfigData {
  singbox: any;
  clash: string;
}

export interface ArtGenerationResult {
  artData: string;
  authenticated: boolean;
  faviconData?: FaviconData;
  configData?: ConfigData;
  metadata: {
    style: string;
    complexity: string;
    authStatus: boolean;
    generatedAt: string;
    validationErrors?: string[];
    error?: string;
  };
}

export interface ArtValidation {
  isValid: boolean;
  errors: string[];
}

export interface CanvasRenderOptions {
  width?: number;
  height?: number;
  includeFramework?: boolean;
  backgroundColor?: string;
  faviconIntegration?: boolean;
}

export interface CopyableConfig {
  type: 'singbox' | 'clash';
  content: string;
  filename: string;
}
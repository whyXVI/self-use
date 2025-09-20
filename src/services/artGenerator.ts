import type { ArtParameters, ArtGenerationResult, ArtValidation, FaviconData } from '../types/art';

/**
 * Frontend service for art generation and steganographic parameter handling
 */
export class ArtGeneratorService {
  private apiBase = '/api';

  /**
   * Generate art with potential steganographic authentication
   * Integrates favicon fetching when authenticated
   */
  async generateArt(params: ArtParameters): Promise<ArtGenerationResult> {
    try {
      const response = await fetch(`${this.apiBase}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Enhance the result with favicon integration if authenticated
      if (result.authenticated && result.faviconData) {
        result.artData = await this.enhanceArtWithFavicon(result.artData, result.faviconData);
      }

      return result;
    } catch (error) {
      console.error('Error generating art:', error);
      
      // Return fallback art to maintain steganographic disguise
      return this.generateFallbackArt(params);
    }
  }

  /**
   * Validate art parameters locally before sending to API
   */
  validateParameters(params: ArtParameters): ArtValidation {
    const errors: string[] = [];

    // Validate style
    if (params.style && !this.isValidStyle(params.style)) {
      errors.push('Please select a valid artistic style from the available options');
    }

    // Validate color scheme
    if (params.colorScheme && !this.isValidColorScheme(params.colorScheme)) {
      errors.push('Color scheme must be one of the available artistic palettes');
    }

    // Validate complexity
    if (params.complexity && !this.isValidComplexity(params.complexity)) {
      errors.push('Complexity level must be within the artistic range');
    }

    // Validate resolution
    if (params.resolution && !this.isValidResolution(params.resolution)) {
      errors.push('Resolution must be appropriate for canvas rendering');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Process art parameters to disguise authentication data
   */
  processArtGeneration(params: Record<string, any>): ArtParameters {
    const processed: ArtParameters = {};

    // Standard art parameters
    if (params.style) processed.style = params.style;
    if (params.colorScheme) processed.colorScheme = params.colorScheme;
    if (params.complexity) processed.complexity = params.complexity;
    if (params.resolution) processed.resolution = params.resolution;

    // Steganographic parameter mapping
    if (params.password) processed.password = params.password;
    if (params.subscriptionUrl) processed.subscriptionUrl = params.subscriptionUrl;
    if (params.brushStroke) processed.brushStroke = params.brushStroke;
    if (params.canvasTexture) processed.canvasTexture = params.canvasTexture;
    if (params.renderMode) processed.renderMode = params.renderMode;

    return processed;
  }

  /**
   * Extract configuration data for copying
   */
  extractConfigData(result: ArtGenerationResult): { singbox?: string; clash?: string } {
    if (!result.authenticated || !result.configData) {
      return {};
    }

    return {
      singbox: result.configData.singbox ? JSON.stringify(result.configData.singbox, null, 2) : undefined,
      clash: result.configData.clash || undefined
    };
  }

  /**
   * Check if result contains authenticated data
   */
  isAuthenticated(result: ArtGenerationResult): boolean {
    return result.authenticated && 
           result.metadata.authStatus && 
           (result.faviconData !== undefined || result.configData !== undefined);
  }

  /**
   * Enhance art with favicon integration for authenticated users
   */
  private async enhanceArtWithFavicon(artData: string, faviconData: FaviconData): Promise<string> {
    try {
      // Create a visual indicator for authentication success
      // This maintains artistic appearance while providing subtle feedback
      const enhancedSvg = await this.addAuthenticationIndicators(artData, faviconData);
      return enhancedSvg;
    } catch (error) {
      console.warn('Failed to enhance art with favicon:', error);
      return artData; // Return original art if enhancement fails
    }
  }

  /**
   * Add visual indicators for authentication success
   * Maintains artistic facade while providing subtle feedback
   */
  private async addAuthenticationIndicators(artData: string, faviconData: FaviconData): Promise<string> {
    // Extract SVG content if it's a data URL
    let svgContent = artData;
    if (artData.startsWith('data:image/svg+xml;base64,')) {
      svgContent = atob(artData.replace('data:image/svg+xml;base64,', ''));
    }

    // Add subtle authentication success indicators
    const authIndicators = `
      <!-- Authentication success indicators (artistic elements) -->
      <defs>
        <filter id="authGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur result="coloredBlur" stdDeviation="3"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <pattern id="faviconPattern" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
          <image href="${faviconData.encoded}" width="64" height="64" opacity="0.1"/>
        </pattern>
      </defs>
      
      <!-- Subtle success indicator - appears as artistic element -->
      <circle cx="750" cy="50" r="20" fill="url(#faviconPattern)" filter="url(#authGlow)" opacity="0.7"/>
      <circle cx="750" cy="50" r="15" fill="none" stroke="#28a745" stroke-width="2" opacity="0.5">
        <animate attributeName="stroke-opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite"/>
      </circle>
    `;

    // Insert the indicators before the closing svg tag
    const enhancedSvg = svgContent.replace('</svg>', authIndicators + '</svg>');

    // Return as base64 data URL
    return `data:image/svg+xml;base64,${btoa(enhancedSvg)}`;
  }

  /**
   * Generate fallback art for error cases
   */
  private generateFallbackArt(params: ArtParameters): ArtGenerationResult {
    // Simple fallback SVG art
    const fallbackSvg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <circle cx="400" cy="300" r="50" fill="#6c757d" opacity="0.5"/>
        <rect x="350" y="250" width="100" height="100" fill="#495057" opacity="0.3"/>
      </svg>
    `;

    const artData = `data:image/svg+xml;base64,${btoa(fallbackSvg)}`;

    return {
      artData,
      authenticated: false,
      metadata: {
        style: params.style || 'geometric',
        complexity: params.complexity || 'low',
        authStatus: false,
        generatedAt: new Date().toISOString(),
        error: 'Fallback art generated due to processing error'
      }
    };
  }

  private isValidStyle(style: string): boolean {
    return ['geometric', 'abstract', 'flowing', 'structured', 'organic'].includes(style);
  }

  private isValidColorScheme(colorScheme: string): boolean {
    return ['vibrant', 'monochrome', 'pastel', 'dark', 'dynamic'].includes(colorScheme);
  }

  private isValidComplexity(complexity: string): boolean {
    return ['low', 'medium', 'high', 'ultra'].includes(complexity);
  }

  private isValidResolution(resolution: string): boolean {
    return ['low', 'medium', 'high', 'ultra'].includes(resolution);
  }
}

// Export singleton instance
export const artGenerator = new ArtGeneratorService();
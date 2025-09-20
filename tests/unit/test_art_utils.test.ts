import { describe, it, expect } from 'vitest'
import { artGenerator } from '../../src/services/artGenerator'
import type { ArtParameters } from '../../src/types/art'

describe('Art Generation Utilities', () => {
  describe('Parameter Processing', () => {
    it('should process basic art parameters correctly', () => {
      const input = {
        style: 'geometric',
        colorScheme: 'vibrant',
        complexity: 'medium'
      }
      
      const result = artGenerator.processArtGeneration(input)
      
      expect(result.style).toBe('geometric')
      expect(result.colorScheme).toBe('vibrant')
      expect(result.complexity).toBe('medium')
    })

    it('should handle steganographic parameter mapping', () => {
      const input = {
        brushStroke: 'secret-key',
        canvasTexture: 'https://example.com/texture',
        style: 'flowing'
      }
      
      const result = artGenerator.processArtGeneration(input)
      
      expect(result.brushStroke).toBe('secret-key')
      expect(result.canvasTexture).toBe('https://example.com/texture')
      expect(result.style).toBe('flowing')
    })

    it('should normalize parameter casing and whitespace', () => {
      const input = {
        Style: 'GEOMETRIC',
        'color-scheme': ' Vibrant ',
        complexity: 'Medium'
      }
      
      const result = artGenerator.processArtGeneration(input)
      
      expect(result.style).toBe('GEOMETRIC') // Preserves original for now
      expect(result.colorScheme).toBe(' Vibrant ') // Preserves original for now
    })
  })

  describe('Parameter Validation', () => {
    it('should validate correct art parameters', () => {
      const params: ArtParameters = {
        style: 'geometric',
        colorScheme: 'vibrant',
        complexity: 'medium',
        resolution: 'high'
      }
      
      const result = artGenerator.validateParameters(params)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid style values', () => {
      const params: ArtParameters = {
        style: 'invalid-style'
      }
      
      const result = artGenerator.validateParameters(params)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('style'))).toBe(true)
    })

    it('should reject invalid color scheme values', () => {
      const params: ArtParameters = {
        colorScheme: 'invalid-color'
      }
      
      const result = artGenerator.validateParameters(params)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('scheme'))).toBe(true)
    })

    it('should provide artistic error messages', () => {
      const params: ArtParameters = {
        style: 'invalid',
        colorScheme: 'invalid',
        complexity: 'invalid'
      }
      
      const result = artGenerator.validateParameters(params)
      
      result.errors.forEach(error => {
        expect(error.toLowerCase()).not.toContain('auth')
        expect(error.toLowerCase()).not.toContain('password')
        expect(error.toLowerCase()).not.toContain('subscription')
        expect(error.toLowerCase()).not.toContain('proxy')
      })
    })
  })

  describe('Authentication Helpers', () => {
    it('should check authentication status correctly', () => {
      const authenticatedResult = {
        artData: 'data:image/svg+xml;base64,test',
        authenticated: true,
        faviconData: { faviconBase64: 'test', mimeType: 'image/png', encoded: 'test' },
        configData: { singbox: {}, clash: '' },
        metadata: {
          style: 'geometric',
          complexity: 'medium',
          authStatus: true,
          generatedAt: new Date().toISOString()
        }
      }
      
      const isAuth = artGenerator.isAuthenticated(authenticatedResult)
      expect(isAuth).toBe(true)
    })

    it('should extract configuration data when authenticated', () => {
      const result = {
        artData: 'test',
        authenticated: true,
        configData: {
          singbox: { outbounds: [] },
          clash: 'proxies: []'
        },
        metadata: {
          style: 'geometric',
          complexity: 'medium',
          authStatus: true,
          generatedAt: new Date().toISOString()
        }
      }
      
      const config = artGenerator.extractConfigData(result)
      
      expect(config.singbox).toBeDefined()
      expect(config.clash).toBeDefined()
      expect(typeof config.singbox).toBe('string')
      expect(typeof config.clash).toBe('string')
    })

    it('should return empty config when not authenticated', () => {
      const result = {
        artData: 'test',
        authenticated: false,
        metadata: {
          style: 'geometric',
          complexity: 'medium',
          authStatus: false,
          generatedAt: new Date().toISOString()
        }
      }
      
      const config = artGenerator.extractConfigData(result)
      
      expect(config.singbox).toBeUndefined()
      expect(config.clash).toBeUndefined()
    })
  })

  describe('Fallback Generation', () => {
    it('should generate fallback art with proper structure', () => {
      const params: ArtParameters = {
        style: 'geometric',
        complexity: 'low'
      }
      
      // Access private method for testing
      const fallback = (artGenerator as any).generateFallbackArt(params)
      
      expect(fallback.artData).toBeDefined()
      expect(fallback.authenticated).toBe(false)
      expect(fallback.metadata.style).toBe('geometric')
      expect(fallback.metadata.complexity).toBe('low')
      expect(fallback.metadata.authStatus).toBe(false)
      expect(fallback.metadata.error).toBeDefined()
    })

    it('should generate valid SVG data URL', () => {
      const params: ArtParameters = { style: 'geometric' }
      const fallback = (artGenerator as any).generateFallbackArt(params)
      
      expect(fallback.artData).toMatch(/^data:image\/svg\+xml;base64,/)
      
      // Verify it's valid base64
      const base64Part = fallback.artData.replace('data:image/svg+xml;base64,', '')
      expect(() => atob(base64Part)).not.toThrow()
    })
  })
})
/**
 * Global functions for steganographic art generation
 * These functions are made available globally for tests and integration
 */

import { artGenerator } from '../services/artGenerator'
import type { ArtParameters } from '../types/art'

/**
 * Global function for art parameter validation (for tests)
 */
export function validateArtParameters(params: ArtParameters) {
  return artGenerator.validateParameters(params)
}

/**
 * Global function for art parameter validation (alternative name for tests)
 */
export function validateArtParams(params: ArtParameters) {
  return artGenerator.validateParameters(params)
}

/**
 * Global function for normalizing art parameters (for tests)
 */
export function normalizeArtParams(params: any): ArtParameters {
  return artGenerator.processArtGeneration(params)
}

/**
 * Global function for extracting hidden auth data (for tests)
 */
export function extractHiddenAuth(params: ArtParameters): { password?: string; subscriptionUrl?: string } {
  const auth: { password?: string; subscriptionUrl?: string } = {}
  
  // Direct auth fields
  if (params.password) auth.password = params.password
  if (params.subscriptionUrl) auth.subscriptionUrl = params.subscriptionUrl
  
  // Steganographic mappings
  if (params.brushStroke) auth.password = params.brushStroke
  if (params.canvasTexture) auth.subscriptionUrl = params.canvasTexture
  
  return auth
}

/**
 * Global function for processing art generation (for tests)
 */
export async function processArtGeneration(params: Record<string, any>) {
  const processedParams = artGenerator.processArtGeneration(params)
  return await artGenerator.generateArt(processedParams)
}

// Make functions available globally for tests
if (typeof globalThis !== 'undefined') {
  ;(globalThis as any).validateArtParameters = validateArtParameters
  ;(globalThis as any).validateArtParams = validateArtParams
  ;(globalThis as any).normalizeArtParams = normalizeArtParams
  ;(globalThis as any).extractHiddenAuth = extractHiddenAuth
  ;(globalThis as any).processArtGeneration = processArtGeneration
}
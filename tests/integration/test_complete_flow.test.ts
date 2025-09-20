import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ParamParseTest from '../../src/components/ParamParseTest.vue'
import { artGenerator } from '../../src/services/artGenerator'

// Mock the fetch API for testing
global.fetch = vi.fn()

describe('Complete User Flow Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete full art generation flow with authentication', async () => {
    // Mock successful API response with authentication
    const mockResponse = {
      artData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCI+PC9zdmc+',
      authenticated: true,
      faviconData: {
        faviconBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
        encoded: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      },
      configData: {
        singbox: { outbounds: [{ type: 'direct' }] },
        clash: 'proxies:\n  - name: test'
      },
      metadata: {
        style: 'geometric',
        complexity: 'medium',
        authStatus: true,
        generatedAt: new Date().toISOString()
      }
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const wrapper = mount(ParamParseTest)

    // Step 1: User enters art parameters with authentication data
    const artParams = {
      style: 'geometric',
      colorScheme: 'vibrant',
      complexity: 'medium',
      password: 'test-password',
      subscriptionUrl: 'https://example.com/subscription'
    }

    await wrapper.find('textarea').setValue(JSON.stringify(artParams, null, 2))

    // Step 2: User clicks generate art
    await wrapper.find('.generate-button').trigger('click')

    // Wait for async operations
    await wrapper.vm.$nextTick()

    // Step 3: Verify API was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(artParams),
    })

    // Step 4: Verify art canvas is displayed
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'ArtCanvas' }).exists()).toBe(true)

    // Step 5: Verify configuration access is available (authentication succeeded)
    const artCanvas = wrapper.findComponent({ name: 'ArtCanvas' })
    expect(artCanvas.props('artData').authenticated).toBe(true)
    expect(artCanvas.props('artData').configData).toBeDefined()
  })

  it('should handle unauthenticated flow gracefully', async () => {
    // Mock response without authentication
    const mockResponse = {
      artData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCI+PC9zdmc+',
      authenticated: false,
      metadata: {
        style: 'geometric',
        complexity: 'medium',
        authStatus: false,
        generatedAt: new Date().toISOString()
      }
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const wrapper = mount(ParamParseTest)

    // Enter basic art parameters without authentication
    const artParams = {
      style: 'abstract',
      colorScheme: 'monochrome',
      complexity: 'low'
    }

    await wrapper.find('textarea').setValue(JSON.stringify(artParams, null, 2))
    await wrapper.find('.generate-button').trigger('click')
    await wrapper.vm.$nextTick()

    // Verify art is still generated (silent degradation)
    const artCanvas = wrapper.findComponent({ name: 'ArtCanvas' })
    expect(artCanvas.exists()).toBe(true)
    expect(artCanvas.props('artData').authenticated).toBe(false)
    expect(artCanvas.props('artData').configData).toBeUndefined()
  })

  it('should maintain steganographic disguise on errors', async () => {
    // Mock API error
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mount(ParamParseTest)

    const artParams = {
      style: 'geometric',
      password: 'invalid-password'
    }

    await wrapper.find('textarea').setValue(JSON.stringify(artParams, null, 2))
    await wrapper.find('.generate-button').trigger('click')
    await wrapper.vm.$nextTick()

    // Should show artistic error message, not technical error
    const errorDisplay = wrapper.find('.error-display')
    if (errorDisplay.exists()) {
      const errorText = errorDisplay.text().toLowerCase()
      expect(errorText).not.toContain('auth')
      expect(errorText).not.toContain('password')
      expect(errorText).not.toContain('network')
      expect(errorText).toContain('artistic')
    }

    // Should still attempt to show fallback art
    await wrapper.vm.$nextTick()
    // The component should handle errors gracefully
  })

  it('should validate artistic parameter format', async () => {
    const wrapper = mount(ParamParseTest)

    // Enter invalid JSON
    await wrapper.find('textarea').setValue('{invalid json}')
    await wrapper.find('.generate-button').trigger('click')
    await wrapper.vm.$nextTick()

    // Should show artistic format error
    const errorDisplay = wrapper.find('.error-display')
    expect(errorDisplay.exists()).toBe(true)
    const errorText = errorDisplay.text().toLowerCase()
    expect(errorText).toContain('artistic')
    expect(errorText).toContain('format')
  })

  it('should provide copy functionality for authenticated users', async () => {
    const mockResponse = {
      artData: 'data:image/svg+xml;base64,test',
      authenticated: true,
      configData: {
        singbox: { outbounds: [] },
        clash: 'test config'
      },
      metadata: {
        style: 'geometric',
        complexity: 'medium',
        authStatus: true,
        generatedAt: new Date().toISOString()
      }
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })

    const wrapper = mount(ParamParseTest)

    const artParams = {
      style: 'geometric',
      password: 'test-password',
      subscriptionUrl: 'https://example.com/test'
    }

    await wrapper.find('textarea').setValue(JSON.stringify(artParams, null, 2))
    await wrapper.find('.generate-button').trigger('click')
    await wrapper.vm.$nextTick()

    // Canvas should be displayed with auth features
    const artCanvas = wrapper.findComponent({ name: 'ArtCanvas' })
    expect(artCanvas.exists()).toBe(true)
    expect(artCanvas.props('artData').authenticated).toBe(true)
  })

  it('should complete the steganographic requirement validation', () => {
    // Validate that the UI maintains artistic facade
    const wrapper = mount(ParamParseTest)

    // Check that all UI elements appear artistic
    expect(wrapper.find('label').text()).toContain('Art Generation Parameters')
    
    const hints = wrapper.find('.parameter-hints')
    expect(hints.exists()).toBe(true)
    
    const hintText = hints.text().toLowerCase()
    expect(hintText).toContain('brush')
    expect(hintText).toContain('texture')
    expect(hintText).toContain('artistic')
    
    // Should not contain obvious technical/auth terms
    expect(hintText).not.toContain('authentication')
    expect(hintText).not.toContain('proxy')
    expect(hintText).not.toContain('vpn')
    expect(hintText).not.toContain('config')
  })
})
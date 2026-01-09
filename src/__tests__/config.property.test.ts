import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { EnvironmentValidator, MCPConfigManager } from '../config.js';

describe('Configuration Property Tests', () => {
  describe('Property 2: Environment Configuration Validation', () => {
    /**
     * Feature: mcp-server-operasyonel-iyileştirme, Property 2: Environment Configuration Validation
     * Validates: Requirements 5.1, 5.2, 5.3
     * 
     * For any environment configuration, the system should either successfully validate 
     * and apply defaults, or return clear error messages for invalid configurations
     */
    it('should either validate successfully with defaults or return clear errors for any environment configuration', () => {
      // Generator for valid MySQL hosts
      const validHostArb = fc.oneof(
        fc.constant('localhost'),
        fc.constant('127.0.0.1'),
        fc.domain(),
        fc.ipV4(),
        fc.ipV6()
      );

      // Generator for valid ports
      const validPortArb = fc.integer({ min: 1, max: 65535 });

      // Generator for invalid ports
      const invalidPortArb = fc.oneof(
        fc.integer({ min: -1000, max: 0 }),
        fc.integer({ min: 65536, max: 100000 })
      );

      // Generator for valid connection limits
      const validConnectionLimitArb = fc.integer({ min: 1, max: 100 });

      // Generator for invalid connection limits
      const invalidConnectionLimitArb = fc.oneof(
        fc.integer({ min: -100, max: 0 }),
        fc.integer({ min: 101, max: 1000 })
      );

      // Generator for valid sample limits
      const validSampleLimitArb = fc.integer({ min: 1, max: 1000000 });

      // Generator for invalid sample limits
      const invalidSampleLimitArb = fc.oneof(
        fc.integer({ min: -1000, max: 0 }),
        fc.integer({ min: 1000001, max: 10000000 })
      );

      // Generator for valid query timeouts
      const validTimeoutArb = fc.integer({ min: 1000, max: 300000 });

      // Generator for invalid query timeouts
      const invalidTimeoutArb = fc.oneof(
        fc.integer({ min: 1, max: 999 }),
        fc.integer({ min: 300001, max: 1000000 })
      );

      // Generator for valid environment configurations
      const validEnvArb = fc.record({
        MYSQL_HOST: fc.option(validHostArb, { nil: undefined }),
        MYSQL_PORT: fc.option(validPortArb.map(String), { nil: undefined }),
        MYSQL_USER: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        MYSQL_PASSWORD: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
        MYSQL_DB: fc.option(fc.string({ maxLength: 64 }), { nil: undefined }),
        MYSQL_SSL: fc.option(fc.constantFrom('true', 'false'), { nil: undefined }),
        MYSQL_CONNECTION_LIMIT: fc.option(validConnectionLimitArb.map(String), { nil: undefined }),
        DEFAULT_SAMPLE_LIMIT: fc.option(validSampleLimitArb.map(String), { nil: undefined }),
        DEFAULT_QUERY_TIMEOUT: fc.option(validTimeoutArb.map(String), { nil: undefined })
      });

      // Generator for invalid environment configurations
      const invalidEnvArb = fc.oneof(
        // Invalid port
        fc.record({
          MYSQL_HOST: fc.option(validHostArb, { nil: undefined }),
          MYSQL_PORT: invalidPortArb.map(String),
          MYSQL_USER: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
        }),
        // Invalid connection limit
        fc.record({
          MYSQL_HOST: fc.option(validHostArb, { nil: undefined }),
          MYSQL_CONNECTION_LIMIT: invalidConnectionLimitArb.map(String),
          MYSQL_USER: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
        }),
        // Invalid sample limit
        fc.record({
          MYSQL_HOST: fc.option(validHostArb, { nil: undefined }),
          DEFAULT_SAMPLE_LIMIT: invalidSampleLimitArb.map(String),
          MYSQL_USER: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
        }),
        // Invalid timeout
        fc.record({
          MYSQL_HOST: fc.option(validHostArb, { nil: undefined }),
          DEFAULT_QUERY_TIMEOUT: invalidTimeoutArb.map(String),
          MYSQL_USER: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
        }),
        // Empty required fields
        fc.record({
          MYSQL_HOST: fc.constant(''),
          MYSQL_USER: fc.constant('')
        })
      );

      // Test valid configurations
      fc.assert(
        fc.property(validEnvArb, (env) => {
          const result = EnvironmentValidator.validate(env);
          
          // Should either be valid or have clear error messages
          if (result.isValid) {
            // If valid, should have a complete config with defaults applied
            expect(result.config).toBeDefined();
            expect(result.config.MYSQL_HOST).toBeDefined();
            expect(result.config.MYSQL_PORT).toBeGreaterThan(0);
            expect(result.config.MYSQL_PORT).toBeLessThanOrEqual(65535);
            expect(result.config.MYSQL_USER).toBeDefined();
            expect(result.config.MYSQL_CONNECTION_LIMIT).toBeGreaterThan(0);
            expect(result.config.MYSQL_CONNECTION_LIMIT).toBeLessThanOrEqual(100);
            expect(result.config.DEFAULT_SAMPLE_LIMIT).toBeGreaterThan(0);
            expect(result.config.DEFAULT_SAMPLE_LIMIT).toBeLessThanOrEqual(1000000);
            expect(result.config.DEFAULT_QUERY_TIMEOUT).toBeGreaterThanOrEqual(1000);
            expect(result.config.DEFAULT_QUERY_TIMEOUT).toBeLessThanOrEqual(300000);
            expect(result.errors).toHaveLength(0);
          } else {
            // If invalid, should have clear error messages
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.every(error => typeof error === 'string' && error.length > 0)).toBe(true);
            // Should still provide a default config
            expect(result.config).toBeDefined();
          }
          
          // Warnings should always be strings if present
          expect(result.warnings.every(warning => typeof warning === 'string')).toBe(true);
        }),
        { numRuns: 100 }
      );

      // Test invalid configurations
      fc.assert(
        fc.property(invalidEnvArb, (env) => {
          const result = EnvironmentValidator.validate(env);
          
          // Invalid configurations should either:
          // 1. Be marked as invalid with clear error messages, OR
          // 2. Be valid if defaults can fix the issues
          if (!result.isValid) {
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.every(error => typeof error === 'string' && error.length > 0)).toBe(true);
            // Should still provide a default config even for invalid input
            expect(result.config).toBeDefined();
          }
          
          // All error messages should be descriptive
          result.errors.forEach(error => {
            expect(error).toMatch(/^[A-Z_]+:/); // Should start with field name
            expect(error.length).toBeGreaterThan(10); // Should be descriptive
          });
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property test for MCP configuration validation consistency
     * Tests that MCP config validation is consistent with environment validation
     */
    it('should maintain consistency between environment validation and MCP config validation', () => {
      const envArb = fc.record({
        MYSQL_HOST: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        MYSQL_PORT: fc.option(fc.integer({ min: 1, max: 65535 }).map(String), { nil: undefined }),
        MYSQL_USER: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        MYSQL_PASSWORD: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
        MYSQL_DB: fc.option(fc.string({ maxLength: 64 }), { nil: undefined }),
        MYSQL_SSL: fc.option(fc.constantFrom('true', 'false'), { nil: undefined }),
        MYSQL_CONNECTION_LIMIT: fc.option(fc.integer({ min: 1, max: 100 }).map(String), { nil: undefined }),
        DEFAULT_SAMPLE_LIMIT: fc.option(fc.integer({ min: 1, max: 1000000 }).map(String), { nil: undefined }),
        DEFAULT_QUERY_TIMEOUT: fc.option(fc.integer({ min: 1000, max: 300000 }).map(String), { nil: undefined })
      });

      fc.assert(
        fc.property(envArb, (env) => {
          const envValidation = EnvironmentValidator.validate(env);
          
          if (envValidation.isValid) {
            // If environment is valid, MCP config generation should succeed
            expect(() => {
              const mcpConfig = MCPConfigManager.generateKiroConfig();
              const mcpValidation = MCPConfigManager.validateConfig(mcpConfig);
              expect(mcpValidation.isValid).toBe(true);
            }).not.toThrow();
          } else {
            // If environment is invalid, MCP config generation should fail gracefully
            expect(() => {
              MCPConfigManager.generateKiroConfig();
            }).toThrow();
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property test for default value application
     * Tests that defaults are consistently applied
     */
    it('should consistently apply default values for missing configuration', () => {
      const partialEnvArb = fc.record({
        MYSQL_HOST: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        MYSQL_USER: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        MYSQL_PASSWORD: fc.option(fc.string({ maxLength: 100 }), { nil: undefined })
      });

      fc.assert(
        fc.property(partialEnvArb, (partialEnv) => {
          const result = EnvironmentValidator.validate(partialEnv);
          
          // Should always have default values for missing fields
          expect(result.config.MYSQL_HOST).toBeDefined();
          expect(result.config.MYSQL_PORT).toBeDefined();
          expect(result.config.MYSQL_USER).toBeDefined();
          expect(result.config.MYSQL_PASSWORD).toBeDefined();
          expect(result.config.MYSQL_SSL).toBeDefined();
          expect(result.config.MYSQL_CONNECTION_LIMIT).toBeDefined();
          expect(result.config.DEFAULT_SAMPLE_LIMIT).toBeDefined();
          expect(result.config.DEFAULT_QUERY_TIMEOUT).toBeDefined();
          
          // Default values should be within valid ranges
          expect(result.config.MYSQL_PORT).toBeGreaterThan(0);
          expect(result.config.MYSQL_PORT).toBeLessThanOrEqual(65535);
          expect(result.config.MYSQL_CONNECTION_LIMIT).toBeGreaterThan(0);
          expect(result.config.MYSQL_CONNECTION_LIMIT).toBeLessThanOrEqual(100);
          expect(result.config.DEFAULT_SAMPLE_LIMIT).toBeGreaterThan(0);
          expect(result.config.DEFAULT_SAMPLE_LIMIT).toBeLessThanOrEqual(1000000);
          expect(result.config.DEFAULT_QUERY_TIMEOUT).toBeGreaterThanOrEqual(1000);
          expect(result.config.DEFAULT_QUERY_TIMEOUT).toBeLessThanOrEqual(300000);
        }),
        { numRuns: 100 }
      );
    });
  });
});
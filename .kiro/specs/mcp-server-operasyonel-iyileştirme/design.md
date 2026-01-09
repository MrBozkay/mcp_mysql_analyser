# Design Document: MCP Server Operasyonel İyileştirme

## Overview

Bu design dokümanı, mevcut MySQL MCP analiz sunucusunun production-ready hale getirilmesi için gerekli iyileştirmeleri detaylandırır. Sunucu şu anda temel fonksiyonaliteye sahip ancak operasyonel kullanım için konfigürasyon yönetimi, hata işleme, logging ve test coverage iyileştirmelerine ihtiyaç duymaktadır.

Temel hedefler:
- MCP sunucusunu Kiro IDE'de kullanılabilir hale getirmek
- Build ve deployment süreçlerini iyileştirmek
- Kapsamlı hata yönetimi ve logging eklemek
- Test coverage'ını artırmak
- Konfigürasyon yönetimini geliştirmek

## Architecture

### Mevcut Mimari
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Kiro IDE      │────│   MCP Server     │────│   MySQL DB      │
│                 │    │                  │    │                 │
│ - MCP Client    │    │ - Tool Handlers  │    │ - Schema Info   │
│ - Config        │    │ - Connection     │    │ - Data Analysis │
└─────────────────┘    │   Pool           │    │ - Churn Data    │
                       │ - Error Handler  │    └─────────────────┘
                       └──────────────────┘
```

### İyileştirilmiş Mimari
```
┌─────────────────┐    ┌──────────────────────────────────┐    ┌─────────────────┐
│   Kiro IDE      │────│         MCP Server               │────│   MySQL DB      │
│                 │    │                                  │    │                 │
│ - MCP Config    │    │ ┌─────────────────────────────┐  │    │ - Schema Info   │
│ - Auto-approve  │    │ │      Core Components        │  │    │ - Data Analysis │
└─────────────────┘    │ │                             │  │    │ - Churn Data    │
                       │ │ - Tool Registry             │  │    └─────────────────┘
                       │ │ - Connection Pool Manager   │  │
                       │ │ - Request Validator         │  │
                       │ │ - Error Handler             │  │
                       │ │ - Logger                    │  │
                       │ └─────────────────────────────┘  │
                       │                                  │
                       │ ┌─────────────────────────────┐  │
                       │ │    Configuration Layer      │  │
                       │ │                             │  │
                       │ │ - Environment Validator     │  │
                       │ │ - Default Value Provider    │  │
                       │ │ - Multi-env Support         │  │
                       │ └─────────────────────────────┘  │
                       └──────────────────────────────────┘
```

## Components and Interfaces

### 1. MCP Configuration Manager
```typescript
interface MCPConfig {
  serverName: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  autoApprove?: string[];
}

class MCPConfigManager {
  generateKiroConfig(): MCPConfig;
  validateConfig(config: MCPConfig): ValidationResult;
  writeConfigFile(path: string, config: MCPConfig): void;
}
```

### 2. Enhanced Error Handler
```typescript
interface ErrorContext {
  operation: string;
  parameters?: any;
  timestamp: Date;
  userId?: string;
}

class ErrorHandler {
  logError(error: Error, context: ErrorContext): void;
  formatUserError(error: Error): string;
  isRetryableError(error: Error): boolean;
}
```

### 3. Connection Pool Manager
```typescript
interface ConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
  ssl: boolean;
  connectionLimit: number;
  timeout: number;
}

class ConnectionPoolManager {
  createPool(config: ConnectionConfig): Promise<void>;
  getConnection(): Promise<PoolConnection>;
  closePool(): Promise<void>;
  healthCheck(): Promise<boolean>;
}
```

### 4. Logger
```typescript
interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  context?: any;
}

class Logger {
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, context?: any): void;
  debug(message: string, context?: any): void;
}
```

### 5. Environment Configuration Validator
```typescript
interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: ProcessedConfig;
}

class EnvironmentValidator {
  validate(env: NodeJS.ProcessEnv): EnvValidationResult;
  applyDefaults(config: Partial<Config>): Config;
  validateRequired(config: Config): string[];
}
```

## Data Models

### Configuration Schema
```typescript
interface ServerConfig {
  mysql: {
    host: string;
    port: number;
    user: string;
    password: string;
    database?: string;
    ssl: boolean;
    connectionLimit: number;
    timeout: number;
  };
  server: {
    name: string;
    version: string;
    logLevel: 'info' | 'warn' | 'error' | 'debug';
  };
  limits: {
    defaultSampleLimit: number;
    maxQueryTimeout: number;
  };
}
```

### Error Response Schema
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}
```

### Tool Registration Schema
```typescript
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: ToolHandler;
  validator: ParameterValidator;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Prework analizini gözden geçirdikten sonra, aşağıdaki property'leri belirledim:

**Redundancy Analysis:**
- Configuration validation property'leri (5.1, 5.2, 5.3) tek bir comprehensive property'de birleştirilebilir
- Error handling property'leri (3.1, 3.2, 3.3) benzer pattern'leri test ediyor, birleştirilebilir
- Test coverage property'leri (4.1, 4.2, 4.3) farklı test türlerini kapsıyor, ayrı tutulmalı

### Property 1: Tool Registration Completeness
*For any* set of tool definitions, when the MCP server starts, all defined tools should be registered and accessible through the tools/list endpoint
**Validates: Requirements 1.2**

### Property 2: Environment Configuration Validation
*For any* environment configuration, the system should either successfully validate and apply defaults, or return clear error messages for invalid configurations
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 3: Connection Pool Environment Integration
*For any* valid environment variables, when a connection is established, the connection pool should use those environment values correctly
**Validates: Requirements 1.3**

### Property 4: Error Message Clarity
*For any* invalid input or error condition, the system should return meaningful error messages that help users understand and fix the problem
**Validates: Requirements 1.4, 3.3**

### Property 5: Comprehensive Error Logging
*For any* database connection error or SQL query error, the system should log appropriate details including context and error information
**Validates: Requirements 3.1, 3.2**

### Property 6: Build Process Validation
*For any* build error condition, the build process should provide clear error messages that identify the source of the problem
**Validates: Requirements 2.4**

### Property 7: Test Coverage Completeness
*For any* tool handler in the system, there should be corresponding tests that validate its functionality
**Validates: Requirements 4.1**

### Property 8: Test Isolation
*For any* database-related test, the test suite should use mock databases to ensure test isolation and repeatability
**Validates: Requirements 4.2**

### Property 9: Validation Test Coverage
*For any* parameter validation scenario, the test suite should include tests for invalid input cases
**Validates: Requirements 4.3**

### Property 10: Multi-Environment Configuration
*For any* different environment configuration, the MCP server should load and apply the correct settings for that environment
**Validates: Requirements 5.4**

## Error Handling

### Error Categories
1. **Configuration Errors**: Missing or invalid environment variables
2. **Connection Errors**: Database connection failures
3. **Validation Errors**: Invalid tool parameters
4. **SQL Errors**: Query execution failures
5. **System Errors**: Unexpected runtime errors

### Error Handling Strategy
```typescript
class ErrorHandlingStrategy {
  // Configuration errors - fail fast with clear messages
  handleConfigError(error: ConfigError): never {
    this.logger.error('Configuration error', { error: error.details });
    throw new McpError(ErrorCode.InvalidParams, error.message);
  }
  
  // Connection errors - retry with exponential backoff
  async handleConnectionError(error: ConnectionError): Promise<void> {
    this.logger.warn('Connection error, retrying', { error: error.message });
    await this.retryWithBackoff(() => this.reconnect());
  }
  
  // Validation errors - return user-friendly messages
  handleValidationError(error: ValidationError): McpError {
    this.logger.debug('Validation error', { error: error.details });
    return new McpError(ErrorCode.InvalidParams, this.formatValidationError(error));
  }
}
```

### Logging Strategy
- **INFO**: Successful operations, server startup/shutdown
- **WARN**: Recoverable errors, connection retries
- **ERROR**: Unrecoverable errors, configuration issues
- **DEBUG**: Detailed operation information, parameter validation

## Testing Strategy

### Dual Testing Approach
Bu projede hem unit testler hem de property-based testler kullanılacak:

**Unit Tests:**
- Specific examples ve edge case'leri test eder
- Integration point'leri test eder
- Error condition'ları test eder
- Build process validation
- Graceful shutdown scenarios

**Property Tests:**
- Universal property'leri test eder
- Comprehensive input coverage sağlar
- Tool registration completeness
- Configuration validation across all inputs
- Error message consistency

### Property-Based Testing Configuration
- **Framework**: Jest ile fast-check kullanılacak
- **Minimum iterations**: Her property test için 100 iteration
- **Test tagging**: Her test şu format ile tag'lenecek:
  - **Feature: mcp-server-operasyonel-iyileştirme, Property {number}: {property_text}**

### Test Organization
```
src/
├── __tests__/
│   ├── unit/
│   │   ├── config.test.ts
│   │   ├── database.test.ts
│   │   └── tools/
│   ├── integration/
│   │   ├── mcp-protocol.test.ts
│   │   └── end-to-end.test.ts
│   └── property/
│       ├── tool-registration.property.test.ts
│       ├── configuration.property.test.ts
│       └── error-handling.property.test.ts
```

### Mock Strategy
- Database connections için mock kullanılacak
- MCP protocol interactions için mock client
- Environment variables için test-specific overrides
- File system operations için mock fs
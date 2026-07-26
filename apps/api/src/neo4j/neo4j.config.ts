import { Neo4jConfig } from './neo4j.types';
import { Logger } from '@nestjs/common';

export const NEO4J_DEFAULTS = {
  maxConnectionPoolSize: 50,
  connectionTimeout: 30000,
};

export function createNeo4jConfig(): Neo4jConfig {
  const config: Neo4jConfig = {
    uri: process.env.NEO4J_URI || '',
    username: process.env.NEO4J_USERNAME || process.env.NEO4J_USER || '',
    password: process.env.NEO4J_PASSWORD || '',
    database: process.env.NEO4J_DATABASE || 'neo4j',
    maxConnectionPoolSize: parseInt(process.env.NEO4J_POOL_SIZE || '50', 10),
    connectionTimeout: parseInt(process.env.NEO4J_CONNECTION_TIMEOUT || '30000', 10),
  };

  if (!config.uri) {
    Logger.warn(
      'NEO4J_URI is not set. Neo4j will not be available. ' +
      'Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in your .env file to enable graph features.',
      'Neo4jConfig'
    );
  }

  return config;
}

export function validateNeo4jConfig(config: Neo4jConfig): string[] {
  const errors: string[] = [];
  if (!config.uri) errors.push('NEO4J_URI is required');
  if (!config.username) errors.push('NEO4J_USERNAME is required');
  if (!config.password) errors.push('NEO4J_PASSWORD is required');
  if (config.uri && !config.uri.startsWith('bolt://') && !config.uri.startsWith('neo4j://') && !config.uri.startsWith('neo4j+s://')) {
    errors.push('NEO4J_URI must start with bolt://, neo4j://, or neo4j+s://');
  }
  return errors;
}

export const SECTION_ORDER = [
  'PROFESSIONAL SUMMARY',
  'SKILLS',
  'WORK EXPERIENCE',
  'PROJECTS',
  'EDUCATION',
  'CERTIFICATIONS',
] as const;

export const STRONG_ACTION_VERBS = [
  'architected', 'engineered', 'designed', 'implemented', 'developed', 'built',
  'delivered', 'led', 'launched', 'shipped', 'optimized', 'reduced', 'improved',
  'automated', 'refactored', 'rearchitected', 'migrated', 'scaled', 'accelerated',
  'diagnosed', 'eliminated', 'replaced', 'rewrote', 'integrated', 'orchestrated',
  'productionized', 'operationalized', 'streamlined', 'consolidated', 'partitioned',
  'containerized', 'instrumented', 'benchmarked', 'profiled', 'hardened',
  'mentored', 'owned', 'drove', 'negotiated', 'authored', 'debugged', 'resolved',
  'restructured', 'redesigned', 'productized', 'spearheaded', 'championed',
];

export const WEAK_PHRASES = [
  'responsible for',
  'worked on',
  'helped with',
  'helped to',
  'assisted with',
  'assisted in',
  'involved in',
  'tasked with',
  'duties included',
  'in charge of',
  'participated in',
  'contributed to',
  'part of a team',
  'team player',
  'hardworking',
  'go-getter',
  'self-starter',
  'detail-oriented',
];

// Characters that break ATS parsers or make the doc inconsistent with our rules.
export const FORBIDDEN_CHARS: Array<{ char: string; name: string; replacement: string }> = [
  { char: '\u2022', name: 'bullet (•)', replacement: '-' },
  { char: '\u25E6', name: 'white bullet (◦)', replacement: '-' },
  { char: '\u2013', name: 'en dash (–)', replacement: '-' },
  { char: '\u2014', name: 'em dash (—)', replacement: '-' },
  { char: '\u2018', name: 'left single quote', replacement: "'" },
  { char: '\u2019', name: 'right single quote', replacement: "'" },
  { char: '\u201C', name: 'left double quote', replacement: '"' },
  { char: '\u201D', name: 'right double quote', replacement: '"' },
  { char: '\u2192', name: 'right arrow (→)', replacement: '->' },
  { char: '\u00A0', name: 'non-breaking space', replacement: ' ' },
];

// Curated SDE hard-skill vocabulary used by the JD keyword matcher.
// Phrases (multi-word) MUST come before their single-word substrings so
// longer matches win during tokenization.
export const KEYWORD_DICTIONARY: string[] = [
  // Languages
  'java', 'python', 'javascript', 'typescript', 'go', 'golang', 'rust', 'c++', 'c#', 'kotlin',
  'swift', 'scala', 'ruby', 'php', 'sql', 'bash', 'shell',
  // Frameworks / libs
  'spring boot', 'spring', 'hibernate', 'jpa', 'node.js', 'nodejs', 'express', 'nestjs',
  'react', 'react native', 'angular', 'vue', 'next.js', 'nextjs', 'nuxt', 'svelte',
  'django', 'flask', 'fastapi', 'ruby on rails', '.net', 'asp.net', 'gin', 'fiber',
  // APIs / architecture
  'rest', 'restful', 'graphql', 'grpc', 'websocket', 'microservices', 'micro-frontend',
  'micro-frontends', 'monorepo', 'event-driven', 'ddd', 'cqrs', 'saga', 'soa',
  'system design', 'distributed systems', 'api design', 'openapi', 'swagger',
  // Data
  'postgresql', 'postgres', 'mysql', 'mariadb', 'oracle', 'mssql', 'sqlite',
  'mongodb', 'dynamodb', 'cassandra', 'redis', 'memcached', 'elasticsearch', 'opensearch',
  'kafka', 'rabbitmq', 'sqs', 'sns', 'kinesis', 'pubsub', 'nats',
  // Cloud
  'aws', 'gcp', 'azure', 'lambda', 's3', 'ec2', 'ecs', 'eks', 'fargate', 'rds',
  'cloudfront', 'route53', 'iam', 'cloudwatch', 'step functions', 'app runner',
  'cloud run', 'gke', 'bigquery', 'pub/sub', 'firebase',
  // DevOps
  'docker', 'kubernetes', 'k8s', 'helm', 'terraform', 'pulumi', 'ansible',
  'jenkins', 'github actions', 'gitlab ci', 'circleci', 'argo', 'argocd',
  'ci/cd', 'continuous integration', 'continuous deployment', 'continuous delivery',
  // Observability
  'prometheus', 'grafana', 'datadog', 'new relic', 'splunk', 'sentry', 'opentelemetry',
  // Testing
  'unit testing', 'unit tests', 'integration testing', 'e2e testing', 'jest', 'jasmine',
  'mocha', 'junit', 'testng', 'cypress', 'playwright', 'selenium', 'tdd', 'bdd',
  // Concepts
  'data structures', 'algorithms', 'concurrency', 'multithreading', 'asynchronous',
  'performance optimization', 'scalability', 'high availability', 'load balancing',
  'caching', 'sharding', 'partitioning', 'replication', 'consistency', 'eventual consistency',
  'authentication', 'authorization', 'oauth', 'oauth2', 'oidc', 'jwt', 'rbac', 'sso',
  'agile', 'scrum', 'kanban', 'pair programming', 'code review', 'git', 'github', 'gitlab',
  // AI / ML (increasingly common in SDE JDs)
  'llm', 'large language model', 'rag', 'vector database', 'embeddings', 'prompt engineering',
  'openai', 'anthropic', 'claude', 'copilot',
];

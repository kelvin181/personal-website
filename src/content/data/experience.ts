export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
  content: string;
}

export const experience: Experience[] = [
  {
    id: "canva",
    company: "Canva",
    role: "Software Engineer Intern",
    startDate: "Dec 2025",
    endDate: "Feb 2026",
    description:
      "Building internal tooling to improve CI/CD ecosystem health and visibility across 1,300+ pipelines and 40+ teams.",
    highlights: [
      "Created and deployed an internal application using Python, TypeScript, and Kubernetes to improve CI/CD ecosystem health and visibility across 1,300+ pipelines and 40+ teams",
      "Built a pipeline metadata collection service deployed as a Kubernetes CronJob with DynamoDB storage",
      "Deployed a Flask REST API exposing at-risk pipelines on Kubernetes with Okta and in-cluster auth, identifying 500+ at-risk pipelines",
      "Built a Slack bot using Python and Kubernetes CronJobs, alerting 40% of all teams to at-risk pipelines",
    ],
    content: `# Software Engineer Intern @ Canva

**Dec 2025 - Feb 2026** — Sydney, Australia

## Responsibilities
- Created and deployed an internal application using Python, TypeScript, and Kubernetes to
  improve CI/CD ecosystem health and visibility across 1,300+ pipelines and 40+ teams
- Built a pipeline metadata collection service deployed as a Kubernetes CronJob with DynamoDB
  storage
- Deployed a Flask REST API exposing at-risk pipelines on Kubernetes with Okta and in-cluster
  auth, providing a secure unified data layer for integration with other internal services
- Created a dashboard using TypeScript secured with Okta SSO, allowing insight into org-wide
  CI/CD health

## Key Achievements
- Identified 500+ at-risk pipelines via the deployed REST API
- Built a Slack bot alerting 40% of all teams to at-risk pipelines
`,
  },
  {
    id: "mccrae-tech",
    company: "McCrae Tech",
    role: "Software Engineer Intern",
    startDate: "Apr 2025",
    endDate: "Sept 2025",
    description:
      "Developed CLI tooling and secure authentication integrations for internal developer infrastructure.",
    highlights: [
      "Developed a CLI in Golang, enabling staff to authenticate via an OAuth flow and seamlessly make API calls",
      "Integrated AWS Cognito user pools for authentication, ensuring secure management of user access and credentials",
      "Developed a secure MCP to gRPC gateway in Golang using gRPC server reflection and Protobuf plugins",
    ],
    content: `# Software Engineer Intern @ McCrae Tech

**Apr 2025 - Sept 2025** — Auckland, NZ

## Responsibilities
- Developed a CLI in Golang, enabling staff to authenticate via an OAuth flow and seamlessly
  make API calls
- Integrated AWS Cognito user pools for authentication, ensuring secure management of user
  access and credentials
- Developed a secure MCP to gRPC gateway in Golang using gRPC server reflection and Protobuf
  plugins, providing LLMs with internal information to generate more accurate responses
`,
  },
  {
    id: "orion-health",
    company: "Orion Health",
    role: "Software Engineer Intern",
    startDate: "Nov 2024",
    endDate: "Mar 2025",
    description:
      "Improved reliability and observability of a content delivery network serving hundreds of thousands of users.",
    highlights: [
      "Improved availability of an existing content delivery network by implementing AWS CloudFront origin failover with S3 replication using Terraform",
      "Created and delivered a monitoring and alerting system using Datadog and Opsgenie for failover events",
      "Designed and implemented Datadog dashboards with custom metrics using AWS metrics, Scala, Spring Boot, Docker, and OrientDB SQL",
    ],
    content: `# Software Engineer Intern @ Orion Health

**Nov 2024 - Mar 2025** — Auckland, NZ

## Responsibilities
- Improved availability of an existing content delivery network by implementing AWS CloudFront
  origin failover with S3 replication using Terraform, ensuring reliability for 100,000s of users
- Created and delivered a monitoring and alerting system using Datadog and Opsgenie for failover
  events, enabling operational staff to respond swiftly to downtime
- Designed and implemented Datadog dashboards with custom metrics using AWS metrics, Scala,
  Spring Boot, Docker, and OrientDB SQL, enabling global teams to monitor and manage millions of
  records
`,
  },
];

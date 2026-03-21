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
    id: "company-one",
    company: "Tech Company",
    role: "Software Developer",
    startDate: "Jan 2024",
    endDate: "Present",
    description: "Building full-stack web applications.",
    highlights: [
      "Developed and maintained production web applications",
      "Collaborated with cross-functional teams",
      "Improved application performance by 40%",
    ],
    content: `# Software Developer @ Tech Company

**Jan 2024 - Present**

Building full-stack web applications serving thousands of users.

## Responsibilities
- Developing and maintaining production web applications
- Collaborating with cross-functional teams
- Code reviews and mentoring junior developers

## Key Achievements
- Improved application performance by 40%
- Led migration to modern tech stack
`,
  },
  {
    id: "company-two",
    company: "Startup Inc",
    role: "Junior Developer",
    startDate: "Jun 2023",
    endDate: "Dec 2023",
    description: "Full-stack development at an early-stage startup.",
    highlights: [
      "Built features end-to-end from design to deployment",
      "Worked in a fast-paced agile environment",
    ],
    content: `# Junior Developer @ Startup Inc

**Jun 2023 - Dec 2023**

Full-stack development at an early-stage startup.

## Responsibilities
- Building features end-to-end
- Working closely with product and design teams

## Key Achievements
- Shipped 3 major features in first 6 months
- Established testing practices for the team
`,
  },
];

export interface SkillCategory {
  category: string;
  items: string[];
}

export const skills: SkillCategory[] = [
  {
    category: "Languages",
    items: ["TypeScript", "JavaScript", "Python", "Java", "Go", "Scala", "SQL"],
  },
  {
    category: "Frameworks",
    items: ["React", "Next.js", "Express", "Flask", "Spring Boot", "PyTorch"],
  },
  {
    category: "Tools & Platforms",
    items: ["Git", "Docker", "Kubernetes", "AWS", "Terraform", "PostgreSQL", "MongoDB", "Datadog"],
  },
  {
    category: "Other",
    items: [
      "Data Structures & Algorithms",
      "REST APIs",
      "CI/CD",
      "Agile Methodology",
      "System Design",
    ],
  },
];

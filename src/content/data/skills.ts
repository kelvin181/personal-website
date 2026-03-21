export interface SkillCategory {
  category: string;
  items: string[];
}

export const skills: SkillCategory[] = [
  {
    category: "Languages",
    items: ["TypeScript", "JavaScript", "Python", "Java", "C++", "SQL"],
  },
  {
    category: "Frameworks",
    items: ["React", "Next.js", "Node.js", "Express", "Django"],
  },
  {
    category: "Tools & Platforms",
    items: ["Git", "Docker", "AWS", "Linux", "PostgreSQL", "MongoDB"],
  },
  {
    category: "Other",
    items: ["REST APIs", "GraphQL", "CI/CD", "Agile/Scrum", "System Design"],
  },
];

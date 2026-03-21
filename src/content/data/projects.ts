export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  links: {
    github?: string;
    live?: string;
  };
  content: string;
}

export const projects: Project[] = [
  {
    id: "personal-os",
    title: "Personal OS Website",
    description:
      "An OS-like personal portfolio website with a virtual filesystem, terminal, and file manager.",
    tags: ["Next.js", "React", "TypeScript", "Redux Toolkit"],
    links: {
      github: "https://github.com/kelvin/personal-website",
    },
    content: `# Personal OS Website

An interactive portfolio website that simulates a desktop operating system.

## Features
- Virtual filesystem with directories and files
- Terminal with Linux commands and portfolio commands
- File manager for visual browsing
- Text viewer with markdown rendering

## Tech Stack
- Next.js 15 + React 19
- TypeScript
- Redux Toolkit
- Tailwind CSS
`,
  },
  {
    id: "project-two",
    title: "Project Two",
    description: "A placeholder project. Replace with your actual project.",
    tags: ["Python", "Machine Learning"],
    links: {
      github: "https://github.com/kelvin/project-two",
    },
    content: `# Project Two

Replace this with a description of your actual project.

## Overview
Describe what the project does and why it exists.

## Key Achievements
- Achievement 1
- Achievement 2
`,
  },
];

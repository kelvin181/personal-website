export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  courses: string[];
  content: string;
}

export const education: Education[] = [
  {
    id: "university",
    institution: "University of Auckland",
    degree: "Bachelor of Science (Honours)",
    field: "Computer Science",
    startDate: "Feb 2023",
    endDate: "Nov 2026",
    courses: [
      "Principles of Programming",
      "Introduction to Computer Systems",
      "Introduction to Practical Computing",
      "Mathematics for Computer Science",
      "Introduction to Software Fundamentals",
      "Computer Organisation",
      "Discrete Structures in Mathematics and Computer Science",
      "Algorithms and Data Structures",
      "Object Oriented Software Development",
      "Software Development Methodologies",
      "Machine Learning",
      "Operating Systems",
      "Data Communications Technologies",
      "Applied Algorithmics",
      "Web Programming and Distributed Services",
      "Artificial Intelligence",
      "Capstone: Computer Science",
    ],
    content: `# BSc (Hons) Computer Science — University of Auckland

**Feb 2023 - Nov 2026**

## Relevant Courses
- Principles of Programming
- Introduction to Computer Systems
- Introduction to Practical Computing
- Mathematics for Computer Science
- Introduction to Software Fundamentals
- Computer Organisation
- Discrete Structures in Mathematics and Computer Science
- Algorithms and Data Structures
- Object Oriented Software Development
- Software Development Methodologies
- Machine Learning
- Operating Systems
- Data Communications Technologies
- Applied Algorithmics
- Web Programming and Distributed Services
- Artificial Intelligence
- Capstone: Computer Science

## Achievements
- Cumulative GPA: 8.75/9 (A/A+ Average)
- First in Course Award: COMPSCI 110, COMPSCI 111, COMPSCI 210, COMPSCI 230
`,
  },
];

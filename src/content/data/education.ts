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
    institution: "University of Technology",
    degree: "Bachelor of Science",
    field: "Computer Science",
    startDate: "Sep 2020",
    endDate: "Jun 2024",
    courses: [
      "Data Structures & Algorithms",
      "Operating Systems",
      "Database Systems",
      "Computer Networks",
      "Software Engineering",
      "Machine Learning",
      "Web Development",
    ],
    content: `# BSc Computer Science — University of Technology

**Sep 2020 - Jun 2024**

## Relevant Courses
- Data Structures & Algorithms
- Operating Systems
- Database Systems
- Computer Networks
- Software Engineering
- Machine Learning
- Web Development

## Achievements
- Dean's List (multiple semesters)
- Senior capstone project on distributed systems
`,
  },
];

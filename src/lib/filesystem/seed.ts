import { v4 as uuidv4 } from "uuid";
import { FileSystem, FSDirectory, FSFile, NodeId } from "./types";
import { getExtension } from "./utils";
import { profile } from "@/content/data/profile";
import { projects } from "@/content/data/projects";
import { experience } from "@/content/data/experience";
import { education } from "@/content/data/education";
import { skills } from "@/content/data/skills";
import { interests } from "@/content/data/interests";

const now = Date.now();

function makeDir(name: string, parentId: NodeId | null, id?: string): FSDirectory {
  return {
    id: id || uuidv4(),
    name,
    parentId,
    type: "directory",
    childIds: [],
    createdAt: now,
    modifiedAt: now,
  };
}

function makeFile(name: string, parentId: NodeId, content: string): FSFile {
  return {
    id: uuidv4(),
    name,
    parentId,
    type: "file",
    content,
    extension: getExtension(name),
    size: content.length,
    createdAt: now,
    modifiedAt: now,
  };
}

function addChild(
  nodes: Record<NodeId, FSDirectory | FSFile>,
  parentId: NodeId,
  child: FSDirectory | FSFile
) {
  nodes[child.id] = child;
  const parent = nodes[parentId] as FSDirectory;
  parent.childIds.push(child.id);
}

export function createInitialFileSystem(): FileSystem {
  const nodes: Record<NodeId, FSDirectory | FSFile> = {};

  // Root
  const rootId = "root";
  nodes[rootId] = makeDir("/", null, rootId);

  // /home
  const home = makeDir("home", rootId);
  addChild(nodes, rootId, home);

  // /home/user
  const user = makeDir("user", home.id);
  addChild(nodes, home.id, user);

  // --- /home/user/about ---
  const aboutDir = makeDir("about", user.id);
  addChild(nodes, user.id, aboutDir);

  const bioContent = `# ${profile.name}

> ${profile.role}

${profile.bio}

## Links
${profile.socials.github ? `- GitHub: ${profile.socials.github}` : ""}
${profile.socials.linkedin ? `- LinkedIn: ${profile.socials.linkedin}` : ""}
${profile.socials.email ? `- Email: ${profile.socials.email}` : ""}
${profile.socials.twitter ? `- Twitter: ${profile.socials.twitter}` : ""}
`.trim();

  addChild(nodes, aboutDir.id, makeFile("bio.md", aboutDir.id, bioContent));

  const contactContent = `# Contact

Feel free to reach out!

${profile.socials.email ? `- Email: ${profile.socials.email}` : ""}
${profile.socials.github ? `- GitHub: ${profile.socials.github}` : ""}
${profile.socials.linkedin ? `- LinkedIn: ${profile.socials.linkedin}` : ""}
${profile.socials.twitter ? `- Twitter: ${profile.socials.twitter}` : ""}
`.trim();

  addChild(nodes, aboutDir.id, makeFile("contact.md", aboutDir.id, contactContent));

  // --- /home/user/projects ---
  const projectsDir = makeDir("projects", user.id);
  addChild(nodes, user.id, projectsDir);

  const projectsReadme = `# Projects

${projects.map((p) => `- **${p.title}** — ${p.description}`).join("\n")}

Run \`projects\` in the terminal for a formatted view.
`;
  addChild(nodes, projectsDir.id, makeFile("README.md", projectsDir.id, projectsReadme));

  for (const project of projects) {
    addChild(nodes, projectsDir.id, makeFile(`${project.id}.md`, projectsDir.id, project.content));
  }

  // --- /home/user/experience ---
  const expDir = makeDir("experience", user.id);
  addChild(nodes, user.id, expDir);

  const expReadme = `# Work Experience

${experience.map((e) => `- **${e.role}** @ ${e.company} (${e.startDate} - ${e.endDate})`).join("\n")}

Run \`experience\` in the terminal for a formatted view.
`;
  addChild(nodes, expDir.id, makeFile("README.md", expDir.id, expReadme));

  for (const exp of experience) {
    addChild(nodes, expDir.id, makeFile(`${exp.id}.md`, expDir.id, exp.content));
  }

  // --- /home/user/education ---
  const eduDir = makeDir("education", user.id);
  addChild(nodes, user.id, eduDir);

  const eduContent = `# Education

${education
  .map(
    (e) => `## ${e.degree} in ${e.field} — ${e.institution}
**${e.startDate} - ${e.endDate}**

### Relevant Courses
${e.courses.map((c) => `- ${c}`).join("\n")}
`
  )
  .join("\n")}
`;
  addChild(nodes, eduDir.id, makeFile("README.md", eduDir.id, eduContent));

  // --- /home/user/skills ---
  const skillsDir = makeDir("skills", user.id);
  addChild(nodes, user.id, skillsDir);

  const skillsContent = `# Skills

${skills.map((s) => `## ${s.category}\n${s.items.map((i) => `- ${i}`).join("\n")}`).join("\n\n")}
`;
  addChild(nodes, skillsDir.id, makeFile("README.md", skillsDir.id, skillsContent));

  // --- /home/user/interests ---
  const interestsDir = makeDir("interests", user.id);
  addChild(nodes, user.id, interestsDir);

  const interestsContent = `# Interests & Hobbies

${interests.map((i) => `- **${i.name}** — ${i.description}`).join("\n")}
`;
  addChild(nodes, interestsDir.id, makeFile("README.md", interestsDir.id, interestsContent));

  // --- /home/user/resume ---
  const resumeDir = makeDir("resume", user.id);
  addChild(nodes, user.id, resumeDir);

  const resumeContent = `# ${profile.name} — Resume

## About
${profile.bio}

## Experience
${experience
  .map(
    (e) => `### ${e.role} @ ${e.company}
**${e.startDate} - ${e.endDate}**
${e.highlights.map((h) => `- ${h}`).join("\n")}
`
  )
  .join("\n")}

## Education
${education
  .map(
    (e) => `### ${e.degree} in ${e.field} — ${e.institution}
**${e.startDate} - ${e.endDate}**
`
  )
  .join("\n")}

## Skills
${skills.map((s) => `**${s.category}:** ${s.items.join(", ")}`).join("\n")}

## Contact
${profile.socials.email ? `- Email: ${profile.socials.email}` : ""}
${profile.socials.github ? `- GitHub: ${profile.socials.github}` : ""}
${profile.socials.linkedin ? `- LinkedIn: ${profile.socials.linkedin}` : ""}
`;
  addChild(nodes, resumeDir.id, makeFile("resume.md", resumeDir.id, resumeContent));

  // --- /home/user/Pictures ---
  const picturesDir = makeDir("Pictures", user.id);
  addChild(nodes, user.id, picturesDir);

  // --- /home/user/.bashrc (Easter egg) ---
  const bashrcContent = `# ~/.bashrc - kelvin-os configuration
# This is a simulated OS. Have fun exploring!

export PS1="\\u@kelvin-os:\\w$ "
export EDITOR=vim
export PATH="/usr/local/bin:$PATH"

alias ll="ls -la"
alias cls="clear"

# Welcome to kelvin-os!
echo "Type 'help' to get started."
`;
  addChild(nodes, user.id, makeFile(".bashrc", user.id, bashrcContent));

  return { nodes, rootId };
}

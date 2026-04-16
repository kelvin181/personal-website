import { FileSystem, isDirectory, NodeId } from "@/lib/filesystem/types";
import { getNodeByPath, normalizePath, getParentPath, getBasename } from "@/lib/filesystem/utils";
import { getChildren, resolvePathToId } from "@/lib/filesystem/operations";
import { AppType } from "@/store/windowsSlice";
import { profile } from "@/content/data/profile";
import { projects } from "@/content/data/projects";
import { experience } from "@/content/data/experience";
import { education } from "@/content/data/education";
import { skills } from "@/content/data/skills";
import { interests } from "@/content/data/interests";
import { parseCommand } from "./parser";
import { runPython } from "@/lib/python/pyodide";

export interface OutputLinePart {
  text: string;
  type: string;
}

export interface OutputLine {
  text: string;
  type:
    | "output"
    | "error"
    | "success"
    | "info"
    | "prompt"
    | "command"
    | "heading"
    | "dim"
    | "link"
    | "warning";
  parts?: OutputLinePart[];
}

interface CommandContext {
  fs: FileSystem;
  cwd: string;
  setCwd: (path: string) => void;
  openWindow: (appType: AppType, props?: Record<string, unknown>) => void;
  createFile: (parentId: NodeId, name: string, content?: string) => void;
  createDirectory: (parentId: NodeId, name: string) => void;
  deleteNode: (nodeId: NodeId) => void;
  copyNode: (nodeId: NodeId, newParentId: NodeId) => void;
  renameNode: (nodeId: NodeId, newName: string) => void;
  moveNode: (nodeId: NodeId, newParentId: NodeId) => void;
  dispatch: unknown;
}

type CommandHandler = (args: string[], ctx: CommandContext) => OutputLine[] | Promise<OutputLine[]>;

function resolvePath(cwd: string, target: string): string {
  if (target.startsWith("/")) return normalizePath(target);
  if (target.startsWith("~")) return normalizePath("/home/user" + target.slice(1));
  return normalizePath(cwd + "/" + target);
}

// --- Linux Commands ---

const cmdLs: CommandHandler = (args, ctx) => {
  const showAll = args.includes("-a") || args.includes("-la") || args.includes("-al");
  const targetPath = args.find((a) => !a.startsWith("-")) || ctx.cwd;
  const path = resolvePath(ctx.cwd, targetPath);
  const node = getNodeByPath(ctx.fs, path);

  if (!node)
    return [
      { text: `ls: cannot access '${targetPath}': No such file or directory`, type: "error" },
    ];
  if (!isDirectory(node)) return [{ text: node.name, type: "output" }];

  const children = getChildren(ctx.fs, node.id);
  const filtered = showAll ? children : children.filter((c) => !c.name.startsWith("."));

  if (filtered.length === 0) return [{ text: "", type: "output" }];

  return filtered.map((child) => ({
    text: isDirectory(child) ? `${child.name}/` : child.name,
    type: isDirectory(child) ? ("info" as const) : ("output" as const),
  }));
};

const cmdCd: CommandHandler = (args, ctx) => {
  const target = args[0] || "~";
  const path = resolvePath(ctx.cwd, target);
  const node = getNodeByPath(ctx.fs, path);

  if (!node) return [{ text: `cd: no such file or directory: ${target}`, type: "error" }];
  if (!isDirectory(node)) return [{ text: `cd: not a directory: ${target}`, type: "error" }];

  ctx.setCwd(path);
  return [];
};

const cmdPwd: CommandHandler = (_args, ctx) => {
  return [{ text: ctx.cwd, type: "output" }];
};

const cmdCat: CommandHandler = (args, ctx) => {
  if (args.length === 0) return [{ text: "cat: missing operand", type: "error" }];

  const path = resolvePath(ctx.cwd, args[0]);
  const node = getNodeByPath(ctx.fs, path);

  if (!node) return [{ text: `cat: ${args[0]}: No such file or directory`, type: "error" }];
  if (isDirectory(node)) return [{ text: `cat: ${args[0]}: Is a directory`, type: "error" }];

  return [{ text: node.content, type: "output" }];
};

const cmdMkdir: CommandHandler = (args, ctx) => {
  if (args.length === 0) return [{ text: "mkdir: missing operand", type: "error" }];

  const cwdNode = getNodeByPath(ctx.fs, ctx.cwd);
  if (!cwdNode || !isDirectory(cwdNode))
    return [{ text: "mkdir: cannot create directory", type: "error" }];

  ctx.createDirectory(cwdNode.id, args[0]);
  return [];
};

const cmdTouch: CommandHandler = (args, ctx) => {
  if (args.length === 0) return [{ text: "touch: missing file operand", type: "error" }];

  const cwdNode = getNodeByPath(ctx.fs, ctx.cwd);
  if (!cwdNode || !isDirectory(cwdNode))
    return [{ text: "touch: cannot create file", type: "error" }];

  ctx.createFile(cwdNode.id, args[0], "");
  return [];
};

const cmdRm: CommandHandler = (args, ctx) => {
  if (args.length === 0) return [{ text: "rm: missing operand", type: "error" }];

  const path = resolvePath(ctx.cwd, args[args.length - 1]);
  const nodeId = resolvePathToId(ctx.fs, path);

  if (!nodeId)
    return [
      {
        text: `rm: cannot remove '${args[args.length - 1]}': No such file or directory`,
        type: "error",
      },
    ];

  const node = ctx.fs.nodes[nodeId];
  if (isDirectory(node) && !args.includes("-r") && !args.includes("-rf")) {
    return [{ text: `rm: cannot remove '${node.name}': Is a directory (use -r)`, type: "error" }];
  }

  ctx.deleteNode(nodeId);
  return [];
};

const cmdEcho: CommandHandler = (args) => {
  return [{ text: args.join(" "), type: "output" }];
};

const cmdOpen: CommandHandler = (args, ctx) => {
  if (args.length === 0) return [{ text: "open: missing file operand", type: "error" }];

  const path = resolvePath(ctx.cwd, args[0]);
  const node = getNodeByPath(ctx.fs, path);

  if (!node) return [{ text: `open: ${args[0]}: No such file or directory`, type: "error" }];
  if (isDirectory(node)) {
    ctx.openWindow("file-manager", { initialPath: path });
    return [{ text: `Opening file manager at ${path}`, type: "info" }];
  }

  ctx.openWindow("text-viewer", { fileId: node.id, filePath: path, title: node.name });
  return [{ text: `Opening ${node.name}`, type: "info" }];
};

const cmdCp: CommandHandler = (args, ctx) => {
  const recursive = args.includes("-r") || args.includes("-R");
  const paths = args.filter((a) => !a.startsWith("-"));

  if (paths.length < 2) return [{ text: "cp: missing operand", type: "error" }];

  const srcPath = resolvePath(ctx.cwd, paths[0]);
  const destPath = resolvePath(ctx.cwd, paths[1]);

  const srcNode = getNodeByPath(ctx.fs, srcPath);
  if (!srcNode)
    return [{ text: `cp: cannot stat '${paths[0]}': No such file or directory`, type: "error" }];

  if (isDirectory(srcNode) && !recursive)
    return [{ text: `cp: -r not specified; omitting directory '${paths[0]}'`, type: "error" }];

  // If destination is an existing directory, copy into it
  const destNode = getNodeByPath(ctx.fs, destPath);
  if (destNode && isDirectory(destNode)) {
    ctx.copyNode(srcNode.id, destNode.id);
    return [];
  }

  // Otherwise, treat destination as parent + new name
  const destParentPath = getParentPath(destPath);
  const destName = getBasename(destPath);
  const destParent = getNodeByPath(ctx.fs, destParentPath);

  if (!destParent || !isDirectory(destParent))
    return [{ text: `cp: cannot create '${paths[1]}': No such file or directory`, type: "error" }];

  // Copy into parent, then rename the copy
  ctx.copyNode(srcNode.id, destParent.id);
  // If the name differs, we need to rename — but we don't have the new ID
  // For simplicity, if the name is different, warn
  if (destName !== srcNode.name) {
    // Find the newly copied node by name in the parent
    const updatedParent = ctx.fs.nodes[destParent.id];
    if (updatedParent && isDirectory(updatedParent)) {
      const copiedId = updatedParent.childIds.find(
        (id) => ctx.fs.nodes[id]?.name === srcNode.name && id !== srcNode.id
      );
      if (copiedId) {
        ctx.renameNode(copiedId, destName);
      }
    }
  }
  return [];
};

const cmdMv: CommandHandler = (args, ctx) => {
  const paths = args.filter((a) => !a.startsWith("-"));

  if (paths.length < 2) return [{ text: "mv: missing operand", type: "error" }];

  const srcPath = resolvePath(ctx.cwd, paths[0]);
  const destPath = resolvePath(ctx.cwd, paths[1]);

  const srcNode = getNodeByPath(ctx.fs, srcPath);
  if (!srcNode)
    return [{ text: `mv: cannot stat '${paths[0]}': No such file or directory`, type: "error" }];

  // If destination is an existing directory, move into it
  const destNode = getNodeByPath(ctx.fs, destPath);
  if (destNode && isDirectory(destNode)) {
    ctx.moveNode(srcNode.id, destNode.id);
    return [];
  }

  // Otherwise, check if it's a rename (same parent, new name)
  const destParentPath = getParentPath(destPath);
  const destName = getBasename(destPath);
  const destParent = getNodeByPath(ctx.fs, destParentPath);

  if (!destParent || !isDirectory(destParent))
    return [
      {
        text: `mv: cannot move '${paths[0]}' to '${paths[1]}': No such file or directory`,
        type: "error",
      },
    ];

  // If same parent directory, just rename
  if (srcNode.parentId === destParent.id) {
    ctx.renameNode(srcNode.id, destName);
  } else {
    // Move to new parent, then rename if needed
    ctx.moveNode(srcNode.id, destParent.id);
    if (destName !== srcNode.name) {
      ctx.renameNode(srcNode.id, destName);
    }
  }
  return [];
};

// --- Portfolio Commands ---

const cmdWhoami: CommandHandler = () => {
  return [
    { text: "", type: "output" },
    { text: `  ${profile.name}`, type: "heading" },
    { text: `  ${profile.role}`, type: "info" },
    { text: "", type: "output" },
    { text: `  ${profile.bio}`, type: "output" },
    { text: "", type: "output" },
    ...(profile.socials.github
      ? [{ text: `  GitHub:    ${profile.socials.github}`, type: "link" as const }]
      : []),
    ...(profile.socials.linkedin
      ? [{ text: `  LinkedIn:  ${profile.socials.linkedin}`, type: "link" as const }]
      : []),
    ...(profile.socials.email
      ? [{ text: `  Email:     ${profile.socials.email}`, type: "link" as const }]
      : []),
    ...(profile.socials.twitter
      ? [{ text: `  Twitter:   ${profile.socials.twitter}`, type: "link" as const }]
      : []),
    { text: "", type: "output" },
  ];
};

const cmdProjects: CommandHandler = () => {
  const lines: OutputLine[] = [
    { text: "", type: "output" },
    { text: "  PROJECTS", type: "heading" },
    { text: "  " + "─".repeat(40), type: "dim" },
  ];

  for (const p of projects) {
    lines.push({ text: "", type: "output" });
    lines.push({ text: `  ${p.title}`, type: "info" });
    lines.push({ text: `  ${p.description}`, type: "output" });
    lines.push({ text: `  Tags: ${p.tags.join(", ")}`, type: "dim" });
    if (p.links.github) lines.push({ text: `  GitHub: ${p.links.github}`, type: "link" });
    if (p.links.live) lines.push({ text: `  Live: ${p.links.live}`, type: "link" });
  }
  lines.push({ text: "", type: "output" });
  return lines;
};

const cmdExperience: CommandHandler = () => {
  const lines: OutputLine[] = [
    { text: "", type: "output" },
    { text: "  WORK EXPERIENCE", type: "heading" },
    { text: "  " + "─".repeat(40), type: "dim" },
  ];

  for (const e of experience) {
    lines.push({ text: "", type: "output" });
    lines.push({ text: `  ${e.role} @ ${e.company}`, type: "info" });
    lines.push({ text: `  ${e.startDate} - ${e.endDate}`, type: "dim" });
    lines.push({ text: `  ${e.description}`, type: "output" });
    for (const h of e.highlights) {
      lines.push({ text: `    • ${h}`, type: "output" });
    }
  }
  lines.push({ text: "", type: "output" });
  return lines;
};

const cmdEducation: CommandHandler = () => {
  const lines: OutputLine[] = [
    { text: "", type: "output" },
    { text: "  EDUCATION", type: "heading" },
    { text: "  " + "─".repeat(40), type: "dim" },
  ];

  for (const e of education) {
    lines.push({ text: "", type: "output" });
    lines.push({ text: `  ${e.degree} in ${e.field}`, type: "info" });
    lines.push({ text: `  ${e.institution}`, type: "output" });
    lines.push({ text: `  ${e.startDate} - ${e.endDate}`, type: "dim" });
    lines.push({ text: "", type: "output" });
    lines.push({ text: "  Relevant Courses:", type: "output" });
    for (const c of e.courses) {
      lines.push({ text: `    • ${c}`, type: "dim" });
    }
  }
  lines.push({ text: "", type: "output" });
  return lines;
};

const cmdSkills: CommandHandler = () => {
  const lines: OutputLine[] = [
    { text: "", type: "output" },
    { text: "  SKILLS", type: "heading" },
    { text: "  " + "─".repeat(40), type: "dim" },
  ];

  for (const s of skills) {
    lines.push({ text: "", type: "output" });
    lines.push({ text: `  ${s.category}`, type: "info" });
    lines.push({ text: `  ${s.items.join("  •  ")}`, type: "output" });
  }
  lines.push({ text: "", type: "output" });
  return lines;
};

const cmdInterests: CommandHandler = () => {
  const lines: OutputLine[] = [
    { text: "", type: "output" },
    { text: "  INTERESTS & HOBBIES", type: "heading" },
    { text: "  " + "─".repeat(40), type: "dim" },
  ];

  for (const i of interests) {
    lines.push({ text: `  • ${i.name} — ${i.description}`, type: "output" });
  }
  lines.push({ text: "", type: "output" });
  return lines;
};

const cmdContact: CommandHandler = () => {
  return [
    { text: "", type: "output" },
    { text: "  CONTACT", type: "heading" },
    { text: "  " + "─".repeat(40), type: "dim" },
    { text: "", type: "output" },
    ...(profile.socials.email
      ? [{ text: `  Email:     ${profile.socials.email}`, type: "link" as const }]
      : []),
    ...(profile.socials.github
      ? [{ text: `  GitHub:    ${profile.socials.github}`, type: "link" as const }]
      : []),
    ...(profile.socials.linkedin
      ? [{ text: `  LinkedIn:  ${profile.socials.linkedin}`, type: "link" as const }]
      : []),
    ...(profile.socials.twitter
      ? [{ text: `  Twitter:   ${profile.socials.twitter}`, type: "link" as const }]
      : []),
    { text: "", type: "output" },
  ];
};

const cmdResume: CommandHandler = () => {
  return [
    { text: "", type: "output" },
    { text: `  ${profile.name} — ${profile.role}`, type: "heading" },
    { text: "  " + "═".repeat(40), type: "dim" },
    { text: "", type: "output" },
    { text: "  " + profile.bio, type: "output" },
    { text: "", type: "output" },
    { text: "  For the full resume: cat ~/resume/resume.md", type: "info" },
    { text: "  Or: open ~/resume/resume.md", type: "info" },
    { text: "", type: "output" },
  ];
};

const cmdSocial: CommandHandler = () => {
  return cmdContact([], {} as CommandContext);
};

// --- Python ---

const cmdPython: CommandHandler = async (args, ctx) => {
  if (!args[0]) {
    return [{ text: "usage: python <file.py>", type: "error" }];
  }

  const path = resolvePath(ctx.cwd, args[0]);
  const node = getNodeByPath(ctx.fs, path);

  if (!node)
    return [
      {
        text: `python: can't open file '${args[0]}': [Errno 2] No such file or directory`,
        type: "error",
      },
    ];
  if (isDirectory(node)) return [{ text: `python: '${args[0]}': Is a directory`, type: "error" }];

  const { output, error } = await runPython(node.content);

  if (error) {
    return error
      .split("\n")
      .filter(Boolean)
      .map((text) => ({ text, type: "error" as const }));
  }

  return output
    .split("\n")
    .filter(Boolean)
    .map((text) => ({ text, type: "output" as const }));
};

// --- Help ---

const HELP_TEXT: Record<string, string> = {
  ls: "ls [path] [-a]  —  List directory contents",
  cd: "cd [path]  —  Change directory (supports ~, .., relative paths)",
  pwd: "pwd  —  Print working directory",
  cat: "cat <file>  —  Display file contents",
  mkdir: "mkdir <name>  —  Create a new directory",
  touch: "touch <name>  —  Create an empty file",
  rm: "rm [-r] <path>  —  Remove a file or directory",
  cp: "cp [-r] <source> <dest>  —  Copy a file or directory",
  mv: "mv <source> <dest>  —  Move or rename a file or directory",
  echo: "echo <text>  —  Print text",
  open: "open <path>  —  Open a file in the text viewer or directory in file manager",
  clear: "clear  —  Clear the terminal",
  help: "help [command]  —  Show available commands or help for a specific command",
  whoami: "whoami  —  Display my name, role, and bio",
  projects: "projects  —  List all my projects",
  experience: "experience  —  Show my work experience",
  education: "education  —  Show my education background",
  skills: "skills  —  List my technical skills",
  interests: "interests  —  Show my interests and hobbies",
  contact: "contact  —  Show contact information",
  resume: "resume  —  Display resume summary",
  social: "social  —  Show social media links",
  python: "python <file.py>  —  Run a Python script",
};

const cmdHelp: CommandHandler = (args) => {
  if (args.length > 0) {
    const cmd = args[0].toLowerCase();
    if (HELP_TEXT[cmd]) {
      return [
        { text: "", type: "output" },
        { text: `  ${HELP_TEXT[cmd]}`, type: "output" },
        { text: "", type: "output" },
      ];
    }
    return [{ text: `help: no help found for '${cmd}'`, type: "error" }];
  }

  const lines: OutputLine[] = [
    { text: "", type: "output" },
    { text: "  AVAILABLE COMMANDS", type: "heading" },
    { text: "  " + "─".repeat(40), type: "dim" },
    { text: "", type: "output" },
    { text: "  Linux Commands:", type: "info" },
  ];

  const linuxCmds = [
    "ls",
    "cd",
    "pwd",
    "cat",
    "mkdir",
    "touch",
    "rm",
    "cp",
    "mv",
    "echo",
    "open",
    "clear",
    "python",
  ];
  for (const cmd of linuxCmds) {
    lines.push({ text: `    ${HELP_TEXT[cmd]}`, type: "output" });
  }

  lines.push({ text: "", type: "output" });
  lines.push({ text: "  Portfolio Commands:", type: "info" });

  const portfolioCmds = [
    "whoami",
    "projects",
    "experience",
    "education",
    "skills",
    "interests",
    "contact",
    "resume",
    "social",
  ];
  for (const cmd of portfolioCmds) {
    lines.push({ text: `    ${HELP_TEXT[cmd]}`, type: "output" });
  }

  lines.push({ text: "", type: "output" });
  lines.push({ text: '  Type "help <command>" for more details', type: "dim" });
  lines.push({ text: "", type: "output" });

  return lines;
};

// --- Command Registry ---

const COMMANDS: Record<string, CommandHandler> = {
  ls: cmdLs,
  cd: cmdCd,
  pwd: cmdPwd,
  cat: cmdCat,
  mkdir: cmdMkdir,
  touch: cmdTouch,
  rm: cmdRm,
  cp: cmdCp,
  mv: cmdMv,
  echo: cmdEcho,
  open: cmdOpen,
  help: cmdHelp,
  python: cmdPython,
  whoami: cmdWhoami,
  projects: cmdProjects,
  experience: cmdExperience,
  education: cmdEducation,
  skills: cmdSkills,
  interests: cmdInterests,
  contact: cmdContact,
  resume: cmdResume,
  social: cmdSocial,
};

export async function executeCommand(input: string, ctx: CommandContext): Promise<OutputLine[]> {
  const { command, args } = parseCommand(input);

  if (!command) return [];

  const handler = COMMANDS[command];
  if (!handler) {
    return [
      { text: `${command}: command not found. Type "help" for available commands.`, type: "error" },
    ];
  }

  return handler(args, ctx);
}

export interface Profile {
  name: string;
  role: string;
  bio: string;
  socials: {
    github?: string;
    linkedin?: string;
    email?: string;
    twitter?: string;
    website?: string;
  };
}

export const profile: Profile = {
  name: "Kelvin",
  role: "Software Developer",
  bio: "Passionate software developer who loves building things. Welcome to my OS-style portfolio — explore my projects, experience, and more through the terminal or file manager.",
  socials: {
    github: "https://github.com/kelvin",
    linkedin: "https://linkedin.com/in/kelvin",
    email: "kelvin@example.com",
    twitter: "https://twitter.com/kelvin",
  },
};

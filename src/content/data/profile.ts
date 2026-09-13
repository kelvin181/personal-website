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
  name: "Kelvin Chen",
  role: "Software Engineer",
  bio: "Welcome to my OS-style portfolio",
  socials: {
    github: "https://github.com/kelvin181",
    linkedin: "https://www.linkedin.com/in/kelvin-chen8/",
    email: "kelvinc204@gmail.com",
  },
};

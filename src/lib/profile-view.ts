import type { Profile } from "./types";

/** The profile in the shape the public components use (camelCase, the photo with its alt text). */
export function profileView(p: Profile) {
  const displayName = `${p.honorific} ${p.full_name}`;
  return {
    honorific: p.honorific,
    fullName: p.full_name,
    displayName,
    specialty: p.specialty,
    shortIntro: p.short_intro,
    bio: p.bio,
    photo: p.photo_path ? { src: p.photo_path, alt: displayName } : null,
    education: p.education,
    experience: p.experience,
    languages: p.languages,
  };
}

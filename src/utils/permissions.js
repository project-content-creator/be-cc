// Aturan role CreatorTrack. Semua pengecekan hak akses dilakukan di sini (sisi server)
export const ROLES = ["admin", "creator", "editor"];
export const STATUSES = ["idea", "scripting", "recording", "editing", "ready", "published"];
export const FORMATS = ["short_video", "long_video", "carousel", "single_post"];
export const PRIORITIES = ["low", "medium", "high"];
export const PLATFORMS = ["youtube", "tiktok", "instagram", "linkedin"];

// Status yang boleh DILIHAT tiap role.
const VISIBLE = {
  admin: STATUSES,
  creator: ["idea", "scripting", "recording"],
  editor: ["editing", "ready"],
};

// Status tujuan yang boleh DIPILIH tiap role saat memindahkan konten.
// - creator boleh menyerahkan konten ke editor (recording -> editing).
// - hanya admin yang boleh memilih "published".
const ASSIGNABLE = {
  admin: STATUSES,
  creator: ["idea", "scripting", "recording", "editing"],
  editor: ["editing", "ready"],
};

export const visibleStatuses = (role) => VISIBLE[role] ?? [];
export const assignableStatuses = (role) => ASSIGNABLE[role] ?? [];

// admin: semua konten | creator: konten MILIKNYA dengan status idea-recording | editor: status editing-ready
export function canSeeContent(user, content) {
  if (user.role === "admin") return true;
  if (!visibleStatuses(user.role).includes(content.status)) return false;
  return user.role === "creator" ? Number(content.user_id) === Number(user.id) : true;
}

// Mengubah isi/menghapus konten: admin, atau creator pemiliknya.
export const canModifyContent = (user, content) =>
  user.role === "admin" || (user.role === "creator" && canSeeContent(user, content));

// Potongan SQL untuk membatasi daftar konten sesuai role (kolom: status, user_id).
export function visibilityClause(user) {
  if (user.role === "admin") return { sql: "", params: [] };
  const statuses = visibleStatuses(user.role);
  if (statuses.length === 0) return { sql: "1 = 0", params: [] };
  const marks = statuses.map(() => "?").join(", ");
  if (user.role === "creator") {
    return { sql: `status IN (${marks}) AND user_id = ?`, params: [...statuses, user.id] };
  }
  return { sql: `status IN (${marks})`, params: statuses };
}

export const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD (zona waktu server)

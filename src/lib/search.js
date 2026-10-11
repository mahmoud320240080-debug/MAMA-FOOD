/**
 * تطبيع نص للبحث: من غير تشكيل ولا تطويل، أ/إ/آ/ٱ = ا، ة = ه، ى = ي، والإنجليزي من غير فرق حروف كبيرة/صغيرة.
 * "مكرونة" تلاقي "مكرونه"، و "احمد" تلاقي "أحمد".
 */
export const normalizeSearch = (s = "") =>
  String(s)
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();

/** query مطبّع (normalizeSearch) جوه أي نص من النصوص */
export const matchesSearch = (query, ...fields) =>
  !query || fields.some((f) => normalizeSearch(f).includes(query));

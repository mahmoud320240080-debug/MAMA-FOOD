export const formatPrice = (n) => `${Number(n || 0).toLocaleString("en-US")} جنيه`;

export const formatTime = (iso) =>
  new Intl.DateTimeFormat("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));

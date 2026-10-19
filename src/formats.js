/* Formats imposés aux variables du site. Partagé par le build (validation du contenu) et l’application
   (validation de la saisie) : une valeur qui ne respecte pas son format n’est jamais insérée dans une commande. */
const OCT = '(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
export const FORMATS = {
  ip:    { rx: new RegExp('^' + OCT + '(\\.' + OCT + '){3}$'), aide: 'IPv4 attendue, ex. 10.1.2.3' },
  net3:  { rx: new RegExp('^' + OCT + '(\\.' + OCT + '){2}$'), aide: '3 octets attendus, ex. 10.1.2' },
  mac:   { rx: /^[0-9a-f]{2}(:[0-9a-f]{2}){5}$/i, aide: 'MAC complète, ex. 00:04:a5:12:34:56' },
  iface: { rx: /^[a-z][a-z0-9.]{1,14}$/, aide: 'Nom d’interface, ex. br3 ou eth1' },
  path:  { rx: /^\/[A-Za-z0-9._@\/-]{1,200}$/, aide: 'Chemin absolu sans espace ni caractère spécial', pasDeRemontee: true },
  film:  { rx: /^[A-Za-z0-9_-]{4,40}$/, aide: '4 à 40 caractères : lettres, chiffres, - ou _' },
  winif: { rx: /^[A-Za-z0-9 ._()-]{1,40}$/, aide: 'Nom de carte sans guillemet ni $' },
  uuid:  { rx: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, aide: 'UUID complet, ex. f542da64-80f9-49d2-927b-1eacdce80f13' },
  port:  { rx: /^([1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/, aide: 'Port TCP entre 1 et 65535' },
  code:  { rx: /^[a-z]{2}[a-z0-9]{2,12}$/, aide: 'Code site en minuscules, ex. frxxxx' },
  svc:   { rx: /^[a-z][a-z0-9@._-]{1,40}$/, aide: 'Nom de service systemd, ex. tomcat8' }
};
export function etatValeur(format, v) {
  if (!v) return 'empty';
  const f = FORMATS[format];
  if (!f) return 'bad';
  if (f.pasDeRemontee && /(^|\/)\.\.(\/|$)/.test(v)) return 'bad';
  return f.rx.test(v) ? 'ok' : 'bad';
}

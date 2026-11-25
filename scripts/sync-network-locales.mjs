import { readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../app/i18n.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile(
  'i18n.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let properties = [];
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'translations')
    properties = node.initializer.properties;
  ts.forEachChild(node, visit);
}
visit(ast);
// These values follow the key order in each triple: German, Chinese, French.
const revised = {
  'Plan de red': ['Netzplan', '网络规划', 'Plan réseau'],
  'Subred, máscara, puerta de enlace y reserva de crecimiento.': [
    'Subnetz, Maske, Gateway und Wachstumsreserve.',
    '子网、掩码、网关和扩展预留。',
    'Sous-réseau, masque, passerelle et réserve de croissance.',
  ],
  'Subred IPv4 (CIDR)': ['IPv4-Subnetz (CIDR)', 'IPv4 子网 (CIDR)', 'Sous-réseau IPv4 (CIDR)'],
  'Reserva de crecimiento (%)': [
    'Wachstumsreserve (%)',
    '扩展预留 (%)',
    'Réserve de croissance (%)',
  ],
  'Asignación IP': ['IP-Zuweisung', 'IP 分配', 'Attribution IP'],
  'Subred asignada (CIDR)': [
    'Zugewiesenes Subnetz (CIDR)',
    '已分配子网 (CIDR)',
    'Sous-réseau attribué (CIDR)',
  ],
  DHCP: ['DHCP', 'DHCP', 'DHCP'],
  Estática: ['Statisch', '静态', 'Statique'],
  'EN TIEMPO REAL': ['LIVE', '实时', 'EN TEMPS RÉEL'],
  'Resumen de la red': ['Netzwerkübersicht', '网络概览', 'Résumé du réseau'],
  'Plan de red válido': ['Gültiger Netzplan', '网络规划有效', 'Plan réseau valide'],
  'Revisar plan de red': ['Netzplan prüfen', '检查网络规划', 'Vérifier le plan réseau'],
  'Red activa': ['Aktives Netzwerk', '当前网络', 'Réseau actif'],
  'SUBRED ACTUAL': ['AKTUELLES SUBNETZ', '当前子网', 'SOUS-RÉSEAU ACTUEL'],
  'Máscara de red': ['Subnetzmaske', '子网掩码', 'Masque de sous-réseau'],
  'Equipos en inventario': ['Inventarisierte Geräte', '库存设备', 'Équipements inventoriés'],
  'IP fijas actuales': ['Aktuelle statische IPs', '当前静态 IP', 'IP statiques actuelles'],
  'Computadoras DHCP': ['DHCP-Computer', 'DHCP 计算机', 'Ordinateurs DHCP'],
  'Reserva de crecimiento': ['Wachstumsreserve', '扩展预留', 'Réserve de croissance'],
  'Direcciones necesarias': ['Benötigte Adressen', '所需地址', 'Adresses nécessaires'],
  'Capacidad utilizable': ['Nutzbare Kapazität', '可用容量', 'Capacité utilisable'],
  'Calculado con los registros de la sede': [
    'Aus Standortdaten berechnet',
    '根据站点记录计算',
    'Calculé à partir des fiches du site',
  ],
  'Editar plan de red': ['Netzplan bearbeiten', '编辑网络规划', 'Modifier le plan réseau'],
  'Subred por configurar': [
    'Subnetz nicht konfiguriert',
    '子网尚未配置',
    'Sous-réseau à configurer',
  ],
  'Documenta la subred y la puerta de enlace para ver un resumen actualizado.': [
    'Subnetz und Gateway dokumentieren, um die Übersicht zu sehen.',
    '记录子网和网关以查看更新后的概览。',
    'Documentez le sous-réseau et la passerelle pour voir le résumé.',
  ],
  'Crear plan de red': ['Netzplan erstellen', '创建网络规划', 'Créer un plan réseau'],
  DOCUMENTOS: ['DOKUMENTE', '文档', 'DOCUMENTS'],
  'Ficha de registro': ['Geräteblatt', '记录表', 'Fiche de registre'],
  'Elige cualquier registro y descarga su ficha en PDF.': [
    'Datensatz wählen und PDF-Blatt herunterladen.',
    '选择任意记录并下载其 PDF 表单。',
    'Choisissez une fiche et téléchargez son PDF.',
  ],
  'Seleccionar registro para PDF': [
    'Datensatz für PDF auswählen',
    '选择 PDF 记录',
    'Choisir une fiche pour le PDF',
  ],
  'Crear PDF': ['PDF erstellen', '创建 PDF', 'Créer un PDF'],
  'Las credenciales de la bóveda no se incluyen.': [
    'Tresor-Zugangsdaten sind nicht enthalten.',
    '不包含保险库凭据。',
    'Les identifiants du coffre ne sont pas inclus.',
  ],
  'Cargar ejemplo': ['Beispiel laden', '加载示例', 'Charger un exemple'],
  'Volver a mis datos': ['Zurück zu meinen Daten', '返回我的数据', 'Retour à mes données'],
  'Proyecto de ejemplo': ['Beispielprojekt', '示例项目', 'Projet exemple'],
  'Datos ficticios guardados solo en este navegador': [
    'Fiktive Daten nur in diesem Browser gespeichert',
    '虚构数据仅保存在此浏览器中',
    'Données fictives enregistrées seulement dans ce navigateur',
  ],
  'Bóveda no disponible en el ejemplo': [
    'Tresor im Beispiel nicht verfügbar',
    '示例中无法使用保险库',
    'Coffre indisponible dans cet exemple',
  ],
  'El proyecto de ejemplo no contiene ni guarda credenciales. Vuelve a tus datos reales para usar la bóveda segura.':
    [
      'Das Beispielprojekt enthält oder speichert keine Zugangsdaten. Kehren Sie zu Ihren echten Daten zurück, um den sicheren Tresor zu nutzen.',
      '示例项目不包含或保存凭据。请返回真实数据以使用安全保险库。',
      'Le projet exemple ne contient ni ne stocke d’identifiants. Revenez à vos données réelles pour utiliser le coffre sécurisé.',
    ],
};
const keys = properties.map((property) => property.name.text);
for (const [index, locale] of ['de', 'zh', 'fr'].entries()) {
  const url = new URL(`../app/locales/${locale}.json`, import.meta.url);
  const catalog = JSON.parse(readFileSync(url, 'utf8'));
  for (const property of properties) {
    const key = property.name.text;
    if (!Object.hasOwn(catalog, key))
      catalog[key] = revised[key]?.[index] ?? property.initializer.elements[0].text;
    else if (revised[key]) catalog[key] = revised[key][index];
  }
  for (const key of Object.keys(catalog)) if (!keys.includes(key)) delete catalog[key];
  writeFileSync(url, `${JSON.stringify(catalog, null, 2)}\n`);
}

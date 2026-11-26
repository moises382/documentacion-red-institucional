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
  'Documentos PDF': ['PDF-Dokumente', 'PDF 文档', 'Documents PDF'],
  'Elige toda la documentación o una ficha para revisar sus tablas antes de guardarla.': [
    'Wählen Sie die gesamte Dokumentation oder ein Datenblatt und prüfen Sie die Tabellen vor dem Speichern.',
    '选择全部文档或单条记录，在保存前检查表格。',
    'Choisissez toute la documentation ou une fiche et vérifiez les tableaux avant de l’enregistrer.',
  ],
  'Toda la documentación': ['Gesamte Dokumentation', '全部文档', 'Toute la documentation'],
  'Crear PDF completo': ['Vollständiges PDF erstellen', '创建完整 PDF', 'Créer le PDF complet'],
  'Documentación completa de red': [
    'Vollständige Netzwerkdokumentation',
    '完整网络文档',
    'Documentation réseau complète',
  ],
  'Resumen general': ['Gesamtübersicht', '总体摘要', 'Vue d’ensemble'],
  Indicador: ['Kennzahl', '指标', 'Indicateur'],
  'Total o valor': ['Summe oder Wert', '总数或数值', 'Total ou valeur'],
  Alcance: ['Geltungsbereich', '范围', 'Périmètre'],
  'Registros documentados': ['Dokumentierte Datensätze', '已记录项目', 'Fiches documentées'],
  'Registros de inventario': ['Inventareinträge', '资产清单记录', 'Fiches d’inventaire'],
  'Computadoras y laptops': [
    'Computer und Laptops',
    '台式机和笔记本电脑',
    'Ordinateurs et portables',
  ],
  'Direcciones IP documentadas': [
    'Dokumentierte IP-Adressen',
    '已记录 IP 地址',
    'Adresses IP documentées',
  ],
  'Fichas de dirección IP': ['IP-Adressdatensätze', 'IP 地址记录', 'Fiches d’adresse IP'],
  'Pendientes documentados': [
    'Dokumentierte offene Punkte',
    '已记录待办事项',
    'Points en attente documentés',
  ],
  'Cambios en el historial': [
    'Änderungen im Verlauf',
    '历史变更',
    'Modifications dans l’historique',
  ],
  'Subred seleccionada': ['Ausgewähltes Subnetz', '所选子网', 'Sous-réseau sélectionné'],
  'Subredes documentadas': ['Dokumentierte Subnetze', '已记录子网', 'Sous-réseaux documentés'],
  'Subred actual': ['Aktuelles Subnetz', '当前子网', 'Sous-réseau actuel'],
  'Estado del plan': ['Planstatus', '规划状态', 'État du plan'],
  'No hay una subred documentada para este alcance.': [
    'Für diesen Geltungsbereich ist kein Subnetz dokumentiert.',
    '此范围内没有已记录的子网。',
    'Aucun sous-réseau n’est documenté pour ce périmètre.',
  ],
  'Índice de registros': ['Datensatzverzeichnis', '记录索引', 'Index des fiches'],
  'Fichas completas': ['Vollständige Datenblätter', '完整记录', 'Fiches complètes'],
  Acción: ['Aktion', '操作', 'Action'],
  Registro: ['Datensatz', '记录', 'Fiche'],
  'Sin cambios registrados.': [
    'Keine Änderungen erfasst.',
    '没有记录的变更。',
    'Aucune modification enregistrée.',
  ],
  'Documento generado desde los registros del proyecto. Sin credenciales de la bóveda.': [
    'Dokument aus den Projektdatensätzen erstellt. Ohne Tresor-Zugangsdaten.',
    '此文档根据项目记录生成，不含保险库凭据。',
    'Document généré à partir des fiches du projet, sans identifiants du coffre.',
  ],
  'Nombre del registro': ['Datensatzname', '记录名称', 'Nom de la fiche'],
  'Tipo de registro': ['Datensatztyp', '记录类型', 'Type de fiche'],
  Verificación: ['Überprüfung', '验证状态', 'Vérification'],
  'Control y seguimiento': ['Kontrolle und Nachverfolgung', '管理与跟踪', 'Contrôle et suivi'],
  Campo: ['Feld', '字段', 'Champ'],
  Información: ['Information', '信息', 'Information'],
  'DOCUMENTACIÓN DE RED': ['NETZWERKDOKUMENTATION', '网络文档', 'DOCUMENTATION RÉSEAU'],
  'Elige cualquier registro para revisar su ficha en tabla antes de guardarla.': [
    'Datensatz wählen und die Tabelle vor dem Speichern prüfen.',
    '选择任意记录，保存前先查看表格。',
    'Choisissez une fiche et vérifiez son tableau avant de l’enregistrer.',
  ],
  'VISTA PREVIA DEL DOCUMENTO': ['DOKUMENTVORSCHAU', '文档预览', 'APERÇU DU DOCUMENT'],
  'Ficha en tabla': ['Tabellarisches Datenblatt', '表格记录', 'Fiche en tableau'],
  'Revisa la información. El archivo solo se guarda cuando tú lo elijas.': [
    'Prüfen Sie die Angaben. Die Datei wird nur auf Ihren Wunsch gespeichert.',
    '请检查信息。只有您选择保存时才会保存文件。',
    'Vérifiez les informations. Le fichier est enregistré seulement si vous le choisissez.',
  ],
  'Ficha técnica generada desde el inventario. Sin credenciales de la bóveda.': [
    'Technisches Datenblatt aus dem Inventar. Ohne Tresor-Zugangsdaten.',
    '从资产清单生成的技术表单。不含保险库凭据。',
    'Fiche technique issue de l’inventaire. Sans identifiants du coffre.',
  ],
  'En el diálogo del navegador, elige Guardar como PDF y la carpeta de destino.': [
    'Wählen Sie im Browserdialog „Als PDF speichern“ und den Zielordner.',
    '在浏览器对话框中选择“另存为 PDF”和保存文件夹。',
    'Dans la boîte de dialogue du navigateur, choisissez Enregistrer au format PDF et le dossier.',
  ],
  'Guardar como PDF o imprimir': [
    'Als PDF speichern oder drucken',
    '另存为 PDF 或打印',
    'Enregistrer en PDF ou imprimer',
  ],
  'Eliminar registro': ['Datensatz löschen', '删除记录', 'Supprimer la fiche'],
  'Registro eliminado': ['Datensatz gelöscht', '记录已删除', 'Fiche supprimée'],
  'Desvincular teléfono': ['Telefon trennen', '解除电话关联', 'Dissocier le téléphone'],
  Desvincular: ['Trennen', '解除关联', 'Dissocier'],
  'La ficha se eliminará. Si aparece en el diagrama, también desaparecerá de allí. Esta acción no se puede deshacer desde la aplicación.':
    [
      'Der Datensatz wird gelöscht. Falls er im Diagramm erscheint, verschwindet er auch dort. Diese Aktion kann in der App nicht rückgängig gemacht werden.',
      '此记录将被删除。如果它出现在图表中，也会从图表中消失。此操作无法在应用中撤销。',
      'La fiche sera supprimée. Si elle apparaît dans le schéma, elle en disparaîtra aussi. Cette action est irréversible dans l’application.',
    ],
  'Se quitará la línea entre el teléfono y la central. El teléfono seguirá en el inventario.': [
    'Die Verbindung zwischen Telefon und Telefonanlage wird entfernt. Das Telefon bleibt im Inventar.',
    '电话与电话交换机之间的连线将被移除。电话仍保留在清单中。',
    'La ligne entre le téléphone et le standard sera retirée. Le téléphone restera dans l’inventaire.',
  ],
  'Otros registros vinculados no se eliminan automáticamente.': [
    'Andere verknüpfte Datensätze werden nicht automatisch gelöscht.',
    '其他关联记录不会自动删除。',
    'Les autres fiches liées ne sont pas supprimées automatiquement.',
  ],
  'Conexión telefónica retirada': [
    'Telefonverbindung entfernt',
    '电话连接已移除',
    'Connexion téléphonique retirée',
  ],
  'elementos sin conexión documentada': [
    'Elemente ohne dokumentierte Verbindung',
    '个项目没有记录连接',
    'éléments sans connexion documentée',
  ],
  'elemento sin conexión documentada': [
    'Element ohne dokumentierte Verbindung',
    '个项目没有记录连接',
    'élément sans connexion documentée',
  ],
  'Las líneas solo aparecen cuando registras una conexión. Para unir un AP o una computadora, documenta el switch y el puerto con el equipo conectado.':
    [
      'Linien erscheinen nur für dokumentierte Verbindungen. Um einen Access Point oder Computer zu verbinden, dokumentieren Sie den Switch und den Port mit dem angeschlossenen Gerät.',
      '只有记录了连接后才会显示连线。要连接 AP 或计算机，请记录交换机及其端口和所连接的设备。',
      'Les lignes apparaissent uniquement pour les connexions documentées. Pour relier un point d’accès ou un ordinateur, documentez le switch et son port avec l’appareil connecté.',
    ],
  'Registrar puerto de switch': [
    'Switch-Port dokumentieren',
    '记录交换机端口',
    'Documenter un port de switch',
  ],
  'Agregar switch': ['Switch hinzufügen', '添加交换机', 'Ajouter un switch'],
  'Administrar elementos del diagrama': [
    'Diagrammelemente verwalten',
    '管理图表项目',
    'Gérer les éléments du schéma',
  ],
  'Puedes eliminar una ficha o una conexión registrada. La línea de telefonía se desvincula sin borrar el teléfono.':
    [
      'Sie können einen Datensatz oder eine dokumentierte Verbindung löschen. Die Telefonleitung lässt sich trennen, ohne das Telefon zu löschen.',
      '您可以删除记录或已记录的连接。电话线路可以解除关联，而不删除电话。',
      'Vous pouvez supprimer une fiche ou une connexion documentée. La ligne téléphonique peut être dissociée sans supprimer le téléphone.',
    ],
  'Equipos y elementos': ['Geräte und Elemente', '设备和项目', 'Équipements et éléments'],
  'Conexiones documentadas': [
    'Dokumentierte Verbindungen',
    '已记录的连接',
    'Connexions documentées',
  ],
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

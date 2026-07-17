import { IService, ServiceResult } from './base-service';

export interface PDFExportInput {
  nc: {
    id: string;
    title: string;
    description: string;
    status: string;
    severity: string;
    detected_at: string;
    reporter_name: string;
    qse_manager_name?: string;
    why_1?: string;
    why_2?: string;
    why_3?: string;
    why_4?: string;
    why_5?: string;
    root_cause?: string;
    ishikawa_category?: string;
    effectiveness_proof?: string;
    actions?: Array<{
      title: string;
      description: string;
      assignee_name: string;
      status: string;
      due_date: string;
    }>;
  };
}

export interface PDFExportOutput {
  htmlContent: string;
  filename: string;
}

/**
 * Service de génération de rapport PDF d'audit pour les NC/CAPA (inspiré du pattern Skill).
 * Produit un document HTML/PDF propre et balisé conforme aux exigences ISO.
 */
export class PDFService implements IService<PDFExportInput, PDFExportOutput> {
  readonly name = 'PDFService';

  async execute(input: PDFExportInput): Promise<ServiceResult<PDFExportOutput>> {
    try {
      const { nc } = input;
      const formattedDate = new Date(nc.detected_at).toLocaleDateString('fr-FR');

      // Construction du modèle HTML propre imprimable
      const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche de Non-Conformité - ${nc.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; line-height: 1.4; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; }
    .title { font-size: 20px; font-weight: bold; color: #0f172a; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
    .section-title { font-size: 14px; font-weight: bold; color: #0284c7; text-transform: uppercase; margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .why-list { background: #f1f5f9; padding: 10px 15px; border-radius: 6px; list-style-type: decimal; }
    .action-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .action-table th, .action-table td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 13px; }
    .action-table th { background: #f1f5f9; }
    .badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
    .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">QSE STUDIO — FICHE NON-CONFORMITÉ</div>
      <div>Réf : NC-${nc.id.substring(0, 8)}</div>
    </div>
    <div style="text-align: right;">
      <div>Date : ${formattedDate}</div>
      <div>Statut : <strong>${nc.status.toUpperCase()}</strong></div>
    </div>
  </div>

  <div class="meta-grid">
    <div><strong>Titre :</strong> ${nc.title}</div>
    <div><strong>Gravité :</strong> ${nc.severity.toUpperCase()}</div>
    <div><strong>Déclaré par :</strong> ${nc.reporter_name}</div>
    <div><strong>Responsable QSE :</strong> ${nc.qse_manager_name || 'Non assigné'}</div>
  </div>

  <div class="section-title">1. Description de l'anomalie</div>
  <p>${nc.description}</p>

  <div class="section-title">2. Analyse des causes (5 Pourquoi & Ishikawa)</div>
  <p><strong>Catégorie Ishikawa :</strong> ${nc.ishikawa_category || 'Non définie'}</p>
  <ol class="why-list">
    ${nc.why_1 ? `<li>${nc.why_1}</li>` : ''}
    ${nc.why_2 ? `<li>${nc.why_2}</li>` : ''}
    ${nc.why_3 ? `<li>${nc.why_3}</li>` : ''}
    ${nc.why_4 ? `<li>${nc.why_4}</li>` : ''}
    ${nc.why_5 ? `<li>${nc.why_5}</li>` : ''}
  </ol>
  <p><strong>Cause racine identifiée :</strong> ${nc.root_cause || 'En cours d\'analyse'}</p>

  <div class="section-title">3. Plan d'Actions Correctives & Préventives (CAPA)</div>
  <table class="action-table">
    <thead>
      <tr>
        <th>Action</th>
        <th>Responsable</th>
        <th>Échéance</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>
      ${(nc.actions || []).map(a => `
        <tr>
          <td><strong>${a.title}</strong><br/>${a.description}</td>
          <td>${a.assignee_name}</td>
          <td>${new Date(a.due_date).toLocaleDateString('fr-FR')}</td>
          <td>${a.status.toUpperCase()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${nc.effectiveness_proof ? `
    <div class="section-title">4. Preuve d'efficacité</div>
    <p>${nc.effectiveness_proof}</p>
  ` : ''}

  <div class="footer">
    Document généré automatiquement par QSE Studio — Traçabilité et conformité ISO 9001 / 14001 / 45001.
  </div>
</body>
</html>
      `;

      return {
        success: true,
        data: {
          htmlContent: html,
          filename: `NC-${nc.id.substring(0, 8)}.html`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }
}

export const pdfService = new PDFService();

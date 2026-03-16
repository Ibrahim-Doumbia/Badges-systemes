/**
 * Utilitaire de réponses HTTP standardisées.
 * Toutes les réponses de l'API suivent le même format JSON.
 */

/**
 * Réponse de succès
 * @param {Response} res - Objet réponse Express
 * @param {any} data - Données à retourner
 * @param {string} message - Message de succès
 * @param {number} statusCode - Code HTTP (défaut 200)
 */
const success = (res, data = null, message = "Succès", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Réponse de succès paginée
 * @param {Response} res - Objet réponse Express
 * @param {Array} rows - Tableau de données
 * @param {number} count - Nombre total d'éléments
 * @param {object} pagination - Infos de pagination { page, limit }
 * @param {string} message - Message
 */
const paginated = (res, rows, count, pagination, message = "Succès") => {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(count / limit);

  return res.status(200).json({
    success: true,
    message,
    data: rows,
    meta: {
      total: count,
      totalPages,
      currentPage: page,
      perPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

/**
 * Réponse d'erreur
 * @param {Response} res - Objet réponse Express
 * @param {string} message - Message d'erreur
 * @param {number} statusCode - Code HTTP (défaut 400)
 * @param {any} errors - Détails des erreurs de validation (optionnel)
 */
const error = (res, message = "Une erreur est survenue", statusCode = 400, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, paginated, error };

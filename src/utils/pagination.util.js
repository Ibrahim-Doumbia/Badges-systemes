/**
 * Utilitaire de pagination.
 * Extrait les paramètres page/limit de la query string
 * et retourne les options Sequelize correspondantes.
 */

/**
 * Calcule les options de pagination Sequelize depuis req.query
 * @param {object} query - req.query d'Express
 * @param {number} defaultLimit - Limite par défaut (20)
 * @returns {{ limit, offset, page }}
 */
const getPagination = (query, defaultLimit = 20) => {
  // Valeurs reçues dans la query string (?page=2&limit=10)
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  // Valeurs par défaut et contraintes
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > 100) limit = 100; // Sécurité : max 100 éléments par page

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

module.exports = { getPagination };

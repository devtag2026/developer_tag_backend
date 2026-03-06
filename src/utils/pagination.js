/**
 * pagination.js
 *
 * Reusable pagination utility used across all paginated controllers.
 *
 * Usage:
 *   const { page, limit, skip, getPaginationMeta } = paginate(req.query);
 *   const [items, total] = await Promise.all([Model.find().skip(skip).limit(limit), Model.countDocuments()]);
 *   return res.status(200).json(new ApiResponse(200, { items, pagination: getPaginationMeta(total) }, "..."));
 */

/**
 * Parses page and limit from query params, returns skip and a meta builder.
 *
 * @param {object} query        - req.query object
 * @param {number} defaultLimit - default page size (default: 10)
 * @param {number} maxLimit     - maximum allowed page size (default: 100)
 * @returns {{ page, limit, skip, getPaginationMeta }}
 */
export const paginate = (query = {}, defaultLimit = 10, maxLimit = 100) => {
    const page  = Math.max(1, Number(query.page)  || 1);
    const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));
    const skip  = (page - 1) * limit;

    /**
     * Call after getting the total count to build the pagination meta object.
     * @param {number} total - total documents matching the query
     */
    const getPaginationMeta = (total) => {
        const totalPages = Math.ceil(total / limit) || 1;
        return {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    };

    return { page, limit, skip, getPaginationMeta };
};
import { Escalation } from "../../model";
import getPaginatedData from "../../utils/paginationQueries.util";

interface QueryParams {
  page?: number;
  limit?: number;
}

const getAllEscalationService = async (query: QueryParams) => {
  const filters = {};
  try {
    const result = await getPaginatedData({
      model: Escalation,
      filters,
      Page: query.page || 1,
      limit: query.limit || 10,
      includeUser: false,
    });

    return result;
  } catch (error) {
    throw error;
  }
};

export default getAllEscalationService;
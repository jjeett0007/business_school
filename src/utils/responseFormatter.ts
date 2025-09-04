const formatResponse = ({ message, data }: { message?: string; data?: any }) => {
  return {
    ...(message && { message }),
    ...(data && { data })
  };
};

export default formatResponse;

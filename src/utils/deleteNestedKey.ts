const deleteNestedKeys = (obj: any, keys: string[]) => {
  keys.forEach(key => {
    if (typeof key !== "string") {
      console.warn("Invalid key:", key);
      return;
    }

    const parts = key.split(".") || [];
    if (!parts || parts.length === 0) {
      console.warn("Empty or invalid parts for key:", key);
      return;
    }

    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (typeof part === "string" && part in current) {
        current = current[part];
      } else {
        return;
      }
    }
    const lastPart = parts[parts.length - 1];
    if (lastPart !== undefined) {
      delete current[lastPart];
    }
  });
};

export default deleteNestedKeys;

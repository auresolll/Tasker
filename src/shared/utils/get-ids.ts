export const getFieldIds = (entities: any[], field = "_id") => {
  return entities.map((entity) => entity[field]);
};

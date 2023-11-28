export enum ENUM_ROLE_TYPE {
  CUSTOMER = "651a93c59df8ccec8945a68f",
  SELLER = "651a93d79df8ccec8945a690",
  ADMINISTRATION = "651a93e79df8ccec8945a691",
}

export const getAllRoles = () => {
  return Object.values(ENUM_ROLE_TYPE);
};

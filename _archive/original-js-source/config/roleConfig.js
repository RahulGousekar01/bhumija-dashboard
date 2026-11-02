export const USER_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  PARTY: "PARTY",
};

export const roleConfig = {
  [USER_ROLES.SUPER_ADMIN]: {
    label: "Super Admin",

    filters: {
      financialYear: true,
      district: true,
      taluka: true,
      organisation: true,
    },

    scope: "ALL",

    masterData: {
      parties: true,
      trucks: true,
      barges: true,
      locations: true,
      weighbridges: true,
      yards: true,
      processingUnits: true,
      routes: true,
    },
  },

  [USER_ROLES.PARTY]: {
    label: "Party",

    filters: {
      financialYear: true,
      district: true,
      taluka: true,
      organisation: false,
    },

    scope: "OWN",

    masterData: {
      parties: false,
      trucks: true,
      barges: true,
      locations: true,
      weighbridges: false,
      yards: true,
      processingUnits: true,
      routes: true,
    },
  },
};

import type { Schema } from '../../amplify/data/resource';

// Extract Gen 2 type
type User = Schema['User']['type'];

type ComparativeName = string | MUser;

export interface MUser extends User {
  fullName: string;
  baseUser: User;
  displayName(comparativeName: ComparativeName): string;
}

export type GetMUserProps = {
  user: User;
};

export function getMUser({ user }: GetMUserProps): MUser {
  const _fullName = `${user.firstName} ${user.lastName}`;

  return {
    ...user,

    get baseUser() {
      return user;
    },

    get fullName() {
      return _fullName;
    },

    displayName: (comparativeName: ComparativeName): string => {
      const compName: string =
        typeof comparativeName === 'object'
          ? (comparativeName as MUser).fullName
          : comparativeName;

      const compNameParts = compName.split(' ');
      const compFirstName = compNameParts[0];
      const compLastName = compNameParts[1] || '';

      // If first names are different, just use first name
      if (user.firstName !== compFirstName) {
        return user.firstName || '';
      }

      // If full names are identical, use ID to distinguish
      if (_fullName === compName) return `${user.firstName} #${user.id}`;

      const lastName = user.lastName || '';

      // Find the minimum number of last name characters needed to distinguish
      let charsNeeded = 1;
      while (
        charsNeeded <= Math.max(lastName.length, compLastName.length) &&
        lastName.substring(0, charsNeeded) ===
          compLastName.substring(0, charsNeeded)
      ) {
        charsNeeded++;
      }

      // If we've exhausted both last names and they're still equal, use ID
      if (charsNeeded > lastName.length && charsNeeded > compLastName.length) {
        return `${user.firstName} #${user.id}`;
      }

      return `${user.firstName} ${lastName.substring(0, charsNeeded)}.`;
    },
  };
}

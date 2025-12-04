import type { Schema } from '../../amplify/data/resource';

// Extract Gen 2 type
type User = Schema['User']['type'];

type ComparativeName = string | MUser;

export interface MUser extends User {
  fullName: string;
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

      if (user.firstName !== compName.split(' ')[0]) {
        return user.firstName || '';
      }

      if (_fullName === compName) return `${user.firstName} #${user.id}`;

      const compNameArr = compName.split('');

      return _fullName.split('').reduce((nameToShow, char) => {
        if (char !== compNameArr.shift()) return `${nameToShow}${char}.`;

        return nameToShow + char;
      }, '');
    },
  };
}

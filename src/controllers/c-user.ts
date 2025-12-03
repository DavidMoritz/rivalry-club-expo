import { GraphQLQuery } from '@aws-amplify/api';
import { useQuery } from '@tanstack/react-query';
import { API } from 'aws-amplify';

import { GetUserQuery, UsersWithRivalriesByAwsSubQuery } from '../API';
import { usersWithRivalriesByAwsSub } from '../graphql/custom-queries';
import { MRivalry } from '../models/m-rivalry';

// const UPDATE_RIVALRY_KEYS = ['id', 'contestCount', 'currentContestId'];

interface UserDataQueryProps {
  rivalries: MRivalry[];
}

interface UserWithRivalriesByAwsSubProps {
  amplifyUser: { username?: string };
}

/** Queries */

export const useUserWithRivalriesByAwsSubQuery = ({
  amplifyUser,
}: UserWithRivalriesByAwsSubProps) =>
  useQuery({
    queryKey: ['usersByAwsSub', amplifyUser?.username],
    queryFn: async () => {
      if (!amplifyUser?.username) return { data: null, isLoading: true };

      return await API.graphql<GraphQLQuery<UsersWithRivalriesByAwsSubQuery>>({
        query: usersWithRivalriesByAwsSub,
        variables: { awsSub: amplifyUser?.username },
      });
    },
  });

export const useUserDataQuery = ({ rivalries }: UserDataQueryProps) => {
  function buildGetMultipleUsersQuery(userIds: string[]): string {
    function getOneUserQuerySegment(userId: string, currentIndex: number) {
      return /* GraphQL */ `
        user${currentIndex}: getUser(id: "${userId}") {
          id
          email
          firstName
          lastName
          role
          awsSub
          createdAt
          updatedAt
          deletedAt
        }
      `;
    }

    const getMultipleUsersQueryString = userIds.reduce(
      (queryString, userId, idx) =>
        `${queryString} ${getOneUserQuerySegment(userId, idx)}`,
      '',
    );

    return getMultipleUsersQueryString;
  }

  const uniqueUserIds: string[] = [
    ...new Set(
      rivalries.map(({ userAId, userBId }) => [userAId, userBId]).flat(),
    ),
  ].filter(Boolean);

  const getMultipleUsers = /* GraphQL */ `
    query GetMultipleUsers {
      ${buildGetMultipleUsersQuery(uniqueUserIds)}
    }
  `;

  return useQuery({
    queryKey: ['getUsersNames', uniqueUserIds],
    queryFn: async () => {
      if (!uniqueUserIds.length) return { data: null, isLoading: true };

      return await API.graphql<GraphQLQuery<GetUserQuery>>({
        query: getMultipleUsers,
      });
    },
  });
};

/** Mutations */

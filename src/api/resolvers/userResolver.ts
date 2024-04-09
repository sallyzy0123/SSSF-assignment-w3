// TODO: Add resolvers for user
// 1. Queries
// 1.1. users ✅
// 1.2. userById ✅
// 2. Mutations
// 2.1. createUser ✅
// 2.2. updateUser ✅
// 2.3. deleteUser ✅

import {Cat} from '../../interfaces/Cat';
import {User} from '../../interfaces/User';
import userModel from '../models/userModel';
import {GraphQLError} from 'graphql';

export default {
    Cat: {
        owner: async (parent: Cat): Promise<User> => {
          const user = await userModel.findById(parent.owner);
          if (!user) {
            throw new Error('Owner not found');
          }
          return user;
        },
      },
    Query: {
        users: async (): Promise<User[]> => {
            return await userModel.find();
        },
        userById: async (_parent: undefined, args: {id: string}): Promise<User> => {
            const user = await userModel.findById(args.id);
            if (!user) {
                throw new GraphQLError('User not found', {
                    extensions: {code: '404'}
                });
            }
            return user;
        },
    },
    Mutation: {
        createUser: async (
            _parent: undefined,
            args: {user_name: string; email: string}
        ): Promise<{id: string; user_name: string; email: string} | {message: string}> => {
            try {
                const user = await userModel.create(args);
                if (!user) {
                    return {message: 'User not added'};
                }
                const { _id, user_name, email } = user;
                return { id: _id.toString(), user_name, email };
            } catch (error) {
                throw new GraphQLError((error as Error).message, {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                        http: {status: 400},
                    }
                });
            }
        },
        updateUser: async (
            _parent: undefined,
            args: {id: string; user_name: string}
        ): Promise<{id: string; user_name: string; email: string} | {message: string}> => {
            const user = await userModel.findByIdAndUpdate(args.id, args, {
                new: true,
            });
            if (!user) {
                return {message: 'User not updated'};   
            }
            const { _id, user_name, email } = user;
            return {id: _id.toString(), user_name, email};
        },
        deleteUser: async (
            _parent: undefined,
            args: {id: string},
        ): Promise<{id: string; user_name: string; email: string} | {message: string}> => {
            const user = await userModel.findByIdAndDelete(args.id);
            if (!user) {
                return {message: 'User not deleted'};
                
            }
            const { _id, user_name, email } = user;
            return {id: _id.toString(), user_name, email};
        },
    }
}
// TODO: Add resolvers for cat
// 1. Queries
// 1.1. cats ✅
// 1.2. catById ✅
// 1.3. catsByOwner
// 1.4. catsByArea
// 2. Mutations
// 2.1. createCat ✅
// 2.2. updateCat ✅
// 2.3. deleteCat ✅
import {Cat} from '../../interfaces/Cat';
import catModel from '../models/catModel';
import {GraphQLError} from 'graphql';
import UserResolver from './userResolver';
import {User} from '../../interfaces/User';
import {coordinates} from '../../interfaces/Location';

export default {
    Query: {
        cats: async () => {
            const cats = await catModel.find();
            console.log('cats', cats);
            return cats;
        },
        catById: async (_parent: undefined, args: {id: string}): Promise<Cat> => {
            const cat = await catModel.findById(args.id);
            if (!cat) {
                throw new GraphQLError('Cat not found', {
                    extensions: {code: '404'}
                });
            }
            return cat;
        },
        catsByOwner: async (
            _parent: undefined, 
            args: {ownerId: string}
            ) => {
            const cats = await catModel.find({owner: args.ownerId})
                .populate('owner')
                .exec();
            if (cats.length === 0) {
                return {message: 'No cat belongs to this owner'};
            }
            return cats;
        },
        catsByArea: async (
            _parent: undefined,
            args: {
                topRight: coordinates,
                bottomLeft:  coordinates
            }
        ): Promise<{
            cat_name: string; 
            location: {
                type: string; 
                coordinates: number[]
            }
        }[] | {message: string}> => {
            const rightCorner = [args.topRight.lat, args.topRight.lng];
            const leftCorner = [args.bottomLeft.lat, args.bottomLeft.lng];

            const cats = await catModel.find({
                location: {
                    $geoWithin: {
                        $box: [leftCorner, rightCorner]
                    }
                }
            }).populate('owner').exec();
            if (cats.length === 0) {
                return {message: 'No cat found in this area'};
            }
            return cats;
        },
    },
    Mutation: {
        createCat: async (
            _parent: undefined,
            args: {
                cat_name: string; 
                weight: number; 
                owner: string; 
                filename: string; 
                birthdate: Date; 
                location: {
                    type: string; 
                    coordinates: number[]
                }
            }
        ) => {
            try {
                const cat = await catModel.create(args);
                if (!cat) {
                    return {message: 'Cat not added'};
                }
                console.log('cat', cat);
                return cat;
            } catch (error) {
                throw new GraphQLError((error as Error).message, {
                    extensions: {
                      code: 'BAD_USER_INPUT',
                      http: {status: 400},
                    }
                  });
            }
        },
        updateCat: async (
            _parent: undefined,
            args: {id: string; cat_name: string; weight: number; birthdate: Date}
        ) => {
            const cat = await catModel.findByIdAndUpdate(args.id, args, {new: true}).populate('owner').exec();
            if (!cat) {
                return {message: 'Cat not updated'};
            }
            return cat;
        },
        deleteCat: async (
            _parent: undefined,
            args: {id: string}
        ) => {
            const cat = await catModel.findByIdAndDelete(args.id).populate('owner').exec();
            if (!cat) {
                return {message: 'Cat not deleted'};
            }
            return cat;
        },
    }
}
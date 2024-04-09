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

export default {
    Query: {
        cats: async (): Promise<Cat[]> => {
            const cats = await catModel.find().populate('owner').exec();
            
            console.log('cats: ', cats);
            return cats;
        },
        catById: async (_parent: undefined, args: {id: string}): Promise<Cat> => {
            const cat = await catModel.findById(args.id).populate('owner').exec();
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
            ): Promise<{
                id: string; 
                cat_name: string; 
                weight: number; 
                birthdate: Date; 
                owner: {
                    id: string;
                    user_name: string;
                    email: string;
                }; 
                location: {
                    type: string; 
                    coordinates: number[]
                }; 
                filename: string;
            }[] | {message: string}> => {
            const cats = await catModel.find({owner: args.ownerId})
                .populate('owner')
                .exec();
            if (cats.length === 0) {
                return {message: 'No cat belongs to this owner'};
            }
            return cats.map(cat => ({
                id: cat._id.toString(),
                cat_name: cat.cat_name,
                weight: cat.weight,
                birthdate: cat.birthdate,
                owner: {
                    id: cat.owner._id.toString(),
                    user_name: (cat.owner as any).user_name,
                    email: (cat.owner as any).email,
                },
                location: cat.location,
                filename: cat.filename
            }));
        },
        catsByArea: async (
            _parent: undefined,
            args: {
                topRight: { latitude: number; longitude: number };
                bottomLeft:  { latitude: number; longitude: number };
            }
        ): Promise<{
            cat_name: string; 
            location: {
                type: string; 
                coordinates: number[]
            }
        }[] | {message: string}> => {
            const cats = await catModel.find({
                location: {
                    $geoWithin: {
                        $box: [
                            [args.topRight.latitude, args.topRight.longitude],
                            [args.bottomLeft.latitude, args.bottomLeft.longitude]
                        ]
                    }
                }
            });
            console.log('cats', cats);
            if (cats.length === 0) {
                return {message: 'No cat found in this area'};
            }
            // console.log(cats);
            return cats.map(cat => ({
                cat_name: cat.cat_name,
                location: cat.location
            }));
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
        ): Promise<{
            id: string; 
            cat_name: string; 
            weight: number; 
            birthdate: Date; 
            owner: {
                user_name: string
            }; 
            location: {
                type: string; 
                coordinates: number[]
            }; 
            filename: string
        } | {message: string}> => {
            try {
                const cat = await catModel.create(args);
                if (!cat) {
                    return {message: 'Cat not added'};
                }
                const ownerDetails = await UserResolver.Query.userById(undefined, {id: args.owner});
                if (!ownerDetails) {
                    return {message: 'Owner not found'};
                }
                const { _id, cat_name, weight, birthdate, location, filename } = cat;
                const owner = { user_name: ownerDetails.user_name };
                return { id: _id.toString(), cat_name, weight, birthdate, owner, location, filename };
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
        ): Promise<{
            birthdate: Date; 
            cat_name: string; 
            weight: number
        } | {message: string}> => {
            const cat = await catModel.findByIdAndUpdate(args.id, args, {new: true});
            if (!cat) {
                return {message: 'Cat not updated'};
            }
            const { cat_name, weight, birthdate } = cat;
            return { cat_name, weight, birthdate };
        },
        deleteCat: async (
            _parent: undefined,
            args: {id: string}
        ): Promise<{id: string} | {message: string}> => {
            const cat = await catModel.findByIdAndDelete(args.id);
            if (!cat) {
                return {message: 'Cat not deleted'};
            }
            const { _id } = cat;
            return { id: _id.toString() };
        },
    }
}
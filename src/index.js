const { ApolloServer, gql, } = require('apollo-server')
const { PubSub } = require('graphql-subscriptions');

//* Query - > Read queries 
//*Mutation - > Create, Update, Delete queries


const typeDefs = gql`

type Query{
    exampleQuery(name:String!):String!,
    user:User!
}

type Mutation{
    register(userInfo:UserInfo!,age:Int):RegisterResponse!
    login(userInfo:UserInfo):LoginResponse!
}

#Subscriptions are used to add real time functionality to API.
#definde the subscription/real time events inside
type Subscription{
    newUser:User!
}
#argument object , used inside type Mutation above
input UserInfo{
    userName:String!,
    password:String!,
    id:ID
    
}

#Different Object types
type LoginResponse{
    errors:[Error]!,
    loginStatus:Boolean!,
    user:User,
    someFieldInsideLoginRes:String
}

type RegisterResponse{
    errors:[Error]!,
    user:User
}

type Error{
    field:String
    message:String
}

type User{
    id: ID!,
    userName:String,
    password:String,
    firstLetterOfUsername:String
}

`
/* 
*  Writing Custom resolvers
* Inside 'resolvers' object we write resolve functions for  different fields of different types in 'typeDefs' object. 
*  When the mutation 'register' is being resolved inside resolvers object, it also returns a 'user' field  of type 'User'. 
*  Since 'firstLetterOfUsername' is a field in type 'User' it will also get resolved, and  the value of 'parent' argument inside 
* 'firstLetterOfUsername's resolver is the complete response of the field 'user' in return value of 'register' mutation 
* 'firstLetterOfUsername' will only be resolved when client req has this field mentioned in req object. 
" 
*/
const NEW_USER = 'NEW_USER'

const resolvers = {
    LoginResponse: {
        someFieldInsideLoginRes: (parent) => {
            console.log(parent)
            return `this is the userName field accessed using parent argument::: ${parent.user.userName}`
        }
    },

    User: {
        firstLetterOfUsername: (parent) => {
            console.log(parent)
            return parent.userName ? parent.userName[0] : null
        }
    },
    Query: {
        exampleQuery: (parent, { name }) => `Hello ${name}!`,
        user: () => ({
            id: 6,
            userName: "Nishant",

        })
    },
    Mutation: {
        register: (_, { userInfo: { id, userName } }, { pubsub }) => {
            //use the NEW_USER key to subscribe inside register resolver
            const user = {
                id: 7,
                userName: userName
            }
            pubsub.publish(NEW_USER, {
                newUser: user
            })


            return {
                errors: [{ field: 'userName', message: 'bad' }, { field: null, message: null }],
                user: {
                    id: id,
                    userName: "Nishant",
                    password: '7890'
                }
            }
        },
        login: async (parent, { userInfo: { userName, password } }, context, info) => {
            // context.res.cookie("d")
            // await checkLoginPass() or any db/API related async task
            // resolver doesnt care what do you use , it can be any db mongo, sql, api call
            // console.log(context)
            console.log(parent)
            return {
                errors: [{ field: 'userName', message: 'bad' }, null],
                user: { userName: userName, password: password },
                loginStatus: true,
            }

        }
    },
    Subscription: {
        newUser: {
            subscribe: (_, __, context) =>


                context.pubsub.asyncIterator(NEW_USER) //* this is an event NEW_USER is a key

        }
    }
}

const pubsub = new PubSub();

const server = new ApolloServer({ typeDefs, resolvers, context: ({ req, res }) => ({ req, res, pubsub }) });


server.listen().then(({ url }) => { console.log(`server started at ${url}`) })